const validId=x=>typeof x==='string'&&/^[a-f0-9]{24}$/.test(x);
function timestamp(x,now){if(typeof x!=='string'||x.length>40||!Number.isFinite(Date.parse(x))||Date.parse(x)>now+10000)throw Error('Association time');return x;}
function identity(x,known){if(!validId(x)||known&&!known.has(x))throw Error('Association identity');return x;}
function array(x,max){if(!Array.isArray(x)||x.length>max)throw Error('Association bound');return x;}
export function cleanAssociations(value,nodes,clients,now){
  if(value===null||value===undefined)return null;
  if(value.source!=='deco_node_filtered_client_list'||!['collecting','stopped'].includes(value.state)||![null,'inventory_schema','filtered_read_failed'].includes(value.failure_reason))throw Error('Association source');
  const nodeIds=new Set((nodes||[]).map(x=>x.id)),clientIds=new Set((clients||[]).map(x=>x.id));
  const groups=array(value.node_observations,32).map(g=>{
    if(!Number.isInteger(g.client_count)||g.client_count<0||g.client_count>128)throw Error('Association count');
    return {node_id:identity(g.node_id,nodeIds),observed_at:timestamp(g.observed_at,now),client_count:g.client_count};
  });
  const records=array(value.clients,128).map(c=>{
    if(!['last_observed','ambiguous','unknown'].includes(c.state))throw Error('Association state');
    const candidates=array(c.candidate_node_ids,4).map(x=>identity(x,nodeIds));
    if(new Set(candidates).size!==candidates.length||!Number.isInteger(c.candidate_count)||c.candidate_count<candidates.length||c.candidate_count>32)throw Error('Association candidates');
    const node=c.node_id===null?null:identity(c.node_id,nodeIds),time=c.observed_at===null?null:timestamp(c.observed_at,now);
    if(c.state==='last_observed'&&(!node||!time||c.candidate_count!==1||candidates[0]!==node))throw Error('Association membership');
    if(c.state!=='last_observed'&&(node!==null||time!==null))throw Error('Association unknown');
    if(c.state==='unknown'&&c.candidate_count!==0||c.state==='ambiguous'&&c.candidate_count<2)throw Error('Association conflict');
    return {client_id:identity(c.client_id,clientIds),node_id:node,observed_at:time,state:c.state,candidate_node_ids:candidates,candidate_count:c.candidate_count};
  });
  const events=array(value.events,32).map(e=>{
    if(e.kind!=='observed_attachment_change'||e.from_node_id===e.to_node_id)throw Error('Association event');
    const previous=timestamp(e.previous_observed_at,now),observed=timestamp(e.observed_at,now);
    if(Date.parse(previous)>Date.parse(observed))throw Error('Association order');
    return {client_id:identity(e.client_id),from_node_id:identity(e.from_node_id,nodeIds),to_node_id:identity(e.to_node_id,nodeIds),previous_observed_at:previous,observed_at:observed,kind:e.kind};
  });
  if(new Set(groups.map(g=>g.node_id)).size!==groups.length||new Set(records.map(c=>c.client_id)).size!==records.length)throw Error('Association duplicate');
  return {source:value.source,observed_at:timestamp(value.observed_at,now),state:value.state,failure_reason:value.failure_reason,node_observations:groups,clients:records,events};
}
