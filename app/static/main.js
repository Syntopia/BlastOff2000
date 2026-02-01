import { Game, getWorldSize } from './game.js';

const canvas = document.getElementById('playfield');
let statusEl = document.getElementById('status-text');
const bgmEl = document.getElementById('bgm');
const explosionAudio = document.getElementById('explosion-audio');
const laserAudio = document.getElementById('laser-audio');
const popAudio = document.getElementById('pop-audio');
const thrustAudio = document.getElementById('thrust-audio');
const gameoverAudio = document.getElementById('gameover-audio');
const introAudio = document.getElementById('intro-audio');
const splashEl = document.getElementById('splash');
const gameoverEl = document.getElementById('gameover');
const lifeOverlayEl = document.getElementById('life-overlay');
const titleOverlayEl = document.getElementById('title-overlay');

// Hide HTML overlays - using WebGL rendering instead
if (splashEl) splashEl.style.display = 'none';
if (gameoverEl) gameoverEl.style.display = 'none';
if (lifeOverlayEl) lifeOverlayEl.style.display = 'none';
if (titleOverlayEl) titleOverlayEl.style.display = 'none';
bgmEl.volume = 1.0;
explosionAudio.volume = 0.75;
laserAudio.volume = 0.65;
popAudio.volume = 0.6;
thrustAudio.volume = 0.5;
let audioStarted = false;
let bgmFading = false;
let gameOverArmed = false;
let waitingForRestart = false;
let inputLocked = true;
let introStarted = false;
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

// Explosion sound pool with limit and random pitch variation
const activeExplosions = [];
const MAX_EXPLOSIONS = 20;

function playExplosion(el, baseVolume = 0.3, baseRate = 1.6) {
  // Clean up finished sounds
  for (let i = activeExplosions.length - 1; i >= 0; i--) {
    if (activeExplosions[i].ended || activeExplosions[i].paused) {
      activeExplosions.splice(i, 1);
    }
  }
  // Limit simultaneous explosions
  if (activeExplosions.length >= MAX_EXPLOSIONS) return;

  const a = el.cloneNode(true);
  a.volume = baseVolume;
  // Random pitch variation: baseRate * (0.8 to 1.2)
  a.playbackRate = baseRate * (0.8 + Math.random() * 0.4);
  a.play().catch(() => {});
  activeExplosions.push(a);
}

function playIntro() {
  if (!introAudio) return;
  introAudio.loop = true;
  introAudio.currentTime = 0;
  introAudio.volume = 1.0;
  introAudio.play().then(() => { introStarted = true; }).catch(() => {});
}

function stopIntro() {
  if (!introAudio) return;
  introAudio.pause();
  introAudio.currentTime = 0;
}

// Life overlay functions now use game's WebGL overlay system
let gameRef = null;

function showLifeOverlay() {
  if (gameRef) gameRef.showLifeOverlay();
}

function hideLifeOverlay() {
  if (gameRef) gameRef.hideLifeOverlay();
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

// HUD now rendered via WebGL - these callbacks are no-ops
const hud = {
  state: () => {},
  particles: () => {},
  score: () => {},
  lives: () => {},
};

if (!statusEl) {
  statusEl = document.createElement('div');
}
statusEl.textContent = 'Preparing level…';
playIntro();
setTimeout(() => { if (!introStarted) playIntro(); }, 250);

try {
  pickTrack();
  let inputLocked = true;
  gameOverArmed = false;
  waitingForRestart = false;
  const game = new Game(
    gl,
    hud,
    () => {
      if (!audioStarted) {
        stopIntro();
        pickTrack();
        bgmEl.currentTime = 0;
        bgmEl.play().catch(() => {});
        audioStarted = true;
      }
      hideLifeOverlay();
    },
    () => {
      fadeOutBgm(1200);
      explosionAudio.currentTime = 0;
      explosionAudio.play().catch(() => {});
    },
    () => {
      playSound(laserAudio, 0.2);
    },
    () => {
      // use explosion sample sped up for a sharp pop with random pitch
      playExplosion(explosionAudio, 0.3, 1.6);
    },
    () => {
      playSound(thrustAudio, 0.75, 0.5); // one octave deeper on first thrust tick
    },
    () => {
      game.inputLocked = true;
      game.showOverlay('gameover');
      waitingForRestart = true;
      hideLifeOverlay();
      gameoverAudio.currentTime = 0;
      gameoverAudio.play().catch(() => {});
      setTimeout(() => { gameOverArmed = true; }, 2000);
    },
    (livesLeft) => {
      showLifeOverlay();
    },
  );
  statusEl.textContent = 'Running';
  game.inputLocked = true;
  gameRef = game; // Set reference for overlay functions
  game.start();
  // First interaction: start intro audio (browsers block autoplay until user gesture)
  // Second interaction: hide splash and start game
  // If autoplay worked (introStarted=true), skip straight to starting game
  let introUnlocked = introStarted;
  const handleInteraction = () => {
    if (!introUnlocked) {
      // First interaction - unlock and play intro audio
      playIntro();
      introUnlocked = true;
      // Don't hide splash yet - let intro play
      return;
    }
    // Second interaction (or first if autoplay worked) - hide splash and start game
    game.hideOverlay('splash');
    inputLocked = false;
    game.inputLocked = false;
    window.removeEventListener('keydown', handleInteraction);
    window.removeEventListener('mousedown', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
  };
  window.addEventListener('keydown', handleInteraction);
  window.addEventListener('mousedown', handleInteraction);
  window.addEventListener('touchstart', handleInteraction, { passive: true });

  const restartHandler = () => {
    if (waitingForRestart && gameOverArmed) {
      window.location.reload();
    }
  };
  window.addEventListener('keydown', restartHandler);
  window.addEventListener('mousedown', restartHandler);
  window.addEventListener('touchstart', restartHandler, { passive: true });
} catch (err) {
  statusEl.textContent = 'Failed to start';
  console.error(err);
}
