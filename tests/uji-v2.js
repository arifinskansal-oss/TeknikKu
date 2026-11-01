/* Uji TeknikKu v2 (Node): sinyal BELI/TAHAN/JUAL, panel gerak 20 hari,
   dan regresi indikator v1. Keluar bukan-nol bila ada gagal. */
var T = require("/home/hatch/workspace/TeknikKu/app/src/main/assets/indikator.js");
var gagal = 0;
function cek(nama, dapat, harap, tol) {
  tol = tol || 1e-6;
  var ok = (harap === null && dapat === null) ||
    (typeof harap === "number" && typeof dapat === "number" && Math.abs(dapat - harap) <= tol) ||
    (typeof harap === "string" && dapat === harap) ||
    (typeof harap === "boolean" && dapat === harap);
  console.log((ok ? "LULUS " : "GAGAL ") + nama + " | dapat=" + dapat + " harap=" + harap);
  if (!ok) gagal++;
}
function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }

/* 1. Oversold: turun pelan 200..162 lalu terjun ke 110 di hari terakhir.
   Harapan: BELI 5 vs 2 (RSI, Stoch, CCI, WillR, Bollinger beli;
   MACD dan MA20 jual; StochRSI data kurang karena RSI ekor konstan 0). */
var over = [];
for (var i = 0; i < 39; i++) over.push(200 - i);
over.push(110);
var sOver = T.sinyal(over, over, over);
console.log("INFO oversold: " + sOver.rincian.map(function (r) { return r.nama + ":" + r.suara; }).join(" | "));
cek("sinyal oversold = BELI", sOver.hasil, "BELI");
cek("sinyal oversold beli", sOver.beli, 5);
cek("sinyal oversold jual", sOver.jual, 2);

/* 2. Overbought (cermin): naik pelan 100..138 lalu loncat ke 190. */
var up = [];
for (var j = 0; j < 39; j++) up.push(100 + j);
up.push(190);
var sUp = T.sinyal(up, up, up);
console.log("INFO overbought: " + sUp.rincian.map(function (r) { return r.nama + ":" + r.suara; }).join(" | "));
cek("sinyal overbought = JUAL", sUp.hasil, "JUAL");
cek("sinyal overbought beli", sUp.beli, 2);
cek("sinyal overbought jual", sUp.jual, 5);

/* 3. Seimbang: gelombang sinus kecil -> selisih suara < 2 -> TAHAN. */
var sinus = [];
for (var k = 0; k < 40; k++) sinus.push(100 + 3 * Math.sin(k / 3));
var sSin = T.sinyal(sinus, sinus, sinus);
console.log("INFO sinus: " + sSin.rincian.map(function (r) { return r.nama + ":" + r.suara; }).join(" | "));
cek("sinyal sinus = TAHAN", sSin.hasil, "TAHAN");
cek("sinyal sinus selisih < 2", Math.abs(sSin.beli - sSin.jual) < 2, true);

/* 4. Data kurang: 10 titik -> tidak crash, 0 suara, semua "data kurang". */
var sKur = T.sinyal(range(100, 109), range(100, 109), range(100, 109));
cek("sinyal data kurang beli", sKur.beli, 0);
cek("sinyal data kurang jual", sKur.jual, 0);
cek("sinyal data kurang semua rincian", sKur.rincian.every(function (r) { return r.suara === "data kurang"; }), true);

/* 5. Gerak 20 hari, hitung tangan:
   21 titik 80..100 -> dulu 80, akhir 100, pct (100/80-1)*100 = +25.
   21 titik 100..90 -> dulu 100, akhir 90, pct -10. 20 titik -> null. */
var naik21 = [];
for (var a = 0; a < 21; a++) naik21.push(80 + a);
var g1 = T.gerak20(naik21);
cek("gerak20 dulu naik", g1.dulu, 80);
cek("gerak20 akhir naik", g1.akhir, 100);
cek("gerak20 pct naik", g1.pct, 25);
var turun21 = [];
for (var b = 0; b < 21; b++) turun21.push(100 - b * 0.5);
var g2 = T.gerak20(turun21);
cek("gerak20 dulu turun", g2.dulu, 100);
cek("gerak20 akhir turun", g2.akhir, 90);
cek("gerak20 pct turun", g2.pct, -10);
cek("gerak20 20 titik = null", T.gerak20(range(1, 20)), null);

/* 6. Regresi v1: MA20 dan RSI data uji lama tidak rusak. */
cek("regresi MA20 100..119", T.sma(range(100, 119), 20), 109.5);
cek("regresi RSI naik beruntun", T.rsi(range(10, 24), 14), 100);
cek("regresi RSI turun beruntun", T.rsi(range(10, 24).reverse(), 14), 0);

if (gagal > 0) { console.log("TOTAL GAGAL: " + gagal); process.exit(1); }
console.log("SEMUA UJI V2 LULUS");
