/* Uji jalur kuotasi __teknikResult (simulasi jawaban bridge Android). */
var fs = require("fs"), vm = require("vm");
function ctxStub() {
  return {
    setTransform: function () {}, clearRect: function () {}, fillRect: function () {},
    fillText: function () {}, beginPath: function () {}, moveTo: function () {},
    lineTo: function () {}, closePath: function () {}, fill: function () {},
    stroke: function () {}, arc: function () {},
    createLinearGradient: function () { return { addColorStop: function () {} }; },
    setLineDash: function () {}
  };
}
function elStub() {
  return {
    value: "", textContent: "", innerHTML: "", style: {}, clientWidth: 360,
    classList: { toggle: function () {} },
    getContext: function () { return ctxStub(); }
  };
}
var els = {}, store = {};
var sb = {
  console: console, setTimeout: setTimeout, clearTimeout: clearTimeout, window: {},
  document: {
    getElementById: function (id) { if (!els[id]) els[id] = elStub(); return els[id]; },
    querySelectorAll: function () { return []; }
  },
  localStorage: {
    getItem: function (k) { return k in store ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }
  },
  fetch: function () { return Promise.reject(new Error("jaringan dimatikan untuk uji ini")); }
};
sb.window = sb; sb.globalThis = sb;
vm.createContext(sb);
var p = "/home/hatch/workspace/TeknikKu/app/src/main/assets/";
vm.runInContext(fs.readFileSync(p + "indikator.js", "utf8"), sb);
var html = fs.readFileSync(p + "index.html", "utf8");
vm.runInContext(html.split("<script>")[1].split("</script>")[0], sb);
sb.idGrafikAktif = 999; /* bekukan pemuatan awal agar tidak mengganggu */
sb.__teknikResult(JSON.stringify([{ symbol: "QQQ", ok: true, ysym: "QQQ", price: 690.49, prevClose: 700, currency: "USD" }]));
console.log("quote OK -> hargaSimbol:", els.hargaSimbol.innerHTML);
sb.__teknikResult(JSON.stringify([{ symbol: "QQQ", ok: false, error: "simbol tidak ditemukan" }]));
console.log("quote GAGAL -> hargaSimbol:", els.hargaSimbol.textContent);
console.log("quote GAGAL -> status:", els.status.textContent);
var ok = els.status.textContent.indexOf("tidak ditemukan") >= 0;
console.log(ok ? "JALUR KUOTASI LULUS" : "JALUR KUOTASI GAGAL");
if (!ok) process.exit(1);
