// MiniMax M3 through its Anthropic-compatible Messages API, optionally via Cloudflare AI Gateway.
import { config } from './config.js';

export async function callModel({ system, content, maxTokens = 2000 }) {
  const headers = {
    'content-type': 'application/json',
    'x-api-key': config.ai.key,
    'anthropic-version': '2023-06-01',
  };
  if (config.ai.gatewayToken) headers['cf-aig-authorization'] = `Bearer ${config.ai.gatewayToken}`;

  const res = await fetch(`${config.ai.base}/anthropic/v1/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.ai.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
}

/** Parse the first JSON object/array in a model reply (tolerates ```json fences). */
export function parseJson(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[\[{]/);
  if (start < 0) throw new Error('no JSON in model reply');
  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  const end = cleaned.lastIndexOf(close);
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const imageBlock = (bytes, mediaType) => ({
  type: 'image',
  source: { type: 'base64', media_type: mediaType, data: Buffer.from(bytes).toString('base64') },
});
