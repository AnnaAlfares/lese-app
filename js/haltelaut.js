// Gehaltene Laute: Ein gedehnter Laut (/mmm/, /aaa/) klingt so lange, wie das Kind es will –
// z. B. solange der Finger auf der Rutsche ist. Dafür wird die eigene Aufnahme (assets/audio/laute/)
// mit der Web Audio API geladen und ihr ruhiger Mittelteil in einer Schleife wiederholt.
//
// Fehlt die Aufnahme, bleibt es still (Einzellaute kommen nie aus der Gerätestimme, siehe audio.js).
// Zwielaute (ei, au, eu) gleiten von einem Vokal zum anderen; eine Schleife im Mittelteil klänge
// wie „aiaiai“. Für sie gibt es halteLaut(id, { schleife: false }): einmal abspielen, nicht wiederholen.

import { datei } from './aufnahmen.js';
import { stoppe as stoppeAudio } from './audio.js';

const ORDNER = new URL('../assets/audio/', import.meta.url);
const KURZ = 0.25;      // Aufnahmen unter 0,25 s werden nicht geschleift (z. B. Plosive)
const EINBLENDEN = 0.02; // Sekunden
const AUSBLENDEN = 0.08;

let ctx = null;
/** AudioContext (einmal anlegen); im Fingertipp aufrufen, damit iPad-Safari den Ton freigibt. */
export function weckeAudio() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // iPad: Ton auch bei stummgeschaltetem Gerät wie bei <audio> (Safari 16.4+)
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Graphem-id → Promise<{puffer, von, bis} | null>; geladene Werte zusätzlich sofort greifbar
const ladend = new Map();
const geladen = new Map();

/** Lädt die Aufnahme eines Lautes vorab (null, wenn es keine gibt). */
export function ladeLaut(id) {
  if (!ladend.has(id)) {
    const c = weckeAudio();
    const p = !c ? Promise.resolve(null) : fetch(new URL(datei('laut', id), ORDNER))
      .then(r => (r.ok ? r.arrayBuffer() : null))
      .then(daten => daten && new Promise((ok, fehler) => c.decodeAudioData(daten, ok, fehler)))
      .then(puffer => (puffer ? mitSchleife(puffer) : null))
      .catch(() => null)
      .then(ergebnis => { geladen.set(id, ergebnis); return ergebnis; });
    ladend.set(id, p);
  }
  return ladend.get(id);
}

/** Schleifenpunkte im ruhigen Mittelteil (30 % bis 75 %), jeweils an einem Nulldurchgang. */
function mitSchleife(puffer) {
  if (puffer.duration < KURZ) return { puffer, von: 0, bis: 0 };
  const daten = puffer.getChannelData(0);
  const nulldurchgang = start => {
    for (let i = start; i < daten.length - 1; i++) if (daten[i] <= 0 && daten[i + 1] > 0) return i;
    return start;
  };
  const von = nulldurchgang(Math.floor(daten.length * 0.3));
  const bis = nulldurchgang(Math.floor(daten.length * 0.75));
  return { puffer, von: von / puffer.sampleRate, bis: bis / puffer.sampleRate };
}

/**
 * Lässt den Laut erklingen und hält ihn, bis stop() gerufen wird.
 * schleife: false → nur einmal abspielen (für Zwielaute).
 * @returns {{stop: () => void}}
 */
export function halteLaut(id, { schleife = true } = {}) {
  let gestoppt = false;
  let quelle = null, lautstaerke = null;

  const spiele = aufnahme => {
    if (gestoppt) return;
    const c = weckeAudio();
    if (!aufnahme || !c) return; // keine Aufnahme: still
    stoppeAudio(); // keine Überlagerung mit laufenden Ansagen/Silben
    quelle = c.createBufferSource();
    quelle.buffer = aufnahme.puffer;
    if (schleife && aufnahme.bis > aufnahme.von) {
      quelle.loop = true;
      quelle.loopStart = aufnahme.von;
      quelle.loopEnd = aufnahme.bis;
    }
    lautstaerke = c.createGain();
    lautstaerke.gain.setValueAtTime(0, c.currentTime);
    lautstaerke.gain.linearRampToValueAtTime(1, c.currentTime + EINBLENDEN);
    quelle.connect(lautstaerke).connect(c.destination);
    quelle.start();
  };

  if (geladen.has(id)) spiele(geladen.get(id));
  else ladeLaut(id).then(spiele);

  return {
    stop() {
      if (gestoppt) return;
      gestoppt = true;
      if (!quelle) return;
      const t = ctx.currentTime;
      lautstaerke.gain.cancelScheduledValues(t);
      lautstaerke.gain.setValueAtTime(lautstaerke.gain.value, t);
      lautstaerke.gain.linearRampToValueAtTime(0, t + AUSBLENDEN);
      quelle.stop(t + AUSBLENDEN + 0.02);
    },
  };
}
