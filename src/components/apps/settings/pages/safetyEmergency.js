/**
 * Settings 页面自声明 · 安全和紧急情况（SET-AG-01a）
 * ===================================================
 * 契约：主壳通过 import.meta.glob('./pages/*.js', { eager: true }) 自动汇总。
 * 纯数据 + 懒加载器，不持有状态，不直接依赖主壳。
 */
export default {
  id: 'safetyEmergency',
  cluster: 'C0-a',
  titleKey: 'safetyAndEmergency',
  title: '安全和紧急情况',
  group: '安全',
  order: 504,
  component: () => import('../safety/SettingsSafetyEmergency.vue'),
  searchItems: [
    { id: 'safetyEmergency', title: '安全和紧急情况', group: '安全' },
    { id: 'medicalInfo', title: '医疗信息', group: '安全' },
    { id: 'emergencyContacts', title: '紧急联系人', group: '安全' },
    { id: 'emergencySos', title: '紧急求救（SOS）', group: '安全' },
    { id: 'earthquakeAlert', title: '地震警报', group: '安全' },
    { id: 'disasterAlert', title: '灾害警报', group: '安全' },
  ],
}
