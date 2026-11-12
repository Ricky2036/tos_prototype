import { APPS, getApp } from '../config/apps.js'
import { DRAWER_APPS } from '../config/drawerApps.js'

/**
 * 【全仓唯一应用清单来源】桌面注册表 → 设置里所有「应用列表」类型页面。
 *
 * 背景：勿扰「应用提醒」曾经硬编码 23 个应用名 + 首字色块，和桌面注册表越走越远，
 * 日历/时钟这类自绘图标又反复出现「列表里和桌面长得不一样」。
 * 现在统一从这里取：名字、id、真实图标路径都来自 `APPS`（+ `DRAWER_APPS` 补图），
 * special 应用直接交回桌面同一个 `AppIcon` 渲染，不再允许自造图标。
 *
 * ⚠️ 新增任何应用列表页，一律用 `getRegisteredApps()` / `ui/RegisteredAppList.vue`，
 *    不要另写一份名单或首字色块（有单测守卫）。
 */

/** 单个注册应用 → 图标描述。special 返回桌面 AppIcon 需要的对象。 */
export function resolveAppIcon(app) {
  if (app.special) return { specialApp: getApp(app.id) || app, image: '' }
  const image = app.image || DRAWER_APPS.find(d => d.id === app.id)?.icon || getApp(app.id)?.image || ''
  return { specialApp: null, image }
}

/** 全量注册应用，默认按中文名排序（真机应用列表是 A-Z 拼音序） */
export function getRegisteredApps({ sort = true } = {}) {
  const list = APPS.map(app => ({
    id: app.id,
    name: app.name,
    ...resolveAppIcon(app)
  }))
  return sort ? list.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')) : list
}

/** 按 id 或中文名查注册应用，供真机取证的固定清单页复用图标 */
export function findRegisteredApp(key) {
  if (!key) return null
  return getRegisteredApps({ sort: false }).find(a => a.id === key || a.name === key) || null
}

/** 稳定生成展示用的应用大小（真机该列有数值，原型不采集真实存储） */
const APP_SIZES = ['8.68 MB', '170 MB', '469 MB', '593 MB', '785 MB', '858 MB', '1.61 GB', '2.31 GB', '2.77 GB', '3.42 GB']
export function registeredAppSize(app, index) {
  return APP_SIZES[(app.id.length + index) % APP_SIZES.length]
}
