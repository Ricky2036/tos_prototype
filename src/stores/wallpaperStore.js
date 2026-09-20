import { defineStore } from 'pinia'

export const WALLPAPER_STORAGE_KEY = 'tos.personalization.wallpaper.v1'

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

export const useWallpaperStore = defineStore('wallpaper', {
  state: () => ({
    active: readSavedWallpaper()
  }),
  actions: {
    apply(url) {
      if (!url) return
      this.active = url
      const storage = getStorage()
      try { storage?.setItem(WALLPAPER_STORAGE_KEY, url) } catch {}
    },
    hydrate() {}
  }
})
