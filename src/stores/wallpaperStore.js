import { defineStore } from 'pinia'
import { getPresetDepthSubject } from '../composables/useDepthSegmentation.js'

export const WALLPAPER_STORAGE_KEY = 'tos.personalization.wallpaper.v1'
export const WALLPAPER_LOCK_STORAGE_KEY = 'tos.personalization.wallpaper.lock.v1'
export const WALLPAPER_HOME_STORAGE_KEY = 'tos.personalization.wallpaper.home.v1'
export const WALLPAPER_DEPTH_ENABLED_KEY = 'tos.personalization.wallpaper.depth_enabled.v1'
export const WALLPAPER_DEPTH_SUBJECT_KEY = 'tos.personalization.wallpaper.depth_subject.v1'
export const WALLPAPER_DEPTH_OCCLUSION_KEY = 'tos.personalization.wallpaper.depth_occlusion.v1'
export const DEFAULT_WALLPAPER = new URL('../assets/img/personalization/generated/abstract-geometric-cubes.png', import.meta.url).href
export const PRESET_WALLPAPERS = {
  'abstract-geometric-cubes': DEFAULT_WALLPAPER,
  'person-field': new URL('../assets/img/personalization/generated/person-field.jpg', import.meta.url).href,
  'nature-coast': new URL('../assets/img/personalization/generated/nature-coast.jpg', import.meta.url).href,
  'wallpaper-lock': new URL('../assets/img/wallpaper-lock.jpg', import.meta.url).href
}

export function normalizeWallpaperUrl(url) {
  if (!url || typeof url !== 'string') return ''
  for (const [baseId, presetUrl] of Object.entries(PRESET_WALLPAPERS)) {
    if (url.includes(baseId)) {
      return presetUrl
    }
  }
  if (url.startsWith('/src/') && !DEFAULT_WALLPAPER.includes('/src/')) {
    return DEFAULT_WALLPAPER
  }
  return url
}

export function resolveDepthSubjectUrl(lockWallpaper, savedSubject) {
  const presetForLock = lockWallpaper ? getPresetDepthSubject(lockWallpaper) : null
  if (presetForLock) {
    return presetForLock
  }
  if (!savedSubject || typeof savedSubject !== 'string') return ''
  const presetForSaved = getPresetDepthSubject(savedSubject)
  if (presetForSaved) {
    return presetForSaved
  }
  if (savedSubject.startsWith('/src/') && !DEFAULT_WALLPAPER.includes('/src/')) {
    return ''
  }
  return savedSubject
}

function getStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function readSavedWallpaper(key = WALLPAPER_STORAGE_KEY) {
  const storage = getStorage()
  if (!storage) return ''
  try {
    const value = storage.getItem(key)
    return typeof value === 'string' ? normalizeWallpaperUrl(value) : ''
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
    const savedActive = readSavedWallpaper(WALLPAPER_STORAGE_KEY)
    const savedLock = readSavedWallpaper(WALLPAPER_LOCK_STORAGE_KEY)
    const savedHome = readSavedWallpaper(WALLPAPER_HOME_STORAGE_KEY)

    const active = savedActive || DEFAULT_WALLPAPER
    const lockWallpaper = savedLock || active
    const homeWallpaper = savedHome || active

    const savedSubject = readSavedDepthSubject()
    const resolvedSubject = resolveDepthSubjectUrl(lockWallpaper, savedSubject)

    return {
      active,
      lockWallpaper,
      homeWallpaper,
      depthEnabled: readSavedDepthEnabled(),
      depthSubjectUrl: resolvedSubject,
      depthOcclusionRatio: readSavedDepthOcclusion(),
      isSegmenting: false
    }
  },
  actions: {
    apply(url, customSubjectUrl = undefined) {
      this.applyBoth(url, customSubjectUrl)
    },

    applyBoth(url, customSubjectUrl = undefined) {
      if (!url) return
      this.active = url
      this.lockWallpaper = url
      this.homeWallpaper = url

      const storage = getStorage()
      try {
        storage?.setItem(WALLPAPER_STORAGE_KEY, url)
        storage?.setItem(WALLPAPER_LOCK_STORAGE_KEY, url)
        storage?.setItem(WALLPAPER_HOME_STORAGE_KEY, url)
      } catch {}

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

    applyLock(url, customSubjectUrl = undefined) {
      if (!url) return
      this.lockWallpaper = url
      const storage = getStorage()
      try {
        storage?.setItem(WALLPAPER_LOCK_STORAGE_KEY, url)
      } catch {}

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

    applyHome(url) {
      if (!url) return
      this.homeWallpaper = url
      const storage = getStorage()
      try {
        storage?.setItem(WALLPAPER_HOME_STORAGE_KEY, url)
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
      const active = readSavedWallpaper(WALLPAPER_STORAGE_KEY)
      const lock = readSavedWallpaper(WALLPAPER_LOCK_STORAGE_KEY)
      const home = readSavedWallpaper(WALLPAPER_HOME_STORAGE_KEY)

      this.active = active || DEFAULT_WALLPAPER
      this.lockWallpaper = lock || this.active
      this.homeWallpaper = home || this.active

      this.depthEnabled = readSavedDepthEnabled()
      const savedSubject = readSavedDepthSubject()
      const resolvedSubject = resolveDepthSubjectUrl(this.lockWallpaper, savedSubject)
      this.depthSubjectUrl = resolvedSubject
      this.depthOcclusionRatio = readSavedDepthOcclusion()

      if (resolvedSubject !== savedSubject) {
        const storage = getStorage()
        try {
          storage?.setItem(WALLPAPER_DEPTH_SUBJECT_KEY, resolvedSubject)
        } catch {}
      }
    }
  }
})
