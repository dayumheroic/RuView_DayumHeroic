import * as THREE from 'three';
import {TabManager} from '../../ui/components/TabManager.js';
import {SensingTab} from '../../ui/components/SensingTab.js';
import {PoseRenderer} from '../../ui/utils/pose-renderer.js';
import {bridgeSensing,INPUT_MAP} from '../../ui/services/deco-sensing.mjs';
import {renderAssociations} from './association-ui.mjs';

const $=id=>document.getElementById(id);
const fmt=(x,n=2)=>Number.isFinite(x)?x.toFixed(n):'unknown';
document.querySelector('.api-version').textContent='Bridge feed v1';
document.querySelector('.api-environment').textContent='Private cloud';
class CloudFeed {
  constructor(){this.listeners=new Set();this.states=new Set();this.snapshot=null;this.socket=null;this.delay=1000;this.running=false;}
  onData(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  onStateChange(fn){this.states.add(fn);return()=>this.states.delete(fn);}
  state(s){for(const fn of this.states)fn(s);}
  getRssiHistory(){return this.view?.history.map(h=>h.rssi)||[];}
  emit(){this.view=bridgeSensing(this.snapshot);for(const fn of this.listeners)fn(this.view);}
  async sync(){try{const response=await fetch('/api/snapshot',{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000)});
    if(response.status===401){this.stop();location.replace('/login');return;}
    if(response.ok)this.accept(await response.json());
  }catch{this.state('reconnecting');}}
  accept(v){
    if(!v||!['snapshot','update'].includes(v.type))return;
    const old=this.snapshot?.latest,next=v.latest;
    if(old&&next&&old.collection===next.collection&&old.sequence>next.sequence)return;
    if(v.type==='snapshot')this.snapshot=v;
    else {
      const history=old?.collection===next?.collection?[...(this.snapshot?.history||[])]:[];
      if(v.sample&&!history.some(h=>h.observed===v.sample.observed))history.push(v.sample);
      this.snapshot={...v,history:history.filter(h=>Date.now()-Date.parse(h.observed)<900000).slice(-180)};
    }
    this.emit();
  }
  connect(){
    if(!this.running||this.socket&&[WebSocket.OPEN,WebSocket.CONNECTING].includes(this.socket.readyState))return;
    const ws=this.socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/api/live`);
    ws.onopen=()=>{this.delay=1000;this.state('connected');};
    ws.onmessage=e=>{try{this.accept(JSON.parse(e.data));}catch{this.state('reconnecting');}};
    ws.onerror=()=>ws.close();
    ws.onclose=()=>{this.state('reconnecting');if(this.running){this.reconnect=setTimeout(()=>{this.sync();this.connect();},this.delay);this.delay=Math.min(30000,this.delay*2);}};
  }
  start(){if(this.running)return;this.running=true;this.sync();this.connect();this.clock=setInterval(()=>this.emit(),2000);this.fallback=setInterval(()=>{if(this.socket?.readyState!==WebSocket.OPEN)this.sync();},30000);}
  stop(){this.running=false;clearInterval(this.clock);clearInterval(this.fallback);clearTimeout(this.reconnect);this.socket?.close();}
}

$('dashboard').innerHTML=`<h2>RuView · bridge dashboard</h2><p>The existing RuView interface is connected to your private cloud feed. This mode uses measured scalar radio inputs; the native Rust inference server is not running here.</p>
  <div class="bridge-cards"><article><h3>Current RF</h3><strong id="summary-rf">Waiting</strong><p id="summary-source"></p></article><article><h3>Mesh inventory</h3><strong id="summary-mesh">Waiting</strong><p>Deco records, not people or CSI nodes.</p></article><article><h3>Link-change experiment</h3><strong id="summary-change">Collecting</strong><p>Derived signal change, not a human-motion classifier.</p></article></div>
  <h3>What RuView is looking for</h3><div class="bridge-scroll"><table><thead><tr><th>RuView input</th><th>Our feed</th><th>Interpretation</th></tr></thead><tbody id="input-map"></tbody></table></div>
  <p><a href="/">Open detailed telemetry and experiment labels</a> · <a href="/api/ruview/snapshot" target="_blank" rel="noopener">Inspect the mapped data as JSON</a></p>`;
for(const fields of INPUT_MAP){const tr=document.createElement('tr');for(const field of fields){const td=document.createElement('td');td.textContent=field;tr.append(td);}$('input-map').append(tr);}
$('hardware').innerHTML=`<h2>Hardware · observed capabilities</h2><p id="hardware-state">Waiting for mesh snapshot</p><div class="bridge-scroll"><table><thead><tr><th>Node alias</th><th>Online field</th><th>2.4 GHz quality · raw</th><th>5 GHz quality · raw</th></tr></thead><tbody id="hardware-rows"></tbody></table></div><p>Quality levels have no verified dBm conversion. Physical coordinates, per-client RF and CSI arrays are unavailable. Node order is not spatial location.</p><h3>Network echo measurements</h3><pre id="probe-summary">Waiting</pre>`;
$('demo').innerHTML=`<h2>Live Demo · tracking inputs</h2><p>The existing RuView pose renderer is installed below. It has no validated pose frames from this source, so it stays empty. Unknown presence is not zero people.</p><canvas id="bridge-pose" width="800" height="360" aria-label="RuView pose canvas: no validated pose data"></canvas><p>Required next: suitable high-rate RF observations, calibrated sensing/inference and pose keypoints with confidence. Device traffic and RSSI scalars alone do not identify limb positions.</p><h3>Mapped live data</h3><p>CSI features remain null. Derived RSSI statistics use separate names and units.</p><pre id="mapped-json">Waiting</pre>`;
const pose=new PoseRenderer($('bridge-pose'),{showZones:false,showDebugInfo:false});pose.clearCanvas();pose.renderNoDataMessage();
const attachments=document.createElement('section');attachments.innerHTML='<h2>Devices and Deco attachments</h2><div id="ruview-attachments"></div>';$('hardware').append(attachments);
const tabs=new TabManager(document.querySelector('.container'));tabs.init();
const feed=new CloudFeed();
const sensing=new SensingTab($('sensing'),{service:feed,telemetry:true,three:THREE});
feed.onData(v=>{
  document.querySelector('.overall-health').textContent=v.source_state==='live'?'Radio live':'Radio unavailable';
  $('summary-rf').textContent=v.source_state==='live'?`${fmt(v.scalar.rssi_dbm,0)} dBm`:'Unavailable / stale';
  $('summary-source').textContent=`CoreWLAN observation ${v.observed_at?new Date(v.observed_at).toLocaleTimeString():'unknown'} · ${v.scalar.sample_count} distinct samples`;
  const meshLive=v.mesh?.source_state==='live_unverified'&&Date.now()-Date.parse(v.mesh.observed_at)<=90000&&Date.now()-Date.parse(feed.snapshot?.received_at)<20000;
  renderAssociations($('ruview-attachments'),v.mesh?{...v.mesh,source_state:meshLive?'live_unverified':'stale'}:null);
  $('summary-mesh').textContent=`${v.mesh?.nodes?.length??'unknown'} nodes · ${v.mesh?.clients?.length??'unknown'} clients${meshLive?'':' · stale / unavailable'}`;
  $('summary-change').textContent=v.change.state.replaceAll('_',' ');
  $('hardware-state').textContent=`${meshLive?'Live · unverified scale':'Last observed / unavailable'} · ${v.mesh?.observed_at??'no capture'}`;
  $('hardware-rows').replaceChildren();for(const [i,node] of (v.mesh?.nodes||[]).entries()){
    const tr=document.createElement('tr');for(const value of [`N${i+1}`,node.online===null?'unknown':String(node.online),node.signal_2g??'unknown',node.signal_5g??'unknown']){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}$('hardware-rows').append(tr);
  }
  $('probe-summary').textContent=JSON.stringify(v.probes,null,2);
  $('mapped-json').textContent=JSON.stringify({...v,history:undefined,mesh:undefined,probes:undefined,input_map:undefined},null,2);
});
try{await sensing.init();}catch{
  $('sensingViewport').textContent='3D rendering unavailable in this browser. Measured values and the 2D sparkline remain available.';
  sensing._connectService();
}
tabs.switchToTab('sensing');
document.addEventListener('visibilitychange',()=>{if(!document.hidden){feed.sync();feed.connect();}});
window.addEventListener('pagehide',()=>{sensing.dispose();feed.stop();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
