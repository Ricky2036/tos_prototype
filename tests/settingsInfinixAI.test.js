import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const AI_PATH = path.resolve('src/components/apps/settings/SettingsInfinixAI.vue')
const SETTINGS_APP_PATH = path.resolve('src/components/apps/settings/SettingsApp.vue')

test('SettingsInfinixAI.vue implements complete AI suite aligned with real phone', () => {
  assert.ok(fs.existsSync(AI_PATH), 'SettingsInfinixAI.vue should exist')
  const content = fs.readFileSync(AI_PATH, 'utf-8')

  // Top header & feature card
  assert.match(content, /Infinix AI/, 'Title should be Infinix AI')
  assert.match(content, /系统级 AI 功能一站式管理/, 'Feature description should match real device')
  assert.match(content, /data-nav-back/, 'Should have back button with data-nav-back')

  // Fola 三入口（命名以真机 Infinix X6878 为准：Fola语音 / Fola 之家 / Fola识屏）
  assert.match(content, /Fola语音/, 'Should contain Fola语音')
  assert.match(content, /AI智慧助手，一句话帮你搞定各种事/, 'Fola语音 description')
  assert.match(content, /Fola 之家/, 'Should contain Fola 之家')
  assert.match(content, /你的专属 AI 伙伴，时刻相伴/, 'Fola 之家 description')
  assert.match(content, /Fola识屏/, 'Should contain Fola识屏')
  assert.match(content, /一键识别屏幕，轻松提取文字内容/, 'Fola识屏 description')

  // 旧命名必须消失（真机上不存在 Folax 行名与 AI Buddy）
  assert.doesNotMatch(content, /Folax语音/, '不应残留 Folax语音')
  assert.doesNotMatch(content, /AI Buddy/, '不应残留 AI Buddy')

  // Smart Interactions
  assert.match(content, /智慧建议/, 'Should contain 智慧建议')
  assert.match(content, /提供一步直达的智慧建议服务/, '智慧建议 description')
  assert.match(content, /圈定即搜/, 'Should contain 圈定即搜')
  assert.match(content, /长按加画圈，迅速搜索内容/, '圈定即搜 description')

  // Communication & Voice Group
  assert.match(content, /AI通话助手/, 'Should contain AI通话助手')
  assert.match(content, /AI 字幕/, 'Should contain AI 字幕')
  assert.match(content, /录音摘要/, 'Should contain 录音摘要')
  assert.match(content, /AI 录音/, 'Should contain AI 录音')
  assert.match(content, /翻译助手/, 'Should contain 翻译助手')
  assert.match(content, /社交助手/, 'Should contain 社交助手')

  // Creation & Productivity Group
  assert.match(content, /AI写作助手/, 'Should contain AI写作助手')
  assert.match(content, /AI随心主题/, 'Should contain AI随心主题')
  assert.match(content, /智慧笔记/, 'Should contain 智慧笔记')
  assert.match(content, /文档助手/, 'Should contain 文档助手')

  // Security footer badge
  assert.match(content, /XGuard 隐私安全保护/, 'Should contain XGuard security badge')

  // 每一行都要能进三级页：不允许再是只弹 toast 的死入口
  assert.match(content, /openSubPage\(/, 'Rows should open third-level pages')
  assert.match(content, /AI_SUB_PAGES/, 'Should drive third-level pages from the shared config')
  assert.doesNotMatch(content, /showToast\('正在调起/, '不应保留旧的纯 toast 入口')
})

test('Infinix AI 卡片分组与真机一致（4 张卡）', () => {
  const content = fs.readFileSync(AI_PATH, 'utf-8')
  const cards = content.match(/<!-- =+ 卡片 \d: /g) || []
  assert.equal(cards.length, 4, `卡片数量应为 4，实际 ${cards.length}`)

  // 分组顺序：Fola 三入口 → 智慧建议/圈定即搜 → 通话字幕记录 → 创作办公
  const order = ['Fola语音', 'Fola 之家', 'Fola识屏', '智慧建议', '圈定即搜',
    'AI通话助手', 'AI 字幕', '录音摘要', 'AI 录音', '翻译助手', '社交助手',
    'AI写作助手', 'AI随心主题', '智慧笔记', '文档助手']
  let cursor = -1
  for (const label of order) {
    const at = content.indexOf(`title="${label}"`)
    assert.ok(at > cursor, `${label} 缺失或顺序错乱`)
    cursor = at
  }
})

test('SettingsApp.vue routes Infinix AI into dedicated page and search', () => {
  const content = fs.readFileSync(SETTINGS_APP_PATH, 'utf-8')

  // Component import & template tag
  assert.match(content, /import SettingsInfinixAI from '\.\/SettingsInfinixAI\.vue'/)
  assert.match(content, /<SettingsInfinixAI/)

  // Title in stack & back handling
  assert.match(content, /infinixAi: 'Infinix AI'/)
  assert.match(content, /aiRef\.value\?\.back/)

  // Card 4 click triggers push
  assert.match(content, /push\('infinixAi'\)/)

  // Search items
  assert.match(content, /title: 'Infinix AI'/)
  assert.match(content, /title: 'Fola语音'/)
  assert.match(content, /title: '圈定即搜'/)
})
