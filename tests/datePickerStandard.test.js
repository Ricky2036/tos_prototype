import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  parseDateValue,
  formatDateLabel,
  getDaysInMonth,
  getWeekDay,
  toDateString,
  toChineseDateString,
  pad2
} from '../src/utils/datePicker.js'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

const SHEET = 'src/components/ui/DatePickerSheet.vue'
const WHEEL = 'src/components/ui/DateWheel.vue'

/* ==================== 纯函数层 ==================== */
test('日期解析与真机显示格式', () => {
  assert.deepEqual(parseDateValue('2026-11-14'), { year: 2026, month: 11, day: 14 })
  assert.deepEqual(parseDateValue('2026年11月14日'), { year: 2026, month: 11, day: 14 })
  assert.deepEqual(parseDateValue('2024年2月29日'), { year: 2024, month: 2, day: 29 })
  assert.deepEqual(parseDateValue('非法日期'), { year: 2026, month: 11, day: 14 })

  assert.equal(getDaysInMonth(2024, 2), 29, '闰年2月有29天')
  assert.equal(getDaysInMonth(2026, 2), 28, '平年2月有28天')
  assert.equal(getDaysInMonth(2026, 11), 30, '11月有30天')
  assert.equal(getDaysInMonth(2026, 12), 31, '12月有31天')

  assert.equal(getWeekDay(2026, 11, 14), '周六')
  assert.equal(formatDateLabel(2026, 11, 14), '2026年11月14日周六')
  assert.equal(toDateString(2026, 11, 14), '2026-11-14')
  assert.equal(toChineseDateString(2026, 11, 14), '2026年11月14日')
  assert.equal(pad2(5), '05')
})

/* ==================== 标准控件契约 ==================== */
test('DatePickerSheet：浅色、复用 SheetModal + DateWheel、标题/当前值/取消/确定', () => {
  const src = strip(read(SHEET))
  assert.match(src, /import SheetModal from '\.\/SheetModal\.vue'/)
  assert.match(src, /import DateWheel from '\.\/DateWheel\.vue'/)
  assert.match(src, /formatDateLabel/)
  assert.match(src, /data-dps-title/)
  assert.match(src, /data-dps-current/)
  assert.match(src, /data-dps-cancel/)
  assert.match(src, /data-dps-confirm/)
  assert.match(src, /tone="light"/, '弹层固定浅色')
  assert.match(src, /emit\('confirm', draft\.value\)/)
  assert.match(src, /emit\('update:modelValue', draft\.value\)/)

  assert.doesNotMatch(src, /#1c1c1e|#ff9f0a/i)
  assert.match(src, /\.dps-confirm \{ background: #2F6BF6/, '确定按钮用真机蓝')
})

test('DateWheel：三列滚轮（年/月/日）、灰度字号分层、触摸与阻尼弹簧惯性', () => {
  const src = strip(read(WHEEL))
  assert.match(src, /data-date-wheel/)
  assert.match(src, /\['year', 'month', 'day'\]/)
  assert.match(src, /ROW_H = 35/, '真机量测：行距 35 CSS px')
  assert.match(src, /font-size: 23px/, '真机量测：选中字号 23 CSS px')
  assert.match(src, /SLOTS = \[-3, -2, -1, 0, 1, 2, 3\]/)
  assert.match(src, /translate3d[\s\S]*scale/)
  assert.match(src, /colorAt\(d\)/)
  assert.match(src, /PALETTES/)
  assert.match(src, /SPRING_K[\s\S]*DAMP[\s\S]*LOOK_AHEAD_MS/)
  assert.match(src, /requestAnimationFrame\(tick\)/)
  assert.match(src, /pointerdown[\s\S]*pointermove[\s\S]*pointerup/)
  assert.match(src, /onGlobalPointerUp/)
  assert.match(src, /getDaysInMonth/)
})
