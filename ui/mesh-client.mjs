// No browser persistence, source simulation or fallback server.
export function bridgeURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
      || url.username || url.password || url.search || url.hash || url.pathname !== '/'
      || !/^\d+$/.test(url.port) || Number(url.port) < 1024) throw new Error('Use a loopback HTTP URL with an explicit port.');
  return url.origin;
}

export function sourceLabel(state) {
  return ({live_unverified: 'Live · unverified', stale: 'Stale', disconnected: 'Disconnected', synthetic: 'Synthetic'})[state] || 'Disconnected';
}

export class MeshClient {
  constructor(url, key, fetcher = globalThis.fetch.bind(globalThis)) {
    this.url = bridgeURL(url);
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Enter the 64-character bridge key.');
    this.key = key;
    this.fetcher = fetcher;
  }
  async request(path, payload) {
    if (!['/v1/snapshot', '/v1/deco/connect', '/v1/deco/pause', '/v1/deco/reset'].includes(path)) throw new Error('Unsupported endpoint.');
    let response;
    try { response = await this.fetcher(this.url + path, {
      method: payload === undefined ? 'GET' : 'POST',
      headers: {Authorization: `Bearer ${this.key}`, ...(payload === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(payload === undefined ? {} : {body: JSON.stringify(payload)}),
      signal: AbortSignal.timeout(4000), cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer'
    }); } catch { throw new Error('Local companion unavailable. Open or restart the Mac app.'); }
    if (!response.ok) throw new Error(response.status === 401 ? 'Bridge key rejected.' : 'Bridge request stopped. Check the app before retrying.');
    const raw = await response.text();
    if (raw.length > 1048576) throw new Error('Bridge response too large.');
    const value = JSON.parse(raw);
    if (path === '/v1/snapshot' && (value.schema !== 'ruview.bridge.v0'
        || !value.radio || !value.mesh || value.capabilities?.complex_csi !== false)) throw new Error('Unsupported bridge schema.');
    return value;
  }
}
