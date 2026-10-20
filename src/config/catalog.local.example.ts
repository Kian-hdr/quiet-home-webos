// Copy to catalog.local.ts for private custom defaults. Do not commit local inventory.
import type {CatalogApp} from './catalog';
export const EXTRA_APPS:CatalogApp[]=[{id:'com.example.myapp',title:'My App'}];
export const DEFAULT_APP_IDS=['netflix','youtube.leanback.v4','amazon','com.disney.disneyplus-prod','com.apple.appletv','com.example.myapp'];
