/**
 * 传音 / Infinix 旗舰应用抽屉 14 大分类大卡片配置
 * 完美还原 111.mp4 真实界面与混排结构
 */

export const DRAWER_CATEGORIES = [
  {
    id: 'frequent',
    name: '常用应用',
    type: '4-large',
    apps: ['wechat', 'transsioner', 'contacts', 'weibo']
  },
  {
    id: 'recent_added',
    name: '最近添加',
    type: '4-large',
    apps: ['abc', 'tomato', 'shortplay', 'google_one']
  },
  {
    id: 'social',
    name: '社交',
    type: '3-large-1-cluster',
    largeApps: ['wechat', 'phone', 'contacts'],
    clusterApps: ['wechat_read', 'chrome', 'messages', 'telegram']
  },
  {
    id: 'productivity',
    name: '效率',
    type: '3-large-1-cluster',
    largeApps: ['transsioner', 'dingtalk', 'deepseek'],
    clusterApps: ['qqmail', 'qianwen', 'appcenter', 'clone']
  },
  {
    id: 'tools',
    name: '工具',
    type: '3-large-1-cluster',
    largeApps: ['notes', 'clock', 'settings'],
    clusterApps: ['phonemaster', 'infrared', 'theme', 'calculator']
  },
  {
    id: 'entertainment',
    name: '娱乐',
    type: '3-large-1-cluster',
    largeApps: ['bilibili', 'douyin', 'ximalaya'],
    clusterApps: ['douyin_mall', 'douyin_lite', 'bubblepop', 'shortplay']
  },
  {
    id: 'finance',
    name: '财务',
    type: '4-large',
    apps: ['taobao', 'dingdong', 'cmb', 'dongka']
  },
  {
    id: 'travel',
    name: '旅游出行',
    type: '4-large',
    apps: ['amap', 'ditu', 'traffic12123', 'dianping']
  },
  {
    id: 'lifestyle',
    name: '生活方式',
    type: '4-large',
    apps: ['mihome', 'midea', 'haier', 'oppo']
  },
  {
    id: 'games',
    name: '游戏',
    type: '3-large-1-cluster',
    largeApps: ['ahagames', 'ahaprime', 'crushblock'],
    clusterApps: ['eggy', 'bubblepop', 'traffic12123', 'flclash']
  },
  {
    id: 'news',
    name: '新闻&阅读',
    type: '4-large',
    apps: ['tomato', 'toutiao', 'wechat_read', 'x_twitter']
  },
  {
    id: 'health',
    name: '运动健康',
    type: '4-large',
    apps: ['oppo_health', 'security', 'tidymaster', 'antigravity']
  },
  {
    id: 'uncategorized',
    name: '未分类',
    type: '3-large-1-cluster',
    largeApps: ['xiaotiancai', 'jianying', 'doodle'],
    clusterApps: ['telegram', 'autoclicker', 'carlcare', 'feedback']
  },
  {
    id: 'xhide',
    name: 'XHide',
    type: 'xhide',
    isPrivate: true
  }
]
