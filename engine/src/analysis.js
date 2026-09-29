// Tapak agent steps: read receipts, read chats, match requests to transfers, draft reports, anchor.
import { createHash } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';
import { callModel, parseJson, imageBlock } from './ai.js';
import { config } from './config.js';
import { anchorHashes, usdtTransfersFrom, txUrl } from './chain.js';
import * as W from './worker.js';

const RECEIPT_SYSTEM = `Kamu adalah Tapak AI, asisten yang membantu korban penipuan transfer di Indonesia.
Tugasmu membaca screenshot bukti transfer dan mengekstrak data PERSIS seperti tertulis.
Aturan: jangan pernah menebak atau melengkapi angka. Jika sebuah data tidak terlihat, terpotong, atau buram, isi null dan sebutkan di "tidak_terbaca".
Balas hanya dengan JSON.`;

const RECEIPT_PROMPT = `Ekstrak bukti transfer ini sebagai JSON dengan kunci:
{"adalah_bukti_transfer": boolean, "tanggal_waktu": "DD/MM/YYYY HH:MM" | null, "nominal": number | null, "mata_uang": "IDR" | "USDT" | null,
 "bank_sumber": string | null, "rekening_sumber": string | null, "nama_pengirim": string | null,
 "bank_tujuan": string | null, "rekening_tujuan": string | null, "nama_penerima": string | null,
 "no_referensi": string | null, "berita": string | null, "tidak_terbaca": string[]}`;

export async function extractReceipt(bytes, mime) {
  const text = await callModel({ system: RECEIPT_SYSTEM, content: [imageBlock(bytes, mime), { type: 'text', text: RECEIPT_PROMPT }], maxTokens: 800 });
  return parseJson(text);
}

/** WhatsApp export: .txt, or a .zip containing the _chat.txt/"WhatsApp Chat ... .txt". */
export function readChatExport(bytes, name = '') {
  let text;
  if (name.toLowerCase().endsWith('.zip') || (bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    const files = unzipSync(bytes);
    const key = Object.keys(files).find((k) => k.toLowerCase().endsWith('.txt'));
    if (!key) throw new Error('zip tanpa file chat .txt');
    text = strFromU8(files[key]);
  } else {
    text = new TextDecoder().decode(bytes);
  }
  const lines = text.split(/\r?\n/).filter((l) => /^\[?\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}/.test(l));
  const dateOf = (l) => (l.match(/^\[?(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/) || [])[1];
  return { text, messages: lines.length, first: lines[0] ? dateOf(lines[0]) : null, last: lines.length ? dateOf(lines[lines.length - 1]) : null };
}

const normAcc = (s) => String(s || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

/** Group known transfers by destination: one IASC draft per destination account/wallet. */
function groupByDestination(transfers) {
  const groups = new Map();
  for (const t of transfers) {
    const key = t.currency === 'USDT' ? `wallet:${normAcc(t.destination_account)}` : `${normAcc(t.destination_bank)}:${normAcc(t.destination_account)}`;
    if (!groups.has(key)) groups.set(key, { destination_bank: t.destination_bank, destination_account: t.destination_account, recipient_name: t.recipient_name, currency: t.currency, transfers: [] });
    groups.get(key).transfers.push(t);
  }
  return [...groups.values()].map((g) => ({ ...g, total: g.transfers.reduce((s, t) => s + (t.amount || 0), 0) }));
}

const ANALYZE_SYSTEM = `Kamu adalah Tapak AI, copilot respons awal untuk korban penipuan transfer di Indonesia.
Kamu menyusun draf laporan untuk IASC (Indonesia Anti-Scam Centre) dan kronologi untuk laporan polisi.
Aturan keras:
- Gunakan HANYA fakta dari chat dan daftar transfer yang diberikan. Jangan mengarang nomor rekening, nominal, nama, atau tanggal.
- Rujuk transfer dengan "id" yang diberikan. Jika sebuah permintaan uang di chat tidak punya transfer yang cocok di daftar, set matched_transfer_id null.
- Tulis dalam Bahasa Indonesia yang jelas, netral, dan empatik. Sebut korban "pelapor" dan pelaku "terlapor".
Balas hanya JSON.`;

function analyzePrompt({ chatText, transfers, groups }) {
  return `DAFTAR TRANSFER YANG SUDAH TERBUKTI (dari bukti transfer & data on-chain):
${JSON.stringify(transfers.map(({ id, date, amount, currency, destination_bank, destination_account, recipient_name, source }) => ({ id, date, amount, currency, destination_bank, destination_account, recipient_name, source })), null, 1)}

KELOMPOK PER REKENING/WALLET TUJUAN (satu draf IASC per kelompok, urutan sama):
${JSON.stringify(groups.map((g, i) => ({ index: i, destination_bank: g.destination_bank, destination_account: g.destination_account, recipient_name: g.recipient_name, transfer_ids: g.transfers.map((t) => t.id) })), null, 1)}

CHAT (export WhatsApp, bisa kosong):
"""
${(chatText || '').slice(0, 60000)}
"""

Hasilkan JSON:
{
 "ringkasan_modus": "1-2 kalimat modus penipuan",
 "permintaan_uang": [{"tanggal": "DD/MM/YY HH.MM", "kutipan": "kutipan singkat permintaan dari terlapor", "nominal": number|null, "mata_uang": "IDR"|"USDT", "tujuan": "rekening/wallet yang disebut", "matched_transfer_id": string|null, "pelapor_mengaku_sudah_bayar": boolean}],
 "kronologi_iasc": ["paragraf kronologi singkat (maks 3 kalimat) untuk tiap kelompok, urutan sama dengan kelompok"],
 "kronologi_polisi": "kronologi lengkap berurutan waktu, 1-3 paragraf",
 "bukti_kurang": [{"deskripsi": "apa yang kurang", "saran": "dokumen spesifik yang perlu diminta/disiapkan"}]
}`;
}

export async function analyzeCase(caseId) {
  const kase = await W.getCase(caseId);
  const files = kase.files || [];
  const transfers = [];
  let chatText = '';

  // Receipts uploaded moments ago may not be read yet: read them now so no evidence is skipped.
  for (const f of files) {
    if (f.kind === 'image' && !f.extracted) {
      try {
        const x = await extractReceipt(await W.getFileBytes(f.id), f.mime || 'image/jpeg');
        f.extracted = JSON.stringify(x);
        await W.updateFile(f.id, { extracted: f.extracted });
      } catch (e) { console.error('late extract', e.message); }
    }
  }

  for (const f of files) {
    const x = f.extracted ? JSON.parse(f.extracted) : null;
    if (f.kind === 'image' && x?.adalah_bukti_transfer) {
      transfers.push({
        id: `F${transfers.length + 1}`, file_id: f.id, source: 'bukti transfer',
        date: x.tanggal_waktu, amount: x.nominal, currency: x.mata_uang || 'IDR',
        destination_bank: x.bank_tujuan, destination_account: x.rekening_tujuan, recipient_name: x.nama_penerima,
        reference: x.no_referensi, source_account: x.rekening_sumber, sender: x.nama_pengirim, unreadable: x.tidak_terbaca || [],
      });
    }
    if (f.kind === 'chat') {
      try { chatText += `\n${readChatExport(await W.getFileBytes(f.id), f.name).text}`; } catch (e) { console.error('chat read', e.message); }
    }
  }

  let onchain = [];
  if (kase.wallet) {
    try { onchain = await usdtTransfersFrom(kase.wallet); } catch (e) { console.error('usdt logs', e.message); }
    for (const t of onchain) {
      const d = new Date(t.timestamp * 1000);
      transfers.push({
        id: `C${transfers.length + 1}`, source: 'on-chain BSC', tx_url: t.url, tx_hash: t.txHash,
        date: d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), amount: t.amount, currency: 'USDT',
        destination_bank: 'Wallet BSC', destination_account: t.to, recipient_name: null, reference: t.txHash, unreadable: [],
      });
    }
  }

  const groups = groupByDestination(transfers);
  let llm = { ringkasan_modus: '', permintaan_uang: [], kronologi_iasc: [], kronologi_polisi: '', bukti_kurang: [] };
  if (transfers.length || chatText) {
    llm = parseJson(await callModel({ system: ANALYZE_SYSTEM, content: [{ type: 'text', text: analyzePrompt({ chatText, transfers, groups }) }], maxTokens: 6000 }));
  }

  // Deterministic facts come from extracted data, never from the model.
  const idr = transfers.filter((t) => t.currency !== 'USDT').reduce((s, t) => s + (t.amount || 0), 0);
  const usdt = transfers.filter((t) => t.currency === 'USDT').reduce((s, t) => s + (t.amount || 0), 0);
  const drafts = groups.map((g, i) => ({
    ...g,
    chronology: llm.kronologi_iasc?.[i] || '',
    missing_fields: [...new Set(g.transfers.flatMap((t) => t.unreadable || []))],
  }));

  const hashes = files.map((f) => f.sha256).filter(Boolean);
  const analysis = {
    generated_at: new Date().toISOString(),
    summary: llm.ringkasan_modus,
    transfers, drafts,
    requests: llm.permintaan_uang || [],
    police_chronology: llm.kronologi_polisi || '',
    missing: llm.bukti_kurang || [],
    totals: { idr, usdt, usdt_idr_rate: config.chain.usdtIdr, estimated_idr: idr + usdt * config.chain.usdtIdr },
    evidence: files.map((f) => ({ id: f.id, name: f.name, kind: f.kind, sha256: f.sha256 })),
  };
  const manifestHash = createHash('sha256').update(JSON.stringify({ caseId, hashes: [...hashes].sort() })).digest('hex');
  analysis.manifest_sha256 = manifestHash;

  let anchor = null;
  try {
    anchor = await anchorHashes(caseId, [...hashes, manifestHash]);
    anchor.url = txUrl(anchor.txHash);
  } catch (e) {
    console.error('anchor', e.message);
    anchor = { error: e.message };
  }
  analysis.anchor = anchor;

  await W.updateCase(caseId, { status: 'ready', analysis: JSON.stringify(analysis), anchor_tx: anchor?.txHash || null, manifest_sha256: manifestHash });
  return { kase, analysis };
}
