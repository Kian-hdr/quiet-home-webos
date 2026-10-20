// Generic fallback catalog. The paired TV supplies its own installed inventory.
export interface CatalogApp { id:string; title:string; icon?:string; color?:string; }
export interface LocalCatalog { EXTRA_APPS?:CatalogApp[]; DEFAULT_APP_IDS?:string[]; }
const BASE_CATALOG:CatalogApp[] = [
 {id:'netflix',title:'Netflix',color:'#151515'},
 {id:'youtube.leanback.v4',title:'YouTube',color:'#151515'},
 {id:'amazon',title:'Prime Video',color:'#151515'},
 {id:'com.disney.disneyplus-prod',title:'Disney+',color:'#151515'},
 {id:'com.apple.appletv',title:'Apple TV',color:'#151515'},
 {id:'cdp-30',title:'Plex',color:'#151515'}
];
const localModules=import.meta.glob<LocalCatalog>('./catalog.local.ts',{eager:true});
const local=localModules['./catalog.local.ts']||{};
const extra=local.EXTRA_APPS||[];
export const APP_CATALOG=BASE_CATALOG.filter(a=>!extra.some(b=>b.id===a.id)).concat(extra);
export const DEFAULT_APP_IDS=local.DEFAULT_APP_IDS||BASE_CATALOG.map(a=>a.id);
