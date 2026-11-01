# TeknikKu

Versi bahasa Inggris: [README_EN.md](README_EN.md)

Aplikasi Android penampil indikator teknikal untuk memantau ETF dan saham.
Dibangun 1 November 2026 sebagai proyek baru (WebView + data Yahoo Finance).

## Fitur
- 9 indikator standar publik yang bisa dinyalakan/dimatikan: MA 5 & 20,
  Bollinger Band & Bandwidth, Stochastic, Stochastic RSI, RSI, CCI,
  William %R, dan MACD.
- Kartu sinyal BELI / TAHAN / JUAL dari aturan 8 suara yang transparan.
- Panel pergerakan 20 hari.
- Watchlist bawaan 6 ETF (QQQ, SCHD, SPUS, HLAL, SPHD, VOO) + ketik ticker
  bebas (saham IDX memakai akhiran `.JK`).
- Data harga live dari Yahoo Finance. Tidak ada jual/beli di dalam aplikasi;
  aplikasi ini hanya alat pantau dan edukasi, bukan perintah beli.

## Teknologi
- Android WebView + HTML/JavaScript lokal (`app/src/main/assets/`).
- Logika indikator di `indikator.js`, diuji dengan skrip di `tests/`.
- Rakit manual tanpa Gradle: aapt2, javac, d8, zipalign, apksigner
  (lihat `BUILD.md`).

## Menjalankan
Pasang APK hasil rakitan (atau rakit sendiri lewat `BUILD.md`), buka
aplikasi, pilih ticker, nyalakan/matikan indikator yang diinginkan.

## Lisensi
MIT — lihat `LICENSE`.
