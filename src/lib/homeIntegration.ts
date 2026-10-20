import {isWebOS,lunaCall,type LunaResponse} from './luna';
const SERVICE='luna://org.quiethome.launcher.service/';
export interface HomeIntegrationState extends LunaResponse {enabled?:boolean;anchor?:boolean;connected?:boolean;}
async function refreshHomeIntegrationOnce():Promise<HomeIntegrationState>{
 if(!isWebOS())return {enabled:false,anchor:false};
 let params:any={};try{params=JSON.parse(window.PalmSystem && window.PalmSystem.launchParams||'{}');}catch{/* normal launch */}
 if(typeof params.homeHelperKey==='string' && typeof params.homeProvisionNonce==='string' && localStorage.getItem('quiet-home-provision-nonce')!==params.homeProvisionNonce){
  const result=await lunaCall<HomeIntegrationState>(SERVICE+'configure',{key:params.homeHelperKey},8000);
  localStorage.setItem('quiet-home-provision-nonce',params.homeProvisionNonce);return result;
 }
 return lunaCall<HomeIntegrationState>(SERVICE+'probe',{},2500);
}
export function setHomeIntegration(enabled:boolean):Promise<HomeIntegrationState>{
 if(!isWebOS())return Promise.reject(new Error('This setting is available on the TV'));
 return lunaCall<HomeIntegrationState>(SERVICE+(enabled?'enable':'stop'),{},7000);
}

let refreshPending:Promise<HomeIntegrationState>|null=null;
export function refreshHomeIntegration():Promise<HomeIntegrationState>{
 if(refreshPending)return refreshPending;
 refreshPending=refreshHomeIntegrationOnce();
 return refreshPending.then(state=>{refreshPending=null;return state;},error=>{refreshPending=null;throw error;});
}
