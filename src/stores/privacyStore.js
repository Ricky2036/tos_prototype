import { defineStore } from 'pinia'

export const PERMISSIONS = {
  camera: { label: '相机', icon: 'camera', color: '#31C65A', priority: 3 },
  microphone: { label: '麦克风', icon: 'mic', color: '#FFCC00', priority: 2 },
  location: { label: '位置', icon: 'navigation', color: '#1A88FF', priority: 1 }
}
export const DEMO_APPS = {
  camera: { name: '相机', icon: 'camera', color: '#888d96' },
  recorder: { name: '录音机', icon: 'mic', color: '#ef675c' },
  wechat: { name: '微信', icon: 'messageCircle', color: '#28ba57' },
  maps: { name: '地图', icon: 'navigation', color: '#1A88FF' },
  longname: { name: '旅行助手与实时位置共享服务', icon: 'navigation', color: '#8767e7' }
}
export const RECENT_MS = 20000
export const EXPAND_MS = 3000
export const ICON_DURATIONS = [1, 2, 3, 5]
export const PERMISSION_APPS = { camera: 'camera', microphone: 'recorder', location: 'maps' }
export const PERMISSION_APP_SCENARIOS = [
  {app:'camera', permissions:['camera','microphone','location'], combinations:[['camera','microphone'],['camera','location'],['camera','microphone','location']]},
  {app:'recorder', permissions:['microphone','location'], combinations:[]},
  {app:'maps', permissions:['camera','microphone','location'], combinations:[['camera','microphone'],['microphone','location'],['camera','microphone','location']]}
]
export function dominantPermission(keys) {
  return [...keys].sort((a, b) => PERMISSIONS[b].priority - PERMISSIONS[a].priority)[0]
}

export const usePrivacyStore = defineStore('privacy', {
  state: () => ({
    now: Date.now(), entries: [], history: [], expandedUntil: 0, iconDurationSeconds: EXPAND_MS / 1000, sequence: 0, batchSequence: 0,
    page: null, settingsPage: null, selectedApp: null, selectedPermission: null, returnPage: 'detail',
    access: {}, micGreen: false
  }),
  getters: {
    active: s => s.entries.filter(e => e.stoppedAt === null),
    recent: s => s.entries.filter(e => e.stoppedAt !== null && s.now - e.stoppedAt < RECENT_MS),
    relevant() { return [...this.active, ...this.recent] },
    statusKeys() { return [...new Set(this.active.map(e => e.permission))].sort((a,b) => PERMISSIONS[b].priority - PERMISSIONS[a].priority) },
    statusExpanded: s => s.now < s.expandedUntil,
    statusPrimary() {
      if (!this.active.length) return undefined
      const latestBatch = Math.max(...this.active.map(e => e.batch))
      return dominantPermission(this.active.filter(e => e.batch === latestBatch).map(e => e.permission))
    },
    summary() {
      const list = [...this.relevant].sort((a,b) => a.order - b.order)
      if (!list.length) return null
      const latest = [...(this.active.length ? this.active : list)].sort((a,b) => b.order - a.order)[0]
      const apps = [...new Set(list.map(e => e.app))]
      const keys = [...new Set(list.map(e => e.permission))].sort((a,b) => PERMISSIONS[b].priority - PERMISSIONS[a].priority)
      return { app: latest.app, keys, primary: this.active.length ? this.statusPrimary : dominantPermission(keys), isActive: !!this.active.length,
        apps, appCount: apps.length }
    },
    groups() {
      const apps = this.summary?.apps || []
      return apps.map(app => ({ app, entries: this.relevant.filter(e => e.app === app).sort((a,b) => PERMISSIONS[b.permission].priority - PERMISSIONS[a.permission].priority) }))
    }
  },
  actions: {
    tick(now = Date.now()) { this.now = now; this.entries = this.entries.filter(e => e.stoppedAt === null || now - e.stoppedAt < RECENT_MS) },
    color(key) { return PERMISSIONS[key].color },
    start(app, keys, now = Date.now()) {
      this.startCalls(keys.map(permission => ({app, permission})), now)
    },
    startMappedPermissions(keys, now = Date.now()) {
      this.startCalls(keys.map(permission => ({app: PERMISSION_APPS[permission], permission})), now)
    },
    startCalls(calls, now = Date.now()) {
      this.tick(now)
      let changed = false
      const batch = this.batchSequence + 1
      for (const {app, permission} of calls) {
        if (this.access[`${app}:${permission}`] === 'deny') continue
        if (this.active.some(e => e.app === app && e.permission === permission)) continue
        this.entries = this.entries.filter(e => !(e.app === app && e.permission === permission))
        this.entries.push({app, permission, startedAt: now, stoppedAt: null, order: ++this.sequence, batch})
        changed = true
      }
      if (changed) { this.batchSequence = batch; this.expandedUntil = now + this.iconDurationSeconds * 1000 }
    },
    stop(app = null, keys = null, now = Date.now()) {
      this.tick(now)
      for (const e of this.entries) {
        if (e.stoppedAt === null && (!app || e.app === app) && (!keys || keys.includes(e.permission))) {
          e.stoppedAt = now
          this.history.unshift({ ...e })
        }
      }
      this.history = this.history.slice(0, 60)
    },
    reset() { this.entries = []; this.history = []; this.expandedUntil = 0; this.page = null; this.settingsPage = null; this.access = {} },
    setIconDuration(seconds, now = Date.now()) {
      if (!ICON_DURATIONS.includes(seconds)) return
      if (this.iconDurationSeconds === seconds) return
      this.iconDurationSeconds = seconds
      this.replay(now)
    },
    replay(now = Date.now()) { this.tick(now); if (this.active.length) this.expandedUntil = now + this.iconDurationSeconds * 1000 },
    openDetail() { this.page = 'detail' },
    openSettings(app, permission, from = 'detail') { this.selectedApp = app; this.selectedPermission = permission; this.returnPage = from; this.page = 'settings' },
    setAccess(value) {
      this.access[`${this.selectedApp}:${this.selectedPermission}`] = value
      if (value === 'deny') this.stop(this.selectedApp, [this.selectedPermission])
    }
  }
})
