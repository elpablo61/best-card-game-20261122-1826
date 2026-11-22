// audio.js — all sounds are synthesized with WebAudio at run time, so the
// game ships no audio files and makes no network request.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, start, duration, type, volume) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume || 0.12, ac.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

export function playFlip() {
  tone(620, 0, 0.09, 'triangle', 0.1);
  tone(930, 0.05, 0.08, 'triangle', 0.08);
}

export function playSelect() {
  tone(440, 0, 0.07, 'sine', 0.09);
}

export function playWinRound() {
  tone(523, 0, 0.12, 'triangle', 0.12);
  tone(659, 0.09, 0.12, 'triangle', 0.12);
  tone(784, 0.18, 0.2, 'triangle', 0.12);
}

export function playLoseRound() {
  tone(392, 0, 0.14, 'sawtooth', 0.05);
  tone(311, 0.1, 0.2, 'sawtooth', 0.05);
}

export function playVictory() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.3, 'triangle', 0.13));
}

export function playDefeat() {
  [392, 349, 311, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'sine', 0.11));
}
