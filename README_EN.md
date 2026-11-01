# TeknikKu

Android app for displaying technical indicators to monitor ETFs and stocks.
Built on 1 November 2026 as a new project (WebView + Yahoo Finance data).

## Features
- 9 standard public indicators that can be toggled on/off: MA 5 & 20,
  Bollinger Band & Bandwidth, Stochastic, Stochastic RSI, RSI, CCI,
  William %R, and MACD.
- BUY / HOLD / SELL signal card from a transparent 8-vote rule.
- 20-day movement panel.
- Built-in watchlist of 6 ETFs (QQQ, SCHD, SPUS, HLAL, SPHD, VOO) + free
  ticker input (Indonesian stocks use the `.JK` suffix).
- Live price data from Yahoo Finance. No buying/selling inside the app;
  it is a monitoring and education tool, not a buy instruction.

## Technology
- Android WebView + local HTML/JavaScript (`app/src/main/assets/`).
- Indicator logic in `indikator.js`, tested with the scripts in `tests/`.
- Manual assembly without Gradle: aapt2, javac, d8, zipalign, apksigner
  (see `BUILD.md`).

## Running
Install the assembled APK (or assemble it yourself via `BUILD.md`), open
the app, pick a ticker, and toggle the indicators you want.

## License
MIT — see `LICENSE`.
