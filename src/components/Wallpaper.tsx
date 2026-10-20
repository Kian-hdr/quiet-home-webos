import {useEffect,useState,useRef} from 'preact/hooks';
import {PHOTOS} from '../config/photos';
import {photoLibrary,refreshSpacePhotos,type SpacePhoto} from '../lib/spacePhotos';
/** Real NASA observations, offline fallback, two decoded image layers; native OLED policy untouched. */
export function Wallpaper({enabled,active,online}:{enabled:boolean;active:boolean;online:boolean}){
 const initial=PHOTOS[4] || PHOTOS[0]; // Dark Saturn field at first launch.
 const [layers,setLayers]=useState<SpacePhoto[]>([initial,PHOTOS[2]]);const [front,setFront]=useState(0);
 const library=useRef<SpacePhoto[]>(online?photoLibrary():PHOTOS.slice());
 const last=useRef(initial.file);const nextIndex=useRef(Math.floor(Date.now()/60000)%PHOTOS.length);
 useEffect(()=>{library.current=online?photoLibrary():PHOTOS.slice();if(enabled&&online)refreshSpacePhotos().then(photos=>{library.current=photos;});},[enabled,online]);
 useEffect(()=>{
  if(!enabled||!active)return;
  let preload=0;
  const timer=window.setInterval(()=>{
   if(document.hidden)return;
   setFront(old=>{const next=1-old;last.current=layers[next].file;
    preload=window.setTimeout(()=>{
     const list=library.current;let chosen=list[(++nextIndex.current)%list.length];
     if(chosen.file===last.current)chosen=list[(++nextIndex.current)%list.length];
     const image=new Image();image.onload=()=>{setLayers(previous=>{const values=previous.slice();values[old]=chosen;return values;});};
     image.onerror=()=>{setLayers(previous=>{const values=previous.slice();values[old]=PHOTOS[nextIndex.current%PHOTOS.length];return values;});};image.src=chosen.file;
    },1600);return next;
   });
  },60000);

  return ()=>{clearInterval(timer);clearTimeout(preload);};
 },[enabled,active,online,layers]);
 useEffect(()=>{
  if(!enabled||!active||!online)return;
  const refresh=window.setInterval(()=>{if(!document.hidden)refreshSpacePhotos().then(photos=>{library.current=photos;});},6*60*60*1000);
  return ()=>clearInterval(refresh);
 },[enabled,active,online]);
 if(!enabled)return null;
 return <div class="wallpaper" aria-hidden="true">{layers.map((photo,slot)=><img key={slot} class={'wallpaper__photo'+(slot===front?' wallpaper__photo--visible':'')} src={photo.file} alt=""/>)}<div class="wallpaper__shade"/></div>;
}
