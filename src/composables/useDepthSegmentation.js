import { ref } from 'vue'

// 静态预置主体映射表（金毛犬、猫咪等零延迟瞬间渲染）
const presetSubjectUrls = (typeof import.meta !== 'undefined' && typeof import.meta.glob === 'function')
  ? import.meta.glob('../assets/img/personalization/generated/*-subject.png', {
      eager: true,
      query: '?url',
      import: 'default'
    })
  : {}

// 预置备用映射表（Node.js 测试环境回退）
const FALLBACK_PRESETS = {
  'abstract-geometric-cubes': '/src/assets/img/personalization/generated/abstract-geometric-cubes-subject.png',
  'person-field': '/src/assets/img/personalization/generated/person-field-subject.png'
}

// 缓存已解析的主体映射
const subjectCache = new Map()

// 初始化预置映射
for (const [path, url] of Object.entries(presetSubjectUrls)) {
  const match = path.match(/\/([^/]+)-subject\.png$/)
  if (match) {
    const baseId = match[1] // 例如 'pet-golden-retriever'
    subjectCache.set(baseId, url)
  }
}

/**
 * 依据壁纸 URL 判断是否命中内置精装景深壁纸
 * @param {string} wallpaperUrl
 * @returns {string|null}
 */
export function getPresetDepthSubject(wallpaperUrl) {
  if (!wallpaperUrl || typeof wallpaperUrl !== 'string') return null
  for (const [baseId, subjectUrl] of subjectCache.entries()) {
    if (wallpaperUrl.includes(baseId)) {
      return subjectUrl
    }
  }
  for (const [baseId, subjectUrl] of Object.entries(FALLBACK_PRESETS)) {
    if (wallpaperUrl.includes(baseId)) {
      return subjectUrl
    }
  }
  return null
}

/**
 * 计算前景蒙版在时钟区域的遮挡率
 * @param {Uint8ClampedArray|Float32Array} mask - Alpha 通道或置信度数组
 * @param {number} maskW - 蒙版宽
 * @param {number} maskH - 蒙版高
 * @param {{ top: number, left: number, width: number, height: number }} clockBox - 相对 360x788 屏幕的时钟坐标
 * @param {{ width: number, height: number }} screenSize
 * @returns {number} 0..1 之间的遮挡比例
 */
export function computeClockOcclusionRatio(mask, maskW, maskH, clockBox = { top: 77, left: 27, width: 306, height: 110 }, screenSize = { width: 360, height: 788 }) {
  if (!mask || maskW <= 0 || maskH <= 0) return 0

  const startX = Math.max(0, Math.floor((clockBox.left / screenSize.width) * maskW))
  const endX = Math.min(maskW, Math.ceil(((clockBox.left + clockBox.width) / screenSize.width) * maskW))
  const startY = Math.max(0, Math.floor((clockBox.top / screenSize.height) * maskH))
  const endY = Math.min(maskH, Math.ceil(((clockBox.top + clockBox.height) / screenSize.height) * maskH))

  let totalClockPixels = (endX - startX) * (endY - startY)
  if (totalClockPixels <= 0) return 0

  let occludedPixels = 0
  const isAlphaByte = mask instanceof Uint8ClampedArray || mask instanceof Uint8Array

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = y * maskW + x
      const val = isAlphaByte ? mask[idx * 4 + 3] : mask[idx]
      const threshold = isAlphaByte ? 128 : 0.4
      if (val >= threshold) {
        occludedPixels++
      }
    }
  }

  return occludedPixels / totalClockPixels
}

let visionPromise = null
let segmenterPromise = null

async function getSegmenter() {
  if (segmenterPromise) return segmenterPromise

  segmenterPromise = (async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null
    }

    try {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs')
      const wasmFileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
      const segmenter = await vision.ImageSegmenter.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE',
        outputCategoryMask: false,
        outputConfidenceMasks: true
      })
      return segmenter
    } catch (err) {
      console.warn('[useDepthSegmentation] Failed to load MediaPipe segmenter:', err)
      return null
    }
  })()

  return segmenterPromise
}

export function useDepthSegmentation() {
  const isAnalyzing = ref(false)
  const lastError = ref(null)

  /**
   * 自动抠出图片的主体前景并生成透明 PNG
   * @param {string|File|Blob|HTMLImageElement} inputSource
   * @returns {Promise<{ subjectUrl: string, occlusionRatio: number, isSafe: boolean }>}
   */
  async function segmentImage(inputSource) {
    isAnalyzing.value = true
    lastError.value = null

    try {
      // 1. 若为 URL 字符串，先检查是否命中预置壁纸
      if (typeof inputSource === 'string') {
        const preset = getPresetDepthSubject(inputSource)
        if (preset) {
          isAnalyzing.value = false
          return {
            subjectUrl: preset,
            occlusionRatio: 0.18, // 预置宠物壁纸经过调校，耳朵微遮挡约 18%
            isSafe: true
          }
        }
      }

      // 2. Node 环境或 SSR 降级
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        isAnalyzing.value = false
        return { subjectUrl: '', occlusionRatio: 0, isSafe: true }
      }

      // 3. 准备 HTMLImageElement
      let img = null
      if (inputSource instanceof HTMLImageElement) {
        img = inputSource
      } else {
        img = new Image()
        img.crossOrigin = 'anonymous'
        if (typeof inputSource === 'string') {
          img.src = inputSource
        } else if (inputSource instanceof Blob || inputSource instanceof File) {
          img.src = URL.createObjectURL(inputSource)
        }
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
      }

      // 4. 调用 MediaPipe 进行前景分割
      const segmenter = await getSegmenter()
      if (!segmenter) {
        throw new Error('AI 分割引擎未能成功就绪')
      }

      const result = segmenter.segment(img)
      const masks = result.confidenceMasks
      if (!masks || masks.length < 2) {
        throw new Error('未能从画面中检测出明确的主体')
      }

      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, w, h)
      const pixels = imgData.data

      // 检查 labels，优先选用人像（person）或常见宠物（dog/cat）
      const labels = typeof segmenter.getLabels === 'function' ? segmenter.getLabels() : []
      let bestMask = null
      let bestSum = 0

      if (Array.isArray(labels) && labels.length > 0) {
        for (let i = 0; i < labels.length; i++) {
          const l = String(labels[i]).toLowerCase()
          if (l === 'person' || l === 'dog' || l === 'cat') {
            if (masks[i]) {
              const maskArr = masks[i].getAsFloat32Array()
              let sum = 0
              for (let j = 0; j < maskArr.length; j += 64) sum += maskArr[j]
              if (sum > bestSum && sum > 20) {
                bestSum = sum
                bestMask = maskArr
              }
            }
          }
        }
      }

      // 若未通过优先标签匹配到显著主体，则选择非背景中置信度最高的主体
      if (!bestMask) {
        for (let i = 1; i < masks.length; i++) {
          const maskArr = masks[i].getAsFloat32Array()
          let sum = 0
          for (let j = 0; j < maskArr.length; j += 64) sum += maskArr[j]
          if (sum > bestSum) {
            bestSum = sum
            bestMask = maskArr
          }
        }
      }

      if (!bestMask) {
        throw new Error('未发现显著前景主体')
      }

      const maskW = masks[0].width
      const maskH = masks[0].height

      // 计算时钟遮挡率
      const occlusionRatio = computeClockOcclusionRatio(bestMask, maskW, maskH)
      const isSafe = occlusionRatio <= 0.50

      // 将蒙版映射到图像并进行软边羽化
      for (let y = 0; y < h; y++) {
        const my = Math.floor((y / h) * maskH)
        for (let x = 0; x < w; x++) {
          const mx = Math.floor((x / w) * maskW)
          const conf = bestMask[my * maskW + mx]
          let alpha = 0
          if (conf > 0.65) {
            alpha = 1
          } else if (conf > 0.2) {
            // 边缘软化过渡
            alpha = (conf - 0.2) / 0.45
          }
          const idx = (y * w + x) * 4
          pixels[idx + 3] = Math.round(pixels[idx + 3] * alpha)
        }
      }

      ctx.putImageData(imgData, 0, 0)
      const subjectUrl = canvas.toDataURL('image/png')

      isAnalyzing.value = false
      return {
        subjectUrl,
        occlusionRatio,
        isSafe
      }
    } catch (err) {
      console.error('[useDepthSegmentation] Segmentation failed:', err)
      lastError.value = err.message
      isAnalyzing.value = false
      return {
        subjectUrl: '',
        occlusionRatio: 0,
        isSafe: true,
        error: err.message
      }
    }
  }

  return {
    isAnalyzing,
    lastError,
    segmentImage,
    getPresetDepthSubject
  }
}
