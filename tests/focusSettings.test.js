import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { createDefaultFocusModes, focusShortName, formatRepeat, formatSchedule, useFocusSettingsStore } from '../src/stores/focusSettingsStore.js'
import { useControlStore } from '../src/stores/controlStore.js'

const read = p => fs.readFileSync(path.resolve(p), 'utf8')
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
function fresh() {
  setActivePinia(createPinia())
  return useFocusSettingsStore()
}

test('专注模式默认清单与参考录屏一致', () => {
  const modes = createDefaultFocusModes()
  assert.deepEqual(modes.map(m => m.id), ['dnd', 'personal', 'work', 'sleep', 'classroom'])
  const classroom = modes.find(m => m.id === 'classroom')
  assert.equal(classroom.name, '课堂专注模式')
  assert.equal(classroom.icon, 'graduationCap')
  assert.equal(classroom.schedules.length, 5)
  assert.deepEqual(classroom.filters, ['lowPower', 'silent'])
  assert.deepEqual(classroom.allowedApps, ['wechat', 'mori'])
})

test('激活、切换和关闭统一驱动设置、控制中心与状态栏开关', () => {
  const focus = fresh()
  const control = useControlStore()
  assert.equal(focus.activate('classroom'), true)
  assert.equal(focus.state.activeId, 'classroom')
  assert.equal(control.dnd, true)
  assert.equal(control.doNotDisturb, true)
  focus.toggle('classroom')
  assert.equal(focus.state.activeId, null)
  assert.equal(control.dnd, false)
  assert.equal(control.doNotDisturb, false)
  assert.equal(focus.activate('missing'), false)
})

test('创建、编辑与删除自定义模式形成完整闭环', () => {
  const focus = fresh()
  assert.equal(focus.createMode({ name: '  ' }), null)
  const id = focus.createMode({ name: '礼拜', icon: 'graduationCap', color: '#5E5CE6', allowedPeople: ['蔡'], allowedApps: ['wechat'] })
  assert.ok(id.startsWith('custom-'))
  assert.equal(focus.getMode(id).name, '礼拜专注模式')
  assert.equal(focus.getMode(id).custom, true)
  focus.updateMode(id, { name: '自习专注模式', smartActivation: true })
  assert.equal(focus.getMode(id).name, '自习专注模式')
  assert.equal(focus.getMode(id).smartActivation, true)
  assert.equal(focus.deleteMode('dnd'), false, '系统预设不可删除')
  assert.equal(focus.deleteMode(id), true)
  assert.equal(focus.getMode(id), null)
})

test('联系人、App、屏幕、三类定时与过滤条件均真实落库', () => {
  const focus = fresh()
  focus.togglePerson('classroom', 'Ricky')
  assert.ok(focus.getMode('classroom').allowedPeople.includes('Ricky'))
  focus.toggleApp('classroom', 'camera')
  assert.ok(focus.getMode('classroom').allowedApps.includes('camera'))
  assert.equal(focus.setScreen('classroom', 'lock', 'ocean'), true)
  assert.equal(focus.getMode('classroom').screens.lock, 'ocean')
  const timeId = focus.addSchedule('classroom', { type: 'time', start: '20:20', end: '20:30', days: [5] })
  assert.ok(timeId)
  focus.updateSchedule('classroom', timeId, { end: '21:00', days: [1, 5] })
  assert.equal(focus.getMode('classroom').schedules.find(s => s.id === timeId).end, '21:00')
  const locationId = focus.addSchedule('classroom', { type: 'location', name: '公司' })
  const appId = focus.addSchedule('classroom', { type: 'app', appId: 'camera', name: '相机' })
  assert.ok(locationId && appId)
  focus.removeSchedule('classroom', locationId)
  assert.equal(focus.getMode('classroom').schedules.some(s => s.id === locationId), false)
  focus.toggleFilter('classroom', 'darkAppearance')
  assert.ok(focus.getMode('classroom').filters.includes('darkAppearance'))
  focus.setFilterValue('classroom', 'calendars', ['学习'])
  assert.deepEqual(focus.getMode('classroom').filterValues.calendars, ['学习'])
  focus.setOption('classroom', 'hideBadges', true)
  assert.equal(focus.getMode('classroom').options.hideBadges, true)
})

test('列表短名称与定时副标题格式化正确', () => {
  assert.equal(focusShortName({ id: 'dnd', name: '勿扰模式' }), '勿扰模式')
  assert.equal(focusShortName({ id: 'custom', name: '礼拜专注模式' }), '礼拜')
  assert.equal(formatSchedule({ type: 'time', start: '09:00', end: '10:00' }), '09:00–10:00')
  assert.equal(formatRepeat([0, 1, 2, 3, 4, 5, 6]), '每天')
  assert.equal(formatRepeat([1, 5]), '周一、周五')
})

test('设置入口、深链、逐层返回与控制中心 2×1 开关全部接线', () => {
  const app = strip(read('src/components/apps/settings/SettingsApp.vue'))
  assert.match(app, /title="Infinix AI"[\s\S]*?data-setting-row="focus"[\s\S]*?title="模式和日常程序"/)
  assert.match(app, /view\.value === 'focus' && focusRef\.value\?\.back/)
  assert.match(app, /<SettingsFocus ref="focusRef" @back="pop"/)
  const cc = strip(read('src/components/system/ControlCenter.vue'))
  assert.match(cc, /id: 'dnd'[^}]+defaultSize: '2x1'/)
  assert.match(cc, /id === 'dnd'\) \{\s*focusSwitcherOpen\.value = true/)
  assert.match(cc, /notifications\.targetView = 'focus'/)
  const tile = strip(read('src/components/system/cc/GridButton.vue'))
  assert.match(tile, /item\.id === 'dnd'[\s\S]*?专注模式/)
  const layout = read('src/utils/privacyControlLayout.js')
  assert.match(layout, /\['dnd','toggle','2x1'\]/)
  const oldDnd = strip(read('src/components/apps/settings/SettingsDND.vue'))
  assert.match(oldDnd, /focus\.activate\('dnd'\)/)
})

test('专注模块图标契约：不手绘 SVG，所有 LIcon 名称均已注册', () => {
  const files = [
    ...fs.readdirSync('src/components/apps/settings/focus').filter(f => f.endsWith('.vue')).map(f => `src/components/apps/settings/focus/${f}`),
    'src/components/system/cc/FocusSwitcher.vue'
  ]
  const exported = read('src/assets/icons/lucide.js').split('export const LUCIDE')[1]
  for (const file of files) {
    const src = strip(read(file))
    assert.equal((src.match(/<svg\b/g) || []).length, 0, `${file} 出现手绘 SVG`)
    for (const match of src.matchAll(/<LIcon[^>]*(?<!:)\bname="([A-Za-z0-9]+)"/g)) {
      assert.ok(new RegExp(`\\b${match[1]}\\b`).test(exported), `${file} 使用未注册图标 ${match[1]}`)
    }
  }
})
