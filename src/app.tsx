import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {Home, type HomeRow} from './screens/Home';
import {Settings, type SettingsTab} from './screens/Settings';
import type {OptionItem} from './components/OptionList';
import {Toast, type ToastMessage} from './components/Toast';
import type {TileModel} from './components/Tile';
import {listApps, type AppEntry} from './lib/apps';
import {listInputs, MOCK_INPUTS, type InputSource} from './lib/inputs';
import {launchApp, launchLgHome} from './lib/launch';
import {isWebOS} from './lib/luna';
import {hidePointerOnForeground} from './lib/pointer';
import {loadConfig, saveConfig, toggleId, type UserConfig} from './lib/storage';
import {appTile, inputTile, pickInOrder} from './lib/tiles';
import {refreshHomeIntegration,setHomeIntegration} from './lib/homeIntegration';
import {TIMING} from './config/constants';

type Screen = 'home' | 'settings';

const ROW = {apps: 'apps', sources: 'sources', misc: 'misc'} as const;
const MISC = {lgHome: 'lg-home', settings: 'settings'} as const;
const OPTION = {wallpapers: 'wallpapers',onlinePhotos:'online-photos',home:'tv-home'} as const;

const MISC_TILES: TileModel[] = [
	{key: MISC.lgHome, label: 'LG Home', glyph: 'house'},
	{key: MISC.settings, label: 'Settings', glyph: 'gear'}
];

export function App () {
	const [homeEnabled,setHomeEnabled]=useState(false);
	const [screen, setScreen] = useState<Screen>('home');
	const [config, setConfig] = useState<UserConfig>(loadConfig);
	const [apps, setApps] = useState<AppEntry[]>([]);
	const [inputs, setInputs] = useState<InputSource[]>([]);
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const toastTimer = useRef(0);

	const showToast = useCallback((text: string, kind: ToastMessage['kind'] = 'info') => {
		window.clearTimeout(toastTimer.current);
		setToast({text, kind});
		toastTimer.current = window.setTimeout(() => setToast(null), TIMING.toastMs);
	}, []);

	// Start in remote (5-way) mode: hide the Magic Remote pointer whenever we come to the
	// front. Shaking the remote still brings it back.
	useEffect(() => hidePointerOnForeground(), []);

 // Refresh installed apps on return from LG Home/store, and once a minute while visible.
 useEffect(() => {
  let stopped=false;
  const refresh=()=>{if(document.hidden)return;listApps(false).then(result=>{if(!stopped)setApps(result.apps);}).catch(()=>showToast('Could not refresh apps; return to Home to retry','error'));};
  refresh();const timer=window.setInterval(refresh,60000);
  document.addEventListener('visibilitychange',refresh);document.addEventListener('webOSRelaunch',refresh);
  return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);document.removeEventListener('webOSRelaunch',refresh);};
 },[showToast]);

	useEffect(() => {
		const refresh = () => {
			if (!isWebOS()) { setInputs(MOCK_INPUTS); return; }
			listInputs().then(setInputs).catch(() => showToast('Could not read the inputs', 'error'));
		};
		refresh();
		const onVisibility = () => { if (!document.hidden) refresh(); };
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	}, [showToast]);

	const updateConfig = (next: UserConfig) => { setConfig(next); saveConfig(next); };

	useEffect(()=>{const relaunch=()=>setConfig(loadConfig());document.addEventListener('webOSRelaunch',relaunch);return ()=>document.removeEventListener('webOSRelaunch',relaunch);},[]);
 useEffect(()=>{
  const refresh=()=>{if(!document.hidden)refreshHomeIntegration().then(state=>setHomeEnabled(!!state.enabled&&!!state.anchor)).catch(()=>setHomeEnabled(false));};
  refresh();document.addEventListener('webOSRelaunch',refresh);document.addEventListener('visibilitychange',refresh);
  return ()=>{document.removeEventListener('webOSRelaunch',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[]);
 // ----- derived rows -----
	const shownApps = useMemo(() => {
  const visible=apps.filter(a=>config.hiddenAppIds.indexOf(a.id)===-1);
  const ordered=pickInOrder(visible,config.appIds,a=>a.id);
  return ordered.concat(visible.filter(a=>config.appIds.indexOf(a.id)===-1));
 },[apps,config.appIds,config.hiddenAppIds]);
	const shownInputs = useMemo(
		() => (config.sourceIds ? pickInOrder(inputs, config.sourceIds, (s) => s.appId) : inputs),
		[inputs, config.sourceIds]
	);

	const rows: HomeRow[] = useMemo(() => [
		{id: ROW.apps, label: 'Apps', items: shownApps.map(appTile), emptyText: 'No apps selected — add some in Settings'},
		{id: ROW.sources, label: 'Sources', items: shownInputs.map(inputTile), emptyText: 'No sources selected'},
		{id: ROW.misc, label: 'More', items: MISC_TILES}
	], [shownApps, shownInputs]);

	const tabs: SettingsTab[] = useMemo(() => [
		{id: ROW.apps, label: 'Apps', noun: 'apps', items: apps.map(appTile), shown: shownApps.map(appTile)},
		{id: ROW.sources, label: 'Sources', noun: 'sources', items: inputs.map(inputTile), shown: shownInputs.map(inputTile)}
	], [apps, inputs, shownApps, shownInputs]);

	const options: OptionItem[] = useMemo(() => [
		{
			id: OPTION.wallpapers,
			label: 'Space photography',
			description: 'Real NASA images rotate offline once a minute. Turn off for a black background. Credits are in the included image notices.',
			value: config.wallpapers
		}
	,{id:OPTION.onlinePhotos,label:'Refresh space collection',description:'Periodically discover more real NASA images. Turn off to use only the bundled offline collection.',value:config.onlinePhotos},{id:OPTION.home,label:'Use Quiet Home for the Home button',description:'Runs entirely on this TV. Open LG Home with the house button above the app grid.',value:homeEnabled}], [config.wallpapers,config.onlinePhotos,homeEnabled]);

	// ----- actions -----
	const open = (id: string, label: string) => {
		launchApp(id).catch(() => showToast(`Couldn't open ${label}`, 'error'));
	};

	const onActivate = useCallback((rowId: string, item: TileModel) => {
		if (rowId === ROW.misc) {
			if (item.key === MISC.settings) setScreen('settings');
			else if (item.key === MISC.lgHome) launchLgHome().catch(() => showToast("Couldn't open LG Home", 'error'));
			return;
		}
		open(item.key, item.label);
	}, [showToast]);

	const onToggle = useCallback((tabId: string, key: string) => {
		if (tabId === ROW.apps) {
			const hidden=config.hiddenAppIds.indexOf(key)!==-1;
   updateConfig({...config, hiddenAppIds:hidden?config.hiddenAppIds.filter(id=>id!==key):config.hiddenAppIds.concat(key),appIds:hidden?config.appIds.concat(key).filter((id,i,a)=>a.indexOf(id)===i):config.appIds});
		} else {
			const current = config.sourceIds || inputs.map((s) => s.appId);
			updateConfig({...config, sourceIds: toggleId(current, key)});
		}
	}, [config, inputs]);

	const onOption = useCallback((optionId: string) => {
		if (optionId === OPTION.wallpapers) updateConfig({...config, wallpapers: !config.wallpapers});
  if(optionId===OPTION.onlinePhotos)updateConfig({...config,onlinePhotos:!config.onlinePhotos});
  if(optionId===OPTION.home)setHomeIntegration(!homeEnabled).then(state=>setHomeEnabled(!!state.enabled&&!!state.anchor)).catch(()=>showToast('TV Home setting could not be changed','error'));
	}, [config,homeEnabled,showToast]);

	/** Replace a row's order with `keys` (the full list of what's shown). */
	const onReorder = useCallback((tabId: string, keys: string[]) => {
		if (tabId === ROW.apps) updateConfig({...config, appIds: keys});
		else updateConfig({...config, sourceIds: keys});
	}, [config]);

	return (
		<>
			{/* Home stays mounted under Settings so it keeps its focus position. */}
			<Home rows={rows} active={screen === 'home'} wallpapers={config.wallpapers} onlinePhotos={config.onlinePhotos} onActivate={onActivate} onReorder={(keys)=>onReorder(ROW.apps,keys)} />
			{screen === 'settings' && <Settings tabs={tabs} options={options} active onToggle={onToggle} onReorder={onReorder} onOption={onOption} onClose={() => setScreen('home')} />}
			<Toast message={toast} />
		</>
	);
}
