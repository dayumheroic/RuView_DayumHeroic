// Coverage is an explicit model in schematic units, never a measured RF map.
export const DEFAULT_FIELD=Object.freeze({reference:-45,exponent:3,threshold:-58,floorGap:300,floorLoss:12});
export function fieldParameters(p={}){
  const limits={reference:[-80,-20],exponent:[1.5,5],threshold:[-85,-45],floorGap:[100,600],floorLoss:[0,30]};
  return Object.fromEntries(Object.entries(limits).map(([k,[lo,hi]])=>{const n=p[k]??DEFAULT_FIELD[k];if(!Number.isFinite(n)||n<lo||n>hi)throw Error('Field parameter bounds');return [k,n];}));
}
export const dbmToMilliwatts=dbm=>Number.isFinite(dbm)&&dbm>=-1200&&dbm<=300?10**(dbm/10):null;
export const powerRatio=deltaDb=>Number.isFinite(deltaDb)&&Math.abs(deltaDb)<=300?10**(deltaDb/10):null;
export function fieldRadius(parameters=DEFAULT_FIELD){const p=fieldParameters(parameters);return p.reference<p.threshold?0:100*10**((p.reference-p.threshold)/(10*p.exponent));}
export function fieldPower(distance,floorDelta=0,parameters=DEFAULT_FIELD){
  const p=fieldParameters(parameters);
  if(!Number.isFinite(distance)||distance<0||!Number.isFinite(floorDelta))throw Error('Field distance');
  return p.reference-10*p.exponent*Math.log10(Math.max(100,distance)/100)-p.floorLoss*Math.abs(floorDelta);
}
export function fieldAnchors(plan,parameters=DEFAULT_FIELD){
  const p=fieldParameters(parameters),floors=new Map(plan.floors.map((f,i)=>[f.id,i]));
  return plan.rooms.filter(r=>r.anchor.known&&floors.has(r.floor_id)).map(r=>({
    room:r.id,label:r.label,router:r.router_label,floor:floors.get(r.floor_id),
    x:r.x+r.anchor.x*r.w,y:floors.get(r.floor_id)*p.floorGap,z:r.y+r.anchor.y*r.h
  }));
}
export function overlapAt(point,anchors,parameters=DEFAULT_FIELD){
  const p=fieldParameters(parameters);
  return anchors.filter(a=>fieldPower(Math.hypot(point.x-a.x,point.y-a.y,point.z-a.z),point.floor-a.floor,p)>=p.threshold).length;
}
export const median=values=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b),i=Math.floor(s.length/2);return s.length%2?s[i]:(s[i-1]+s[i])/2;};
const quality=x=>Number.isFinite(x)&&x>=0&&x<=100?x:null;
export class FieldEvidence{
  constructor(){this.collection=null;this.at=-Infinity;this.previous=new Map();this.events=[];}
  update(collection,mesh,now=Date.now()){
    if(collection!==this.collection){this.collection=collection;this.at=-Infinity;this.previous.clear();this.events=[];}
    const time=Date.parse(mesh?.observed_at);
    if(mesh?.source_state!=='live_unverified'||!Number.isFinite(time)||time>now+1000||now-time>90000||time<=this.at)return this.events;
    this.at=time;
    for(const node of mesh.nodes||[]){
      const next=[quality(node.signal_2g),quality(node.signal_5g)],prev=this.previous.get(node.id);
      const changes=prev?next.flatMap((n,i)=>n!==null&&prev[i]!==null&&n!==prev[i]?[{band:i===0?'2.4 GHz':'5 GHz',before:prev[i],after:n}]:[]):[];
      if(changes.length)this.events.push({node_id:node.id,room_id:node.room_id,observed_at:mesh.observed_at,changes});
      this.previous.set(node.id,next);
    }
    this.events=this.events.filter(e=>now-Date.parse(e.observed_at)<=900000).slice(-100);
    return this.events;
  }
}
export function trialSummary(history,start,now=Date.now()){
  const unique=new Map();
  for(const s of history||[]){const t=Date.parse(s.observed);if(t>=start&&t<=now&&now-t<=900000&&Number.isFinite(s.rssi)&&s.rssi>=-120&&s.rssi<=0&&['still','walking'].includes(s.label)&&!unique.has(t))unique.set(t,s);}
  const rows={};
  for(const label of ['still','walking']){
    const samples=[...unique.entries()].filter(([,s])=>s.label===label).sort((a,b)=>a[0]-b[0]);
    const values=samples.map(([,s])=>s.rssi),center=median(values);
    rows[label]={count:values.length,span:samples.length?(samples.at(-1)[0]-samples[0][0])/1000:0,median:center,
      mad:center===null?null:median(values.map(x=>Math.abs(x-center))),
      variance:values.length?values.reduce((a,x)=>a+(x-values.reduce((a,b)=>a+b,0)/values.length)**2,0)/values.length:null};
  }
  const ready=Object.values(rows).every(r=>r.count>=8&&r.span>=30);
  return {...rows,ready,medianShift:ready?rows.walking.median-rows.still.median:null,
    powerRatio:ready?powerRatio(rows.walking.median-rows.still.median):null};
}
