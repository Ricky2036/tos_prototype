/**
 * Settings 页面自声明 · 辅助功能（S2 试点页）
 * ==============================================
 * 契约见 `docs/tOS-pipeline-1.0.md` §6.2：主壳用
 *   `import.meta.glob('./pages/*.js', { eager: true })`
 * 汇总路由表 / 标题表 / 搜索池；本文件只放纯数据 + 懒加载器，
 * `searchItems` 不带 `action`，跳转动作由主壳统一注入。
 *
 * 主壳当前的 `viewTitles.accessibility` 是硬编码中文，`SETTINGS_TITLES`
 * 里也尚未登记；`titleKey` 先按 id 命名，`title` 作为中文兜底，
 * 接入 glob 时统一走 `settingsTitle(titleKey, title)` 即可，不必改动标题表。
 */
export default {
  id: 'accessibility',
  cluster: 'C2',
  titleKey: 'accessibility',
  title: '辅助功能',
  group: '系统',
  // 首页顺序：第 6 组卡片第 2 行（组号 × 100 + 组内行序）
  order: 602,
  component: () => import('../SettingsAccessibility.vue'),
  searchItems: [
    { id: 'accessibility', title: '辅助功能', group: '系统' },
  ],
}
