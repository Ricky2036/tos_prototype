import { DRAWER_APPS, ALPHABET_LIST } from '../../../../config/drawerApps.js'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'

/**
 * 应用名单 → A-Z 分组。
 *
 * 字母取自 `DRAWER_APPS[].initial`（appCatalog 里逐条维护的拼音首字母），
 * ⛔ 不在本模块另写一份首字母表，否则和抽屉/应用库的索引会各走一套。
 */
const INITIALS = new Map(DRAWER_APPS.map(a => [a.id, a.initial || '#']))

export const TM_LETTERS = ALPHABET_LIST

export function tmAppSections() {
  const groups = new Map()
  for (const app of getRegisteredApps()) {
    const letter = INITIALS.get(app.id) || '#'
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter).push(app)
  }
  const order = TM_LETTERS.filter(l => groups.has(l))
  return order.map(letter => ({ letter, apps: groups.get(letter) }))
}

/** 有应用的字母（导轨高亮用） */
export function tmAvailableLetters() {
  return tmAppSections().map(s => s.letter)
}

/**
 * 点导轨跳转：把某一组的第一行滚到滚动区顶部。
 * 用 rect 差值而不是 offsetTop —— 行没有定位祖先，offsetTop 会算到页面根节点上去。
 */
export function tmScrollToLetter(bodyEl, letter) {
  if (!bodyEl) return false
  const target = bodyEl.querySelector(`[data-letter="${letter}"]`)
  if (!target) return false
  const delta = target.getBoundingClientRect().top - bodyEl.getBoundingClientRect().top
  bodyEl.scrollTo({ top: Math.max(0, bodyEl.scrollTop + delta - 6), behavior: 'smooth' })
  return true
}
