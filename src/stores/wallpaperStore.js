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

let appliedWallpaperUrl = ''
let lockScreenObserver = null

function syncLockScreenGlassImages(url) {
  if (typeof document === 'undefined' || !url) return
  const images = document.querySelectorAll('.lock-screen svg image')
  for (const image of images) {
    image.setAttribute('href', url)
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url)
  }
}

function syncWallpaperStyle(url) {
  if (typeof document === 'undefined') return
  appliedWallpaperUrl = url || ''
  let style = document.getElementById('tos-wallpaper-style')
  if (!style) {
    style = document.createElement('style')
    style.id = 'tos-wallpaper-style'
    document.head.appendChild(style)
  }
  style.textContent = url
    ? `.wallpaper,.ls-wallpaper{background-image:url("${url}") !important;}`
    : ''
  syncLockScreenGlassImages(url)
  if (!lockScreenObserver && typeof MutationObserver !== 'undefined') {
    lockScreenObserver = new MutationObserver(() => syncLockScreenGlassImages(appliedWallpaperUrl))
    lockScreenObserver.observe(document.documentElement, { childList: true, subtree: true })
  }
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
