// Tapak engine HTTP server. Reachable only through the Cloudflare Tunnel (Workers VPC binding).
import http from 'node:http';
import { config } from './config.js';
import { sendMessage, esc } from './telegram.js';
import { extractReceipt, readChatExport, analyzeCase } from './analysis.js';
import { usdtTransfersFrom, relayerAddress, relayerBalance, addrs } from './chain.js';
import * as W from './worker.js';

const rupiah = (n) => (n == null ? '—' : `Rp${Math.round(n).toLocaleString('id-ID')}`);
const amountOf = (n, cur) => (cur === 'USDT' ? `${n?.toLocaleString('id-ID')} USDT` : rupiah(n));

async function onFile({ caseId, chatId, fileId }) {
  const kase = await W.getCase(caseId);
  const file = (kase.files || []).find((f) => f.id === fileId);
  if (!file) throw new Error('file not found');
  const bytes = await W.getFileBytes(fileId);

  if (file.kind === 'image') {
    const x = await extractReceipt(bytes, file.mime || 'image/jpeg');
    await W.updateFile(fileId, { extracted: JSON.stringify(x) });
    if (!x.adalah_bukti_transfer) {
      return sendMessage(chatId, '🖼️ Gambar disimpan sebagai bukti pendukung (bukan bukti transfer). Kirim juga screenshot <b>bukti transfer</b> kalau ada.');
    }
    const miss = x.tidak_terbaca?.length ? `\n⚠️ <b>Perlu konfirmasi:</b> ${esc(x.tidak_terbaca.join('; '))}` : '';
    return sendMessage(chatId, `🧾 <b>Bukti transfer terbaca</b>
• Waktu: <b>${esc(x.tanggal_waktu || '—')}</b>
• Nominal: <b>${amountOf(x.nominal, x.mata_uang)}</b>
• Dari: ${esc(x.bank_sumber || '')} ${esc(x.rekening_sumber || '—')} (${esc(x.nama_pengirim || '—')})
• Ke: <b>${esc(x.bank_tujuan || '—')} ${esc(x.rekening_tujuan || '—')}</b> a.n. <b>${esc(x.nama_penerima || '—')}</b>
• No. referensi: ${esc(x.no_referensi || '—')}${miss}

Kirim bukti lain, export chat WhatsApp, atau alamat wallet. Kalau sudah, ketik /laporan.`);
  }

  if (file.kind === 'chat') {
    const c = readChatExport(bytes, file.name);
    await W.updateFile(fileId, { extracted: JSON.stringify({ messages: c.messages, first: c.first, last: c.last }) });
    return sendMessage(chatId, `💬 <b>Export chat diterima</b>: ${c.messages} pesan (${esc(c.first || '?')} – ${esc(c.last || '?')}).
Saya akan mencocokkan setiap permintaan uang di chat dengan transfer yang terbukti saat kamu ketik /laporan.`);
  }

  return sendMessage(chatId, '📄 Dokumen disimpan dan sidik jarinya (SHA-256) sudah dicatat. Untuk dibaca otomatis, kirim juga dalam bentuk screenshot.');
}

async function onWallet({ caseId, chatId, wallet }) {
  const list = await usdtTransfersFrom(wallet);
  if (!list.length) return sendMessage(chatId, `🔎 Wallet <code>${esc(wallet)}</code> disimpan. Belum ditemukan transfer tUSDT dari wallet ini di BSC testnet.`);
  const lines = list.map((t) => `• ${new Date(t.timestamp * 1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}: <b>${t.amount.toLocaleString('id-ID')} USDT</b> → <code>${esc(t.to.slice(0, 10))}…</code> (<a href="${t.url}">tx</a>)`);
  return sendMessage(chatId, `⛓️ <b>Transfer USDT dari wallet ini (langsung dari BSC)</b>\n${lines.join('\n')}\n\nBukti ini diambil dari blockchain, jadi tidak bisa dipalsukan.`);
}

async function onAnalyze({ caseId, chatId }) {
  await sendMessage(chatId, '🧠 Menyusun draf laporan… (membaca chat, mencocokkan transfer, mencatat sidik jari bukti di BNB Chain)');
  const { kase, analysis } = await analyzeCase(caseId);
  const d = analysis.drafts.map((g, i) => `${i + 1}. <b>${esc(g.destination_bank || '')} ${esc(g.destination_account || '')}</b>${g.recipient_name ? ` a.n. ${esc(g.recipient_name)}` : ''} — ${amountOf(g.total, g.currency)} (${g.transfers.length} transfer)`).join('\n');
  const miss = analysis.missing.length ? `\n\n⚠️ <b>Bukti yang masih kurang</b>\n${analysis.missing.map((m) => `• ${esc(m.deskripsi)} → ${esc(m.saran)}`).join('\n')}` : '';
  const chain = analysis.anchor?.txHash
    ? `\n\n🔒 Sidik jari ${analysis.evidence.length} bukti tercatat di BNB Chain: <a href="${analysis.anchor.url}">lihat transaksi</a>`
    : '\n\n🔒 Pencatatan on-chain tertunda (relayer belum siap). Draf tetap bisa dipakai.';
  await sendMessage(chatId, `✅ <b>Draf siap ditinjau</b>
<b>${analysis.drafts.length} draf laporan IASC</b> (satu per rekening/wallet tujuan):
${d || '—'}

Total terdokumentasi: <b>${rupiah(analysis.totals.idr)}</b>${analysis.totals.usdt ? ` + <b>${analysis.totals.usdt.toLocaleString('id-ID')} USDT</b> (≈ ${rupiah(analysis.totals.estimated_idr)})` : ''}${miss}${chain}

📋 Buka draf lengkap (salin ke formulir IASC & laporan polisi):
${config.publicBase}/k/${kase.public_token}

Ini <b>draf</b>, bukan laporan yang sudah terkirim. Periksa dulu, lalu laporkan lewat iasc.ojk.go.id dan kantor polisi.`);
}

const handlers = { file: onFile, wallet: onWallet, analyze: onAnalyze };

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

const server = http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
  try {
    if (req.url === '/health') {
      return send(200, { ok: true, model: config.ai.model, relayer: relayerAddress, balance: await relayerBalance().catch(() => null), registry: addrs().registry || null, usdt: addrs().usdt || null });
    }
    if (req.headers['x-tapak-secret'] !== config.secret || !config.secret) return send(401, { error: 'unauthorized' });
    if (req.method === 'POST' && req.url === '/event') {
      const evt = await readJson(req);
      const h = handlers[evt.type];
      if (!h) return send(400, { error: 'unknown event' });
      send(202, { accepted: true });
      h(evt).catch(async (e) => {
        console.error(evt.type, e);
        await sendMessage(evt.chatId, `😔 Maaf, ada kendala saat memproses (${esc(e.message.slice(0, 120))}). Coba kirim ulang, atau ketik /laporan lagi.`);
      });
      return;
    }
    send(404, { error: 'not found' });
  } catch (e) {
    console.error(e);
    send(500, { error: e.message });
  }
});

server.listen(config.port, config.host, () => console.log(`tapak-engine on http://${config.host}:${config.port}`));
