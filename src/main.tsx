import {render} from 'preact';
import {App} from './app';
import {applyTokens} from './theme/tokens';
import './theme/global.css';

applyTokens();
function fitScene(){document.documentElement.style.setProperty('--scene-scale',String(Math.min(window.innerWidth/1920,window.innerHeight/1080)));}
fitScene();window.addEventListener('resize',fitScene);
render(<App />, document.getElementById('root')!);
