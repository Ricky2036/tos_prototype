/**
 * 应用多语言显示名（zh/en/bn）。
 * 桌面与系统应用名称统一从 `src/config/apps.js` 的 `APP_CATALOG` 派生，
 * 这里仅额外补充通知中心里无桌面图标的第三方/系统条目。
 */
import { APP_CATALOG, subscribeCatalog } from '../config/apps.js'

const EXTRA_APP_NAMES = {
  zh: {
    transsioner: 'Transsioner',
    sms: '短信',
    bilibili: '哔哩哔哩',
    map: '地图',
    dingdong: '叮咚买菜',
    douyin1: '抖音',
    douyin2: '抖音精选',
    amap: '高德地图',
    switcher: '换机助手',
    notepad: '记事本',
    search: '搜索',
    recorder: '录音',
    infinix: 'Infinix ID'
  },
  en: {
    transsioner: 'Transsioner',
    sms: 'Messages',
    bilibili: 'Bilibili',
    map: 'Maps',
    dingdong: 'Dingdong',
    douyin1: 'Douyin',
    douyin2: 'Douyin Select',
    amap: 'Amap',
    switcher: 'Phone Clone',
    notepad: 'Notepad',
    search: 'Search',
    recorder: 'Voice Memos',
    infinix: 'Infinix ID'
  },
  bn: {
    transsioner: 'Transsioner',
    sms: 'বার্তা',
    bilibili: 'Bilibili',
    map: 'মানচিত্র',
    dingdong: 'Dingdong',
    douyin1: 'Douyin',
    douyin2: 'Douyin Select',
    amap: 'Amap',
    switcher: 'ফোন ক্লোন',
    notepad: 'নোটবুক',
    search: 'অনুসন্ধান',
    recorder: 'ভয়েস মেমো',
    infinix: 'Infinix ID'
  }
}

function buildLocaleNames(locale) {
  const map = { ...EXTRA_APP_NAMES[locale] }
  for (const app of APP_CATALOG) {
    map[app.id] = app.names?.[locale] || app.names?.zh || app.id
  }
  return map
}

export const APP_NAMES = {
  zh: buildLocaleNames('zh'),
  en: buildLocaleNames('en'),
  bn: buildLocaleNames('bn')
}

subscribeCatalog((entry) => {
  for (const locale of ['zh', 'en', 'bn']) {
    APP_NAMES[locale][entry.id] = entry.names?.[locale] || entry.names?.zh || entry.id
  }
})
