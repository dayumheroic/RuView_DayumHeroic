import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanAssociations} from './associations.mjs';
import {attachmentView} from './association-ui.mjs';
const n='a'.repeat(24),other='b'.repeat(24),c='c'.repeat(24),now=Date.now(),time=new Date(now).toISOString();
const nodes=[{id:n,is_main:true,model:'M5'},{id:other,parent_id:n,model:'M4R'}],clients=[{id:c}];
function data(){return {source:'deco_node_filtered_client_list',observed_at:time,state:'collecting',failure_reason:null,
 node_observations:[{node_id:n,observed_at:time,client_count:1},{node_id:other,observed_at:time,client_count:0}],
 clients:[{client_id:c,node_id:n,observed_at:time,state:'last_observed',candidate_node_ids:[n],candidate_count:1}],events:[]};}
test('verified aliases and original observation times survive, arbitrary identifiers do not',()=>{
 const a=data();a.password='PRIVATE_MARKER';a.clients[0].mac='PRIVATE_MARKER';
 const clean=cleanAssociations(a,nodes,clients,now);assert(!JSON.stringify(clean).includes('PRIVATE_MARKER'));assert.equal(clean.clients[0].observed_at,time);
 assert.equal(cleanAssociations(undefined,nodes,clients,now),null);
});
test('dangling identities, wrong source, conflicts, duplicates and oversized arrays fail closed',()=>{
 for(const change of [a=>a.clients[0].node_id='d'.repeat(24),a=>a.clients[0].client_id='PRIVATE_MARKER',a=>a.source='guessed',
   a=>a.clients.push(a.clients[0]),a=>a.node_observations=Array(33).fill(a.node_observations[0]),a=>a.clients[0].state='ambiguous']){
  const a=data();change(a);assert.throws(()=>cleanAssociations(a,nodes,clients,now));
 }
});
test('UI attribution expires and stale source cannot claim live membership',()=>{
 const mesh={source_state:'live_unverified',observed_at:time,nodes,clients,associations:data()};
 let v=attachmentView(mesh,now);assert.equal(v.coverage,2);assert.equal(v.clients[0].node_id,n);assert.match(v.clients[0].node_label,/Main M5/);assert.equal(v.nodes[1].parent,'Main M5 · N1');
 v=attachmentView({...mesh,source_state:'stale'},now);assert.equal(v.live,false);assert.equal(v.clients[0].state,'stale');
 v=attachmentView(mesh,now+301000);assert.equal(v.coverage,0);assert.equal(v.clients[0].state,'unknown');assert.equal(v.clients[0].node_id,null);
});
test('ambiguous candidates stay unassigned; only explicit bounded attachment events render',()=>{
 const a=data();a.clients[0]={client_id:c,node_id:null,observed_at:null,state:'ambiguous',candidate_node_ids:[n,other],candidate_count:2};
 a.events=[{client_id:c,from_node_id:n,to_node_id:other,previous_observed_at:time,observed_at:time,kind:'observed_attachment_change'}];
 const v=attachmentView({source_state:'live_unverified',observed_at:time,nodes,clients,associations:cleanAssociations(a,nodes,clients,now)},now);
 assert.equal(v.clients[0].node_id,null);assert.equal(v.clients[0].state,'ambiguous');assert.equal(v.events.length,1);
 assert(!('presence' in v));
});
