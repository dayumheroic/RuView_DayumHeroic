// Scalar-only projection. This is deliberately NOT the Rust sensing_update schema.
export const INPUT_MAP = Object.freeze([
  ['features.mean_rssi', 'Supported', 'Mean of fresh, distinct CoreWLAN RSSI samples (dBm).'],
  ['features.variance', 'Different measurement', 'RuView expects CSI/amplitude variance; we separately compute RSSI variance in dB².'],
  ['motion_band_power / breathing_band_power', 'Unavailable', 'No high-rate CSI channel time series; ~5-second RSSI cannot recover these bands.'],
  ['spectral_power / dominant_freq_hz', 'Unavailable', 'Received watts are not CSI spectral power. No invented spectrum.'],
  ['nodes[].amplitude / subcarrier_count', 'Unavailable', 'Deco quality levels are ordinal, not subcarrier amplitudes.'],
  ['nodes[].position / signal_field', 'Unavailable', 'No calibrated receiver coordinates or measured spatial RF field.'],
  ['classification.presence / persons', 'Unvalidated', 'Link change is not a person or an occupancy count.'],
  ['pose_keypoints / vital_signs', 'Unavailable', 'Requires suitable observations and validated inference.'],
  ['mesh / ICMP', 'Separate telemetry', 'Node/client records and network RTT retain their own timestamps and units.'],
  ['Device → Deco attachment', 'Node-filtered observations', 'Last-observed membership, confidence conflicts and observation times; not a precise person location.'],
]);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const median = xs => {const a=[...xs].sort((a,b)=>a-b);return a.length?(a[(a.length-1)>>1]+a[a.length>>1])/2:null;};
const quantile = (xs,p) => {const a=[...xs].sort((a,b)=>a-b),i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return a[lo]+(a[hi]-a[lo])*(i-lo);};
const mean = xs => xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:null;
export function bridgeSensing(snapshot, now=Date.now()) {
  const frame=snapshot?.latest,r=frame?.radio;
  const fresh=frame?.schema==='ruview.observatory.v1' && frame.capabilities?.complex_csi===false &&
    r?.source==='macos_corewlan' && r.available===true && r.source_state==='live_unverified' &&
    now-Date.parse(snapshot.received_at)<20000 && now-Date.parse(r.observed_at)<=15000 &&
    Date.parse(r.observed_at)<=now+10000 && finite(r.rssi_dbm) && r.rssi_dbm<0 && r.rssi_dbm>=-127;
  let history=[];
  if(fresh){
    const seen=new Set();
    for(const h of snapshot.history||[]){
      const t=Date.parse(h.observed);
      if(!finite(t)||t>now+1000||now-t>120000||!finite(h.rssi)||h.rssi>=0||h.rssi< -127||seen.has(t))continue;
      seen.add(t);history.push({observed:h.observed,time:t,rssi:h.rssi,noise:finite(h.noise)?h.noise:null,label:h.label??null});
    }
    history.sort((a,b)=>a.time-b.time);
    let start=0;for(let i=1;i<history.length;i++)if(history[i].time-history[i-1].time>15000)start=i;
    history=history.slice(start);
    // A current measurement not yet in a resynchronization must not reuse an old baseline.
    if(!history.length||Math.abs(history.at(-1).time-Date.parse(r.observed_at))>1000)history=[];
  }
  const values=history.map(h=>h.rssi),avg=mean(values);
  const variance=avg===null?null:mean(values.map(x=>(x-avg)**2));
  const gaps=history.slice(1).map((h,i)=>(h.time-history[i].time)/1000);
  const interval=median(gaps),recent=history.slice(-3),baseline=history.slice(0,-3);
  const sampleHz=history.length>1?(history.length-1)*1000/(history.at(-1).time-history[0].time):null;
  const regular=gaps.length>=3&&Math.max(...gaps)-Math.min(...gaps)<=.1*interval;
  let change={state:fresh?'collecting':'unavailable',delta_db:null,threshold_db:null,baseline_samples:baseline.length,recent_samples:recent.length};
  if(fresh&&baseline.length>=8&&recent.length===3){
    const center=median(baseline.map(h=>h.rssi));
    const mad=median(baseline.map(h=>Math.abs(h.rssi-center)));
    // Quantized/bimodal RSSI can have MAD=0 despite large spread. A percentile
    // guard keeps that noisy baseline from being treated as perfectly quiet.
    const base=baseline.map(h=>h.rssi),spread=Math.max(1.4826*mad,(quantile(base,.9)-quantile(base,.1))/2.563);
    const delta=median(recent.map(h=>h.rssi))-center,threshold=Math.max(3,3*spread);
    change={...change,state:Math.abs(delta)>threshold?'link_change':'stable_link',delta_db:delta,threshold_db:threshold};
  }
  return {schema:'ruview.bridge.sensing.v1',source:'macos_corewlan_scalar',source_state:fresh?'live':'unavailable',
    observed_at:r?.observed_at??null,collection:frame?.collection??null,
    features:{mean_rssi:fresh?avg:null,variance:null,motion_band_power:null,breathing_band_power:null,spectral_power:null,dominant_freq_hz:null},
    classification:{motion_level:'unavailable',presence:null,confidence:null},nodes:[],persons:null,pose_keypoints:null,vital_signs:null,signal_field:null,
    scalar:{rssi_dbm:fresh?r.rssi_dbm:null,noise_dbm:fresh&&finite(r.noise_dbm)?r.noise_dbm:null,
      snr_db:fresh&&finite(r.noise_dbm)?r.rssi_dbm-r.noise_dbm:null,power_nw:fresh?10**((r.rssi_dbm+60)/10):null,
      rssi_variance_db2:variance,sample_count:history.length,sample_interval_s:interval,sample_hz:sampleHz,sampling_regular:regular,nyquist_hz:regular?sampleHz/2:null},
    change,history,mesh:frame?.mesh??null,probes:frame?.probes??[],input_map:INPUT_MAP};
}
