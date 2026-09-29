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
{"adalah_bukti_transfer": boolean, "tanggal_waktu": "DD/MM/YYYY HH:MM" atau "DD/MM/YYYY HH:MM:SS" jika detik terlihat | null, "nominal": number | null, "mata_uang": "IDR" | "USDT" | null,
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

const FOREIGN_SCRIPT = /[\u0400-\u04FF\u0590-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;
const scrubForeign = (v) => typeof v === 'string'
  ? v.replace(/\S*[\u0400-\u04FF\u0590-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]\S*\s?/g, '').replace(/\s{2,}/g, ' ')
  : Array.isArray(v) ? v.map(scrubForeign) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrubForeign(x)])) : v;

const money = (n, cur) => (cur === 'USDT' ? `${Number(n).toLocaleString('id-ID')} USDT` : `Rp${Math.round(n).toLocaleString('id-ID')}`);

/**
 * Chronology for the IASC form, written in the victim's voice and assembled only from extracted facts:
 * each request quoted verbatim from the chat and each proven transfer, so stories cannot mix between accounts.
 */
export function iascChronology(g, requests, reported, hasChat) {
  const ids = new Set(g.transfers.map((t) => t.id));
  const acc = normAcc(g.destination_account);
  const mine = requests.filter((r) => (r.matched_transfer_id && ids.has(r.matched_transfer_id)) || (!r.matched_transfer_id && acc && normAcc(r.tujuan).includes(acc)));
  const isWallet = g.currency === 'USDT';
  const target = isWallet
    ? `wallet BSC ${g.destination_account}`
    : `rekening ${g.destination_bank ?? ''} ${g.destination_account ?? ''}${g.recipient_name ? ` a.n. ${g.recipient_name}` : ''}`.replace(/\s+/g, ' ');
  const parts = [];
  if (hasChat || reported.nama_digunakan) parts.push(`Saya dihubungi oleh terlapor${reported.nama_digunakan ? ` yang mengaku bernama ${reported.nama_digunakan}` : ''}${hasChat ? ' melalui WhatsApp' : ''}.`);
  for (const r of mine) {
    parts.push(`Pada ${r.tanggal}, terlapor meminta ${r.nominal != null ? money(r.nominal, r.mata_uang) : 'uang'} ke ${target} dengan pesan: "${String(r.kutipan).trim()}".`);
    if (!r.matched_transfer_id && r.pelapor_mengaku_sudah_bayar) parts.push(`Saya sudah mentransfer ${r.nominal != null ? money(r.nominal, r.mata_uang) : 'uang tersebut'} untuk permintaan ini (bukti transfer sedang saya siapkan).`);
  }
  for (const t of g.transfers) parts.push(`Pada ${t.date ?? 'waktu yang belum terbaca'}, saya mentransfer ${t.amount != null ? money(t.amount, t.currency) : 'dana'} ke ${mine.length ? (isWallet ? 'wallet tersebut' : 'rekening tersebut') : target}.`);
  return parts.join(' ');
}

const normAcc = (s) => String(s || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

/** One IASC form covers transfers from one victim account to one reported account, so group by that pair. */
function groupByDestination(transfers) {
  const groups = new Map();
  for (const t of transfers) {
    const key = t.currency === 'USDT'
      ? `wallet:${normAcc(t.destination_account)}`
      : `${normAcc(t.source_bank)}:${normAcc(t.source_account)}>${normAcc(t.destination_bank)}:${normAcc(t.destination_account)}`;
    if (!groups.has(key)) groups.set(key, {
      destination_bank: t.destination_bank, destination_account: t.destination_account, recipient_name: t.recipient_name, currency: t.currency,
      source_bank: t.source_bank || null, source_account: t.source_account || null, sender: t.sender || null, transfers: [],
    });
    groups.get(key).transfers.push(t);
  }
  return [...groups.values()].map((g) => ({ ...g, total: g.transfers.reduce((s, t) => s + (t.amount || 0), 0) }));
}

const ANALYZE_SYSTEM = `Kamu adalah Tapak AI, copilot respons awal untuk korban penipuan transfer di Indonesia.
Kamu menyusun draf laporan untuk IASC (Indonesia Anti-Scam Centre) dan kronologi untuk laporan polisi.
Aturan keras:
- Gunakan HANYA fakta dari chat dan daftar transfer yang diberikan. Jangan mengarang nomor rekening, nominal, nama, atau tanggal.
- Rujuk transfer dengan "id" yang diberikan HANYA di field matched_transfer_id. Jangan pernah menulis id internal (misalnya F1, C4) di teks apa pun; sebut transfernya dengan tanggal, nominal, dan rekening. Jika sebuah permintaan uang di chat tidak punya transfer yang cocok di daftar, set matched_transfer_id null.
- Tulis hanya dalam Bahasa Indonesia (huruf Latin) yang jelas, netral, dan empatik. Sebut korban "pelapor" dan pelaku "terlapor".
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
 "kronologi_iasc": [{"index": "index kelompok dari daftar KELOMPOK", "teks": "kronologi untuk kolom Kronologi formulir IASC khusus rekening/wallet kelompok ini, satu entri per kelompok. Isinya HANYA permintaan dan transfer yang terkait rekening/wallet kelompok ini. Tulis sebagai orang pertama (\"Saya ...\"), karena korban sendiri yang mengirimnya. 2-4 kalimat: bagaimana terlapor menghubungi, alasan yang dipakai untuk meminta uang ke rekening ini, lalu tanggal-jam dan nominal transfer ke rekening ini. Jangan menyebut verifikasi, pencocokan, atau istilah internal. Jika pelapor mengaku sudah membayar sebuah permintaan tetapi transfernya tidak ada di daftar, tulis sebagai pernyataan pelapor, misalnya \"Saya juga mentransfer Rp5.000.000 pada 02/06/2026 (bukti transfer sedang saya siapkan).\""}],
 "kronologi_polisi": "kronologi lengkap berurutan waktu, 1-3 paragraf",
 "terlapor": {"nama_digunakan": "nama/panggilan yang dipakai terlapor di chat" | null, "nomor_telepon": ["nomor telepon terlapor HANYA jika tertulis persis di chat"], "platform": ["platform tempat pelapor berkenalan/dihubungi, HANYA jika disebut atau jelas dari sumber chat"], "akun": ["username/akun media sosial terlapor HANYA jika tertulis"]},
 "waktu_kejadian": "DD/MM/YYYY HH:MM saat permintaan uang pertama dari terlapor di chat" | null,
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
        reference: x.no_referensi, source_bank: x.bank_sumber, source_account: x.rekening_sumber, sender: x.nama_pengirim, unreadable: x.tidak_terbaca || [],
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
    const ask = async () => parseJson(await callModel({ system: ANALYZE_SYSTEM, content: [{ type: 'text', text: analyzePrompt({ chatText, transfers, groups }) }], maxTokens: 6000 }));
    llm = await ask();
    // The model occasionally slips a non-Latin word into Indonesian text: retry once, then strip what is left.
    if (FOREIGN_SCRIPT.test(JSON.stringify(llm))) llm = await ask();
    llm = scrubForeign(llm);
  }
  // Chronologies are keyed by group index so a reordered answer cannot attach a story to the wrong account.
  const chronoByGroup = new Map();
  (llm.kronologi_iasc || []).forEach((k, pos) => {
    if (typeof k === 'string') chronoByGroup.set(pos, k);
    else if (k && k.teks != null) chronoByGroup.set(Number(k.index), k.teks);
  });

  // Deterministic facts come from extracted data, never from the model.
  const idr = transfers.filter((t) => t.currency !== 'USDT').reduce((s, t) => s + (t.amount || 0), 0);
  const usdt = transfers.filter((t) => t.currency === 'USDT').reduce((s, t) => s + (t.amount || 0), 0);
  const drafts = groups.map((g, i) => ({
    ...g,
    chronology: iascChronology(g, llm.permintaan_uang || [], llm.terlapor || {}, !!files.find((f) => f.kind === 'chat')) || chronoByGroup.get(i) || '',
    missing_fields: [...new Set(g.transfers.flatMap((t) => t.unreadable || []))],
  }));

  // IASC form facts (step 2-4). The WhatsApp source is known from the export itself, not from the model.
  const chatFile = files.find((f) => f.kind === 'chat');
  const t = llm.terlapor || {};
  const platform = [...new Set([...(chatFile ? ['WhatsApp'] : []), ...(t.platform || [])])];
  const iasc = {
    reported: { name: t.nama_digunakan || null, phones: t.nomor_telepon || [], platform, accounts: t.akun || [] },
    incident_time: llm.waktu_kejadian || null,
    chat_file: chatFile?.name || null,
  };

  const hashes = files.map((f) => f.sha256).filter(Boolean);
  const analysis = {
    generated_at: new Date().toISOString(),
    summary: llm.ringkasan_modus,
    transfers, drafts,
    requests: llm.permintaan_uang || [],
    police_chronology: llm.kronologi_polisi || '',
    missing: llm.bukti_kurang || [],
    iasc,
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
