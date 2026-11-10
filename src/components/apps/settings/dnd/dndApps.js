/**
 * 勿扰模式 →「应用提醒」清单（真机 2026-11-10 逐页取证：dnd_12_apps / dnd_13_apps_bottom）。
 * 图标优先用项目里已有的真实 PNG；真机上没有对应资源的系统组件用首字色块占位。
 */
export const DND_APPS = [
  { name: '哔哩哔哩', icon: '/icons/drawer/bilibili.png' },
  { name: '查找' },
  { name: '打印处理服务' },
  { name: '大众点评', icon: '/icons/drawer/dianping.png' },
  { name: '电话', icon: '/icons/phone.png' },
  { name: '叮咚买菜', icon: '/icons/drawer/dingdong.png' },
  { name: '钉钉', icon: '/icons/drawer/dingtalk.png' },
  { name: '抖音', icon: '/icons/drawer/douyin.png' },
  { name: '抖音极速版', icon: '/icons/drawer/douyin_lite.png' },
  { name: '抖音商城', icon: '/icons/drawer/douyin_mall.png' },
  { name: '短信', icon: '/icons/messages.png' },
  { name: '多屏互联' },
  { name: '番茄免费小说' },
  { name: '高德地图', icon: '/icons/drawer/amap.png' },
  { name: '广告隐私权' },
  { name: '红果免费短剧' },
  { name: '即刻通知' },
  { name: '记事本', icon: '/icons/notes.png' },
  { name: '今日头条', icon: '/icons/drawer/toutiao.png' },
  { name: '录屏' },
  { name: '录音机', icon: '/icons/voicememos.png' },
  { name: '微信', icon: '/icons/wechat.png' },
  { name: '脉脉' }
]

/** 首字色块占位（真机是系统组件图标，项目缺资源） */
export function dndAppFallback(name) {
  return { text: name.slice(0, 1), bg: '#EDEFF2', fg: '#6B7280' }
}
