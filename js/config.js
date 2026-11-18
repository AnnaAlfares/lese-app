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
// sprechtext  nur für die Ersatzstimme (Web Speech API), falls eine Aufnahme fehlt.
//             null = mit der Ersatzstimme nicht sauber lautierbar (Gefahr des Buchstabennamens,
//             z. B. „Te“ statt /t/) – dann nie Ersatzstimme, nur Aufnahme.

const g = (id, anzeige, typ, anfang, beispiel, sprechtext) => ({ id, anzeige, typ, anfang, beispiel, sprechtext });

export const BUCHSTABEN = Object.freeze([
  g('o',   'O o',     'vokal',     false, 'wie in Oma',            'oh'),
  g('m',   'M m',     'dauerlaut', true,  'wie in Mama',           'mmmm'),
  g('e',   'E e',     'vokal',     false, 'wie in Esel',           'eh'),
  g('a',   'A a',     'vokal',     false, 'wie in Ameise',         'ah'),
  g('l',   'L l',     'dauerlaut', true,  'wie in Lama',           'llll'),
  g('s',   'S s',     'dauerlaut', true,  'wie in Sofa (summend)', 'ssss'),
  g('f',   'F f',     'dauerlaut', true,  'wie in Fisch',          'ffff'),
  g('n',   'N n',     'dauerlaut', true,  'wie in Nase',           'nnnn'),
  g('t',   'T t',     'plosiv',    true,  'wie in Tomate',         null),
  g('r',   'R r',     'dauerlaut', true,  'wie in Rose',           'rrrr'),
  g('i',   'I i',     'vokal',     false, 'wie in Insel',          'ih'),
  g('u',   'U u',     'vokal',     false, 'wie in Ufo',            'uh'),
  g('k',   'K k',     'plosiv',    true,  'wie in Kerze',          null),
  g('w',   'W w',     'dauerlaut', true,  'wie in Wolke',          'wwww'),
  g('p',   'P p',     'plosiv',    true,  'wie in Pinsel',         null),
  g('h',   'H h',     'dauerlaut', true,  'wie in Hut (gehaucht)', 'hhhh'),
  g('ei',  'Ei ei',   'vokal',     false, 'wie in Eis',            'ei'),
  g('d',   'D d',     'plosiv',    true,  'wie in Dose',           null),
  g('ch',  'Ch ch',   'dauerlaut', false, 'wie in ich',            'chchch'),
  g('au',  'Au au',   'vokal',     false, 'wie in Auto',           'au'),
  g('z',   'Z z',     'sonstig',   true,  'wie in Zelt (/ts/)',    null),
  g('g',   'G g',     'plosiv',    true,  'wie in Gabel',          null),
  g('sch', 'Sch sch', 'dauerlaut', true,  'wie in Schere',         'schschsch'),
  g('b',   'B b',     'plosiv',    true,  'wie in Banane',         null),
  g('ie',  'ie',      'vokal',     false, 'wie in Biene',          'ih'),
  g('ö',   'Ö ö',     'vokal',     false, 'wie in Öl',             'öh'),
  g('ü',   'Ü ü',     'vokal',     false, 'wie in Tüte',           'üh'),
  g('st',  'St st',   'sonstig',   true,  'wie in Stein (/scht/)', 'scht'),
  g('pf',  'Pf pf',   'sonstig',   true,  'wie in Pferd',          'pfff'),
  g('eu',  'Eu eu',   'vokal',     false, 'wie in Eule',           'eu'),
  g('ng',  'ng',      'dauerlaut', false, 'wie in Ring',           null),
  g('sp',  'Sp sp',   'sonstig',   true,  'wie in Spinne (/schp/)', null),
  g('j',   'J j',     'dauerlaut', true,  'wie in Jojo',           null),
  g('ä',   'Ä ä',     'vokal',     false, 'wie in Käse',           'äh'),
  g('qu',  'Qu qu',   'sonstig',   true,  'wie in Qualle (/kw/)',  null),
  g('x',   'X x',     'sonstig',   false, 'wie in Hexe (/ks/)',    null),
  g('v',   'V v',     'dauerlaut', true,  'wie in Vogel (/f/)',    null),
  g('c',   'C c',     'sonstig',   false, 'wie in Clown (/k/)',    null),
  g('y',   'Y y',     'sonstig',   false, 'wie in Pony (/i/)',     null),
  g('ß',   'ß',       'dauerlaut', false, 'wie in Fuß',            'ssss'),
  g('chs', 'chs',     'sonstig',   false, 'wie in Fuchs (/ks/)',   null),
]);

export const ANZAHL_BUCHSTABEN = BUCHSTABEN.length; // 41

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
// beiFehlender legt fest, was passiert, wenn eine Aufnahme (noch) fehlt:
//   'stimme'     – die Gerätestimme (Web Speech API) spricht ersatzweise, falls eine deutsche da ist
//   'ausblenden' – kein Ton; Lautsprecher-Knöpfe für diese Stelle werden ausgeblendet
// VORLÄUFIG 'stimme', damit die App beim Testen nicht stumm ist – Entscheidung steht noch aus.
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
// Beispiel: index.html?b=12&h=bfi&z=1&t=80
//   b  Buchstabenstand (1–41): so viele Grapheme der Reihenfolge sind eingeführt
//   h  Hilfen als Kürzel (siehe HILFEN), „0“ = keine Hilfen
//   z  Zeitmodus 1 = an, 0 = aus
//   t  Sprechtempo in Prozent (50–150)

export const HILFEN = Object.freeze([
  { id: 'boegen',   kuerzel: 'b', titel: 'Silbenbögen' },
  { id: 'farben',   kuerzel: 'f', titel: 'Silbenfarben (blau/rot)' },
  { id: 'koenig',   kuerzel: 'k', titel: 'Vokal als Silbenkönig' },
  { id: 'schieber', kuerzel: 's', titel: 'Leseschieber' },
  { id: 'bilder',   kuerzel: 'i', titel: 'Bilder' },
]);

export const STANDARD = Object.freeze({
  stand: 12,                                   // O bis U
  hilfen: ['boegen', 'farben', 'bilder'],
  zeitmodus: true,
  tempo: 80,
});

const begrenze = (zahl, min, max, ersatz) =>
  Number.isFinite(zahl) ? Math.min(max, Math.max(min, Math.round(zahl))) : ersatz;

/** Liest die Einstellungen aus der Adresse (oder einem übergebenen Query-String). */
export function leseEinstellungen(query = globalThis.location?.search ?? '') {
  const p = new URLSearchParams(query);
  const e = {
    stand: begrenze(parseInt(p.get('b'), 10), 1, ANZAHL_BUCHSTABEN, STANDARD.stand),
    zeitmodus: p.has('z') ? p.get('z') !== '0' : STANDARD.zeitmodus,
    tempo: begrenze(parseInt(p.get('t'), 10), 50, 150, STANDARD.tempo),
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
  return new URLSearchParams({ b: e.stand, h, z: e.zeitmodus ? 1 : 0, t: e.tempo }).toString();
}

/** Hängt die aktuellen Einstellungen an einen internen Link an, damit sie beim Weiterklicken erhalten bleiben. */
export function mitEinstellungen(href, e = leseEinstellungen()) {
  return `${href}?${einstellungenAlsParameter(e)}`;
}
