import { createProgram, createBuffer, ortho, resizeCanvasToDisplaySize } from './gl.js';

const VERTEX_SRC = `#version 300 es
precision highp float;
in vec2 a_position;
in vec3 a_color;
uniform mat4 u_mvp;
out vec3 v_color;
out vec2 v_pos;
void main() {
  v_color = a_color;
  v_pos = a_position;
  gl_Position = u_mvp * vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec3 v_color;
in vec2 v_pos;
uniform float u_time;
uniform float u_material; // 0 = default, 1 = rock
uniform vec2 u_monsterCenter;
uniform float u_monsterRadius;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 5; ++i) {
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = v_pos * 0.1; // scale out by 10x for slower spatial variation
  float wave = 0.08 * sin(0.35 * p.x + u_time * 1.2) + 0.08 * sin(0.45 * p.y - u_time * 0.9);
  float ripple = 0.05 * sin(0.6 * (p.x + p.y) + u_time * 1.8);
  float swirl = 0.03 * sin(0.7 * p.x - 0.5 * p.y + u_time * 0.7);
  vec3 color = v_color;
  if (u_material > 1.5) {
    // monster material (u_material == 2): phong-like shading
    vec2 d = (v_pos - u_monsterCenter) / u_monsterRadius;
    float r2 = clamp(dot(d, d), 0.0, 1.0);
    float z = sqrt(max(0.0, 1.0 - r2));
    vec3 normal = normalize(vec3(d, z));
    vec3 lightDir = normalize(vec3(cos(u_time * 0.6), sin(u_time * 0.45), 0.6));
    float diff = max(0.0, dot(normal, lightDir));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(0.0, dot(normal, halfDir)), 12.0);
    color = v_color * (0.35 + 0.65 * diff) + vec3(1.0, 0.9, 0.8) * spec * 0.7;
  } else if (u_material > 0.5) {
    // rock shader
    vec2 rp = v_pos * 0.6;
    float coarse = fbm(rp * 0.7 + u_time * 0.1);
    float fine = fbm(rp * 3.5 + u_time * 0.2);
    float crevice = smoothstep(0.45, 0.65, coarse) * 0.45;
    float highlight = smoothstep(0.6, 0.8, fine) * 0.25;
    color = mix(color * 0.9, color + vec3(0.08, 0.1, 0.12), highlight);
    color -= crevice * vec3(0.15, 0.18, 0.2);
  } else {
    // interior water-like flow
    color += vec3(wave + ripple + swirl) * 0.35;
  }
  outColor = vec4(color, 1.0);
}`;

const POST_VERTEX_SRC = `#version 300 es
precision highp float;
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const POST_FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 outColor;

// barrel distortion
vec2 barrel(vec2 uv, float strength) {
  vec2 cc = uv * 2.0 - 1.0;
  float r2 = dot(cc, cc);
  vec2 offset = cc * r2 * strength;
  return clamp((cc + offset) * 0.5 + 0.5, 0.0, 1.0);
}

float vignette(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  float len = dot(p, p)-0.5;
  return smoothstep(2.0, 0.1, len);
}

vec3 bloom(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  vec3 c = texture(u_scene, uv).rgb * 0.6;
  vec2 offsets[4] = vec2[4](vec2(texel.x, 0.0), vec2(-texel.x, 0.0), vec2(0.0, texel.y), vec2(0.0, -texel.y));
  for (int i = 0; i < 4; i++) {
    c += texture(u_scene, uv + offsets[i]).rgb * 0.1;
  }
  return c;
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  // line wobble and occasional VHS-style horizontal jitter
  float lineWobble = sin(u_time * 1.3 + uv.y * 160.0) * 0.001 *  sin(u_time * 2.0);
  float jitterEvent = step(0.995, fract(sin(u_time * 3.17) * 43758.5453));
  float jitter = jitterEvent * (0.01 * sin(u_time * 60.0));
  float scan = sin(uv.y * u_resolution.y * 0.5 * 3.14159) * 5.0;
  vec2 uvCurved = barrel(uv + vec2(lineWobble + jitter, 0.0), 0.03);

  // tiny chromatic aberration toward edges
  vec2 center = uvCurved - 0.5;
  float dist = length(center);
  vec2 ca = center * dist * 0.06;

  vec3 col;
  col.r = texture(u_scene, uvCurved + ca).r;
  col.g = texture(u_scene, uvCurved).g;
  col.b = texture(u_scene, uvCurved - ca).b;

  // bloom
  col = mix(col, bloom(uvCurved), 0.88);

  // color bleed (luma-weighted horizontal smear)
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float bleed = 0.04 * smoothstep(0.3, 1.0, luma);
  vec3 bleedCol = vec3(
    texture(u_scene, uvCurved + vec2(bleed, 0.0)).r,
    col.g,
    texture(u_scene, uvCurved - vec2(bleed, 0.0)).b
  );
  col = mix(col, bleedCol, 0.5);

  // scanlines
  col *= 1.0 - scan * 0.12;

  // vignette softened
  float vig = vignette(uvCurved);
  col *= mix(1.0, vig, 0.25) + 0.04;

  // film grain
  float g = (rand(uvCurved * u_resolution.xy - u_time * 2.3) - 0.5) * 0.25;
  col += g;

  outColor = vec4(col, 1.0);
}`;

const WORLD = { width: 320, height: 320 };
const WORLD_CENTER = { x: WORLD.width / 2, y: WORLD.height / 2 };
const CAVE_RADIUS = 140;
const VIEW_RADIUS = CAVE_RADIUS + 35; // camera radius to keep cave in view without stretching
const CAMERA_ZOOM_CRASH = 0.25;   // tighter zoom when exploding
const CAMERA_ZOOM_RECOVER = 0.5;  // default 2x zoom in (half the view)
const SHIP_RADIUS = 1.3;
const COLLISION_MARGIN = 0.6;
const GRAVITY = { x: 0, y: 0 }; // world gravity disabled
const ROCK_GRAVITY = 140; // strength of attraction toward static rocks
const ROT_SPEED = 4.2; // faster rotation
const THRUST = 102.0; // 3x stronger thrust

function buildCircularTerrain(segments = 64, radius = CAVE_RADIUS, jitter = 6) {
  const pts = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    const r = radius + jitter * Math.sin(i * 0.7);
    const x = WORLD_CENTER.x + Math.cos(t) * r;
    const y = WORLD_CENTER.y + Math.sin(t) * r;
    pts.push({ x, y });
  }
  return pts;
}

const TERRAIN_POINTS = buildCircularTerrain();

const LANDING_PADS = [
  {
    start: { x: WORLD_CENTER.x - 12, y: WORLD_CENTER.y - 40 },
    end: { x: WORLD_CENTER.x + 12, y: WORLD_CENTER.y - 40 },
    safeAngle: 0.5,
    safeSpeed: 10,
  },
];

// Spawn slightly above first pad so the ship begins over a flat, landable surface.
const SPAWN_POS = {
  x: (LANDING_PADS[0].start.x + LANDING_PADS[0].end.x) / 2,
  y: LANDING_PADS[0].start.y + SHIP_RADIUS + 1.2,
};

const ENEMY_SPEED = 6;
const ENEMY_RESPAWN_TIME = 8;
const ENEMY_SPAWNS = [
  { x: WORLD_CENTER.x - 100, y: WORLD_CENTER.y },
  { x: WORLD_CENTER.x + 100, y: WORLD_CENTER.y },
  { x: WORLD_CENTER.x, y: WORLD_CENTER.y + 100 },
  { x: WORLD_CENTER.x, y: WORLD_CENTER.y - 100 },
];

const BULLET_SPEED = 55;
const BULLET_RADIUS = 0.3;
const BULLET_LIFETIME = 3.0;
const FIRE_COOLDOWN = 0.12;
const EXPLOSION_DURATION = 3.0;
const EXPLOSION_PARTICLES = 80;
const ENEMY_POP_PARTICLES = 30;
const THRUST_PARTICLE_MAX = 200;
const SCORE_VALUES = { 4: 100000, 2: 10000, 1: 1000 };

const OBSTACLE_LINES = [
  [
    { x: WORLD_CENTER.x - 25, y: WORLD_CENTER.y + 10 },
    { x: WORLD_CENTER.x, y: WORLD_CENTER.y + 30 },
    { x: WORLD_CENTER.x + 25, y: WORLD_CENTER.y + 10 },
  ],
  [
    { x: WORLD_CENTER.x - 60, y: WORLD_CENTER.y - 10 },
    { x: WORLD_CENTER.x - 60, y: WORLD_CENTER.y + 40 },
  ],
  [
    { x: WORLD_CENTER.x + 70, y: WORLD_CENTER.y - 20 },
    { x: WORLD_CENTER.x + 90, y: WORLD_CENTER.y + 20 },
  ],
];

const ROCKS = [
  { x: WORLD_CENTER.x - 50, y: WORLD_CENTER.y + 60, r: 7 },
  { x: WORLD_CENTER.x + 40, y: WORLD_CENTER.y + 70, r: 6 },
  { x: WORLD_CENTER.x + 80, y: WORLD_CENTER.y - 50, r: 8 },
  { x: WORLD_CENTER.x - 70, y: WORLD_CENTER.y - 60, r: 6 },
  { x: WORLD_CENTER.x, y: WORLD_CENTER.y + 100, r: 9 },
];

class InputController {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.thrust = false;
    this.fire = false;
    this.pause = false;
    this.reset = false;
    this.togglePost = false;
    this._bindKeyboard();
    this._bindTouch(canvas);
  }

  consumeReset() {
    const r = this.reset;
    this.reset = false;
    return r;
  }

  consumePauseToggle() {
    const p = this.pause;
    this.pause = false;
    return p;
  }

  consumePostToggle() {
    const t = this.togglePost;
    this.togglePost = false;
    return t;
  }

  _bindKeyboard() {
    const onKey = (down, code) => {
      switch (code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.left = down; break;
        case 'ArrowRight':
        case 'KeyD':
          this.right = down; break;
        case 'ArrowUp':
        case 'KeyW':
          this.thrust = down; break;
        case 'Space':
          this.fire = down; break;
        case 'KeyF':
        case 'ControlLeft':
          this.fire = down; break;
        case 'KeyR':
          if (down) this.reset = true; break;
        case 'KeyP':
          if (down) this.pause = true; break;
        case 'Digit1':
          if (down) this.togglePost = true; break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', (e) => onKey(true, e.code));
    window.addEventListener('keyup', (e) => onKey(false, e.code));
  }

  _bindTouch(canvas) {
    let lastTap = 0;
    canvas.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const half = rect.width / 2;
      if (x < half) {
        this.left = true;
      } else {
        this.right = true;
      }
      const now = performance.now();
      if (now - lastTap < 280) {
        this.thrust = true;
        this.fire = true;
      }
      lastTap = now;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      this.left = false;
      this.right = false;
      this.thrust = false;
      this.fire = false;
      e.preventDefault();
    }, { passive: false });
  }
}

class Ship {
  constructor() {
    this.pos = { ...SPAWN_POS };
    this.vel = { x: 0, y: 0 };
    this.angle = 0;
    this.fuel = Infinity;
    this.lives = 3;
    this.state = 'ready';
    this.grounded = false;
    this.invuln = 3.0;
    this._respawnTimer = 0;
  }

  reset(hard = false) {
    this.pos = { ...SPAWN_POS };
    this.vel = { x: 0, y: 0 };
    this.angle = 0;
    this.fuel = Infinity;
    this.state = 'ready';
    this.grounded = false;
    this.invuln = 3.0;
    this._respawnTimer = 0;
  }

  applyInput(dt, input) {
    if (this.state !== 'playing' && this.state !== 'ready' && this.state !== 'grounded') return;
    if (input.left) this.angle += ROT_SPEED * dt;
    if (input.right) this.angle -= ROT_SPEED * dt;
    if (input.thrust) {
      // Thrust aligned with ship nose (rotation matches model matrix)
      const ax = -Math.sin(this.angle) * THRUST;
      const ay = Math.cos(this.angle) * THRUST;
      this.vel.x += ax * dt;
      this.vel.y += ay * dt;
      return true;
    }
    return false;
  }
}

class Level {
  constructor() {
    this.terrain = TERRAIN_POINTS;
    this.pads = LANDING_PADS;
    this.obstacles = OBSTACLE_LINES;
    this.rocks = ROCKS;
  }

  segments() {
    const segs = [];
    for (let i = 0; i < this.terrain.length - 1; i += 1) {
      const a = this.terrain[i];
      const b = this.terrain[i + 1];
      segs.push({ a, b });
    }
    return segs;
  }
}

class Enemy {
  constructor(pos, size = 4) {
    this.pos = { ...pos };
    this.size = size; // 4, 2, or 1
    this.radius = size;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = ENEMY_SPEED * (0.85 + Math.random() * 0.3);
    // base color per enemy
    const palette = [
      [1.0, 0.45, 0.55],
      [0.5, 0.8, 1.0],
      [0.7, 1.0, 0.6],
      [1.0, 0.8, 0.4],
    ];
    this.color = palette[Math.floor(Math.random() * palette.length)];
  }
}

function distancePointToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

class Renderer {
  constructor(gl) {
    this.gl = gl;
    this.program = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    this.mvpLoc = gl.getUniformLocation(this.program, 'u_mvp');
    this.timeLoc = gl.getUniformLocation(this.program, 'u_time');
    this.materialLoc = gl.getUniformLocation(this.program, 'u_material');
    this.monsterCenterLoc = gl.getUniformLocation(this.program, 'u_monsterCenter');
    this.monsterRadiusLoc = gl.getUniformLocation(this.program, 'u_monsterRadius');
    this.posLoc = gl.getAttribLocation(this.program, 'a_position');
    this.colorLoc = gl.getAttribLocation(this.program, 'a_color');
    this.buffer = createBuffer(gl, new Float32Array());
    this.vao = gl.createVertexArray();
    this.proj = ortho(-VIEW_RADIUS, VIEW_RADIUS, -VIEW_RADIUS, VIEW_RADIUS, -1, 1);

    // Post-process pipeline
    this.postProgram = createProgram(gl, POST_VERTEX_SRC, POST_FRAGMENT_SRC);
    this.postPosLoc = gl.getAttribLocation(this.postProgram, 'a_position');
    this.postSamplerLoc = gl.getUniformLocation(this.postProgram, 'u_scene');
    this.postResLoc = gl.getUniformLocation(this.postProgram, 'u_resolution');
    this.postTimeLoc = gl.getUniformLocation(this.postProgram, 'u_time');

    this.postVao = gl.createVertexArray();
    this.postBuffer = createBuffer(gl, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]));
    gl.bindVertexArray(this.postVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.postBuffer);
    gl.enableVertexAttribArray(this.postPosLoc);
    gl.vertexAttribPointer(this.postPosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this._createRenderTarget();
  }

  setSize(width, height, zoom = 1) {
    this.gl.viewport(0, 0, width, height);
    const aspect = width / height;
    let base = VIEW_RADIUS * zoom;
    let halfWidth = base;
    let halfHeight = base;
    if (aspect > 1) {
      halfWidth = base * aspect;
    } else {
      halfHeight = base / aspect;
    }
    this.proj = ortho(-halfWidth, halfWidth, -halfHeight, halfHeight, -1, 1);
    this._resizeRenderTarget(width, height);
  }

  draw(level, ship, thrusting, stateText, enemies, bullets, particles, timeSec) {
    const gl = this.gl;
    // Always render to framebuffer then post-process
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.program);
    gl.clearColor(0.12, 0.15, 0.22, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.posLoc);
    gl.enableVertexAttribArray(this.colorLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(this.colorLoc, 3, gl.FLOAT, false, 20, 8);

    const view = makeView(ship.pos, ship.angle);
    const mvp = multiplyMat4(this.proj, view);
    gl.uniformMatrix4fv(this.mvpLoc, false, mvp);
    gl.uniform1f(this.timeLoc, timeSec);
    gl.uniform1f(this.materialLoc, 0.0);

    this._drawCaveInterior(level.terrain);
    this._drawTerrain(level.terrain);
    this._drawPads(level.pads);
    gl.uniform1f(this.materialLoc, 1.0);
    this._drawRocks(level.rocks, timeSec);
    gl.uniform1f(this.materialLoc, 2.0);
    this._drawEnemies(enemies);
    gl.uniform1f(this.materialLoc, 0.0);
    this._drawBullets(bullets);
    this._drawParticles(particles);
    this._drawShip(ship, thrusting, stateText);

    // Pass 2: postprocess to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.postProgram);
    gl.bindVertexArray(this.postVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    gl.uniform1i(this.postSamplerLoc, 0);
    gl.uniform2f(this.postResLoc, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.postTimeLoc, timeSec);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(null);
  }

  _createRenderTarget() {
    const gl = this.gl;
    this.fbo = gl.createFramebuffer();
    this.colorTex = gl.createTexture();
    this._resizeRenderTarget(gl.canvas.width, gl.canvas.height);
  }

  _resizeRenderTarget(width, height) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _drawTerrain(points) {
    const color = [0.72, 0.84, 0.93];
    const data = new Float32Array(points.length * 5);
    points.forEach((p, i) => {
      const o = i * 5;
      data[o] = p.x;
      data[o + 1] = p.y;
      data[o + 2] = color[0];
      data[o + 3] = color[1];
      data[o + 4] = color[2];
    });
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STREAM_DRAW);
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, points.length);
  }

  _drawPads(pads) {
    const gl = this.gl;
    const padHeight = 0.6;
    pads.forEach((pad) => {
      const verts = [
        pad.start.x, pad.start.y, 0.18, 0.82, 0.67,
        pad.end.x, pad.end.y, 0.18, 0.82, 0.67,
        pad.end.x, pad.end.y + padHeight, 0.18, 0.82, 0.67,
        pad.start.x, pad.start.y + padHeight, 0.18, 0.82, 0.67,
      ];
      const data = new Float32Array(verts);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(gl.LINE_LOOP, 0, 4);
    });
  }

  _drawRocks(rocks, timeSec) {
    const gl = this.gl;
    const segments = 18;
    rocks.forEach((r) => {
      const verts = [];
      verts.push(r.x, r.y, 0.6, 0.72, 0.82);
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const range = r.r * 0.08;
        const pulsate = Math.sin(timeSec * 2.0 + r.x + r.y) * range;
        const x = r.x + Math.cos(a) * (r.r + pulsate);
        const y = r.y + Math.sin(a) * (r.r + pulsate);
        verts.push(x, y, 0.5, 0.64, 0.74);
      }
      const data = new Float32Array(verts);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
    });
  }

  _drawCaveInterior(terrain) {
    const gl = this.gl;
    const verts = [];
    const ceilingColor = [0.18, 0.24, 0.36];
    const interiorColor = [0.24, 0.30, 0.42];
    verts.push(WORLD_CENTER.x, WORLD_CENTER.y, ...interiorColor);
    terrain.forEach((p) => {
      verts.push(p.x, p.y, ...ceilingColor);
    });
    // close fan
    verts.push(terrain[0].x, terrain[0].y, ...ceilingColor);
    const data = new Float32Array(verts);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, verts.length / 5);
  }

  _drawShip(ship, thrusting, stateText) {
    const gl = this.gl;
    const bodyColor = stateText === 'crashed' ? [0.9, 0.24, 0.24] : [1.0, 0.96, 0.68];
    const shape = [
      { x: 0, y: 2.1 },     // nose
      { x: -1.2, y: -1.4 }, // left fin
      { x: 1.2, y: -1.4 },  // right fin
    ];
    const verts = [];
    shape.forEach((p) => {
      const rotated = rotate(p, ship.angle);
      verts.push(ship.pos.x + rotated.x, ship.pos.y + rotated.y, ...bodyColor);
    });
    const data = new Float32Array(verts);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Outline for better visibility
    const outline = [];
    shape.forEach((p) => {
      const r = rotate(p, ship.angle);
      outline.push(ship.pos.x + r.x, ship.pos.y + r.y, 0.08, 0.9, 1.0);
    });
    const outlineData = new Float32Array(outline);
    gl.bufferData(gl.ARRAY_BUFFER, outlineData, gl.STREAM_DRAW);
    gl.drawArrays(gl.LINE_LOOP, 0, 3);

    if (thrusting) {
      const flame = [
        { x: -0.6, y: -1.6 },
        { x: 0.6, y: -1.6 },
        { x: 0, y: -2.8 },
      ];
      const fVerts = [];
      flame.forEach((p) => {
        const r = rotate(p, ship.angle);
        fVerts.push(ship.pos.x + r.x, ship.pos.y + r.y, 1.0, 0.75, 0.4);
      });
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fVerts), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // origin marker to help visibility
    const markerSize = 0.3;
    const markerVerts = new Float32Array([
      ship.pos.x - markerSize, ship.pos.y, 0.9, 1.0, 0.4,
      ship.pos.x + markerSize, ship.pos.y, 0.9, 1.0, 0.4,
      ship.pos.x, ship.pos.y - markerSize, 0.9, 1.0, 0.4,
      ship.pos.x, ship.pos.y + markerSize, 0.9, 1.0, 0.4,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, markerVerts, gl.STREAM_DRAW);
    gl.drawArrays(gl.LINES, 0, 4);

    if (ship.invuln > 0) {
      const segments = 32;
      const ringVerts = [];
      const radius = SHIP_RADIUS + 0.6;
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const x = ship.pos.x + Math.cos(a) * radius;
        const y = ship.pos.y + Math.sin(a) * radius;
        ringVerts.push(x, y, 0.4, 0.9, 1.0);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringVerts), gl.STREAM_DRAW);
      gl.drawArrays(gl.LINE_STRIP, 0, segments + 1);
    }
  }

  _drawEnemies(enemies) {
    const gl = this.gl;
    const segments = 24;
    enemies.forEach((e) => {
      gl.uniform2f(this.monsterCenterLoc, e.pos.x, e.pos.y);
      gl.uniform1f(this.monsterRadiusLoc, e.radius);
      const verts = [];
      // center vertex
      const pulse = 0.8 + Math.sin(e.phase * 2.2) * 0.25;
      verts.push(e.pos.x, e.pos.y, e.color[0] * pulse, e.color[1] * pulse, e.color[2] * pulse);
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const warp = 0.28 * Math.sin(e.phase * 1.6 + a * 3.0);
        const radius = e.radius * (1 + warp * 0.35);
        const x = e.pos.x + Math.cos(a) * radius;
        const y = e.pos.y + Math.sin(a) * radius;
        verts.push(
          x,
          y,
          e.color[0] * (1.0 + warp * 0.3),
          e.color[1] * (0.8 + warp * 0.4),
          e.color[2] * (0.9 + warp * 0.3)
        );
      }
      const data = new Float32Array(verts);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
    });
  }

  _drawBullets(bullets) {
    const gl = this.gl;
    bullets.forEach((b) => {
      const verts = [];
      const segments = 8;
      verts.push(b.pos.x, b.pos.y, 1.0, 0.9, 0.3);
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const x = b.pos.x + Math.cos(a) * BULLET_RADIUS;
        const y = b.pos.y + Math.sin(a) * BULLET_RADIUS;
        verts.push(x, y, 1.0, 0.75, 0.2);
      }
      const data = new Float32Array(verts);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
    });
  }

  _drawParticles(particles) {
    const gl = this.gl;
    particles.forEach((p) => {
      const segments = 6;
      const verts = [];
      const c = p.color;
      verts.push(p.pos.x, p.pos.y, c[0], c[1], c[2]);
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const x = p.pos.x + Math.cos(a) * p.size;
        const y = p.pos.y + Math.sin(a) * p.size;
        verts.push(x, y, c[0], c[1], c[2]);
      }
      const data = new Float32Array(verts);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
    });
  }
}

function rotate(point, angle) {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  return { x: point.x * c - point.y * s, y: point.x * s + point.y * c };
}

function makeView(shipPos, shipAngle) {
  const t1 = translationMatrix(-shipPos.x, -shipPos.y, 0);
  const r = rotationZMatrix(-shipAngle);
  return multiplyMat4(r, t1);
}

function translationMatrix(tx, ty, tz) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1,
  ]);
}

function rotationZMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, s, 0, 0,
   -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function multiplyMat4(a, b) {
  const out = new Float32Array(16);
  // Column-major multiplication: out = a * b
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

export class Game {
  constructor(gl, hudCallbacks, onThrustStart = () => {}, onDie = () => {}, onFire = () => {}, onEnemyPop = () => {}, onThrust = () => {}, onGameOver = () => {}) {
    this.gl = gl;
    this.renderer = new Renderer(gl);
    this.level = new Level();
    this.ship = new Ship();
    this.enemies = ENEMY_SPAWNS.map((p) => new Enemy(p, 4));
    this.pendingRespawns = [];
    this.bullets = [];
    this.particles = [];
    this.thrustParticles = [];
    this.score = 0;
    this.displayScore = 0;
    this.input = new InputController(gl.canvas);
    this.lastTime = 0;
    this.paused = false;
    this.hud = hudCallbacks;
    this.onThrustStart = onThrustStart;
    this.onDie = onDie;
    this.onFire = onFire;
    this.onEnemyPop = onEnemyPop;
    this.onThrust = onThrust;
    this.onGameOver = onGameOver;
    this._wasThrusting = false;
    this.postEnabled = true;
    this.inputLocked = false;
    this._status = 'initializing';
    this._explosionTimer = 0;
    this.cameraZoom = CAMERA_ZOOM_RECOVER;
    this._cameraZoomTarget = CAMERA_ZOOM_RECOVER;
    this._fireCooldown = 0;
    this._log('Game created');
  }

  start() {
    this.ship.state = 'playing';
    this._status = 'running';
    window.requestAnimationFrame((t) => this._loop(t));
  }

  _loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05) || 0;
    this.lastTime = time;

    if (this.input.consumeReset()) {
      this._resetShip(true);
    }
    if (this.input.consumePauseToggle()) {
      this.paused = !this.paused;
      this._status = this.paused ? 'paused' : 'running';
      this._log(`Paused toggled -> ${this.paused}`);
    }
    // post toggle disabled per rollback

    if (!this.paused) {
      const thrusting = this._update(dt);
      this._render(thrusting);
    } else {
      this._render(false);
    }

    window.requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    if (this.inputLocked) {
      this._updateHud(false);
      return false;
    }

    const thrusting = this.ship.applyInput(dt, this.input);
    if (this.ship.state === 'ready') this.ship.state = 'playing';

    if (thrusting && this.ship.state === 'playing') {
      const dir = { x: -Math.sin(this.ship.angle), y: Math.cos(this.ship.angle) };
      this._spawnThrustParticles(dir, false);
      if (!this._wasThrusting) {
        this.onThrustStart();
        this.onThrust();
      }
    }
    this._wasThrusting = thrusting;

    // Smooth camera zoom
    const speed = Math.hypot(this.ship.vel.x, this.ship.vel.y);
    const speedZoom = Math.max(0.30, CAMERA_ZOOM_RECOVER - Math.min(speed / 120, 0.18));
    const targetZoom = Math.min(this._cameraZoomTarget, speedZoom);
    const zoomLerp = Math.min(1, dt * 3);
    this.cameraZoom += (targetZoom - this.cameraZoom) * zoomLerp;

    if (this.ship.state === 'crashed') {
      this._explosionTimer -= dt;
      this._updateParticles(dt);
      if (this._explosionTimer <= 0) {
        if (this.ship.lives > 0) {
          this._resetShip(true);
          this._cameraZoomTarget = CAMERA_ZOOM_RECOVER;
        }
      }
      this._updateHud(false);
      return thrusting;
    }

    if (this.ship.invuln > 0) this.ship.invuln = Math.max(0, this.ship.invuln - dt);

    if (this.ship.grounded) {
      if (thrusting) {
        this.ship.grounded = false;
        this.ship.state = 'playing';
        // small impulse so it lifts immediately
        this.ship.vel.y = Math.max(this.ship.vel.y, 2);
      } else {
        this.ship.vel = { x: 0, y: 0 };
      }
    }

    if (!this.ship.grounded) {
      this.ship.vel.x += GRAVITY.x * dt;
      this.ship.vel.y += GRAVITY.y * dt;
      this._applyRockGravity(dt);
      this.ship.pos.x += this.ship.vel.x * dt;
      this.ship.pos.y += this.ship.vel.y * dt;
    }

    this._fireCooldown = Math.max(0, this._fireCooldown - dt);
    if (this.input.fire && this.ship.state === 'playing') {
      this._tryFire();
    }

    this._updateEnemies(dt);
    this._updateBullets(dt);
    this._updateParticles(dt);
    this._updateThrustParticles(dt);
    this._updateRespawns(dt);
    this._checkBounds();
    this._checkCollision();
    this._checkEnemyCollision();
    this._checkBulletHits();

    this._updateHud(thrusting);
    return thrusting;
  }

  _checkBounds() {
    const dx = this.ship.pos.x - WORLD_CENTER.x;
    const dy = this.ship.pos.y - WORLD_CENTER.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAVE_RADIUS + SHIP_RADIUS) {
      this._crash('Outside cave');
    }
  }

  _checkCollision() {
    const ship = this.ship;
    if (ship.state !== 'playing') return;

    // Landing pads first
    for (const pad of this.level.pads) {
      const dist = distancePointToSegment(ship.pos, pad.start, pad.end);
      if (dist < SHIP_RADIUS * COLLISION_MARGIN && ship.vel.y <= 0) {
        const speed = Math.hypot(ship.vel.x, ship.vel.y);
        const upright = Math.abs(ship.angle) < pad.safeAngle;
        if (speed <= pad.safeSpeed && upright && ship.vel.y <= 0) {
          this._land(pad);
        } else {
          this._crash('Hard landing');
        }
        return;
      }
    }

    // Terrain collisions
    for (const seg of this.level.segments()) {
      const dist = distancePointToSegment(ship.pos, seg.a, seg.b);
      if (dist < SHIP_RADIUS * COLLISION_MARGIN) {
        this._crash('Terrain hit');
        return;
      }
    }

    for (const rock of this.level.rocks) {
      const dist = Math.hypot(ship.pos.x - rock.x, ship.pos.y - rock.y);
      if (dist < SHIP_RADIUS * COLLISION_MARGIN + rock.r) {
        this._crash('Rock impact');
        return;
      }
    }
  }

  _checkEnemyCollision() {
    if (this.ship.state !== 'playing' || this.ship.invuln > 0) return;
    for (const e of this.enemies) {
      const dist = Math.hypot(e.pos.x - this.ship.pos.x, e.pos.y - this.ship.pos.y);
      if (dist < e.radius + SHIP_RADIUS * COLLISION_MARGIN) {
        this._crash('Caught by monster');
        return;
      }
    }
  }

  _checkBulletHits() {
    const remainingEnemies = [];
    this.enemies.forEach((e) => {
      let hit = false;
      for (const b of this.bullets) {
        const dist = Math.hypot(e.pos.x - b.pos.x, e.pos.y - b.pos.y);
        if (dist < e.radius + BULLET_RADIUS * 1.2) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        remainingEnemies.push(e);
      } else {
        const split = this._splitEnemy(e);
        this._spawnEnemyExplosion(e);
        const baseScore = SCORE_VALUES[e.size] || 0;
        if (split.length) {
          remainingEnemies.push(...split);
          // award score for the enemy destroyed into fragments with a small random bonus
          this._addScore(baseScore + this._scoreJitter());
        } else {
          this._scheduleEnemyRespawn();
          this._addScore(baseScore + this._scoreJitter());
        }
        this.onEnemyPop();
      }
    });
    this.enemies = remainingEnemies;
  }

  _land(pad) {
    this.ship.state = 'grounded';
    this.ship.grounded = true;
    this.ship.vel = { x: 0, y: 0 };
    this.ship.angle = 0;
    this.ship.fuel = Infinity;
    // Snap onto pad surface
    const clampX = Math.min(Math.max(this.ship.pos.x, pad.start.x + SHIP_RADIUS), pad.end.x - SHIP_RADIUS);
    this.ship.pos.x = clampX;
    this.ship.pos.y = pad.start.y + SHIP_RADIUS;
    this._status = 'grounded';
    this._log(`Landed on pad (${pad.start.x.toFixed(0)}-${pad.end.x.toFixed(0)})`);
  }

  _crash(reason) {
    if (this.ship.state === 'crashed') return;
    this.ship.state = 'crashed';
    this.ship.lives -= 1;
    this._status = `crashed: ${reason}`;
    this._log(`Crash: ${reason}`);
    this.ship.vel = { x: 0, y: 0 };
    this._spawnExplosion();
    this._cameraZoomTarget = CAMERA_ZOOM_CRASH;
    this._explosionTimer = EXPLOSION_DURATION;
    this.onDie();
    if (this.ship.lives <= 0) {
      this.onGameOver();
      return;
    }
  }

  _resetShip(hard) {
    if (this.ship.lives <= 0) return;
    this.ship.reset(hard);
    this._status = 'running';
  }

  _render(thrusting) {
    resizeCanvasToDisplaySize(this.gl.canvas);
    this.renderer.setSize(this.gl.canvas.width, this.gl.canvas.height, this.cameraZoom);
    this.renderer.draw(
      this.level,
      this.ship,
      thrusting,
      this.ship.state,
      this.enemies,
      this.bullets,
      [...this.particles, ...this.thrustParticles],
      performance.now() / 1000,
    );
  }

  _updateHud(thrusting) {
    if (!this.hud) return;
    // ease display score toward actual score
    const diff = this.score - this.displayScore;
    if (Math.abs(diff) > 1) {
      this.displayScore += diff * 0.12;
    } else {
      this.displayScore = this.score;
    }
    const pulsing = diff > 5;
    this.hud.score(Math.floor(this.displayScore), pulsing);
    const label = this.paused ? 'paused' : `${this.ship.state}${this._status ? ' - ' + this._status : ''}`;
    this.hud.state(label, thrusting);
    this.hud.particles(this.particles.length + this.thrustParticles.length);
    this.hud.lives(this.ship.lives);
  }

  _log(msg) {
    console.log(`[Gravity] ${msg}`);
  }

  _updateEnemies(dt) {
    const ship = this.ship;
    this.enemies.forEach((e) => {
      const dx = ship.pos.x - e.pos.x;
      const dy = ship.pos.y - e.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const wobble = Math.sin(e.phase) * 1.2 * (1 + (4 - e.size) * 0.3);
      const speed = e.speed;
      const vx = ux * speed + (-uy) * wobble;
      const vy = uy * speed + (ux) * wobble;
      e.pos.x += vx * dt;
      e.pos.y += vy * dt;
      // Keep within world bounds
      const r = e.radius;
      e.pos.x = Math.min(Math.max(e.pos.x, r), WORLD.width - r);
      e.pos.y = Math.min(Math.max(e.pos.y, r), WORLD.height - r);
      e.phase += dt * (2.4 + Math.random() * 1.0);
    });
  }

  _updateBullets(dt) {
    const alive = [];
    this.bullets.forEach((b) => {
      b.life -= dt;
      b.pos.x += b.dir.x * BULLET_SPEED * dt;
      b.pos.y += b.dir.y * BULLET_SPEED * dt;
      if (b.life > 0 && b.pos.x >= 0 && b.pos.x <= WORLD.width && b.pos.y >= 0 && b.pos.y <= WORLD.height) {
        alive.push(b);
      }
    });
    this.bullets = alive;
  }

  _tryFire() {
    if (this._fireCooldown > 0) return;
    this._fireCooldown = FIRE_COOLDOWN;
    const dir = { x: -Math.sin(this.ship.angle), y: Math.cos(this.ship.angle) };
    const start = {
      x: this.ship.pos.x + dir.x * (SHIP_RADIUS + 0.4),
      y: this.ship.pos.y + dir.y * (SHIP_RADIUS + 0.4),
    };
    this.bullets.push({ pos: start, dir, life: BULLET_LIFETIME });
    this.onFire();
  }

  _scheduleEnemyRespawn() {
    const spawn = ENEMY_SPAWNS[Math.floor(Math.random() * ENEMY_SPAWNS.length)];
    this.pendingRespawns.push({ pos: spawn, timer: ENEMY_RESPAWN_TIME });
  }

  _updateRespawns(dt) {
    const survivors = [];
    this.pendingRespawns.forEach((r) => {
      r.timer -= dt;
      if (r.timer <= 0) {
        this.enemies.push(new Enemy(r.pos, 4));
      } else {
        survivors.push(r);
      }
    });
    this.pendingRespawns = survivors;
  }

  _splitEnemy(enemy) {
    if (enemy.size <= 1) return [];
    const newSize = enemy.size === 4 ? 2 : 1;
    const radius = enemy.radius;
    const offsetDist = radius * 0.8;
    const angle = Math.random() * Math.PI * 2;
    const o1 = { x: Math.cos(angle) * offsetDist, y: Math.sin(angle) * offsetDist };
    const o2 = { x: -o1.x, y: -o1.y };
    return [
      new Enemy({ x: enemy.pos.x + o1.x, y: enemy.pos.y + o1.y }, newSize),
      new Enemy({ x: enemy.pos.x + o2.x, y: enemy.pos.y + o2.y }, newSize),
    ];
  }

  _spawnExplosion() {
    this.particles = this._makeExplosion(this.ship.pos, EXPLOSION_PARTICLES, EXPLOSION_DURATION, [1.0, 0.6, 0.2]);
  }

  _updateParticles(dt) {
    const alive = [];
    this.particles.forEach((p) => {
      p.life -= dt;
      if (p.life <= 0) return;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      // keep moving; only shrink slightly
      p.size *= 0.993;
      alive.push(p);
    });
    this.particles = alive;
  }

  _updateThrustParticles(dt) {
    const alive = [];
    this.thrustParticles.forEach((p) => {
      p.life -= dt;
      if (p.life <= 0) return;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.vel.x *= 0.95;
      p.vel.y *= 0.95;
      p.size *= 0.98;
      alive.push(p);
    });
    this.thrustParticles = alive;
  }

  _spawnEnemyExplosion(enemy) {
    const dirX = enemy.pos.x - this.ship.pos.x;
    const dirY = enemy.pos.y - this.ship.pos.y;
    const baseAng = Math.atan2(dirY, dirX);
    const parts = this._makeExplosion(enemy.pos, ENEMY_POP_PARTICLES, 1.2, [1.0, 0.9, 0.35], enemy.radius * 0.6, baseAng, Math.PI / 2);
    this.particles.push(...parts);
  }

  _makeExplosion(origin, count, duration, colorBase, sizeScale = 1.0, baseAngle = null, spread = Math.PI * 2) {
    const parts = [];
    for (let i = 0; i < count; i += 1) {
      const a = baseAngle === null
        ? Math.random() * Math.PI * 2
        : baseAngle + (Math.random() - 0.5) * spread;
      const speed = 18 + Math.random() * 32;
      const vel = { x: Math.cos(a) * speed, y: Math.sin(a) * speed };
      const size = (0.35 + Math.random() * 0.6) * sizeScale;
      const life = duration * (0.6 + Math.random() * 0.5);
      const cJitter = [colorBase[0], colorBase[1], colorBase[2]].map((c) => Math.min(1, Math.max(0, c + (Math.random() - 0.5) * 0.2)));
      parts.push({ pos: { ...origin }, vel, life, maxLife: life, size, color: cJitter });
    }
    return parts;
  }

  _addScore(delta) {
    this.score = Math.max(0, Math.floor(this.score + delta));
  }

  _scoreJitter() {
    const j = Math.floor(Math.random() * 200); // up to +199
    return j;
  }

  _spawnThrustParticles(dir, forward = false) {
    const count = 8;
    const base = forward ? { x: dir.x, y: dir.y } : { x: -dir.x, y: -dir.y };
    for (let i = 0; i < count; i += 1) {
      const angle = Math.atan2(base.y, base.x) + (Math.random() - 0.5) * 0.6;
      const speed = 12 + Math.random() * 10;
      const vel = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
      const size = 0.18 + Math.random() * 0.12;
      const life = 0.4 + Math.random() * 0.2;
      const color = [1.0, 0.82 + Math.random() * 0.1, 0.55];
      this.thrustParticles.unshift({ pos: { ...this.ship.pos }, vel, life, size, color });
    }
    if (this.thrustParticles.length > THRUST_PARTICLE_MAX) {
      this.thrustParticles.length = THRUST_PARTICLE_MAX;
    }
  }

  _applyRockGravity(dt) {
    this.level.rocks.forEach((rock) => {
      const dx = rock.x - this.ship.pos.x;
      const dy = rock.y - this.ship.pos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 4) return;
      const dist = Math.sqrt(distSq);
      const accel = (ROCK_GRAVITY * rock.r) / distSq;
      const ax = (dx / dist) * accel;
      const ay = (dy / dist) * accel;
      this.ship.vel.x += ax * dt;
      this.ship.vel.y += ay * dt;
    });
  }
}

export function getWorldSize() {
  return WORLD;
}
