/* Uji alur halaman TeknikKu di Node dengan stub DOM minimal + fetch Yahoo
   nyata. Memverifikasi: render awal, muat QQQ 6 bulan, panel nilai +
   ringkasan terisi, dan jalur galat untuk ticker tidak dikenal. */
const fs = require("fs");
const vm = require("vm");
const path = "/home/hatch/workspace/TeknikKu/app/src/main/assets/";

function elStub() {
  return {
    value: "", textContent: "", innerHTML: "", style: {}, clientWidth: 360,
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
  console.log("judulSimbol:", els.judulSimbol.textContent);
  console.log("hargaSimbol:", els.hargaSimbol.textContent || els.hargaSimbol.innerHTML);
  console.log("infoPeriode:", els.infoPeriode.innerHTML);
  console.log("infoGrafik:", els.infoGrafik.textContent);
  console.log("nilaiIndikator:", els.nilaiIndikator.innerHTML.replace(/<[^>]+>/g, " | "));
  console.log("ringkasan:", els.ringkasan.textContent);
  const ok = els.nilaiIndikator.innerHTML.indexOf("Moving Average 20") >= 0 &&
    els.nilaiIndikator.innerHTML.indexOf("RSI (14)") >= 0 &&
    els.ringkasan.textContent.indexOf("RSI (14)") >= 0;
  console.log(ok ? "ALUR QQQ LULUS" : "ALUR QQQ GAGAL");
  /* Jalur galat: ticker tidak dikenal (bridge tidak ada -> fetch langsung). */
  sandbox.muatSimbol("ZZZZTIDAKADA99");
  await tunggu(8000);
  console.log("galat infoGrafik:", els.infoGrafik.textContent);
  console.log(els.infoGrafik.textContent.indexOf("tidak tersedia") >= 0 ? "JALUR GALAT LULUS" : "JALUR GALAT GAGAL");
  if (!ok) process.exit(1);
})();
