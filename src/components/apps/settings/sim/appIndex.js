import { DRAWER_APPS, ALPHABET_LIST } from '../../../../config/drawerApps.js'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'
import { TRAFFIC_SYSTEM_APP_IDS } from '../../../../stores/trafficStore.js'

/**
 * 应用名单 → 首字母 / 分组。
 *
 * 字母取自 `DRAWER_APPS[].initial`（appCatalog 里逐条维护的拼音首字母），
 * ⛔ 不在本模块另写一份首字母表，否则和抽屉 / 应用库的索引会各走一套。
 */
const INITIALS = new Map(DRAWER_APPS.map(a => [a.id, a.initial || '#']))

export const TM_LETTERS = ALPHABET_LIST

/**
 * 注册表应用 + 首字母；默认按 ⋮ 里的「显示系统应用」过滤掉系统自带应用。
 * ⚠️ 必须**按首字母再按拼音**重排：导轨是跳字母的，列表顺序一旦和字母不同步，
 *    点了字母会落到风马牛不相及的位置（localeCompare 的 zh-Hans-CN 在不同环境里还会飘）。
 */
export function tmApps({ showSystemApps = true } = {}) {
  const all = getRegisteredApps().map(app => ({ ...app, initial: INITIALS.get(app.id) || '#' }))
  const kept = showSystemApps ? all : all.filter(app => !TRAFFIC_SYSTEM_APP_IDS.includes(app.id))
  return kept.sort((a, b) => {
    const byLetter = TM_LETTERS.indexOf(a.initial) - TM_LETTERS.indexOf(b.initial)
    return byLetter !== 0 ? byLetter : a.name.localeCompare(b.name, 'zh-Hans-CN')
  })
}

/** 导轨字母：只出现**确实有应用**的首字母（真机就缺 N / R 这种） */
export function tmLettersOf(apps) {
  const set = new Set(apps.map(a => a.initial))
  return TM_LETTERS.filter(l => set.has(l))
}

/** 「不受限制的应用」页：开着的置顶，其余归「其他应用」 */
export function tmSplitSections(apps, isOn) {
  const on = apps.filter(a => isOn(a.id))
  const off = apps.filter(a => !isOn(a.id))
  return [
    { label: '不受限制的应用', apps: on },
    { label: '其他应用', apps: off }
  ].filter(s => s.apps.length)
}

/** 滚到某个字母 / ★（回顶部） */
export function tmScrollTo(bodyEl, letter) {
  if (!bodyEl) return false
  if (letter === '★') {
    bodyEl.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }
  const target = bodyEl.querySelector(`[data-letter="${letter}"]`)
  if (!target) return false
  const delta = target.getBoundingClientRect().top - bodyEl.getBoundingClientRect().top
  bodyEl.scrollTo({ top: Math.max(0, bodyEl.scrollTop + delta - 8), behavior: 'smooth' })
  return true
}

/** 当前停在哪一组：取滚动区顶部往里 8px 处的那一行 */
export function tmLetterAtTop(bodyEl) {
  if (!bodyEl) return ''
  const rows = bodyEl.querySelectorAll('[data-letter]')
  if (!rows.length) return ''
  const top = bodyEl.getBoundingClientRect().top + 8
  let current = rows[0]
  for (const row of rows) {
    if (row.getBoundingClientRect().top <= top) current = row
    else break
  }
  return current.dataset.letter || ''
}
