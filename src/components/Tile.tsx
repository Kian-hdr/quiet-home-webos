import {useEffect,useState} from 'preact/hooks';
import {CheckMark, Glyph, type GlyphName} from './Glyph';

/** Everything a tile needs to draw itself; rows and grids build these from app/input data. */
export interface TileModel {
	key: string;
	label: string;
	/** full-bleed artwork (app icons) */
	imageUrl?: string;
	/** Original editable SVG input glyphs, drawn smaller and lightened */
	glyphImageUrl?: string;
	/** built-in vector icon */
	glyph?: GlyphName;
	/** monogram background when there is no artwork */
	color?: string;
}

interface Props {
	model: TileModel;
	focused: boolean;
	/** picked up in re-order mode */
	lifted?: boolean;
	/** shown with a tick badge (settings picker) */
	checked?: boolean;
	/** greyed out (settings picker: not on the home screen) */
	dimmed?: boolean;
	onHover?: () => void;
	onActivate?: () => void;
}

export function Tile ({model, focused, lifted, checked, dimmed, onHover, onActivate}: Props) {
 const [imageFailed,setImageFailed]=useState(false);
 useEffect(()=>setImageFailed(false),[model.imageUrl]);
	const classes = ['tile', `tile--${model.key.replace(/[^a-z0-9]/gi, '-')}`,  focused && 'tile--focused', lifted && 'tile--lifted', dimmed && 'tile--dimmed'].filter(Boolean).join(' ');
	return (
		<div class={classes} role="button" aria-label={model.label} aria-pressed={checked} tabIndex={-1} onMouseEnter={onHover} onClick={onActivate}
   onMouseMove={(event) => {
    if (!focused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--art-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 6}px`);
    event.currentTarget.style.setProperty('--art-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 6}px`);
   }}
   onMouseLeave={(event) => {
    event.currentTarget.style.setProperty('--art-x', '0px');
    event.currentTarget.style.setProperty('--art-y', '0px');
   }}>
			<div class="tile__box" style={model.color && !model.imageUrl ? {background: model.color} : undefined}>
				{model.imageUrl && !imageFailed
					? <img class="tile__image" src={model.imageUrl} alt="" onError={()=>setImageFailed(true)} />
					: model.glyphImageUrl
						? <img class="tile__image tile__image--glyph" src={model.glyphImageUrl} alt="" />
						: model.glyph
							? <Glyph name={model.glyph} />
							: <div class="tile__wordmark">{model.label}</div>}
				{checked && <div class="tile__badge"><CheckMark /></div>}
			</div>
			<div class="tile__label">{model.label}</div>
		</div>
	);
}
