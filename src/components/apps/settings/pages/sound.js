/**
 * Settings 页面自声明 · 声音与振动（S2 试点页）
 * ==============================================
 * 契约见 `docs/tOS-pipeline-1.0.md` §6.2：主壳用
 *   `import.meta.glob('./pages/*.js', { eager: true })`
 * 汇总路由表 / 标题表 / 搜索池；本文件只放纯数据 + 懒加载器，
 * `searchItems` 不带 `action`，跳转动作由主壳统一注入。
 */
export default {
  id: 'sound',
  cluster: 'C2',
  titleKey: 'soundAndVibration',
  title: '声音与振动',
  group: '声音',
  // 首页顺序：第 4 组卡片第 4 行（组号 × 100 + 组内行序）
  order: 404,
  component: () => import('../SettingsSound.vue'),
  searchItems: [
    { id: 'sound', title: '声音与振动', group: '声音' },
  ],
}
