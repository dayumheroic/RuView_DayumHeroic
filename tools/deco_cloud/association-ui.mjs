export function attachmentView(mesh,now=Date.now()){
  const nodes=mesh?.nodes||[],a=mesh?.associations,labels=new Map(nodes.map((n,i)=>[n.id,`${n.is_main?'Main ':''}${n.model||'Deco'} · N${i+1}`]));
  const age=t=>Number.isFinite(Date.parse(t))?Math.max(0,(now-Date.parse(t))/1000):Infinity;
  const live=mesh?.source_state==='live_unverified'&&age(mesh.observed_at)<=90;
  const groups=(a?.node_observations||[]).filter(g=>age(g.observed_at)<=300);
  const records=new Map((a?.clients||[]).map(c=>[c.client_id,c]));
  const clients=(mesh?.clients||[]).map(c=>{
    const r=records.get(c.id),usable=r?.state==='last_observed'&&labels.has(r.node_id)&&age(r.observed_at)<=300;
    return {id:c.id,node_id:usable?r.node_id:null,node_label:usable?labels.get(r.node_id):r?.state==='ambiguous'?`Ambiguous (${r.candidate_count} nodes)`:'Unknown',
      state:usable?(live?'last_observed':'stale'):r?.state==='ambiguous'?'ambiguous':'unknown',age_seconds:usable?Math.floor(age(r.observed_at)):null};
  });
  return {live,state:a?.state||'unavailable',coverage:groups.length,total:nodes.length,
    nodes:nodes.map(n=>({id:n.id,label:labels.get(n.id),parent:n.parent_id?labels.get(n.parent_id)||'Unknown':n.is_main?'Main node':'Unknown',
      clients:clients.filter(c=>c.node_id===n.id).map(c=>c.id)})),clients,
    events:(a?.events||[]).filter(e=>age(e.observed_at)<=900).map(e=>({client:e.client_id,from:labels.get(e.from_node_id)||'Unknown',to:labels.get(e.to_node_id)||'Unknown',observed_at:e.observed_at,previous_observed_at:e.previous_observed_at}))};
}
function cell(row,text){const td=document.createElement('td');td.textContent=String(text);row.append(td);}
export function renderAssociations(container,mesh){
  if(!container)return;
  const v=attachmentView(mesh);container.replaceChildren();
  const status=document.createElement('p');status.textContent=`${v.live?'Mesh live':'Mesh stale / unavailable'} · attachment coverage ${v.coverage}/${v.total} nodes · ${v.state}`;container.append(status);
  const description=document.createElement('p');description.textContent='Node-filtered Deco observations. Two nodes are queried per collection cycle, so an eight-node sweep takes at least four cycles. Times differ; last observed attachment is not a precise room location. Aliases are session-local.';container.append(description);
  const grid=document.createElement('div');grid.className='mesh-map';
  for(const n of v.nodes){const tile=document.createElement('article');tile.className='node';const title=document.createElement('strong');title.textContent=n.label;const line=document.createElement('p');line.textContent=`Parent: ${n.parent} · ${n.clients.length} uniquely attributed records`;tile.append(title,line);grid.append(tile);}grid.classList.add('bridge-cards');container.append(grid);
  const scroll=document.createElement('div');scroll.className='table-scroll bridge-scroll';const table=document.createElement('table');const header=document.createElement('tr');for(const h of ['Device alias','Deco last observed','State','Observation age'])cell(header,h);table.append(header);
  for(const c of v.clients){const row=document.createElement('tr');for(const x of [c.id.slice(0,12),c.node_label,c.state.replaceAll('_',' '),c.age_seconds===null?'—':`${c.age_seconds}s`])cell(row,x);table.append(row);}scroll.append(table);container.append(scroll);
  const heading=document.createElement('h3');heading.textContent='Observed attachment changes · last 15 minutes';container.append(heading);
  if(!v.events.length){const empty=document.createElement('p');empty.textContent='No verified attachment change observed in this collection session.';container.append(empty);}
  for(const e of v.events){const line=document.createElement('p');line.textContent=`${e.client.slice(0,12)}: ${e.from} → ${e.to}, observed between ${new Date(e.previous_observed_at).toLocaleTimeString()} and ${new Date(e.observed_at).toLocaleTimeString()}`;container.append(line);}
}
