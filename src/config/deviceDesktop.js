import { ref, shallowRef } from 'vue'

export const formMetrics = shallowRef(null)
export const formMoving = ref(false)
const formQuery = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
export const modernWidgets = formQuery.get('widgets') !== 'legacy'
export const wideMode = ref(formQuery.get('form') === 'wide')
const nativeAssets = {
  gemini: 'gemini.png', hola: 'hola.png', phone: 'phone.png', camera: 'camera.png',
  chrome: 'chrome.png', settings: 'settings.png', 'phone-master': 'phone-master.svg',
  'suggestion-switch': 'suggestion-switch.png', 'suggestion-tips': 'suggestion-tips.png',
  'suggestion-weather': 'suggestion-weather.svg'
}

const exportedArtwork = import.meta.env
  ? import.meta.glob('../../scripts/preview-wide/wide-home-*/*.{png,svg}', { eager: true, query: '?url&no-inline', import: 'default' })
  : {}

function artworkUrl(folder, name) {
  return exportedArtwork[`../../scripts/preview-wide/${folder}/${name}`] || ''
}

export function wideAsset(name) {
  const original = wideGoogleIds.includes(name) ? name + '.png' : nativeAssets[name]
  return original ? artworkUrl('wide-home-icons', original) : artworkUrl('wide-home-cuts', name + '.png')
}

export function wideIconMask(name) {
  const mask = wideGoogleIds.includes(name) ? 'icon-mask.svg'
    : ['phone', 'camera', 'chrome'].includes(name) ? 'dock-mask.svg'
    : name === 'hola' ? 'hola-mask.svg' : null
  return mask ? `url("${artworkUrl('wide-home-icons', mask)}")` : undefined
}

export const newHomeApps = {
  'play-store': 'Play Store',
  gemini: 'Gemini',
  videos: 'Videos',
  'phone-master': 'Phone Master',
  'app-center': 'App Center',
  hola: 'Hola',
  chrome: 'Chrome',
  maps: 'Maps', drive: 'Drive', 'yt-music': 'YouTube Music',
  'google-tv': 'Google TV', meet: 'Meet', 'google-photos': 'Google Photos'
}
export const wideIconLabels = {
  ...newHomeApps,
  settings: 'Settings', photos: 'AI Gallery', theme: 'Themes', calendar: 'Calendar',
  games: 'Games', phone: 'Phone', messages: 'Messages', camera: 'Camera'
}
export const wideDockIds = ['phone', 'messages', 'chrome', 'camera']
export const wideGoogleIds = ['google', 'gmail', 'maps', 'youtube', 'drive', 'yt-music', 'google-tv', 'meet', 'google-photos']
export const wideHomeFolder = {
  id: 'wide-google', name: 'Google', appIds: wideGoogleIds, width: 1, height: 1
}
const mainApps = [
  'play-store', 'gemini', 'settings', 'photos', 'theme', 'videos', 'calendar',
  'phone-master', 'app-center', 'games', 'hola'
]

export function wideDefaultOrder(items) {
  const first = ['widget:clock', 'widget:smart', 'folder:wide-google', ...mainApps.map(id => `app:${id}`)]
  const excluded = new Set([...first, ...[...wideDockIds, ...wideGoogleIds].map(id => `app:${id}`)])
  const rest = Object.keys(items).filter(id => !excluded.has(id))
  return [...first, 'page-break:wide-default', ...rest]
}

const designRows = [63, 159, 254.5, 351.67, 449.67]

export function wideGridProfile({ width, height, progress, wideHeight }, native, slab) {
  const amount = progress ?? (slab ? 0 : 1)
  const mix = (a, b) => a + (b - a) * amount
  const sx = width / 426
  const slabY = native.height / 788
  const wideY = (wideHeight ?? height) / 734
  const sy = mix(slabY, wideY)
  const nativeStride = (native.iconSize + native.labelHeight + native.gapY) * native.compactScale
  const rowStride = mix(nativeStride, 96 * wideY)
  const rowY = designRows.map((y, i) => mix(native.workspaceRect.top + i * nativeStride, y * wideY))
  const iconSize = mix(native.iconSize, 58)
  const compactScale = mix(native.compactScale, 1)
  const stepX = mix((native.iconSize + native.gapX) * native.compactScale, 96)
  const left = mix(native.insetX, 40)
  const right = width - left
  const dockTop = mix(646 * slabY, 581 * wideY)
  const workspaceBottom = mix(native.workspaceRect.bottom, 546 * wideY)
  return {
    wide: true, nativeGrid: slab, nativeMetrics: slab && amount === 0, width, height, columns: 4, rows: 5, sx, sy,
    iconSize, compactScale, insetX: left, stepX, gapX: stepX / compactScale - iconSize,
    gapY: mix(native.gapY, 22 * wideY), labelHeight: mix(native.labelHeight, 16 * wideY),
    rowStride, tallCardHeight: mix(nativeStride + native.iconSize * native.compactScale, 154),
    rowY,
    workspaceRect: { left, top: rowY[0], right, bottom: workspaceBottom, width: right - left, height: workspaceBottom - rowY[0] },
    dockRect: { left: 21 * sx, top: dockTop, right: width - 21 * sx, bottom: dockTop + iconSize, height: iconSize },
    indicatorY: mix(632 * slabY, 565 * wideY)
  }
}

export function wideItemMetrics(span, profile) {
  const { iconSize, compactScale, stepX, gapX, gapY, rowStride, tallCardHeight, nativeGrid } = profile
  const unit = iconSize * compactScale
  const labelHeight = profile.labelHeight * compactScale
  const width = (span.w - 1) * stepX + unit
  const cardHeight = span.h === 2 ? tallCardHeight : unit
  const height = nativeGrid ? (span.h - 1) * rowStride + unit + labelHeight : cardHeight + labelHeight
  return {
    spanX: span.w, spanY: span.h, width, height, unit,
    gapX: gapX * compactScale,
    gapY: nativeGrid ? rowStride - unit - labelHeight : gapY,
    cardWidth: span.w === 2 && span.h === 2 ? cardHeight : width,
    cardHeight, rowStride, labelHeight
  }
}

export function packWideOrder(order, items, folders, profile, itemSpan) {
  const pages = [[]]
  const frames = { 0: {} }
  const grid = () => Array.from({ length: profile.rows }, () => Array(profile.columns).fill(false))
  let occupied = grid()
  let page = 0

  function nextPage() {
    occupied = grid()
    pages.push([])
    frames[++page] = {}
  }
  function find(span) {
    for (let row = 0; row <= profile.rows - span.h; row++) {
      for (let col = 0; col <= profile.columns - span.w; col++) {
        if (occupied.slice(row, row + span.h).every(cells => cells.slice(col, col + span.w).every(cell => !cell))) return { row, col }
      }
    }
    return null
  }

  for (const id of new Set(order || [])) {
    if (id.startsWith('page-break:')) {
      if (pages[page].length) nextPage()
      continue
    }
    if (!items[id]) continue
    const span = itemSpan(items[id], folders)
    let slot = find(span)
    if (!slot) {
      nextPage()
      slot = find(span)
    }
    const { row, col } = slot
    for (let r = row; r < row + span.h; r++) occupied[r].fill(true, col, col + span.w)
    const m = wideItemMetrics(span, profile)
    pages[page].push(id)
    frames[page][id] = {
      x: profile.insetX + col * profile.stepX,
      y: profile.rowY[row],
      width: m.width, height: m.height, cardWidth: m.cardWidth, cardHeight: m.cardHeight,
      row, col, spanX: span.w, spanY: span.h, w: span.w, h: span.h
    }
  }
  if (page > 0 && !pages[page].length) {
    pages.pop()
    delete frames[page]
  }
  return { pages, frames, positions: frames }
}
