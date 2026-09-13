/* DOM 工具：相对屏幕容器的坐标换算 */

/** 获取元素相对屏幕容器（.screen）的 rect */
export function rectRelativeToScreen(el, screenEl) {
  if (!el || !screenEl) return null
  const r = el.getBoundingClientRect()
  const s = screenEl.getBoundingClientRect()

  // getBoundingClientRect 包含舞台 transform，offsetWidth/offsetHeight 则是元素
  // getBoundingClientRect 包含舞台缩放，offsetWidth/offsetHeight 是唯一布局基准。
  // 两者相除即可在任意舞台缩放下还原到 .screen-view 的本地坐标系。
  const layoutWidth = screenEl.offsetWidth || s.width
  const layoutHeight = screenEl.offsetHeight || s.height
  const scaleX = layoutWidth ? s.width / layoutWidth : 1
  const scaleY = layoutHeight ? s.height / layoutHeight : scaleX

  const left = (r.left - s.left) / scaleX
  const top = (r.top - s.top) / scaleY
  const width = el.offsetWidth || r.width / scaleX
  const height = el.offsetHeight || r.height / scaleY

  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    get cx() { return this.x + this.width / 2 },
    get cy() { return this.y + this.height / 2 }
  }
}
