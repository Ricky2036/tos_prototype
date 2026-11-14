/**
 * Settings 页面自声明 · 系统（SET-SYS-01）
 * ==============================================
 * 契约：主壳通过 import.meta.glob('./pages/*.js', { eager: true }) 自动汇总。
 * 纯数据 + 懒加载器，不持有状态，不直接依赖主壳。
 */
export default {
  id: 'general',
  cluster: 'C-sys',
  titleKey: 'system',
  title: '系统',
  group: '系统',
  order: 700,
  component: () => import('../system/SettingsSystem.vue'),
  searchItems: [
    { id: 'system', title: '系统', group: '系统' },
    { id: 'systemNavigation', title: '系统导航', group: '系统' },
    { id: 'dateTime', title: '日期与时间', group: '系统' },
    { id: 'languageInput', title: '语言与输入法', group: '系统' },
    { id: 'powerButton', title: '按住电源按钮', group: '系统' },
    { id: 'schedulePower', title: '定时开关机与重启', group: '系统' },
    { id: 'googleBackup', title: '备份到Google云端硬盘', group: '系统' },
    { id: 'usbBackup', title: 'USB 备份和恢复', group: '系统' },
    { id: 'resetPhone', title: '重置手机', group: '系统' },
    { id: 'developerOptions', title: '开发者选项', group: '系统' },
    { id: 'enhancedServices', title: '增强服务', group: '系统' },
  ],
}
