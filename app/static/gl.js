export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

export function createProgram(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }
  return program;
}

export function ortho(left, right, bottom, top, near = -1, far = 1) {
  const rl = 1 / (right - left);
  const tb = 1 / (top - bottom);
  const fn = 1 / (far - near);
  return new Float32Array([
    2 * rl, 0, 0, 0,
    0, 2 * tb, 0, 0,
    0, 0, -2 * fn, 0,
    -(right + left) * rl, -(top + bottom) * tb, -(far + near) * fn, 1,
  ]);
}

export function setUniformMat4(gl, location, matrix) {
  gl.uniformMatrix4fv(location, false, matrix);
}

export function createBuffer(gl, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Failed to create buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  return buffer;
}

export function resizeCanvasToDisplaySize(canvas) {
  const width = canvas.clientWidth * window.devicePixelRatio;
  const height = canvas.clientHeight * window.devicePixelRatio;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}
