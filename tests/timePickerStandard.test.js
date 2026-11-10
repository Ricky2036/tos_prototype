import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  parseTimeValue, formatTimeLabel, to12Hour, to24Hour,
  toTimeString, step12Hour, pad2
} from '../src/utils/timePicker.js'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

const SHEET = 'src/components/ui/TimePickerSheet.vue'
const WHEEL = 'src/components/ui/TimeWheel.vue'

/* ==================== 纯函数层 ==================== */
test('时间解析与真机显示格式', () => {
  assert.deepEqual(parseTimeValue('22:00'), { hour24: 22, minute: 0 })
  assert.deepEqual(parseTimeValue('07:30'), { hour24: 7, minute: 30 })
  assert.deepEqual(parseTimeValue('乱写'), { hour24: 7, minute: 0 })
  assert.equal(formatTimeLabel('22:00'), '10:00 下午')
  assert.equal(formatTimeLabel('07:00'), '7:00 上午')
  assert.equal(formatTimeLabel('00:05'), '12:05 上午')
  assert.equal(formatTimeLabel('12:00'), '12:00 下午')
  assert.equal(toTimeString(22, 0), '22:00')
  assert.equal(pad2(7), '07')
})

test('12/24 小时互转与 12 小时制循环步进（不跨越上午下午）', () => {
  assert.deepEqual(to12Hour(22), { hour12: 10, period: '下午' })
  assert.deepEqual(to12Hour(0), { hour12: 12, period: '上午' })
  assert.deepEqual(to12Hour(12), { hour12: 12, period: '下午' })
  assert.equal(to24Hour(10, '下午'), 22)
  assert.equal(to24Hour(12, '上午'), 0)
  assert.equal(to24Hour(12, '下午'), 12)
  assert.equal(step12Hour(12, 1), 1)
  assert.equal(step12Hour(1, -1), 12)
  assert.equal(step12Hour(10, 5), 3)
})

/* ==================== 标准控件契约 ==================== */
test('TimePickerSheet：浅色、复用 SheetModal + TimeWheel、标题/当前值/取消/确定', () => {
  const src = strip(read(SHEET))
  assert.match(src, /import SheetModal from '\.\/SheetModal\.vue'/)
  assert.match(src, /import TimeWheel from '\.\/TimeWheel\.vue'/)
  assert.match(src, /formatTimeLabel\(draft\.value\)/)
  assert.match(src, /data-tps-title/)
  assert.match(src, /data-tps-current/)
  assert.match(src, /data-tps-cancel/)
  assert.match(src, /data-tps-confirm/)
  assert.match(src, /tone="light"/, '弹层固定浅色')
  assert.match(src, /emit\('confirm', draft\.value\)/, 'confirm 回传 24 小时制字符串')
  assert.match(src, /emit\('update:modelValue', draft\.value\)/)

  // 🔴 旧 TimePickerModal 是 #1c1c1e 深色 + #ff9f0a 橙色按钮，标准件不许残留
  assert.doesNotMatch(src, /#1c1c1e|#ff9f0a/i)
  assert.match(src, /\.tps-confirm \{ background: #2F6BF6/, '确定按钮用真机蓝')
})

test('TimeWheel：三列滚轮、灰度字号分层、触摸与鼠标滚轮、light/dark + 12/24 小时', () => {
  const src = strip(read(WHEEL))
  assert.match(src, /data-time-wheel/)
  assert.match(src, /\['hour', 'minute', 'period'\]/)
  assert.match(src, /hourMode/)
  assert.match(src, /tone/)
  assert.match(src, /ROW_H = 35/, '真机量测：行距 35 CSS px')
  assert.match(src, /font-size: 23px/, '真机量测：选中字号 23 CSS px')
  assert.match(src, /SLOTS = \[-3, -2, -1, 0, 1, 2, 3\]/, '连续滚动需多渲染一层槽位')
  assert.match(src, /translate3d[\s\S]*scale/, '数字跟手位移 + 连续缩放')
  assert.match(src, /colorAt\(d\)/, '灰度按距离连续插值，不能靠 class 跳变')
  assert.match(src, /PALETTES/, 'light/dark 调色板')
  assert.match(src, /SPRING_K[\s\S]*DAMP[\s\S]*LOOK_AHEAD_MS/, '速度前瞻 + 阻尼弹簧惯性')
  assert.match(src, /requestAnimationFrame\(tick\)/, '动画必须由 rAF 驱动')
  assert.match(src, /pointerdown[\s\S]*pointermove[\s\S]*pointerup/, 'Pointer Events 覆盖鼠标与真机触摸')
  assert.doesNotMatch(src, /aria-label="小时加一"/, '真机是滚轮，不是上下步进按钮')
  assert.doesNotMatch(src, /height: 46px/, '旧行高 46px 会让整卡偏高')
})

test('三处调用方统一到标准控件，旧深色实现已退场', () => {
  const dnd = strip(read('src/components/apps/settings/SettingsDND.vue'))
  const prayer = strip(read('src/components/apps/settings/SettingsPrayer.vue'))
  const alarm = strip(read('src/components/apps/clock/subpages/AlarmEditModal.vue'))

  assert.match(dnd, /TimePickerSheet/)
  assert.match(dnd, /parseTimeValue\(value\)/, '勿扰从标准字符串解析小时/分钟')
  assert.doesNotMatch(dnd, /DndTimeSheet/)

  assert.match(prayer, /TimePickerSheet/)
  assert.match(prayer, /:visible="showTimePicker"/)
  assert.doesNotMatch(prayer, /TimePickerModal/, '礼拜模式不再用深色旧控件')

  assert.match(alarm, /TimeWheel/)
  assert.match(alarm, /hour-mode="24"/)
  assert.match(alarm, /tone="dark"/, '时钟闹钟编辑仍保持深色 inline 形态')

  assert.equal(fs.existsSync(path.resolve('src/components/apps/settings/dnd/DndTimeSheet.vue')), false,
    '上轮的步进弹层应已移除')
})

test('旧 TimePickerModal / WheelTimePicker 只作为浅色兼容封装，不再自带深色样式', () => {
  const modal = strip(read('src/components/ui/TimePickerModal.vue'))
  const wheel = strip(read('src/components/ui/WheelTimePicker.vue'))
  assert.match(modal, /TimePickerSheet/)
  assert.doesNotMatch(modal, /#1c1c1e|#ff9f0a/i)
  assert.match(wheel, /TimeWheel/)
  assert.match(wheel, /hour-mode="24"/)
})

test('守卫有牙齿：删掉 TimeWheel 的触摸处理 / 换回深色必须报红', () => {
  const src = strip(read(WHEEL))
  assert.match(src, /pointermove/)
  assert.doesNotMatch(src.replace(/pointermove/g, 'noopEvent'), /pointermove/)
  assert.match(src, /ROW_H = 35/)
  const sheet = strip(read(SHEET))
  assert.doesNotMatch(sheet, /#1c1c1e/i)
  assert.match(sheet.replace('#FFFFFF', '#1c1c1e'), /#1c1c1e/i)
})
