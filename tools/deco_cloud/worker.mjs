import {DurableObject} from 'cloudflare:workers';
import {timingSafeEqual} from 'node:crypto';
import {cleanFrame,viewerForHash} from './contract.mjs';
import DASHBOARD from './dashboard.html';
import LOGIN from './login.html';
import CSS from './style.css';
import CLIENT from './client.js.txt';
import {RUVIEW_HTML,RUVIEW_CSS,RUVIEW_JS,RUVIEW_NOTICES} from './ruview-assets.generated.mjs';
import {bridgeSensing} from '../../ui/services/deco-sensing.mjs';
import ASSOCIATION_UI from './association-assets.generated.mjs';
import {cleanFloorplan} from './floorplan.mjs';
const TTL=15*60*1000;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
function reply(value,status=200,extra={}) {return new Response(typeof value==='string'?value:JSON.stringify(value),{status,headers:{...headers,'Content-Type':typeof value==='string'?'text/html; charset=utf-8':'application/json',...extra}});}
async function boundedJSON(request,max) {
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('JSON required');
  const reader=request.body?.getReader();if(!reader)throw new Error('Missing body');
  let size=0;const chunks=[];
  let timedOut=false;
  const deadline=setTimeout(()=>{timedOut=true;reader.cancel().catch(()=>{});},3000);
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error('Too large');chunks.push(value);}}
  finally{clearTimeout(deadline);await reader.cancel();reader.releaseLock();}
  if(timedOut)throw new Error('Body deadline');
  const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function hash(token) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function match(token,expected) {
  if(typeof token!=='string'||!(/^[a-f0-9]{64}$/).test(token)||!(/^[a-f0-9]{64}$/).test(expected||''))return false;
  return timingSafeEqual(new TextEncoder().encode(await hash(token)),new TextEncoder().encode(expected));
}
function entries(env){try{return JSON.parse(env.VIEWERS||'[]');}catch{return [];}}
async function authenticate(request,env,token=null) {
  token??=request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-ruview='))?.slice(14);
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
  const digest=await hash(token);
  // Digest lookup contains only hashes of high-entropy capabilities.
  return viewerForHash(digest,entries(env));
}
function sameOrigin(request){return request.headers.get('Origin')===new URL(request.url).origin;}
/** @extends {DurableObject<Env>} */
export class HomeFeed extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS latest (id INTEGER PRIMARY KEY, value TEXT, received REAL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS samples (observed TEXT PRIMARY KEY, time REAL, rssi REAL, noise REAL, label TEXT)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS label (id INTEGER PRIMARY KEY, value TEXT, time REAL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS floorplan (id INTEGER PRIMARY KEY, version INTEGER, value TEXT, previous TEXT, updated REAL)');
  }
  floorplan(){const row=this.sql.exec('SELECT version,value,previous,updated FROM floorplan WHERE id=1').toArray()[0];return row?{version:row.version,plan:JSON.parse(row.value),can_undo:!!row.previous,updated_at:new Date(row.updated).toISOString()}:{version:0,plan:null,can_undo:false,updated_at:null};}
  saveFloorplan(plan,expected){
    if(!Number.isSafeInteger(expected)||expected<0)throw Error('Plan revision');
    const clean=cleanFloorplan(plan),old=this.sql.exec('SELECT version,value FROM floorplan WHERE id=1').toArray()[0];
    if((old?.version||0)!==expected)return {conflict:true};
    this.sql.exec('INSERT OR REPLACE INTO floorplan VALUES(1,?,?,?,?)',expected+1,JSON.stringify(clean),old?.value||null,Date.now());
    return {version:expected+1};
  }
  undoFloorplan(expected){const old=this.sql.exec('SELECT previous FROM floorplan WHERE id=1').toArray()[0];if(!old?.previous)throw Error('No prior plan');return this.saveFloorplan(JSON.parse(old.previous),expected);}
  currentLabel(){return this.sql.exec('SELECT value,time FROM label WHERE id=1').toArray()[0]||null;}
  snapshot(){
    const now=Date.now();const latest=this.sql.exec('SELECT value,received FROM latest WHERE id=1').toArray()[0];
    const fresh=latest&&now-latest.received<TTL;
    const history=this.sql.exec('SELECT observed,rssi,noise,label FROM samples WHERE time>? ORDER BY time DESC LIMIT 180',now-TTL).toArray().reverse();
    const label=this.currentLabel();
    return {type:'snapshot',received_at:fresh?new Date(latest.received).toISOString():null,latest:fresh?JSON.parse(latest.value):null,history,label:label&&now-label.time<TTL?label:null};
  }
  broadcast(value){const raw=JSON.stringify(value);for(const ws of this.ctx.getWebSockets()){
    try{const a=ws.deserializeAttachment();if(!viewerForHash(a.hash,entries(this.env))||a.expires<Date.now()){ws.close(1008,'Session expired');continue;}ws.send(raw);}catch{try{ws.close(1011,'Reconnect');}catch{}}
  }}
  async ingest(frame){
    const now=Date.now();const last=this.sql.exec('SELECT value,received FROM latest WHERE id=1').toArray()[0];
    if(last){const old=JSON.parse(last.value);if(old.collection===frame.collection&&old.sequence>=frame.sequence)return {accepted:false,reason:'duplicate'};
      if(now-last.received<2000)return {accepted:false,reason:'rate_limited'};}
    if(last&&JSON.parse(last.value).collection!==frame.collection){this.sql.exec('DELETE FROM samples');this.sql.exec('DELETE FROM label');}
    this.sql.exec('INSERT OR REPLACE INTO latest VALUES(1,?,?)',JSON.stringify(frame),now);
    const r=frame.radio,label=this.currentLabel();let sample=null;
    if(r.observed_at&&r.available&&r.source_state==='live_unverified'&&now-Date.parse(r.observed_at)<=15000){
      this.sql.exec('INSERT OR IGNORE INTO samples VALUES(?,?,?,?,?)',r.observed_at,Date.parse(r.observed_at),r.rssi_dbm,r.noise_dbm,label&&Date.parse(r.observed_at)>=label.time&&now-label.time<5*60*1000?label.value:null);
      sample={observed:r.observed_at,rssi:r.rssi_dbm,noise:r.noise_dbm,label:label&&Date.parse(r.observed_at)>=label.time&&now-label.time<5*60*1000?label.value:null};
    }
    this.sql.exec('DELETE FROM samples WHERE time<? OR observed NOT IN (SELECT observed FROM samples ORDER BY time DESC LIMIT 180)',now-TTL);
    this.sql.exec('DELETE FROM label WHERE time<?',now-TTL);
    if(!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(now+TTL);
    // Only the new frame/sample on the hot path; history is sent on subscribe
    // and resynchronization. Do not reread all history for every heartbeat.
    this.broadcast({type:'update',received_at:new Date(now).toISOString(),latest:frame,sample,label:this.currentLabel()});return {accepted:true};
  }
  async annotate(value){if(value==='unlabelled')this.sql.exec('DELETE FROM label WHERE id=1');else this.sql.exec('INSERT OR REPLACE INTO label VALUES(1,?,?)',value,Date.now());this.broadcast(this.snapshot());return {accepted:true};}
  async fetch(request){
    const viewer=viewerForHash(request.headers.get('X-Viewer-Hash'),entries(this.env));
    if(!viewer)return reply({error:'Subscription authentication required'},403);
    if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return reply({error:'Subscription upgrade required'},403);
    if(this.ctx.getWebSockets().length>=12)return reply({error:'Viewer limit'},429);
    const pair=new WebSocketPair();const [client,server]=Object.values(pair);
    this.ctx.acceptWebSocket(server);server.serializeAttachment({hash:viewer.hash,expires:Math.min(viewer.expires,Date.now()+8*60*60*1000)});
    server.send(JSON.stringify(this.snapshot()));return new Response(null,{status:101,webSocket:client});
  }
  webSocketMessage(ws){ws.close(1008,'Read-only subscription');}
  webSocketClose(ws){ws.close(1000,'Closed');}
  async alarm(){
    const now=Date.now();this.sql.exec('DELETE FROM samples WHERE time<?',now-TTL);this.sql.exec('DELETE FROM latest WHERE received<?',now-TTL);this.sql.exec('DELETE FROM label WHERE time<?',now-TTL);
    this.broadcast(this.snapshot());if(this.sql.exec('SELECT count(*) AS n FROM latest').one().n)await this.ctx.storage.setAlarm(now+TTL);
  }
}
export default {
/** @param {Request} request @param {Env} env */
async fetch(request,env){
  try{
    const u=new URL(request.url),p=u.pathname;
    if(u.search)return reply({error:'Query not supported'},400);
    if(request.method==='GET'&&p==='/health')return reply({service:'ruview-deco',version:1});
    if(request.method==='GET'&&p==='/style.css')return reply(CSS,200,{'Content-Type':'text/css; charset=utf-8'});
    if(request.method==='GET'&&p==='/client.js')return reply(CLIENT,200,{'Content-Type':'text/javascript; charset=utf-8'});
    if(request.method==='GET'&&p==='/login')return reply(LOGIN);
    if(request.method==='POST'&&p==='/api/login'){
      if(!sameOrigin(request))return reply({error:'Origin denied'},403);
      const v=await boundedJSON(request,256);const viewer=await authenticate(request,env,v.token);
      if(!viewer)return reply({error:'Invitation rejected or expired'},401);
      return reply({ok:true},200,{'Set-Cookie':`__Host-ruview=${v.token}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.max(0,Math.min(28800,Math.floor((viewer.expires-Date.now())/1000)))}`});
    }
    if(request.method==='POST'&&p==='/api/ingest'){
      if(request.headers.get('Origin'))return reply({error:'Publisher only'},403);
      if(!await match(request.headers.get('Authorization')?.replace(/^Bearer /,''),env.PUBLISHER_HASH))return reply({error:'Publisher authentication required'},401);
      const frame=cleanFrame(await boundedJSON(request,65536));const result=await env.FEEDS.getByName('home').ingest(frame);
      return reply(result,result.reason==='rate_limited'?429:200);
    }
    const viewer=await authenticate(request,env);
    if(!viewer)return request.method==='GET'&&['/','/ruview','/ruview/'].includes(p)?reply('',303,{Location:'/login'}):reply({error:'Viewer authentication required'},401);
    const feed=env.FEEDS.getByName('home');
    if(request.method==='GET'&&p==='/api/floorplan')return reply({...await feed.floorplan(),can_edit:viewer.role==='owner'});
    if(['PUT','POST'].includes(request.method)&&['/api/floorplan','/api/floorplan/undo'].includes(p)){
      if(!sameOrigin(request)||viewer.role!=='owner')return reply({error:'Owner origin required'},403);
      if(request.method==='PUT'&&p==='/api/floorplan'){
        const v=await boundedJSON(request,32768),result=await feed.saveFloorplan(cleanFloorplan(v.plan),v.expected_version);return reply(result,result.conflict?409:200);
      }
      if(request.method==='POST'&&p==='/api/floorplan/undo'){
        const v=await boundedJSON(request,128),result=await feed.undoFloorplan(v.expected_version);return reply(result,result.conflict?409:200);
      }
      return reply({error:'Method not supported'},405);
    }
    if(request.method==='GET'&&p==='/')return reply(DASHBOARD);
    if(request.method==='GET'&&p==='/ruview')return reply('',303,{Location:'/ruview/'});
    if(request.method==='GET'&&p==='/ruview/')return reply(RUVIEW_HTML,200,{'Content-Security-Policy':headers['Content-Security-Policy'].replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")+"; img-src 'self' data:"});
    if(request.method==='GET'&&p==='/ruview/style.css')return reply(RUVIEW_CSS,200,{'Content-Type':'text/css; charset=utf-8'});
    if(request.method==='GET'&&p==='/ruview/app.js')return reply(RUVIEW_JS,200,{'Content-Type':'text/javascript; charset=utf-8'});
    if(request.method==='GET'&&p==='/association-ui.js')return reply(ASSOCIATION_UI,200,{'Content-Type':'text/javascript; charset=utf-8'});
    if(request.method==='GET'&&p==='/ruview/notices')return reply(RUVIEW_NOTICES,200,{'Content-Type':'text/plain; charset=utf-8'});
    if(request.method==='GET'&&p==='/api/ruview/snapshot')return reply(bridgeSensing(await feed.snapshot()));
    if(request.method==='GET'&&p==='/api/snapshot')return reply(await feed.snapshot());
    if(request.method==='GET'&&p==='/api/live'){
      if(!sameOrigin(request)||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return reply({error:'WebSocket origin required'},403);
      return feed.fetch(new Request(request.url,{headers:{Upgrade:'websocket','X-Viewer-Hash':viewer.hash}}));
    }
    if(request.method==='POST'&&p==='/api/label'){
      if(!sameOrigin(request)||viewer.role!=='owner')return reply({error:'Owner origin required'},403);
      const v=await boundedJSON(request,128);if(!['still','walking','device_moved','unlabelled'].includes(v.label))return reply({error:'Unsupported label'},400);
      return reply(await feed.annotate(v.label));
    }
    if(request.method==='POST'&&p==='/api/logout'&&sameOrigin(request))return reply({ok:true},200,{'Set-Cookie':'__Host-ruview=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
    return reply({error:'Not found'},404);
  }catch{return reply({error:'Request rejected'},400);}
}};
