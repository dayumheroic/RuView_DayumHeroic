import {cleanFloorplan,floorplanView} from './floorplan.mjs';
const NS='http://www.w3.org/2000/svg';
function el(tag,text,parent){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(parent)parent.append(e);return e;}
function svg(tag,attrs,parent,text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;if(parent)parent.append(e);return e;}
export class FloorplanUI{
  constructor(container){
    this.root=container;this.mesh=null;this.editing=false;this.version=0;this.plan=null;this.floor=null;
    el('h2','Your rooms · live Deco attachments',container);
    el('p','Owner-supplied schematic from room photos and notes. Room boxes and router markers are editable; they are not a radio scan or measured wall geometry.',container);
    this.status=el('p','Loading private layout…',container);this.status.setAttribute('role','status');
    this.controls=el('div',undefined,container);this.controls.className='floor-controls';
    this.floorSelect=el('select',undefined,this.controls);this.floorSelect.setAttribute('aria-label','Floor');this.floorSelect.onchange=()=>{this.floor=this.floorSelect.value;this.render();};
    this.editButton=this.button('Edit layout',()=>this.edit(),this.controls);
    this.saveButton=this.button('Save layout',()=>this.save(),this.controls);
    this.cancelButton=this.button('Cancel edits',()=>this.cancel(),this.controls);
    this.undoButton=this.button('Undo last save',()=>this.undo(),this.controls);
    this.button('Download layout',()=>this.download(),this.controls);
    this.canvas=svg('svg',{viewBox:'0 0 1000 700',role:'img','aria-label':'Schematic floor plan with Deco attachment counts'},container);this.canvas.classList.add('floor-canvas');
    this.details=el('div',undefined,container);this.details.className='floor-details';
    this.editor=el('div',undefined,container);this.editor.className='floor-editor';
    this.timer=setInterval(()=>{if(!this.editing)this.load();},60000);
    this.load();
  }
  button(label,fn,parent){const b=el('button',label,parent);b.type='button';b.onclick=fn;return b;}
  async request(method='GET',body=null,path='/api/floorplan'){
    const r=await fetch(path,{method,credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000),...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    if(r.status===401)throw Error('Sign in again to access the private layout.');
    if(r.status===409)throw Error('Layout changed in another session. Cancel edits and reload before saving.');
    if(!r.ok)throw Error('Layout request failed. Your edits are still here.');return r.json();
  }
  async load(){try{const v=await this.request();if(this.editing)return;this.plan=v.plan?cleanFloorplan(v.plan):null;this.version=v.version;this.owner=v.can_edit===true;this.canUndo=v.can_undo===true;this.render();}catch(e){this.status.textContent=e.message;}}
  update(mesh){this.mesh=mesh;if(!this.editing)this.render();}
  edit(){if(!this.owner||!this.plan)return;this.editing=true;this.selected=this.plan.rooms.find(r=>r.floor_id===this.floor)?.id;this.render();}
  async cancel(){this.editing=false;await this.load();}
  async save(){try{const plan=cleanFloorplan(this.plan);await this.request('PUT',{expected_version:this.version,plan});this.editing=false;await this.load();}catch(e){this.status.textContent=e.message;}}
  async undo(){try{await this.request('POST',{expected_version:this.version},'/api/floorplan/undo');await this.load();}catch(e){this.status.textContent=e.message;}}
  download(){if(!this.plan)return;const u=URL.createObjectURL(new Blob([JSON.stringify(this.plan,null,2)],{type:'application/json'}));const a=el('a');a.href=u;a.download='private-floorplan.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  render(){
    this.editButton.hidden=!this.owner||this.editing;this.saveButton.hidden=!this.editing;this.cancelButton.hidden=!this.editing;this.undoButton.hidden=!this.owner||!this.canUndo||this.editing;
    this.canvas.replaceChildren();this.details.replaceChildren();this.editor.replaceChildren();
    if(!this.plan){this.status.textContent='No private floor plan configured yet.';return;}
    const options=this.plan.floors.map(f=>f.id).join(',');if(this.floorSelect.dataset.options!==options){this.floorSelect.replaceChildren();for(const f of this.plan.floors){const o=el('option',f.label,this.floorSelect);o.value=f.id;}this.floorSelect.dataset.options=options;}
    if(!this.plan.floors.some(f=>f.id===this.floor))this.floor=this.plan.floors[0].id;this.floorSelect.value=this.floor;
    const v=floorplanView(this.plan,this.mesh);this.status.textContent=this.editing?'Editing schematic · drag a room or its router marker, or use the fields below. Save to sync across devices.':`${v.live?'Live mesh':'Mesh stale / unavailable'} · node reads ${v.coverage}/${v.total_nodes} · ${v.unmapped_nodes} unassigned nodes · schematic layout · revision ${this.version}`;
    const visible=v.rooms.filter(r=>r.floor_id===this.floor),byId=new Map(v.rooms.map(r=>[r.id,r]));
    for(const link of this.plan.links){const a=byId.get(link.from),b=byId.get(link.to);if(a.floor_id!==this.floor||b.floor_id!==this.floor)continue;svg('line',{x1:a.x+a.w/2,y1:a.y+a.h/2,x2:b.x+b.w/2,y2:b.y+b.h/2,class:'floor-adjacency'},this.canvas);}
    for(const r of visible){
      const g=svg('g',{transform:`translate(${r.x} ${r.y})`},this.canvas);
      const box=svg('rect',{width:r.w,height:r.h,rx:12,class:`floor-room${this.editing&&this.selected===r.id?' selected':''}`},g);
      svg('title',{},g,r.notes);
      svg('text',{x:14,y:30,class:'floor-room-label'},g,r.label);
      svg('text',{x:14,y:54,class:'floor-room-sub'},g,`Deco: ${r.router_label}`);
      svg('text',{x:14,y:78,class:'floor-room-sub'},g,r.node?(r.report_at?`${r.clients.length} last-reported devices${v.live?'':' · stale'}`:'Attachment read pending / expired'):r.conflicting_nodes?'Conflicting router mapping':'Router not yet matched');
      if(r.report_at)svg('text',{x:14,y:100,class:'floor-room-sub'},g,`Node read ${Math.floor((Date.now()-Date.parse(r.report_at))/1000)}s ago`);
      const anchor=svg('circle',{cx:r.anchor.x*r.w,cy:r.anchor.y*r.h,r:11,class:r.anchor.known?'floor-router':'floor-router uncertain'},g);
      svg('title',{},anchor,r.anchor.known?'Owner-described approximate router placement':'Router position unspecified; marker is a placeholder');
      if(this.editing){box.setAttribute('tabindex','0');box.setAttribute('role','button');box.setAttribute('aria-label',`Edit ${r.label}`);box.onclick=()=>{this.selected=r.id;this.render();};box.onkeydown=e=>{if(e.key==='Enter'){this.selected=r.id;this.render();}};
        this.drag(box,r.id,false);this.drag(anchor,r.id,true);}
    }
    const names=new Map(this.plan.rooms.map(r=>[r.id,r.label]));
    el('p','Counts group devices beside the Deco that last reported them. The marker is a router anchor, not a device/person position. Solid links show owner-described adjacency only.',this.details);
    for(const r of visible){const d=el('details',undefined,this.details);el('summary',r.label,d);el('p',r.notes,d);el('p',r.anchor.known?'Router placement is approximate.':'Exact router placement is still unspecified.',d);}
    const rows=v.clients.filter(c=>!c.room_id||visible.some(r=>r.id===c.room_id));
    const wrap=el('div',undefined,this.details);wrap.className='bridge-scroll';const table=el('table',undefined,wrap);const header=el('tr',undefined,table);for(const h of ['Device alias','Last-reported room','State'])el('th',h,header);
    for(const c of rows){const row=el('tr',undefined,table);for(const x of [c.id.slice(0,12),names.get(c.room_id)||'Unknown / conflicting',c.state.replaceAll('_',' ')])el('td',x,row);}
    el('h3','Observed attachment changes',this.details);
    if(!v.events.length)el('p','No mapped attachment change observed within the retained history.',this.details);
    for(const e of v.events.slice(-12))el('p',`${e.client_id.slice(0,12)}: ${names.get(e.from)} → ${names.get(e.to)}, observed between ${new Date(e.previous_observed_at).toLocaleTimeString()} and ${new Date(e.observed_at).toLocaleTimeString()}`,this.details);
    if(this.editing)this.renderEditor();
  }
  drag(target,id,anchor){
    target.style.touchAction='none';
    target.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();this.selected=id;const r=this.plan.rooms.find(r=>r.id===id);const inverse=this.canvas.getScreenCTM()?.inverse();if(!inverse)return;
      const start=new DOMPoint(e.clientX,e.clientY).matrixTransform(inverse),old={...r,anchor:{...r.anchor}};target.setPointerCapture(e.pointerId);
      target.onpointermove=move=>{const p=new DOMPoint(move.clientX,move.clientY).matrixTransform(inverse);if(anchor){r.anchor.x=Math.max(.03,Math.min(.97,old.anchor.x+(p.x-start.x)/r.w));r.anchor.y=Math.max(.03,Math.min(.97,old.anchor.y+(p.y-start.y)/r.h));target.setAttribute('cx',String(r.anchor.x*r.w));target.setAttribute('cy',String(r.anchor.y*r.h));}
        else{r.x=Math.round(Math.max(0,Math.min(1000-r.w,old.x+p.x-start.x)));r.y=Math.round(Math.max(0,Math.min(700-r.h,old.y+p.y-start.y)));target.parentElement.setAttribute('transform',`translate(${r.x} ${r.y})`);}};
      const finish=()=>{target.onpointermove=null;target.onpointerup=null;target.onpointercancel=null;this.render();};target.onpointerup=finish;target.onpointercancel=finish;
    };
  }
  renderEditor(){
    const r=this.plan.rooms.find(r=>r.id===this.selected);if(!r)return;
    el('h3',`Edit ${r.label}`,this.editor);
    for(const [key,label,max] of [['label','Room name',80],['router_label','Router label',80],['notes','Placement notes',600]]){const field=el('label',label,this.editor);const input=el('input',undefined,field);input.value=r[key];input.maxLength=max;input.onchange=()=>{r[key]=input.value;this.render();};}
    for(const [key,label,max] of [['x','Room X',1000-r.w],['y','Room Y',700-r.h],['w','Room width',1000-r.x],['h','Room height',700-r.y]]){const field=el('label',label,this.editor);const input=el('input',undefined,field);input.type='number';input.min=['w','h'].includes(key)?'80':'0';input.max=String(max);input.value=r[key];input.onchange=()=>{if(input.checkValidity()){r[key]=Number(input.value);this.render();}};}
    const field=el('label','Router location described by owner',this.editor),check=el('input',undefined,field);check.type='checkbox';check.checked=r.anchor.known;check.onchange=()=>{r.anchor.known=check.checked;this.render();};
    el('p','Coordinates are schematic drawing units. They are not measured distances. Click another room to edit it.',this.editor);
  }
  dispose(){clearInterval(this.timer);}
}
