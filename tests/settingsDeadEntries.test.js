import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

/**
 * 「带箭头但点不动」是本项目反复出现的体验缺陷（行看起来可点、真机可进入）。
 * 基线：补齐 桌面角标样式 / 我的字体 / 振动模式 / 自定义铃声(×2) / 自定义应用刷新率 后剩 5 个，
 * 修一个减一，但**不许再增加**。
 */
const BASELINE = 5

const runAudit = () =>
  execFileSync(process.execPath, ['scripts/audit-settings-dead-entries.mjs'], {
    encoding: 'utf8',
    cwd: path.resolve('.')
  })

test('死入口审计：带箭头不可点的行不超过基线，且已修的不回退', () => {
  const out = runAudit()
  const m = out.match(/发现 (\d+) 个/)
  const count = m ? Number(m[1]) : 0
  assert.ok(
    count <= BASELINE,
    `带箭头但点不动的行增加到 ${count} 个（基线 ${BASELINE}），请补 @click 或子页：\n${out}`
  )
  assert.ok(!out.includes('桌面角标样式'), '「桌面角标样式」必须可点（已接入选择弹层）')
})

test('桌面角标样式用 SheetOptionPicker，选项集与 store 白名单同源', () => {
  const src = read('src/components/apps/settings/notifications/NotifHomeBadge.vue')
  assert.match(src, /import SheetOptionPicker/, '未使用统一选择弹层')
  assert.match(src, /BADGE_STYLES/, '选项应来自 store 的 BADGE_STYLES，避免两处漂移')
  assert.match(src, /@click="showStylePicker = true"/, '行必须可点')
  assert.match(src, /setBadgeStyle\(v\)/, '选择后要写回 store')
})

test('SheetOptionPicker 复用 SheetModal（动效与外层一致）', () => {
  const src = read('src/components/ui/SheetOptionPicker.vue')
  assert.match(src, /import SheetModal from '\.\/SheetModal\.vue'/, '应复用 SheetModal')
  assert.match(src, /<SheetModal :visible="visible"/, '按 visible 驱动')
  assert.match(src, /picker-radio\.checked/, '要有单选态样式')
})
