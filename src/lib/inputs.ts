// Live input labels come from the TV. Display glyphs are original editable vectors.

import {LUNA, SYSTEM_APP} from '../config/constants';
import {lunaCall, type LunaResponse} from './luna';
import {appExists} from './launch';

export interface InputSource {
	id: string;        // e.g. HDMI_1
	appId: string;     // e.g. com.webos.app.hdmi1 — launch this to switch
	label: string;     // user-visible name from the TV's input settings
	port: number;
	connected: boolean;
	icon: string;      // file name under icons/inputs/
}

interface EimDevice {
	id: string;
	appId: string;
	label: string;
	port: number;
	connected?: boolean;
	icon?: string;
}

interface EimResponse extends LunaResponse {
	devices?: EimDevice[];
}

const FALLBACK_ICON = 'hdmi.svg';

/** Live TV isn't an EIM device, but launching its app switches to the tuner, so it
 *  behaves like any other source. Port 0 sorts it ahead of HDMI 1. */
const LIVE_TV: InputSource = {
	id: 'LIVE_TV',
	appId: SYSTEM_APP.liveTv,
	label: 'Live TV',
	port: 0,
	connected: true,
	icon: 'tv.svg'
};

export function listInputs (): Promise<InputSource[]> {
	return Promise.all([listExternalInputs(), appExists(LIVE_TV.appId)])
		.then(([external, hasTuner]) => (hasTuner ? [LIVE_TV] : []).concat(external));
}

function listExternalInputs (): Promise<InputSource[]> {
	return lunaCall<EimResponse>(LUNA.inputStatus, {}).then((r) =>
		(r.devices || [])
			.filter((d) => d.appId && d.label)
			.sort((a, b) => a.port - b.port)
			.map((d) => ({
				id: d.id,
				appId: d.appId,
				label: d.label,
				port: d.port,
				connected: d.connected !== false,
				icon: FALLBACK_ICON
			}))
	);
}

/** Sample data so the layout can be developed in a desktop browser. */
/** Generic offline preview, not a record of connected equipment. */
export const MOCK_INPUTS: InputSource[] = [LIVE_TV,
 {id:'HDMI_1',appId:'com.webos.app.hdmi1',label:'HDMI 1',port:1,connected:false,icon:'hdmi.svg'},
 {id:'HDMI_2',appId:'com.webos.app.hdmi2',label:'HDMI 2',port:2,connected:false,icon:'hdmi.svg'},
 {id:'HDMI_3',appId:'com.webos.app.hdmi3',label:'HDMI 3',port:3,connected:false,icon:'hdmi.svg'}
];
