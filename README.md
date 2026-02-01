# Blast Off 2000

![Screenshot](screenshot.png)

Simple vibe-coded arcade game with WebGL rendering, CRT/VHS post-processing, and arcade-inspired audio.

## Features
- WebGL2 renderer with ship physics, thrust, rotation, and collision against terrain, rocks, landing pads, and chasing monsters.
- Fullscreen CRT/VHS post effects: scanlines, curvature, vignette, bloom, chromatic aberration, film grain, jitter, and color bleed.
- Directional Phong-like shading on monsters; rock material shader; animated water/ripple base shader.
- Touch and keyboard controls (thrust, rotate, fire, pause, reset). Responsive layout and splash/title overlays.
- Score with easing display, monster splits, particle explosions, exhaust particles, and enemy respawns.
- Audio: randomized BGM track on first thrust, explosion/fire/pop/thrust SFX.

## Running
```
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/

## Controls
- Rotate: A/D or Left/Right
- Thrust: W/Up
- Fire: Space (rapid)
- Pause: P
- Reset: R
- (Post FX always on)

## Assets & Licenses
- **Music**: All tunes generated using [Suno](https://suno.ai/) (`Zero-G Boss Rush*.mp3`, `Gravity Clash 1987*.mp3`, `intro.mp3`, `gameover.mp3`)
- **Sound Effects**: All SFX generated using [ElevenLabs Sound Effects](https://elevenlabs.io/) (`explosion.mp3`, `laser.mp3`, `pop.mp3`, `thrust.mp3`)
- **Images**: All pixel graphics generated using [OpenAI](https://openai.com/) image model (`blastoff.png`, `title.png`, `gameover.png`, `overlay*.png`)
- **Code**: Vibe-coded using a mix of [OpenAI Codex](https://openai.com/codex) and [Claude Code](https://claude.ai/code)

All code and shaders are part of this project (MIT-style unless otherwise specified by repository owner).
