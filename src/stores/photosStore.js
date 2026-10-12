import { defineStore } from 'pinia'
import { PRESET_WALLPAPERS } from './wallpaperStore.js'

/** 词条插值：与 moriFlowStore / recorderFlowStore 同一约定（i18n 本身没有插值机制） */
export function fill(str, params) {
  if (typeof str !== 'string') return str
  return str.replace(/\{(\w+)\}/g, (m, k) => (params && params[k] != null ? String(params[k]) : m))
}

/* ⚠️ 不要用 `import.meta.env.BASE_URL` —— 它是 Vite 专有的，`node --test` 下
   `import.meta.env` 是 undefined 会直接抛错（单测就 import 这个 store）。
   public/ 下的素材按仓库惯例写绝对路径（同 `config/apps.js` 的 `/icons/*.png`）。 */
const stock = (name) => `/photos/${name}`

/**
 * 相册数据源。
 *
 * 🔴 **复用系统壁纸**：直接引用 `wallpaperStore` 的 `PRESET_WALLPAPERS`，
 * 而不是另造一套图片资产 —— 原型里「系统里的照片」本来就是这些壁纸
 * （Ricky 2026-10-12：「复用系统壁纸」）。
 * 其余素材用仓库既有的 `public/photos/photo-0*.jpg`（6 张，本次之前就在）。
 *
 * ⚠️ 只存 `daysAgo`（相对今天几天），**具体日期在运行时算** ——
 * 写死日期会让原型过几天就显示成「很久以前」，且跨时区会漂。
 * `shotAt` 是纯数字字符串（'10:13'），不是文案 ⇒ 不违反「store 不持中文串」。
 */
const PHOTO_SOURCE = [
  {
    daysAgo: 0,
    items: [
      { id: 'p-beach', src: stock('photo-01-beach.jpg'), kind: 'photo', shotAt: '09:41' },
      { id: 'p-cafe', src: stock('photo-02-cafe.jpg'), kind: 'photo', shotAt: '12:07' },
      { id: 'p-forest', src: stock('photo-03-forest.jpg'), kind: 'photo', shotAt: '17:26' }
    ]
  },
  {
    daysAgo: 1,
    items: [
      { id: 'p-lock-wall', src: PRESET_WALLPAPERS['wallpaper-lock'], kind: 'photo', shotAt: '08:15' },
      { id: 'p-coast', src: PRESET_WALLPAPERS['nature-coast'], kind: 'photo', shotAt: '15:52' }
    ]
  },
  {
    daysAgo: 2,
    items: [
      { id: 'p-city', src: stock('photo-04-city.jpg'), kind: 'photo', shotAt: '20:31' },
      { id: 'p-dog', src: stock('photo-05-dog.jpg'), kind: 'photo', shotAt: '11:03' }
    ]
  },
  {
    daysAgo: 3,
    items: [
      { id: 'p-cubes', src: PRESET_WALLPAPERS['abstract-geometric-cubes'], kind: 'photo', shotAt: '10:13' },
      { id: 'p-field', src: PRESET_WALLPAPERS['person-field'], kind: 'photo', shotAt: '16:48' },
      { id: 'p-birthday', src: stock('photo-06-birthday.jpg'), kind: 'photo', shotAt: '19:22' }
    ]
  }
]

/** 'YYYY-MM-DD'（本地时区，不用 toISOString —— 后者会按 UTC 漂一天） */
export function isoOf(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 由基准日往前推 n 天，仍返回 'YYYY-MM-DD' */
export function shiftISO(iso, daysAgo) {
  const [y, m, d] = String(iso).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  dt.setDate(dt.getDate() - daysAgo)
  return isoOf(dt)
}

export const usePhotosStore = defineStore('photos', {
  state: () => ({
    /** 基准「今天」，进应用时由 syncToday() 校准 */
    todayISO: isoOf(new Date()),
    /** 底部 Tab：photos | albums | discover */
    albumTab: 'photos',
    /** 视图模式：grid | list */
    viewMode: 'grid',
    /** 多选态 */
    selecting: false,
    favoriteIds: [],
    removedIds: [],
    /** 全屏查看中的照片 id（null = 未进入） */
    viewerId: null,
    /** 全屏沉浸态：临时隐藏「系统状态栏 + 顶部返回/日期 + 悬浮菜单按钮」（点屏幕中部切换）
     *  —— 属于查看器的一次性会话状态，`openViewer` / `closeViewer` / `reset` 都会复位，
     *     避免下次进全屏时「一进去就是黑屏无按钮」。 */
    viewerChromeHidden: false,
    /** 待确认删除的照片 id */
    pendingDeleteId: null,
    /** 「更多操作」面板对应的照片 id */
    moreId: null,
    /** 仅持 code，文案在组件侧取词条 */
    notice: null
  }),

  getters: {
    /** 日期分组：按天分组，过滤已删除；空分组整组消失（与系统相册一致）
     *  ⚠️ 组内每一张也带 `date`（与 `flat` 里的项**结构一致**）——
     *  否则从 `days` 里取到的项拿去算时间会拿到 undefined。 */
    days: (s) => PHOTO_SOURCE
      .map((group) => {
        const date = shiftISO(s.todayISO, group.daysAgo)
        const items = group.items
          .filter((it) => !s.removedIds.includes(it.id))
          .map((it) => ({ ...it, favorite: s.favoriteIds.includes(it.id), daysAgo: group.daysAgo, date }))
        return { daysAgo: group.daysAgo, date, items }
      })
      .filter((group) => group.items.length > 0),

    /** 未删除照片的扁平序列（全屏左右切换靠它定位） */
    flat: (s) => {
      const out = []
      for (const group of PHOTO_SOURCE) {
        for (const it of group.items) {
          if (!s.removedIds.includes(it.id)) {
            out.push({ ...it, favorite: s.favoriteIds.includes(it.id), daysAgo: group.daysAgo, date: shiftISO(s.todayISO, group.daysAgo) })
          }
        }
      }
      return out
    },

    total: (s) => PHOTO_SOURCE.reduce(
      (n, g) => n + g.items.filter((it) => !s.removedIds.includes(it.id)).length, 0
    ),

    /* ⚠️ 这两个 getter 必须写成**普通方法**（不能用箭头函数）：要经 `this.flat` 取兄弟 getter。
       Pinia 的箭头 getter 里没有 `this`，而手动 `usePhotosStore()` 会绕过依赖追踪
       （首次调用时 store 可能还没实例化，且 reactive 失效）。 */
    viewer() {
      if (!this.viewerId) return null
      const list = this.flat
      const idx = list.findIndex((it) => it.id === this.viewerId)
      if (idx < 0) return null
      return { ...list[idx], index: idx, count: list.length }
    },

    pendingDelete() {
      if (!this.pendingDeleteId) return null
      return this.flat.find((it) => it.id === this.pendingDeleteId) || null
    },

    isFavorite: (s) => (id) => s.favoriteIds.includes(id)
  },

  actions: {
    /** 校准「今天」（跨零点后重进应用仍正确） */
    syncToday(now = new Date()) {
      this.todayISO = isoOf(now)
      return this.todayISO
    },

    setTab(id) {
      if (['photos', 'albums', 'discover'].includes(id)) this.albumTab = id
      return this.albumTab
    },

    setViewMode(mode) {
      if (['grid', 'list'].includes(mode)) this.viewMode = mode
      return this.viewMode
    },

    toggleSelecting() {
      this.selecting = !this.selecting
      return this.selecting
    },

    openViewer(id) {
      if (!this.flat.some((it) => it.id === id)) return false
      this.viewerId = id
      // 每次进入全屏都从「有 chrome」开始：黑屏无按钮进入会让人以为死机
      this.viewerChromeHidden = false
      return true
    },

    closeViewer() {
      this.viewerId = null
      this.moreId = null
      this.viewerChromeHidden = false
      return true
    },

    /** 点屏幕切换全屏 chrome（状态栏 + 顶部返回/日期 + 悬浮菜单按钮）显隐；返回新值 */
    toggleViewerChrome() {
      this.viewerChromeHidden = !this.viewerChromeHidden
      return this.viewerChromeHidden
    },

    showViewerChrome() {
      this.viewerChromeHidden = false
      return false
    },

    /** 全屏左右切换；到边界停住，不循环（与系统相册一致） */
    stepViewer(delta) {
      const list = this.flat
      const idx = list.findIndex((it) => it.id === this.viewerId)
      if (idx < 0) return false
      const next = idx + delta
      if (next < 0 || next >= list.length) return false
      this.viewerId = list[next].id
      return true
    },

    toggleFavorite(id) {
      const i = this.favoriteIds.indexOf(id)
      if (i >= 0) {
        this.favoriteIds.splice(i, 1)
        this.notice = { code: 'unfavorited' }
      } else {
        this.favoriteIds.push(id)
        this.notice = { code: 'favorited' }
      }
      return i < 0
    },

    askDelete(id) {
      if (!this.flat.some((it) => it.id === id)) return false
      this.pendingDeleteId = id
      return true
    },

    cancelDelete() {
      this.pendingDeleteId = null
    },

    /** 删除后若正在全屏查看被删的那张，自动退到相邻一张；没了就退出全屏 */
    confirmDelete() {
      const id = this.pendingDeleteId
      if (!id) return false
      const list = this.flat
      const idx = list.findIndex((it) => it.id === id)
      this.removedIds.push(id)
      this.pendingDeleteId = null
      this.moreId = null
      const fav = this.favoriteIds.indexOf(id)
      if (fav >= 0) this.favoriteIds.splice(fav, 1)
      if (this.viewerId === id) {
        const next = this.flat
        this.viewerId = next.length ? next[Math.min(idx, next.length - 1)].id : null
      }
      this.notice = { code: 'deleted' }
      return true
    },

    openMore(id) {
      this.moreId = id
      return true
    },

    closeMore() {
      this.moreId = null
    },

    /** 分享 / 编辑 / 视图切换 / 多选 / 设置：原型里统一给回执，不静默 */
    report(code) {
      this.notice = { code }
      return code
    },

    clearNotice() {
      this.notice = null
    },

    reset() {
      this.albumTab = 'photos'
      this.viewMode = 'grid'
      this.selecting = false
      this.favoriteIds = []
      this.removedIds = []
      this.viewerId = null
      this.pendingDeleteId = null
      this.moreId = null
      this.viewerChromeHidden = false
      this.notice = null
    }
  }
})
