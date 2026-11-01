/* Uji mesin indikator TeknikKu (Node). Harapan dihitung tangan / Python
   independen — bukan dari mesin yang sama. Keluar bukan-nol bila ada gagal. */
var T = require("/home/hatch/workspace/TeknikKu/app/src/main/assets/indikator.js");
var gagal = 0;
function cek(nama, dapat, harap, tol) {
  tol = tol || 1e-6;
  var ok = (harap === null && dapat === null) ||
    (typeof harap === "number" && typeof dapat === "number" && Math.abs(dapat - harap) <= tol);
  console.log((ok ? "LULUS " : "GAGAL ") + nama + " | dapat=" + dapat + " harap=" + harap);
  if (!ok) gagal++;
}
function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }
function konstan(v, n) { var o = []; for (var i = 0; i < n; i++) o.push(v); return o; }

/* 1. MA5 dari [10,11,12,13,14] = 60/5 = 12 (hitung tangan). */
cek("MA5 [10..14]", T.sma([10, 11, 12, 13, 14], 5), 12);
/* 2. EMA: benih SMA5=12, k=1/3 -> EMA di 15 = 15/3 + 12*2/3 = 13. */
cek("EMA5 terakhir [10..15]", T.lastNonNull(T.emaSeries([10, 11, 12, 13, 14, 15], 5)), 13);
/* 3. Bollinger 100..119: rata-rata 109,5; jumlah kuadrat selisih 665;
   ragam 33,25; simpangan baku 5,766281; atas 121,0326; bawah 97,9674;
   bandwidth 21,0647%. */
var bb = T.bollinger(range(100, 119), 20, 2);
cek("Bollinger tengah 100..119", bb.middle, 109.5);
cek("Bollinger atas 100..119", bb.upper, 121.032562, 1e-4);
cek("Bollinger bawah 100..119", bb.lower, 97.967438, 1e-4);
cek("Bollinger bandwidth 100..119", bb.bandwidth, 21.0647, 1e-3);
/* 4. RSI: 14 kenaikan beruntun -> 100; 14 penurunan beruntun -> 0. */
cek("RSI naik beruntun", T.rsi(range(10, 24), 14), 100);
cek("RSI turun beruntun", T.rsi(range(10, 24).reverse(), 14), 0);
/* 5. Stochastic deret naik 1..20 (high=low=close): %K terakhir = 100, %D = 100. */
var naik20 = range(1, 20);
var st = T.stochastic(naik20, naik20, naik20, 14, 3);
cek("Stochastic %K naik", st.k, 100);
cek("Stochastic %D naik", st.d, 100);
/* 6. William %R deret naik 1..20 = (20-20)/(20-7)*-100 = 0. */
cek("William %R naik", T.williamsR(naik20, naik20, naik20, 14), 0);
/* 7. CCI deret konstan -> simpangan rata-rata 0 -> null (bukan NaN). */
var kon = konstan(50, 25);
cek("CCI konstan = null", T.cci(kon, kon, kon, 20), null);
/* 8. MACD deret konstan -> 0/0/0. */
var mc = T.macd(konstan(50, 60), 12, 26, 9);
cek("MACD konstan", mc.macd, 0);
cek("MACD sinyal konstan", mc.signal, 0);
cek("MACD histogram konstan", mc.histogram, 0);
/* 9. StochRSI deret naik: RSI konstan 100 -> hi==lo -> null. */
cek("StochRSI naik = null", T.stochRsi(range(1, 40), 14, 14), null);
/* 10. Data kurang -> null, bukan crash. */
cek("MA20 dari 10 data = null", T.sma(range(1, 10), 20), null);
cek("RSI dari 10 data = null", T.rsi(range(1, 10), 14), null);
cek("Bollinger dari 10 data = null", T.bollinger(range(1, 10), 20, 2), null);
cek("MACD dari 20 data = null", T.macd(range(1, 20), 12, 26, 9), null);
/* 11. Uji silang Python (deret campuran, nilai harap dari skrip Python
   independen di bawah — ditempel sesudah skrip Python jalan). */
var campur = [100, 102, 101, 104, 102, 103, 106, 104, 105, 109, 107, 108, 107, 110, 106, 108, 106, 107, 112, 109, 111, 110, 111, 109, 112, 111, 113, 110, 112, 115, 113, 114, 113, 116, 112, 114, 113, 115, 118, 116];
var bbC = T.bollinger(campur, 20, 2);
console.log("INFO Bollinger campuran: tengah=" + bbC.middle + " atas=" + bbC.upper + " bawah=" + bbC.lower + " bandwidth=" + bbC.bandwidth);
console.log("INFO MA5 campuran=" + T.sma(campur, 5) + " MA20 campuran=" + T.sma(campur, 20));
console.log("INFO RSI campuran=" + T.rsi(campur, 14) + " StochRSI campuran=" + T.stochRsi(campur, 14, 14));
console.log("INFO Stochastic campuran=" + JSON.stringify(T.stochastic(campur, campur, campur, 14, 3)));
console.log("INFO CCI campuran=" + T.cci(campur, campur, campur, 20) + " WilliamR campuran=" + T.williamsR(campur, campur, campur, 14));
console.log("INFO MACD campuran=" + JSON.stringify(T.macd(campur, 12, 26, 9)));
if (gagal > 0) { console.log("TOTAL GAGAL: " + gagal); process.exit(1); }
console.log("SEMUA UJI TANGAN LULUS");
