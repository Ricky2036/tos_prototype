/**
 * 应用抽屉全量元数据与 A-Z 拼音索引配置。
 * 数据全部从 `src/config/apps.js` 的统一纯数据应用表 `APP_CATALOG` 派生，不再重复维护。
 */
import { APP_CATALOG, subscribeCatalog } from './apps.js'

/** 将统一目录项转换为抽屉应用结构。 */
export function toDrawerApp(entry) {
  const item = {
    id: entry.id,
    name: entry.names?.zh || entry.name || entry.id,
    initial: entry.initial || '#',
    pinyin: entry.pinyin || entry.id,
    depth: entry.depth || 'placeholder',
    heroBackground: entry.heroBackground || '#F5F5F7',
    icon: entry.icon
  }
  if (entry.pinned) item.pinned = true
  if (entry.special) item.special = entry.special
  else if (entry.icon) item.image = entry.icon
  if (entry.dock) item.dock = true
  if (entry.page !== undefined) item.page = entry.page
  return item
}

function compareDrawerOrder(a, b) {
  if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
  if (a.pinned && b.pinned) return 0
  const initCmp = (a.initial || '#').localeCompare(b.initial || '#')
  return initCmp !== 0 ? initCmp : (a.pinyin || a.id).localeCompare(b.pinyin || b.id)
}

export const DRAWER_APPS = APP_CATALOG
  .filter((a) => !a.hiddenOnDesktop)
  .map(toDrawerApp)
  .sort(compareDrawerOrder)

subscribeCatalog((entry) => {
  if (entry.hiddenOnDesktop) return
  if (DRAWER_APPS.some((a) => a.id === entry.id)) return
  DRAWER_APPS.push(toDrawerApp(entry))
})

/** 全量 27 个字母索引（对齐真机 A-Z 及 # 导轨） */
export const FULL_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
]

export const ALPHABET_LIST = FULL_ALPHABET

/**
 * 按字母分组的应用字典：{ A: [...], B: [...], ..., Z: [...], '#': [...] }
 */
export function getAlphabeticalGroups() {
  const groups = {}
  for (const letter of ALPHABET_LIST) {
    groups[letter] = []
  }
  for (const app of DRAWER_APPS) {
    const l = app.initial || '#'
    if (!groups[l]) groups[l] = []
    groups[l].push(app)
  }
  return groups
}

/**
 * 实时过滤搜索应用（支持中文名、拼音、英文 ID 检索）
 */
export function searchDrawerApps(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  return DRAWER_APPS.filter((a) => {
    return (
      a.name.toLowerCase().includes(q) ||
      a.pinyin.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    )
  })
}

export function getDrawerAppById(id) {
  return DRAWER_APPS.find((a) => a.id === id)
}
