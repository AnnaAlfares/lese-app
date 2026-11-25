// Digiboard-Tastatur: eine zentrale, kleine Tasten-Steuerung für alle Module.
// Die Lehrkraft bedient am Digiboard mit Funk-Tastatur oder Presenter, ohne zur Tafel zu gehen.
//
//   Leertaste  → tasten.weiter()      weiter / neu
//   Enter      → tasten.aufdecken()   aufdecken / bestätigen
//   1 … 9      → tasten.wahl(n)       Auswahl bzw. Silbe festhalten (meist 1–3)
//   Escape     → zurück (Zurück-Pfeil in der Kopfzeile, regelt app.js)
//
// Module melden sich über die Rückgabe von starte() an (siehe js/module/README.md):
//   return () => { … }                                   // alt: nur Aufräumen, keine Tasten
//   return { aufraeumen() { … }, tasten: { weiter() { … }, aufdecken() { … }, wahl(n) { … } } }
// Alle Teile sind freiwillig. Gibt eine Tasten-Funktion ausdrücklich false zurück, gilt die Taste
// als nicht behandelt: Der Browser macht dann sein Übliches (z. B. Enter drückt den fokussierten Knopf).

/**
 * Vereinheitlicht die Rückgabe von starte(): Funktion, Objekt oder nichts.
 * @returns {{ aufraeumen: Function|null, tasten: object|null }}
 */
export function modulRueckgabe(rueckgabe) {
  if (typeof rueckgabe === 'function') return { aufraeumen: rueckgabe, tasten: null };
  if (rueckgabe && typeof rueckgabe === 'object') {
    return {
      aufraeumen: typeof rueckgabe.aufraeumen === 'function' ? rueckgabe.aufraeumen.bind(rueckgabe) : null,
      tasten: rueckgabe.tasten && typeof rueckgabe.tasten === 'object' ? rueckgabe.tasten : null,
    };
  }
  return { aufraeumen: null, tasten: null };
}

/** Tippt das Kind gerade in ein Eingabefeld? Dann gehören die Tasten dem Feld. */
function inEingabefeld(ziel) {
  return ziel instanceof Element
    && (ziel.isContentEditable || ziel.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

/** Übersetzt eine Taste in [Name der Tasten-Funktion, Argument] oder null. */
function tasteZuAktion(ev) {
  if (ev.key === ' ' || ev.key === 'Spacebar') return ['weiter'];
  if (ev.key === 'Enter') return ['aufdecken'];
  if (ev.key === 'Escape' || ev.key === 'Esc') return ['zurueck'];
  if (/^[1-9]$/.test(ev.key)) return ['wahl', Number(ev.key)];
  return null;
}

/**
 * Meldet die Tastatur-Steuerung am Dokument an.
 * @param {() => object|null} holeTasten  liefert die Tasten des gerade angezeigten Moduls (oder null)
 * @param {{ zurueck?: () => boolean }} optionen  zurueck(): Escape-Verhalten, true = behandelt
 * @returns {() => void} abmelden
 */
export function starteTastatur(holeTasten, { zurueck } = {}) {
  const beiTaste = ev => {
    if (ev.defaultPrevented || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (inEingabefeld(ev.target)) return;
    const aktion = tasteZuAktion(ev);
    if (!aktion) return;
    const [name, argument] = aktion;
    // Gedrückt halten löst nicht dauernd aus (Kinder lehnen sich an die Tastatur)
    if (ev.repeat) { if (name !== 'zurueck') ev.preventDefault(); return; }

    let behandelt = false;
    if (name === 'zurueck') {
      behandelt = zurueck?.() === true;
    } else {
      const fn = holeTasten?.()?.[name];
      if (typeof fn === 'function') {
        try { behandelt = fn(argument) !== false; } catch (fehler) { console.error(fehler); behandelt = true; }
      }
    }
    // Nur behandelte Tasten abfangen: sonst z. B. Leertaste = Knopf drücken bzw. Seite scrollen wie gewohnt.
    // preventDefault beim keydown verhindert auch, dass der fokussierte Knopf zusätzlich „geklickt“ wird.
    if (behandelt) ev.preventDefault();
  };
  // Leertaste löst den Klick auf einen fokussierten Knopf erst beim Loslassen aus – auch das abfangen.
  let letzteBehandelt = false;
  const merke = ev => { letzteBehandelt = ev.defaultPrevented && (ev.key === ' ' || ev.key === 'Spacebar'); };
  const beiLoslassen = ev => {
    if (letzteBehandelt && (ev.key === ' ' || ev.key === 'Spacebar')) { ev.preventDefault(); letzteBehandelt = false; }
  };
  document.addEventListener('keydown', beiTaste);
  document.addEventListener('keydown', merke);        // nach beiTaste angemeldet → sieht dessen Ergebnis
  document.addEventListener('keyup', beiLoslassen);
  return () => {
    document.removeEventListener('keydown', beiTaste);
    document.removeEventListener('keydown', merke);
    document.removeEventListener('keyup', beiLoslassen);
  };
}
