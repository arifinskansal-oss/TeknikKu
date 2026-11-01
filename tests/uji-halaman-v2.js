/* Uji alur halaman TeknikKu v2 di Node (stub DOM + fetch Yahoo nyata):
   panel sinyal utama + gerak 20 hari terisi dari data QQQ 6 bulan, dan
   panel kembali "—" saat memuat ticker tidak dikenal. */
const fs = require("fs");
const vm = require("vm");
const path = "/home/hatch/workspace/TeknikKu/app/src/main/assets/";

function elStub() {
  return {
    value: "", textContent: "", innerHTML: "", style: {}, className: "", clientWidth: 360,
    classList: { toggle: function () {} },
    getContext: function () {
      return {
        setTransform: function () {}, clearRect: function () {}, fillRect: function () {},
        fillText: function () {}, beginPath: function () {}, moveTo: function () {},
        lineTo: function () {}, closePath: function () {}, fill: function () {},
        stroke: function () {}, arc: function () {},
        createLinearGradient: function () { return { addColorStop: function () {} }; },
        setLineDash: function () {}
      };
    }
  };
}
const els = {};
const store = {};
const sandbox = {
  console: console,
  setTimeout: setTimeout, clearTimeout: clearTimeout,
  window: {},
  document: {
    getElementById: function (id) { if (!els[id]) els[id] = elStub(); return els[id]; },
    querySelectorAll: function () { return []; }
  },
  localStorage: {
    getItem: function (k) { return k in store ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }
  },
  fetch: fetch
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path + "indikator.js", "utf8"), sandbox);
const html = fs.readFileSync(path + "index.html", "utf8");
const inline = html.split("<script>")[1].split("</script>")[0];
vm.runInContext(inline, sandbox);

function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
(async function () {
  await tunggu(8000);
  const T = sandbox.TeknikIndikator;
  const seri = sandbox.seri;
  console.log("titik QQQ:", seri ? seri.closes.length : "null");
  console.log("sinyalUtama:", els.sinyalUtama.textContent, "| kelas:", els.sinyalUtama.className);
  console.log("sinyalSuara:", els.sinyalSuara.textContent);
  console.log("sinyalRincian:", els.sinyalRincian.textContent);
  console.log("gerak20:", els.gerak20.innerHTML);
  let gagal = 0;
  function cek(nama, ok) { console.log((ok ? "LULUS " : "GAGAL ") + nama); if (!ok) gagal++; }
  cek("sinyal salah satu BELI/JUAL/TAHAN",
    ["BELI", "JUAL", "TAHAN"].indexOf(els.sinyalUtama.textContent) >= 0);
  cek("sinyalSuara berisi beli dan jual",
    els.sinyalSuara.textContent.indexOf("Suara beli:") >= 0 &&
    els.sinyalSuara.textContent.indexOf("Suara jual:") >= 0);
  cek("rincian memuat 8 indikator",
    ["RSI:", "Stochastic:", "Stochastic RSI:", "CCI:", "William %R:", "Bollinger:", "MACD:", "MA20:"]
      .every(function (n) { return els.sinyalRincian.textContent.indexOf(n) >= 0; }));
  /* Gerak 20 hari halaman harus sama dengan mesin atas closes yang sama. */
  const g = T.gerak20(seri.closes);
  const pctTxt = (g.pct >= 0 ? "+" : "") + g.pct.toFixed(2).replace(".", ",") + "%";
  cek("gerak20 memuat persen mesin (" + pctTxt + ")", els.gerak20.innerHTML.indexOf(pctTxt) >= 0);
  cek("gerak20 memuat harga dulu mesin", els.gerak20.innerHTML.indexOf("$" + g.dulu.toFixed(2).replace(".", ",")) >= 0);
  /* Jalur galat: panel kembali "—" (reset di muatSimbol). */
  sandbox.muatSimbol("ZZZZTIDAKADA99");
  await tunggu(8000);
  console.log("sesudah galat sinyalUtama:", els.sinyalUtama.textContent, "| gerak20:", els.gerak20.textContent);
  cek("panel reset ke — saat ticker gagal", els.sinyalUtama.textContent === "—" && els.gerak20.textContent === "—");
  if (gagal > 0) { console.log("TOTAL GAGAL: " + gagal); process.exit(1); }
  console.log("ALUR HALAMAN V2 LULUS");
})();
