import {PHOTOS} from '../config/photos';
export interface SpacePhoto {file:string;title:string;credit:string;source:string;imageId:string;}
const CACHE='quiet-home-space-feed-v2';
const QUERIES=['galaxy','nebula','Saturn','stars'];
export function photoLibrary():SpacePhoto[]{
 try {const cached=JSON.parse(localStorage.getItem(CACHE)||'{}');return PHOTOS.concat(Array.isArray(cached.photos)?cached.photos:[]);}catch{return PHOTOS.slice();}
}
/** Public NASA Image Library only; no API key, account, analytics or arbitrary remote feed. */
export async function refreshSpacePhotos():Promise<SpacePhoto[]>{
 try {
  const previous=JSON.parse(localStorage.getItem(CACHE)||'{}');
  if(previous.at && Date.now()-previous.at<6*60*60*1000)return photoLibrary();
  const cycle=Math.floor(Date.now()/(6*60*60*1000));
  const url='https://images-api.nasa.gov/search?media_type=image&center=JPL&year_end=2021&page_size=60&q='+QUERIES[cycle%QUERIES.length]+'&page='+(1+Math.floor(cycle/QUERIES.length)%4);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  let data:any;try{const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('NASA feed unavailable');data=await response.json();}finally{clearTimeout(timer);}
  const photos:SpacePhoto[]=[];
  for(const item of data.collection && data.collection.items || []){
   const meta=item.data && item.data[0];if(!meta||meta.center!=='JPL'||!/^PIA[0-9]+$/.test(meta.nasa_id))continue;
   const credit=meta.secondary_creator||'';
   if(!/^NASA\/JPL(?:-|\/)(?:Caltech|California Institute of Technology)(?:\/(?:SSC|Spitzer))?$/.test(credit)||/copyright|artist|illustration|concept|diagram|annotated|panels|comparison|compilation|magnetic field|spectrum|chart|map\b|inset/i.test(meta.title+' '+meta.description))continue;
   const candidates=(item.links||[]).filter((link:any)=>link.render==='image' && /^https:\/\/images-assets\.nasa\.gov\/image\//.test(link.href) && link.width>=1280 && link.width<=1920 && link.height>=720 && link.width/link.height>=1.3 && link.width/link.height<=2.3 && (!link.size||link.size<2000000)).sort((a:any,b:any)=>b.width-a.width);
   if(!candidates.length)continue;
   photos.push({file:candidates[0].href,title:String(meta.title),credit:String(credit),imageId:String(meta.nasa_id),source:'https://images.nasa.gov/details/'+encodeURIComponent(meta.nasa_id)});
   if(photos.length>=12)break;
  }
  if(photos.length)localStorage.setItem(CACHE,JSON.stringify({at:Date.now(),photos}));
  return photoLibrary();
 }catch{return photoLibrary();}
}
