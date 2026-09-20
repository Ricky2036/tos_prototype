/**
 * 传音 / Infinix 旗舰应用抽屉分类大卡片配置
 * 100% 对应桌面真实安装的 19 个系统应用
 */

export const DRAWER_CATEGORIES = [
  {
    id: 'frequent',
    name: '常用应用',
    type: '4-large',
    apps: ['phone', 'messages', 'safari', 'camera']
  },
  {
    id: 'productivity',
    name: '效率与工具',
    type: '3-large-1-cluster',
    largeApps: ['notes', 'files', 'calculator'],
    clusterApps: ['compass', 'voicememos', 'keynote', 'settings']
  },
  {
    id: 'lifestyle',
    name: '生活与健康',
    type: '4-large',
    apps: ['weather', 'clock', 'calendar', 'fitness']
  },
  {
    id: 'entertainment',
    name: '影音与娱乐',
    type: '4-large',
    apps: ['photos', 'games', 'theme', 'tips']
  },
  {
    id: 'system',
    name: '系统管理',
    type: '4-large',
    apps: ['settings', 'safari', 'files', 'compass']
  },
  {
    id: 'xhide',
    name: 'XHide',
    type: 'xhide',
    isPrivate: true
  }
]
