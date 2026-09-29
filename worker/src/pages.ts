// Server-rendered pages: landing, case report (drafts), public verifier.
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const rupiah = (n: number | null | undefined) => (n == null ? '—' : `Rp${Math.round(n).toLocaleString('id-ID')}`);
const amount = (n: number | null | undefined, cur?: string) => (cur === 'USDT' ? `${(n ?? 0).toLocaleString('id-ID')} USDT` : rupiah(n));

const layout = (title: string, body: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,700;112,800;125,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root{--navy:#0E1A2B;--navy2:#16263C;--paper:#EEF2F5;--card:#fff;--ink:#0E1A2B;--slate:#5B6B7F;--line:#CAD3DC;--teal:#0F8B74;--tealhi:#5FD3B8;--tealsoft:#D5ECE6;--rose:#E8586B;--rosesoft:#FBE3E6;--rosedeep:#9C2336;--amber:#F2A33A;--ambersoft:#FCEBD2}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 "Plus Jakarta Sans",system-ui,sans-serif}
a{color:var(--teal)}.wrap{max-width:980px;margin:0 auto;padding:0 18px}
header.top{background:var(--navy);color:var(--paper)}header.top .wrap{display:flex;align-items:center;justify-content:space-between;padding-block:16px}
.brand{font-family:Archivo,sans-serif;font-stretch:125%;font-weight:800;font-size:26px;text-decoration:none;color:var(--paper)}.brand i{font-style:normal;color:var(--tealhi)}
nav a{color:#CFDAE4;text-decoration:none;margin-left:18px;font-weight:600;font-size:14px}
h1,h2,h3{font-family:Archivo,sans-serif;font-stretch:112%;line-height:1.1;margin:0;text-wrap:balance}
h1{font-size:clamp(34px,6vw,58px);font-weight:800}h2{font-size:26px;margin:36px 0 14px}h3{font-size:19px}
.hero{background:var(--navy);color:var(--paper);padding:56px 0 64px}.hero p{color:#AFC0D0;font-size:19px;max-width:640px}
.tag{font-family:"JetBrains Mono",monospace;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--tealhi)}
.btn{display:inline-block;background:var(--teal);color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:12px;border:0;cursor:pointer;font:inherit}
.btn.ghost{background:transparent;border:1px solid #3A4E66;color:var(--paper)}.btn:focus-visible{outline:3px solid var(--tealhi);outline-offset:2px}
.card{background:var(--card);border-radius:14px;padding:20px 22px}.grid{display:grid;gap:16px}
@media(min-width:760px){.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}}
.muted{color:var(--slate)}.mono{font-family:"JetBrains Mono",monospace;font-size:13px;word-break:break-all}
.urgent{background:var(--rosesoft);color:var(--rosedeep);border-radius:14px;padding:16px 18px;font-weight:600}
.pill{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:12px;padding:3px 8px;border-radius:6px;background:var(--tealsoft);color:#0A5F4F}
.pill.warn{background:var(--ambersoft);color:#8A5A12}.pill.bad{background:var(--rosesoft);color:var(--rosedeep)}
table{width:100%;border-collapse:collapse;font-size:15px}th{text-align:left;font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--slate);border-bottom:2px solid var(--ink);padding:8px 8px 8px 0}
td{border-bottom:1px solid var(--line);padding:9px 8px 9px 0;vertical-align:top}.tbl{overflow-x:auto}
.draft{border-top:5px solid var(--teal)}.kv{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed var(--line);padding:5px 0;font-size:15px}.kv b{text-align:right}
pre.copy{white-space:pre-wrap;background:var(--paper);border-radius:10px;padding:12px;font:14px/1.5 "Plus Jakarta Sans",sans-serif;margin:10px 0 8px}
.cpy{background:var(--navy);color:#fff;border:0;border-radius:8px;padding:7px 12px;font-weight:600;cursor:pointer}
.res{border-radius:14px;padding:18px 20px;margin-top:16px}.res.ok{background:var(--tealsoft)}.res.bad{background:var(--rosesoft)}
footer{color:var(--slate);font-size:13px;padding:36px 0 50px}
</style></head><body>
<header class="top"><div class="wrap"><a class="brand" href="/">Tap<i>ak</i></a><nav><a href="/verify">Verifikasi bukti</a><a href="https://t.me/TapakAiBot">Bot Telegram</a><a href="/app">Masuk</a></nav></div></header>
${body}
<footer class="wrap">Tapak menyiapkan <b>draf</b>, bukan laporan yang sudah terkirim. Laporkan lewat <a href="https://iasc.ojk.go.id">iasc.ojk.go.id</a>, jalur fraud bank/e-wallet, dan kantor polisi. Tapak tidak pernah menawarkan jasa pengembalian dana. Dibangun untuk Indonesia Web3 Hackathon 2026 · BNB Chain.</footer>
<script>document.querySelectorAll('.cpy').forEach(b=>b.addEventListener('click',async()=>{const t=document.getElementById(b.dataset.t).innerText;try{await navigator.clipboard.writeText(t);b.textContent='Tersalin ✓'}catch(e){const r=document.createRange();r.selectNodeContents(document.getElementById(b.dataset.t));getSelection().removeAllRanges();getSelection().addRange(r);b.textContent='Tekan Ctrl/Cmd+C'}}))</script>
</body></html>`;

type Analysis = {
  summary: string; drafts: any[]; transfers: any[]; requests: any[]; police_chronology: string; missing: any[];
  totals: { idr: number; usdt: number; estimated_idr: number; usdt_idr_rate: number }; evidence: any[]; anchor: any; manifest_sha256: string; generated_at: string;
};

export function reportPage(c: any, explorer: string) {
  if (!c.analysis) {
    return layout('Draf belum siap · Tapak', `<main class="wrap"><h2>Draf belum disusun</h2><p class="muted">Kasus ini punya ${c.files.length} bukti. Ketik <b>/laporan</b> di bot Telegram untuk menyusun draf.</p></main>`);
  }
  const a: Analysis = JSON.parse(c.analysis);
  const drafts = a.drafts.map((d, i) => {
    const txs = d.transfers.map((t: any) => `${t.date ?? '—'} · ${amount(t.amount, t.currency)}${t.reference ? ` · ref ${t.reference}` : ''}`).join('\n');
    const text = `Rekening/wallet tujuan: ${d.destination_bank ?? ''} ${d.destination_account ?? ''}\nNama penerima: ${d.recipient_name ?? '—'}\nTotal: ${amount(d.total, d.currency)}\nTransaksi:\n${txs}\n\nKronologi:\n${d.chronology}`;
    return `<div class="card draft"><div class="tag" style="color:var(--teal)">Draf IASC ${i + 1} / ${a.drafts.length}</div>
      <h3 style="margin:6px 0 10px">${esc(d.destination_bank)} ${esc(d.destination_account)}</h3>
      <div class="kv"><span class="muted">Penerima</span><b>${esc(d.recipient_name ?? '—')}</b></div>
      <div class="kv"><span class="muted">Total</span><b>${amount(d.total, d.currency)}</b></div>
      <div class="kv"><span class="muted">Jumlah transfer</span><b>${d.transfers.length}</b></div>
      ${d.missing_fields?.length ? `<p><span class="pill warn">perlu konfirmasi</span> ${esc(d.missing_fields.join('; '))}</p>` : ''}
      <pre class="copy" id="d${i}">${esc(text)}</pre><button class="cpy" data-t="d${i}">Salin draf</button></div>`;
  }).join('');

  const reqs = a.requests.map((r) => {
    const t = a.transfers.find((x) => x.id === r.matched_transfer_id);
    return `<tr><td class="mono">${esc(r.tanggal)}</td><td><i>"${esc(r.kutipan)}"</i></td><td>${t ? `${esc(t.destination_bank ?? '')} ${esc(t.destination_account ?? '')}<br><span class="muted">${esc(t.date)}</span>` : '—'}</td>
      <td style="text-align:right">${amount(r.nominal, r.mata_uang)}</td><td>${t ? `<span class="pill">${t.source === 'on-chain BSC' ? `<a href="${esc(t.tx_url)}">on-chain</a>` : 'bukti'}</span>` : '<span class="pill warn">bukti kurang</span>'}</td></tr>`;
  }).join('');

  const ev = a.evidence.map((e) => `<tr><td>${esc(e.name)}</td><td>${esc(e.kind)}</td><td class="mono">${esc(e.sha256)}</td></tr>`).join('');
  const anchor = a.anchor?.txHash
    ? `<p><span class="pill">tercatat on-chain</span> Transaksi <a class="mono" href="${esc(a.anchor.url)}">${esc(a.anchor.txHash)}</a></p>`
    : `<p><span class="pill warn">on-chain tertunda</span> ${esc(a.anchor?.error ?? '')}</p>`;

  return layout('Draf laporan · Tapak', `
<section class="hero" style="padding:36px 0 40px"><div class="wrap">
  <div class="tag">Draf laporan · siap ditinjau</div>
  <h1 style="font-size:clamp(28px,5vw,44px);margin:10px 0 10px">${a.drafts.length} draf IASC · ${rupiah(a.totals.idr)}${a.totals.usdt ? ` + ${a.totals.usdt.toLocaleString('id-ID')} USDT` : ''}</h1>
  <p>${esc(a.summary)}</p>
</div></section>
<main class="wrap">
  <div class="urgent" style="margin-top:24px">Belum menelepon jalur fraud bank asal? Lakukan sekarang dan minta nomor laporan. Satu formulir IASC untuk satu rekening tujuan. Laporan polisi tetap perlu dibuat.</div>
  <h2>Draf laporan IASC per rekening tujuan</h2><div class="grid g2">${drafts || '<p class="muted">Belum ada transfer terbukti.</p>'}</div>
  <h2>Permintaan uang di chat ↔ transfer</h2><div class="card tbl"><table><thead><tr><th>Tanggal</th><th>Permintaan terlapor</th><th>Transfer</th><th style="text-align:right">Nilai</th><th>Bukti</th></tr></thead><tbody>${reqs || '<tr><td colspan="5" class="muted">Kirim export chat WhatsApp untuk pencocokan.</td></tr>'}</tbody></table></div>
  ${a.missing.length ? `<h2>Bukti yang masih kurang</h2><div class="card">${a.missing.map((m) => `<p><span class="pill warn">kurang</span> <b>${esc(m.deskripsi)}</b><br><span class="muted">${esc(m.saran)}</span></p>`).join('')}</div>` : ''}
  <h2>Kronologi untuk laporan polisi</h2><div class="card"><pre class="copy" id="pol">${esc(a.police_chronology)}</pre><button class="cpy" data-t="pol">Salin kronologi</button></div>
  <h2>Integritas bukti (BNB Chain)</h2><div class="card">${anchor}
    <p class="muted">Setiap berkas di bawah punya sidik jari SHA-256. Unggah berkas yang sama di <a href="/verify">halaman verifikasi</a> untuk memastikan tidak berubah sejak dicatat. Blockchain membuktikan integritas berkas, bukan kebenaran isi chat.</p>
    <div class="tbl"><table><thead><tr><th>Berkas</th><th>Jenis</th><th>SHA-256</th></tr></thead><tbody>${ev}</tbody></table></div>
    <p class="muted">Manifest kasus: <span class="mono">${esc(a.manifest_sha256)}</span> · Kontrak: <a href="${esc(explorer)}">EvidenceRegistry</a></p></div>
</main>`);
}

export function verifyPage() {
  return layout('Verifikasi bukti · Tapak', `
<section class="hero" style="padding:40px 0 44px"><div class="wrap"><div class="tag">Verifier publik · tanpa akun</div>
<h1 style="font-size:clamp(28px,5vw,46px);margin:10px 0">Apakah berkas ini sama dengan yang dicatat?</h1>
<p>Berkas dihitung sidik jarinya (SHA-256) di browser kamu. Berkas tidak diunggah ke mana pun; hanya sidik jarinya yang dicocokkan ke kontrak EvidenceRegistry di BNB Chain.</p></div></section>
<main class="wrap"><div class="card" style="margin-top:24px">
  <label for="f"><b>Pilih berkas bukti</b></label><br><input id="f" type="file" style="margin:12px 0">
  <p class="muted mono" id="h"></p><div id="out"></div></div></main>
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
<main class="wrap" style="padding-block:28px 10px">
  <div id="signed-out" hidden>
    <div class="grid g2" style="align-items:center">
      <div><div class="tag" style="color:var(--teal)">Masuk ke Tapak</div><h1 style="font-size:clamp(30px,5vw,46px);margin:10px 0 14px">Semua kasus dan draf laporanmu di satu tempat.</h1>
      <p class="muted">Unggah bukti lewat web, atau hubungkan akun Telegram <a href="https://t.me/${esc(bot)}">@${esc(bot)}</a> supaya kasus dari bot ikut tampil di sini.</p>
      <div class="urgent" style="margin-top:18px">Baru saja transfer ke penipu? Telepon jalur fraud bank asal sekarang dan minta nomor laporan, sebelum mengisi apa pun.</div></div>
      <div id="sign-in"></div>
    </div>
  </div>
  <div id="signed-in" hidden>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <div><div class="tag" style="color:var(--teal)">Dashboard</div><h1 style="font-size:clamp(28px,4vw,40px);margin-top:6px">Halo, <span id="uname"></span></h1></div>
      <div id="user-button"></div>
    </div>
    <h2>Kasus baru lewat web</h2>
    <div class="card">
      <p class="muted" style="margin-top:0">Pilih screenshot bukti transfer, export chat WhatsApp (.txt/.zip), dan dokumen pendukung. Isi alamat wallet jika mengirim USDT.</p>
      <label for="files"><b>Berkas bukti</b></label><br><input id="files" type="file" multiple style="margin:10px 0 14px"><br>
      <label for="wallet"><b>Alamat wallet (opsional)</b></label><br><input id="wallet" placeholder="0x…" style="width:100%;max-width:520px;padding:10px;border:1px solid var(--line);border-radius:10px;margin:8px 0 16px;font:inherit">
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
window.addEventListener('load',async()=>{await window.Clerk.load();const render=async()=>{const u=window.Clerk.user;$('signed-out').hidden=!!u;$('signed-in').hidden=!u;
 if(!u){window.Clerk.mountSignIn($('sign-in'));return;}$('uname').textContent=u.firstName||u.primaryEmailAddress?.emailAddress||'';window.Clerk.mountUserButton($('user-button'));loadCases().catch(e=>$('cases').innerHTML='<tr><td colspan="7">'+e.message+'</td></tr>');};
 render();window.Clerk.addListener(()=>render());$('go').onclick=go;$('link').onclick=async()=>{const d=await api('/api/me/link-code',{method:'POST'});$('code').innerHTML='Kirim <b>/hubungkan '+d.code+'</b> ke <a href="https://t.me/${esc(bot)}">@${esc(bot)}</a> (berlaku '+d.expires_in_minutes+' menit)';};});
</script>`);
}
