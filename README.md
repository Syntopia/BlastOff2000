# Blast Off 2000

Web-based remake of the classic Gravity Force with WebGL rendering, CRT/VHS post-processing, and arcade-inspired audio.

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
- `audio/explosion.mp3`: Explosion sound (source: OrangeFreeSounds, free for personal/commercial use with attribution). 
- `audio/laser.mp3`: Laser shot (source: OrangeFreeSounds, free with attribution).
- `audio/pop.mp3`: Pop/explosion (source: SoundBible “Blop” / free SFX with attribution).
- `audio/thrust.wav`: Synthesized in-project (public domain for this project).
- Theme tracks (`Zero-G Boss Rush*.mp3`, `Gravity Clash 1987*.mp3`): Suno AI–generated for this project (user-provided / project-only use).

All other code and shaders are part of this project (MIT-style unless otherwise specified by repository owner).
