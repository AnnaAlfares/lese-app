# Lese-App – Anweisungen für den Coding-Agenten

## Rolle
Du baust mit mir (Anna, Klassenlehrerin einer 1. Klasse, Grundschule NRW, Digitalisierungsbeauftragte) eine Lese-App für Erstklässler. Ich kann etwas programmieren (Python, Web), bin aber keine Deutschdidaktikerin. Erkläre didaktische Entscheidungen kurz. Antworte auf Deutsch, Code-Kommentare ebenfalls auf Deutsch.

## Ziel
Eine Web-App, mit der Kinder vom Hören der Laute bis zum verstehenden Lesen kurzer Sätze üben. Einsatz am Digiboard (ganze Klasse) und auf 6–7 geteilten iPads (selbstständig). Kurze Einheiten von 5–15 Minuten.

## Technik
- Reines HTML, CSS und JavaScript (ES-Module), **kein Build-Schritt**, keine Frameworks, keine npm-Abhängigkeiten zur Laufzeit.
- Hosting über **GitHub Pages** direkt aus dem Branch `main`.
- **Keine externen Dienste:** keine CDNs, keine Google Fonts, keine Analyse. Schriften liegen lokal in `assets/fonts/`.
- Lokal testen mit `python3 -m http.server 8000` im Projektordner.
- Zielgeräte: iPad (Safari) und Digiboard (Chrome/Edge). Touch first, große Schaltflächen (mindestens 64 px), Querformat.

## Ordnerstruktur
```
index.html              Start: Bildercode-Eingabe, dann Stufen-Kacheln
lehrkraft.html          Lehrkraft-Bereich (Passwort)
css/app.css
js/app.js               Navigation, Zustand im Arbeitsspeicher
js/config.js            Buchstabenreihenfolge, Einstellungen
js/woerter.js           Wortliste, Modellwörter, Wörternetze
js/bildercode.js        Bildercode kodieren/dekodieren
js/audio.js             Vorlesen (Laute, Silben, Wörter)
js/module/*.js          ein Modul pro Übung (rutschen.js, leseapparat.js, …)
assets/codebilder/      01_lampe.png … 16_raupe.png
assets/fonts/
```

## Feste Regeln
1. **Buchstabenreihenfolge = Zwergenheft (Druckschriftlehrgang, Jandorf):** O, M, E, A, L, S, F, N, T, R, I, U, K, W, P, H, Ei, D, Ch, Au, Z, G, Sch, B, ie, Ö, Ü, St, Pf, Eu, ng, Sp, J, Ä, Qu, X, V, C, Y, ß, chs. Sie steht nur in `js/config.js`. Die App zeigt nur Wörter und Silben aus bereits eingeführten Buchstaben. Den Stand stellt die Lehrkraft ein. Der zuletzt eingeführte Buchstabe kommt gezielt häufiger vor. Mehrbuchstaben (Ei, Au, Sch, ch, ie, Eu, St, Sp, Pf, ng, Qu, chs) zählen als ein Graphem.
2. **Immer lautieren** (/m/), nie Buchstabennamen („Em“).
3. **Wortmaterial:** wenige Modellwörter mit Wörternetzen statt langer Listen, lauttreu und aus Basisgraphemen, vom Häufigen zum Seltenen. Zuerst ein- und zweisilbige Wörter mit Dehnlauten (m, n, l, f, s, sch) und Konsonant-Vokal-Struktur; Plosive und Konsonantenhäufungen später. Sichtwörter: ich, du, und, ist, das, mit, auf, ein. Anlautbilder mit Basisgraphem (Insel statt Igel).
4. **Steigerung:** identifizieren → segmentieren → synthetisieren → manipulieren; Anlaut vor Inlaut vor Auslaut; mit Bild → ohne Bild → ähnliche Laute (/k/–/g/).
5. **Hilfen zuschaltbar** und abbaubar: Silbenbögen, Silbenfarben (blau/rot), Vokal als „Silbenkönig“ markiert, Leseschieber, Bilder.
6. **Alles wird vorgesprochen**, jedes Bildwort ist antippbar (Mehrsprachigkeit). Laute gedehnt (/mmm/). Web Speech API (deutsche Stimme, Tempo einstellbar) als Start; später eigene Aufnahmen in `assets/audio/`. Ohne deutsche Stimme den Lautsprecher-Knopf ausblenden.
7. **Ruhige Oberfläche:** große Druckschrift (mindestens 32 px), weite Zeilen- und Buchstabenabstände, kurze Zeilen, keine Pop-ups, keine Links nach außen.
8. **Motivation:** Sterne und eigener Rekord, keine Ranglisten. Tempoübungen nach LESE-FOKUS (1-Minuten-Limit oder Zeit stoppen); der **Zeitmodus ist im Lehrkraft-Bereich abschaltbar**.
9. **Datenschutz und Speicherung:** keine Namen, keine Cookies, kein localStorage, keine Server. Der Spielstand lebt nur im Arbeitsspeicher. Die Lehrkraft-Einstellungen (Buchstabenstand, Zeitmodus, Hilfen) werden als kurzer Klassencode bzw. URL-Parameter weitergegeben, nicht gespeichert.
10. **Bildercode:** 16 Bilder mit festen Zahlen (Reihenfolge Tinto-Anlautrap): 1 Lampe, 2 Maus, 3 Sonne, 4 Jojo, 5 Wolke, 6 Banane, 7 Gabel, 8 Domino, 9 Auto, 10 Eis, 11 Tafel, 12 Kerze, 13 Pinsel, 14 Schere, 15 Nase, 16 Raupe. Code = 5 Bilder: 4 Bilder (16 Bit) für den Sternestand der 5 Stufen (je 0–7 Sterne), 1 Prüfbild. Beim Start tippt das Kind seine Bilder an; am Ende zeigt die App den neuen Code groß und spricht die Zahlen vor. Unter jedem Bild klein der Anlaut. Code vergessen = Sterne von vorne (gewolltes Gedächtnistraining). Vorbild: Helden-Code der App „Redezeichen-Helden“.
11. **Urheberrecht:** keine Bilder, Figuren oder Gestaltung aus Tinto, Zwergenheft, LESE-FOKUS oder dem Leseapparat von Ina Lehr kopieren. Ideen ja, eigene Gestaltung. Die Leseblätter von zuhause.leseblatt.de sind CC0 und dürfen als Wortquelle genutzt werden.

## Lernleiter (Module)
1. **Hören:** Anlaut-Detektiv, Silben klatschen, Schneckensprache (Lautsynthese), Robotersprache (Lautsegmentierung), Quatschwort-Retter
2. **Buchstabe und Laut:** Buchstabenbingo, Buchstaben verbinden, Lautedomino, Wo hörst du es?
3. **Laute verbinden:** Rutschen (wie Tinto und zuhause.leseblatt.de: Laute gedehnt zusammenziehen, „Lllooo-lllaaa“ → „Lola“, nur dehnbare Laute; erst Silben, dann Wörter), Leseapparat (zwei Fenster Konsonant + Vokal, Bogen dazwischen, Streifen wischen), Leseschieber, Monsternamen
4. **Automatisieren:** Silbenteppich, Blitzlesen, Wort-Fang, Wortpuzzle, Wörternetz (Analogielesen: Hand → Land → Sand, gleiches Wortende farbig), Schnipp-Schnapp (Signalgruppen)
5. **Verstehen:** Klammerbild, Lies und mach, Hören und Mitlesen

Lehrkraft-Bereich: Buchstabenstand, Module an/aus, Hilfen an/aus, Zeitmodus an/aus, Digiboard-Modus, Lernstandscheck (Ergebnis nur anzeigen), später Leseblatt-Generator (PDF).

## Arbeitsweise
- Baue in kleinen, lauffähigen Schritten. Ein Modul pro Thread/Branch.
- Trenne Daten (Buchstaben, Wörter) strikt von Modulen. Neue Module nutzen `config.js` und `woerter.js`, nie eigene Wortlisten.
- CSS-Klassen eines Moduls oder Bausteins tragen ein eigenes Präfix (z. B. `blitz-`, `code-`, `belohnung`), damit sich Gestaltungsregeln nicht gegenseitig beeinflussen. Keine allgemeinen Klassennamen wie `.fertig`, `.stern` oder `.ende` in Modul-CSS. Details in `js/module/README.md`.
- Teste jedes Modul im Browser in iPad-Größe (1180 × 820) und in Digiboard-Größe (1920 × 1080).
- Frag nach, bevor du größere Strukturentscheidungen triffst. Erfinde keine didaktischen Regeln; wenn etwas unklar ist, frag.
- Schlage nach jedem Schritt den nächsten sinnvollen vor.

## Hintergrundmaterial
- Fachliche Hintergrund-PDFs liegen in `/home/annas/projekte/lese-app-hintergrund` (ausserhalb des Repositorys).
- Lies sie bei didaktischen Fragen, bevor du nachfragst. Nenne die Quelle, wenn du dich darauf stuetzt.
- Niemals Inhalte, Bilder oder Dateien daraus ins Repository kopieren (oeffentlich auf GitHub, siehe Regel 11).
