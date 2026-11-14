/**
 * SET-ACC-01 · 辅助功能模块契约测试
 * ===================================
 * 真机依据：`spec/captures/SET-ACC-01-accessibility.md`
 * （Infinix X6878 / Android 17，2026-11-13 23:32–23:45 采集）
 *
 * 前半段是纯逻辑（store 默认值 / 依赖矩阵 / setter 守卫 / 页面自声明），
 * 后半段真实浏览器挂载（行结构、两入口一落地、置灰联动、定时开启展开、返回、持久化），
 * 不读源码、不用正则匹配字符串。
 */
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import {
  ACCESSIBILITY_DEFAULTS, ACCESSIBILITY_KEYS,
  RECORDING_FRAME_RATES, RECORDING_RESOLUTIONS,
  useAccessibilitySettingsStore
} from '../src/stores/accessibilitySettingsStore.js'
import page from '../src/components/apps/settings/pages/accessibility.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const fresh = () => {
  setActivePinia(createPinia())
  return useAccessibilitySettingsStore()
}

const ROOT = '/src/components/apps/settings/SettingsAccessibility.vue'

/* ==================== 纯逻辑：真机默认态 ==================== */
test('真机默认态：辅助功能各行逐值对齐采集包', () => {
  assert.equal(ACCESSIBILITY_DEFAULTS.antiMistouch, true, '防误触默认开')
  assert.deepEqual(ACCESSIBILITY_DEFAULTS.screenRecord, {
    systemSound: true, micSound: false,
    resolution: '超清 (1080P)', frameRate: '低帧率 (24 FPS)',
    tapEffect: true, dnd: false
  })
  assert.deepEqual(ACCESSIBILITY_DEFAULTS.screenshot, {
    fullScreen: true, region: true, deleteAfterShare: true, deleteAfterEdit: true
  })
  assert.equal(ACCESSIBILITY_DEFAULTS.split.dualFinger, false, '双指分屏默认关')
  assert.equal(ACCESSIBILITY_DEFAULTS.smartGrip, true, '智感握姿默认开')
  assert.equal(ACCESSIBILITY_DEFAULTS.outdoor.enabled, false, '户外增强默认关')
  assert.equal(ACCESSIBILITY_DEFAULTS.outdoor.schedule, 'off', '定时开启默认已关闭')
  assert.equal(ACCESSIBILITY_DEFAULTS.motion, false, '晕动舒缓默认关')
  assert.equal(ACCESSIBILITY_DEFAULTS.game.enabled, true, '游戏模式默认开')
})

test('store 默认态与采集包一致，持久化键全部带 tos_acc_ 前缀', () => {
  const s = fresh()
  assert.equal(s.antiMistouch, true)
  assert.equal(s.recSystemSound, true)
  assert.equal(s.recMicSound, false)
  assert.equal(s.recResolution, '超清 (1080P)')
  assert.equal(s.recFrameRate, '低帧率 (24 FPS)')
  assert.equal(s.shotFull && s.shotRegion && s.shotDelAfterShare && s.shotDelAfterEdit, true)
  assert.equal(s.splitDualFinger, false)
  assert.equal(s.sidebarEnabled, true)
  assert.equal(s.sidebarRecent, false)
  assert.equal(s.sidebarRelay, '关闭', '中转站默认值就是「关闭」')
  assert.equal(s.motionEnabled, false)
  assert.equal(s.gameEnabled, true)
  assert.equal(s.gamePanel, true)
  assert.ok(Object.keys(ACCESSIBILITY_KEYS).length >= 28, '状态项与键一一对应')
  assert.ok(Object.values(ACCESSIBILITY_KEYS).every(k => k.startsWith('tos_acc_')))
})

test('setFlag 只认已声明的行，未知 key 返回 false 且不改任何状态', () => {
  const s = fresh()
  assert.equal(s.setFlag('antiMistouch', false), true)
  assert.equal(s.antiMistouch, false)
  assert.equal(s.setFlag('notARow', true), false)
  assert.equal(s.antiMistouch, false, '未知 key 不得影响已有状态')
})

/* ==================== 纯逻辑：户外增强依赖矩阵 ==================== */
test('总开关关闭 → 支持的功能不可编辑；打开 → 可编辑；切换不改子项状态', () => {
  const s = fresh()
  assert.equal(s.outdoorEnabled, false)
  assert.equal(s.outdoorFeaturesEditable, false, '默认关 → 三项整行置灰')

  s.setFlag('outdoorEnabled', true)
  assert.equal(s.outdoorFeaturesEditable, true)
  assert.equal(s.outdoorBrightness, true, '子项状态保持真机默认开')
  assert.equal(s.outdoorHandsFree, true)
  assert.equal(s.outdoorExtendScreenOff, true)

  s.setFlag('outdoorHandsFree', false)
  s.setFlag('outdoorEnabled', false)
  assert.equal(s.outdoorHandsFree, false, '关总开关不重置子项')
})

test('定时开启只有 已关闭 / 定时开启 两态，非法值被拒', () => {
  const s = fresh()
  assert.equal(s.outdoorSchedule, 'off')
  assert.equal(s.outdoorScheduleLabel, '已关闭')
  assert.equal(s.setOutdoorSchedule('on'), false, '真机没有「on」这个态')
  assert.equal(s.outdoorSchedule, 'off')
  assert.equal(s.setOutdoorSchedule('scheduled'), true)
  assert.equal(s.outdoorScheduleLabel, '已开启')
})

test('开始/结束时间只接受 HH:mm，且分别写入各自字段', () => {
  const s = fresh()
  assert.equal(s.outdoorStart, '23:43')
  assert.equal(s.outdoorEnd, '07:43')
  assert.equal(s.setOutdoorTime('start', '7:5'), false, '不合法格式拒绝')
  assert.equal(s.setOutdoorTime('middle', '08:00'), false)
  assert.equal(s.setOutdoorTime('start', '06:30'), true)
  assert.equal(s.setOutdoorTime('end', '22:15'), true)
  assert.equal(s.outdoorStart, '06:30')
  assert.equal(s.outdoorEnd, '22:15')
})

test('清晰度/帧率只接受已取证档位（猜出来的 720P/480P、30/60FPS 必须被拒）', () => {
  const s = fresh()
  // 真机只采到当前值；未取证档位一律拒绝，避免把猜的能力写进状态
  assert.deepEqual(RECORDING_RESOLUTIONS, ['超清 (1080P)'])
  assert.deepEqual(RECORDING_FRAME_RATES, ['低帧率 (24 FPS)'])
  assert.equal(s.setRecResolution('高清 (720P)'), false)
  assert.equal(s.setRecResolution('标清 (480P)'), false)
  assert.equal(s.recResolution, '超清 (1080P)')
  assert.equal(s.setRecFrameRate('标准 (30 FPS)'), false)
  assert.equal(s.setRecFrameRate('高帧率 (60 FPS)'), false)
  assert.equal(s.recFrameRate, '低帧率 (24 FPS)')
  assert.equal(s.setRecResolution('超清 (1080P)'), true, '已取证档位可重复写入')
})

/* ==================== 页面自声明 ==================== */
test('pages/accessibility.js 自声明完整，搜索项覆盖子页且不自带 action', () => {
  assert.equal(page.id, 'accessibility')
  assert.equal(page.title, '辅助功能')
  assert.equal(page.titleKey, 'accessibility')
  assert.equal(page.cluster, 'C2')
  assert.equal(page.group, '系统')
  assert.equal(page.order, 602, '首页第 6 组第 2 行')
  assert.equal(typeof page.component, 'function', 'component 必须是懒加载器')
  const ids = page.searchItems.map(i => i.id)
  for (const key of ['accessibility', 'accessibilityRecord', 'accessibilityScreenshot',
    'accessibilitySidebar', 'accessibilityOutdoor', 'accessibilityAntiMistouch']) {
    assert.ok(ids.includes(key), `搜索池缺 ${key}`)
  }
  assert.ok(page.searchItems.every(i => !('action' in i)), '搜索项不得自带 action（主壳注入）')
})

/* ==================== 浏览器：真实渲染与交互 ==================== */
let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })
beforeEach(async () => {
  if (!rt) return
  await rt.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('tos_acc_')) localStorage.removeItem(k)
    }
  })
})

const wait = (ms) => new Promise(r => setTimeout(r, ms))
const rowIds = (id) => rt.evaluate(({ hostId }) => {
  const host = window.__wbHosts.get(hostId).host
  return [...host.querySelectorAll('[data-testid^="acc-row-"]')]
    .map(e => e.getAttribute('data-testid'))
}, { hostId: id })

test('浏览器：主页 12 行按真机顺序排列，卡片分组 5 张', async () => {
  const id = await rt.mount(ROOT)
  assert.deepEqual(await rowIds(id), [
    'acc-row-a11y', 'acc-row-record', 'acc-row-screenshot', 'acc-row-gesture', 'acc-row-grip',
    'acc-row-float', 'acc-row-split', 'acc-row-sidebar',
    'acc-row-outdoor', 'acc-row-motion', 'acc-row-game', 'acc-row-mistouch'
  ])
  assert.equal(await rt.count(id, '.settings-card'), 5, '无障碍 / 交互控制 / 快捷多任务 / 场景增强 / 防误触')
  assert.equal(await rt.text(id, '.hero-title'), '辅助功能')
  assert.equal(await rt.text(id, '.gn-title'), '辅助功能')
  await rt.unmount(id)
})

test('浏览器：点行进子页、返回回主页（录屏）', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-record"]', 80)
  assert.equal(await rt.text(id, '.sub-shell .gn-title'), '录屏')
  assert.equal(await rt.count(id, '[data-testid="rec-sound-card"]'), 1)
  await rt.click(id, '.sub-shell .gn-back', 80)
  assert.equal(await rt.count(id, '[data-testid="acc-row-record"]'), 1, '返回后应回到辅助功能主页')
  await rt.unmount(id)
})

test('浏览器：两入口一落地（动作与手势=智感握姿 · 小窗=应用分屏）', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-gesture"]', 80)
  await wait(420)
  assert.equal(await rt.count(id, '[data-testid="grip-card"]'), 1, '动作与手势落到智感握姿页')
  await rt.click(id, '.sub-shell .gn-back', 80)
  await wait(420)
  await rt.click(id, '[data-testid="acc-row-grip"]', 80)
  await wait(420)
  assert.equal(await rt.count(id, '[data-testid="grip-card"]'), 1, '智感握姿入口同页')
  await rt.click(id, '.sub-shell .gn-back', 80)
  await wait(420)
  await rt.click(id, '[data-testid="acc-row-float"]', 80)
  await wait(420)
  assert.equal(await rt.count(id, '[data-testid="split-card"]'), 1, '小窗落到应用分屏页')
  await rt.click(id, '.sub-shell .gn-back', 80)
  await wait(420)
  await rt.click(id, '[data-testid="acc-row-split"]', 80)
  await wait(420)
  assert.equal(await rt.count(id, '[data-testid="split-card"]'), 1, '应用分屏入口同页')
  await rt.unmount(id)
})

test('浏览器：户外增强总开关控制三项置灰，子项状态不被重置', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-outdoor"]', 80)
  const dimOf = () => rt.evaluate(({ hostId }) => {
    const host = window.__wbHosts.get(hostId).host
    return host.querySelector('[data-testid="outdoor-features"]').classList.contains('acc-dim')
  }, { hostId: id })
  assert.equal(await dimOf(), true, '默认关 → 置灰')
  await rt.click(id, '[data-testid="outdoor-master"] .toggle-switch', 80)
  assert.equal(await dimOf(), false, '开了 → 可点')
  await rt.click(id, '[data-testid="outdoor-master"] .toggle-switch', 80)
  assert.equal(await dimOf(), true, '再关 → 重新置灰')
  await rt.unmount(id)
})

test('浏览器：定时开启选中后展开开始/结束时间，选回已关闭收起', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-outdoor"]', 80)
  await rt.click(id, '[data-testid="outdoor-schedule-row"]', 80)
  assert.equal(await rt.count(id, '[data-testid="schedule-radio"]'), 1, '应进入定时开启页')
  await rt.click(id, '[data-testid="schedule-radio"] .acc-radio-row.is-last', 80)
  assert.equal(await rt.count(id, '[data-testid="schedule-times"]'), 1, '选中后应展开时间卡')
  assert.equal(await rt.text(id, '[data-testid="schedule-times"] .list-cell .lc-title'), '开始时间')
  await rt.click(id, '[data-testid="schedule-radio"] .acc-radio-row:not(.is-last)', 80)
  assert.equal(await rt.count(id, '[data-testid="schedule-times"]'), 0, '选回已关闭应收起')
  await rt.unmount(id)
})

test('浏览器：录屏清晰度/帧率不再弹猜测选择器，落到缺口页', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-record"]', 80)
  await wait(380)
  await rt.click(id, '[data-testid="rec-resolution"]', 80)
  await wait(380)
  assert.equal(await rt.count(id, '[data-testid="acc-pending"]'), 1, '应落到缺口页而不是假选择器')
  assert.equal(await rt.text(id, '[data-testid="acc-pending"] h3'), '清晰度')
  assert.equal(await rt.count(id, '.picker-row'), 0, '不得再出现编造的档位列表')
  await rt.unmount(id)
})

test('浏览器：未取证深层入口落到缺口页，不伪装成已实现', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-game"]', 80)
  await rt.click(id, '[data-testid="game-manage"]', 80)
  assert.equal(await rt.count(id, '[data-testid="acc-pending"]'), 1, '应落到缺口页')
  assert.equal(await rt.text(id, '[data-testid="acc-pending"] h3'), '游戏管理')
  const body = await rt.text(id, '[data-testid="acc-pending"]')
  assert.ok(body.includes('没有真机采集'), '缺口页必须写清未采集')
  await rt.unmount(id)
})

test('浏览器：防误触切换后卸载重挂仍保持（真机无二次确认、即时生效）', async () => {
  const id = await rt.mount(ROOT)
  const state = () => rt.evaluate(({ hostId }) => {
    const host = window.__wbHosts.get(hostId).host
    return host.querySelector('[data-testid="anti-mistouch"]').getAttribute('aria-checked')
  }, { hostId: id })
  assert.equal(await state(), 'true', '真机默认开')
  await rt.click(id, '[data-testid="anti-mistouch"]', 80)
  assert.equal(await state(), 'false')
  await rt.unmount(id)
  const again = await rt.mount(ROOT)
  const after = await rt.evaluate(({ hostId }) => {
    const host = window.__wbHosts.get(hostId).host
    return host.querySelector('[data-testid="anti-mistouch"]').getAttribute('aria-checked')
  }, { hostId: again })
  assert.equal(after, 'false', '重进应保持关闭')
  await rt.unmount(again)
})

/* ==================== 浏览器：真机几何标定 ====================
   数值来自 `22_acc_main_full.png` / `52_sidebar2_full.png` / `42_screenshot_full.png`
   在**卡片中线 x=1000**（避开 16px 圆角内缩）逐像素扫色带得到，
   设计画布 360 宽 = 物理 1208 ÷ 3.3556。容差 ±2px（真机行高本身有 ±1 抖动）。 */
test('浏览器：主页几何对齐真机（hero 179 · 图标 48 · 卡间距 16 · 行高 56/50/67/72）', async () => {
  const id = await rt.mount(ROOT)
  const hero = await rt.rect(id, '.accessibility-hero-card')
  assert.ok(Math.abs(hero.height - 178.8) <= 2, `hero 高 ${hero.height.toFixed(1)}，真机 178.8`)
  const icon = await rt.rect(id, '.hero-icon-img')
  assert.equal(Math.round(icon.width), 48, '真机 hero 图标 47.7×47.7')
  assert.equal(Math.round(icon.height), 48)

  const a11y = await rt.rect(id, '[data-testid="acc-row-a11y"]')
  const rec = await rt.rect(id, '[data-testid="acc-row-record"]')
  const floatRow = await rt.rect(id, '[data-testid="acc-row-float"]')
  const mistouch = await rt.rect(id, '[data-testid="acc-row-mistouch"]')
  assert.equal(Math.round(a11y.height), 56, '单行卡「无障碍」真机 56.3')
  assert.equal(Math.round(mistouch.height), 72, '单行卡「防误触」（带副标题）真机 72.1')
  assert.equal(Math.round(rec.height), 50, '分组内无副标题行真机 50.4')
  assert.equal(Math.round(floatRow.height), 67, '分组内带副标题行真机 67.2')
  assert.equal(Math.round(rec.top - (a11y.top + a11y.height)), 16, '卡片间距真机 16.1')
  await rt.unmount(id)
})

test('浏览器：子页插图是满幅横带 360×240，侧边栏真机只有一行灰字说明', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-sidebar"]', 80)
  await wait(420)
  const img = await rt.rect(id, '.acc-illus-img')
  assert.equal(Math.round(img.width), 360, '插图带必须满幅（素材本身就含页面底色）')
  assert.equal(Math.round(img.height), 240, '插图带真机高 240')
  assert.equal(await rt.count(id, '.acc-illus-title'), 0, '真机侧边栏没有加粗标题，只有一行说明')
  assert.equal(await rt.count(id, '.acc-illus-desc.is-solo'), 1, '无标题时说明走 solo 间距')
  assert.equal(await rt.text(id, '.acc-illus-desc'), '侧滑呼出侧边栏，快捷开启小窗应用。')
  assert.equal(await rt.count(id, '.acc-dot'), 3, '真机 3 个圆点')
  await rt.unmount(id)
})

test('浏览器：截屏页标题+说明+4 圆点，组标题「截屏方式」14px 灰字', async () => {
  const id = await rt.mount(ROOT)
  await rt.click(id, '[data-testid="acc-row-screenshot"]', 80)
  await wait(420)
  assert.equal(await rt.text(id, '.acc-illus-title'), '截取全屏')
  assert.equal(await rt.text(id, '.acc-illus-desc'), '三指下滑快速截取全屏。')
  assert.equal(await rt.count(id, '.acc-dot'), 4, '真机 4 个圆点')
  assert.equal(await rt.count(id, '.acc-illus-desc.is-solo'), 0, '有标题时说明不套 solo 间距')
  assert.equal(await rt.text(id, '.acc-group-title'), '截屏方式')
  assert.equal(await rt.style(id, '.acc-group-title', 'font-size'), '14px', '真机组标题 14px')
  await rt.unmount(id)
})
