import test from 'node:test';
import assert from 'node:assert/strict';
import {bridgeSensing} from '../../ui/services/deco-sensing.mjs';
const now=Date.parse('2026-10-17T12:00:00Z');
const iso=t=>new Date(t).toISOString();
function fixture(values=Array(16).fill(-50)){
  return {received_at:iso(now),latest:{schema:'ruview.observatory.v1',collection:'a'.repeat(32),capabilities:{complex_csi:false},
    radio:{source:'macos_corewlan',available:true,source_state:'live_unverified',observed_at:iso(now),rssi_dbm:values.at(-1),noise_dbm:-90},mesh:null,probes:[]},
    history:values.map((rssi,i)=>({observed:iso(now-(values.length-1-i)*5000),rssi,noise:-90}))};
}
test('scalar mapping keeps CSI, occupancy and pose unknown; units and cadence are explicit',()=>{
  const v=bridgeSensing(fixture(),now);assert.equal(v.source_state,'live');assert.equal(v.features.mean_rssi,-50);
  assert.equal(v.scalar.sample_hz,.2);assert.equal(v.scalar.nyquist_hz,.1);assert.equal(v.scalar.rssi_variance_db2,0);
  assert.equal(v.scalar.power_nw,10);assert.equal(v.scalar.snr_db,40);assert.equal(v.change.state,'stable_link');
  for(const key of ['variance','motion_band_power','breathing_band_power','spectral_power'])assert.equal(v.features[key],null);
  assert.equal(v.classification.presence,null);assert.equal(v.persons,null);assert.equal(v.pose_keypoints,null);assert.equal(v.signal_field,null);
});
test('controlled scalar step is a link change, with no human-motion classification',()=>{
  const v=bridgeSensing(fixture([...Array(13).fill(-50),-60,-60,-60]),now);
  assert.equal(v.change.state,'link_change');assert.equal(v.change.delta_db,-10);assert.equal(v.change.threshold_db,3);
  assert.equal(v.classification.motion_level,'unavailable');
  const reverse=bridgeSensing(fixture([...Array(13).fill(-60),-50,-50,-50]),now);assert.equal(reverse.change.state,'link_change');
});
test('noisy baseline raises threshold; insufficient samples remain collecting',()=>{
  const noisy=bridgeSensing(fixture([-40,-60,-40,-60,-40,-60,-40,-60,-40,-60,-40,-60,-40,-55,-55,-55]),now);
  assert(noisy.change.threshold_db>3);assert.equal(noisy.change.state,'stable_link');
  assert.equal(bridgeSensing(fixture([-50,-50]),now).change.state,'collecting');
});
test('stale, malformed or synthetic radio cannot produce a current sensing picture',()=>{
  for(const mutate of [s=>s.received_at=iso(now-21000),s=>s.latest.radio.observed_at=iso(now-16000),s=>s.latest.radio.source='simulated',s=>s.latest.radio.rssi_dbm=0,s=>s.latest.radio.rssi_dbm=true,s=>s.latest.capabilities.complex_csi=true]){
    const s=fixture();mutate(s);const v=bridgeSensing(s,now);assert.equal(v.source_state,'unavailable');assert.equal(v.scalar.rssi_dbm,null);assert.equal(v.change.state,'unavailable');assert.deepEqual(v.history,[]);
  }
  assert.equal(bridgeSensing(null,now).source_state,'unavailable');
});
test('duplicates, missing current samples and time gaps cannot fabricate acquisition rate or a baseline',()=>{
  const s=fixture();s.history.push(s.history.at(-1));assert.equal(bridgeSensing(s,now).scalar.sample_count,16);
  s.history=s.history.slice(0,-2);assert.equal(bridgeSensing(s,now).scalar.sample_count,0);
  const gap=fixture();gap.history=gap.history.filter((_,i)=>i<8||i>12);
  const v=bridgeSensing(gap,now);assert.equal(v.scalar.sample_count,3);assert.equal(v.change.state,'collecting');
  const irregular=fixture();irregular.history.splice(6,1);const w=bridgeSensing(irregular,now);
  assert.equal(w.scalar.nyquist_hz,null);assert.equal(w.scalar.sampling_regular,false);assert(w.scalar.sample_hz<.2);
});
