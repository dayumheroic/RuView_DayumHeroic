// Owner-authored schematic geometry. Never inferred from RF measurements.
const slug=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,31}$/.test(x);
function text(x,max){if(typeof x!=='string'||!x.trim()||x.length>max||/[\u0000-\u001f<>]/u.test(x))throw Error('Plan text');return x.trim();}
function num(x,lo,hi){if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)throw Error('Plan geometry');return x;}
function list(x,max){if(!Array.isArray(x)||x.length>max)throw Error('Plan bound');return x;}
function id(x){if(!slug(x))throw Error('Plan identity');return x;}
export function cleanFloorplan(value){
  if(!value||value.schema!=='ruview.floorplan.v1'||value.geometry!=='schematic'||value.basis!=='owner_photos_and_notes')throw Error('Plan source');
  const floors=list(value.floors,4).map(f=>({id:id(f.id),label:text(f.label,64)}));
  if(!floors.length||new Set(floors.map(f=>f.id)).size!==floors.length)throw Error('Plan floors');
  const floorIds=new Set(floors.map(f=>f.id));
  const rooms=list(value.rooms,32).map(r=>{
    if(!floorIds.has(r.floor_id))throw Error('Plan floor reference');
    const x=num(r.x,0,1000),y=num(r.y,0,700),w=num(r.w,80,1000),h=num(r.h,80,700);
    if(x+w>1000||y+h>700||typeof r.anchor?.known!=='boolean')throw Error('Plan bounds');
    return {id:id(r.id),floor_id:r.floor_id,label:text(r.label,80),router_label:text(r.router_label,80),
      notes:text(r.notes,600),x,y,w,h,anchor:{x:num(r.anchor.x,0,1),y:num(r.anchor.y,0,1),known:r.anchor.known}};
  });
  if(new Set(rooms.map(r=>r.id)).size!==rooms.length)throw Error('Plan duplicate rooms');
  const roomIds=new Set(rooms.map(r=>r.id));
  const links=list(value.links,48).map(e=>{
    if(!roomIds.has(e.from)||!roomIds.has(e.to)||e.from===e.to||!['adjacent','doorway','stairs'].includes(e.kind))throw Error('Plan link');
    return {from:e.from,to:e.to,kind:e.kind};
  });
  return {schema:value.schema,title:text(value.title,80),geometry:'schematic',basis:'owner_photos_and_notes',floors,rooms,links};
}
export function floorplanView(plan,mesh,now=Date.now()){
  const nodes=mesh?.nodes||[],a=mesh?.associations;
  const age=t=>Number.isFinite(Date.parse(t))?Math.max(0,(now-Date.parse(t))/1000):Infinity;
  const live=mesh?.source_state==='live_unverified'&&age(mesh.observed_at)<=90;
  const knownRooms=new Set(plan.rooms.map(r=>r.id));
  const reports=new Map((a?.node_observations||[]).filter(g=>age(g.observed_at)<=300).map(g=>[g.node_id,g.observed_at]));
  const buckets=new Map(plan.rooms.map(r=>[r.id,[]]));
  for(const n of nodes)if(knownRooms.has(n.room_id))buckets.get(n.room_id).push(n);
  // Duplicate room assignments stay unresolved instead of merging identities.
  const nodeRooms=new Map();
  for(const [room,items] of buckets)if(items.length===1)nodeRooms.set(items[0].id,room);
  const current=new Set((mesh?.clients||[]).map(c=>c.id));
  const records=new Map((a?.clients||[]).map(c=>[c.client_id,c]));
  const clients=[...current].map(client_id=>{
    const c=records.get(client_id)||{client_id,state:'unknown'};
    const usable=c.state==='last_observed'&&age(c.observed_at)<=300&&nodeRooms.has(c.node_id)&&reports.has(c.node_id);
    return {id:c.client_id,room_id:usable?nodeRooms.get(c.node_id):null,state:usable?(live?'last_observed':'stale'):c.state==='ambiguous'?'ambiguous':'unknown',observed_at:usable?c.observed_at:null};
  });
  return {live,coverage:nodes.filter(n=>reports.has(n.id)).length,total_nodes:nodes.length,rooms:plan.rooms.map(r=>({...r,node:buckets.get(r.id).length===1?buckets.get(r.id)[0]:null,
    report_at:buckets.get(r.id).length===1?reports.get(buckets.get(r.id)[0].id)||null:null,
    conflicting_nodes:buckets.get(r.id).length>1,clients:clients.filter(c=>c.room_id===r.id)})),clients,
    unmapped_nodes:nodes.filter(n=>!nodeRooms.has(n.id)).length,
    events:(a?.events||[]).filter(e=>age(e.observed_at)<=900&&nodeRooms.has(e.from_node_id)&&nodeRooms.has(e.to_node_id)).map(e=>({client_id:e.client_id,from:nodeRooms.get(e.from_node_id),to:nodeRooms.get(e.to_node_id),observed_at:e.observed_at,previous_observed_at:e.previous_observed_at}))};
}
