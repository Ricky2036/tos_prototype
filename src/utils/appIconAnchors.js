import { rectRelativeToScreen } from './dom.js'

const homeAnchors = globalThis.__TOS_HOME_ANCHORS__ || (globalThis.__TOS_HOME_ANCHORS__ = new Map())
const lastValidAnchors = globalThis.__TOS_LAST_VALID_ANCHORS__ || (globalThis.__TOS_LAST_VALID_ANCHORS__ = new Map())
let pendingLaunch = null
const HOME_LAYOUT_SUBPIXELS = 8

/**
 * 桌面四列网格和 Dock 的布局轨道天然落在 1/8 CSS px 上。舞台 transform 后
 * getBoundingClientRect 会先量化物理像素，再做逆缩放；统一恢复布局单位可避免
 * 丢失一个子像素。该规则对所有锚点一致，不包含分列或方向补偿。
 */
export function normalizeHomeAnchorRect(rect) {
  if (!rect) return null
  const rawX = Number.isFinite(rect.x) ? rect.x : (Number.isFinite(rect.left) ? rect.left : 0)
  const rawY = Number.isFinite(rect.y) ? rect.y : (Number.isFinite(rect.top) ? rect.top : 0)
  const width = Number.isFinite(rect.width) ? rect.width : (Number.isFinite(rect.w) ? rect.w : 60)
  const height = Number.isFinite(rect.height) ? rect.height : (Number.isFinite(rect.h) ? rect.h : 60)
  const x = Math.round(rawX * HOME_LAYOUT_SUBPIXELS) / HOME_LAYOUT_SUBPIXELS
  const y = Math.round(rawY * HOME_LAYOUT_SUBPIXELS) / HOME_LAYOUT_SUBPIXELS
  const normalized = {
    ...rect,
    x,
    y,
    left: x,
    top: y,
    width,
    height,
    right: x + width,
    bottom: y + height
  }
  Object.defineProperties(normalized, {
    cx: { enumerable: true, get() { return this.x + this.width / 2 } },
    cy: { enumerable: true, get() { return this.y + this.height / 2 } }
  })
  return normalized
}

export function registerAnchor(appId, element) {
  if (appId && element) homeAnchors.set(appId, element)
}

export function unregisterAnchor(appId, element) {
  if (homeAnchors.get(appId) === element) homeAnchors.delete(appId)
}

export function getAnchorRect(appId, viewport) {
  const element = homeAnchors.get(appId)
  if (element?.isConnected) {
    const raw = rectRelativeToScreen(element, viewport)
    if (raw && raw.width > 0 && raw.height > 0) {
      const normalized = normalizeHomeAnchorRect(raw)
      lastValidAnchors.set(appId, normalized)
      return normalized
    }
  }
  if (viewport) {
    // 降级兜底：按优先级检查文件夹内图标、桌面网格图标、Dock 图标或全局挂载的应用图标节点
    const candidate = viewport.querySelector?.(`[data-folder-app="${appId}"] .app-icon-anchor`)
      || viewport.querySelector?.(`[data-folder-app="${appId}"]`)
      || viewport.querySelector?.(`[data-home-item="app:${appId}"] .app-icon-anchor`)
      || viewport.querySelector?.(`[data-dock-item="app:${appId}"] .app-icon-anchor`)
      || viewport.querySelector?.(`[data-app-id="${appId}"] .app-icon-anchor`)
      || viewport.querySelector?.(`[data-app-id="${appId}"]`)

    if (candidate?.isConnected) {
      const raw = rectRelativeToScreen(candidate, viewport)
      if (raw && raw.width > 0 && raw.height > 0) {
        const normalized = normalizeHomeAnchorRect(raw)
        lastValidAnchors.set(appId, normalized)
        return normalized
      }
    }
  }
  return lastValidAnchors.get(appId) || null
}

export function setLaunchRect(appId, rect) {
  const normalized = normalizeHomeAnchorRect(rect)
  pendingLaunch = normalized ? { appId, rect: normalized } : null
  if (normalized && normalized.width > 0 && normalized.height > 0) {
    lastValidAnchors.set(appId, normalized)
  }
}

export function consumeLaunchRect(appId) {
  if (pendingLaunch?.appId !== appId) return null
  const rect = pendingLaunch.rect
  pendingLaunch = null
  return rect
}
