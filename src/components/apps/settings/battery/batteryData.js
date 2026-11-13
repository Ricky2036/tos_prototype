/**
 * 电池与省电 · 真机取证的展示数据
 * ==================================
 * 全部来自 `.local-evidence/SET-BAT-01/`（Infinix X6878 · XOS 17 · 2026-11-13）。
 *
 * 说明：真机排行的应用是 Transsioner / 喜马拉雅 / 抖音 / 微信 / 小红书…，
 * 原型桌面没有这些包；这里保留同一套结构与百分比，换成原型里真实存在的应用，
 * 图标与名称一律走 `config/apps`，不新造应用。
 */

/** 首页「耗电占比排行（过去 24 小时）」默认 5 行 */
export const RANKING_24H = [
  { appId: 'tiktok', percent: '41%', fg: '前台少于 1 分钟', bg: '后台 14 小时 43 分钟' },
  { appId: 'youtube', percent: '37%', fg: '前台 6 分钟', bg: '后台 7 小时 38 分钟' },
  { appId: 'wechat', percent: '5%', fg: '前台 2 分钟', bg: '后台 2 分钟' },
  { appId: 'camera', percent: '2%', fg: '前台少于 1 分钟', bg: '后台 14 小时 36 分钟' },
  { appId: 'safari', percent: '1%', fg: '前台少于 1 分钟', bg: '后台少于 1 分钟' }
]

/** 「查看更多」展开后的补充行（真机：QQ / Google Play 商店 / 闲鱼 / 相机…） */
export const RANKING_24H_MORE = [
  { appId: 'whatsapp', percent: '1%', fg: '前台 0 分钟', bg: '后台 14 小时 44 分钟' },
  { appId: 'instagram', percent: '<1%', fg: '前台 0 分钟', bg: '后台 14 小时 33 分钟' },
  { appId: 'spotify', percent: '<1%', fg: '前台少于 1 分钟', bg: '后台 14 分钟' },
  { appId: 'photos', percent: '<1%', fg: '前台少于 1 分钟', bg: '后台 3 分钟' }
]

/** 过去 7 天排行：同一批应用，百分比按周重算（真机 29%/…） */
export const RANKING_7D = [
  { appId: 'tiktok', percent: '29%', fg: '前台 32 分钟', bg: '后台 96 小时 35 分钟' },
  { appId: 'youtube', percent: '21%', fg: '前台 1 小时 12 分钟', bg: '后台 55 小时 8 分钟' },
  { appId: 'wechat', percent: '13%', fg: '前台 48 分钟', bg: '后台 80 小时 12 分钟' },
  { appId: 'camera', percent: '6%', fg: '前台 18 分钟', bg: '后台 3 小时 2 分钟' },
  { appId: 'safari', percent: '3%', fg: '前台 26 分钟', bg: '后台 12 分钟' }
]

/** 「其他应用耗电」：真机单行「系统应用 6%」 */
export const OTHER_APPS_24H = [
  { appId: 'system', name: '系统应用', percent: '6%', fg: '前台 25 分钟', bg: '后台 0 分钟' }
]

export const OTHER_APPS_7D = [
  { appId: 'system', name: '系统应用', percent: '18%', fg: '前台 2 小时 4 分钟', bg: '后台 1 小时 36 分钟' }
]

/** 首页「距上次充满电已使用」与活动时长（真机原值） */
export const LAST_FULL_CHARGE = '60 小时 42 分钟'

export const ACTIVITY = {
  '24h': { screenOn: '39 分钟', screenOff: '14 小时 20 分钟', onLabel: '亮屏活动时长', offLabel: '息屏活动时长' },
  '7d': { screenOn: '2 小时 9 分钟', screenOff: '13 小时 52 分钟', onLabel: '日均亮屏活动时长', offLabel: '日均息屏活动时长' }
}

/**
 * 电池电量柱图：真机 24h 是 40 根细柱（每根 ~36 分钟），
 * 数值为按截图逐段目测的高度百分比；绿色段 = 充电中。
 */
export const LEVEL_24H = [
  ...[97, 96, 96, 95, 95, 94, 93, 92, 91, 90].map((v) => ({ v, charging: false })),
  ...[89, 88, 86, 84, 82, 80, 78, 76, 74, 72].map((v) => ({ v, charging: false })),
  ...[70, 68, 66, 64, 62, 60, 62, 65, 68, 72].map((v) => ({ v, charging: true })),
  ...[76, 80, 84, 88, 92, 95, 98, 100, 100, 99].map((v) => ({ v, charging: true }))
]

/** 7 天「用电量」柱：真机 7 根宽柱 + 11/7–11/13 轴标 */
export const LEVEL_7D = [
  { label: '11/7', v: 22 },
  { label: '11/8', v: 58 },
  { label: '11/9', v: 52 },
  { label: '11/10', v: 88 },
  { label: '11/11', v: 36 },
  { label: '11/12', v: 64 },
  { label: '11/13', v: 44 }
]

/** 活动时长柱：24h 为 6 组，on = 亮屏占比、off = 息屏占比 */
export const ACT_24H = [
  { on: 6, off: 92 },
  { on: 10, off: 88 },
  { on: 14, off: 60 },
  { on: 22, off: 48 },
  { on: 9, off: 90 },
  { on: 5, off: 78 }
]

/** 7 天为堆叠柱：off 在下、on 在上（真机是深色在下、亮蓝在上） */
export const ACT_7D = [
  { label: '11/7', on: 12, off: 62 },
  { label: '11/8', on: 16, off: 78 },
  { label: '11/9', on: 10, off: 58 },
  { label: '11/10', on: 8, off: 34 },
  { label: '11/11', on: 7, off: 60 },
  { label: '11/12', on: 8, off: 76 },
  { label: '11/13', on: 6, off: 48 }
]

/** 应用耗电详情：真机抖音页原值；其余应用按相同量级给出原型数据 */
export const APP_USAGE = {
  tiktok: { fgTime: '2 分钟', fgDrain: '少于 1 mAh', bgTime: '2 分钟', bgDrain: '182 mAh' },
  youtube: { fgTime: '6 分钟', fgDrain: '8 mAh', bgTime: '7 小时 38 分钟', bgDrain: '96 mAh' },
  wechat: { fgTime: '2 分钟', fgDrain: '2 mAh', bgTime: '2 分钟', bgDrain: '31 mAh' },
  camera: { fgTime: '少于 1 分钟', fgDrain: '少于 1 mAh', bgTime: '14 小时 36 分钟', bgDrain: '12 mAh' },
  safari: { fgTime: '少于 1 分钟', fgDrain: '少于 1 mAh', bgTime: '少于 1 分钟', bgDrain: '少于 1 mAh' },
  whatsapp: { fgTime: '0 分钟', fgDrain: '少于 1 mAh', bgTime: '14 小时 44 分钟', bgDrain: '9 mAh' },
  instagram: { fgTime: '0 分钟', fgDrain: '少于 1 mAh', bgTime: '14 小时 33 分钟', bgDrain: '7 mAh' },
  spotify: { fgTime: '少于 1 分钟', fgDrain: '少于 1 mAh', bgTime: '14 分钟', bgDrain: '4 mAh' },
  photos: { fgTime: '少于 1 分钟', fgDrain: '少于 1 mAh', bgTime: '3 分钟', bgDrain: '2 mAh' },
  system: { fgTime: '25 分钟', fgDrain: '6 mAh', bgTime: '0 分钟', bgDrain: '少于 1 mAh' }
}

/** 省电模式介绍页（真机「了解详情」全文） */
export const POWER_SAVER_INTRO = [
  {
    title: '减少数据传输',
    items: ['关闭个人热点', '关闭相册自动同步', '关闭应用商店自动更新', '关闭数据网络加速', '关闭账号自动同步数据', '开启睡眠待机优化']
  },
  {
    title: '减弱视觉效果',
    items: ['降低屏幕亮度', '关闭熄屏时钟', '限制屏幕刷新率', '关闭杂志锁屏', '关闭部分动态效果', '关闭实时模糊', '关闭增强显示效果']
  },
  {
    title: '弱化体感、声音和振动',
    items: ['关闭触感反馈', '关闭锁屏提示音', '关闭智能保持亮屏']
  }
]

export const POWER_SAVER_INTRO_NOTE =
  '*部分机型可能不包含上述部分功能，如您的设备不包含上述功能中的部分功能，则不会进行相应的优化。'
