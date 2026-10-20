'use strict';
// Node 8, official webos-service lifecycle and normal TV-approved SSAP only.
var Service=require('webos-service'),fs=require('fs'),path=require('path'),WebSocket=require('ws');
var REGISTRATION=require('./sdk-registration.json');
var service=new Service('org.quiethome.launcher.service');
var NAME='org.quiethome.launcher.home-watch-v1',CONFIG=path.join(__dirname,'bridge.private.json');
var config={enabled:false},anchor=null,socket=null,retry=null,activityCall=null,allowUntil=0,lastHome=0,launchTimer=null,preparing=false,prepareWaiters=[],heartbeat=null,retryDelay=500;
var bootId=null;try{bootId=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();}catch(e){}
var status={started:Date.now(),resumeCount:0,connected:false,lastForeground:null,powerState:null,redirects:0,activity:null,lastError:null};
try{config=JSON.parse(fs.readFileSync(CONFIG,'utf8'));}catch(e){}
function persist(){var temporary=CONFIG+'.pending';fs.writeFileSync(temporary,JSON.stringify(config),{mode:384});fs.chmodSync(temporary,384);fs.renameSync(temporary,CONFIG);}
function safeStatus(){return Object.assign({returnValue:true,node:process.version,uid:process.getuid(),cwd:__dirname,enabled:!!config.enabled,hasKey:!!config.key,anchor:!!anchor},status);}
function launch(){
 status.lastLaunchRequestedAt=Date.now();
 service.call('luna://com.webos.applicationManager/launch',{id:'org.quiethome.launcher'},function(reply){var result=reply.payload||reply;status.lastLaunchReply=result;if(result.returnValue!==true){status.lastError='Public application launch was not permitted';config.enabled=false;persist();}});
 status.redirects++;
}
function considerHome(newHomeEvent){
 if(!config.enabled||status.lastForeground!=='com.webos.app.home'||status.powerState!=='Active'||Date.now()<=allowUntil)return;
 var now=Date.now();
 if(newHomeEvent){lastHome=now;status.lastHomeSeenAt=now;}
 clearTimeout(launchTimer);launchTimer=setTimeout(function(){if(config.enabled&&status.powerState==='Active'&&Date.now()>allowUntil&&status.lastForeground==='com.webos.app.home')launch();},0);
}
function handleWake(){
 if(!config.enabled||status.powerState!=='Active')return;
 var cold=!!bootId&&!!config.bootId&&config.bootId!==bootId;
 if(!config.resumePending&&!cold)return;
 config.resumePending=false;if(bootId)config.bootId=bootId;
 try{persist();}catch(e){status.persistenceWarning='Wake state was not saved';}
 status.lastWakeLaunchAt=Date.now();status.lastHomeSeenAt=null;launch();
}
function connect(){
 if(!config.enabled||!config.key||socket)return;
 status.lastForeground=null;status.powerState=null;
 socket=new WebSocket('ws://127.0.0.1:3000',{handshakeTimeout:6000});
 socket.on('open',function(){var payload=JSON.parse(JSON.stringify(REGISTRATION));payload['client-key']=config.key;socket.send(JSON.stringify({type:'register',id:'register',payload:payload}));});
 socket.on('message',function(data){var m;try{m=JSON.parse(String(data));}catch(e){return;}
  if(m.type==='registered'){status.connected=true;retryDelay=500;clearInterval(heartbeat);heartbeat=setInterval(function(){if(socket&&socket.readyState===WebSocket.OPEN){socket.ping();status.lastPingAt=Date.now();}},5000);socket.send(JSON.stringify({type:'subscribe',id:'power',uri:'ssap://com.webos.service.tvpower/power/getPowerState',payload:{}}));socket.send(JSON.stringify({type:'subscribe',id:'foreground',uri:'ssap://com.webos.applicationManager/getForegroundAppInfo',payload:{}}));}
  else if(m.id==='power'&&m.payload&&m.payload.state){var previousPower=status.powerState;status.powerState=m.payload.state;
   if(['Power Off','Suspend','Active Standby'].indexOf(status.powerState)!==-1){config.resumePending=true;status.lastForeground=null;try{persist();}catch(e){status.persistenceWarning='Sleep state was not saved';}}
   if(status.powerState==='Active'&&previousPower!=='Active'){handleWake();considerHome(false);}else if(status.powerState!=='Active')clearTimeout(launchTimer);
  }
  else if(m.id==='foreground'&&m.payload&&m.payload.appId){var changed=status.lastForeground!==m.payload.appId;status.lastForeground=m.payload.appId;if(changed&&m.payload.appId==='org.quiethome.launcher'&&status.lastHomeSeenAt){status.homeHandoffMs=Date.now()-status.lastHomeSeenAt;status.lastReadyAt=Date.now();}if(changed&&m.payload.appId!=='com.webos.app.home')allowUntil=0;if(changed)considerHome(true);}
  else if(m.type==='error'||(m.id==='register'&&m.type==='response')||(m.id&&m.id.indexOf('launch')===0&&m.payload&&m.payload.returnValue===false)){status.lastError='TV authorization or launch requires attention';config.enabled=false;persist();socket.close();}
 });
 socket.on('pong',function(){status.lastPongAt=Date.now();});
 socket.on('error',function(){status.lastError='Local control connection unavailable';});
 socket.on('close',function(){socket=null;clearInterval(heartbeat);status.connected=false;status.disconnectedAt=Date.now();status.lastForeground=null;status.powerState=null;clearTimeout(launchTimer);if(config.enabled){status.retryDelayMs=retryDelay;retry=setTimeout(connect,retryDelay);retryDelay=Math.min(5000,retryDelay*2);}});
}
service.register('probe',function(message){message.respond(safeStatus());});
function prepare(message){
 if(preparing){prepareWaiters.push(message);return;}
 if(anchor){connect();message.respond(safeStatus());return;}
 preparing=true;
 activityCall=service.call('luna://com.palm.activitymanager/create',{activity:{name:NAME,description:'TV-local Quiet Home foreground watcher',type:{background:true,persist:true,explicit:true},callback:{method:'luna://org.quiethome.launcher.service/resume',params:{}}},start:true,subscribe:true,replace:false},function(reply){status.activity=reply.payload||reply;});
 setTimeout(function(){preparing=false;var response=safeStatus();response.returnValue=!!anchor;if(!response.returnValue)response.errorText='Own background activity did not start';message.respond(response);var waiters=prepareWaiters;prepareWaiters=[];waiters.forEach(function(waiter){waiter.respond(response);});},800);
}
service.register('prepare',prepare);
service.register('enable',function(message){
 if(!config.key){message.respond({returnValue:false,errorText:'TV-only Home has not been provisioned yet'});return;}
 try{config.enabled=true;persist();prepare(message);connect();}catch(e){message.respond({returnValue:false,errorText:'Private enabled state could not be saved'});}
});
service.register('resume',function(message){
 // This is the long-running activity's work; respond only when stopped.
 anchor=message;status.resumeCount++;status.resumedAt=Date.now();connect();
});
service.register('configure',function(message){
 var key=message.payload.key;
 if(typeof key!=='string'||!(/^[A-Za-z0-9-]{16,128}$/).test(key)){message.respond({returnValue:false,errorText:'An existing approved key is required'});return;}
 try{config.key=key;config.enabled=true;config.resumePending=false;if(bootId)config.bootId=bootId;persist();prepare(message);connect();}catch(e){message.respond({returnValue:false,errorText:'Private service state is not writable'});}
});
service.register('bypass',function(message){allowUntil=Date.now()+60000;message.respond({returnValue:true,seconds:60});});
service.register('stop',function(message){
 config.enabled=false;var persistenceError=null;try{persist();}catch(e){persistenceError='Private disabled state could not be saved';}
 clearTimeout(retry);clearTimeout(launchTimer);clearInterval(heartbeat);if(socket)socket.close();
 service.call('luna://com.palm.activitymanager/cancel',{activityName:NAME},function(reply){
  var result=reply.payload||reply;status.cancel=result;
  var canceled=result.returnValue===true||result.errorCode===2;
  if(canceled){if(anchor){anchor.respond({returnValue:true,stopped:true});anchor=null;}if(activityCall){activityCall.cancel();activityCall=null;}status.activity=null;}
  var response=safeStatus();response.persistedDisabled=!persistenceError;response.activityCanceled=canceled;
  response.returnValue=!persistenceError&&canceled;
  if(!response.returnValue)response.errorText=persistenceError||'Own persistent activity cancellation was not confirmed';
  message.respond(response);
 });
});
// Restart only this helper process; persistent own activity should recover it.
service.register('restart',function(message){message.respond({returnValue:true,restarting:true});setTimeout(function(){process.exit(0);},150);});
