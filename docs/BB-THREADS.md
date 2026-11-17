# Lese-App – Startplan für bb

Reihenfolge: Thread 0 und 1 nacheinander. Danach können die Threads 2–6 parallel laufen (jeder in seinem eigenen Worktree/Branch). Nach jedem Thread im Browser testen und in `main` mergen.

Vorher einmalig: Repository-Ordner im WSL-Dateisystem anlegen (z. B. `~/projekte/lese-app`), `CLAUDE.md` hineinlegen, die 16 Code-Bilder als `assets/codebilder/01_lampe.png` … `16_raupe.png` ablegen.

---

## Thread 0 – Repository und Veröffentlichung
> Lies CLAUDE.md. Lege das Grundgerüst laut Ordnerstruktur an (leere Dateien mit kurzen Kommentaren), eine README.md auf Deutsch und eine .gitignore. Erstelle mit `gh` ein öffentliches GitHub-Repository `lese-app`, pushe `main` und richte GitHub Pages aus `main` ein. Lege eine Seite `impressum.html` mit Platzhaltern für Impressum und Datenschutz an (Text wie in CLAUDE.md, Regel 9: keine Cookies, keine Speicherung, Hosting über GitHub Pages). Nenne mir am Ende die Pages-URL.

## Thread 1 – Grundgerüst, Buchstabenstand, Wortliste
> Lies CLAUDE.md. Baue `js/config.js` mit der Zwergenheft-Reihenfolge (Mehrbuchstaben als ein Graphem) und `js/woerter.js` mit einer ersten Wortliste: lauttreue Wörter, die mit den ersten 12 Buchstaben (O bis U) lesbar sind, dazu Modellwörter und Wörternetze aus CLAUDE.md. Schreibe eine Funktion, die zu einem Buchstabenstand alle lesbaren Wörter und Silben liefert und den neuesten Buchstaben bevorzugt. Baue `index.html` mit großen Kacheln für die 5 Stufen (noch ohne Module) und `lehrkraft.html` mit Buchstabenstand, Hilfen und Zeitmodus. Die Einstellungen werden als URL-Parameter weitergegeben (Link zum Speichern als Lesezeichen auf den iPads), nichts wird gespeichert. Baue `js/audio.js` mit Web Speech API: Laut gedehnt, Silbe, Wort; Knopf ausblenden, wenn keine deutsche Stimme da ist. Zeige mir eine Testseite, die für jeden Buchstabenstand die gefundenen Wörter auflistet.

## Thread 2 – Bildercode
> Lies CLAUDE.md, Regel 10. Baue `js/bildercode.js` (kodieren, dekodieren, Prüfbild) mit Tests in einer kleinen Testseite. Baue die Eingabe auf `index.html`: 16 Bildkacheln mit Zahl und Anlaut, 5 Plätze, Löschen-Knopf, „Ich bin neu“-Knopf. Baue den Abschluss-Bildschirm: neuer Code groß, Zahlen werden vorgelesen. Falsches Prüfbild = freundlicher Hinweis „Schau noch einmal auf deine Karte“.

## Thread 3 – Rutschen
> Lies CLAUDE.md. Baue `js/module/rutschen.js`: Eine Rutsche, oben ein dehnbarer Konsonant, unten ein Vokal. Das Kind zieht mit dem Finger die Rutsche entlang; der Laut wird gehalten, solange der Finger rutscht, und beim Vokal zur Silbe verbunden („mmmaaa“ → „ma“). Danach liest das Kind die Silbe selbst und tippt weiter. Stufe 2: zwei Rutschen hintereinander für Wörter (Lo-la, Ma-ma). Nur dehnbare Laute aus dem aktuellen Buchstabenstand. Silbenfarben zuschaltbar.

## Thread 4 – Leseapparat
> Lies CLAUDE.md. Baue `js/module/leseapparat.js`: zwei Fenster nebeneinander (links Konsonant, rechts Vokal) mit einem Bogen darunter. Das Kind wischt den linken oder rechten Streifen weiter; ein Punkt gleitet den Bogen entlang und die App spricht gedehnt vor. Danach liest das Kind selbst. Buchstaben nur aus dem Buchstabenstand. Vokale farbig markiert. Eigene Gestaltung, nicht die Vorlage von Ina Lehr nachbauen.

## Thread 5 – Silbenteppich mit Zeitmodus
> Lies CLAUDE.md. Baue `js/module/silbenteppich.js`: Zeilen mit Silben aus dem Buchstabenstand, zeilenweise von links nach rechts lesen; die aktuelle Silbe ist hervorgehoben, Antippen geht weiter, Lautsprecher spricht die Silbe vor. Drei Modi wie in LESE-FOKUS: ohne Zeit, 1-Minuten-Limit, Zeit stoppen mit eigenem Rekord (nur im Arbeitsspeicher). Zeitmodi nur, wenn der Zeitmodus in den Einstellungen an ist. Silbenfarben und Groß-/Kleinschreibung zuschaltbar.

## Thread 6 – Blitzlesen
> Lies CLAUDE.md. Baue `js/module/blitzlesen.js`: Ein Wort wird kurz eingeblendet (Zeit einstellbar, Start 2 Sekunden), dann wählt das Kind aus 3 Bildern das passende. Zuerst hochfrequente Ein- und Zweisilber und die Sichtwörter aus CLAUDE.md. Sterne für richtige Antworten, mit Zeitmodus zusätzlich Wörter pro Minute als eigener Rekord.
