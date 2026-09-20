import { defineStore } from 'pinia'
import { getPresetDepthSubject } from '../composables/useDepthSegmentation.js'

export const WALLPAPER_STORAGE_KEY = 'tos.personalization.wallpaper.v1'
export const WALLPAPER_DEPTH_ENABLED_KEY = 'tos.personalization.wallpaper.depth_enabled.v1'
export const WALLPAPER_DEPTH_SUBJECT_KEY = 'tos.personalization.wallpaper.depth_subject.v1'
export const WALLPAPER_DEPTH_OCCLUSION_KEY = 'tos.personalization.wallpaper.depth_occlusion.v1'

function getStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function readSavedWallpaper() {
  const storage = getStorage()
  if (!storage) return ''
  try {
    const value = storage.getItem(WALLPAPER_STORAGE_KEY)
    return typeof value === 'string' ? value : ''
  } catch {
    return ''
  }
}

function readSavedDepthEnabled() {
  const storage = getStorage()
  if (!storage) return true
  try {
    const value = storage.getItem(WALLPAPER_DEPTH_ENABLED_KEY)
    return value === null ? true : value === 'true'
  } catch {
    return true
  }
}

function readSavedDepthSubject() {
  const storage = getStorage()
  if (!storage) return ''
  try {
    const value = storage.getItem(WALLPAPER_DEPTH_SUBJECT_KEY)
    return typeof value === 'string' ? value : ''
  } catch {
    return ''
  }
}

function readSavedDepthOcclusion() {
  const storage = getStorage()
  if (!storage) return 0
  try {
    const value = storage.getItem(WALLPAPER_DEPTH_OCCLUSION_KEY)
    return value ? parseFloat(value) || 0 : 0
  } catch {
    return 0
  }
}

export const useWallpaperStore = defineStore('wallpaper', {
  state: () => {
    const active = readSavedWallpaper()
    const savedSubject = readSavedDepthSubject()
    // 若存储中无显式主体，但激活的壁纸命中内置预置主体，则自动匹配
    const resolvedSubject = savedSubject || (active ? (getPresetDepthSubject(active) || '') : '')

    return {
      active,
      depthEnabled: readSavedDepthEnabled(),
      depthSubjectUrl: resolvedSubject,
      depthOcclusionRatio: readSavedDepthOcclusion(),
      isSegmenting: false
    }
  },
  actions: {
    apply(url, customSubjectUrl = undefined) {
      if (!url) return
      this.active = url
      const storage = getStorage()
      try { storage?.setItem(WALLPAPER_STORAGE_KEY, url) } catch {}

      // 更新景深主体
      if (customSubjectUrl !== undefined) {
        this.depthSubjectUrl = customSubjectUrl || ''
      } else {
        const preset = getPresetDepthSubject(url)
        this.depthSubjectUrl = preset || ''
      }

      try {
        storage?.setItem(WALLPAPER_DEPTH_SUBJECT_KEY, this.depthSubjectUrl)
      } catch {}
    },

    setDepthEnabled(enabled) {
      this.depthEnabled = !!enabled
      const storage = getStorage()
      try {
        storage?.setItem(WALLPAPER_DEPTH_ENABLED_KEY, String(this.depthEnabled))
      } catch {}
    },

    setDepthSubject(subjectUrl, occlusionRatio = 0) {
      this.depthSubjectUrl = subjectUrl || ''
      this.depthOcclusionRatio = occlusionRatio
      const storage = getStorage()
      try {
        storage?.setItem(WALLPAPER_DEPTH_SUBJECT_KEY, this.depthSubjectUrl)
        storage?.setItem(WALLPAPER_DEPTH_OCCLUSION_KEY, String(occlusionRatio))
      } catch {}
    },

    setIsSegmenting(val) {
      this.isSegmenting = !!val
    },

    hydrate() {
      const active = readSavedWallpaper()
      if (active) this.active = active

      this.depthEnabled = readSavedDepthEnabled()
      const savedSubject = readSavedDepthSubject()
      this.depthSubjectUrl = savedSubject || (this.active ? (getPresetDepthSubject(this.active) || '') : '')
      this.depthOcclusionRatio = readSavedDepthOcclusion()
    }
  }
})
