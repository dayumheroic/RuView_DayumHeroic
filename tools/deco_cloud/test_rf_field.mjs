import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_FIELD,fieldParameters,fieldPower,fieldRadius,fieldAnchors,overlapAt,dbmToMilliwatts,powerRatio,FieldEvidence,trialSummary} from './rf-field.mjs';
test('dBm conversion preserves power ratios, not a distance or CSI claim',()=>{
  assert.equal(dbmToMilliwatts(0),1);assert.equal(dbmToMilliwatts(-30),.001);assert.equal(dbmToMilliwatts(-60),.000001);
  assert.equal(powerRatio(10),10);assert.equal(powerRatio(-10),.1);assert.equal(dbmToMilliwatts(Infinity),null);assert.equal(dbmToMilliwatts(-2000),null);
});
test('bounded log-distance assumptions have a threshold-consistent radius',()=>{
  const p={...DEFAULT_FIELD,reference:-40,threshold:-70,exponent:3};assert.equal(fieldRadius(p),1000);assert.equal(fieldPower(1000,0,p),-70);assert.equal(fieldPower(10,0,p),-40);assert.equal(fieldPower(1000,1,p),-82);
  assert.equal(fieldRadius({...p,reference:-80}),0);assert.throws(()=>fieldParameters({exponent:0}));assert.throws(()=>fieldParameters({reference:NaN}));assert.throws(()=>fieldPower(-1));
});
test('only owner-placed anchors enter the schematic field; raw qualities do not set radius',()=>{
  const plan={floors:[{id:'f1'},{id:'f2'}],rooms:[{id:'r1',floor_id:'f2',label:'Fixture',router_label:'Fixture',x:10,y:20,w:100,h:80,anchor:{x:.5,y:1,known:true}},
    {id:'r2',floor_id:'f1',anchor:{known:false}}]};
  const [a]=fieldAnchors(plan);assert.deepEqual([a.x,a.y,a.z],[60,300,100]);assert.equal(fieldAnchors(plan).length,1);
  const radius=fieldRadius();a.signal_5g=1;assert.equal(fieldRadius(),radius);assert.equal(overlapAt({...a,floor:1},[a]),1);assert.equal(overlapAt({...a,x:9999,floor:1},[a]),0);
});
test('overlap counts each modeled link against a threshold without adding dBm',()=>{
  const anchors=[{x:0,y:0,z:0,floor:0},{x:30,y:0,z:0,floor:0}];assert.equal(overlapAt({x:0,y:0,z:0,floor:0},anchors),2);assert.equal(overlapAt({x:0,y:300,z:0,floor:1},anchors),0);
});
test('quality-change evidence deduplicates timestamps, rejects stale/reversed values and resets with collection',()=>{
  const e=new FieldEvidence(),now=Date.now(),m=(t,q)=>({source_state:'live_unverified',observed_at:new Date(t).toISOString(),nodes:[{id:'node',room_id:'r1',signal_2g:q,signal_5g:null}]});
  assert.equal(e.update('one',m(now-5000,2),now).length,0);assert.equal(e.update('one',m(now-4000,3),now).length,1);
  assert.equal(e.update('one',m(now-4000,1),now).length,1);assert.equal(e.update('one',m(now-4500,1),now).length,1);assert.equal(e.update('one',m(now-100000,1),now).length,1);
  assert.equal(e.update('one',m(now+100000,1),now).length,1);assert.equal(e.update('one',m(now-3000,null),now).length,1);assert.equal(e.update('one',m(now-2000,1),now).length,1);
  assert.equal(e.update('two',m(now,1),now).length,0);
});
test('a labelled trial needs distinct source samples and both action windows',()=>{
  const now=Date.now(),start=now-100000,history=Array.from({length:16},(_,i)=>({observed:new Date(start+i*5000).toISOString(),rssi:i<8?-50:-53,label:i<8?'still':'walking'}));
  const v=trialSummary([...history,...history],start,now);assert.equal(v.ready,true);assert.equal(v.still.count,8);assert.equal(v.walking.count,8);assert.equal(v.medianShift,-3);assert.equal(v.still.variance,0);assert(Math.abs(v.powerRatio-.501187)<.000001);
  assert.equal(trialSummary(history.slice(0,8),start,now).ready,false);assert.equal(trialSummary(history,now,now).ready,false);
  assert.equal(trialSummary(history.map(s=>({...s,label:'unlabelled'})),start,now).ready,false);
  assert.equal(trialSummary(history.map(s=>({...s,observed:new Date(now+5000).toISOString()})),start,now).still.count,0);
});
