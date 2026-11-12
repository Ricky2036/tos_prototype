/**
 * Settings 页面自声明 · 显示与亮度（S2 试点页）
 * ==============================================
 * 契约见 `docs/tOS-pipeline-1.0.md` §6.2：主壳用
 *   `import.meta.glob('./pages/*.js', { eager: true })`
 * 汇总 —— `id` → `component` 组成路由表，`title`/`titleKey` 组成标题表，
 * `searchItems` 组成搜索池。**新增第 35 个页面时主壳 diff 应为 0 行**（§6.3）。
 *
 * 纪律：本文件只放纯数据 + 懒加载器。不 import 主壳、不持有 `push/pop`，
 * 也不在 `searchItems` 里写 `action` —— 跳转动作由主壳汇总时统一注入，
 * 否则页面元数据又会反向依赖主壳，glob 自注册就白做了。
 */
export default {
  id: 'display',
  cluster: 'C2',
  titleKey: 'displayAndBrightness',
  title: '显示与亮度',
  group: '显示',
  // 首页顺序：第 4 组卡片第 3 行（组号 × 100 + 组内行序）
  order: 403,
  component: () => import('../SettingsDisplay.vue'),
  searchItems: [
    { id: 'display', title: '显示与亮度', group: '显示' },
    { id: 'darkMode', title: '深色主题（黑夜模式）', group: '显示' },
  ],
}
