package com.immangarif.teknikku;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * TeknikKu — WebView wrapper (pola yang dipakai ulang dari RadarKu).
 * Seluruh UI ada di assets/index.html.
 *
 * Pengambilan data: halaman memanggil AndroidBridge.fetchQuotes dan
 * AndroidBridge.fetchChart lewat bridge native (bukan fetch() dari halaman,
 * karena endpoint Yahoo tidak mengirim header CORS untuk origin file://).
 * Bridge mengambil JSON grafik Yahoo Finance (query1, cadangan query2)
 * di thread latar, lalu mengembalikan hasilnya ke halaman lewat
 * window.__teknikResult / window.__teknikChart.
 * Tidak ada fitur beli/jual. Tidak ada rumus berbayar/proprietary.
 */
public class MainActivity extends Activity {

    private WebView webView;

    public class AndroidBridge {

        @JavascriptInterface
        public void toast(String msg) {
            showToast(msg);
        }

        /**
         * Ambil kuotasi untuk daftar simbol (dipisah koma). Hasil async via
         * __teknikResult. Tiap item berbentuk "SIMBOL" atau "SIMBOL.JK" /
         * "SIMBOL.L" bila sudah ditulis lengkap. Urutan percobaan: kode
         * polos dulu, lalu London ".L", lalu Jakarta ".JK" — jadi ticker
         * yang diketik tanpa suffix pun dicoba di ketiga bursa.
         */
        @JavascriptInterface
        public void fetchQuotes(final String symbolsCsv) {
            new Thread(new Runnable() {
                @Override public void run() {
                    JSONArray hasil = new JSONArray();
                    String[] simbols = symbolsCsv.split(",");
                    for (String mentah : simbols) {
                        String item = mentah.trim().toUpperCase();
                        if (item.length() == 0) continue;
                        hasil.put(ambilSatu(item));
                    }
                    final String payload = hasil.toString();
                    runOnUiThread(new Runnable() {
                        @Override public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript(
                                    "window.__teknikResult && window.__teknikResult("
                                        + JSONObject.quote(payload) + ")", null);
                            }
                        }
                    });
                }
            }).start();
        }

        private JSONObject ambilSatu(String sym) {
            JSONObject o = new JSONObject();
            try { o.put("symbol", sym); } catch (Exception abaikan) { }
            java.util.ArrayList<String> kandidat = new java.util.ArrayList<String>();
            if (sym.contains(".")) {
                kandidat.add(sym);
            } else {
                kandidat.add(sym);
                kandidat.add(sym + ".L");
                kandidat.add(sym + ".JK");
            }
            String errorTerakhir = "simbol tidak ditemukan";
            for (String ysym : kandidat) {
                try {
                    JSONObject meta = ambilMeta(ysym);
                    if (meta == null) { errorTerakhir = "simbol tidak ditemukan"; continue; }
                    o.put("ok", true);
                    o.put("ysym", ysym);
                    o.put("price", meta.getDouble("regularMarketPrice"));
                    o.put("prevClose", meta.getDouble("chartPreviousClose"));
                    o.put("currency", meta.optString("currency", "USD"));
                    return o;
                } catch (Exception e) {
                    errorTerakhir = String.valueOf(e.getMessage());
                }
            }
            try {
                o.put("ok", false);
                o.put("error", errorTerakhir);
            } catch (Exception abaikan) { }
            return o;
        }

        /**
         * Ambil data grafik (deret waktu) untuk satu kode Yahoo. JSON mentah
         * Yahoo diteruskan apa adanya ke halaman lewat
         * window.__teknikChart(id, jsonString) — halaman yang mem-parsing
         * timestamp + harga. String kosong dikirim bila semua host gagal,
         * agar halaman bisa menampilkan "grafik tidak tersedia".
         */
        @JavascriptInterface
        public void fetchChart(final String ysym, final String range,
                               final String interval, final int id) {
            new Thread(new Runnable() {
                @Override public void run() {
                    String payload = "";
                    String[] hosts = {"query1.finance.yahoo.com", "query2.finance.yahoo.com"};
                    for (String host : hosts) {
                        try {
                            payload = httpGet("https://" + host + "/v8/finance/chart/"
                                    + Uri.encode(ysym) + "?interval=" + interval
                                    + "&range=" + range);
                            break;
                        } catch (Exception e) {
                            payload = "";
                        }
                    }
                    final String kirim = payload;
                    runOnUiThread(new Runnable() {
                        @Override public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript(
                                    "window.__teknikChart && window.__teknikChart(" + id + ","
                                        + JSONObject.quote(kirim) + ")", null);
                            }
                        }
                    });
                }
            }).start();
        }

        /** Ambil objek meta Yahoo untuk satu kode; null bila simbol tidak dikenal. */
        private JSONObject ambilMeta(String ysym) throws Exception {
            String[] hosts = {"query1.finance.yahoo.com", "query2.finance.yahoo.com"};
            Exception terakhir = null;
            for (String host : hosts) {
                try {
                    String body = httpGet("https://" + host + "/v8/finance/chart/"
                            + Uri.encode(ysym) + "?interval=1d&range=1d");
                    JSONObject root = new JSONObject(body);
                    JSONObject chart = root.optJSONObject("chart");
                    if (chart == null || chart.isNull("result")) return null;
                    JSONArray result = chart.getJSONArray("result");
                    if (result.length() == 0) return null;
                    JSONObject meta = result.getJSONObject(0).getJSONObject("meta");
                    if (!meta.has("regularMarketPrice") || meta.isNull("regularMarketPrice")) return null;
                    if (!(meta.optDouble("regularMarketPrice", 0) > 0)) return null;
                    return meta;
                } catch (Exception e) {
                    terakhir = e;
                }
            }
            if (terakhir != null) throw terakhir;
            return null;
        }

        private String httpGet(String urlStr) throws Exception {
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(urlStr).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(15000);
                c.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
                c.setRequestProperty("Accept", "application/json");
                int code = c.getResponseCode();
                if (code != 200) throw new Exception("HTTP " + code);
                BufferedReader r = new BufferedReader(
                    new InputStreamReader(c.getInputStream(), "UTF-8"));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
                r.close();
                return sb.toString();
            } finally {
                if (c != null) c.disconnect();
            }
        }
    }

    private void showToast(final String msg) {
        runOnUiThread(new Runnable() {
            @Override public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // wajib untuk localStorage
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // tautan http/https -> buka di browser luar, bukan di dalam aplikasi
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception e) {
                        showToast("Tidak ada aplikasi untuk membuka tautan ini");
                    }
                    return true;
                }
                return false;
            }
        });
        webView.setWebChromeClient(new WebChromeClient()); // agar alert() JS berfungsi
        webView.loadUrl("file:///android_asset/index.html");

        setContentView(webView);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
