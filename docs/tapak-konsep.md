# Tapak — Dokumen Konsep (versi final hackathon)

> **Cintanya palsu. Buktinya tetap utuh.**
> *Broken promises. Unbroken evidence.*
>
> **Tapak adalah copilot respons awal bagi korban penipuan transfer: membantu menyiapkan data untuk jalur fraud bank/e-wallet, menyusun draf laporan IASC per rekening tujuan dan kronologi untuk polisi, serta berkas bukti yang integritasnya dapat diperiksa di BNB Chain.** Love scam adalah cerita pembuka; penipuan transfer adalah inti produk dan bisnis.

| | |
|---|---|
| Hackathon | Indonesia Web3 Hackathon 2026 (Binance Academy · BNB Chain · Coinvestasi, mentor Dev Web3 Jogja) |
| Track | **Finance & Commerce** (utama) + **AI Agents** |
| Deadline submission | **30 September 2026, 23:59 WIB** |
| Chain | BSC testnet — kontrak `EvidenceRegistry` (anchor hash + case id); BSC read-only untuk transfer USDT; BNB Attestation Service di roadmap |
| Nama | **Tapak** = "jejak" (Indonesia & Melayu). Agen/bot: **Tapak AI**. Kampanye edukasi: **#JanganCidro** (cidro, Jawa: ingkar janji) |
| Catatan merek | Tagline memakai "utuh" (yang dijamin hash), bukan "asli". Hindari tagline yang menyalahkan korban. Kata "cidro" boleh dipakai di cerita pitch; jangan memakai lirik, audio, atau foto lagu *Cidro* Didi Kempot tanpa izin. Kecocokan antar-kasus disebut "muncul di laporan lain", bukan "terverifikasi" |
| Tim | **Bagus Kurnianto** — product, AI agent & pitch ([LinkedIn](https://www.linkedin.com/in/baguskto/)) · **Al Fatih Abdurrahman Syah** — web & UX ([LinkedIn](https://www.linkedin.com/in/alfatihdevs/)) · **Fian Febry Ispianto** — backend, bot & on-chain ([LinkedIn](https://www.linkedin.com/in/fbi98/)) *(pembagian peran: usulan)* |

---

## 1. Hasil review juri (ringkas)

Review dilakukan dengan memosisikan diri sebagai juri dan berdebat dengan Codex CLI, berbekal data 35 submission.

- **Kompetisi serius:** 32 dari 35 proyek sudah punya video YouTube, repo GitHub, dan kontrak. Contoh kuat: The Council (5 agen ERC-8004), NeuroLoom (vault ERC-4626), ARGUS & Omnidegen (agen risiko DeFi via Telegram), AicoSigner & Web3 Guardian (keamanan transaksi). **Tidak ada yang menyentuh korban penipuan atau bukti.**
- **Skor deck lama (tanpa kode):** inovasi 8 · eksekusi 1 · bisnis 5 · UX 5 · presentasi 4. Tanpa produk jalan, peluang praktis nol.
- **Skor potensi jika MVP + demo jadi:** inovasi 8 · eksekusi 8 · bisnis 6 · UX 8 · presentasi 9 → **kandidat podium Finance & Commerce**, kompetitif di AI Agents bila agen benar-benar menemukan data hilang dan meminta klarifikasi.
- **Kelemahan yang diperbaiki di versi ini:**
  1. Rencana disajikan seolah sudah jadi → deck membedakan "dibangun selama hackathon" vs "roadmap".
  2. Hash disamakan dengan keaslian → bahasa diganti menjadi **"integritas berkas dapat diverifikasi"**.
  3. Statistik rentan → dipakai angka resmi dengan tanggal dan satuan jelas.
  4. Pembeli (program literasi) terputus dari manfaat produk → pembeli utama kini **tim fraud/dispute**, literasi jadi kanal.
  5. Cakupan terlalu lebar → MVP dibatasi pada **korban yang sudah mentransfer dana**.

---

## 2. Masalah

### Love scam — kerugian per korban paling ekstrem (cerita pembuka)
| Fakta | Sumber |
|---|---|
| **Satu korban kehilangan Rp120 miliar dalam 4 bulan** (akuntan publik di Medan) — kasus terbesar yang ditangani Satgas PASTI | Liputan6, 7 Jul 2026 |
| **Rp41 miliar dalam 10 bulan** — pig butchering di Sukoharjo; DPR minta IASC perkuat pencegahan | DPR RI, 5 Jun 2026 |

### Penipuan transfer — skala nasional (inti)
| Fakta | Sumber |
|---|---|
| IASC memblokir **Rp724,1 miliar** dana dan membekukan **±607 ribu rekening** (Nov 2024 – 31 Jul 2026); baru **Rp204,3 miliar** kembali ke korban | OJK via periskop.id, 1 Sep 2026 |
| Modus terbanyak: **jual beli online — 113.520 laporan, ±Rp1,78 triliun** | IASC OJK, Agu 2026 |
| Kerugian scam kripto global 2025 **US$17 miliar** | Chainalysis 2026 |

> ⚠️ Jangan dipakai: "Rp9,5 T kerugian love scam" dan "548 ribu kasus love scam" (tercampur dengan total semua modus).

### Masalah inti: 5 menit pertama setelah transfer
Panduan resmi IASC/OJK (juga dipopulerkan kreator edukasi keuangan) menuntut korban — **yang sedang panik** — melakukan banyak hal dengan cepat karena dana bisa dipindah pelaku dalam hitungan menit:
1. Hubungi **jalur fraud** bank/e-wallet dan minta **nomor laporan**.
2. Siapkan **7 data**: jam transfer, nominal persis, rekening asal, rekening tujuan, nama penerima, nomor referensi transaksi, kronologi singkat.
3. Lapor di **iasc.ojk.go.id** — **satu formulir untuk satu rekening tujuan** (transfer ke 3 rekening = 3 laporan).
4. Lampirkan identitas, bukti transfer, screenshot chat, akun/iklan pelaku, nomor telepon — **jangan hapus chat** walau malu.
5. Buat **laporan polisi** juga — IASC tidak menggantikan laporan polisi (satu mengejar dana, satu mengejar pelaku).
6. Waspada **penipu babak dua** yang mengaku bisa mencairkan dana. Lapor cepat tidak menjamin dana kembali.

Laporan yang tidak lengkap membuat korban diminta melengkapi bukti (contoh kasus viral di Pekalongan & klarifikasi Kapolres Metro Bekasi) dan memperlambat penanganan. Bukti elektronik sah secara hukum bila **keutuhannya terjamin** (UU ITE Pasal 5 & 6).

---

## 3. Produk — Tapak AI

### Prinsip
- **Tindakan mendesak didahulukan.** Layar pertama selalu: "Hubungi jalur fraud bank/e-wallet sekarang" (nomor + naskah singkat). Penyusunan berkas berjalan sebagai pendamping, tidak menunda.
- **Agen tidak mengarang.** Setiap data punya sumber (file & posisi); data yang tidak ditemukan ditandai; pengguna mengonfirmasi sebelum draf final.
- **Draf, bukan laporan terkirim.** Tapak menyiapkan draf siap ditinjau & disalin; tidak mengklaim integrasi resmi IASC, bank, atau polisi.

### Alur
1. **Respons awal (detik pertama):** tombol & naskah menelepon jalur fraud; checklist "minta nomor laporan".
2. **Ekstraksi 7 data** dari screenshot bukti transfer / mutasi (OCR + LLM), dengan konfirmasi pengguna.
3. **Pemecahan per rekening tujuan** → **satu draf laporan IASC per rekening**, kronologi 1 paragraf, daftar lampiran.
4. **Kronologi lengkap untuk polisi** dari export chat WhatsApp: pencocokan **permintaan uang ↔ transfer**, total kerugian, bukti yang masih kurang.
5. **Transfer USDT** ditarik langsung dari BSC berdasarkan alamat wallet korban.
6. **Integritas berkas:** setiap file di-hash (SHA-256); hash + case id dicatat di kontrak `EvidenceRegistry` (BSC testnet). File asli terenkripsi & dikendalikan korban. Verifier publik menghitung ulang hash tanpa akun Tapak.
7. **Kecocokan antar-kasus (terbatas):** identitas pelaku (nomor, rekening, wallet) disimpan sebagai HMAC; bila cocok → "identitas ini juga muncul di laporan lain" (bukan "pelaku terverifikasi").
8. **Peringatan penipu babak dua** & rujukan ke kanal resmi.

### Cakupan MVP
**Korban yang sudah mentransfer dana ke rekening/wallet tujuan** (love scam, jual beli fiktif, investasi bodong). Bukti transfer palsu yang diterima penjual dan phishing tanpa transfer = alur terpisah, roadmap.

---

## 4. Momen "wow" untuk demo

1. **"Tiga rekening, tiga draf."** Korban mem-forward 3 bukti transfer ke 3 rekening → < 1 menit keluar 3 draf IASC siap tempel + kronologi + checklist. (Timer di layar mengukur **waktu menyusun draf**, bukan janji dana kembali.)
2. **"Agen menemukan yang hilang."** Dari chat love scam 4 bulan: 7 permintaan ↔ 7 transfer, **1 transfer tanpa bukti** → agen meminta dokumen spesifik; pengguna menyetujui sebelum dicatat.
3. **"Ubah satu karakter, verifikasi gagal."** File di-anchor ke BSC testnet (tx di BscScan) → diverifikasi di verifier publik: cocok ✓ → file diedit 1 karakter → tidak cocok ✗.

---

## 5. BNB Chain — apa yang dibuktikan, dan batasnya

**Dibuktikan:** berkas yang diperiksa sama persis byte-per-byte dengan yang dicatat pada waktu tertentu; catatan tidak bisa diubah/dihapus siapa pun, dan dapat diperiksa tanpa akun Tapak (dengan berkas + manifest hash).
**Tidak dibuktikan:** kebenaran isi chat, waktu percakapan terjadi, identitas pelaku, atau penerimaan otomatis sebagai alat bukti.

| Batasan | Penanganan |
|---|---|
| Hash hanya menjamin integritas sejak dicatat | Dorong export chat asli & mutasi resmi; bukti USDT diambil langsung dari chain |
| Kesalahan ekstraksi (1 digit rekening) | Konfirmasi pengguna, sumber tiap data, tanda "tidak ditemukan" |
| Privasi | Identitas, rekening, dan chat tidak pernah on-chain; hanya hash; nomor/rekening pelaku di-HMAC |
| Kecocokan antar-kasus bisa keliru | Disebut "muncul di laporan lain", butuh beberapa laporan independen, ada banding |
| Bukan pengganti forensik aparat / layanan hukum | Posisi: penata data & berkas, titik awal chain of custody |

---

## 6. Arsitektur

```
Telegram bot (Tapak AI) ─┐                                              ┌─ EvidenceRegistry (BSC testnet)
Web: draf, verifier,     ├─▶ TAPAK AGENT (VPS, MiniMax M3)              │   anchor(caseId, sha256) + event
     berkas PDF          │    tools + relayer + penyimpanan terenkripsi ─┤
                         │                                              └─ BSC read-only: transfer USDT
```

**Tools agen:** `extract_transfer_fields()` · `split_by_destination()` · `draft_iasc_report()` · `draft_police_chronology()` · `ingest_chat_export()` · `match_requests_to_transfers()` · `fetch_bsc_transfers()` · `find_missing_evidence()` · `hash_and_anchor()` · `link_case_identities()` · `report_pdf()`

**Triase pesan (Cloudflare):** pesan teks bebas di bot diklasifikasi oleh **TypeSafe Jev (`typesafe/jev`) lewat Cloudflare AI Gateway** — probabilitas terkalibrasi untuk jenis pesan (kronologi / pertanyaan / tawaran "jasa pemulihan dana"), peluang penipuan babak dua, dan tingkat urgensi. Balasan memakai templat, jadi bot tidak pernah menjanjikan dana kembali; prompt korban tidak disimpan di log gateway.

**Gas:** relayer membayar gas; korban tidak perlu BNB. Verifikasi = view call gratis.

---

## 7. Model bisnis (hipotesis)

### Prinsip
Korban gratis · tidak menjual data pribadi · tanpa langganan konsumen.

### Pembeli inti: tim fraud/dispute institusi transaksi
**Siapa:** e-wallet, payment gateway, marketplace, bank, exchange kripto lokal — tim yang menerima laporan korban penipuan transfer.
**Masalah mereka:** laporan masuk tidak lengkap (7 data, bukti, kronologi) → bolak-balik meminta data, penanganan lambat.
**Yang dibeli:** **intake terstruktur** — korban/nasabah diarahkan ke Tapak (atau widget Tapak di kanal mereka), laporan masuk sudah lengkap, per rekening tujuan, dengan bukti ber-hash.
**Model:** pilot berbayar → langganan workspace + biaya per volume kasus.
**Ukuran keberhasilan yang bisa diuji:** kelengkapan laporan, berkurangnya permintaan data tambahan, waktu sampai laporan siap. ("Lebih cepat blokir" masih hipotesis.)
**Early adopter realistis:** e-wallet, payment gateway, dan exchange kripto lokal skala menengah (keputusan lebih cepat daripada bank besar).

### Kanal & pelengkap
| Kanal / sumber | Peran |
|---|---|
| Konten edukasi & kampanye **#JanganCidro** | Akuisisi korban & keluarga ("kirim ke orang tua") |
| Program literasi lembaga jasa keuangan (**POJK 3/2023**) | Kanal distribusi & pendapatan tambahan — bukan dasar permintaan |
| Legaltech (mis. Justika, Hukumku; ±Rp200–300 ribu/sesi) | Rujukan konsultasi, bagi hasil |
| Paket klaim asuransi siber | Ekspansi untuk phishing & belanja online fiktif (bukan love scam: transfer sukarela & kripto umumnya dikecualikan polis) |

### Jalur ekspansi modus
Love scam (cerita) → **penipuan transfer: jual beli fiktif, investasi bodong** (MVP inti) → **bukti transfer palsu** untuk penjual (cek bukti USDT langsung ke BSC; rupiah butuh mutasi resmi) → phishing → klaim asuransi. Indonesia → Malaysia → ASEAN.

### Model yang ditolak
| Model | Alasan |
|---|---|
| Langganan konsumen | Kebutuhan sesekali |
| Menjual data penipu | Bank/e-wallet punya data IASC, fintech punya FDC AFPI, exchange pakai Chainalysis; UU PDP Pasal 65(2) |
| Menjual ke penegak hukum | Relasi & pengadaan sulit |
| Komisi asuransi sebagai inti | Premi kecil, risiko salah jual, butuh persetujuan OJK (POJK 8/2024) |

### Unit economics (perkiraan)
LLM **< Rp1.000 per kasus** (MiniMax M3, ±$0,30/juta token input dan $1,20/juta token output; satu kasus demo ±20 ribu token); gas opBNB/BSC & penyimpanan mendekati nol.

---

## 8. Diferensiasi

| Pembanding | Yang mereka lakukan | Tapak |
|---|---|---|
| Formulir IASC / CS bank | Menerima laporan | Menyiapkan laporan lengkap per rekening untuk mereka |
| Konten edukasi (video, artikel) | Memberi tahu langkahnya | Mengerjakan langkahnya bersama korban |
| Pengacara | Menyusun berkas manual, Rp4–10 jt+ | Draf dalam menit, gratis untuk korban |
| GetContact, cekrekening.id | Cek satu nomor | Berkas bukti, pencocokan transfer, integritas on-chain |

---

## 9. Scope build (±26 jam) & pembagian

| Wajib | Pemilik usulan |
|---|---|
| Kontrak `EvidenceRegistry` + test + deploy BSC testnet | Fian |
| Bot Telegram + relayer + penyimpanan terenkripsi | Fian |
| Agen: ekstraksi 7 data, pemecahan per rekening, draf IASC & polisi, pencocokan chat↔transfer, data hilang | Bagus |
| Tarik transfer USDT BSC testnet | Fian / Bagus |
| Web: draf, verifier publik (cocok/tidak cocok), PDF | Al Fatih |
| Data demo simulasi berlabel, video ≤5 menit, README, repo publik | Semua (6 jam terakhir) |

**Roadmap (tidak diklaim di demo):** BAS, kecocokan antar-kasus skala besar, bukti transfer palsu penjual, phishing, klaim asuransi, WhatsApp, Bukti Asli (BAB token).

---

## 10. Naskah demo (±3 menit)

| Waktu | Adegan |
|---|---|
| 0:00–0:20 | "Satu korban, empat bulan, Rp120 miliar. Dan saat sadar, lima menit pertama justru dihabiskan dengan panik." |
| 0:20–0:35 | Tapak AI: layar pertama → "Hubungi jalur fraud sekarang" + naskah + "minta nomor laporan". |
| 0:35–1:20 | **Wow 1:** forward 3 bukti transfer → 3 draf IASC per rekening + kronologi (timer penyusunan draf). |
| 1:20–2:00 | **Wow 2:** export chat 4 bulan → 7 permintaan ↔ 7 transfer, 1 bukti kurang → agen meminta dokumen spesifik; transfer USDT dari BSC. |
| 2:00–2:40 | **Wow 3:** anchor di BscScan → verifier: cocok ✓ → edit 1 karakter → tidak cocok ✗. |
| 2:40–3:00 | Pembeli: tim fraud/dispute; ekspansi modus; ajakan pilot. |

---

## 11. Validasi yang masih perlu
- Wawancara 1–2 tim fraud/dispute e-wallet atau payment gateway: format laporan, data yang sering kurang, kemauan membayar.
- 5–10 kutipan asli korban dari Threads/X (identitas disamarkan).
- Cek ketentuan data RPC/BscScan.

---

## 12. Sumber
- Love scam Rp120 M & data PASTI — https://www.liputan6.com/bisnis/read/8240524/jejak-scam-di-indonesia-dari-cinta-palsu-hingga-tipu-daya-ai
- Love scam Rp41 M (DPR RI) — https://www.dpr.go.id/kegiatan-dpr/berita/Kasus-Love-Scam-Rp41-Miliar-Terungkap-Abdullah-Minta-IASC-Perkuat-Pencegahan-65786
- OJK blokir Rp724,1 M, 607 ribu rekening — https://periskop.id/keuangan/20260901/ojk-blokir-rp7241-miliar-dana-scam-607-ribu-rekening-dibekukan
- IASC: modus terbanyak jual beli online — https://katadata.co.id/finansial/keuangan/6a4324b291318/korban-scam-tak-tahu-harus-lapor-ke-mana-kenali-layanan-iasc
- Cara lapor IASC (satu formulir per rekening) — https://www.kompas.com/tren/read/2025/10/24/103000665/jadi-korban-scam-atau-penipuan-keuangan-begini-cara-lapor-ke-ojk
- IASC tidak menggantikan laporan polisi; nomor referensi — https://borobudur-training.com/kesiapan-bukti-laporan-iasc/ · https://pajakku.com/artikel/mengenal-indonesia-anti-scam-center-iasc
- Waspada situs palsu IASC — https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Waspada-Penipuan-Website-Mengatasnamakan-Indonesia-Anti-Scam-Centre-IASC.aspx
- Korban diminta melengkapi bukti — https://www.detik.com/jateng/berita/d-7825112/wanita-korban-penipuan-curhat-ke-damkar-laporannya-ditolak-polisi-klarifikasi
- Alat bukti elektronik UU ITE — https://www.hukumonline.com/klinik/a/syarat-dan-kekuatan-hukum-alat-bukti-elektronik-cl5461/
- Chainalysis/IC3 — https://scamverify.ai/blog/pig-butchering-romance-scams-2026
- POJK 3/2023 — https://ojk.go.id/id/regulasi/Pages/Peningkatan-Literasi-dan-Inklusi-Keuangan-di-Sektor-Jasa-Keuangan-Bagi-Konsumen-dan-Masyarakat.aspx
- POJK 8/2024 — https://ojk.go.id/id/regulasi/Pages/POJK-8-Tahun-2024-Produk-Asuransi-dan-Saluran-Pemasaran-Produk-Asuransi.aspx
- Brosur asuransi siber BCA Insurance — https://www.bcainsurance.co.id/site/libraries/BROSUR%20PERSONAL%20CYBER%20INSURANCE%20BCAINSURANCE.pdf
- Pembanding data: IASC — https://artikel.pajakku.com/mengenal-indonesia-anti-scam-center-iasc · FDC AFPI — https://m.cyberthreat.id/read/4854/Tekan-Risiko-Penipuan-AFPI-Terapkan-Fintech-Data-Center · Indodax × Chainalysis — https://selular.id/2026/06/gandeng-chainalysis-indodax-perkuat-kepatuhan-industri-kripto/
- UU PDP pidana — https://www.hukumonline.com/klinik/a/jenis-tindak-pidana-pelindungan-data-pribadi-lt694a430534712/
- Legaltech — https://www.justika.com/ · https://www.hukumku.id/
- Aturan hackathon — https://indonesiaweb3hack.xyz/en/faq
