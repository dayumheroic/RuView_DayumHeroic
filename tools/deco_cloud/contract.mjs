// Rebuild every remote field. No router target, names, MACs, IPs or credentials.
import {cleanAssociations} from './associations.mjs';
export const CAPABILITIES = Object.freeze({complex_csi:false,human_presence:false,pose:false,vitals:false});
const states = new Set(['live_unverified','stale','disconnected']);
function number(x,lo,hi,nullable=true) {
  if(x===null && nullable) return null;
  if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi) throw new Error('Invalid measurement');
  return x;
}
function time(x) { if(typeof x!=='string'||x.length>40||!Number.isFinite(Date.parse(x))) throw new Error('Invalid time'); return x; }
function state(x) { if(!states.has(x)) throw new Error('Invalid source state');return x; }
function id(x) {if(typeof x!=='string'||!/^[a-f0-9]{24}$/.test(x))throw new Error('Invalid alias');return x;}
export function powerNanowatts(dbm) { return dbm===null?null:10**((number(dbm,-127,-1)+60)/10); }
export function signalToDbm() { return null; } // Ordinal quality has no calibrated inverse.
export function cleanFrame(v,now=Date.now()) {
  if(Object.keys(CAPABILITIES).some(k=>v?.capabilities?.[k]!==false))throw new Error('Unsupported sensing claim');
  if(v?.schema!=='ruview.observatory.v1'||typeof v.collection!=='string'||!/^[a-f0-9]{32}$/.test(v.collection)
      ||!Number.isSafeInteger(v.sequence)||v.sequence<0)throw new Error('Invalid frame');
  const sent=time(v.sent_at);if(Math.abs(now-Date.parse(sent))>120000)throw new Error('Stale publication');
  const r=v.radio;
  if(!r||r.source!=='macos_corewlan'||typeof r.available!=='boolean')throw new Error('Invalid radio');
  const radio={source:'macos_corewlan',source_state:state(r.source_state),observed_at:r.observed_at===null?null:time(r.observed_at),
    available:r.available,rssi_dbm:number(r.rssi_dbm,-127,-1),noise_dbm:number(r.noise_dbm,-127,-1),
    channel:number(r.channel,1,233),transmit_rate_mbps:number(r.transmit_rate_mbps,.001,100000)};
  if(!radio.available&&(radio.rssi_dbm!==null||radio.noise_dbm!==null))throw new Error('Unavailable radio has values');
  if(radio.observed_at&&Date.parse(radio.observed_at)>now+10000)throw new Error('Future observation');
  const m=v.mesh;if(!m)throw new Error('Missing mesh');
  const rows=(items,limit)=>{
    if(items===null)return null;
    if(!Array.isArray(items)||items.length>limit)throw new Error('Invalid rows');
    const result=items.map(x=>({id:id(x.id),online:x.online===null?null:typeof x.online==='boolean'?x.online:(()=>{throw new Error('Invalid online')})(),
      down_raw:number(x.down_raw,0,1e12),up_raw:number(x.up_raw,0,1e12),
      signal_2g:number(x.signal_2g,0,100),signal_5g:number(x.signal_5g,0,100),
      parent_id:x.parent_id==null?null:id(x.parent_id),is_main:typeof x.is_main==='boolean'?x.is_main:null,
      model:['M5','M4R','M4','E4R','E4'].includes(x.model)?x.model:null}));
    if(new Set(result.map(x=>x.id)).size!==result.length)throw new Error('Duplicate aliases');return result;
  };
  const mesh={source_state:state(m.source_state),observed_at:m.observed_at===null?null:time(m.observed_at),nodes:rows(m.nodes,32),clients:rows(m.clients,128),associations:null};
  const nodeIds=new Set((mesh.nodes||[]).map(n=>n.id));
  for(const n of mesh.nodes||[])if(n.parent_id&&(!nodeIds.has(n.parent_id)||n.parent_id===n.id))throw Error('Invalid node parent');
  mesh.associations=cleanAssociations(m.associations,mesh.nodes,mesh.clients,now);
  if(mesh.observed_at&&Date.parse(mesh.observed_at)>now+10000)throw new Error('Future mesh');
  if(!Array.isArray(v.probes)||v.probes.length>4)throw new Error('Invalid probes');
  const probes=v.probes.map(p=>{
    if(!['gateway','neighbor'].includes(p.kind)||!/^probe-[1-4]$/.test(p.id))throw new Error('Invalid probe');
    return {id:p.id,kind:p.kind,observed_at:time(p.observed_at),rtt_ms:number(p.rtt_ms,0,10000),loss_percent:number(p.loss_percent,0,100)};
  });
  if(new Set(probes.map(p=>p.id)).size!==probes.length)throw new Error('Duplicate probes');
  const phase=['setup_required','connecting','connected','retry_wait','failed','paused'].includes(v.connection)?v.connection:'unknown';
  return {schema:'ruview.observatory.v1',collection:v.collection,sequence:v.sequence,sent_at:sent,connection:phase,
    radio,mesh,probes,capabilities:{...CAPABILITIES}};
}
export function viewerForHash(hash,entries,now=Date.now()) {
  if(!Array.isArray(entries)||entries.length>20)return null;
  return entries.find(e=>e.hash===hash&&['owner','viewer'].includes(e.role)&&Number.isFinite(e.expires)&&e.expires>now)||null;
}
export function summarizeRadio(r) {
  return {power_nw:powerNanowatts(r.rssi_dbm),snr_db:r.rssi_dbm===null||r.noise_dbm===null?null:r.rssi_dbm-r.noise_dbm};
}
