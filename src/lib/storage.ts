// The user's choices: which apps and which inputs appear on the home rows, in order,
// plus options. Persisted in localStorage (private to this app on the TV).

import {STORAGE_KEY} from '../config/constants';
import {DEFAULT_APP_IDS} from '../config/catalog';

export interface UserConfig {
	/** ordered app IDs for the Apps row */
	appIds: string[];
 hiddenAppIds: string[];
	/** ordered input appIds (com.webos.app.hdmiN) for the Sources row; null → all inputs */
	sourceIds: string[] | null;
	/** Reserved legacy preference; root access is never used. */
	useHomebrew: boolean;
	wallpapers: boolean;
 onlinePhotos:boolean;
}

export const DEFAULT_CONFIG: UserConfig = {
	appIds: DEFAULT_APP_IDS.slice(),
 hiddenAppIds: [],
	sourceIds: null,
	useHomebrew: false,
	wallpapers: true,
 onlinePhotos:true
};

export function loadConfig (): UserConfig {
	try {
  const params=JSON.parse(window.PalmSystem && window.PalmSystem.launchParams || '{}');
  if(params.restoreConfig && typeof params.restoreNonce==='string' && localStorage.getItem('quiet-home-last-restore')!==params.restoreNonce){
   const incoming=params.restoreConfig;
   if(params.restoreStorageAbsent===true){localStorage.removeItem(STORAGE_KEY);localStorage.setItem('quiet-home-last-restore',params.restoreNonce);}
   else if(Array.isArray(incoming.appIds)&&Array.isArray(incoming.hiddenAppIds)){
    localStorage.setItem(STORAGE_KEY,JSON.stringify({...incoming,useHomebrew:false}));localStorage.setItem('quiet-home-last-restore',params.restoreNonce);
   }
  }
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {...DEFAULT_CONFIG};
		const parsed = JSON.parse(raw) as Partial<UserConfig>;
		return {
			appIds: Array.isArray(parsed.appIds) ? parsed.appIds : DEFAULT_CONFIG.appIds,
			hiddenAppIds: Array.isArray(parsed.hiddenAppIds) ? parsed.hiddenAppIds : DEFAULT_CONFIG.hiddenAppIds,
			sourceIds: Array.isArray(parsed.sourceIds) ? parsed.sourceIds : null,
			useHomebrew: false,
			wallpapers: parsed.wallpapers !== false,
 onlinePhotos:parsed.onlinePhotos!==false
		};
	} catch {
		return {...DEFAULT_CONFIG};
	}
}

export function saveConfig (config: UserConfig): void {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }
	catch { /* nothing sensible to do on a TV */ }
}

/** Toggle an ID in an ordered list: remove if present, else append. */
export function toggleId (ids: string[], id: string): string[] {
	return ids.indexOf(id) === -1 ? ids.concat(id) : ids.filter((x) => x !== id);
}
