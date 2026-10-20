import {PREVIEW_APPS} from '../config/preview';
import {APP_CATALOG} from '../config/catalog';
import {ORIGINAL_ARTWORK} from '../config/artwork';
import {APP_ID} from '../config/constants';
import {isWebOS} from './luna';
import {appExists} from './launch';
import {readLiveLaunchPoints,readCachedLaunchPoints} from './liveCatalog';
export interface AppEntry {id:string;title:string;iconUrl?:string;color?:string;nativeIcon?:boolean;}
export interface AppList {apps:AppEntry[];source:'live'|'cache'|'catalog';}
function nativeApps(points:ReturnType<typeof readCachedLaunchPoints>):AppEntry[]{
 return points.filter(a=>a.id!==APP_ID).map(a=>({id:a.id,title:a.title,iconUrl:ORIGINAL_ARTWORK[a.id]?'icons/apps/'+ORIGINAL_ARTWORK[a.id]:a.largeIcon||a.icon,color:a.iconColor,nativeIcon:!ORIGINAL_ARTWORK[a.id]}));
}
export async function listApps(_useHomebrew:boolean):Promise<AppList>{
 const entries=APP_CATALOG.map(a=>({id:a.id,title:a.title,iconUrl:ORIGINAL_ARTWORK[a.id]?'icons/apps/'+ORIGINAL_ARTWORK[a.id]:a.icon?'icons/apps/'+a.icon:undefined,color:a.color}));
 if(!isWebOS())return {apps:PREVIEW_APPS.map(a=>({...a,iconUrl:ORIGINAL_ARTWORK[a.id]?'icons/apps/'+ORIGINAL_ARTWORK[a.id]:undefined})),source:'catalog'};
 try{return {apps:nativeApps(await readLiveLaunchPoints()),source:'live'};}
 catch{
  const cached=readCachedLaunchPoints();
  if(cached.length)return {apps:nativeApps(cached),source:'cache'};
  const present=await Promise.all(entries.map(a=>appExists(a.id)));
  return {apps:entries.filter((_,i)=>present[i]),source:'catalog'};
 }
}
