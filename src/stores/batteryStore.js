import { defineStore } from 'pinia'
import { readJson, writeRaw } from '../utils/localPrefs.js'

/**
 * 电池与省电偏好（对齐真机 Infinix X6878 / XOS 17，
 * 采集：`.local-evidence/SET-BAT-01/`，2026-11-13 DSH）。
 *
 * 归属：设置 → 电池与省电（首页 / 省电管理 / 充电设置 / 电池健康 / 应用耗电详情）。
 * ⚠️ node 单测没有 localStorage，读写一律走 localPrefs 包装。
 */
const KEY = 'tos.settings.battery.v1'

export const BATTERY_MODES = ['saver', 'balanced']

/** 真机「电池模式」说明卡（首页 ⓘ）三条文案 */
export const MODE_INFO = [
  {
    id: 'saver',
    title: '省电模式',
    desc: '为延长续航，性能将适当降低，部分功能将不可用。'
  },
  {
    id: 'balanced',
    title: '均衡模式',
    desc: '平衡性能和续航。'
  },
  {
    id: 'super',
    title: '超级省电',
    desc: '系统性能受限，最多可同时使用 6 个应用。'
  }
]

/** 充电速度单选（真机默认智能充电） */
export const CHARGE_SPEED_OPTIONS = [
  { value: 'smart', title: '智能充电', subtitle: '智能调节充电速度，以达到最佳的充电效果。' },
  {
    value: 'lowTemp',
    title: '低温充电',
    subtitle: '减少充电发热以延长电池使用寿命，但会降低充电速度。'
  }
]

/** 电池健康 → 充电保护单选（真机默认 AI 智能充电保护） */
export const CHARGE_PROTECTION_OPTIONS = [
  { value: 'normal', title: '正常充满', subtitle: '每次充电至100%时自动停止充电。' },
  {
    value: 'ai',
    title: 'AI智能充电保护',
    subtitle: '根据充电习惯,在长时间充电场景智能限制充电上限为80%，以延长电池寿命。'
  },
  {
    value: 'custom',
    title: '自定义充电保护',
    subtitle: '开启后可自行设置充电上限，建议设置为80%-90%，延缓电池老化。'
  }
]

/** 应用耗电详情 → 耗电行为控制（真机默认智能管理） */
export const APP_BEHAVIOR_OPTIONS = [
  {
    value: 'smart',
    title: '智能管理',
    subtitle: '智能识别应用的状态并限制其在后台运行，不影响即时消息。'
  },
  { value: 'unrestricted', title: '无限制', subtitle: '不采取任何限制措施。' }
]

/** 自定义充电上限档位（真机只给了「建议 80%-90%」，档位为原型实现） */
export const CUSTOM_LIMIT_OPTIONS = [80, 85, 90, 95]

export const BATTERY_DEFAULTS = {
  mode: 'balanced',
  superSaver: false,
  /** '24h' | '7d'，只影响首页图表/文案，不跨会话记忆 */
  timeRange: '24h',
  autoSaverEnabled: false,
  autoSaverThreshold: 5,
  autoExitSaver: true,
  refresh60: true,
  darkTheme: true,
  autoSleep15: true,
  sleepStandby: true,
  chargeSpeed: 'smart',
  reverseWireless: false,
  bypassCharging: false,
  chargeProtection: 'ai',
  customChargeLimit: 80,
  /** appId → 'smart' | 'unrestricted'（缺省 = 智能管理） */
  appBehavior: {}
}

/* ---------------- 剩余时间估算 ----------------
 * 真机实测（2026-11-13，87%，充电中）：
 *   均衡 26 小时 37 分钟 · 省电 30 小时 56 分钟 · 超级省电 32 小时 29 分钟
 * 三种模式分别按 18.36 / 21.33 / 22.40 分钟每 1% 外推；只用于原型展示，不是产品算法。
 */
const MINUTES_PER_PERCENT = { balanced: 18.36, saver: 21.33, super: 22.4 }

export function estimateMinutes(percent, mode = 'balanced') {
  const factor = MINUTES_PER_PERCENT[mode] ?? MINUTES_PER_PERCENT.balanced
  return Math.max(0, Math.round(Number(percent || 0) * factor))
}

/** 与真机同款中文时长：「26 小时 37 分钟」；不足 1 小时只显示分钟 */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h <= 0) return `${m} 分钟`
  return `${h} 小时 ${m} 分钟`
}

export const useBatteryStore = defineStore('battery', {
  state: () => ({ ...BATTERY_DEFAULTS, ...readJson(KEY, {}) }),

  getters: {
    /** 选中模式的整机续航估算（不含超级省电） */
    modeMinutes: (s) => (percent) => estimateMinutes(percent, s.mode),
    superSaverMinutes: () => (percent) => estimateMinutes(percent, 'super'),
    behaviorOf: (s) => (appId) => s.appBehavior?.[appId] || 'smart'
  },

  actions: {
    patch(partial) {
      Object.assign(this, partial)
      this.save()
    },

    save() {
      const {
        mode, superSaver, autoSaverEnabled, autoSaverThreshold, autoExitSaver,
        refresh60, darkTheme, autoSleep15, sleepStandby, chargeSpeed,
        reverseWireless, bypassCharging, chargeProtection, customChargeLimit,
        appBehavior
      } = this
      writeRaw(KEY, JSON.stringify({
        mode, superSaver, autoSaverEnabled, autoSaverThreshold, autoExitSaver,
        refresh60, darkTheme, autoSleep15, sleepStandby, chargeSpeed,
        reverseWireless, bypassCharging, chargeProtection, customChargeLimit,
        appBehavior
      }))
    },

    setMode(mode) {
      if (!BATTERY_MODES.includes(mode)) return
      this.patch({ mode })
    },

    setSuperSaver(on) {
      this.patch({ superSaver: Boolean(on) })
    },

    setTimeRange(range) {
      // 分段切换是瞬时视图，不写入 localStorage
      this.timeRange = range === '7d' ? '7d' : '24h'
    },

    setAppBehavior(appId, behavior) {
      this.patch({ appBehavior: { ...this.appBehavior, [appId]: behavior } })
    }
  }
})
