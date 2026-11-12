import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseChecks } from '../scripts/lib/parse-suite-checks.mjs'

/**
 * G7 口径测试：7 种真实收尾形态 + 反例
 * 数据来源：tests/e2e-summary-baseline.txt（2026-11-12 实测）
 */
const REAL = [
  ['[focus] 100 PASS / 0 FAIL', { pass: 100, fail: 0 }],
  ['[dnd] 56 PASS / 0 FAIL · 截图 /tmp/vwork/dnd', { pass: 56, fail: 0 }],
  ['[digital-health] 151 PASS / 0 FAIL', { pass: 151, fail: 0 }],
  ['[settings-group3] 176 PASS / 3 FAIL · 截图 /tmp/vwork/settings-group3', { pass: 176, fail: 3 }],
  ['走查 15 步 / 断言 131 条 / 通过 131 条 / 失败 0 条 / 控制台报错 0 条', { pass: 131, fail: 0 }],
  ['================ 走查 25 步 / 断言 230 条 / 通过 230 条 / 失败 0 条 / 控制台报错 0 条 ================', { pass: 230, fail: 0 }],
  ['===== 实体音量键验收: 26 PASS / 0 FAIL =====', { pass: 26, fail: 0 }],
  ['===== P2 验收: 39 PASS / 0 FAIL =====', { pass: 39, fail: 0 }],
  ['=== AI Mate 口袋打印机 e2e: 93/93 PASS ===', { pass: 93, fail: 0 }],
  ['=== AI Mate e2e（归档重放版）: 130/130 PASS ===', { pass: 130, fail: 0 }],
  ['PASS 8 / FAIL 0    判据：侧栏音量「背景彩度保留率」∈ [0.15, 0.9]', { pass: 8, fail: 0 }],
  ['[phone] 42 PASS / 0 FAIL', { pass: 42, fail: 0 }],
  ['[modes-and-routines] 26 PASS / 0 FAIL', { pass: 26, fail: 0 }],
]

test('14 种真实收尾形态全部可解析', () => {
  for (const [line, want] of REAL) {
    assert.deepEqual(parseChecks(line), want, `解析失败：${line}`)
  }
})

test('目标规范格式优先于宽松格式', () => {
  // 带 bracket 的应命中第一条规则，而不是被后面的宽松规则吃掉
  assert.deepEqual(parseChecks('[foo] 12 PASS / 3 FAIL'), { pass: 12, fail: 3 })
})

test('多行输出取最后一次匹配（汇总行通常在末尾）', () => {
  const out = [
    'PASS [x] step1',
    '[x] 3 PASS / 0 FAIL',
    'some trailing noise',
    '[x] 7 PASS / 1 FAIL',
  ].join('\n')
  assert.deepEqual(parseChecks(out), { pass: 7, fail: 1 })
})

test('解析不到返回 null —— 由调用方判红，绝不跳过', () => {
  assert.equal(parseChecks(''), null)
  assert.equal(parseChecks(null), null)
  assert.equal(parseChecks('全部用例 100% 通过！'), null)
  assert.equal(parseChecks('VERIFICATION FAILED: EPERM'), null)
})

test('失败数为 0 与 100% 通过不会被误判为通过计数', () => {
  // 只有中文百分号，没有可用计数
  assert.equal(parseChecks('全部用例 100% 通过！'), null)
})
