# Cara merakit APK TeknikKu (manual, tanpa Gradle)

Lingkungan ini tidak memakai Gradle (daemon Gradle tidak stabil di VM ini),
jadi perakitan dilakukan manual dengan perkakas Android SDK:

1. Kompilasi resource dengan `aapt2 compile` lalu `aapt2 link`
   (paket `com.immangarif.teknikku`, manifest di
   `app/src/main/AndroidManifest.xml`).
2. Kompilasi Java dengan `javac` (sumber di
   `app/src/main/java/com/immangarif/teknikku/`).
3. Konversi ke dex dengan `d8`.
4. Kemas APK, selaraskan dengan `zipalign`, lalu tandatangani dengan
   `apksigner` memakai keystore Anda sendiri.

Aset WebView (`index.html`, `indikator.js`) berada di
`app/src/main/assets/` dan ikut terkema ke dalam APK apa adanya.
Tidak ada kunci API, kredensial, atau keystore di dalam repositori ini.
