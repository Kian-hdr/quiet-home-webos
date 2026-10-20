/** TV-approved SSAP, over the TV's loopback interface only. No root service or LAN host dependency.
 * Pairing key is provisioned via LG launch parameters; never bundled in source or exported preferences. */
const KEY = 'quiet-home-local-catalog-key';
const CACHE = 'quiet-home-app-cache-v1';
interface LaunchPoint {id:string; title:string; icon?:string; largeIcon?:string; iconColor?:string; systemApp?:boolean;}
let socket: WebSocket | null = null;
let pending: Promise<LaunchPoint[]> | null = null;

export function acceptCatalogProvisioning(): void {
 try {
  const params = JSON.parse(window.PalmSystem && window.PalmSystem.launchParams || '{}');
  if (typeof params.catalogKey === 'string' && /^[a-zA-Z0-9-]{16,128}$/.test(params.catalogKey)) localStorage.setItem(KEY,params.catalogKey);
 } catch { /* no provisioning on normal launches */ }
}
export function readCachedLaunchPoints(): LaunchPoint[] {
 try {return JSON.parse(localStorage.getItem(CACHE) || '[]');} catch {return [];}
}
export function readLiveLaunchPoints(): Promise<LaunchPoint[]> {
 acceptCatalogProvisioning();
 if (pending) return pending;
 let key:string|null=null;
 try { key=localStorage.getItem(KEY); } catch { /* storage is optional */ }
 if (!key) return Promise.reject(new Error('Local app discovery has not been provisioned'));
 pending = new Promise((resolve,reject) => {
  if (socket) socket.close();
  const ws = new WebSocket('ws://127.0.0.1:3000');socket=ws;
  let settled=false;
  const finish=(error?:Error,apps?:LaunchPoint[])=>{
   if(settled)return;settled=true;clearTimeout(timer);
   if(error){ws.close();reject(error);}else{
    try {localStorage.setItem(CACHE,JSON.stringify(apps));}catch{/* keep discovery working */}
    resolve(apps || []);
   }
  };
  const timer=window.setTimeout(()=>finish(new Error('Local app discovery timed out')),7000);
  ws.onopen=()=>ws.send(JSON.stringify({type:'register',id:'register',payload:{'client-key':key,pairingType:'PROMPT',forcePairing:false,manifest:{manifestVersion:1,appVersion:'1.0',permissions:['READ_INSTALLED_APPS']}}}));
  ws.onerror=()=>finish(new Error('Local app discovery is unavailable'));
  ws.onclose=()=>{if(!settled)finish(new Error('Local app discovery closed'));};
  ws.onmessage=event=>{
   let message:any;try{message=JSON.parse(event.data);}catch{return;}
   if(message.type==='registered')ws.send(JSON.stringify({type:'request',id:'apps',uri:'ssap://com.webos.applicationManager/listLaunchPoints',payload:{}}));
   else if(message.id==='apps' && message.payload && Array.isArray(message.payload.launchPoints))finish(undefined,message.payload.launchPoints);
   else if(message.type==='error'||(message.id==='register'&&message.type==='response'))finish(new Error('App discovery authorization needs renewal'));
  };
 });
 return pending.then(apps=>{pending=null;return apps;},error=>{pending=null;throw error;});
}
export function closeLiveCatalog():void {if(socket){socket.close();socket=null;}}
