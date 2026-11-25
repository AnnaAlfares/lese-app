# Schriften

Hier liegen die Schriftdateien lokal. Keine Google Fonts, keine CDNs.
Nur Schriften mit freier Lizenz ablegen und die Lizenzdatei mit hineinlegen.
Eingebunden mit `@font-face` in `css/app.css`, ausgewählt über den URL-Parameter `s` (`js/config.js`, `SCHRIFTEN`).

| Ordner | Schrift | Lizenz | Herkunft | `s=` |
|---|---|---|---|---|
| `andika/` | Andika 6.200 (Regular, Bold), unverändert | SIL Open Font License 1.1 (`OFL.txt`), Reserved Font Names „Andika“, „SIL“ | <https://software.sil.org/andika/> | `andika` (Standard) |
| `playwrite-de-grund/` | Playwrite Deutschland Grundschrift (variabel, Strichstärke 100–400), unverändert | SIL Open Font License 1.1 (`OFL.txt`) | <https://github.com/TypeTogether/Playwrite> (über google/fonts, `ofl/playwritedegrund`) | `grund` |

Die OFL erlaubt Nutzung, Einbettung und Weitergabe, auch öffentlich; die Schriften dürfen nur nicht einzeln
verkauft werden, und veränderte Fassungen dürften die reservierten Namen nicht tragen. Deshalb liegen die
Dateien unverändert hier (die CSS-Familiennamen „Andika Lese“ usw. sind nur interne Namen in `app.css`).
