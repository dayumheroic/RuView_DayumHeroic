import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {cleanFloorplan,floorplanView} from './floorplan.mjs';
import {DEFAULT_FIELD,fieldParameters,fieldAnchors,fieldRadius,overlapAt,FieldEvidence,trialSummary,dbmToMilliwatts} from './rf-field.mjs';
const make=(tag,text,parent)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent?.append(e);return e;};
const format=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const COLORS=[0x38d6c6,0xffb25c,0x96a5ff,0xf287b7];
export class RFFieldUI{
  constructor(root){
    this.root=root;this.params={...DEFAULT_FIELD};this.evidence=new FieldEvidence();this.snapshot=null;this.view=null;this.plan=null;this.owner=false;this.start=null;this.trialCollection=null;
    make('h2','Your mesh · fields and observed changes',root);
    make('p','Explore all router anchors in 3D. Spheres show an adjustable coverage model; live highlights show reported changes. Drag to orbit, pinch or scroll to zoom.',root);
    this.status=make('p','Loading private room anchors…',root);this.status.setAttribute('role','status');
    this.stage=make('div',undefined,root);this.stage.className='rf-stage';
    const badge=make('p','MODELED COVERAGE · UNCALIBRATED',this.stage);badge.className='rf-model-badge';
    this.viewport=make('div',undefined,this.stage);this.viewport.className='rf-viewport';this.viewport.setAttribute('aria-label','Interactive 3D router coverage model');
    this.legend=make('p',undefined,root);this.legend.className='rf-legend';
    const controls=make('div',undefined,root);controls.className='rf-controls';
    this.floor=make('select',undefined,controls);this.floor.setAttribute('aria-label','RF field floor');this.floor.onchange=()=>this.draw();
    this.button('Reset camera',()=>{this.camera?.position.set(1450,1150,1500);this.orbit?.target.set(500,140,350);this.orbit?.update();this.render();},controls);
    this.coverage=make('input',undefined,controls);this.coverage.type='checkbox';this.coverage.checked=true;this.coverage.id='rf-show-spheres';const coverageLabel=make('label','Coverage spheres',controls);coverageLabel.htmlFor=this.coverage.id;this.coverage.onchange=()=>this.draw();
    const details=make('details',undefined,root);make('summary','Coverage assumptions and formula',details);
    make('p','Coordinates and floor spacing are schematic drawing units. Room alignment, wall losses, transmit power and antenna patterns have not been measured. The spheres assume the same isotropic reference for each router; they are not inferred from the Mac’s RSSI.',details);
    const knobs=make('div',undefined,details);knobs.className='rf-controls';
    for(const [key,title,min,max,step] of [['reference','Assumed reference dBm at 100 units',-80,-20,1],['exponent','Assumed path-loss exponent',1.5,5,.1],['threshold','Coverage threshold dBm',-85,-45,1],['floorGap','Schematic floor spacing',100,600,10],['floorLoss','Additional loss per floor dB',0,30,1]]){
      const label=make('label',title,knobs),input=make('input',undefined,label);input.type='number';Object.assign(input,{min:String(min),max:String(max),step:String(step),value:String(this.params[key])});
      input.onchange=()=>{if(input.checkValidity()){try{this.params=fieldParameters({...this.params,[key]:Number(input.value)});this.draw();}catch{input.value=String(this.params[key]);}}};
    }
    this.formula=make('p',undefined,details);
    const columns=make('div',undefined,root);columns.className='rf-columns';
    const signals=make('article',undefined,columns);make('h3','Measured signal changes',signals);this.radio=make('p','Waiting for the Mac radio observation.',signals);
    make('p','Mac RSSI belongs to one associated link. Its Deco identity and receiver coordinates are unknown, so it is not placed on every router. A change can come from movement, traffic, interference or roaming.',signals);
    this.events=make('div',undefined,signals);this.nodes=make('div',undefined,root);this.nodes.className='rf-node-grid';
    const trials=make('article',undefined,columns);make('h3','Test movement against a still baseline',trials);
    make('p','Leave this Mac stationary. Mark still and stay still for about 90 seconds; then mark walking and walk nearby for 90 seconds. Keep other activity as consistent as possible. Labels expire after five minutes.',trials);
    const buttons=make('div',undefined,trials);buttons.className='rf-controls';
    this.still=this.button('Mark still baseline',()=>this.label('still'),buttons);
    this.walk=this.button('Mark walking',()=>this.label('walking'),buttons);
    this.end=this.button('End trial',()=>this.label('unlabelled'),buttons);
    this.still.disabled=this.walk.disabled=this.end.disabled=true;
    this.trialStatus=make('p','No trial started in this browser session.',trials);this.trialStatus.setAttribute('role','status');this.trial=make('div',undefined,trials);
    this.activeLabel=make('p','No active action label.',trials);
    make('p','This compares observed RSSI distributions. It does not establish human detection, body size, location or a walking path. Repeated independent trials are needed before claiming a useful motion classifier.',trials);
    try{this.initScene();}catch{make('p','WebGL is unavailable. Router readings and trial results remain available below.',this.viewport);}
    this.load();this.timer=setInterval(()=>this.load(),60000);
  }
  button(text,fn,parent){const b=make('button',text,parent);b.type='button';b.onclick=fn;return b;}
  async load(){try{const response=await fetch('/api/floorplan',{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Private layout unavailable; sign in or retry.');const data=await response.json();this.plan=data.plan?cleanFloorplan(data.plan):null;this.owner=data.can_edit===true;
    const selected=this.floor.value;this.floor.replaceChildren();const all=make('option','All floors',this.floor);all.value='all';for(const f of this.plan?.floors||[]){const o=make('option',f.label,this.floor);o.value=f.id;}this.floor.value=[...this.floor.options].some(o=>o.value===selected)?selected:'all';this.draw();this.update(this.view,this.snapshot);
  }catch(e){this.status.textContent=e.message;}}
  initScene(){
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x081b25);
    this.camera=new THREE.PerspectiveCamera(45,1,1,12000);this.camera.position.set(1450,1150,1500);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.viewport.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','Schematic router spheres and floor overlap grid');
    this.orbit=new OrbitControls(this.camera,this.renderer.domElement);this.orbit.target.set(500,140,350);this.orbit.enableDamping=false;this.orbit.minDistance=300;this.orbit.maxDistance=4000;this.orbit.maxPolarAngle=Math.PI*.93;this.orbit.update();this.orbit.addEventListener('change',()=>this.render());
    this.resize=new ResizeObserver(()=>{const w=this.viewport.clientWidth,h=this.viewport.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.render();});this.resize.observe(this.viewport);
  }
  render(){if(this.renderer&&this.root.offsetWidth)this.renderer.render(this.scene,this.camera);}
  clear(){if(!this.scene)return;for(const child of [...this.scene.children]){this.scene.remove(child);child.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m?.map?.dispose();m?.dispose();}});}}
  line(points,color,opacity=1,dashed=false){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const material=dashed?new THREE.LineDashedMaterial({color,opacity,transparent:true,dashSize:14,gapSize:10}):new THREE.LineBasicMaterial({color,opacity,transparent:true});const line=new THREE.Line(geometry,material);if(dashed)line.computeLineDistances();this.scene.add(line);return line;}
  sprite(text,color,x,y,z){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#081b25dd';c.fillRect(0,0,512,96);c.fillStyle=color;c.font='bold 27px system-ui';c.textAlign='center';c.fillText(text.slice(0,32),256,59);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.position.set(x,y,z);sprite.scale.set(205,38,1);this.scene.add(sprite);}
  draw(){
    if(!this.plan)return;const anchors=fieldAnchors(this.plan,this.params),visible=anchors.filter(a=>this.floor.value==='all'||this.plan.floors[a.floor].id===this.floor.value),radius=fieldRadius(this.params),renderRadius=Math.min(radius,1500);
    this.legend.textContent=`${anchors.length} owner-placed router anchors · ${visible.length} shown · floor colors distinguish levels. Floor tiles: gray 0, teal 1, gold 2, coral 3+ modeled fields above ${this.params.threshold} dBm. Dashed lines show reported attachment changes, not traveled paths.`;
    this.formula.textContent=`P(d) = ${this.params.reference} − 10 × ${this.params.exponent} × log10(max(d, 100) / 100) − ${this.params.floorLoss} × floors crossed. Same-floor sphere radius ${format(radius,0)} drawing units.${radius>1500?' Sphere display capped at 1500 units; overlap calculations use the full model.':''} dBm converts to mW as 10^(dBm/10); converting units does not recover phase, distance or CSI. Cross-floor tiles include the extra floor loss; sphere surfaces do not.`;
    this.clear();if(!this.scene)return;
    for(const [i,floor] of this.plan.floors.entries()){
      if(this.floor.value!=='all'&&this.floor.value!==floor.id)continue;const y=i*this.params.floorGap;
      const geometry=new THREE.PlaneGeometry(43,43);geometry.rotateX(-Math.PI/2);const material=new THREE.MeshBasicMaterial({transparent:true,opacity:.44,side:THREE.DoubleSide});const tiles=new THREE.InstancedMesh(geometry,material,23*16);let index=0;
      for(let x=15;x<1000;x+=44)for(let z=15;z<700;z+=44){const n=overlapAt({x,y,z,floor:i},anchors,this.params),matrix=new THREE.Matrix4().makeTranslation(x,y-4,z);tiles.setMatrixAt(index,matrix);tiles.setColorAt(index++,new THREE.Color([0x203541,0x218e88,0xd3a64a,0xe87860][Math.min(3,n)]));}tiles.count=index;this.scene.add(tiles);
      for(const r of this.plan.rooms.filter(r=>r.floor_id===floor.id)){this.line([[r.x,y,r.y],[r.x+r.w,y,r.y],[r.x+r.w,y,r.y+r.h],[r.x,y,r.y+r.h],[r.x,y,r.y]],COLORS[i%4],.65);}
      this.sprite(floor.label,'#d7ebef',500,y+8,740);
    }
    const mapped=floorplanView(this.plan,this.view?.mesh),roomNodes=new Map(mapped.rooms.map(r=>[r.id,r.node]));
    for(const a of visible){const color=COLORS[a.floor%4],node=roomNodes.get(a.room),event=this.evidence.events.findLast(e=>e.node_id===node?.id&&Date.now()-Date.parse(e.observed_at)<30000);
      if(this.coverage.checked&&renderRadius>0){const sphere=new THREE.Mesh(new THREE.SphereGeometry(renderRadius,32,20),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.027,depthWrite:false,side:THREE.DoubleSide}));sphere.position.set(a.x,a.y,a.z);this.scene.add(sphere);
        const source=new THREE.SphereGeometry(renderRadius,20,10),wire=new THREE.LineSegments(new THREE.WireframeGeometry(source),new THREE.LineBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false}));source.dispose();wire.position.copy(sphere.position);this.scene.add(wire);}
      const core=new THREE.Mesh(new THREE.SphereGeometry(event?15:10,16,12),new THREE.MeshBasicMaterial({color:event?0xff6d4a:node&&mapped.live?color:0x7a8992}));core.position.set(a.x,a.y,a.z);this.scene.add(core);
      if(event){const ring=new THREE.Mesh(new THREE.TorusGeometry(24,2,8,40),new THREE.MeshBasicMaterial({color:0xff6d4a}));ring.rotation.x=Math.PI/2;ring.position.copy(core.position);this.scene.add(ring);}
      this.sprite(a.router,event?'#ff947b':'#e2f4f5',a.x,a.y+42,a.z);
    }
    const byRoom=new Map(anchors.map(a=>[a.room,a]));for(const event of mapped.events.slice(-8)){const a=byRoom.get(event.from),b=byRoom.get(event.to);if(!a||!b||!visible.some(v=>v.room===a.room||v.room===b.room))continue;this.line([[a.x,a.y+12,a.z],[b.x,b.y+12,b.z]],0xffffff,.75,true);}
    this.render();
  }
  update(view,snapshot){
    this.view=view;this.snapshot=snapshot;const collection=snapshot?.latest?.collection;
    if(this.trialCollection&&collection&&this.trialCollection!==collection){this.start=null;this.trialCollection=null;this.trialStatus.textContent='Collection restarted. Begin a new still baseline.';}
    const before=this.evidence.events.length;this.evidence.update(collection,view?.mesh);
    if(this.plan){const mapped=floorplanView(this.plan,view?.mesh);this.status.textContent=`${mapped.live?'Live mesh':'Mesh stale / unavailable'} · ${mapped.rooms.filter(r=>r.node).length}/${this.plan.rooms.length} room bindings · ${fieldAnchors(this.plan,this.params).length} approximate anchors · human movement not calibrated`;
      const key=JSON.stringify([view?.mesh?.observed_at,mapped.live,this.evidence.events.at(-1)?.observed_at,Math.floor(Date.now()/30000)]);if(key!==this.drawKey||before!==this.evidence.events.length){this.drawKey=key;this.draw();}
      this.nodes.replaceChildren();for(const r of mapped.rooms){const card=make('article',undefined,this.nodes);make('h3',r.router_label,card);make('p',r.label,card);make('p',`${mapped.live?'Observed':'Last observed'} · quality 2.4 / 5 GHz: ${r.node?.signal_2g??'unknown'} / ${r.node?.signal_5g??'unknown'}`,card);make('p',`${r.report_at?r.clients.length:'Unknown'} last-reported attached devices`,card);}
      this.events.replaceChildren();const names=new Map(this.plan.rooms.map(r=>[r.id,r.router_label]));
      for(const e of this.evidence.events.slice(-5).reverse())make('p',`${new Date(e.observed_at).toLocaleTimeString()} · ${names.get(e.room_id)||'Unassigned node'} · ${e.changes.map(c=>`${c.band} ${c.before} → ${c.after}`).join(', ')} raw quality units`,this.events);
      if(!this.evidence.events.length)make('p','No numeric Deco quality changes observed in this browser session. First readings establish the baseline. These quality values are ordinal, not dBm.',this.events);
      for(const e of mapped.events.slice(-3))make('p',`Attachment changed: ${names.get(e.from)} → ${names.get(e.to)} · ${new Date(e.observed_at).toLocaleTimeString()}. Device roaming is not a measured human trajectory.`,this.events);
    }
    const scalar=view?.scalar;this.radio.textContent=view?.source_state==='live'?`Mac RSSI ${format(scalar.rssi_dbm,0)} dBm = ${format(dbmToMilliwatts(scalar.rssi_dbm)*1e6,2)} nW · ${scalar.sample_count} distinct samples · ${view.change.state.replaceAll('_',' ')} · variance ${format(scalar.rssi_variance_db2,2)} dB²`:'Mac radio observation stale / unavailable.';
    const label=snapshot?.label,remaining=label?Math.ceil((label.time+300000-Date.now())/1000):0;
    this.activeLabel.textContent=remaining>0?`Current shared action label: ${label.value} · expires in ${remaining}s.`:'No active action label. Start a new still baseline when ready.';
    this.still.disabled=!this.owner||view?.source_state!=='live';this.walk.disabled=!this.owner||view?.source_state!=='live'||this.start===null;this.end.disabled=!this.owner||this.start===null;
    this.renderTrial();
  }
  async label(label){
    if(this.busy||!this.owner||label!=='unlabelled'&&this.view?.source_state!=='live')return;this.busy=true;const clicked=Date.now();this.trialStatus.textContent='Saving action label…';
    try{const r=await fetch('/api/label',{method:'POST',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},body:JSON.stringify({label})});if(!r.ok)throw Error('Could not save label. Owner sign-in and a live collection are required.');
      if(label==='still'){this.start=clicked;this.trialCollection=this.snapshot?.latest?.collection;}
      this.trialStatus.textContent=label==='unlabelled'?'Trial ended; results below use retained labelled observations.':`Marked ${label} at ${new Date(clicked).toLocaleTimeString()}. ${label==='still'?'Stay still for about 90 seconds, then mark walking.':'Walk nearby for about 90 seconds, then end the trial.'}`;
      this.walk.disabled=this.start===null;this.end.disabled=this.start===null;this.renderTrial();
    }catch(e){this.trialStatus.textContent=e.message;}finally{this.busy=false;}
  }
  renderTrial(){
    this.trial.replaceChildren();if(this.start===null)return;const summary=trialSummary(this.snapshot?.history,this.start),table=make('table',undefined,this.trial),head=make('tr',undefined,table);for(const h of ['Label','Samples / span','Median RSSI','MAD / variance'])make('th',h,head);
    for(const label of ['still','walking']){const r=summary[label],row=make('tr',undefined,table);for(const value of [label,`${r.count} / ${format(r.span,0)}s`,`${format(r.median)} dBm`,`${format(r.mad)} dB / ${format(r.variance)} dB²`])make('td',value,row);}
    make('p',summary.ready?`Walking median shift ${format(summary.medianShift)} dB · received-power ratio ${format(summary.powerRatio,2)}× versus still. This is one exploratory comparison, not validated movement detection.`:'Collect at least 8 distinct readings spanning 30 seconds for each condition. About 90 seconds per condition gives margin for the current sample cadence.',this.trial);
  }
  dispose(){clearInterval(this.timer);this.resize?.disconnect();this.orbit?.dispose();this.clear();this.renderer?.dispose();}
}
