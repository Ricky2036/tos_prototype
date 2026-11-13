/**
 * Settings 页面自声明 · 日期与时间（SET-WB-01）
 * ==============================================
 * 契约见 `docs/tOS-pipeline-1.0.md` §6.2：主壳用
 *   `import.meta.glob('./pages/*.js', { eager: true })`
 * 汇总 —— `id` → `component` 组成路由表，`title` 组成标题表，`searchItems` 组成搜索池。
 * 本文件只放纯数据 + 懒加载器，不 import 主壳、不持有 push/pop。
 *
 * 给 Integrator 的 route 契约（主壳单点接线，WB 不改 SettingsApp.vue）：
 *   route id      : dateTime
 *   标题          : 日期与时间
 *   入口 1        : 设置首页「系统」卡片 → 系统页第 2 行（真机包 A1：系统导航之后、
 *                   语言与输入法之前）→ push('dateTime')
 *   入口 2        : 搜索池 id=dateTime → push('dateTime')（替换原 pushUnimplemented）
 *   页面 emit     : back（返回键）、open-picker（下一条小单，本条不接）
 *   返回栈        : 页面自行 inject('settingsNav') + useBackHandler()，主壳无需轮询
 *   证据          : spec/captures/SET-DSH-01-A-B.md
 */
export default {
  id: 'dateTime',
  cluster: 'C2',
  titleKey: 'dateTime',
  title: '日期与时间',
  group: '系统',
  // 系统卡片第 2 行（组号 × 100 + 组内行序）
  order: 702,
  component: () => import('../dateTime/SettingsDateTime.vue'),
  searchItems: [
    { id: 'dateTime', title: '日期与时间', group: '系统' },
  ],
}
