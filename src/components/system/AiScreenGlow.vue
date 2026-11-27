<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  cornerRadius: {
    type: Number,
    default: 36
  }
})

const canvasRef = ref(null)
const isRendered = ref(false)
const canvasOpacity = ref(0)

let gl = null
let program = null
let posBuffer = null
let uniforms = null
let ctx2d = null
let rafId = 0
let resizeObs = null

let phase = 'idle' // 'idle' | 'in' | 'out'
let animStartMs = 0
let outroStartMs = 0
let logicalW = 360
let logicalH = 788

// 11 锚点频率与相位，移植自 Aurora (tornikegomareli/Aurora) & iOS EdgeLight 物理调色逻辑
const ANCHOR_FREQ = [
  [0.31, 0.27], [0.43, 0.19], [0.17, 0.37],
  [0.29, 0.23], [0.41, 0.31], [0.19, 0.43],
  [0.37, 0.17], [0.23, 0.29], [0.31, 0.41],
  [0.27, 0.19], [0.43, 0.37]
]
const ANCHOR_PHASE = [
  [0.0, 1.7], [1.3, 0.4], [2.1, 2.6],
  [0.7, 1.1], [2.8, 0.2], [1.8, 2.3],
  [0.3, 1.5], [2.5, 0.8], [1.2, 2.0],
  [0.5, 1.9], [2.7, 0.6]
]
const anchorBuf = new Float32Array(22)

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG_SRC = `
precision highp float;

varying vec2 vUv;

uniform vec2 uSize;
uniform float uTime;
uniform float uBurstElapsed;
uniform float uOutroAlpha;
uniform float uCornerRadius;
uniform vec2 uAnchors[11];

// 3D procedural gradient noise + FBM (ported from AuroraGlow.metal / Apple EdgeLight technique)
vec3 hash33(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7,  74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradientNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
          dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
          dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x),
      u.y
    ),
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
          dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
          dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x),
      u.y
    ),
    u.z
  );
}

float fbm3D(vec3 p) {
  float v = 0.0;
  float a = 0.6;
  v += a * gradientNoise3D(p);
  p *= 2.08;
  a *= 0.55;
  v += a * gradientNoise3D(p);
  return v;
}

float roundedRectSDF(vec2 p, vec2 halfSize, float cornerRadius) {
  vec2 q = abs(p) - halfSize + vec2(cornerRadius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
}

// Apple Intelligence 四色循环调色板 (琉璃紫 / 天青蓝 / 霓虹粉 / 柔香槟橙)
vec3 anchorColorAt(int i) {
  vec3 cA = vec3(0.56, 0.50, 1.00); // 琉璃幻紫
  vec3 cB = vec3(0.10, 0.72, 1.00); // 晴空青蓝
  vec3 cC = vec3(0.96, 0.42, 0.74); // 樱霓玫粉
  vec3 cD = vec3(1.00, 0.72, 0.42); // 柔光香槟橙
  if (i == 0) return cA;
  if (i == 1) return cC;
  if (i == 2) return cD;
  if (i == 3) return cB;
  if (i == 4) return cD;
  if (i == 5) return cA;
  if (i == 6) return cC;
  if (i == 7) return cB;
  if (i == 8) return cC;
  if (i == 9) return cD;
  return cA;
}

vec3 intelligenceLightColor(vec2 pos, float reach, float satBoost) {
  // 通透冰蓝天青底场（浅色底面上更清亮通透，无浑浊暖褐感）
  vec3 col = vec3(0.28, 0.74, 1.00);
  for (int i = 0; i < 11; i++) {
    float d = length(uAnchors[i] - pos) / reach;
    float fall = clamp(1.0 - d, 0.0, 1.0);
    float t = fall * fall * (3.0 - 2.0 * fall);
    col = mix(col, anchorColorAt(i), t);
  }
  col = min(col, vec3(1.0));
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, 1.18 + satBoost * 0.42);
  return clamp(col, 0.0, 1.0);
}

void main() {
  // 统一左上角为原点的像素坐标
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 pos = uv * uSize;
  vec2 center = uSize * 0.5;
  vec2 p = pos - center;
  float maxDim = max(uSize.x, uSize.y);

  // 3D 流体噪声随时间平稳推进，驱动全屏流动极光带与内涌波浪
  float noiseSpeed = 0.62 + 0.65 * exp(-uBurstElapsed * 1.1);
  vec2 normUv = pos / maxDim;
  float n1 = fbm3D(vec3(normUv * 2.1 + vec2(uTime * 0.18, -uTime * 0.14), uTime * noiseSpeed));
  float n2 = gradientNoise3D(vec3(normUv * 3.8 + vec2(9.2 - uTime * 0.22, 4.7 + uTime * 0.18), uTime * noiseSpeed * 0.72));
  float waveVal = n1 * 0.68 + n2 * 0.36;

  // 1) 双重斜向全屏扫光脉冲 + 3D 流体波纹扰动（全屏流动视觉核心）
  vec2 sweepDir = normalize(vec2(-0.80, -0.60));
  float proj = dot(uv - vec2(0.5), sweepDir) + waveVal * 0.08;
  float sweepCenter1 = 0.78 - uBurstElapsed * 1.18;
  float sweepDist1 = abs(proj - sweepCenter1);
  float sweepPulse1 = exp(-sweepDist1 * sweepDist1 * 9.0);

  float sweepCenter2 = 1.48 - uBurstElapsed * 1.05;
  float sweepDist2 = abs(proj - sweepCenter2);
  float sweepPulse2 = exp(-sweepDist2 * sweepDist2 * 7.5) * 0.85;

  // 2) 径向冲击波环（类 Apple EdgeLight burst ring：从右侧伴随按钮触发扩散至全屏）
  vec2 burstOrigin = vec2(uSize.x * 0.85, uSize.y * 0.74);
  float radialDist = length(pos - burstOrigin) / maxDim + waveVal * 0.035;
  float ringRadius = uBurstElapsed * 0.96;
  float ringWave = exp(-pow((radialDist - ringRadius) * 4.8, 2.0)) * exp(-uBurstElapsed * 0.35);

  // 3) 全屏动态流体极光薄纱（像原型般覆盖全屏，同时在扫光波峰之外保留适度轻透度，保障文字清晰）
  float auroraRibbon = 0.5 + 0.5 * sin(normUv.x * 4.5 - normUv.y * 3.4 - uTime * 2.8 + waveVal * 3.8);
  float secondaryRibbon = 0.5 + 0.5 * cos(normUv.x * 2.9 + normUv.y * 4.4 + uTime * 2.1 - waveVal * 3.0);
  float fullScreenWash = 0.12 + 0.10 * auroraRibbon + 0.07 * secondaryRibbon + 0.06 * clamp(waveVal * 0.5 + 0.5, 0.0, 1.0);

  // 4) 宽柔向内涌动的内边缘光晕（无生硬彩边线条，平滑羽化融入全屏极光）
  float introGrowth = 1.0 - pow(1.0 - clamp(uBurstElapsed / 0.34, 0.0, 1.0), 3.0);
  float distRaw = roundedRectSDF(p, center, uCornerRadius);
  float flameAmp = 0.42 + 0.38 * exp(-uBurstElapsed * 1.15);
  float glowReach = maxDim * 0.175 * introGrowth;
  float distWarped = distRaw + waveVal * glowReach * flameAmp;
  float absDist = min(abs(distRaw), abs(distWarped));

  float softEdge = smoothstep(glowReach * 1.4, 0.0, absDist) * 0.42;
  float innerRim = smoothstep(glowReach * 0.48, 0.0, absDist) * 0.24;
  float edgeGlow = (softEdge + innerRim) * (0.76 + 0.34 * (waveVal * 0.5 + 0.5));

  float activeWave = max(sweepPulse1, sweepPulse2) * (0.72 + 0.28 * (waveVal * 0.5 + 0.5));
  float combinedIntensity = fullScreenWash * introGrowth + activeWave * 0.28 + ringWave * 0.26 + edgeGlow;

  // 屏幕正中心适度收轻底雾（扫光波穿过时仍明显提亮），保证文章和聊天文字通透锐利
  float centerDist = length((uv - 0.5) * vec2(1.0, uSize.y / max(uSize.x, 1.0)));
  float centerWeight = mix(0.62, 1.0, smoothstep(0.06, 0.56, centerDist));
  combinedIntensity = clamp(combinedIntensity * centerWeight + activeWave * 0.10, 0.0, 0.68);

  // 高保真 11 锚点液态色场采样
  vec2 warpedPos = pos + vec2(waveVal * maxDim * 0.07, -waveVal * maxDim * 0.06);
  vec3 fieldColor = intelligenceLightColor(warpedPos, maxDim * 0.64, max(activeWave, ringWave));

  // 中央与波峰叠加冰透极光高光，外缘保留饱满多色极光色阶
  float waveHighlight = clamp(pow(activeWave, 1.8) + ringWave * 0.7, 0.0, 1.0);
  vec3 airyTint = mix(fieldColor, vec3(0.82, 0.94, 1.00), 0.24 * (1.0 - smoothstep(0.0, 0.6, centerDist)));
  vec3 waveTint = mix(airyTint, vec3(0.88, 0.96, 1.00), 0.42 * waveHighlight);
  vec3 finalColor = mix(waveTint, min(fieldColor * 1.08, vec3(1.0)), clamp(edgeGlow * 0.85, 0.0, 1.0));

  float introFade = smoothstep(0.0, 0.20, uBurstElapsed);
  float alpha = combinedIntensity * introFade * uOutroAlpha;

  gl_FragColor = vec4(finalColor * alpha, alpha);
}
`

function computeAnchors(time, burstElapsed, width, height) {
  const kBurstDur = 3.2
  let ampScale = 1.0
  let speedScale = 1.0
  let extra = 0.0
  if (burstElapsed >= 0 && burstElapsed < kBurstDur) {
    const d = Math.exp(-burstElapsed * 1.15)
    ampScale = 1.0 + 0.32 * d * Math.cos(burstElapsed * Math.PI * 2 * 1.25)
    speedScale = 1.0 + 1.85 * Math.exp(-burstElapsed * 1.35)
    extra = (1.0 - Math.exp(-burstElapsed * 1.35)) * Math.PI * 2.0
  }
  const t = time * speedScale + extra
  const amp = Math.min(0.49, 0.43 * ampScale)
  for (let i = 0; i < 11; i++) {
    const [fx, fy] = ANCHOR_FREQ[i]
    const [px, py] = ANCHOR_PHASE[i]
    anchorBuf[i * 2] = (0.5 + amp * Math.sin(t * fx * 1.65 + px)) * width
    anchorBuf[i * 2 + 1] = (0.5 + amp * Math.cos(t * fy * 1.65 + py)) * height
  }
}

function compileShader(type, src) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function initRenderer() {
  const canvas = canvasRef.value
  if (!canvas) return

  const opts = {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true
  }
  gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts)

  if (gl) {
    const vs = compileShader(gl.VERTEX_SHADER, VERT_SRC)
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC)
    if (vs && fs) {
      program = gl.createProgram()
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        posBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW
        )
        const aPosLoc = gl.getAttribLocation(program, 'aPos')
        gl.enableVertexAttribArray(aPosLoc)
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0)

        uniforms = {
          uSize: gl.getUniformLocation(program, 'uSize'),
          uTime: gl.getUniformLocation(program, 'uTime'),
          uBurstElapsed: gl.getUniformLocation(program, 'uBurstElapsed'),
          uOutroAlpha: gl.getUniformLocation(program, 'uOutroAlpha'),
          uCornerRadius: gl.getUniformLocation(program, 'uCornerRadius'),
          uAnchors: gl.getUniformLocation(program, 'uAnchors[0]')
        }
        gl.clearColor(0, 0, 0, 0)
        return
      }
    }
    gl = null
    program = null
  }

  ctx2d = canvas.getContext('2d')
}

function syncCanvasSize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  logicalW = rect.width
  logicalH = rect.height
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const targetW = Math.max(1, Math.round(rect.width * dpr))
  const targetH = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW
    canvas.height = targetH
  }
}

function render2DFallback(time, burstElapsed, outroAlpha) {
  if (!ctx2d || !canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  ctx2d.clearRect(0, 0, w, h)
  computeAnchors(time, burstElapsed, w, h)

  const intro = Math.min(1, burstElapsed / 0.25)
  ctx2d.save()
  ctx2d.globalAlpha = intro * outroAlpha * 0.42
  const colors = [
    'rgba(0, 150, 255, 0.55)',
    'rgba(188, 100, 255, 0.5)',
    'rgba(255, 65, 130, 0.42)',
    'rgba(255, 155, 45, 0.42)'
  ]
  for (let i = 0; i < 4; i++) {
    const cx = anchorBuf[i * 4]
    const cy = anchorBuf[i * 4 + 1]
    const rad = Math.max(w, h) * 0.72
    const g = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, rad)
    g.addColorStop(0, colors[i])
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx2d.fillStyle = g
    ctx2d.fillRect(0, 0, w, h)
  }
  ctx2d.restore()
}

function renderFrame(nowMs) {
  if (phase === 'idle') {
    rafId = 0
    return
  }

  syncCanvasSize()
  const burstElapsed = Math.max(0, (nowMs - animStartMs) / 1000)
  const time = burstElapsed * 1.15 + 1.4

  let outroAlpha = 1.0
  if (phase === 'out') {
    const outProgress = Math.min(1, (nowMs - outroStartMs) / 420)
    outroAlpha = 1.0 - outProgress
    if (outProgress >= 1) {
      phase = 'idle'
      isRendered.value = false
      canvasOpacity.value = 0
      rafId = 0
      return
    }
  }

  canvasOpacity.value = 1

  if (gl && program) {
    const canvas = canvasRef.value
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    computeAnchors(time, burstElapsed, logicalW, logicalH)
    gl.uniform2f(uniforms.uSize, logicalW, logicalH)
    gl.uniform1f(uniforms.uTime, time)
    gl.uniform1f(uniforms.uBurstElapsed, burstElapsed)
    gl.uniform1f(uniforms.uOutroAlpha, outroAlpha)
    gl.uniform1f(uniforms.uCornerRadius, props.cornerRadius)
    gl.uniform2fv(uniforms.uAnchors, anchorBuf)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  } else {
    render2DFallback(time, burstElapsed, outroAlpha)
  }

  rafId = window.requestAnimationFrame(renderFrame)
}

function startAnimation() {
  isRendered.value = true
  phase = 'in'
  animStartMs = performance.now()
  if (!rafId) {
    rafId = window.requestAnimationFrame(renderFrame)
  }
}

function stopAnimation() {
  if (phase === 'idle') return
  // 停止每帧 WebGL 重绘，仅通过纯合成层 CSS opacity 淡出，避免与面板展开动画争抢 GPU 合成
  phase = 'out'
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }
  canvasOpacity.value = 0
  window.setTimeout(() => {
    if (phase === 'out') {
      phase = 'idle'
      isRendered.value = false
    }
  }, 340)
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      startAnimation()
    } else {
      stopAnimation()
    }
  }
)

onMounted(() => {
  initRenderer()
  syncCanvasSize()
  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    resizeObs = new ResizeObserver(() => {
      syncCanvasSize()
    })
    resizeObs.observe(canvasRef.value)
  }
  if (props.active) {
    startAnimation()
  }
})

onBeforeUnmount(() => {
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }
  resizeObs?.disconnect()
  resizeObs = null
  if (gl) {
    if (posBuffer) gl.deleteBuffer(posBuffer)
    if (program) gl.deleteProgram(program)
    gl = null
    program = null
  }
})

const canvasStyle = computed(() => ({
  opacity: canvasOpacity.value
}))
</script>

<template>
  <div
    class="ai-screen-glow"
    :class="{ 'is-active': active, 'is-visible': isRendered }"
    aria-hidden="true"
  >
    <canvas ref="canvasRef" class="ai-glow-canvas" :style="canvasStyle"></canvas>
  </div>
</template>

<style scoped>
.ai-screen-glow {
  position: absolute;
  inset: 0;
  z-index: 81;
  pointer-events: none;
  border-radius: inherit;
  overflow: hidden;
  visibility: hidden;
}

.ai-screen-glow.is-visible {
  visibility: visible;
}

.ai-glow-canvas {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: inherit;
  will-change: opacity;
  transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
