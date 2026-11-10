import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { useClockStore, formatDaysRepeat } from '../src/stores/clockStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('formatDaysRepeat formats day arrays accurately', () => {
  assert.equal(formatDaysRepeat([]), '仅一次')
  assert.equal(formatDaysRepeat([0, 1, 2, 3, 4, 5, 6]), '每天')
  assert.equal(formatDaysRepeat([1, 2, 3, 4, 5]), '周一至周五')
  assert.equal(formatDaysRepeat([0, 6]), '周日, 周六')
  assert.equal(formatDaysRepeat([6, 0]), '周日, 周六') // handles unsorted input
  assert.equal(formatDaysRepeat([1, 3, 5]), '周一, 周三, 周五')
})

test('clockStore updateAlarm updates alarm properties and recalculates repeatLabel', () => {
  setActivePinia(createPinia())
  const clock = useClockStore()

  // Test updating existing alarm a1
  const updated = clock.updateAlarm('a1', {
    time: '07:30',
    days: [1, 2, 3, 4, 5],
    snooze: '15 分钟，3 次',
    ringtone: '麦加唤礼声'
  })

  assert.ok(updated)
  assert.equal(updated.time, '07:30')
  assert.equal(updated.repeatLabel, '周一至周五')
  assert.equal(updated.snooze, '15 分钟，3 次')
  assert.equal(updated.ringtone, '麦加唤礼声')

  // Verify in alarms array
  const a1 = clock.alarms.find((a) => a.id === 'a1')
  assert.equal(a1.time, '07:30')
  assert.equal(a1.repeatLabel, '周一至周五')
})

test('clockStore addAlarm includes all standard fields matching reference design', () => {
  setActivePinia(createPinia())
  const clock = useClockStore()

  const newAlarm = clock.addAlarm({
    time: '06:30',
    days: [0, 6],
    label: '早锻炼'
  })

  assert.ok(newAlarm.id)
  assert.equal(newAlarm.time, '06:30')
  assert.equal(newAlarm.repeatLabel, '周日, 周六')
  assert.equal(newAlarm.ringtone, '默认铃声')
  assert.equal(newAlarm.snooze, '10 分钟, 3 次')
  assert.equal(newAlarm.vibration, '跟随音乐节奏')
  assert.equal(newAlarm.folaxBroadcast, '已关闭')
  assert.equal(newAlarm.ringDateEnabled, false)
})

test('AlarmEditModal component exists and matches reference screenshot structure', () => {
  const modalPath = path.resolve(__dirname, '../src/components/apps/clock/subpages/AlarmEditModal.vue')
  assert.ok(fs.existsSync(modalPath), 'AlarmEditModal.vue must exist')
  const content = fs.readFileSync(modalPath, 'utf-8')

  // Header and title
  assert.ok(content.includes('modalTitle'), 'Must compute modalTitle (编辑闹钟 / 新建闹钟)')
  assert.ok(content.includes('modal-close-circle'), 'Must provide circular close button')

  // 全仓标准滚轮（inline 形态）：深色弹层 + 24 小时制
  assert.ok(content.includes('TimeWheel'), 'Must integrate the standard TimeWheel')
  assert.ok(content.includes('hour-mode="24"'), 'Alarm editing uses 24-hour drum')
  assert.ok(content.includes('tone="dark"'), 'Alarm editing keeps dark tone inside the dark modal')

  // Card 1 rows
  assert.ok(content.includes('重复'), 'Must include 重复 row')
  assert.ok(content.includes('指定日期响铃'), 'Must include 指定日期响铃 row')
  assert.ok(content.includes('闹钟提示音'), 'Must include 闹钟提示音 row')
  assert.ok(content.includes('标签'), 'Must include 标签 row')
  assert.ok(content.includes('稍后提醒'), 'Must include 稍后提醒 row')
  assert.ok(content.includes('响铃时振动'), 'Must include 响铃时振动 row')

  // Card 2 Folax broadcast
  assert.ok(content.includes('Folax 闹钟播报'), 'Must include Folax 闹钟播报')
  assert.ok(content.includes('响铃时将智能播报所选内容。'), 'Must include Folax description')

  // Pill save button & delete button
  assert.ok(content.includes('btn-save-pill'), 'Must include pill-shaped save button')
  assert.ok(content.includes('删除闹钟'), 'Must include delete alarm option in edit mode')
})

test('Standard TimeWheel provides three-column drum with light/dark tones', () => {
  const wheelPath = path.resolve(__dirname, '../src/components/ui/TimeWheel.vue')
  assert.ok(fs.existsSync(wheelPath), 'TimeWheel.vue must exist')
  const content = fs.readFileSync(wheelPath, 'utf-8')

  assert.ok(content.includes('data-time-wheel'), 'Must expose the standard wheel root')
  assert.ok(content.includes("['hour', 'minute', 'period']"), '12-hour mode has three columns incl. AM/PM')
  assert.ok(content.includes('hourMode'), 'Must support 24-hour mode for alarm editing')
  assert.ok(content.includes('is-center'), 'Must define center row styling for active number')
  assert.ok(content.includes('is-near'), 'Must define near row styling')
  assert.ok(content.includes('is-far'), 'Must define far row styling')
  assert.ok(content.includes('touchstart') && content.includes('touchmove'), 'Must support real-device touch dragging')
  assert.ok(content.includes('--tw-center'), 'Tone must be driven by CSS variables (light/dark)')

  // 兼容封装仍保留旧 API，但内部一律走标准滚轮
  const legacy = fs.readFileSync(path.resolve(__dirname, '../src/components/ui/WheelTimePicker.vue'), 'utf-8')
  assert.ok(legacy.includes('TimeWheel'), 'Legacy WheelTimePicker must delegate to TimeWheel')
  assert.ok(legacy.includes('hour-mode="24"'), 'Legacy wrapper keeps 24-hour behaviour')
})

test('SettingsPrayer uses the shared light TimePickerSheet (no dark modal)', () => {
  const prayerPath = path.resolve(__dirname, '../src/components/apps/settings/SettingsPrayer.vue')
  const content = fs.readFileSync(prayerPath, 'utf-8')

  assert.ok(content.includes('TimePickerSheet'), 'SettingsPrayer must use the standard sheet')
  assert.ok(content.includes('handleTimePickerConfirm'), 'Must handle time picker confirm')
  assert.ok(!content.includes('TimePickerModal'), 'Dark legacy TimePickerModal must no longer be used here')
})

test('ClockApp and clockStore hide FloatingTabBar when editing alarm to prevent button obstruction', () => {
  setActivePinia(createPinia())
  const clock = useClockStore()

  assert.strictEqual(clock.isEditingAlarm, false, 'isEditingAlarm defaults to false')
  clock.setEditingAlarm(true)
  assert.strictEqual(clock.isEditingAlarm, true, 'isEditingAlarm switches to true when editing alarm')
  clock.setEditingAlarm(false)
  assert.strictEqual(clock.isEditingAlarm, false, 'isEditingAlarm resets to false on close')

  const clockAppPath = path.resolve(__dirname, '../src/components/apps/clock/ClockApp.vue')
  const appContent = fs.readFileSync(clockAppPath, 'utf-8')
  assert.ok(appContent.includes('!clock.isEditingAlarm'), 'ClockApp must hide FloatingTabBar when editing alarm')
})

