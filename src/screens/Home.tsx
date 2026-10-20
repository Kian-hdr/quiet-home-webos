import {useCallback, useEffect, useMemo, useState} from 'preact/hooks';
import {Tile, type TileModel} from '../components/Tile';
import {Glyph} from '../components/Glyph';
import {useKeys, clamp, type NavKey} from '../hooks/useKeys';
import {useClock} from '../hooks/useClock';
import {useTimeFormat} from '../hooks/useTimeFormat';
import {timeParts} from '../lib/clock';
import {useOkPress} from '../hooks/useOkPress';
import {moveItem} from '../lib/order';
import {Wallpaper} from '../components/Wallpaper';

export interface HomeRow { id: string; label: string; items: TileModel[]; emptyText?: string; }
interface Props { rows: HomeRow[]; active: boolean; wallpapers: boolean; onlinePhotos:boolean; onActivate: (rowId: string, item: TileModel) => void; onReorder: (keys:string[])=>void; }
interface Shelf { id: string; label: string; items: TileModel[]; dock: boolean; }
const COLUMNS = 6;

/** A fixed six-column spatial grid. The first six apps occupy the favorites Dock.
 * The same app/source IDs and persisted ordering are used by Settings and launching. */
export function Home ({rows, active, wallpapers, onlinePhotos, onActivate, onReorder}: Props) {
 const now = useClock();
 const format = useTimeFormat();
 const clock = timeParts(now, format);
 const [rowIndex, setRowIndex] = useState(0);
 const [focusVisible,setFocusVisible]=useState(false);
 const [column, setColumn] = useState(0);
 const [utility, setUtility] = useState(-1);
 const [immersive, setImmersive] = useState(false);
 const [held,setHeld] = useState<{key:string;original:string[]}|null>(null);
 const shelves = useMemo(() => {
  const result: Shelf[] = [];
  rows.filter(row => row.id !== 'misc').forEach(row => {
   for (let start = 0; start < row.items.length; start += COLUMNS) result.push({id: row.id, label: row.id === 'apps' && start === 0 ? 'Favorites' : row.label, items: row.items.slice(start, start + COLUMNS), dock: row.id === 'apps' && start === 0});
  });
  return result;
 }, [rows]);
 const safeRow = clamp(rowIndex, 0, Math.max(0, shelves.length - 1));
 const selected = shelves[safeRow];
 const safeColumn = selected ? clamp(column, 0, selected.items.length - 1) : 0;
 const misc = rows.filter(row => row.id === 'misc')[0];
 const activateUtility = (index: number) => {
  if (index === 0) { setImmersive(true); setUtility(-1); }
  else if (misc && misc.items[index - 1]) onActivate(misc.id, misc.items[index - 1]);
 };
 const appKeys=rows.filter(row=>row.id==='apps').reduce<string[]>((all,row)=>all.concat(row.items.map(item=>item.key)),[]);
 const pickUp=()=>{if(selected && selected.id==='apps' && selected.items[safeColumn])setHeld({key:selected.items[safeColumn].key,original:appKeys.slice()});};
 const press=()=>{
  if(!focusVisible){setFocusVisible(true);return;}
  if(held){setHeld(null);return;}
  if(immersive){setImmersive(false);return;}
  if(utility>=0){activateUtility(utility);return;}
  if(selected && selected.items[safeColumn])onActivate(selected.id,selected.items[safeColumn]);
 };
 useOkPress({onPress:press,onLongPress:()=>{if(!focusVisible){setFocusVisible(true);return;}if(held)setHeld(null);else if(!immersive&&utility<0)pickUp();}},active);
 const handleKey = useCallback((key: NavKey): boolean => {
  if(key==='enter')return true;
  if(!focusVisible && key!=='back'){setFocusVisible(true);return true;}
  if(held){
   const current=appKeys.indexOf(held.key);
   if(key==='back'){onReorder(held.original);const i=held.original.indexOf(held.key);setRowIndex(Math.floor(i/6));setColumn(i%6);setHeld(null);setFocusVisible(false);return true;}
   const delta=key==='left'?-1:key==='right'?1:key==='up'?-6:key==='down'?6:0;
   const dest=clamp(current+delta,0,appKeys.length-1);
   if(dest!==current){onReorder(moveItem(appKeys,current,dest));setRowIndex(Math.floor(dest/6));setColumn(dest%6);}
   return true;
  }
  if (immersive) { if (key === 'back' || key === 'down') setImmersive(false); return true; }
  if (utility >= 0) {
   if (key === 'left') setUtility(clamp(utility - 1, 0, 2));
   else if (key === 'right') setUtility(clamp(utility + 1, 0, 2));
   else if (key === 'down' || key === 'back') {setUtility(-1);if(key==='back')setFocusVisible(false);}

   return true;
  }
  if (key === 'up') { if (safeRow === 0) setUtility(0); else setRowIndex(safeRow - 1); }
  else if (key === 'down') setRowIndex(clamp(safeRow + 1, 0, shelves.length - 1));
  else if (key === 'left') setColumn(clamp(safeColumn - 1, 0, Math.max(0, (selected ? selected.items.length : 1) - 1)));
  else if (key === 'right') setColumn(clamp(safeColumn + 1, 0, Math.max(0, (selected ? selected.items.length : 1) - 1)));

  else if (key === 'back') {setFocusVisible(false);setUtility(-1);}
  return true;
 }, [immersive, utility, safeRow, safeColumn, shelves, selected, misc, onActivate,held,appKeys,onReorder,focusVisible]);
 useKeys(handleKey, active);
 useEffect(()=>{const clear=()=>{setFocusVisible(false);setUtility(-1);setHeld(null);};const visibility=()=>{if(document.hidden)clear();};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{if(!active){setFocusVisible(false);setUtility(-1);}},[active]);
 const offset = safeRow === 0 ? 0 : 685 + Math.max(0, safeRow - 1) * 260;
 return <main class={'screen home' + (safeRow > 0 ? ' home--grid' : '') + (immersive ? ' home--immersive' : '')} aria-label="Home" aria-hidden={!active} onClick={(event)=>{if(!(event.target as Element).closest('.tile,.utility,.home__empty button')){setFocusVisible(false);setUtility(-1);}}}>
  <Wallpaper enabled={wallpapers} active={active} online={onlinePhotos} />
  <header class="home__utilities">
   <span class="home__time">{clock.time}{clock.period ? ' ' + clock.period : ''}</span>
   <button class={'utility' + (focusVisible && utility === 0 ? ' utility--focused' : '')} aria-label="View photo" onMouseEnter={() => {setFocusVisible(true);setUtility(0);}} onClick={() => activateUtility(0)}><span class="utility__photo"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m4 17 5-5 4 4 3-3 5 5"/><circle cx="16" cy="9" r="1"/></svg></span></button>
   {misc && misc.items.map((item, i) => <button key={item.key} class={'utility' + (focusVisible && utility === i + 1 ? ' utility--focused' : '')} aria-label={item.label} onMouseEnter={() => {setFocusVisible(true);setUtility(i + 1);}} onClick={() => activateUtility(i + 1)}>{item.glyph && <Glyph name={item.glyph}/>}</button>)}
  </header>

  <div class="home__shelves" style={{transform: `translateY(${-offset}px)`}}>
   {shelves.length === 0 && <div class="home__empty"><h1>Your home, your favorites</h1><p>Add apps and sources in Settings.</p><button onClick={() => activateUtility(2)}>Open Settings</button></div>}
   {shelves.map((shelf, r) => <section key={shelf.id + r} class={'home__shelf' + (shelf.dock ? ' home__shelf--dock' : '')+(shelf.id==='apps'?' home__shelf--apps':'')} aria-label={shelf.label}>
    {!shelf.dock && shelf.id!=='apps' && <h2 class="home__shelf-title">{shelf.label}</h2>}
    <div class="home__tile-grid">{shelf.items.map((item, c) => <Tile key={item.key} model={item} focused={focusVisible && !immersive && utility < 0 && r === safeRow && c === safeColumn} lifted={!!held && held.key===item.key} onHover={() => {setFocusVisible(true);setUtility(-1); setRowIndex(r); setColumn(c);}} onActivate={() => {if(held)setHeld(null);else onActivate(shelf.id,item);}}/>)}</div>
   </section>)}
  </div>
  {held && <div class="home__edit-hint" role="status">Move app with arrows · OK to place · Back to cancel</div>}
 </main>;
}
