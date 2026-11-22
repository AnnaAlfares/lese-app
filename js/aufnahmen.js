// Aufnahmen: feste Dateinamen und die Liste aller benötigten Aufnahmen.
// Einzige Stelle, die festlegt, wie eine Aufnahme heißt. audio.js spielt sie ab,
// test/aufnahmen.html zeigt, welche vorhanden sind und welche fehlen.
//
// Ordner und Dateinamen (alles klein, ä→ae, ö→oe, ü→ue, ß→sz, sonst nur a–z, 0–9 und „-“):
//   assets/audio/laute/<graphem>.mp3     laute/m.mp3, laute/sch.mp3, laute/ae.mp3
//   assets/audio/silben/<silbe>.mp3      silben/ma.mp3, silben/sen.mp3
//   assets/audio/woerter/<wort>.mp3      woerter/rose.mp3, woerter/lama.mp3
//   assets/audio/ansagen/<ansage-id>.mp3 ansagen/stufe-1.mp3, ansagen/zurueck.mp3

import { AUDIO, BUCHSTABEN, STUFEN, graphem } from './config.js';
import { lesbareSilben, lesbareWoerter, SICHTWOERTER } from './woerter.js';

export const ARTEN = Object.freeze({
  laut:   { ordner: 'laute',   titel: 'Laute' },
  silbe:  { ordner: 'silben',  titel: 'Silben' },
  wort:   { ordner: 'woerter', titel: 'Wörter' },
  ansage: { ordner: 'ansagen', titel: 'Ansagen' },
});

/** Text → Dateiname ohne Endung: klein, Umlaute umschreiben, nur a–z, 0–9 und „-“. */
export function dateiStamm(text) {
  return text.toLowerCase()
    .replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'sz')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Pfad relativ zu assets/audio/, z. B. datei('wort', 'Rose') → 'woerter/rose.mp3'. */
export function datei(art, wert) {
  return `${ARTEN[art].ordner}/${dateiStamm(wert)}.${AUDIO.format}`;
}

// ---------------------------------------------------------------------------
// Ansagen: alles, was die App sagt und kein Laut, keine Silbe, kein Lesewort ist.
// Module tragen hier ihre Ansagen ein (id → Sprechtext), nie im Modul selbst.
// ---------------------------------------------------------------------------
/** Lob-Ansagen (id → Text), wechseln sich ab (belohnung.js). Neue einfach hier ergänzen. */
const LOB = {
  'lob-toll': 'Toll gemacht!',
  'lob-gut': 'Das hast du gut gemacht!',
  'lob-super': 'Super!',
  'lob-prima': 'Prima!',
  'lob-klasse': 'Klasse!',
  'lob-weiter-so': 'Weiter so!',
  'lob-uebung': 'Übung macht den Meister!',
  'lob-besser': 'Du wirst immer besser!',
};
export const LOB_ANSAGEN = Object.freeze(Object.keys(LOB));

const ZAHLWOERTER = ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn'];
/** Namen der 16 Bildercode-Bilder (Reihenfolge = Zahl 1–16). Werden als Wörter (woerter/…) aufgenommen. */
export const CODEBILDER = Object.freeze(['Lampe', 'Maus', 'Sonne', 'Jojo', 'Wolke', 'Banane', 'Gabel', 'Domino', 'Auto',
  'Eis', 'Tafel', 'Kerze', 'Pinsel', 'Schere', 'Nase', 'Raupe']);

export const ANSAGEN = Object.freeze({
  // Startseite
  ...Object.fromEntries(STUFEN.map(s => [`stufe-${s.nr}`, s.titel])),
  zurueck: 'Zurück',
  // Modulnamen (für die Kacheln der Stufen)
  ...Object.fromEntries(STUFEN.flatMap(s => s.module).map(m => [`modul-${dateiStamm(m)}`, m])),
  // Bildercode (CLAUDE.md, Regel 10): Zahlen; die Bildnamen sind Wörter (siehe CODEBILDER)
  ...Object.fromEntries(ZAHLWOERTER.map((z, i) => [`zahl-${i + 1}`, z])),
  'schau-noch-einmal': 'Schau noch einmal auf deine Karte.',
  'code-eingeben': 'Tippe die Bilder von deiner Karte an.',
  'ich-bin-neu': 'Ich bin neu.',
  'dein-code': 'Das ist dein neuer Code.',
  // Blitzlesen
  'blitz-schau': 'Schau genau hin!',
  'blitz-bild': 'Welches Bild passt?',
  'blitz-wort': 'Welches Wort war das?',
  // Belohnung und allgemeine Rückmeldungen für alle Module (belohnung.js)
  ...LOB,
  'neuer-stern': 'Neuer Stern!',
  // Zusammenfassung am Rundenende (belohnung.js: fasseSterneZusammen); dazwischen zahl-2 … zahl-7
  'sterne-du-hast': 'Du hast in dieser Übung',
  'sterne-neue-bekommen': 'neue Sterne bekommen.',
  'sterne-einen-neuen': 'Du hast in dieser Übung einen neuen Stern bekommen.',
  'geschafft': 'Geschafft!',
  'neuer-rekord': 'Neuer Rekord!',
  'noch-einmal': 'Versuch es noch einmal.',
});

/** Ansage-id eines Modulnamens, z. B. 'Wo hörst du es?' → 'modul-wo-hoerst-du-es'. */
export const modulAnsage = name => `modul-${dateiStamm(name)}`;

// ---------------------------------------------------------------------------
// Liste aller benötigten Aufnahmen bis zu einem Buchstabenstand
// ---------------------------------------------------------------------------
/**
 * @returns {{art, wert, datei, sprechtext, hinweis, ab}[]}
 *   wert: Schlüssel, mit dem die App die Aufnahme anfragt (Graphem-id, Silbe, Wort, Ansage-id)
 *   sprechtext: was gesprochen wird; hinweis: wie; ab: ab welchem Buchstabenstand gebraucht
 */
export function aufnahmeliste(stand = BUCHSTABEN.length, optionen) {
  const liste = [];
  BUCHSTABEN.slice(0, stand).forEach((b, i) => liste.push({
    art: 'laut', wert: b.id, datei: datei('laut', b.id), ab: i + 1,
    sprechtext: `/${b.id}/ ${b.beispiel}`,
    hinweis: lautHinweis(b.id),
  }));
  for (const s of lesbareSilben(stand, optionen).sort((a, b) => a.ab - b.ab || a.text.localeCompare(b.text))) {
    liste.push({ art: 'silbe', wert: s.text, datei: datei('silbe', s.text), ab: s.ab,
      sprechtext: s.text, hinweis: 'normal, deutlich' });
  }
  const woerter = lesbareWoerter(stand, optionen).sort((a, b) => a.ab - b.ab || a.rang - b.rang);
  for (const w of woerter) {
    liste.push({ art: 'wort', wert: w.wort, datei: datei('wort', w.wort), ab: w.ab,
      sprechtext: w.wort, hinweis: 'normal, deutlich' });
  }
  const zusatz = [...SICHTWOERTER.map(w => [w, 'Sichtwort, normal']),
    ...CODEBILDER.map(w => [w, 'Bild im Bildercode, normal'])];
  for (const [w, hinweis] of zusatz) {
    if (!liste.some(e => e.art === 'wort' && e.datei === datei('wort', w))) {
      liste.push({ art: 'wort', wert: w, datei: datei('wort', w), ab: 1, sprechtext: w, hinweis });
    }
  }
  for (const [id, text] of Object.entries(ANSAGEN)) {
    liste.push({ art: 'ansage', wert: id, datei: datei('ansage', id), ab: 1,
      sprechtext: text, hinweis: 'freundlich, ruhig' });
  }
  return liste;
}

function lautHinweis(id) {
  const typ = graphem(id).typ;
  if (typ === 'vokal' || typ === 'dauerlaut') return 'gedehnt, ca. 1,5 s, gleichmäßig';
  return 'kurz, ohne „e“ danach (nicht „te“)';
}
