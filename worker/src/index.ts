// Tapak Worker: Telegram webhook, public web (drafts + verifier), internal API for the VPS engine.
import { Store } from './store';
import { verifyToken } from '@clerk/backend';
import { landingPage, reportPage, verifyPage, appPage, esc } from './pages';

export { Store };

export interface Env {
  STORE: DurableObjectNamespace<Store>;
  AI: Ai;
  EVIDENCE: R2Bucket;
  ENGINE: Fetcher; // Workers VPC service → VPS engine through Cloudflare Tunnel
  TELEGRAM_TOKEN: string;
  WEBHOOK_SECRET: string;
  TAPAK_SECRET: string;
  REGISTRY_ADDRESS: string;
  RPC_URL: string;
  EXPLORER: string;
  BOT_USERNAME: string;
  ENGINE_ORIGIN: string;
  PUBLIC_BASE: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
}

const store = (env: Env) => env.STORE.get(env.STORE.idFromName('main'));
const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
const html = (body: string, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function tg(env: Env, method: string, body: unknown) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}
const say = (env: Env, chatId: number | string, text: string) =>
  tg(env, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });

async function toEngine(env: Env, evt: Record<string, unknown>) {
  const res = await env.ENGINE.fetch(`${env.ENGINE_ORIGIN}/event`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-tapak-secret': env.TAPAK_SECRET }, body: JSON.stringify(evt),
  });
  if (!res.ok) throw new Error(`engine ${res.status}`);
}

const URGENT = `🚨 <b>Langkah 1 · lakukan sekarang juga</b>
Telepon call center bank/e-wallet asal (nomor di balik kartu atau di aplikasi), pilih <b>jalur fraud / pemblokiran</b>, dan <b>minta nomor laporan</b> sebelum telepon ditutup. Dana bisa dipindahkan pelaku dalam hitungan menit.`;

const WELCOME = `👋 Halo, saya <b>Tapak AI</b>, copilot untuk korban penipuan transfer.

${URGENT}

Sambil menunggu, kirim ke saya:
1️⃣ Screenshot <b>bukti transfer</b> (boleh beberapa)
2️⃣ <b>Export chat WhatsApp</b> dengan pelaku (Ekspor chat → tanpa media → kirim file .txt/.zip ke sini)
3️⃣ <b>Alamat wallet</b> kamu jika mengirim USDT (0x…)

Lalu ketik /laporan. Saya susun <b>satu draf IASC per rekening tujuan</b>, kronologi untuk polisi, dan mengunci sidik jari bukti di BNB Chain.

⚠️ Jangan hapus chat walau malu. Siapa pun yang mengaku bisa mencairkan dana kamu = <b>penipu babak dua</b>.
/baru kasus baru · /status ringkasan · /laporan susun draf`;

function kindOf(name: string, mime: string) {
  const n = name.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (n.endsWith('.txt') || n.endsWith('.zip') || mime === 'text/plain' || mime === 'application/zip') return 'chat';
  if (mime === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  return 'doc';
}

/** Store evidence bytes in R2, fingerprint them, record in the case, and hand off to the engine. */
async function ingestBytes(env: Env, caseId: string, name: string, mime: string, buf: ArrayBuffer, chatId: number | null) {
  const sha256 = hex(await crypto.subtle.digest('SHA-256', buf));
  const key = `${caseId}/${sha256}`;
  await env.EVIDENCE.put(key, buf, { httpMetadata: { contentType: mime } });
  const kind = kindOf(name, mime);
  const row = await store(env).addFile({ case_id: caseId, kind, name, mime, size: buf.byteLength, r2_key: key, sha256 });
  if (chatId) await say(env, chatId, `📎 <b>${esc(name)}</b> diterima.\n🔏 SHA-256: <code>${sha256.slice(0, 16)}…</code>\n${kind === 'image' ? 'Sedang dibaca…' : kind === 'chat' ? 'Sedang dihitung…' : ''}`);
  await toEngine(env, { type: 'file', caseId, chatId, fileId: row.id });
  return { fileId: row.id, sha256, kind };
}

async function ingestFile(env: Env, chatId: number, caseId: string, fileId: string, name: string, mime: string) {
  const info = (await (await tg(env, 'getFile', { file_id: fileId })).json()) as { ok: boolean; result?: { file_path: string } };
  if (!info.ok || !info.result) throw new Error('getFile failed');
  const res = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_TOKEN}/${info.result.file_path}`);
  return ingestBytes(env, caseId, name, mime, await res.arrayBuffer(), chatId);
}


type JevResult = { answers?: { intent?: { choice?: string; confidence?: number }; recovery_offer?: { noul?: number }; urgency?: { score?: number } } };
type Triage = { intent: 'kronologi' | 'pertanyaan' | 'tawaran_pemulihan' | 'lainnya'; recoveryOffer: number; urgency: number; confidence: number };

/**
 * Structured triage of a free-text message with TypeSafe Jev (typed questions, calibrated probabilities,
 * zero data retention) through Cloudflare AI Gateway. Replies are templated, never model-written, so the
 * bot can never promise recovered funds.
 */
async function triage(env: Env, text: string, collectLog = false): Promise<{ t: Triage; logId: string | null }> {
  const out = (await env.AI.run('typesafe/jev' as any, {
    state: text.slice(0, 3000),
    questions: {
      intent: {
        type: 'choice',
        instructions: 'Apa maksud utama pesan dari pengguna bot anti-penipuan ini?',
        criteria: {
          kronologi: 'Pengguna menceritakan penipuan yang dia atau keluarganya alami (siapa, kapan, berapa uang ditransfer)',
          pertanyaan: 'Pengguna bertanya cara melapor, langkah yang harus dilakukan, atau cara memakai bot',
          tawaran_pemulihan: 'Pesan berisi tawaran jasa mengembalikan/mencairkan dana korban, mengaku hacker/pengacara/petugas, atau meminta biaya pemulihan',
          lainnya: 'Sapaan atau hal lain yang tidak terkait',
        },
      },
      recovery_offer: {
        type: 'noul',
        instructions: 'Apakah pesan menawarkan pengembalian dana korban dengan syarat membayar biaya, atau meminta OTP, PIN, atau kata sandi?',
        criteria: { true: 'Ada tawaran pemulihan berbayar atau permintaan OTP/PIN', false: 'Tidak ada' },
      },
      urgency: {
        type: 'score',
        instructions: 'Seberapa baru transfer ke penipu terjadi menurut pesan ini?',
        criteria: ['Tidak disebut atau sudah lama (berhari-hari)', 'Hari ini atau beberapa jam lalu', 'Baru saja atau hitungan menit'],
      },
    },
  }, { gateway: { id: 'default', collectLog, metadata: { app: 'tapak', step: 'triage' } } })) as { result?: JevResult } & JevResult;
  // Third-party models answer as { state, result: {...} }; accept the flat shape too.
  const ans = (out.result ?? out).answers ?? {};
  const t: Triage = {
    intent: ((ans.intent?.choice as Triage['intent']) ?? 'lainnya'),
    recoveryOffer: ans.recovery_offer?.noul ?? 0,
    urgency: ans.urgency?.score ?? 0,
    confidence: ans.intent?.confidence ?? 0,
  };
  return { t, logId: env.AI.aiGatewayLogId };
}

async function handleUpdate(env: Env, update: any) {
  const msg = update.message ?? update.edited_message;
  if (!msg?.chat?.id) return;
  const chatId: number = msg.chat.id;
  const text: string = msg.text ?? msg.caption ?? '';
  const s = store(env);

  if (/^\/start\b/.test(text)) { await s.activeCase(String(chatId)); return say(env, chatId, WELCOME); }
  if (/^\/baru\b/.test(text)) { await s.newCase(String(chatId)); return say(env, chatId, `🗂️ Kasus baru dibuat.\n\n${URGENT}\n\nKirim bukti transfer, export chat, atau alamat wallet.`); }

  const link = text.match(/^\/hubungkan\s+(\d{6})/);
  if (link) {
    const userId = await s.redeemLinkCode(link[1], String(chatId));
    return say(env, chatId, userId ? `✅ Telegram terhubung ke akun Tapak. Kasusmu sekarang tampil di ${env.PUBLIC_BASE}/app` : 'Kode tidak valid atau sudah kedaluwarsa. Buat kode baru di dashboard.');
  }

  const kase = await s.activeCase(String(chatId));

  if (/^\/status\b/.test(text)) {
    const c = await s.getCase(kase.id);
    return say(env, chatId, `🗂️ Kasus <code>${kase.id}</code>: ${c?.files.length ?? 0} bukti${kase.wallet ? `, wallet <code>${esc(kase.wallet)}</code>` : ''}.\n${kase.analysis ? `📋 Draf: ${env.PUBLIC_BASE}/k/${kase.public_token}` : 'Ketik /laporan untuk menyusun draf.'}`);
  }
  if (/^\/laporan\b/.test(text)) {
    const c = await s.getCase(kase.id);
    if (!c?.files.length && !kase.wallet) return say(env, chatId, 'Belum ada bukti. Kirim screenshot bukti transfer, export chat, atau alamat wallet dulu.');
    return toEngine(env, { type: 'analyze', caseId: kase.id, chatId });
  }

  if (msg.photo?.length) {
    const p = msg.photo[msg.photo.length - 1];
    return ingestFile(env, chatId, kase.id, p.file_id, `foto-${msg.message_id}.jpg`, 'image/jpeg');
  }
  if (msg.document) {
    const d = msg.document;
    if ((d.file_size ?? 0) > 19_000_000) return say(env, chatId, 'Berkas terlalu besar (maks ±19 MB). Untuk chat, pilih ekspor tanpa media.');
    return ingestFile(env, chatId, kase.id, d.file_id, d.file_name ?? `dokumen-${msg.message_id}`, d.mime_type ?? 'application/octet-stream');
  }

  const wallet = text.match(/0x[a-fA-F0-9]{40}/)?.[0];
  if (wallet) {
    await s.updateCase(kase.id, { wallet });
    await say(env, chatId, `⛓️ Wallet <code>${esc(wallet)}</code> dicatat. Mengambil riwayat transfer USDT dari BSC…`);
    return toEngine(env, { type: 'wallet', caseId: kase.id, chatId, wallet });
  }

  if (text.trim() && !text.startsWith('/')) {
    try {
      const { t } = await triage(env, text);
      if (t.intent === 'tawaran_pemulihan' || t.recoveryOffer >= 0.7) {
        return say(env, chatId, `⚠️ <b>Hati-hati, ini ciri penipu babak dua.</b>\nTawaran "jasa pengembalian dana" yang meminta biaya atau OTP/PIN hampir selalu penipuan lanjutan.\n\nKabar pengembalian dana hanya datang dari bank/e-wallet asal atau IASC. Jangan transfer biaya apa pun dan jangan bagikan OTP/PIN.`);
      }
      const urgent = t.urgency >= 1.5 ? `${URGENT}\n\n` : '';
      if (t.intent === 'kronologi') {
        await ingestBytes(env, kase.id, `cerita-pelapor-${msg.message_id}.txt`, 'text/plain', new TextEncoder().encode(`[Cerita pelapor via Telegram ${new Date().toISOString()}]\n${text}`).buffer as ArrayBuffer, null);
        return say(env, chatId, `${urgent}📝 Terima kasih sudah bercerita. Ceritamu saya simpan sebagai bagian kronologi dan sidik jarinya ikut dicatat.\n\nKirim juga screenshot bukti transfer atau export chat WhatsApp, lalu ketik /laporan.`);
      }
      if (t.intent === 'pertanyaan') {
        return say(env, chatId, `${URGENT}\n\nLangkah berikutnya: lapor di <b>iasc.ojk.go.id</b> (satu formulir untuk satu rekening tujuan) dan buat <b>laporan polisi</b>. Saya bisa menyiapkan drafnya: kirim bukti transfer, export chat, atau alamat wallet, lalu ketik /laporan.`);
      }
    } catch (e) {
      console.error('triage', e);
    }
  }
  return say(env, chatId, `Saya siap membantu. ${URGENT}\n\nKirim screenshot bukti transfer, export chat WhatsApp (.txt/.zip), atau alamat wallet. Ketik /laporan kalau sudah.`);
}

// eth_call EvidenceRegistry.verify(bytes32) -> (bool found, bytes32 caseId, uint64 timestamp)
async function registryAddress(env: Env) {
  return env.REGISTRY_ADDRESS || (await store(env).getConfig('registry')) || '';
}

async function verifyOnChain(env: Env, sha: string) {
  const registry = await registryAddress(env);
  if (!registry) return null;
  const data = `0x75e36616${sha.padStart(64, '0')}`;
  const r = (await (await fetch(env.RPC_URL, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: registry, data }, 'latest'] }),
  })).json()) as { result?: string };
  const out = (r.result ?? '0x').slice(2);
  if (out.length < 192) return null;
  return { found: BigInt(`0x${out.slice(0, 64)}`) === 1n, caseId: `0x${out.slice(64, 128)}`, timestamp: Number(BigInt(`0x${out.slice(128, 192)}`)) };
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const s = store(env);

    if (path === '/telegram/webhook' && req.method === 'POST') {
      if (req.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
      const update = await req.json();
      ctx.waitUntil(handleUpdate(env, update).catch(async (e) => {
        console.error('update', e);
        const chatId = (update as any)?.message?.chat?.id;
        if (chatId) await say(env, chatId, '😔 Maaf, ada kendala. Coba kirim ulang sebentar lagi.');
      }));
      return new Response('ok');
    }

    if (path.startsWith('/internal/')) {
      if (req.headers.get('x-tapak-secret') !== env.TAPAK_SECRET) return json({ error: 'unauthorized' }, 401);
      // Test/automation hooks (same secret): create a case, upload evidence bytes, trigger analysis.
      if (path === '/internal/config' && req.method === 'POST') {
        const cfg = (await req.json()) as Record<string, string>;
        for (const k of ['registry', 'usdt']) if (cfg[k] && /^0x[a-fA-F0-9]{40}$/.test(cfg[k])) await s.setConfig(k, cfg[k]);
        return json({ registry: await s.getConfig('registry'), usdt: await s.getConfig('usdt') });
      }
      if (path === '/internal/ai-gateway-check' && req.method === 'POST') {
        // Synthetic test text only: collectLog lets the call show up in AI Gateway logs; victims' messages are never logged.
        const { text, log } = (await req.json()) as { text: string; log?: boolean };
        try { return json(await triage(env, text, !!log)); } catch (e) { return json({ error: String((e as Error)?.message ?? e) }, 500); }
      }
      if (path === '/internal/pending-anchors' && req.method === 'GET') return json(await s.pendingAnchors());
      if (path === '/internal/new-case' && req.method === 'POST') return json(await s.newCase(url.searchParams.get('owner') ?? 'internal'));
      if (path === '/internal/ingest' && req.method === 'POST') {
        const caseId = url.searchParams.get('case')!;
        const name = url.searchParams.get('name') ?? 'berkas';
        return json(await ingestBytes(env, caseId, name, req.headers.get('content-type') ?? 'application/octet-stream', await req.arrayBuffer(), null));
      }
      if (path === '/internal/analyze' && req.method === 'POST') {
        await toEngine(env, { type: 'analyze', caseId: url.searchParams.get('case'), chatId: null });
        return json({ queued: true });
      }
      const m = path.match(/^\/internal\/(case|file)\/([a-z0-9]+)(\/raw)?$/);
      if (!m) return json({ error: 'not found' }, 404);
      const [, kind, id, raw] = m;
      if (kind === 'case' && req.method === 'GET') return json(await s.getCase(id));
      if (kind === 'case' && req.method === 'POST') return json(await s.updateCase(id, await req.json()));
      if (kind === 'file' && raw) {
        const f = await s.getFile(id);
        const obj = f && (await env.EVIDENCE.get(f.r2_key));
        return obj ? new Response(obj.body, { headers: { 'content-type': f!.mime } }) : json({ error: 'missing' }, 404);
      }
      if (kind === 'file' && req.method === 'POST') return json(await s.updateFile(id, await req.json()));
      return json({ error: 'bad request' }, 400);
    }

    if (path === '/api/verify' && req.method === 'POST') {
      const { sha256 } = (await req.json()) as { sha256?: string };
      if (!sha256 || !/^[0-9a-f]{64}$/.test(sha256)) return json({ error: 'sha256 hex required' }, 400);
      const [known, onchain] = await Promise.all([s.findHash(sha256), verifyOnChain(env, sha256).catch(() => null)]);
      return json({ sha256, known: !!known, onchain });
    }


    // Dashboard API (Clerk session token in Authorization: Bearer …)
    if (path.startsWith('/api/me/')) {
      let userId: string;
      try {
        const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
        userId = (await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY })).sub;
      } catch {
        return json({ error: 'unauthorized' }, 401);
      }
      if (path === '/api/me/cases' && req.method === 'GET') {
        const cases = await s.casesForUser(userId);
        return json({ cases, telegram_linked: !!(await s.profile(userId)).chat_id });
      }
      if (path === '/api/me/cases' && req.method === 'POST') return json(await s.newCase(`web:${userId}`));
      if (path === '/api/me/link-code' && req.method === 'POST') return json(await s.createLinkCode(userId));
      const m = path.match(/^\/api\/me\/cases\/([a-z0-9]+)\/(files|wallet|analyze)$/);
      if (m && req.method === 'POST') {
        const [, caseId, action] = m;
        if (!(await s.ownsCase(userId, caseId))) return json({ error: 'forbidden' }, 403);
        if (action === 'files') {
          const buf = await req.arrayBuffer();
          if (buf.byteLength > 19_000_000) return json({ error: 'berkas terlalu besar' }, 413);
          return json(await ingestBytes(env, caseId, url.searchParams.get('name') ?? 'berkas', req.headers.get('content-type') ?? 'application/octet-stream', buf, null));
        }
        if (action === 'wallet') {
          const { wallet } = (await req.json()) as { wallet?: string };
          if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return json({ error: 'alamat wallet tidak valid' }, 400);
          await s.updateCase(caseId, { wallet });
          return json({ ok: true });
        }
        await toEngine(env, { type: 'analyze', caseId, chatId: null });
        return json({ queued: true });
      }
      return json({ error: 'not found' }, 404);
    }

    if (path === '/app') return html(appPage(env.CLERK_PUBLISHABLE_KEY, env.BOT_USERNAME));
    if (path === '/verify') return html(verifyPage());
    const k = path.match(/^\/k\/([a-f0-9]{32})$/);
    if (k) {
      const c = await s.caseByToken(k[1]);
      return c ? html(reportPage(c, `${env.EXPLORER}/address/${await registryAddress(env)}`)) : html('<p>Tidak ditemukan</p>', 404);
    }
    if (path === '/' || path === '') return html(landingPage(env.BOT_USERNAME));
    if (path === '/health') return json({ ok: true });
    return new Response('not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
