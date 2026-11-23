// Lehrkraft-Bereich: Einstellungen wählen und als Link weitergeben.
// Der Zustand steht nur in der Adresse dieser Seite (history.replaceState) – kein Speichern.

import { BUCHSTABEN, HILFEN, leseEinstellungen, einstellungenAlsParameter, position } from './config.js';
import { lesbareWoerter, lesbareSilben, sichtwoerter } from './woerter.js';
import { setzeTempo, sprichMitStimme, stimmeBereit } from './audio.js';

const e = leseEinstellungen();
const $ = id => document.getElementById(id);

// Buchstaben-Knöpfe
$('buchstaben').innerHTML = BUCHSTABEN
  .map((b, i) => `<button data-stand="${i + 1}" aria-label="Stand ${i + 1}: ${b.anzeige}">${b.anzeige}</button>`)
  .join('');
$('buchstaben').addEventListener('click', ev => {
  const knopf = ev.target.closest('[data-stand]');
  if (!knopf) return;
  e.stand = Number(knopf.dataset.stand);
  aktualisiere();
});

// Hilfen
$('hilfen').innerHTML = HILFEN.map(h => `<button data-hilfe="${h.id}">${h.titel}</button>`).join('');
$('hilfen').addEventListener('click', ev => {
  const knopf = ev.target.closest('[data-hilfe]');
  if (!knopf) return;
  e.hilfen[knopf.dataset.hilfe] = !e.hilfen[knopf.dataset.hilfe];
  aktualisiere();
});

// Zeitmodus
$('zeitmodus').addEventListener('click', () => { e.zeitmodus = !e.zeitmodus; aktualisiere(); });

// Plosive im Leseapparat
$('plosive').addEventListener('click', () => { e.plosive = !e.plosive; aktualisiere(); });

// Wörter mit ie
$('ie').addEventListener('click', () => { e.ieErlaubt = !e.ieErlaubt; aktualisiere(); });

// Silbenteppich: bei jedem Durchgang neu mischen
$('teppich-mischen').addEventListener('click', () => { e.teppichNeuMischen = !e.teppichNeuMischen; aktualisiere(); });

// Sprechtempo
$('tempo').value = e.tempo;
$('tempo').addEventListener('input', () => { e.tempo = Number($('tempo').value); aktualisiere(); });
$('tempo-probe').addEventListener('click', () => sprichMitStimme('Mama und Oma lesen.'));
stimmeBereit.then(da => {
  $('stimme-hinweis').textContent = da
    ? ''
    : 'Auf diesem Gerät gibt es keine deutsche Gerätestimme. Es erklingen nur eigene Aufnahmen.';
});

// Link kopieren
$('kopieren').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('link').value);
    $('kopiert').textContent = 'kopiert';
  } catch {
    $('link').select(); // Ersatz: Text markieren, dann von Hand kopieren
    $('kopiert').textContent = 'Link ist markiert – bitte kopieren';
  }
});

function aktualisiere() {
  const n = e.stand;
  for (const knopf of $('buchstaben').children) {
    const s = Number(knopf.dataset.stand);
    knopf.classList.toggle('eingefuehrt', s <= n);
    knopf.classList.toggle('neuester', s === n);
  }
  for (const knopf of $('hilfen').children) {
    knopf.setAttribute('aria-pressed', e.hilfen[knopf.dataset.hilfe]);
  }
  $('zeitmodus').setAttribute('aria-pressed', e.zeitmodus);
  $('plosive').setAttribute('aria-pressed', e.plosive);
  $('ie').setAttribute('aria-pressed', e.ieErlaubt);
  $('teppich-mischen').setAttribute('aria-pressed', e.teppichNeuMischen);
  const ieStand = position('ie');
  $('ie-hinweis').textContent = e.ieErlaubt && n < ieStand
    ? `wirkt erst ab Stand ${ieStand} (${BUCHSTABEN[ieStand - 1].anzeige})` : '';
  $('tempo-wert').textContent = `${e.tempo} %`;
  setzeTempo(e.tempo);

  // Vorschau: was ist mit diesem Stand lesbar?
  const optionen = { ieErlaubt: e.ieErlaubt };
  const woerter = lesbareWoerter(n, optionen);
  const silben = lesbareSilben(n, optionen);
  const neue = woerter.filter(w => w.neu).length;
  const sicht = sichtwoerter(n, optionen).filter(x => x.lesbar);
  const beispiele = woerter.slice(0, 14)
    .map(w => w.neu ? `<span class="neu">${w.wort}</span>` : w.wort).join(', ');
  $('vorschau').innerHTML = `Stand ${n} von ${BUCHSTABEN.length}, zuletzt <b>${BUCHSTABEN[n - 1].anzeige}</b>: `
    + `${woerter.length} Wörter (${neue} mit dem neuen Buchstaben), ${silben.length} Silben.`
    + (woerter.length ? `<br><span class="leise">${beispiele}${woerter.length > 14 ? ' …' : ''}</span>` : '')
    + (sicht.length ? `<br><span class="leise">Sichtwörter: ${sicht.map(x => x.ganzwort ? `${x.wort} (als Ganzwort)` : x.wort).join(', ')}</span>` : '');

  // Adresse dieser Seite und Link für die iPads
  const parameter = einstellungenAlsParameter(e);
  history.replaceState(null, '', `?${parameter}`);
  const link = new URL(`index.html?${parameter}`, location.href).href;
  $('link').value = link;
  $('oeffnen').href = link;
  $('kopiert').textContent = '';
}

aktualisiere();
