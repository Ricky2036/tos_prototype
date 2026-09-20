/**
 * 音量 Plus / 全屏音量面板 / 侧边音量浮层 / 电源菜单 词条（zh / en / bn）。
 *
 * 与 cc-labels.js 同构：只放本模块自己的词条。
 * ⛔ 不要往 messages.js 里塞——那里的约定是「新增应用词条请新建分包」。
 *
 * 组件侧读法（自包含，不改 i18nStore）：
 *   import { VOLUME_LABELS } from '../../locales/volume.js'
 *   import { useI18nStore } from '../../stores/i18nStore'
 *   const i18n = useI18nStore()
 *   const vLabel = (k) => VOLUME_LABELS[i18n.locale]?.[k] ?? VOLUME_LABELS.zh[k] ?? k
 */

export const VOLUME_LABELS = {
  zh: {
    volume: '音量',
    panelTitle: '音量',
    sliderAria: '音量，长按展开全屏音量面板',
    moreVolume: '更多音量',
    customMediaVolume: '自定义媒体音量',
    byAppGuide: '按应用调节音量',
    appMuted: (app) => `${app}已静音`,
    mediaVolume: '媒体音量',
    channels: {
      media: '媒体',
      ring: '铃声',
      notification: '通知',
      alarm: '闹钟',
      microphone: '语音助手'
    },
    powerOff: '关机',
    restart: '重启',
    sos: '紧急呼救',
    sosActivated: '已启动紧急呼救',
    restarting: '正在重启…',
    powerMenuAria: '电源菜单'
  },
  en: {
    volume: 'Volume',
    panelTitle: 'Volume',
    sliderAria: 'Volume, long press to expand the full-screen volume panel',
    moreVolume: 'More volume options',
    customMediaVolume: 'Custom media volume',
    byAppGuide: 'Adjust volume per app',
    appMuted: (app) => `${app} muted`,
    mediaVolume: 'Media volume',
    channels: {
      media: 'Media',
      ring: 'Ring',
      notification: 'Notification',
      alarm: 'Alarm',
      microphone: 'Voice assistant'
    },
    powerOff: 'Power Off',
    restart: 'Restart',
    sos: 'Emergency SOS',
    sosActivated: 'Emergency SOS activated',
    restarting: 'Restarting…',
    powerMenuAria: 'Power menu'
  },
  bn: {
    volume: 'ভলিউম',
    panelTitle: 'ভলিউম',
    sliderAria: 'ভলিউম, ফুল-স্ক্রিন ভলিউম প্যানেল খুলতে দীর্ঘ চাপুন',
    moreVolume: 'আরও ভলিউম',
    customMediaVolume: 'কাস্টম মিডিয়া ভলিউম',
    byAppGuide: 'অ্যাপ অনুযায়ী ভলিউম',
    appMuted: (app) => `${app} মিউট করা হয়েছে`,
    mediaVolume: 'মিডিয়া ভলিউম',
    channels: {
      media: 'মিডিয়া',
      ring: 'রিংটোন',
      notification: 'বিজ্ঞপ্তি',
      alarm: 'অ্যালার্ম',
      microphone: 'ভয়েস অ্যাসিস্ট্যান্ট'
    },
    powerOff: 'পাওয়ার অফ',
    restart: 'রিস্টার্ট',
    sos: 'জরুরি এসওএস',
    sosActivated: 'জরুরি এসওএস চালু হয়েছে',
    restarting: 'রিস্টার্ট হচ্ছে…',
    powerMenuAria: 'পাওয়ার মেনু'
  }
}
