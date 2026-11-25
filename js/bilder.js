// Bilder zu Wörtern – reine Daten, gemeinsam für alle Module (Blitzlesen, später Klammerbild, …).
// Module holen Bilder nur von hier, nie aus eigenen Listen.
//
// Drei Arten von Bildern:
//   datei  eigenes Bild (PNG oder SVG) aus assets/, z. B. die Bildercode-Bilder in assets/codebilder/
//   emoji  VORLÄUFIG ein Emoji der Gerät-Schrift (keine externe Datei, kein Dienst), bis es eigene
//          Bilder gibt. Ein Emoji, das das Gerät nicht kann (zeigt nur ein Kästchen), wird erkannt
//          und das Wort gilt dann als „ohne Bild“.
//   text   eine Zahl als Bild (elf → 11)
//
// Eigene Bilder ergänzen: PNG oder SVG nach assets/bilder/<wort>.png bzw. .svg legen (Dateiname wie bei den
// Aufnahmen: klein, ä→ae …) und hier { datei: 'bilder/<wort>.png' } eintragen.
// Regel: Jedes Bild gehört zu genau einem Wort (keine zwei Wörter mit demselben Bild),
// sonst wäre bei der Auswahl aus 3 Bildern mehr als eine Antwort richtig.

const BILDER = {
  // Bildercode-Bilder (CLAUDE.md, Regel 10) – eigene Bilder
  Lampe:  { datei: 'codebilder/01_lampe.png' },
  Maus:   { datei: 'codebilder/02_maus.png' },
  Jojo:   { datei: 'codebilder/04_jojo.png' },
  Wolke:  { datei: 'codebilder/05_wolke.png' },
  Banane: { datei: 'codebilder/06_banane.png' },
  Gabel:  { datei: 'codebilder/07_gabel.png' },
  Domino: { datei: 'codebilder/08_domino.png' },
  Auto:   { datei: 'codebilder/09_auto.png' },
  Eis:    { datei: 'codebilder/10_eis.png' },
  Pinsel: { datei: 'codebilder/13_pinsel.png' },
  Nase:   { datei: 'codebilder/15_nase.png' },
  Raupe:  { datei: 'codebilder/16_raupe.png' },

  // Eigene Bilder in assets/bilder/
  rot:    { datei: 'bilder/rot.svg' }, // roter Farbklecks – kein Kreis, damit er nicht wie ein Treffer-Punkt aussieht

  // Vorläufige Emoji-Bilder (nur eindeutig erkennbare)
  Mama:    { emoji: '👩‍👧' },
  Oma:     { emoji: '👵' },
  Lama:    { emoji: '🦙' },
  Esel:    { emoji: '🫏' },
  Sofa:    { emoji: '🛋️' },
  Mofa:    { emoji: '🛵' },
  elf:     { text: '11' },
  malen:   { emoji: '🎨' },
  lesen:   { emoji: '📖' },
  Melone:  { emoji: '🍉' },
  Ananas:  { emoji: '🍍' },
  Nest:    { emoji: '🪺' },
  Salat:   { emoji: '🥗' },
  Note:    { emoji: '🎵' },
  Mantel:  { emoji: '🧥' },
  Elefant: { emoji: '🐘' },
  Fest:    { emoji: '🎉' },
  Rose:    { emoji: '🌹' },
  Insel:   { emoji: '🏝️' },
  Film:    { emoji: '🎬' },
  Lift:    { emoji: '🛗' },
  Ufo:     { emoji: '🛸' },
  Hose:    { emoji: '👖' },
  Hase:    { emoji: '🐇' },
  Hut:     { emoji: '👒' },
  Post:    { emoji: '📮' },
  Dose:    { emoji: '🥫' },
  Hand:    { emoji: '✋' },
  Haus:    { emoji: '🏠' },
  Bein:    { emoji: '🦵' },
  Stein:   { emoji: '🪨' },
};

const ORDNER = new URL('../assets/', import.meta.url);

// Kann das Gerät ein Emoji farbig zeichnen? (Fehlt es, malt der Browser ein graues Kästchen.)
const emojiCache = new Map();
function emojiDa(zeichen) {
  if (emojiCache.has(zeichen)) return emojiCache.get(zeichen);
  let da = true;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 40;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = '32px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    x.textBaseline = 'top';
    x.fillStyle = '#000';
    x.fillText(zeichen, 2, 2);
    const d = x.getImageData(0, 0, 40, 40).data;
    da = false;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0 && (Math.abs(d[i] - d[i + 1]) > 24 || Math.abs(d[i + 1] - d[i + 2]) > 24)) { da = true; break; }
    }
  } catch { /* ohne Canvas: annehmen, dass es geht */ }
  emojiCache.set(zeichen, da);
  return da;
}

/**
 * Bild zu einem Wort oder null.
 * @returns {{art: 'datei', src: string} | {art: 'emoji', zeichen: string} | {art: 'text', text: string} | null}
 */
export function bild(wort) {
  const b = BILDER[wort];
  if (!b) return null;
  if (b.datei) return { art: 'datei', src: new URL(b.datei, ORDNER).href };
  if (b.emoji) return emojiDa(b.emoji) ? { art: 'emoji', zeichen: b.emoji } : null;
  if (b.text) return { art: 'text', text: b.text };
  return null;
}

/** Hat das Wort ein Bild, das dieses Gerät zeigen kann? */
export const hatBild = wort => bild(wort) !== null;

/** Alle Wörter mit Bild (auch solche, die noch nicht lesbar sind). */
export function woerterMitBild() {
  return Object.keys(BILDER).filter(hatBild);
}

/** HTML für ein Bild (alt-Text = Wort, damit Vorlese-Programme es nennen). */
export function bildHtml(wort, klasse = 'bild') {
  const b = bild(wort);
  if (!b) return '';
  if (b.art === 'datei') return `<img class="${klasse}" src="${b.src}" alt="${wort}" draggable="false">`;
  if (b.art === 'emoji') return `<span class="${klasse} bild-emoji" role="img" aria-label="${wort}">${b.zeichen}</span>`;
  return `<span class="${klasse} bild-text" role="img" aria-label="${wort}">${b.text}</span>`;
}
