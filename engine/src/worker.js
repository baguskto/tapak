// Calls back into the Cloudflare Worker's internal API: D1 case state and R2 evidence files.
import { config } from './config.js';

async function call(path, init = {}) {
  const res = await fetch(`${config.workerBase}/internal${path}`, {
    ...init,
    headers: { 'x-tapak-secret': config.secret, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`worker ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export const getCase = async (id) => (await call(`/case/${id}`)).json();
export const updateCase = (id, patch) => call(`/case/${id}`, { method: 'POST', body: JSON.stringify(patch) });
export const updateFile = (id, patch) => call(`/file/${id}`, { method: 'POST', body: JSON.stringify(patch) });
export const getFileBytes = async (id) => new Uint8Array(await (await call(`/file/${id}/raw`)).arrayBuffer());
export const registerConfig = (cfg) => call('/config', { method: 'POST', body: JSON.stringify(cfg) });
export const pendingAnchors = async () => (await call('/pending-anchors')).json();
