import { Game, getWorldSize } from './game.js';

const canvas = document.getElementById('playfield');
let statusEl = document.getElementById('status-text');
const scoreEl = document.getElementById('score');
const bgmEl = document.getElementById('bgm');
const explosionAudio = document.getElementById('explosion-audio');
const laserAudio = document.getElementById('laser-audio');
const popAudio = document.getElementById('pop-audio');
const thrustAudio = document.getElementById('thrust-audio');
bgmEl.volume = 1.0;
explosionAudio.volume = 0.85;
laserAudio.volume = 0.65;
popAudio.volume = 0.9;
thrustAudio.volume = 0.5;
const splashEl = document.getElementById('splash');
let audioStarted = false;
let bgmFading = false;
const tracks = [
  '/static/audio/Zero-G Boss Rush.mp3',
  '/static/audio/Zero-G Boss Rush (1).mp3',
  '/static/audio/Gravity Clash 1987.mp3',
  '/static/audio/Gravity Clash 1987 (1).mp3',
];
function pickTrack() {
  const idx = Math.floor(Math.random() * tracks.length);
  bgmEl.src = tracks[idx];
}

function playSound(el, volume = 1.0, rate = 1.0) {
  const a = el.cloneNode(true);
  a.volume = volume;
  a.playbackRate = rate;
  a.play().catch(() => {});
}

function fadeOutBgm(duration = 1200) {
  if (!audioStarted || bgmFading || bgmEl.paused) return;
  bgmFading = true;
  const startVol = bgmEl.volume;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    bgmEl.volume = startVol * (1 - t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      bgmEl.pause();
      bgmEl.currentTime = 0;
      bgmEl.volume = 0.8;
      audioStarted = false;
      bgmFading = false;
    }
  };
  requestAnimationFrame(step);
}

console.log('[Gravity] Initializing WebGL context');
const gl = canvas.getContext('webgl2');
if (!gl) {
  if (statusEl) statusEl.textContent = 'WebGL2 required';
  throw new Error('WebGL2 not supported. This build does not fallback by design.');
}

const hud = {
  state: () => {},
  particles: () => {},
  score: (v, pulsing = false) => {
    const formatted = v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    scoreEl.textContent = formatted;
    if (pulsing) {
      scoreEl.classList.remove('score-pulse');
      void scoreEl.offsetWidth; // reflow to restart animation
      scoreEl.classList.add('score-pulse');
    }
  },
};

if (!statusEl) {
  statusEl = document.createElement('div');
}
statusEl.textContent = 'Preparing level…';

try {
  pickTrack();
  const game = new Game(gl, hud, () => {
    if (!audioStarted) {
      pickTrack();
      bgmEl.currentTime = 0;
      bgmEl.play().catch(() => {});
      audioStarted = true;
    }
  }, () => {
    fadeOutBgm(1200);
    explosionAudio.currentTime = 0;
    explosionAudio.play().catch(() => {});
  }, () => {
    playSound(laserAudio, 0.9);
  }, () => {
    // use explosion sample sped up for a sharp pop
    playSound(explosionAudio, 0.3, 1.6);
  }, () => {
    playSound(thrustAudio, 0.5, 0.5); // one octave deeper on first thrust tick
  });
  statusEl.textContent = 'Running';
  game.start();
  const hideSplash = () => {
    splashEl.style.display = 'none';
    window.removeEventListener('keydown', hideSplash);
    window.removeEventListener('mousedown', hideSplash);
    window.removeEventListener('touchstart', hideSplash);
  };
  window.addEventListener('keydown', hideSplash);
  window.addEventListener('mousedown', hideSplash);
  window.addEventListener('touchstart', hideSplash, { passive: true });
} catch (err) {
  statusEl.textContent = 'Failed to start';
  console.error(err);
}
