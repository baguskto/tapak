// Server-rendered pages: case report (drafts), public verifier, dashboard. The landing page is static (worker/public).
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const rupiah = (n: number | null | undefined) => (n == null ? '—' : `Rp${Math.round(n).toLocaleString('id-ID')}`);
const amount = (n: number | null | undefined, cur?: string) => (cur === 'USDT' ? `${(n ?? 0).toLocaleString('id-ID')} USDT` : rupiah(n));

const brandMark = `tapak<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M3 23h5c8 0 14-7 16-17M15 6h9v9"/></svg>`;

// Same design system as the landing page (worker/public/index.html): cream/ink/olive/lime, Archivo + DM Sans.
const layout = (title: string, body: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 30 30%22%3E%3Crect width=%2230%22 height=%2230%22 rx=%227%22 fill=%22%2323261c%22/%3E%3Cpath d=%22M6 22h4c6 0 10-5 12-13M15 9h7v7%22 fill=%22none%22 stroke=%22%23e4f297%22 stroke-width=%222.6%22 stroke-linecap=%22round%22/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;450;500;600;650&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root{--ink:#23261c;--cream:#f8f7f2;--olive:#53593e;--olive2:#737d4e;--lime:#e4f297;--limeline:#d5e088;--muted:#6d7461;--line:#dedfd5;--soft:#eef0e2;--card:#fff;--okbg:#edf2df;--ok:#566a30;--warnbg:#f7eed6;--warn:#85641c;--badbg:#f6e3dc;--bad:#8c3b25}
*{box-sizing:border-box}html,body{overflow-x:clip}
body{margin:0;background:var(--cream);color:var(--ink);font:16px/1.6 "DM Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--olive);text-underline-offset:3px}.wrap{max-width:1080px;margin:0 auto;padding:0 24px}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;height:76px;border-bottom:1px solid var(--line)}
.brand{font-family:Archivo,sans-serif;font-weight:650;font-size:30px;letter-spacing:-2px;display:flex;gap:5px;align-items:center;color:var(--ink);text-decoration:none}
.brand svg{width:26px;height:26px;stroke:currentColor;margin-top:6px;stroke-width:2.8;fill:none}
nav{display:flex;align-items:center;gap:22px;font-size:14px}nav a{color:var(--ink);text-decoration:none}nav a:hover{text-decoration:underline}
h1,h2,h3{font-family:Archivo,sans-serif;font-weight:450;line-height:1.08;margin:0;text-wrap:balance;color:var(--ink)}
h1{font-size:clamp(34px,5.4vw,58px);letter-spacing:-.045em}h1 em{font-style:normal;color:var(--olive2)}
h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.03em;margin:56px 0 18px}h3{font-size:20px;letter-spacing:-.02em;font-weight:500}
.hero{padding:56px 0 8px}.hero p{color:var(--muted);font-size:18px;max-width:640px}
.tag{font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:var(--olive2);font-weight:600}
.btn{display:inline-flex;align-items:center;gap:14px;background:var(--ink);color:#fff;text-decoration:none;font:500 14px/1.2 "DM Sans",sans-serif;padding:14px 20px;border-radius:4px;border:1px solid var(--ink);cursor:pointer;min-height:44px}
.btn:hover{background:#383e2a}.btn:disabled{opacity:.6;cursor:wait}.btn.small{padding:10px 14px;font-size:13px;min-height:38px}
.btn.lime{background:var(--lime);border-color:var(--lime);color:var(--ink)}.btn:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid var(--olive2);outline-offset:2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:22px 24px;box-shadow:0 12px 36px #4145300d}.grid{display:grid;gap:18px}
@media(min-width:760px){.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}}
.muted{color:var(--muted)}.mono{font-family:"JetBrains Mono",monospace;font-size:12.5px;word-break:break-all}
.urgent{border-left:3px solid var(--olive);background:#fff;padding:14px 18px;border-radius:0 8px 8px 0;font-size:15px;line-height:1.55}.urgent b{font-weight:700}
.pill{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:3px 8px;border-radius:4px;background:var(--okbg);color:var(--ok);border:1px solid #dfe8c8;white-space:nowrap}
.pill a{color:inherit}.pill.warn{background:var(--warnbg);color:var(--warn);border-color:#eedfb8}.pill.bad{background:var(--badbg);color:var(--bad);border-color:#efcdbf}
table{width:100%;border-collapse:collapse;font-size:14.5px}th{text-align:left;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:600;border-bottom:1px solid var(--ink);padding:8px 10px 8px 0}
td{border-bottom:1px solid var(--line);padding:11px 10px 11px 0;vertical-align:top}.tbl{overflow-x:auto}
/* Draft card: mirrors the landing hero's "Draf laporan" card */
.draft-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.draft-top strong{font-size:15px;font-weight:600}
.bankline{display:flex;gap:12px;margin:20px 0 6px;align-items:center}.bankline>div{min-width:0}.bankline span{overflow-wrap:anywhere}.bankline strong{display:block;font-size:14px;font-weight:600;letter-spacing:.01em}.bankline span{font-size:13px;color:var(--muted)}
.bankicon{flex:none;width:42px;height:42px;border:1px solid #dadfd1;border-radius:7px;display:grid;place-items:center;font:600 11px Archivo,sans-serif;color:#5c6349;background:#f4f6ed}
.amount{font-family:Archivo,sans-serif;font-size:34px;letter-spacing:-1.2px;font-weight:450;margin:6px 0 14px}
.grid>*{min-width:0}.kv b{min-width:0;overflow-wrap:anywhere}td.date{white-space:nowrap;word-break:normal}.kv{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #eceee5;padding:9px 0;font-size:14px}.kv span{color:var(--muted)}.kv b{text-align:right;font-weight:500}
.cardbadge{display:inline-flex;gap:6px;background:var(--okbg);color:var(--ok);border:1px solid #dfe8c8;padding:6px 10px;border-radius:4px;font-size:13px;margin-top:6px}
.note{display:flex;gap:12px;background:#fbfaf3;border:1px solid #e8e5cf;border-radius:8px;padding:12px 14px;margin-top:10px;font-size:14px}.note .noteicon{flex:none;width:26px;height:26px;background:#f0eddb;border-radius:50%;display:grid;place-items:center;color:#8e865b;font-weight:700}
details.copybox{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}details.copybox summary{cursor:pointer;font-weight:500;font-size:14px;color:var(--olive)}
pre.copy{white-space:pre-wrap;background:var(--cream);border:1px solid #ecebe2;border-radius:8px;padding:14px;font:14px/1.6 "DM Sans",sans-serif;margin:12px 0 10px}
.cpy{background:var(--ink);color:#fff;border:0;border-radius:4px;padding:9px 14px;font:500 13px "DM Sans",sans-serif;cursor:pointer;min-height:38px}
/* AI summary: mirrors the landing hero's lime "Tapak AI" card */
.ai-card{background:var(--lime);border:1px solid var(--limeline);border-radius:10px;padding:20px 22px;color:#3f4d27}
.ai-top{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600}.ai-symbol{width:28px;height:28px;display:grid;place-items:center;border-radius:6px;background:#526130;color:#eff6d5;font-size:18px}
.ai-top small{margin-left:auto;font-size:11px;letter-spacing:.08em;color:#6c7c40;font-weight:500}.ai-card p{margin:12px 0 0;font-size:15.5px;line-height:1.65}
.stats{display:flex;flex-wrap:wrap;gap:10px 28px;margin:18px 0 0;padding:0;list-style:none}.stats li{font-size:14px;color:var(--muted)}.stats b{display:block;font:450 26px/1.2 Archivo,sans-serif;letter-spacing:-.8px;color:var(--ink)}
.res{border-radius:10px;padding:18px 20px;margin-top:16px;border:1px solid}.res.ok{background:var(--okbg);border-color:#dfe8c8}.res.bad{background:var(--badbg);border-color:#efcdbf}.res h3{margin-bottom:6px}
.drop{display:block;border:1.5px dashed #c9cdb9;border-radius:10px;background:#fbfbf7;padding:28px;text-align:center;cursor:pointer}.drop:hover{border-color:var(--olive)}.drop input{display:block;margin:12px auto 0;font:inherit;max-width:100%}
input[type=text],input:not([type]){font:inherit}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px;padding:28px 0 44px;margin-top:64px}
@media(max-width:640px){nav a.hide-sm{display:none}.card{padding:18px}.amount{font-size:30px}}
</style></head><body>
<header class="top"><div class="wrap"><a class="brand" href="/" aria-label="Tapak beranda">${brandMark}</a><nav><a class="hide-sm" href="/verify">Cek bukti</a><a class="hide-sm" href="/app">Masuk</a><a class="btn small" href="https://t.me/TapakAiBot" target="_blank" rel="noopener">Buka bot ↗</a></nav></div></header>
${body}
<footer><div class="wrap">Tapak menyiapkan <b>draf</b>, bukan laporan yang sudah terkirim. Laporkan lewat <a href="https://iasc.ojk.go.id">iasc.ojk.go.id</a>, jalur fraud bank/e-wallet, dan kantor polisi. Tapak tidak pernah menawarkan jasa pengembalian dana. Dibangun untuk Indonesia Web3 Hackathon 2026 · BNB Chain · <a href="https://github.com/baguskto/tapak">kode sumber</a>.</div></footer>
<script>document.querySelectorAll('.cpy').forEach(b=>b.addEventListener('click',async()=>{const t=document.getElementById(b.dataset.t).innerText;try{await navigator.clipboard.writeText(t);b.textContent='Tersalin ✓'}catch(e){const r=document.createRange();r.selectNodeContents(document.getElementById(b.dataset.t));getSelection().removeAllRanges();getSelection().addRange(r);b.textContent='Tekan Ctrl/Cmd+C'}}))</script>
</body></html>`;

type Analysis = {
  summary: string; drafts: any[]; transfers: any[]; requests: any[]; police_chronology: string; missing: any[];
  totals: { idr: number; usdt: number; estimated_idr: number; usdt_idr_rate: number }; evidence: any[]; anchor: any; manifest_sha256: string; generated_at: string;
};

const bankCode = (bank?: string) => {
  const b = (bank ?? '').toUpperCase();
  if (b.includes('MANDIRI')) return 'MDR';
  if (b.includes('BSC') || b.includes('BNB') || b.includes('WALLET')) return 'BSC';
  return b.replace(/[^A-Z]/g, '').slice(0, 3) || '—';
};

export function reportPage(c: any, explorer: string) {
  if (!c.analysis) {
    return layout('Draf belum siap · Tapak', `<main class="wrap"><h2>Draf belum disusun</h2><p class="muted">Kasus ini punya ${c.files.length} bukti. Ketik <b>/laporan</b> di bot Telegram untuk menyusun draf.</p></main>`);
  }
  const a: Analysis = JSON.parse(c.analysis);
  const drafts = a.drafts.map((d, i) => {
    const txs = d.transfers.map((t: any) => `${t.date ?? '—'} · ${amount(t.amount, t.currency)}${t.reference ? ` · ref ${t.reference}` : ''}`).join('\n');
    const text = `Rekening/wallet tujuan: ${d.destination_bank ?? ''} ${d.destination_account ?? ''}\nNama penerima: ${d.recipient_name ?? '—'}\nTotal: ${amount(d.total, d.currency)}\nTransaksi:\n${txs}\n\nKronologi:\n${d.chronology}`;
    const first = d.transfers[0] ?? {};
    const refs = d.transfers.map((t: any) => t.reference).filter(Boolean).map((r: string) => (/^0x[0-9a-f]{64}$/i.test(r) ? `${r.slice(0, 6)}…${r.slice(-5)}` : r));
    const needs = d.missing_fields?.length
      ? `<div class="note"><span class="noteicon">!</span><div><b>Data perlu dicek.</b><br><span class="muted">${esc(d.missing_fields.join('; '))}</span></div></div>`
      : `<span class="cardbadge">✓ Siap untuk ditinjau</span>`;
    return `<div class="card draft"><div class="draft-top"><strong>Draf laporan</strong><span class="tag">IASC ${i + 1} / ${a.drafts.length}</span></div>
      <div class="bankline"><div class="bankicon">${esc(bankCode(d.destination_bank))}</div><div><strong>${esc((d.recipient_name ?? (d.currency === 'USDT' ? 'Wallet tujuan' : 'Penerima belum terbaca')).toUpperCase())}</strong><span>${esc(d.destination_bank ?? '')} · ${esc(d.destination_account ?? '—')}</span></div></div>
      <div class="amount">${amount(d.total, d.currency)}</div>
      <div class="kv"><span>${d.transfers.length > 1 ? 'Transfer pertama' : 'Waktu transfer'}</span><b>${esc(first.date ?? '—')}</b></div>
      <div class="kv"><span>Nomor referensi</span><b>${refs.length ? esc(refs.join(', ')) : 'belum terbaca'}</b></div>
      <div class="kv"><span>Jumlah transfer</span><b>${d.transfers.length}</b></div>
      ${needs}
      <details class="copybox"><summary>Lihat teks draf untuk formulir IASC</summary><pre class="copy" id="d${i}">${esc(text)}</pre><button class="cpy" data-t="d${i}">Salin draf</button></details></div>`;
  }).join('');

  const reqs = a.requests.map((r) => {
    const t = a.transfers.find((x) => x.id === r.matched_transfer_id);
    return `<tr><td class="mono date">${esc(r.tanggal)}</td><td><i>"${esc(r.kutipan)}"</i></td><td>${t ? `${esc(t.destination_bank ?? '')} ${esc(t.destination_account ?? '')}<br><span class="muted">${esc(t.date)}</span>` : '—'}</td>
      <td style="text-align:right">${amount(r.nominal, r.mata_uang)}</td><td>${t ? `<span class="pill">${t.source === 'on-chain BSC' ? `<a href="${esc(t.tx_url)}">on-chain</a>` : 'bukti'}</span>` : '<span class="pill warn">bukti kurang</span>'}</td></tr>`;
  }).join('');

  const ev = a.evidence.map((e) => `<tr><td>${esc(e.name)}</td><td>${esc(e.kind)}</td><td class="mono">${esc(e.sha256)}</td></tr>`).join('');
  const anchor = a.anchor?.txHash
    ? `<p><span class="pill">tercatat on-chain</span> Transaksi <a class="mono" href="${esc(a.anchor.url)}">${esc(a.anchor.txHash)}</a></p>`
    : `<p><span class="pill warn">on-chain tertunda</span> ${esc(a.anchor?.error ?? '')}</p>`;

  const proven = a.transfers.length, asked = a.requests.length, gaps = a.requests.filter((r) => !r.matched_transfer_id).length;
  return layout('Draf laporan · Tapak', `
<section class="hero"><div class="wrap">
  <div class="tag">Draf laporan · siap kamu tinjau</div>
  <h1 style="margin:14px 0 6px">${a.drafts.length} draf laporan,<br><em>${rupiah(a.totals.idr)}${a.totals.usdt ? ` + ${a.totals.usdt.toLocaleString('id-ID')} USDT` : ''}.</em></h1>
  <ul class="stats"><li><b>${a.drafts.length}</b>rekening/wallet tujuan</li><li><b>${proven}</b>transfer terbukti</li>${asked ? `<li><b>${asked - gaps}/${asked}</b>permintaan cocok</li>` : ''}${a.totals.usdt ? `<li><b>≈ ${rupiah(a.totals.estimated_idr)}</b>total setara rupiah</li>` : ''}</ul>
</div></section>
<main class="wrap">
  <div class="ai-card" style="margin-top:28px"><div class="ai-top"><span class="ai-symbol">✧</span> Tapak AI <small>RINGKASAN KASUS</small></div><p>${esc(a.summary)}</p></div>
  <div class="urgent" style="margin-top:18px"><b>Belum menelepon jalur fraud bank asal?</b> Lakukan sekarang dan minta nomor laporan. Satu formulir IASC untuk satu rekening tujuan. Laporan polisi tetap perlu dibuat.</div>
  <h2>Satu draf untuk setiap rekening tujuan</h2><div class="grid g2">${drafts || '<p class="muted">Belum ada transfer terbukti.</p>'}</div>
  <h2>Permintaan di chat, dipasangkan dengan transfer</h2><div class="card tbl"><table><thead><tr><th>Tanggal</th><th>Permintaan terlapor</th><th>Transfer</th><th style="text-align:right">Nilai</th><th>Bukti</th></tr></thead><tbody>${reqs || '<tr><td colspan="5" class="muted">Kirim export chat WhatsApp untuk pencocokan.</td></tr>'}</tbody></table></div>
  ${a.missing.length ? `<h2>Bukti yang masih kurang</h2><div class="grid">${a.missing.map((m) => `<div class="note" style="margin:0;background:#fff"><span class="noteicon">!</span><div><b>${esc(m.deskripsi)}</b><br><span class="muted">${esc(m.saran)}</span></div></div>`).join('')}</div>` : ''}
  <h2>Kronologi untuk laporan polisi</h2><div class="card"><pre class="copy" id="pol">${esc(a.police_chronology)}</pre><button class="cpy" data-t="pol">Salin kronologi</button></div>
  <h2>Sidik jari bukti di BNB Chain</h2><div class="card">${anchor}
    <p class="muted">Setiap berkas di bawah punya sidik jari SHA-256. Unggah berkas yang sama di <a href="/verify">halaman verifikasi</a> untuk memastikan tidak berubah sejak dicatat. Blockchain membuktikan integritas berkas, bukan kebenaran isi chat.</p>
    <div class="tbl"><table><thead><tr><th>Berkas</th><th>Jenis</th><th>SHA-256</th></tr></thead><tbody>${ev}</tbody></table></div>
    <p class="muted">Manifest kasus: <span class="mono">${esc(a.manifest_sha256)}</span> · Kontrak: <a href="${esc(explorer)}">EvidenceRegistry</a></p></div>
</main>`);
}

export function verifyPage() {
  return layout('Verifikasi bukti · Tapak', `
<section class="hero"><div class="wrap"><div class="tag">Verifier publik · tanpa akun</div>
<h1 style="margin:14px 0 14px">Berkas berubah?<br><em>Sidik jarinya juga.</em></h1>
<p>Berkas dihitung sidik jarinya (SHA-256) di browser kamu. Berkas tidak diunggah ke mana pun; hanya sidik jarinya yang dicocokkan ke kontrak EvidenceRegistry di BNB Chain.</p></div></section>
<main class="wrap"><div class="card" style="margin-top:28px">
  <label class="drop" for="f"><b>Pilih berkas bukti</b><br><span class="muted">Screenshot transfer, export chat, atau dokumen yang pernah dikirim ke Tapak.</span><input id="f" type="file"></label>
  <p class="muted mono" id="h" style="margin:14px 0 0"></p><div id="out"></div></div></main>
<script>
const f=document.getElementById('f'),h=document.getElementById('h'),out=document.getElementById('out');
f.addEventListener('change',async()=>{const file=f.files[0];if(!file)return;out.innerHTML='Menghitung…';
 const buf=await file.arrayBuffer();const d=await crypto.subtle.digest('SHA-256',buf);
 const hex=[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');h.textContent='sha256 · '+hex;
 const r=await fetch('/api/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sha256:hex})});const j=await r.json();
 if(j.onchain&&j.onchain.found){const t=new Date(j.onchain.timestamp*1000).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
  out.innerHTML='<div class="res ok"><h3>Cocok ✓</h3><p>Berkas ini identik dengan yang dicatat di BNB Chain pada <b>'+t+' WIB</b>.</p><p class="mono">case '+j.onchain.caseId+'</p></div>';}
 else if(j.known){out.innerHTML='<div class="res ok"><h3>Terdaftar di Tapak</h3><p>Berkas dikenal, tetapi belum tercatat on-chain.</p></div>';}
 else{out.innerHTML='<div class="res bad"><h3>Tidak cocok ✗</h3><p>Sidik jari berkas ini tidak ditemukan. Berkas berbeda (walau satu karakter) dari yang pernah dicatat.</p></div>';}});
</script>`);
}

/** Frontend API host is encoded in the publishable key: pk_(test|live)_<base64("host$")>. */
export const clerkFrontendApi = (pk: string) => atob(pk.split('_')[2] ?? '').replace(/\$$/, '');

export function appPage(pk: string, bot: string) {
  const fapi = clerkFrontendApi(pk);
  return layout('Dashboard · Tapak', `
<main class="wrap" style="padding-block:48px 10px">
  <div id="signed-out" hidden>
    <div class="grid g2" style="align-items:center">
      <div><div class="tag">Masuk ke Tapak</div><h1 style="margin:14px 0 16px">Semua kasus dan draf laporanmu,<br><em>di satu tempat.</em></h1>
      <p class="muted">Unggah bukti lewat web, atau hubungkan akun Telegram <a href="https://t.me/${esc(bot)}">@${esc(bot)}</a> supaya kasus dari bot ikut tampil di sini.</p>
      <div class="urgent" style="margin-top:20px"><b>Baru saja transfer?</b> Telepon dulu nomor fraud resmi bank atau e-wallet asal dan minta nomor laporan, sebelum mengisi apa pun.</div></div>
      <div id="sign-in"></div>
    </div>
  </div>
  <div id="signed-in" hidden>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <div><div class="tag">Dashboard</div><h1 style="font-size:clamp(30px,4vw,44px);margin-top:10px">Halo, <em id="uname"></em></h1></div>
      <div id="user-button"></div>
    </div>
    <h2>Kasus baru lewat web</h2>
    <div class="card">
      <p class="muted" style="margin-top:0">Pilih screenshot bukti transfer, export chat WhatsApp (.txt/.zip), dan dokumen pendukung. Isi alamat wallet jika mengirim USDT.</p>
      <label class="drop" for="files" style="margin:6px 0 18px"><b>Berkas bukti</b><br><span class="muted">Bisa pilih beberapa berkas sekaligus.</span><input id="files" type="file" multiple></label>
      <label for="wallet"><b>Alamat wallet (opsional)</b></label><br><input id="wallet" placeholder="0x…" style="width:100%;max-width:520px;padding:12px;border:1px solid var(--line);border-radius:6px;margin:8px 0 18px;font:inherit;background:#fff">
      <br><button class="btn" id="go">Unggah &amp; susun draf</button> <span id="prog" class="muted"></span>
    </div>
    <h2>Kasus saya</h2>
    <div class="card tbl"><table><thead><tr><th>Dibuat</th><th>Sumber</th><th>Bukti</th><th>Draf</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody id="cases"><tr><td colspan="7" class="muted">Memuat…</td></tr></tbody></table></div>
    <h2>Hubungkan Telegram</h2>
    <div class="card"><p class="muted" style="margin-top:0" id="tgstate">Tampilkan kasus dari bot di dashboard ini.</p><button class="btn" id="link">Buat kode</button> <span id="code" class="mono"></span></div>
  </div>
</main>
<script async crossorigin="anonymous" data-clerk-publishable-key="${esc(pk)}" src="https://${esc(fapi)}/npm/@clerk/clerk-js@5/dist/clerk.browser.js" type="text/javascript"></script>
<script>
const $=(id)=>document.getElementById(id);
const ap={variables:{colorPrimary:'#23261c',colorText:'#23261c',colorBackground:'#ffffff',fontFamily:'"DM Sans",system-ui,sans-serif',borderRadius:'6px'}};
const rp=(n)=>n==null?'—':'Rp'+Math.round(n).toLocaleString('id-ID');
async function api(path,opt={}){const t=await window.Clerk.session.getToken();const r=await fetch(path,{...opt,headers:{...(opt.headers||{}),authorization:'Bearer '+t}});if(!r.ok)throw new Error((await r.text()).slice(0,200));return r.json();}
async function loadCases(){const d=await api('/api/me/cases');$('tgstate').textContent=d.telegram_linked?'Telegram sudah terhubung ✓ Kasus dari bot tampil di tabel di atas.':'Tampilkan kasus dari bot di dashboard ini.';
 $('cases').innerHTML=d.cases.length?d.cases.map(c=>'<tr><td class="mono">'+new Date(c.created_at).toLocaleString('id-ID')+'</td><td>'+c.source+'</td><td>'+c.files+'</td><td>'+c.drafts+'</td><td>'+rp(c.total_idr)+'</td><td><span class="pill '+(c.status==='ready'?'':'warn')+'">'+(c.status==='ready'?'draf siap':'mengumpulkan')+'</span>'+(c.anchor_tx?' <span class="pill">on-chain</span>':'')+'</td><td>'+(c.status==='ready'?'<a href="/k/'+c.public_token+'">Buka draf</a>':'')+'</td></tr>').join(''):'<tr><td colspan="7" class="muted">Belum ada kasus.</td></tr>';return d;}
async function go(){const files=[...$('files').files];const wallet=$('wallet').value.trim();if(!files.length&&!wallet){$('prog').textContent='Pilih minimal satu berkas atau isi wallet.';return;}
 $('go').disabled=true;try{$('prog').textContent='Membuat kasus…';const c=await api('/api/me/cases',{method:'POST'});
 for(const [i,f] of files.entries()){$('prog').textContent='Mengunggah '+(i+1)+'/'+files.length+': '+f.name;await api('/api/me/cases/'+c.id+'/files?name='+encodeURIComponent(f.name),{method:'POST',headers:{'content-type':f.type||'application/octet-stream'},body:f});}
 if(wallet)await api('/api/me/cases/'+c.id+'/wallet',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({wallet})});
 $('prog').textContent='Agen menyusun draf dan mencatat sidik jari bukti di BNB Chain…';await api('/api/me/cases/'+c.id+'/analyze',{method:'POST'});
 for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,5000));const d=await loadCases();const me=d.cases.find(x=>x.id===c.id);if(me&&me.status==='ready'){$('prog').innerHTML='Draf siap ✓ <a href="/k/'+me.public_token+'">Buka draf</a>';break;}}
 }catch(e){$('prog').textContent='Gagal: '+e.message}finally{$('go').disabled=false}}
window.addEventListener('load',async()=>{await window.Clerk.load({signInForceRedirectUrl:'/app',signUpForceRedirectUrl:'/app',afterSignOutUrl:'/'});const render=async()=>{const u=window.Clerk.user;$('signed-out').hidden=!!u;$('signed-in').hidden=!u;
 if(!u){window.Clerk.mountSignIn($('sign-in'),{appearance:ap,forceRedirectUrl:'/app',signUpForceRedirectUrl:'/app'});return;}$('uname').textContent=u.firstName||u.primaryEmailAddress?.emailAddress||'';window.Clerk.mountUserButton($('user-button'),{appearance:ap});loadCases().catch(e=>$('cases').innerHTML='<tr><td colspan="7">'+e.message+'</td></tr>');};
 render();window.Clerk.addListener(()=>render());$('go').onclick=go;$('link').onclick=async()=>{const d=await api('/api/me/link-code',{method:'POST'});$('code').innerHTML='Kirim <b>/hubungkan '+d.code+'</b> ke <a href="https://t.me/${esc(bot)}">@${esc(bot)}</a> (berlaku '+d.expires_in_minutes+' menit)';};});
</script>`);
}
