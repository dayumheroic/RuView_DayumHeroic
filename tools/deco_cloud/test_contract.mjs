import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanFrame,CAPABILITIES,powerNanowatts,signalToDbm,viewerForHash,summarizeRadio} from './contract.mjs';
const time='2026-10-17T04:00:00.000Z',now=Date.parse(time);
function frame(){return {schema:'ruview.observatory.v1',collection:'a'.repeat(32),sequence:1,sent_at:time,connection:'connected',capabilities:{...CAPABILITIES},
 radio:{source:'macos_corewlan',source_state:'live_unverified',observed_at:time,available:true,rssi_dbm:-60,noise_dbm:-90,channel:44,transmit_rate_mbps:866},
 mesh:{source_state:'live_unverified',observed_at:time,nodes:[{id:'b'.repeat(24),online:true,down_raw:0,up_raw:0,signal_2g:0,signal_5g:3}],clients:[]},probes:[]};}
test('known dBm/power and SNR vectors; ordinal levels have no invented inverse',()=>{
 assert.equal(powerNanowatts(-60),1);assert.equal(powerNanowatts(-30),1000);assert.equal(powerNanowatts(-90),.001);
 assert.equal(summarizeRadio({rssi_dbm:-60,noise_dbm:-90}).snr_db,30);
 for(const n of [0,1,2,3,null])assert.equal(signalToDbm(n),null);
 assert.throws(()=>powerNanowatts(Infinity));
});
test('export removes arbitrary nested secret and identity fields while preserving zero/unknown',()=>{
 const v=frame();v.target={password:'PRIVATE_MARKER'};v.radio.ssid='PRIVATE_MARKER';v.mesh.nodes[0].mac='PRIVATE_MARKER';v.mesh.clients=null;
 const r=cleanFrame(v,now);assert(!JSON.stringify(r).includes('PRIVATE_MARKER'));assert.equal(r.mesh.clients,null);assert.equal(r.mesh.nodes[0].signal_2g,0);
});
test('invalid, duplicate, oversized or synthetic inputs fail closed',()=>{
 for(const mutate of [v=>v.radio.rssi_dbm=NaN,v=>v.radio.channel=true,v=>v.mesh.source_state='synthetic',v=>v.mesh.nodes.push(v.mesh.nodes[0]),v=>v.mesh.clients=Array(129).fill(v.mesh.nodes[0]),v=>v.capabilities.complex_csi=true,v=>v.sent_at='invalid',v=>v.radio.available=false,v=>v.radio.observed_at='2026-10-18T04:00:00Z']){
  const v=frame();mutate(v);assert.throws(()=>cleanFrame(v,now));
 }
 assert.throws(()=>cleanFrame(frame(),now+120001));
});
test('probe timing is separate and unknown loss is preserved',()=>{
 const v=frame();v.probes=[{id:'probe-1',kind:'gateway',observed_at:time,rtt_ms:null,loss_percent:null,ip:'PRIVATE_MARKER'}];
 const r=cleanFrame(v,now);assert.equal(r.probes[0].loss_percent,null);assert(!JSON.stringify(r).includes('PRIVATE_MARKER'));
});
test('viewer invitations require a configured unexpired role/hash; revocation removes access',()=>{
 const e={hash:'a'.repeat(64),role:'viewer',expires:now+1000};assert.equal(viewerForHash(e.hash,[e],now),e);
 assert.equal(viewerForHash(e.hash,[],now),null);assert.equal(viewerForHash(e.hash,[e],now+1001),null);assert.equal(viewerForHash(e.hash,[{...e,role:'publisher'}],now),null);
});
