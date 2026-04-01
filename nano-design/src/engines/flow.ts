import { FlowParams } from '@/types'

const VERT_SHADER = `#version 300 es
out vec2 vUV;
void main() {
  float x = float((gl_VertexID & 1) << 2);
  float y = float((gl_VertexID >> 1 & 1) << 2);
  vUV = vec2(x * 0.5, 1.0 - y * 0.5);
  gl_Position = vec4(x - 1.0, y - 1.0, 0.0, 1.0);
}
`

const FRAG_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uComplexity;
uniform float uSharpness;
uniform float uYStart;
uniform float uSpeed;
uniform float uMaskAngle;
uniform float uWaveAngle;
uniform float uSpacerY;
uniform float uSpacerSize;
uniform float uSpacerFeather;

in vec2 vUV;
out vec4 fragColor;

void main() {
    // Mask rotation
    float mc = cos(uMaskAngle);
    float ms = sin(uMaskAngle);
    mat2 maskRot = mat2(mc, -ms, ms, mc);

    // Wave rotation
    float wc = cos(uWaveAngle);
    float ws = sin(uWaveAngle);
    mat2 waveRot = mat2(wc, -ws, ws, wc);

    vec2 centeredUv = vUV - vec2(0.5);
    vec2 maskUv = maskRot * centeredUv + vec2(0.5);
    vec2 waveUv = waveRot * centeredUv + vec2(0.5);

    // Top safe area mask
    float topMask = smoothstep(uYStart, uYStart - 0.2, maskUv.y);

    // Spacer mask
    float distToSpacer = abs(maskUv.y - uSpacerY);
    float halfSize = uSpacerSize * 0.5;
    float spacerMask = smoothstep(halfSize, halfSize + uSpacerFeather, distToSpacer);

    float finalMask = topMask * spacerMask;

    // Wave calculation
    float time = uTime * uSpeed;

    float baseWave = sin(waveUv.y * uFrequency + time);
    float shapedWave = sign(baseWave) * pow(abs(baseWave), uSharpness);

    float complexWave = sin(waveUv.y * uFrequency * uComplexity - time * 0.8);
    shapedWave += sign(complexWave) * pow(abs(complexWave), uSharpness * 1.5) * 0.4;

    vec2 waveDir = vec2(wc, ws);
    vec2 finalUv = vUV + waveDir * (shapedWave * uAmplitude * finalMask);

    fragColor = texture(uTexture, finalUv);
}
`

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Flow shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export interface FlowEngine {
  render: (params: FlowParams, advanceTime?: boolean) => void
  setTime: (t: number) => void
  resize: (w: number, h: number) => void
  setTexture: (source: TexImageSource) => void
  copyTo2D: (ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) => void
  destroy: () => void
  canvas: HTMLCanvasElement
}

export function createFlowEngine(): FlowEngine | null {
  const canvas = document.createElement('canvas')
  const _gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false })
  if (!_gl) return null
  const gl = _gl

  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SHADER)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER)
  if (!vert || !frag) return null

  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Flow program link error:', gl.getProgramInfoLog(program))
    return null
  }

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  // 创建纹理对象
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const loc = {
    uTexture: gl.getUniformLocation(program, 'uTexture'),
    uTime: gl.getUniformLocation(program, 'uTime'),
    uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
    uFrequency: gl.getUniformLocation(program, 'uFrequency'),
    uComplexity: gl.getUniformLocation(program, 'uComplexity'),
    uSharpness: gl.getUniformLocation(program, 'uSharpness'),
    uYStart: gl.getUniformLocation(program, 'uYStart'),
    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
    uMaskAngle: gl.getUniformLocation(program, 'uMaskAngle'),
    uWaveAngle: gl.getUniformLocation(program, 'uWaveAngle'),
    uSpacerY: gl.getUniformLocation(program, 'uSpacerY'),
    uSpacerSize: gl.getUniformLocation(program, 'uSpacerSize'),
    uSpacerFeather: gl.getUniformLocation(program, 'uSpacerFeather'),
  }

  let animTime = 0
  let lastFrameTime = performance.now()

  function setTexture(source: TexImageSource) {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  }

  function setTime(t: number) {
    animTime = t
  }

  function render(params: FlowParams, advanceTime = true) {
    if (advanceTime) {
      const now = performance.now()
      animTime += ((now - lastFrameTime) / 1000) * params.speed
      lastFrameTime = now
    } else {
      lastFrameTime = performance.now()
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(loc.uTexture, 0)

    gl.uniform1f(loc.uTime, animTime)
    gl.uniform1f(loc.uAmplitude, params.amplitude)
    gl.uniform1f(loc.uFrequency, params.frequency)
    gl.uniform1f(loc.uComplexity, params.complexity)
    gl.uniform1f(loc.uSharpness, params.sharpness)
    gl.uniform1f(loc.uYStart, params.yStart)
    gl.uniform1f(loc.uSpeed, params.speed)
    gl.uniform1f(loc.uMaskAngle, params.maskAngle * Math.PI / 180.0)
    gl.uniform1f(loc.uWaveAngle, params.waveAngle * Math.PI / 180.0)
    gl.uniform1f(loc.uSpacerY, params.spacerY)
    gl.uniform1f(loc.uSpacerSize, params.spacerSize)
    gl.uniform1f(loc.uSpacerFeather, params.spacerFeather)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function resize(w: number, h: number) {
    canvas.width = w
    canvas.height = h
  }

  function copyTo2D(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) {
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, dx, dy, dw, dh)
  }

  function destroy() {
    gl.deleteTexture(texture)
    gl.deleteProgram(program)
    gl.deleteShader(vert)
    gl.deleteShader(frag)
    if (vao) gl.deleteVertexArray(vao)
  }

  return { render, setTime, resize, setTexture, copyTo2D, destroy, canvas }
}
