// Buchstabenreihenfolge (Zwergenheft) und Einstellungen.
// Einzige Stelle für die Reihenfolge; Mehrbuchstaben (Ei, Au, Sch, …) zählen als ein Graphem.
// Einstellungen kommen aus URL-Parametern, werden nicht gespeichert (kein localStorage, keine Cookies).

// ---------------------------------------------------------------------------
// Grapheme in der Reihenfolge des Zwergenhefts
// ---------------------------------------------------------------------------
// id          so steht das Graphem kleingeschrieben im Wort (Schlüssel für die Wortliste)
// anzeige     so zeigt die App das Graphem (Groß- und Kleinform, falls es beide gibt)
// typ         'vokal' | 'dauerlaut' (dehnbar, z. B. /mmm/) | 'plosiv' (nicht dehnbar) | 'sonstig'
// anfang      darf eine Silbe beginnen (für offene Silben wie „ma“, „lo“)
// beispiel    Hinweis für die Aufnahme: so klingt der Laut (nicht für die Kinder sichtbar)
// Einzellaute erklingen nur aus eigenen Aufnahmen (assets/audio/laute/), nie über die Gerätestimme.

const g = (id, anzeige, typ, anfang, beispiel) => ({ id, anzeige, typ, anfang, beispiel });

export const BUCHSTABEN = Object.freeze([
  g('o',   'O o',     'vokal',     false, 'wie in Oma'),
  g('m',   'M m',     'dauerlaut', true,  'wie in Mama'),
  g('e',   'E e',     'vokal',     false, 'wie in Esel'),
  g('a',   'A a',     'vokal',     false, 'wie in Ameise'),
  g('l',   'L l',     'dauerlaut', true,  'wie in Lama'),
  g('s',   'S s',     'dauerlaut', true,  'wie in Sofa (summend)'),
  g('f',   'F f',     'dauerlaut', true,  'wie in Fisch'),
  g('n',   'N n',     'dauerlaut', true,  'wie in Nase'),
  g('t',   'T t',     'plosiv',    true,  'wie in Tomate'),
  g('r',   'R r',     'dauerlaut', true,  'wie in Rose'),
  g('i',   'I i',     'vokal',     false, 'wie in Insel'),
  g('u',   'U u',     'vokal',     false, 'wie in Ufo'),
  g('k',   'K k',     'plosiv',    true,  'wie in Kerze'),
  g('w',   'W w',     'dauerlaut', true,  'wie in Wolke'),
  g('p',   'P p',     'plosiv',    true,  'wie in Pinsel'),
  g('h',   'H h',     'dauerlaut', true,  'wie in Hut (gehaucht)'),
  g('ei',  'Ei ei',   'vokal',     false, 'wie in Eis'),
  g('d',   'D d',     'plosiv',    true,  'wie in Dose'),
  g('ch',  'Ch ch',   'dauerlaut', false, 'wie in ich'),
  g('au',  'Au au',   'vokal',     false, 'wie in Auto'),
  g('z',   'Z z',     'sonstig',   true,  'wie in Zelt (/ts/)'),
  g('g',   'G g',     'plosiv',    true,  'wie in Gabel'),
  g('sch', 'Sch sch', 'dauerlaut', true,  'wie in Schere'),
  g('b',   'B b',     'plosiv',    true,  'wie in Banane'),
  g('ie',  'ie',      'vokal',     false, 'wie in Biene'),
  g('ö',   'Ö ö',     'vokal',     false, 'wie in Öl'),
  g('ü',   'Ü ü',     'vokal',     false, 'wie in Tüte'),
  g('st',  'St st',   'sonstig',   true,  'wie in Stein (/scht/)'),
  g('pf',  'Pf pf',   'sonstig',   true,  'wie in Pferd'),
  g('eu',  'Eu eu',   'vokal',     false, 'wie in Eule'),
  g('ng',  'ng',      'dauerlaut', false, 'wie in Ring'),
  g('sp',  'Sp sp',   'sonstig',   true,  'wie in Spinne (/schp/)'),
  g('j',   'J j',     'dauerlaut', true,  'wie in Jojo'),
  g('ä',   'Ä ä',     'vokal',     false, 'wie in Käse'),
  g('qu',  'Qu qu',   'sonstig',   true,  'wie in Qualle (/kw/)'),
  g('x',   'X x',     'sonstig',   false, 'wie in Hexe (/ks/)'),
  g('v',   'V v',     'dauerlaut', true,  'wie in Vogel (/f/)'),
  g('c',   'C c',     'sonstig',   false, 'wie in Clown (/k/)'),
  g('y',   'Y y',     'sonstig',   false, 'wie in Pony (/i/)'),
  g('ß',   'ß',       'dauerlaut', false, 'wie in Fuß'),
  g('chs', 'chs',     'sonstig',   false, 'wie in Fuchs (/ks/)'),
]);

export const ANZAHL_BUCHSTABEN = BUCHSTABEN.length; // 41

// Nicht-Basisgrapheme: Grapheme, die nicht die häufigste Schreibung ihres Lautes sind, sondern eine
// orthographische Besonderheit (Rechtschreibung, nicht alphabetische Lesephase). Silben und Wörter
// mit ihnen werden in woerter.js aussortiert. Quelle: NRW-Handreichung „Lesekompetenz gezielt fördern“,
// S. 70 (v, ß, ie, c als orthographische Besonderheiten) und S. 98 (Begriff Basisgraphem).
//   v  für /f/ (Basis: f) bzw. /w/ (Basis: w)     c  für /k/ (Basis: k)
//   y  für /ü/ bzw. /i/ (Basis: ü, i)              ß  für /s/ nach langem Vokal (Basis: s)
//   ie für langes /i/ – laut S. 98 statistisch eigentlich Basisgraphem, laut S. 70 Besonderheit.
//      Deshalb umschaltbar: Standard aussortiert; mit „Wörter mit ie erlauben“ (ie=1) ab Stand 25 erlaubt.
// Die Buchstaben selbst bleiben in der Reihenfolge und können als Buchstaben geübt werden.
export const NICHT_BASISGRAPHEME = Object.freeze(new Set(['v', 'c', 'y', 'ß', 'ie']));

// Qu steht im Deutschen nur vor bestimmten Vokalen (Qualle, Quelle, Quiz, Quote, quälen).
// „quu“, „queu“, „quau“ usw. gibt es nicht – solche Silben werden aussortiert.
export const VOKALE_NACH_QU = Object.freeze(new Set(['a', 'e', 'i', 'o', 'ä', 'ie'])); // ie: quieken

/** Graphem-Objekt zu einer id ('sch', 'o', …) oder undefined. */
export function graphem(id) {
  return BUCHSTABEN.find(b => b.id === id);
}

/** Position (1 … 41) eines Graphems in der Reihenfolge, Infinity wenn unbekannt. */
export function position(id) {
  const i = BUCHSTABEN.findIndex(b => b.id === id);
  return i < 0 ? Infinity : i + 1;
}

// ---------------------------------------------------------------------------
// Aufnahmen (assets/audio/)
// ---------------------------------------------------------------------------
// Alles wird als eigene Aufnahme abgespielt (Dateinamen siehe js/aufnahmen.js und docs/AUFNAHMEN.md).
//
// EINZELLAUTE (Konsonanten und Vokale) kommen IMMER nur aus Aufnahmen. Fehlt die Aufnahme, bleibt es
// still und der Lautsprecher-Knopf für diesen Laut ist ausgeblendet. Grund: Die Gerätestimme sagt bei
// Konsonanten den Buchstabennamen („es“ statt /sss/) – das widerspricht Regel 2 (immer lautieren).
//
// beiFehlender gilt nur für Silben, Wörter und Ansagen, wenn deren Aufnahme (noch) fehlt:
//   'stimme'     – die Gerätestimme (Web Speech API) spricht ersatzweise, falls eine deutsche da ist
//   'ausblenden' – kein Ton; Lautsprecher-Knöpfe für diese Stelle werden ausgeblendet
export const AUDIO = Object.freeze({
  format: 'mp3',
  beiFehlender: 'stimme',
});

/** Wie viel stärker Wörter/Silben mit dem zuletzt eingeführten Buchstaben gewichtet werden. */
export const GEWICHT_NEUER_BUCHSTABE = 3;

// ---------------------------------------------------------------------------
// Lernleiter: 5 Stufen (Module kommen in eigenen Threads dazu)
// ---------------------------------------------------------------------------
export const STUFEN = Object.freeze([
  { nr: 1, titel: 'Hören', farbe: '#fde7c8',
    module: ['Anlaut-Detektiv', 'Silben klatschen', 'Schneckensprache', 'Robotersprache', 'Quatschwort-Retter'] },
  { nr: 2, titel: 'Buchstabe und Laut', farbe: '#d9ecd0',
    module: ['Buchstabenbingo', 'Buchstaben verbinden', 'Lautedomino', 'Wo hörst du es?'] },
  { nr: 3, titel: 'Laute verbinden', farbe: '#d3e4f5',
    module: ['Rutschen', 'Leseapparat', 'Leseschieber', 'Monsternamen'] },
  { nr: 4, titel: 'Automatisieren', farbe: '#eadcf2',
    module: ['Silbenteppich', 'Blitzlesen', 'Wort-Fang', 'Wortpuzzle', 'Wörternetz', 'Schnipp-Schnapp'] },
  { nr: 5, titel: 'Verstehen', farbe: '#f6dada',
    module: ['Klammerbild', 'Lies und mach', 'Hören und Mitlesen'] },
]);

// ---------------------------------------------------------------------------
// Einstellungen der Lehrkraft – nur als URL-Parameter
// ---------------------------------------------------------------------------
// Beispiel: index.html?b=12&h=bfi&z=1&t=80&p=0&ie=0&tm=0&v=vor&s=andika
//   b  Buchstabenstand (1–41): so viele Grapheme der Reihenfolge sind eingeführt
//   h  Hilfen als Kürzel (siehe HILFEN), „0“ = keine Hilfen
//   z  Zeitmodus 1 = an, 0 = aus (Standard: aus – die Lehrkraft schaltet ihn ein)
//   t  Sprechtempo in Prozent (50–150)
//   p  Plosive (t, k, p …) im Leseapparat: 1 = ja, 0 = nein (Standard: nein, nur dehnbare Laute)
//   ie Wörter und Silben mit ie erlauben: 1 = ja, 0 = nein (Standard: nein; wirkt erst ab Stand 25)
//   tm Silbenteppich bei jedem Durchgang neu mischen: 1 = ja, 0 = nein (Standard: nein – „Noch einmal“
//      zeigt denselben Teppich, Rekord je Teppich; ja = auch „Noch einmal“ mischt neu, Rekord je Buchstabenstand)
//   v  Vorlesen beim Rutschen und im Leseapparat (Feld `vorlesen`):
//      'vor'  = die App spricht VOR dem eigenen Lesen vor (Vormachen) – Standard
//      'nach' = das Kind liest zuerst selbst, die App spricht DANACH zur Kontrolle
//      Die Module werten das Feld selbst aus (eigene Threads).
//   s  Schrift (Feld `schrift`, siehe SCHRIFTEN): 'andika' (Standard), 'grund', 'system'

export const HILFEN = Object.freeze([
  { id: 'boegen',   kuerzel: 'b', titel: 'Silbenbögen' },
  { id: 'farben',   kuerzel: 'f', titel: 'Silbenfarben (blau/rot)' },
  { id: 'koenig',   kuerzel: 'k', titel: 'Vokal als Silbenkönig' },
  { id: 'schieber', kuerzel: 's', titel: 'Leseschieber' },
  { id: 'bilder',   kuerzel: 'i', titel: 'Bilder' },
]);

// Schriften: alle lokal in assets/fonts/ (Lizenzdateien liegen daneben), eingebunden in css/app.css.
// id = Wert des URL-Parameters s und von <html data-schrift="…">.
export const SCHRIFTEN = Object.freeze([
  { id: 'andika', titel: 'Andika', hinweis: 'einstöckiges a, klare Formen (SIL, OFL)' },
  { id: 'grund',  titel: 'Grundschrift', hinweis: 'Playwrite Deutschland Grundschrift (TypeTogether, OFL)' },
  { id: 'system', titel: 'Systemschrift', hinweis: 'Schrift des Geräts, zweistöckiges a' },
]);

export const VORLESEN = Object.freeze(['vor', 'nach']);

export const STANDARD = Object.freeze({
  stand: 12,                                   // O bis U
  hilfen: ['boegen', 'farben', 'bilder'],
  zeitmodus: false,                            // Lehrkraft schaltet ein
  tempo: 80,
  plosive: false,                              // Leseapparat: nur dehnbare Laute
  ieErlaubt: false,                            // Silben/Wörter mit ie aussortiert
  teppichNeuMischen: false,                    // Silbenteppich: „Noch einmal“ = derselbe Teppich
  vorlesen: 'vor',                             // Rutschen/Leseapparat: erst vorsprechen, dann lesen
  schrift: 'andika',                           // freie Schrift mit einstöckigem a
});

const ausListe = (wert, liste, ersatz) => (liste.includes(wert) ? wert : ersatz);

const begrenze = (zahl, min, max, ersatz) =>
  Number.isFinite(zahl) ? Math.min(max, Math.max(min, Math.round(zahl))) : ersatz;

/** Liest die Einstellungen aus der Adresse (oder einem übergebenen Query-String). */
export function leseEinstellungen(query = globalThis.location?.search ?? '') {
  const p = new URLSearchParams(query);
  const e = {
    stand: begrenze(parseInt(p.get('b'), 10), 1, ANZAHL_BUCHSTABEN, STANDARD.stand),
    zeitmodus: p.has('z') ? p.get('z') !== '0' : STANDARD.zeitmodus,
    tempo: begrenze(parseInt(p.get('t'), 10), 50, 150, STANDARD.tempo),
    plosive: p.has('p') ? p.get('p') === '1' : STANDARD.plosive,
    ieErlaubt: p.has('ie') ? p.get('ie') === '1' : STANDARD.ieErlaubt,
    teppichNeuMischen: p.has('tm') ? p.get('tm') === '1' : STANDARD.teppichNeuMischen,
    vorlesen: ausListe(p.get('v'), VORLESEN, STANDARD.vorlesen),
    schrift: ausListe(p.get('s'), SCHRIFTEN.map(x => x.id), STANDARD.schrift),
    hilfen: {},
  };
  const h = p.get('h');
  for (const hilfe of HILFEN) {
    e.hilfen[hilfe.id] = h === null ? STANDARD.hilfen.includes(hilfe.id) : h.includes(hilfe.kuerzel);
  }
  return e;
}

/** Baut aus Einstellungen den Query-String (ohne „?“). */
export function einstellungenAlsParameter(e) {
  const h = HILFEN.filter(hilfe => e.hilfen[hilfe.id]).map(hilfe => hilfe.kuerzel).join('') || '0';
  return new URLSearchParams({ b: e.stand, h, z: e.zeitmodus ? 1 : 0, t: e.tempo, p: e.plosive ? 1 : 0,
    ie: e.ieErlaubt ? 1 : 0, tm: e.teppichNeuMischen ? 1 : 0, v: e.vorlesen, s: e.schrift })
    .toString();
}

/** Setzt die Schrift der Seite (<html data-schrift="…">, Regeln in css/app.css). */
export function wendeSchriftAn(schrift) {
  if (globalThis.document) document.documentElement.dataset.schrift = schrift;
}
// Jede Seite lädt config.js – so gilt die Schrift aus der Adresse überall (App, Lehrkraft, Testseiten).
wendeSchriftAn(leseEinstellungen().schrift);

/** Hängt die aktuellen Einstellungen an einen internen Link an, damit sie beim Weiterklicken erhalten bleiben. */
export function mitEinstellungen(href, e = leseEinstellungen()) {
  return `${href}?${einstellungenAlsParameter(e)}`;
}
