/**
 * 设置菜单标题的唯一来源（Ricky 2026-11-06：所有设置菜单标题统一）
 *
 * 之前标题散落在三处：设置首页的行文案、各页 `<GlassNavBar title>` 的字符串、
 * 以及 i18n 的 key。同一个菜单在首页叫「通知与状态栏」、进去却叫「通知」这类漂移就是这么来的。
 *
 * 规则：
 * 1. 设置里的菜单标题**只在这里定义一次**，首页行与页面标题都引用它；
 * 2. 需要多语言的走 i18n（本表只放中文口径，与页面正文保持一致）；
 * 3. 新加设置页时先在表里登记，再由 `tests/settingsTitles.test.js` 校验页面标题与表一致。
 */
export const SETTINGS_TITLES = {
  // 通知与状态栏（二级）及其子页
  notifications: '通知与状态栏',
  statusBar: '状态栏',
  controlCenter: '控制中心',
  lockScreenNotif: '锁屏通知',
  floatingNotif: '悬浮通知',
  dynamicBar: 'Dynamic Bar',
  homeBadge: '桌面角标',

  // 其它二级页
  cloudBackup: '云备份',
  autoBackup: '自动备份',
  dnd: '勿扰模式',
  prayer: '礼拜模式'
}

/** 取标题；未登记时回退到传入的兜底值，便于渐进迁移 */
export function settingsTitle(id, fallback = '') {
  return SETTINGS_TITLES[id] ?? fallback
}
