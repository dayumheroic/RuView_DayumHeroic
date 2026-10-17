import {readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
let html=await readFile(new URL('../../ui/index.html',import.meta.url),'utf8');
// Reuse original shell/nav, CSS and components; replace sections that require
// the native backend. Never publish promotional defaults as measurements.
html=html.replace(/<section id="([^"]+)"[\s\S]*?<\/section>/g,(_all,id)=>
  ['dashboard','hardware','demo','sensing'].includes(id)?`<section id="${id}" class="tab-content${id==='dashboard'?' active':''}" role="tabpanel"></section>`:'');
html=html.replace(/\s*<button class="nav-tab[^>]*data-tab="([^"]+)"[^>]*>[\s\S]*?<\/button>/g,(all,id)=>['dashboard','hardware','demo','sensing'].includes(id)?all:'');
html=html.replace(/\s*<a href="(?:pose-fusion|observatory|mesh)\.html"[^>]*>[\s\S]*?<\/a>/g,'');
html=html.replace(/<link rel="manifest"[^>]*>/,'').replace('src="app.js"','src="/ruview/app.js"').replace('href="style.css"','href="/ruview/style.css"');
html=html.replace('<title>WiFi DensePose: Human Tracking Through Walls</title>','<title>RuView · Bridge sensing</title>')
  .replace('Human Tracking Through Walls Using WiFi Signals','Measured scalar feed · original RuView UI in bridge mode')
  .replace('WiFi-based human pose estimation, vital sign detection, and presence sensing through walls','Private measured RF and stock Deco telemetry in the RuView interface')
  .replace('<div class="header-info">','<p class="bridge-banner">MEASURED RADIO · DERIVED LINK CHANGE · POSE UNAVAILABLE</p><p><a href="/">Detailed telemetry</a></p><div class="header-info">');
if((html.match(/<section id=/g)||[]).length!==4||(html.match(/data-tab=/g)||[]).length!==4||!html.includes('src="/ruview/app.js"'))
  throw new Error('Original UI markup changed; review bridge-mode transformation');
const css=(await readFile(new URL('../../ui/style.css',import.meta.url),'utf8')).replace(/@font-face\s*\{[\s\S]*?\}/g,'');
const notices='RuView UI\n'+await readFile(new URL('../../LICENSE',import.meta.url),'utf8')+'\n\nThree.js 0.128.0\n'+await readFile(new URL('./node_modules/three/LICENSE',import.meta.url),'utf8');
html=html.replace('</div>\n\n    <!-- Error Toast -->','<p><a href="/ruview/notices">Open-source notices</a></p></div>\n\n    <!-- Error Toast -->');
const extra=`\n.bridge-banner{padding:12px;border:1px solid #338e97;border-radius:8px}.bridge-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:24px 0}.bridge-cards article{padding:20px;border:1px solid var(--color-border);border-radius:12px}.bridge-cards strong{font-size:24px}.bridge-scroll{overflow-x:auto}th,td{text-align:left;padding:12px;vertical-align:top;border-bottom:1px solid var(--color-border)}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:480px;overflow:auto;padding:16px;background:var(--color-secondary)}#bridge-pose{max-width:100%;background:#0a0a12}.sensing-viewport{min-height:380px}#bridgeScalar,#bridgeDelta{overflow-wrap:anywhere}@media(max-width:800px){.bridge-cards{grid-template-columns:1fr}.sensing-layout{display:block}.sensing-viewport{height:380px}.sensing-panel{width:100%;max-width:none}.nav-tabs{flex-wrap:wrap}}`;
const bundle=await build({entryPoints:[new URL('./ruview-client.mjs',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'inline'});
const associations=await build({entryPoints:[new URL('./association-ui.mjs',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
await writeFile(new URL('./ruview-assets.generated.mjs',import.meta.url),`export const RUVIEW_HTML=${JSON.stringify(html)};\nexport const RUVIEW_CSS=${JSON.stringify(css+extra)};\nexport const RUVIEW_JS=${JSON.stringify(bundle.outputFiles[0].text)};\nexport const RUVIEW_NOTICES=${JSON.stringify(notices)};\n`);
console.log(JSON.stringify({ruview_html_bytes:Buffer.byteLength(html),ruview_js_bytes:bundle.outputFiles[0].contents.length}));
await writeFile(new URL('./association-assets.generated.mjs',import.meta.url),`export default ${JSON.stringify(associations.outputFiles[0].text)};\n`);
