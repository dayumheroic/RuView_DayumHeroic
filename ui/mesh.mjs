import {MeshClient, sourceLabel} from './mesh-client.mjs';
const $ = id => document.getElementById(id);
const bootstrap = document.querySelector('meta[name="bridge-bootstrap"]');
const initialKey = bootstrap?.content || '';
bootstrap?.remove();
let client = null, busy = false, generation = 0, lastSample = null;
const history = [];
const phases = {setup_required: 'Deco sign-in required', connecting: 'Reading protected Deco telemetry…',
  connected: 'Deco collection connected', failed: 'Deco collection stopped; use Reconnect Deco to sign in again', paused: 'Deco collection paused; use Reconnect Deco to resume'};
const failureStages = {authentication:'authentication', read_devices:'device-list read', read_clients:'client-list read',
  read_performance:'performance read', read_mode:'mode read', response_schema:'response schema validation'};
function field(id, value, unit = '') { $(id).textContent = Number.isFinite(value) ? `${value}${unit}` : '—'; }
function badge(id, state) { $(id).textContent = sourceLabel(state); $(id).dataset.state = state; }
function clearReadings(message) {
  $('connection').textContent = message;
  $('updated').textContent = 'Measurements unavailable';
  for (const id of ['rssi','noise','channel','tx-rate','node-count','client-count']) field(id, null);
  badge('rf-state', 'disconnected'); badge('mesh-state', 'disconnected');
  $('mesh-message').textContent = 'Connect to the local companion to read telemetry.';
  $('pause').disabled = true; $('signin-panel').hidden = true; $('clients-panel').hidden = true;
  $('reconnect').hidden = true; $('recovery-message').hidden = true;
  $('signal-line').setAttribute('points', '');
  $('bridge-form').hidden = false;
  history.length = 0; lastSample = null;
}
function render(value) {
  const {radio, mesh} = value;
  const phase = value.connection === 'failed' && failureStages[value.failure_stage]
    ? `Deco stopped during ${failureStages[value.failure_stage]}; use Reconnect Deco to sign in again`
    : (phases[value.connection] || 'Disconnected');
  $('connection').textContent = phase;
  $('updated').textContent = `Companion reached ${new Date().toLocaleTimeString()}`;
  badge('rf-state', radio.source_state); badge('mesh-state', mesh.source_state);
  const current = radio.source_state === 'live_unverified' && radio.available === true;
  field('rssi', current ? radio.rssi_dbm : null);
  field('noise', current ? radio.noise_dbm : null, ' dBm');
  field('channel', current ? radio.channel : null);
  field('tx-rate', current ? radio.transmit_rate_mbps : null, ' Mbps');
  if (radio.observed_at !== lastSample || !current) {
    lastSample = radio.observed_at;
    history.push(current && Number.isFinite(radio.rssi_dbm) ? radio.rssi_dbm : null);
    if (history.length > 60) history.shift();
  }
  // Draw only the segment after the latest gap; never interpolate an outage.
  const start = history.lastIndexOf(null) + 1;
  $('signal-line').setAttribute('points', history.slice(start).map((x,i) => `${(start+i)*600/59},${120-(Math.max(-100,Math.min(-20,x))+100)*120/80}`).join(' '));
  const meshCurrent = mesh.source_state === 'live_unverified';
  field('node-count', meshCurrent && Array.isArray(mesh.nodes) ? mesh.nodes.length : null);
  field('client-count', meshCurrent && Array.isArray(mesh.clients) ? mesh.clients.length : null);
  $('mesh-message').textContent = meshCurrent ? 'Counts describe API records, not people. Units and firmware schema remain unverified.' : phase;
  $('mesh-age').textContent = mesh.observed_at ? `Last API capture: ${mesh.observed_at} · ${Math.floor(mesh.age_seconds)} seconds ago` : 'No API capture yet';
  $('pause').disabled = !['connecting','connected'].includes(value.connection);
  const recovering = ['failed','paused'].includes(value.connection);
  $('pause').hidden = recovering;
  $('reconnect').hidden = !recovering;
  $('reconnect').disabled = value.recovery?.can_reset !== true;
  $('recovery-message').hidden = !recovering;
  $('recovery-message').textContent = value.recovery?.worker_active
    ? 'Waiting for the current router operation to finish.'
    : value.recovery?.retry_after_seconds > 0 ? `Reconnect available in ${value.recovery.retry_after_seconds} seconds.`
      : 'Reconnect returns to local sign-in. Mac Wi-Fi measurements continue.';
  $('signin-panel').hidden = value.sign_in_attempted || value.connection !== 'setup_required';
  $('deco-target').textContent = value.target?.host || '—';
  $('deco-pin').textContent = value.target?.certificate_sha256 || '—';
  $('clients-panel').hidden = !meshCurrent || !Array.isArray(mesh.clients);
  $('clients').replaceChildren();
  if (meshCurrent && Array.isArray(mesh.clients)) for (const row of mesh.clients) {
    const tr = document.createElement('tr');
    for (const text of [typeof row.id === 'string' ? row.id.slice(0,12) : 'Unknown',
      row.online === true ? 'Yes' : row.online === false ? 'No' : 'Unknown',
      Number.isFinite(row.rates?.down_raw) ? String(row.rates.down_raw) : '—',
      Number.isFinite(row.rates?.up_raw) ? String(row.rates.up_raw) : '—']) {
      const td = document.createElement('td'); td.textContent = text; tr.append(td);
    }
    $('clients').append(tr);
  }
}
async function refresh() {
  if (!client || busy) return;
  busy = true;
  const epoch = generation;
  try { const value = await client.request('/v1/snapshot'); if(epoch === generation) { render(value); $('bridge-form').hidden = true; } }
  catch(error) { if(epoch === generation) clearReadings(error.message); }
  finally { busy = false; }
}
$('bridge-form').addEventListener('submit', event => {
  event.preventDefault(); generation++;
  try { client = new MeshClient($('bridge-url').value, $('bridge-key').value); $('bridge-key').value = ''; refresh(); }
  catch(error) { clearReadings(error.message); }
});
$('deco-form').addEventListener('submit', async event => {
  event.preventDefault(); if(!client) return;
  const password = $('deco-password').value; $('deco-password').value = ''; $('signin').disabled = true;
  try { await client.request('/v1/deco/connect', {password, pin_confirmed: $('confirm-pin').checked}); await refresh(); }
  catch(error) { $('connection').textContent = error.message; }
  finally { $('signin').disabled = false; }
});
$('pause').addEventListener('click', async () => {
  if(!client) return;
  try { await client.request('/v1/deco/pause', {}); await refresh(); }
  catch(error) { clearReadings(error.message); }
});
$('reconnect').addEventListener('click', async () => {
  if(!client) return;
  $('reconnect').disabled = true;
  try {
    await client.request('/v1/deco/reset', {});
    $('deco-password').value = '';
    await refresh();
  } catch(error) { $('connection').textContent = error.message; }
});
if (/^[a-f0-9]{64}$/.test(initialKey)) {
  try { client = new MeshClient(location.origin, initialKey); refresh(); }
  catch(error) { clearReadings(error.message); $('bridge-form').hidden = false; }
} else { $('bridge-form').hidden = false; clearReadings('Connect the local companion'); }
setInterval(refresh, 2500);
