import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanFloorplan,floorplanView} from './floorplan.mjs';
const now=Date.now(),stamp=new Date(now).toISOString(),n='a'.repeat(24),other='b'.repeat(24),c='c'.repeat(24);
export function fixture(){return {schema:'ruview.floorplan.v1',title:'Synthetic plan',geometry:'schematic',basis:'owner_photos_and_notes',floors:[{id:'f1',label:'Test floor'}],rooms:[
  {id:'r1',floor_id:'f1',label:'Test room A',router_label:'Test node A',notes:'Synthetic fixture only',x:0,y:0,w:350,h:250,anchor:{x:.8,y:.7,known:true}},
  {id:'r2',floor_id:'f1',label:'Test room B',router_label:'Test node B',notes:'Placement unknown',x:400,y:0,w:350,h:250,anchor:{x:.5,y:.7,known:false}}],links:[{from:'r1',to:'r2',kind:'adjacent'}]};}
function mesh(){return {source_state:'live_unverified',observed_at:stamp,nodes:[{id:n,room_id:'r1'},{id:other,room_id:'r2'}],clients:[{id:c}],associations:{node_observations:[{node_id:n,observed_at:stamp},{node_id:other,observed_at:stamp}],clients:[{client_id:c,node_id:n,state:'last_observed',observed_at:stamp}],events:[]}};}
test('plan is rebuilt without arbitrary fields or photo data',()=>{const p=fixture();p.password='PRIVATE_MARKER';p.rooms[0].image='PRIVATE_MARKER';const clean=cleanFloorplan(p);assert(!JSON.stringify(clean).includes('PRIVATE_MARKER'));assert.equal(clean.geometry,'schematic');});
test('invalid geometry, oversized inventories, source claims and dangling links fail closed',()=>{
  for(const mutate of [p=>p.geometry='measured',p=>p.rooms[0].x=900,p=>p.rooms[0].anchor.x=2,p=>p.rooms[0].w=NaN,p=>p.rooms[0].label='<script>',p=>p.rooms.push(p.rooms[0]),p=>p.rooms[0].floor_id='missing',p=>p.links[0].to='missing',p=>p.rooms=Array(33).fill(p.rooms[0])]){const p=fixture();mutate(p);assert.throws(()=>cleanFloorplan(p));}
});
test('explicit opaque room binding maps attachments without inferring coordinates',()=>{const p=fixture(),v=floorplanView(p,mesh(),now);assert.equal(v.clients[0].room_id,'r1');assert.equal(v.rooms[0].clients.length,1);assert.equal(v.unmapped_nodes,0);assert.equal(v.rooms[0].x,p.rooms[0].x);assert(!('position' in v.clients[0]));});
test('stale, expired, unknown, conflicting and duplicate mappings remain explicit',()=>{
  const p=fixture();let m=mesh(),v=floorplanView(p,{...m,source_state:'stale'},now);assert.equal(v.clients[0].state,'stale');
  v=floorplanView(p,m,now+301000);assert.equal(v.clients[0].room_id,null);
  m=mesh();delete m.nodes[0].room_id;v=floorplanView(p,m,now);assert.equal(v.clients[0].room_id,null);assert.equal(v.unmapped_nodes,1);
  m=mesh();m.nodes[1].room_id='r1';v=floorplanView(p,m,now);assert.equal(v.clients[0].room_id,null);assert.equal(v.unmapped_nodes,2);
  m=mesh();m.associations.clients[0].state='ambiguous';v=floorplanView(p,m,now);assert.equal(v.clients[0].state,'ambiguous');assert.equal(v.clients[0].room_id,null);
  m=mesh();m.associations=null;assert.equal(floorplanView(p,m,now).clients[0].state,'unknown');
});
test('events are explicit source transitions with original times and mapped endpoints',()=>{
  const m=mesh();m.associations.events=[{client_id:c,from_node_id:n,to_node_id:other,previous_observed_at:stamp,observed_at:stamp}];
  const v=floorplanView(fixture(),m,now);assert.equal(v.events[0].from,'r1');assert.equal(v.events[0].to,'r2');assert.equal(v.events[0].observed_at,stamp);
  assert.equal(floorplanView(fixture(),m,now+901000).events.length,0);
});
test('an assigned room awaiting its node read cannot show an observed empty room',()=>{const m=mesh();m.associations.node_observations=[];const v=floorplanView(fixture(),m,now);assert.equal(v.coverage,0);assert.equal(v.rooms[0].report_at,null);assert.equal(v.clients[0].state,'unknown');assert.equal(v.clients[0].room_id,null);});
