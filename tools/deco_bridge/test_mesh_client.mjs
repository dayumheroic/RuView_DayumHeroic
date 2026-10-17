import test from 'node:test';
import assert from 'node:assert/strict';
import {bridgeURL, MeshClient, sourceLabel} from '../../ui/mesh-client.mjs';
test('only explicit loopback origins without URL secrets', () => {
  for (const url of ['https://example.org', 'http://127.0.0.1:8080/?key=secret', 'http://user@localhost:8080', 'http://localhost', 'http://localhost:80', 'http://localhost:8080/path']) assert.throws(() => bridgeURL(url));
  assert.equal(bridgeURL('http://127.0.0.1:8766'), 'http://127.0.0.1:8766');
});
test('unknown source cannot become live', () => {
  assert.equal(sourceLabel('garbage'), 'Disconnected');
  assert.equal(sourceLabel('synthetic'), 'Synthetic');
  assert.equal(sourceLabel('stale'), 'Stale');
});
test('transport keeps credentials out of URLs and browser storage', async () => {
  let call;
  const client = new MeshClient('http://localhost:8766', 'a'.repeat(64), async (...args) => {
    call = args;
    return {ok:true, text:async () => JSON.stringify({schema:'ruview.bridge.v0', radio:{}, mesh:{}, capabilities:{complex_csi:false}})};
  });
  await client.request('/v1/snapshot');
  assert.equal(call[0], 'http://localhost:8766/v1/snapshot');
  assert.equal(call[1].headers.Authorization, 'Bearer ' + 'a'.repeat(64));
  assert.equal(call[1].credentials, 'omit');
  assert.equal(call[1].redirect, 'error');
  await assert.rejects(client.request('/reboot'));
});
test('authentication and malformed schemas fail closed', async () => {
  const client = new MeshClient('http://localhost:8766', 'a'.repeat(64), async () => ({ok:false,status:401}));
  await assert.rejects(client.request('/v1/snapshot'), /rejected/);
  client.fetcher = async () => ({ok:true,text:async () => '{"schema":"ruview.bridge.v0","radio":{},"mesh":{},"capabilities":{"complex_csi":true}}'});
  await assert.rejects(client.request('/v1/snapshot'), /schema/);
});
test('oversize responses are rejected', async () => {
  const client = new MeshClient('http://localhost:8766', 'a'.repeat(64), async () => ({ok:true,text:async () => ' '.repeat(1048577)}));
  await assert.rejects(client.request('/v1/snapshot'), /large/);
});
test('network failure produces a useful disconnected message', async () => {
  const client = new MeshClient('http://localhost:8766', 'a'.repeat(64), async () => {throw new TypeError('network error');});
  await assert.rejects(client.request('/v1/snapshot'), /Local companion unavailable/);
});
