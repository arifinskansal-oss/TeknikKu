/* TeknikKu — mesin indikator STANDAR PUBLIK.
   Semua rumus di bawah adalah rumus teknikal umum yang dipublikasikan luas
   (bukan rumus berbayar/proprietary siapa pun). Dihitung dari deret harga
   Yahoo yang sama dengan grafik — tanpa unduhan data tambahan.
   Setiap fungsi mengembalikan null (bukan NaN) bila data kurang atau
   penyebutnya nol. File ini tanpa ketergantungan DOM sehingga bisa diuji
   langsung dengan Node. */
var TeknikIndikator = (function () {
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function lastNonNull(a) {
    if (!a) return null;
    for (var i = a.length - 1; i >= 0; i--) if (isNum(a[i])) return a[i];
    return null;
  }
  /* Rata-rata n nilai terakhir; null bila data kurang. */
  function sma(arr, n) {
    if (!arr || arr.length < n) return null;
    var s = 0;
    for (var i = arr.length - n; i < arr.length; i++) {
      if (!isNum(arr[i])) return null;
      s += arr[i];
    }
    return s / n;
  }
  /* Deret EMA standar: benih = SMA n pertama, penghalus k = 2/(n+1).
     Indeks < n-1 berisi null. */
  function emaSeries(arr, n) {
    var out = [];
    if (!arr || arr.length < n) return out;
    var k = 2 / (n + 1), seed = 0, ok = true;
    for (var i = 0; i < n; i++) { if (!isNum(arr[i])) ok = false; else seed += arr[i]; }
    if (!ok) return out;
    seed /= n;
    for (var j = 0; j < arr.length; j++) {
      if (j < n - 1) { out.push(null); continue; }
      if (j === n - 1) { out.push(seed); continue; }
      if (!isNum(arr[j])) { out.push(null); continue; }
      var prev = out[j - 1];
      out.push(isNum(prev) ? (arr[j] * k + prev * (1 - k)) : null);
    }
    return out;
  }
  /* Simpangan baku populasi n nilai terakhir; null bila data kurang. */
  function stdPop(arr, n) {
    if (!arr || arr.length < n) return null;
    var m = sma(arr, n), s = 0;
    if (m === null) return null;
    for (var i = arr.length - n; i < arr.length; i++) s += (arr[i] - m) * (arr[i] - m);
    return Math.sqrt(s / n);
  }
  /* Bollinger Band (20, 2): tengah = SMA20, pita = tengah ± 2 simpangan baku.
     Bandwidth = (atas-bawah)/tengah*100. */
  function bollinger(closes, n, mult) {
    n = n || 20; mult = mult || 2;
    var mid = sma(closes, n), sd = stdPop(closes, n);
    if (mid === null || sd === null || mid === 0) return null;
    var up = mid + mult * sd, lo = mid - mult * sd;
    return { middle: mid, upper: up, lower: lo, bandwidth: (up - lo) / mid * 100 };
  }
  /* Deret RSI Wilder (14): indeks < n berisi null. */
  function rsiSeries(closes, n) {
    n = n || 14;
    var out = [];
    if (!closes || closes.length < n + 1) return out;
    var gain = 0, loss = 0;
    for (var i = 1; i <= n; i++) {
      var d = closes[i] - closes[i - 1];
      if (!isNum(d)) return [];
      if (d > 0) gain += d; else loss -= d;
    }
    var ag = gain / n, al = loss / n;
    for (var j = 0; j < closes.length; j++) {
      if (j < n) { out.push(null); continue; }
      if (j > n) {
        var dd = closes[j] - closes[j - 1];
        if (dd > 0) { ag = (ag * (n - 1) + dd) / n; al = (al * (n - 1)) / n; }
        else { ag = (ag * (n - 1)) / n; al = (al * (n - 1) - dd) / n; }
      }
      if (al === 0) out.push(ag === 0 ? null : 100);
      else { var rs = ag / al; out.push(100 - 100 / (1 + rs)); }
    }
    return out;
  }
  function rsi(closes, n) { return lastNonNull(rsiSeries(closes, n || 14)); }
  /* Stochastic %K/%D (14,3) dari high/low/close. */
  function stochastic(highs, lows, closes, n, smooth) {
    n = n || 14; smooth = smooth || 3;
    if (!closes || closes.length < n) return null;
    var ks = [];
    for (var i = n - 1; i < closes.length; i++) {
      var hi = -Infinity, lo = Infinity, ok = true;
      for (var j = i - n + 1; j <= i; j++) {
        if (!isNum(highs[j]) || !isNum(lows[j]) || !isNum(closes[j])) { ok = false; break; }
        if (highs[j] > hi) hi = highs[j];
        if (lows[j] < lo) lo = lows[j];
      }
      if (!ok || hi === lo) { ks.push(null); continue; }
      ks.push((closes[i] - lo) / (hi - lo) * 100);
    }
    var k = ks.length ? ks[ks.length - 1] : null;
    var d = sma(ks, smooth);
    return { k: k, d: d };
  }
  /* Stochastic RSI: Stochastic atas deret RSI (14,14). */
  function stochRsi(closes, rsiPeriod, stochPeriod) {
    rsiPeriod = rsiPeriod || 14; stochPeriod = stochPeriod || 14;
    var rs = rsiSeries(closes, rsiPeriod);
    var vals = [];
    for (var i = 0; i < rs.length; i++) if (isNum(rs[i])) vals.push(rs[i]);
    if (vals.length < stochPeriod) return null;
    var hi = -Infinity, lo = Infinity;
    for (var j = vals.length - stochPeriod; j < vals.length; j++) {
      if (vals[j] > hi) hi = vals[j];
      if (vals[j] < lo) lo = vals[j];
    }
    if (hi === lo) return null;
    return (vals[vals.length - 1] - lo) / (hi - lo) * 100;
  }
  /* CCI (20): harga tipikal (H+L+C)/3 terhadap SMA-nya, dibagi
     0,015 × simpangan rata-rata. Null bila simpangan rata-rata nol. */
  function cci(highs, lows, closes, n) {
    n = n || 20;
    if (!closes || closes.length < n) return null;
    var tp = [];
    for (var i = closes.length - n; i < closes.length; i++) {
      if (!isNum(highs[i]) || !isNum(lows[i]) || !isNum(closes[i])) return null;
      tp.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    var m = 0;
    for (var j = 0; j < tp.length; j++) m += tp[j];
    m /= n;
    var md = 0;
    for (var k = 0; k < tp.length; k++) md += Math.abs(tp[k] - m);
    md /= n;
    if (md === 0) return null;
    return (tp[tp.length - 1] - m) / (0.015 * md);
  }
  /* William %R (14): (tertinggi14 - close)/(tertinggi14 - terendah14) × -100. */
  function williamsR(highs, lows, closes, n) {
    n = n || 14;
    if (!closes || closes.length < n) return null;
    var hi = -Infinity, lo = Infinity;
    for (var i = closes.length - n; i < closes.length; i++) {
      if (!isNum(highs[i]) || !isNum(lows[i]) || !isNum(closes[i])) return null;
      if (highs[i] > hi) hi = highs[i];
      if (lows[i] < lo) lo = lows[i];
    }
    if (hi === lo) return null;
    return (hi - closes[closes.length - 1]) / (hi - lo) * -100;
  }
  /* MACD (12,26,9): garis = EMA12 - EMA26, sinyal = EMA9 garis,
     histogram = garis - sinyal. */
  function macd(closes, fast, slow, signal) {
    fast = fast || 12; slow = slow || 26; signal = signal || 9;
    var ef = emaSeries(closes, fast), es = emaSeries(closes, slow);
    if (!ef.length || !es.length) return null;
    var line = [];
    for (var i = 0; i < closes.length; i++) {
      line.push(isNum(ef[i]) && isNum(es[i]) ? ef[i] - es[i] : null);
    }
    var sigSeries = [];
    /* EMA atas garis MACD: benih = SMA signal pertama nilai garis yang sah. */
    var first = -1;
    for (var j = 0; j < line.length; j++) if (isNum(line[j])) { first = j; break; }
    if (first < 0) return null;
    var vals = [];
    for (var k = first; k < line.length; k++) vals.push(line[k]);
    var sig = emaSeries(vals, signal);
    for (var m = 0; m < line.length; m++) {
      sigSeries.push(m < first ? null : (sig[m - first] !== undefined ? sig[m - first] : null));
    }
    var l = lastNonNull(line), s = lastNonNull(sigSeries);
    if (l === null || s === null) return null;
    return { macd: l, signal: s, histogram: l - s };
  }
  /* Gerak 20 hari: butuh minimal 21 titik (20 hari lalu + terakhir).
     Null bila data kurang atau harga 20 hari lalu nol. */
  function gerak20(closes) {
    if (!closes || closes.length < 21) return null;
    var dulu = closes[closes.length - 21], akhir = closes[closes.length - 1];
    if (!isNum(dulu) || !isNum(akhir) || dulu === 0) return null;
    return { dulu: dulu, akhir: akhir, pct: (akhir / dulu - 1) * 100 };
  }
  /* Sinyal utama v2 — aturan transparan, 8 suara dari indikator yang ada.
     Beli: RSI<30, Stochastic %K<20, StochRSI<20, CCI<-100, William %R<-80,
     harga di bawah pita bawah Bollinger, histogram MACD>0, harga di atas MA20.
     Jual: kebalikannya (RSI>70, %K>80, StochRSI>80, CCI>100, %R>-20,
     harga di atas pita atas, histogram MACD<0, harga di bawah MA20).
     BELI bila suara beli >= suara jual + 2; JUAL bila sebaliknya;
     selebihnya TAHAN. Nilai null = "data kurang", tidak memberi suara. */
  function sinyal(closes, highs, lows) {
    var rincian = [];
    function suara(nama, nilai, cekBeli, cekJual) {
      var s;
      if (nilai === null || nilai === undefined) s = "data kurang";
      else if (cekBeli(nilai)) s = "beli";
      else if (cekJual(nilai)) s = "jual";
      else s = "netral";
      rincian.push({ nama: nama, suara: s });
      return s;
    }
    if (!closes || closes.length < 2) {
      ["RSI", "Stochastic", "Stochastic RSI", "CCI", "William %R", "Bollinger", "MACD", "MA20"]
        .forEach(function (n) { rincian.push({ nama: n, suara: "data kurang" }); });
      return { hasil: "TAHAN", beli: 0, jual: 0, rincian: rincian };
    }
    var akhir = closes[closes.length - 1];
    var bb = bollinger(closes, 20, 2);
    var st = stochastic(highs, lows, closes, 14, 3);
    var mc = macd(closes, 12, 26, 9);
    var ma20 = sma(closes, 20);
    suara("RSI", rsi(closes, 14),
      function (v) { return v < 30; }, function (v) { return v > 70; });
    suara("Stochastic", (st && st.k !== null) ? st.k : null,
      function (v) { return v < 20; }, function (v) { return v > 80; });
    suara("Stochastic RSI", stochRsi(closes, 14, 14),
      function (v) { return v < 20; }, function (v) { return v > 80; });
    suara("CCI", cci(highs, lows, closes, 20),
      function (v) { return v < -100; }, function (v) { return v > 100; });
    suara("William %R", williamsR(highs, lows, closes, 14),
      function (v) { return v < -80; }, function (v) { return v > -20; });
    suara("Bollinger", bb ? (akhir < bb.lower ? -1 : (akhir > bb.upper ? 1 : 0)) : null,
      function (v) { return v === -1; }, function (v) { return v === 1; });
    suara("MACD", mc ? mc.histogram : null,
      function (v) { return v > 0; }, function (v) { return v < 0; });
    suara("MA20", (ma20 !== null && isNum(akhir)) ? (akhir > ma20 ? 1 : (akhir < ma20 ? -1 : 0)) : null,
      function (v) { return v === 1; }, function (v) { return v === -1; });
    var beli = 0, jual = 0;
    for (var i = 0; i < rincian.length; i++) {
      if (rincian[i].suara === "beli") beli++;
      else if (rincian[i].suara === "jual") jual++;
    }
    var hasil = "TAHAN";
    if (beli >= jual + 2) hasil = "BELI";
    else if (jual >= beli + 2) hasil = "JUAL";
    return { hasil: hasil, beli: beli, jual: jual, rincian: rincian };
  }
  return {
    sma: sma, emaSeries: emaSeries, bollinger: bollinger,
    rsiSeries: rsiSeries, rsi: rsi, stochastic: stochastic,
    stochRsi: stochRsi, cci: cci, williamsR: williamsR, macd: macd,
    lastNonNull: lastNonNull, sinyal: sinyal, gerak20: gerak20
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = TeknikIndikator;
