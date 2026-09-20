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

function syncWallpaperStyle(url) {
  if (typeof document === 'undefined') return
  let style = document.getElementById('tos-wallpaper-style')
  if (!style) {
    style = document.createElement('style')
    style.id = 'tos-wallpaper-style'
    document.head.appendChild(style)
  }
  style.textContent = url
    ? `.wallpaper,.ls-wallpaper{background-image:url("${url}") !important;}`
    : ''
}

// SettingsApp imports this module during app startup, so a previously applied
// wallpaper is restored before the first lock-screen or desktop paint.
syncWallpaperStyle(readSavedWallpaper())

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
      syncWallpaperStyle(url)
    },
    hydrate() {
      if (this.active) syncWallpaperStyle(this.active)
    }
  }
})

export { syncWallpaperStyle }
