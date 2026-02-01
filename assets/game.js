import { createProgram, createBuffer, ortho, resizeCanvasToDisplaySize } from './gl.js';

// Vector font - each character is an array of line segments [x1,y1,x2,y2,...]
// Characters are defined in a 5x7 grid (0-4 width, 0-6 height)
const VECTOR_FONT = {
  '0': [1,0,3,0, 3,0,4,1, 4,1,4,5, 4,5,3,6, 3,6,1,6, 1,6,0,5, 0,5,0,1, 0,1,1,0, 0,5,4,1],
  '1': [1,1,2,0, 2,0,2,6, 1,6,3,6],
  '2': [0,1,1,0, 1,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,0,6, 0,6,4,6],
  '3': [0,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,3,3, 3,3,1,3, 3,3,4,4, 4,4,4,5, 4,5,3,6, 3,6,0,6],
  '4': [0,0,0,3, 0,3,4,3, 3,0,3,6],
  '5': [4,0,0,0, 0,0,0,3, 0,3,3,3, 3,3,4,4, 4,4,4,5, 4,5,3,6, 3,6,0,6],
  '6': [3,0,1,0, 1,0,0,1, 0,1,0,5, 0,5,1,6, 1,6,3,6, 3,6,4,5, 4,5,4,4, 4,4,3,3, 3,3,0,3],
  '7': [0,0,4,0, 4,0,2,6],
  '8': [1,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,3,3, 3,3,1,3, 1,3,0,2, 0,2,0,1, 0,1,1,0, 1,3,0,4, 0,4,0,5, 0,5,1,6, 1,6,3,6, 3,6,4,5, 4,5,4,4, 4,4,3,3],
  '9': [4,3,4,1, 4,1,3,0, 3,0,1,0, 1,0,0,1, 0,1,0,2, 0,2,1,3, 1,3,4,3, 4,3,4,5, 4,5,3,6, 3,6,1,6],
  'A': [0,6,0,2, 0,2,2,0, 2,0,4,2, 4,2,4,6, 0,4,4,4],
  'B': [0,0,0,6, 0,6,3,6, 3,6,4,5, 4,5,4,4, 4,4,3,3, 3,3,0,3, 0,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,3,3],
  'C': [4,1,3,0, 3,0,1,0, 1,0,0,1, 0,1,0,5, 0,5,1,6, 1,6,3,6, 3,6,4,5],
  'D': [0,0,0,6, 0,6,3,6, 3,6,4,5, 4,5,4,1, 4,1,3,0, 3,0,0,0],
  'E': [4,0,0,0, 0,0,0,6, 0,6,4,6, 0,3,3,3],
  'F': [4,0,0,0, 0,0,0,6, 0,3,3,3],
  'G': [4,1,3,0, 3,0,1,0, 1,0,0,1, 0,1,0,5, 0,5,1,6, 1,6,3,6, 3,6,4,5, 4,5,4,3, 4,3,2,3],
  'H': [0,0,0,6, 4,0,4,6, 0,3,4,3],
  'I': [1,0,3,0, 2,0,2,6, 1,6,3,6],
  'J': [4,0,4,5, 4,5,3,6, 3,6,1,6, 1,6,0,5],
  'K': [0,0,0,6, 4,0,0,3, 0,3,4,6],
  'L': [0,0,0,6, 0,6,4,6],
  'M': [0,6,0,0, 0,0,2,3, 2,3,4,0, 4,0,4,6],
  'N': [0,6,0,0, 0,0,4,6, 4,6,4,0],
  'O': [1,0,3,0, 3,0,4,1, 4,1,4,5, 4,5,3,6, 3,6,1,6, 1,6,0,5, 0,5,0,1, 0,1,1,0],
  'P': [0,6,0,0, 0,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,3,3, 3,3,0,3],
  'Q': [1,0,3,0, 3,0,4,1, 4,1,4,5, 4,5,3,6, 3,6,1,6, 1,6,0,5, 0,5,0,1, 0,1,1,0, 2,4,4,6],
  'R': [0,6,0,0, 0,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,3,3, 3,3,0,3, 2,3,4,6],
  'S': [4,1,3,0, 3,0,1,0, 1,0,0,1, 0,1,0,2, 0,2,1,3, 1,3,3,3, 3,3,4,4, 4,4,4,5, 4,5,3,6, 3,6,1,6, 1,6,0,5],
  'T': [0,0,4,0, 2,0,2,6],
  'U': [0,0,0,5, 0,5,1,6, 1,6,3,6, 3,6,4,5, 4,5,4,0],
  'V': [0,0,2,6, 2,6,4,0],
  'W': [0,0,1,6, 1,6,2,3, 2,3,3,6, 3,6,4,0],
  'X': [0,0,4,6, 4,0,0,6],
  'Y': [0,0,2,3, 2,3,4,0, 2,3,2,6],
  'Z': [0,0,4,0, 4,0,0,6, 0,6,4,6],
  ' ': [],
  '.': [2,5,2,6, 2,6,2,5],
  ':': [2,1,2,2, 2,4,2,5],
  '-': [1,3,3,3],
  '/': [0,6,4,0],
  '!': [2,0,2,4, 2,5.5,2,6],
  '?': [0,1,1,0, 1,0,3,0, 3,0,4,1, 4,1,4,2, 4,2,3,3, 3,3,2,3, 2,3,2,4, 2,5.5,2,6],
  '+': [2,1,2,5, 0,3,4,3],
  '*': [2,1,2,5, 0,2,4,4, 0,4,4,2],
  '(': [3,0,1,1, 1,1,1,5, 1,5,3,6],
  ')': [1,0,3,1, 3,1,3,5, 3,5,1,6],
  ',': [2,5,2,6, 2,6,1,7],
  "'": [2,0,2,2],
};

// Textured quad shader for overlays
const OVERLAY_VERTEX_SRC = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_texcoord;
uniform mat4 u_proj;
uniform vec2 u_pos;
uniform vec2 u_size;
out vec2 v_texcoord;
void main() {
  vec2 pos = a_position * u_size + u_pos;
  v_texcoord = a_texcoord;
  gl_Position = u_proj * vec4(pos, 0.0, 1.0);
}`;

const OVERLAY_FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_alpha;
out vec4 outColor;
void main() {
  vec4 col = texture(u_texture, v_texcoord);
  outColor = vec4(col.rgb, col.a * u_alpha);
}`;

const HUD_VERTEX_SRC = `#version 300 es
precision highp float;
in vec2 a_position;
in vec3 a_color;
uniform mat4 u_proj;
out vec3 v_color;
void main() {
  v_color = a_color;
  gl_Position = u_proj * vec4(a_position, 0.0, 1.0);
}`;

const HUD_FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;
void main() {
  outColor = vec4(v_color, 1.0);
}`;

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
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_motionMix;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_filmGrain;
uniform float u_vignette;
uniform float u_chromatic;
uniform float u_scanlines;
uniform float u_barrelDistort;
uniform float u_phosphor;
uniform float u_colorFringe;
uniform float u_staticNoise;
uniform vec2 u_screenShake;
uniform int u_colorLut;
uniform float u_gamma;
uniform float u_lensFlare;
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

// ACES filmic tone mapping
vec3 ACESFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Phosphor glow - simulate RGB subpixel pattern
vec3 phosphorGlow(vec2 uv, vec3 col, float intensity) {
  vec2 pixelPos = uv * u_resolution;
  float subpixel = mod(pixelPos.x, 3.0);
  vec3 mask = vec3(
    smoothstep(0.0, 1.0, 1.0 - abs(subpixel - 0.5)),
    smoothstep(0.0, 1.0, 1.0 - abs(subpixel - 1.5)),
    smoothstep(0.0, 1.0, 1.0 - abs(subpixel - 2.5))
  );
  // Scanline component
  float scanY = mod(pixelPos.y, 2.0);
  float scanMask = 0.85 + 0.15 * smoothstep(0.0, 1.0, scanY);
  mask *= scanMask;
  // Blend phosphor mask with original
  vec3 phosphorCol = col * mix(vec3(1.0), mask, intensity);
  // Add glow bleeding
  float glow = (col.r + col.g + col.b) / 3.0 * intensity * 0.15;
  return phosphorCol + glow;
}

// Color fringing - NTSC-style horizontal color bleed
vec3 colorFringing(vec2 uv, vec3 col, float intensity) {
  if (intensity <= 0.0) return col;
  vec2 texel = 1.0 / u_resolution;
  // Stronger offset for visible effect
  float offset = intensity * 0.005;
  // Apply RGB channel separation
  vec3 fringe = vec3(
    texture(u_scene, uv - vec2(offset, 0.0)).r,
    col.g,
    texture(u_scene, uv + vec2(offset, 0.0)).b
  );
  return fringe;
}

// Static noise burst
vec3 staticNoiseBurst(vec2 uv, vec3 col, float intensity, float time) {
  if (intensity <= 0.0) return col;
  // Random burst timing
  float burstTrigger = step(0.97, fract(sin(time * 1.7) * 43758.5453));
  float burstIntensity = burstTrigger * intensity;
  // Noise pattern
  float noise = rand(uv * u_resolution + time * 100.0);
  // Horizontal tear lines
  float tearLine = step(0.98, fract(sin(uv.y * 50.0 + time * 30.0) * 43758.5453));
  float tear = tearLine * 0.3;
  // Combine
  vec3 staticCol = vec3(noise);
  col = mix(col, staticCol, burstIntensity * 0.5);
  col += tear * burstIntensity;
  // RGB split on burst
  if (burstTrigger > 0.5) {
    vec2 offset = vec2(0.01 * intensity, 0.0);
    col.r = texture(u_scene, uv + offset).r;
    col.b = texture(u_scene, uv - offset).b;
  }
  return col;
}

// Lens flare effect
vec3 lensFlare(vec2 uv, float intensity) {
  if (intensity <= 0.0) return vec3(0.0);

  vec3 flare = vec3(0.0);
  vec2 center = vec2(0.5);

  // Radial streak/halo around bright center
  vec2 toCenter = center - uv;
  float distFromCenter = length(toCenter);
  vec3 centerSample = texture(u_scene, center).rgb;
  float centerBright = dot(centerSample, vec3(0.299, 0.587, 0.114));
  float halo = smoothstep(0.5, 0.0, distFromCenter) * smoothstep(0.3, 0.8, centerBright);
  flare += centerSample * halo * 0.1;

  // Anamorphic horizontal streak - sample horizontally and accumulate bright areas
  for (float x = 0.0; x < 1.0; x += 0.05) {
    vec3 s = texture(u_scene, vec2(x, uv.y)).rgb;
    float bright = max(s.r, max(s.g, s.b));
    if (bright > 0.5) {
      float dist = abs(uv.x - x);
      float streak = exp(-dist * 8.0) * bright;
      flare += s * streak * 0.15;
    }
  }

  return flare * intensity;
}

// Color LUT application
vec3 applyColorLut(vec3 col, int lutIndex) {
  if (lutIndex == 1) {
    // Amber monochrome
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    return vec3(lum * 1.2, lum * 0.9, lum * 0.4);
  } else if (lutIndex == 2) {
    // Cool blue
    return vec3(col.r * 0.7, col.g * 0.85, col.b * 1.3);
  } else if (lutIndex == 3) {
    // Neon/cyberpunk
    col = pow(col, vec3(0.9));
    col.r = col.r * 1.1 + col.b * 0.2;
    col.g = col.g * 1.2;
    col.b = col.b * 1.3 + col.r * 0.1;
    return clamp(col, 0.0, 1.0);
  } else if (lutIndex == 4) {
    // Noir
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 bw = vec3(lum);
    bw = (bw - 0.5) * 1.4 + 0.5; // boost contrast
    return clamp(bw, 0.0, 1.0);
  }
  return col;
}

void main() {
  vec2 uv = v_uv;

  // Apply screen shake
  uv += u_screenShake;

  // line wobble and occasional VHS-style horizontal jitter
  float lineWobble = sin(u_time * 1.3 + uv.y * 160.0) * 0.001 *  sin(u_time * 2.0);
  float jitterEvent = step(0.995, fract(sin(u_time * 3.17) * 43758.5453));
  float jitter = jitterEvent * (0.01 * sin(u_time * 60.0));
  float scan = sin(uv.y * u_resolution.y * 0.5 * 3.14159) * 5.0;
  vec2 uvCurved = barrel(uv + vec2(lineWobble + jitter, 0.0), u_barrelDistort);

  // chromatic aberration toward edges
  vec2 center = uvCurved - 0.5;
  float dist = length(center);
  vec2 ca = center * dist * u_chromatic;

  vec3 col;
  col.r = texture(u_scene, uvCurved + ca).r;
  col.g = texture(u_scene, uvCurved).g;
  col.b = texture(u_scene, uvCurved - ca).b;

  // motion blur by blending previous frame
  vec3 prevCol = texture(u_prev, uvCurved).rgb;
  col = mix(prevCol, col, u_motionMix);

  // color fringing (NTSC artifact)
  col = colorFringing(uvCurved, col, u_colorFringe);

  // color bleed (luma-weighted horizontal smear)
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float bleed = 0.04 * smoothstep(0.3, 1.0, luma);
  vec3 bleedCol = vec3(
    texture(u_scene, uvCurved + vec2(bleed, 0.0)).r,
    col.g,
    texture(u_scene, uvCurved - vec2(bleed, 0.0)).b
  );
  col = mix(col, bleedCol, 0.5);

  // phosphor glow
  col = phosphorGlow(uvCurved, col, u_phosphor);

  // scanlines
  col *= 1.0 - scan * u_scanlines;

  // vignette
  float vig = vignette(uvCurved);
  col *= mix(1.0, vig, u_vignette) + 0.04;

  // static noise burst
  col = staticNoiseBurst(uvCurved, col, u_staticNoise, u_time);

  // tone mapping
  col = ACESFilm(col * u_exposure);

  // lens flare
  col += lensFlare(uvCurved, u_lensFlare);

  // contrast
  col = (col - 0.5) * u_contrast + 0.5;

  // saturation
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(grey), col, u_saturation);

  // color LUT
  col = applyColorLut(col, u_colorLut);

  // gamma correction
  col = pow(col, vec3(1.0 / u_gamma));

  // film grain
  float g = (rand(uvCurved * u_resolution.xy - u_time * 2.3) - 0.5) * u_filmGrain;
  col += g;

  outColor = vec4(col, 1.0);
}`;

const ACCUM_FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_prev;
uniform float u_decay;
uniform float u_gain;
out vec4 outColor;
void main() {
  vec3 scene = texture(u_scene, v_uv).rgb;
  vec3 prev = texture(u_prev, v_uv).rgb;
  vec3 col = prev * u_decay + scene * u_gain;
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
const SNAKE_SPEED = 5;
const SNAKE_INITIAL_UNITS = 5;
const SNAKE_SEGMENT_RADIUS = 0.9;
const SNAKE_SEGMENT_SPACING = 1.1;
const SNAKE_GROWTH_UNITS = 3;
const SNAKE_COLOR = [0.08, 0.08, 0.08];
const SNAKE_SPAWNS = [
  { x: WORLD_CENTER.x - 70, y: WORLD_CENTER.y + 80 },
  { x: WORLD_CENTER.x + 85, y: WORLD_CENTER.y + 60 },
  { x: WORLD_CENTER.x - 30, y: WORLD_CENTER.y - 95 },
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
const ROCK_SPIKE_COUNT = 14;
const ROCK_SPIKE_INNER = 0.62;
const ROCK_SPIKE_OUTER = 1.28;
const ROCK_CORE_SCALE = 0.35;
const ROCK_SPIKE_COLOR = [0.9, 0.92, 0.96];

const POST_CONFIG = {
  motionMix: 0.5,
  trailDecay: 0.8,
  trailGain: 0.1,
  exposure: 1.2,
  contrast: 1.6,
  saturation: 2.0,
  filmGrain: 0.50,
  vignette: 0.85,
  chromatic: 0.11,
  scanlines: 0.12,
  barrelDistort: 0.03,
  phosphor: 0.15,
  colorFringe: 0.0,
  staticNoise: 0.0,
  screenShake: 1.0,
  colorLut: 0, // 0=none, 1=amber, 2=cool, 3=neon, 4=noir
  gamma: 1.0,
  lensFlare: 0.3,
};

class DebugUI {
  constructor(config) {
    this.config = config;
    this.visible = false;
    this.panel = null;
    this._create();
  }

  _stopKeyPropagation(el) {
    el.addEventListener('keydown', (e) => e.stopPropagation());
    el.addEventListener('keyup', (e) => e.stopPropagation());
  }

  _create() {
    this.panel = document.createElement('div');
    this.panel.id = 'debug-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 8px;
      z-index: 1000;
      display: none;
      min-width: 300px;
      max-height: 90vh;
      overflow-y: auto;
    `;

    const title = document.createElement('div');
    title.textContent = 'Post Effects Debug (2 to close)';
    title.style.cssText = 'margin-bottom: 15px; font-size: 14px; color: #0ff;';
    this.panel.appendChild(title);

    const params = [
      { key: 'motionMix', label: 'Motion Blur', min: 0, max: 1, step: 0.05 },
      { key: 'trailDecay', label: 'Trail Decay', min: 0, max: 0.99, step: 0.01 },
      { key: 'trailGain', label: 'Trail Gain', min: 0, max: 1, step: 0.05 },
      { key: 'exposure', label: 'Exposure', min: 0.5, max: 3, step: 0.1 },
      { key: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.05 },
      { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.05 },
      { key: 'filmGrain', label: 'Film Grain', min: 0, max: 0.5, step: 0.01 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.05 },
      { key: 'chromatic', label: 'Chromatic Ab.', min: 0, max: 0.3, step: 0.01 },
      { key: 'scanlines', label: 'Scanlines', min: 0, max: 0.3, step: 0.01 },
      { key: 'barrelDistort', label: 'Barrel Distort', min: 0, max: 0.1, step: 0.005 },
      { key: 'phosphor', label: 'Phosphor Glow', min: 0, max: 1, step: 0.05 },
      { key: 'colorFringe', label: 'Color Fringe', min: 0, max: 1, step: 0.05 },
      { key: 'staticNoise', label: 'Static Noise', min: 0, max: 1, step: 0.05 },
      { key: 'screenShake', label: 'Screen Shake', min: 0, max: 2, step: 0.1 },
      { key: 'gamma', label: 'Gamma', min: 1.0, max: 3.0, step: 0.1 },
      { key: 'lensFlare', label: 'Lens Flare', min: 0, max: 1, step: 0.05 },
    ];

    params.forEach((p) => {
      const row = document.createElement('div');
      row.style.cssText = 'margin-bottom: 8px; display: flex; align-items: center;';

      const label = document.createElement('span');
      label.textContent = p.label;
      label.style.cssText = 'width: 110px; display: inline-block;';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = p.min;
      slider.max = p.max;
      slider.step = p.step;
      slider.value = this.config[p.key];
      slider.style.cssText = 'width: 100px; margin: 0 10px;';
      this._stopKeyPropagation(slider);

      const value = document.createElement('span');
      value.textContent = this.config[p.key].toFixed(2);
      value.style.cssText = 'width: 40px; text-align: right;';

      slider.addEventListener('input', () => {
        this.config[p.key] = parseFloat(slider.value);
        value.textContent = this.config[p.key].toFixed(2);
      });

      row.appendChild(label);
      row.appendChild(slider);
      row.appendChild(value);
      this.panel.appendChild(row);
    });

    // Color LUT selector
    const lutRow = document.createElement('div');
    lutRow.style.cssText = 'margin-top: 15px; margin-bottom: 8px; display: flex; align-items: center;';

    const lutLabel = document.createElement('span');
    lutLabel.textContent = 'Color LUT';
    lutLabel.style.cssText = 'width: 110px; display: inline-block;';

    const lutSelect = document.createElement('select');
    lutSelect.style.cssText = 'width: 120px; background: #222; color: #0f0; border: 1px solid #0f0; padding: 4px;';
    this._stopKeyPropagation(lutSelect);

    const luts = [
      { value: 0, label: 'None' },
      { value: 1, label: 'Amber' },
      { value: 2, label: 'Cool Blue' },
      { value: 3, label: 'Neon' },
      { value: 4, label: 'Noir' },
    ];

    luts.forEach((lut) => {
      const opt = document.createElement('option');
      opt.value = lut.value;
      opt.textContent = lut.label;
      if (this.config.colorLut === lut.value) opt.selected = true;
      lutSelect.appendChild(opt);
    });

    lutSelect.addEventListener('change', () => {
      this.config.colorLut = parseInt(lutSelect.value);
    });

    lutRow.appendChild(lutLabel);
    lutRow.appendChild(lutSelect);
    this.panel.appendChild(lutRow);

    document.body.appendChild(this.panel);
  }

  toggle() {
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? 'block' : 'none';
  }
}

class InputController {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.thrust = false;
    this.fire = false;
    this.pause = false;
    this.reset = false;
    this.togglePost = false;
    this.toggleDebug = false;
    this.toggleImmortality = false;
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

  consumeDebugToggle() {
    const d = this.toggleDebug;
    this.toggleDebug = false;
    return d;
  }

  consumeImmortalityToggle() {
    const i = this.toggleImmortality;
    this.toggleImmortality = false;
    return i;
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
        case 'Digit2':
          if (down) this.toggleDebug = true; break;
        case 'Digit3':
          if (down) this.toggleImmortality = true; break;
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
    this.kind = 'orb';
    this.pos = { ...pos };
    this.size = size; // 4, 2, or 1
    this.radius = size;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = ENEMY_SPEED * (0.85 + Math.random() * 0.3);
    this.spawnInvuln = 2.0; // Can't kill player for 2 seconds after spawn
    // Movement pattern: 0=chase, 1=orbit, 2=zigzag, 3=swoop, 4=spiral
    this.pattern = Math.floor(Math.random() * 5);
    this.patternTimer = 0;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitDir = Math.random() > 0.5 ? 1 : -1;
    this.swoopTarget = null;
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

function buildSnakeSegments(pos, lengthUnits, spacing, angle) {
  const segments = [];
  for (let i = 0; i < lengthUnits; i += 1) {
    const offset = i * spacing;
    segments.push({
      x: pos.x - Math.cos(angle) * offset,
      y: pos.y - Math.sin(angle) * offset,
    });
  }
  return segments;
}

class Snake {
  constructor(pos, lengthUnits = SNAKE_INITIAL_UNITS) {
    this.kind = 'snake';
    this.pos = { ...pos };
    this.radius = SNAKE_SEGMENT_RADIUS;
    this.lengthUnits = lengthUnits;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = SNAKE_SPEED * (0.85 + Math.random() * 0.3);
    this.spawnInvuln = 2.0;
    this.patternTimer = 0;
    this.color = [...SNAKE_COLOR];
    const angle = Math.random() * Math.PI * 2;
    this.segments = buildSnakeSegments(pos, lengthUnits, SNAKE_SEGMENT_SPACING, angle);
  }

  grow(units = SNAKE_GROWTH_UNITS) {
    const count = Math.max(1, Math.floor(units));
    for (let i = 0; i < count; i += 1) {
      const tail = this.segments[this.segments.length - 1];
      this.segments.push({ x: tail.x, y: tail.y });
    }
    this.lengthUnits += count;
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
    this.postPrevLoc = gl.getUniformLocation(this.postProgram, 'u_prev');
    this.postResLoc = gl.getUniformLocation(this.postProgram, 'u_resolution');
    this.postTimeLoc = gl.getUniformLocation(this.postProgram, 'u_time');
    this.postMotionMixLoc = gl.getUniformLocation(this.postProgram, 'u_motionMix');
    this.postExposureLoc = gl.getUniformLocation(this.postProgram, 'u_exposure');
    this.postContrastLoc = gl.getUniformLocation(this.postProgram, 'u_contrast');
    this.postSaturationLoc = gl.getUniformLocation(this.postProgram, 'u_saturation');
    this.postFilmGrainLoc = gl.getUniformLocation(this.postProgram, 'u_filmGrain');
    this.postVignetteLoc = gl.getUniformLocation(this.postProgram, 'u_vignette');
    this.postChromaticLoc = gl.getUniformLocation(this.postProgram, 'u_chromatic');
    this.postScanlinesLoc = gl.getUniformLocation(this.postProgram, 'u_scanlines');
    this.postBarrelDistortLoc = gl.getUniformLocation(this.postProgram, 'u_barrelDistort');
    this.postPhosphorLoc = gl.getUniformLocation(this.postProgram, 'u_phosphor');
    this.postColorFringeLoc = gl.getUniformLocation(this.postProgram, 'u_colorFringe');
    this.postStaticNoiseLoc = gl.getUniformLocation(this.postProgram, 'u_staticNoise');
    this.postScreenShakeLoc = gl.getUniformLocation(this.postProgram, 'u_screenShake');
    this.postColorLutLoc = gl.getUniformLocation(this.postProgram, 'u_colorLut');
    this.postGammaLoc = gl.getUniformLocation(this.postProgram, 'u_gamma');
    this.postLensFlareLoc = gl.getUniformLocation(this.postProgram, 'u_lensFlare');

    // Accumulation program for motion trails
    this.accumProgram = createProgram(gl, POST_VERTEX_SRC, ACCUM_FRAGMENT_SRC);
    this.accumPosLoc = gl.getAttribLocation(this.accumProgram, 'a_position');
    this.accumSceneLoc = gl.getUniformLocation(this.accumProgram, 'u_scene');
    this.accumPrevLoc = gl.getUniformLocation(this.accumProgram, 'u_prev');
    this.accumDecayLoc = gl.getUniformLocation(this.accumProgram, 'u_decay');
    this.accumGainLoc = gl.getUniformLocation(this.accumProgram, 'u_gain');

    this.postVao = gl.createVertexArray();
    this.postBuffer = createBuffer(gl, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]));
    gl.bindVertexArray(this.postVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.postBuffer);
    gl.enableVertexAttribArray(this.postPosLoc);
    gl.vertexAttribPointer(this.postPosLoc, 2, gl.FLOAT, false, 0, 0);
    // same quad for accumulation shader
    gl.useProgram(this.accumProgram);
    gl.enableVertexAttribArray(this.accumPosLoc);
    gl.vertexAttribPointer(this.accumPosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.accumVao = this.postVao;

    // Overlay rendering setup
    this.overlayProgram = createProgram(gl, OVERLAY_VERTEX_SRC, OVERLAY_FRAGMENT_SRC);
    this.overlayPosLoc = gl.getAttribLocation(this.overlayProgram, 'a_position');
    this.overlayTexcoordLoc = gl.getAttribLocation(this.overlayProgram, 'a_texcoord');
    this.overlayProjLoc = gl.getUniformLocation(this.overlayProgram, 'u_proj');
    this.overlayPosUniformLoc = gl.getUniformLocation(this.overlayProgram, 'u_pos');
    this.overlaySizeLoc = gl.getUniformLocation(this.overlayProgram, 'u_size');
    this.overlayTextureLoc = gl.getUniformLocation(this.overlayProgram, 'u_texture');
    this.overlayAlphaLoc = gl.getUniformLocation(this.overlayProgram, 'u_alpha');

    this.overlayVao = gl.createVertexArray();
    this.overlayBuffer = createBuffer(gl, new Float32Array([
      // position (x,y), texcoord (u,v)
      -0.5, -0.5, 0, 1,
       0.5, -0.5, 1, 1,
      -0.5,  0.5, 0, 0,
       0.5,  0.5, 1, 0,
    ]));
    gl.bindVertexArray(this.overlayVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.overlayBuffer);
    gl.enableVertexAttribArray(this.overlayPosLoc);
    gl.enableVertexAttribArray(this.overlayTexcoordLoc);
    gl.vertexAttribPointer(this.overlayPosLoc, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this.overlayTexcoordLoc, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);

    this.overlayTextures = {};
    this._loadOverlayTextures();

    // HUD rendering setup
    this.hudProgram = createProgram(gl, HUD_VERTEX_SRC, HUD_FRAGMENT_SRC);
    this.hudPosLoc = gl.getAttribLocation(this.hudProgram, 'a_position');
    this.hudColorLoc = gl.getAttribLocation(this.hudProgram, 'a_color');
    this.hudProjLoc = gl.getUniformLocation(this.hudProgram, 'u_proj');
    this.hudVao = gl.createVertexArray();
    this.hudBuffer = createBuffer(gl, new Float32Array(2000)); // pre-allocate
    gl.bindVertexArray(this.hudVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.hudBuffer);
    gl.enableVertexAttribArray(this.hudPosLoc);
    gl.enableVertexAttribArray(this.hudColorLoc);
    gl.vertexAttribPointer(this.hudPosLoc, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(this.hudColorLoc, 3, gl.FLOAT, false, 20, 8);
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
    // Only resize render targets when dimensions actually change
    if (this._rtWidth !== width || this._rtHeight !== height) {
      this._resizeRenderTarget(width, height);
      this._rtWidth = width;
      this._rtHeight = height;
    }
  }

  draw(level, ship, thrusting, stateText, enemies, bullets, particles, squares, timeSec, postEnabled = true, config = POST_CONFIG, hudData = null, overlays = null) {
    const gl = this.gl;
    // Render to framebuffer if post-processing, otherwise directly to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, postEnabled ? this.fbo : null);
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
    this._drawSquares(squares);
    this._drawShip(ship, thrusting, stateText);

    // Draw overlays (into FBO so they get post-processed)
    if (overlays) {
      gl.bindVertexArray(null);
      if (overlays.splash && overlays.splash.visible) {
        this.drawOverlayCentered('splash', 0.8, overlays.splash.alpha);
      }
      if (overlays.title && overlays.title.visible) {
        const w = gl.canvas.width;
        const h = gl.canvas.height;
        this.drawOverlay('title', w * 0.85, h - 160, 0.6, overlays.title.alpha);
      }
      if (overlays.gameover && overlays.gameover.visible) {
        this.drawOverlayCentered('gameover', 0.9, overlays.gameover.alpha);
      }
      if (overlays.lifeOverlay && overlays.lifeOverlay.visible) {
        const lifeName = 'life' + overlays.lifeOverlay.index;
        const w = gl.canvas.width;
        const overlay = this.overlayTextures[lifeName];
        const scale = 0.8;
        // Position so bottom of image aligns with screen bottom
        const yPos = overlay && overlay.loaded ? (overlay.height * scale) / 2 : 200;
        this.drawOverlay(lifeName, w * 0.35, yPos, scale, overlays.lifeOverlay.alpha);
      }
    }

    // Skip post-processing if disabled
    if (!postEnabled) {
      gl.bindVertexArray(null);
      return;
    }

    // Pass 2: postprocess to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.postProgram);
    gl.bindVertexArray(this.postVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    gl.uniform1i(this.postSamplerLoc, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.prevFront);
    gl.uniform1i(this.postPrevLoc, 1);
    gl.uniform2f(this.postResLoc, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.postTimeLoc, timeSec);
    gl.uniform1f(this.postMotionMixLoc, config.motionMix);
    gl.uniform1f(this.postExposureLoc, config.exposure);
    gl.uniform1f(this.postContrastLoc, config.contrast);
    gl.uniform1f(this.postSaturationLoc, config.saturation);
    gl.uniform1f(this.postFilmGrainLoc, config.filmGrain);
    gl.uniform1f(this.postVignetteLoc, config.vignette);
    gl.uniform1f(this.postChromaticLoc, config.chromatic);
    gl.uniform1f(this.postScanlinesLoc, config.scanlines);
    gl.uniform1f(this.postBarrelDistortLoc, config.barrelDistort);
    gl.uniform1f(this.postPhosphorLoc, config.phosphor);
    gl.uniform1f(this.postColorFringeLoc, config.colorFringe);
    gl.uniform1f(this.postStaticNoiseLoc, config.staticNoise);
    gl.uniform2f(this.postScreenShakeLoc, config.screenShakeX || 0, config.screenShakeY || 0);
    gl.uniform1i(this.postColorLutLoc, config.colorLut);
    gl.uniform1f(this.postGammaLoc, config.gamma);
    gl.uniform1f(this.postLensFlareLoc, config.lensFlare);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(null);

    // Accumulate current scene into prevBack: prevBack = mix(prevFront, colorTex, accumMix)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.prevFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.prevBack, 0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.accumProgram);
    gl.bindVertexArray(this.accumVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    gl.uniform1i(this.accumSceneLoc, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.prevFront);
    gl.uniform1i(this.accumPrevLoc, 1);
    gl.uniform1f(this.accumDecayLoc, config.trailDecay);
    gl.uniform1f(this.accumGainLoc, config.trailGain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // swap front/back
    const tmp = this.prevFront;
    this.prevFront = this.prevBack;
    this.prevBack = tmp;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Draw HUD overlay
    if (hudData) {
      this.drawHUD(hudData, overlays, timeSec);
    }
  }

  _createRenderTarget() {
    const gl = this.gl;
    this.fbo = gl.createFramebuffer();
    this.colorTex = gl.createTexture();
    this.prevTexA = gl.createTexture();
    this.prevTexB = gl.createTexture();
    this.prevFront = this.prevTexA;
    this.prevBack = this.prevTexB;
    this.prevFbo = gl.createFramebuffer();
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

    [this.prevTexA, this.prevTexB].forEach((tex) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Clear both prev textures to black to avoid streaks
    [this.prevTexA, this.prevTexB].forEach((tex) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.prevFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.prevFront = this.prevTexA;
    this.prevBack = this.prevTexB;
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
    rocks.forEach((r) => {
      const segments = ROCK_SPIKE_COUNT * 2;
      const spin = timeSec * (0.25 + 0.2 * Math.abs(Math.sin((r.x + r.y) * 0.07)));
      const baseRot = (r.x - r.y) * 0.01;
      const spikeColor = ROCK_SPIKE_COLOR;
      const verts = [];
      verts.push(r.x, r.y, 0.58, 0.7, 0.8);
      for (let i = 0; i <= segments; i += 1) {
        const a = (i / segments) * Math.PI * 2 + spin + baseRot;
        const tooth = (i % 2 === 0) ? ROCK_SPIKE_OUTER : ROCK_SPIKE_INNER;
        const rough = 0.05 * Math.sin(a * 6 + r.x * 0.2 + r.y * 0.15);
        const radius = r.r * (tooth + rough);
        const x = r.x + Math.cos(a) * radius;
        const y = r.y + Math.sin(a) * radius;
        verts.push(x, y, spikeColor[0], spikeColor[1], spikeColor[2]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);

      const coreSegments = 16;
      const coreVerts = [];
      const coreR = r.r * ROCK_CORE_SCALE;
      coreVerts.push(r.x, r.y, -0.35, -0.35, -0.35);
      for (let i = 0; i <= coreSegments; i += 1) {
        const a = (i / coreSegments) * Math.PI * 2 + spin * 0.4;
        const x = r.x + Math.cos(a) * coreR;
        const y = r.y + Math.sin(a) * coreR;
        coreVerts.push(x, y, -0.35, -0.35, -0.35);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coreVerts), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, coreSegments + 2);
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
      const radius = SHIP_RADIUS + 1.6; // larger ring while invulnerable/hidden
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
      if (e.kind === 'snake') {
        const base = e.color;
        e.segments.forEach((seg, idx) => {
          const pulse = 0.85 + Math.sin(e.phase * 2.0 + idx * 0.7) * 0.18;
          const radius = e.radius * pulse;
          const core = 0.7 + pulse * 0.3;
          gl.uniform2f(this.monsterCenterLoc, seg.x, seg.y);
          gl.uniform1f(this.monsterRadiusLoc, radius);
          const verts = [];
          verts.push(seg.x, seg.y, base[0] * core, base[1] * core, base[2] * core);
          for (let i = 0; i <= segments; i += 1) {
            const a = (i / segments) * Math.PI * 2;
            const x = seg.x + Math.cos(a) * radius;
            const y = seg.y + Math.sin(a) * radius;
            const shade = 0.8 + 0.2 * Math.sin(e.phase + i * 0.4 + idx * 0.3);
            verts.push(
              x,
              y,
              base[0] * shade,
              base[1] * shade,
              base[2] * shade
            );
          }
          const data = new Float32Array(verts);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
          gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
        });
        return;
      }
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

  _drawSquares(squares) {
    const gl = this.gl;
    squares.forEach((s) => {
      const half = s.size * 0.5;
      const pts = [
        { x: -half, y: -half },
        { x: half, y: -half },
        { x: half, y: half },
        { x: -half, y: half },
      ];
      const verts = [];
      pts.forEach((p) => {
        const r = rotate(p, s.angle);
        verts.push(s.pos.x + r.x, s.pos.y + r.y, ...s.color);
      });
      // close loop
      const r0 = rotate(pts[0], s.angle);
      verts.push(s.pos.x + r0.x, s.pos.y + r0.y, ...s.color);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STREAM_DRAW);
      gl.drawArrays(gl.LINE_STRIP, 0, 5);
    });
  }

  _loadOverlayTextures() {
    const gl = this.gl;
    const images = [
      { name: 'splash', src: 'assets/blastoff.png' },
      { name: 'title', src: 'assets/title.png' },
      { name: 'gameover', src: 'assets/gameover.png' },
      { name: 'life1', src: 'assets/overlay1.png' },
      { name: 'life2', src: 'assets/overlay2.png' },
      { name: 'life3', src: 'assets/overlay3.png' },
    ];

    images.forEach(({ name, src }) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Placeholder 1x1 pixel until image loads
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));

      const img = new Image();
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.overlayTextures[name] = { texture: tex, width: img.width, height: img.height, loaded: true };
      };
      img.src = src;
      this.overlayTextures[name] = { texture: tex, width: 1, height: 1, loaded: false };
    });
  }

  drawOverlay(name, x, y, scale = 1, alpha = 1) {
    const gl = this.gl;
    const overlay = this.overlayTextures[name];
    if (!overlay || !overlay.loaded) return;

    gl.useProgram(this.overlayProgram);
    gl.bindVertexArray(this.overlayVao);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const w = gl.canvas.width;
    const h = gl.canvas.height;
    const proj = ortho(0, w, 0, h, -1, 1);

    gl.uniformMatrix4fv(this.overlayProjLoc, false, proj);
    gl.uniform2f(this.overlayPosUniformLoc, x, y);
    gl.uniform2f(this.overlaySizeLoc, overlay.width * scale, overlay.height * scale);
    gl.uniform1f(this.overlayAlphaLoc, alpha);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, overlay.texture);
    gl.uniform1i(this.overlayTextureLoc, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  drawOverlayCentered(name, scale = 1, alpha = 1) {
    const gl = this.gl;
    const overlay = this.overlayTextures[name];
    if (!overlay || !overlay.loaded) return;

    const x = gl.canvas.width / 2;
    const y = gl.canvas.height / 2;
    this.drawOverlay(name, x, y, scale, alpha);
  }

  // Build vertex data for vector text
  _buildTextVertices(text, x, y, scale, color) {
    const verts = [];
    const charWidth = 6 * scale;
    let cursorX = x;

    for (const char of text.toUpperCase()) {
      const glyph = VECTOR_FONT[char];
      if (glyph && glyph.length >= 4) {
        // Each line segment is 4 values: x1, y1, x2, y2
        for (let i = 0; i < glyph.length - 3; i += 4) {
          const x1 = cursorX + glyph[i] * scale;
          const y1 = y - glyph[i + 1] * scale;
          const x2 = cursorX + glyph[i + 2] * scale;
          const y2 = y - glyph[i + 3] * scale;
          verts.push(x1, y1, ...color);
          verts.push(x2, y2, ...color);
        }
      }
      cursorX += charWidth;
    }
    return verts;
  }

  // Draw a small ship icon for lives display
  _buildShipIcon(x, y, scale, color) {
    const verts = [];
    const shape = [
      [0, 1.5], [-0.8, -1], [0, -0.5], [0.8, -1], [0, 1.5]
    ];
    for (let i = 0; i < shape.length - 1; i++) {
      verts.push(x + shape[i][0] * scale, y + shape[i][1] * scale, ...color);
      verts.push(x + shape[i + 1][0] * scale, y + shape[i + 1][1] * scale, ...color);
    }
    return verts;
  }

  drawHUD(hudData, overlays = null, timeSec = 0) {
    const gl = this.gl;
    const w = gl.canvas.width;
    const h = gl.canvas.height;

    gl.useProgram(this.hudProgram);
    gl.bindVertexArray(this.hudVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.hudBuffer);

    // Set line width (note: may not be supported on all hardware)
    gl.lineWidth(2.0);

    // Screen-space orthographic projection
    const hudProj = ortho(0, w, 0, h, -1, 1);
    gl.uniformMatrix4fv(this.hudProjLoc, false, hudProj);

    const verts = [];
    const scale = Math.max(2, Math.min(w, h) / 200);
    const padding = 20;
    const glowColor = [0.2, 1.0, 0.6]; // green vector glow
    const dimColor = [0.1, 0.5, 0.3];

    // Blinking effect for prompts (on/off every 0.5 seconds)
    const blinkOn = Math.sin(timeSec * 4) > 0;

    // Show prompts for overlays - centered on screen with blinking
    if (overlays && overlays.splash && overlays.splash.visible && blinkOn) {
      const promptText = 'PRESS ANY KEY TO START';
      const promptWidth = promptText.length * 6 * scale;
      verts.push(...this._buildTextVertices(promptText, w / 2 - promptWidth / 2, h * 0.5, scale, glowColor));
    } else if (overlays && overlays.gameover && overlays.gameover.visible && blinkOn) {
      const promptText = 'PRESS ANY KEY TO RESTART';
      const promptWidth = promptText.length * 6 * scale;
      verts.push(...this._buildTextVertices(promptText, w / 2 - promptWidth / 2, h * 0.5, scale, glowColor));
    }

    // Score - top left
    const scoreText = `SCORE ${hudData.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    verts.push(...this._buildTextVertices(scoreText, padding, h - padding, scale, glowColor));

    // Lives - draw ship icons
    const livesY = h - padding - scale * 12;
    verts.push(...this._buildTextVertices('LIVES', padding, livesY, scale, glowColor));
    for (let i = 0; i < hudData.lives; i++) {
      verts.push(...this._buildShipIcon(padding + scale * 40 + i * scale * 12, livesY - scale * 3, scale * 3, glowColor));
    }

    // Immortality indicator
    if (hudData.immortal) {
      verts.push(...this._buildTextVertices('IMMORTAL', w / 2 - scale * 24, h - padding, scale, [1.0, 0.8, 0.2]));
    }

    // Bottom decorative line
    const lineY = padding;
    verts.push(padding, lineY, ...dimColor);
    verts.push(w - padding, lineY, ...dimColor);

    // Top decorative line
    const topLineY = h - padding - scale * 20;
    verts.push(padding, topLineY, ...dimColor);
    verts.push(w - padding, topLineY, ...dimColor);

    // Corner accents
    const cornerSize = 15;
    // Bottom left
    verts.push(padding, lineY, ...glowColor);
    verts.push(padding, lineY + cornerSize, ...glowColor);
    verts.push(padding, lineY, ...glowColor);
    verts.push(padding + cornerSize, lineY, ...glowColor);
    // Bottom right
    verts.push(w - padding, lineY, ...glowColor);
    verts.push(w - padding, lineY + cornerSize, ...glowColor);
    verts.push(w - padding, lineY, ...glowColor);
    verts.push(w - padding - cornerSize, lineY, ...glowColor);
    // Top left
    verts.push(padding, topLineY, ...glowColor);
    verts.push(padding, topLineY - cornerSize, ...glowColor);
    verts.push(padding, topLineY, ...glowColor);
    verts.push(padding + cornerSize, topLineY, ...glowColor);
    // Top right
    verts.push(w - padding, topLineY, ...glowColor);
    verts.push(w - padding, topLineY - cornerSize, ...glowColor);
    verts.push(w - padding, topLineY, ...glowColor);
    verts.push(w - padding - cornerSize, topLineY, ...glowColor);

    if (verts.length > 0) {
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STREAM_DRAW);
      gl.drawArrays(gl.LINES, 0, verts.length / 5);
    }

    gl.bindVertexArray(null);
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
  constructor(gl, hudCallbacks, onThrustStart = () => {}, onDie = () => {}, onFire = () => {}, onEnemyPop = () => {}, onThrust = () => {}, onGameOver = () => {}, onLifeLost = () => {}) {
    this.gl = gl;
    this.renderer = new Renderer(gl);
    this.level = new Level();
    this.ship = new Ship();
    const baseEnemies = ENEMY_SPAWNS.map((p) => new Enemy(p, 4));
    const snakes = SNAKE_SPAWNS.map((p) => new Snake(p, SNAKE_INITIAL_UNITS));
    this.enemies = [...baseEnemies, ...snakes];
    this.pendingRespawns = [];
    this.bullets = [];
    this.particles = [];
    this.thrustParticles = [];
    this.squareBursts = [];
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
    this.onLifeLost = onLifeLost;
    this._wasThrusting = false;
    this.postEnabled = true;
    this.postConfig = POST_CONFIG;
    this.debugUI = new DebugUI(this.postConfig);
    this.inputLocked = false;
    this._status = 'initializing';
    this._explosionTimer = 0;
    this._gameOverDelay = -1;
    this._gameOverTriggered = false;
    this.cameraZoom = CAMERA_ZOOM_RECOVER;
    this._cameraZoomTarget = CAMERA_ZOOM_RECOVER;
    this._fireCooldown = 0;
    this._screenShakeIntensity = 0;
    this.immortal = false;
    // Overlay state
    this.overlays = {
      splash: { visible: true, alpha: 1 },
      title: { visible: true, alpha: 1 },
      gameover: { visible: false, alpha: 1 },
      lifeOverlay: { visible: false, alpha: 1, index: 1 },
    };
    if (snakes.length > 0) {
      const label = snakes.length === 1 ? 'snake' : 'snakes';
      this._log(`Spawned ${snakes.length} ${label}`);
    }
    this._log('Rock render: rotating sawtooth with core disc');
    this._log('Game created');
  }

  showOverlay(name, alpha = 1) {
    if (this.overlays[name]) {
      this.overlays[name].visible = true;
      this.overlays[name].alpha = alpha;
    }
  }

  hideOverlay(name) {
    if (this.overlays[name]) {
      this.overlays[name].visible = false;
    }
  }

  showLifeOverlay() {
    this.overlays.lifeOverlay.visible = true;
    this.overlays.lifeOverlay.index = 1 + Math.floor(Math.random() * 3);
  }

  hideLifeOverlay() {
    this.overlays.lifeOverlay.visible = false;
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
    if (this.input.consumePostToggle()) {
      this.postEnabled = !this.postEnabled;
      this._log(`Post effects toggled -> ${this.postEnabled}`);
    }
    if (this.input.consumeDebugToggle()) {
      this.debugUI.toggle();
    }
    if (this.input.consumeImmortalityToggle()) {
      this.immortal = !this.immortal;
      this._log(`Immortality toggled -> ${this.immortal}`);
    }

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

    // Screen shake decay and apply to postConfig
    if (this._screenShakeIntensity > 0) {
      this._screenShakeIntensity *= Math.pow(0.1, dt); // decay
      if (this._screenShakeIntensity < 0.001) this._screenShakeIntensity = 0;
      const shake = this._screenShakeIntensity * this.postConfig.screenShake;
      const time = performance.now() / 1000;
      this.postConfig.screenShakeX = Math.sin(time * 50) * shake * 0.03;
      this.postConfig.screenShakeY = Math.cos(time * 43) * shake * 0.02;
    } else {
      this.postConfig.screenShakeX = 0;
      this.postConfig.screenShakeY = 0;
    }

    if (this.ship.state === 'crashed') {
      this._explosionTimer -= dt;
      this._updateParticles(dt);
      this._updateSquares(dt);
      if (this.ship.lives <= 0 && this._gameOverDelay > 0) {
        this._gameOverDelay -= dt;
        if (this._gameOverDelay <= 0 && !this._gameOverTriggered) {
          this._gameOverTriggered = true;
          this.onGameOver();
        }
      }
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
    this._updateSquares(dt);
    this._updateRespawns(dt);
    this._checkBounds();
    this._checkCollision();
    this._checkEnemyCollision();
    this._checkBulletHits();

    this._updateHud(thrusting);
    return thrusting;
  }

  _checkBounds() {
    if (this.immortal) return;
    const dx = this.ship.pos.x - WORLD_CENTER.x;
    const dy = this.ship.pos.y - WORLD_CENTER.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAVE_RADIUS + SHIP_RADIUS) {
      this._crash('Outside cave');
    }
  }

  _checkCollision() {
    const ship = this.ship;
    if (ship.state !== 'playing' || this.immortal) return;

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
    if (this.ship.state !== 'playing' || this.ship.invuln > 0 || this.immortal) return;
    for (const e of this.enemies) {
      if (e.spawnInvuln > 0) continue; // Skip enemies that just spawned
      if (e.kind === 'snake') {
        if (this._snakeHitsShip(e)) {
          this._crash('Caught by monster');
          return;
        }
        continue;
      }
      const dist = Math.hypot(e.pos.x - this.ship.pos.x, e.pos.y - this.ship.pos.y);
      if (dist < e.radius + SHIP_RADIUS * COLLISION_MARGIN) {
        this._crash('Caught by monster');
        return;
      }
    }
  }

  _snakeHitsShip(snake) {
    for (const seg of snake.segments) {
      const dist = Math.hypot(seg.x - this.ship.pos.x, seg.y - this.ship.pos.y);
      if (dist < snake.radius + SHIP_RADIUS * COLLISION_MARGIN) {
        return true;
      }
    }
    return false;
  }

  _checkBulletHits() {
    const remainingEnemies = [];
    this.enemies.forEach((e) => {
      if (e.kind === 'snake') {
        this._applySnakeBulletHits(e);
        remainingEnemies.push(e);
        return;
      }
      let hit = false;
      for (const b of this.bullets) {
        if (b.life <= 0) continue;
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
        // Screen shake based on enemy size
        this._screenShakeIntensity = Math.max(this._screenShakeIntensity, e.size * 0.1);
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

  _applySnakeBulletHits(snake) {
    let hitCount = 0;
    for (const b of this.bullets) {
      if (b.life <= 0) continue;
      const hitPos = this._snakeHitPosition(snake, b);
      if (!hitPos) continue;
      this._handleSnakeHit(snake, hitPos);
      b.life = 0;
      hitCount += 1;
    }
    if (hitCount > 0) {
      this._log(`Snake hit x${hitCount} -> length ${snake.lengthUnits}`);
    }
  }

  _snakeHitPosition(snake, bullet) {
    for (const seg of snake.segments) {
      const dist = Math.hypot(seg.x - bullet.pos.x, seg.y - bullet.pos.y);
      if (dist < snake.radius + BULLET_RADIUS * 1.2) {
        return { x: seg.x, y: seg.y };
      }
    }
    return null;
  }

  _handleSnakeHit(snake, hitPos) {
    snake.grow(SNAKE_GROWTH_UNITS);
    const impact = { pos: hitPos, radius: 4, size: 4 };
    this._spawnEnemyExplosion(impact);
    this._screenShakeIntensity = Math.max(this._screenShakeIntensity, 0.4);
    const baseScore = SCORE_VALUES[4] || 0;
    this._addScore(baseScore + this._scoreJitter());
    this.onEnemyPop();
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
    this._screenShakeIntensity = 1.0; // trigger screen shake
    this.onDie();
    if (this.ship.lives <= 0) {
      this._gameOverDelay = 4.0;
      this._gameOverTriggered = false;
      return;
    }
    this.onLifeLost(this.ship.lives);
  }

  _resetShip(hard) {
    if (this.ship.lives <= 0) return;
    this.ship.reset(hard);
    this._gameOverDelay = -1;
    this._gameOverTriggered = false;
    this._status = 'running';
  }

  _render(thrusting) {
    resizeCanvasToDisplaySize(this.gl.canvas);
    this.renderer.setSize(this.gl.canvas.width, this.gl.canvas.height, this.cameraZoom);

    // Build HUD data
    const hudData = {
      score: Math.floor(this.displayScore),
      lives: this.ship.lives,
      immortal: this.immortal,
    };

    this.renderer.draw(
      this.level,
      this.ship,
      thrusting,
      this.ship.state,
      this.enemies,
      this.bullets,
      [...this.particles, ...this.thrustParticles],
      this.squareBursts,
      performance.now() / 1000,
      this.postEnabled,
      this.postConfig,
      hudData,
      this.overlays,
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
      if (e.kind === 'snake') {
        this._updateSnake(e, dt);
        return;
      }
      // Update spawn invulnerability
      if (e.spawnInvuln > 0) e.spawnInvuln -= dt;

      const dx = ship.pos.x - e.pos.x;
      const dy = ship.pos.y - e.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      let vx = 0, vy = 0;
      const speed = e.speed;
      e.patternTimer += dt;

      switch (e.pattern) {
        case 0: // Chase with wobble
          const wobble = Math.sin(e.phase) * 1.5;
          vx = ux * speed + (-uy) * wobble;
          vy = uy * speed + (ux) * wobble;
          break;

        case 1: // Orbit around player
          e.orbitAngle += e.orbitDir * dt * 1.5;
          const orbitDist = 50 + Math.sin(e.phase) * 15;
          const targetX = ship.pos.x + Math.cos(e.orbitAngle) * orbitDist;
          const targetY = ship.pos.y + Math.sin(e.orbitAngle) * orbitDist;
          const toDx = targetX - e.pos.x;
          const toDy = targetY - e.pos.y;
          const toLen = Math.hypot(toDx, toDy) || 1;
          vx = (toDx / toLen) * speed * 1.2;
          vy = (toDy / toLen) * speed * 1.2;
          break;

        case 2: // Zigzag approach
          const zigzag = Math.sin(e.patternTimer * 4) * 2.5;
          vx = ux * speed * 0.7 + (-uy) * zigzag * speed * 0.5;
          vy = uy * speed * 0.7 + (ux) * zigzag * speed * 0.5;
          break;

        case 3: // Swoop - charge then retreat
          const swoopCycle = e.patternTimer % 4;
          if (swoopCycle < 2) {
            // Charge fast
            vx = ux * speed * 2.0;
            vy = uy * speed * 2.0;
          } else {
            // Retreat slower
            vx = -ux * speed * 0.8;
            vy = -uy * speed * 0.8;
          }
          break;

        case 4: // Spiral inward
          const spiralAngle = Math.atan2(dy, dx) + Math.PI / 3;
          const spiralSpeed = speed * (0.8 + 0.4 * Math.sin(e.phase));
          vx = Math.cos(spiralAngle) * spiralSpeed;
          vy = Math.sin(spiralAngle) * spiralSpeed;
          break;
      }

      e.pos.x += vx * dt;
      e.pos.y += vy * dt;

      // Keep within cave bounds (circular)
      const cDx = e.pos.x - WORLD_CENTER.x;
      const cDy = e.pos.y - WORLD_CENTER.y;
      const cDist = Math.hypot(cDx, cDy);
      const maxDist = CAVE_RADIUS - e.radius - 5;
      if (cDist > maxDist) {
        e.pos.x = WORLD_CENTER.x + (cDx / cDist) * maxDist;
        e.pos.y = WORLD_CENTER.y + (cDy / cDist) * maxDist;
      }

      e.phase += dt * (2.4 + Math.random() * 0.5);
    });
  }

  _updateSnake(snake, dt) {
    if (snake.spawnInvuln > 0) snake.spawnInvuln -= dt;
    snake.patternTimer += dt;

    const head = snake.segments[0];
    const dx = this.ship.pos.x - head.x;
    const dy = this.ship.pos.y - head.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const sway = Math.sin(snake.patternTimer * 3.2 + snake.phase) * 2.0;
    const speed = snake.speed;
    const vx = ux * speed + (-uy) * sway;
    const vy = uy * speed + (ux) * sway;

    head.x += vx * dt;
    head.y += vy * dt;

    const cDx = head.x - WORLD_CENTER.x;
    const cDy = head.y - WORLD_CENTER.y;
    const cDist = Math.hypot(cDx, cDy);
    const maxDist = CAVE_RADIUS - snake.radius - 5;
    if (cDist > maxDist) {
      head.x = WORLD_CENTER.x + (cDx / cDist) * maxDist;
      head.y = WORLD_CENTER.y + (cDy / cDist) * maxDist;
    }

    for (let i = 1; i < snake.segments.length; i += 1) {
      const prev = snake.segments[i - 1];
      const seg = snake.segments[i];
      const sdx = prev.x - seg.x;
      const sdy = prev.y - seg.y;
      const sDist = Math.hypot(sdx, sdy) || 1;
      if (sDist > SNAKE_SEGMENT_SPACING) {
        const pull = sDist - SNAKE_SEGMENT_SPACING;
        seg.x += (sdx / sDist) * pull;
        seg.y += (sdy / sDist) * pull;
      }
    }

    snake.pos.x = head.x;
    snake.pos.y = head.y;
    snake.phase += dt * 2.2;
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

  _updateSquares(dt) {
    const alive = [];
    this.squareBursts.forEach((s) => {
      s.life -= dt;
      if (s.life <= 0) return;
      s.angle += s.angVel * dt;
      s.size *= s.growth;
      alive.push(s);
    });
    this.squareBursts = alive;
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
    if (enemy.size === 4) {
      this._spawnSquareBurst(enemy.pos);
    }
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

  _spawnSquareBurst(origin) {
    const count = 3 + Math.floor(Math.random() * 2); // 3-4 squares
    for (let i = 0; i < count; i += 1) {
      this.squareBursts.push({
        pos: { ...origin },
        size: 0.4 + Math.random() * 0.25,
        angle: Math.random() * Math.PI * 2,
        angVel: (Math.random() - 0.5) * 2.5,
        growth: 1.28 + Math.random() * 0.08,
        life: 1.6 + Math.random() * 0.6,
        color: [1.0, 0.9, 0.7],
      });
    }
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
