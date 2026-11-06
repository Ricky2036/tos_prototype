import test from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import { useInfinixAiSettingsStore } from '../src/stores/infinixAiSettingsStore.js'
import { AI_SUB_PAGES } from '../src/components/apps/settings/infinixai/pages.js'

const store = () => {
  setActivePinia(createPinia())
  return useInfinixAiSettingsStore()
}

/* ============ 开关状态：默认值必须对齐真机 XOS 17 ============ */
test('Infinix AI 开关默认态对齐真机', () => {
  const s = store()
  assert.equal(s.folaxGestureWake, true)
  assert.equal(s.folaxNavBarWake, true)
  assert.equal(s.folaxRealtimeTranscribe, true)
  assert.equal(s.folaxNotifPush, true)
  assert.equal(s.folaxPersonalizedRec, true)
  assert.equal(s.folaxVoiceCmdCheck, true)
  assert.equal(s.folaScreenGesture, true)
  assert.equal(s.folaScreenSuggest, true)
  assert.equal(s.aiRecordAutoRecommend, true)
  assert.equal(s.aiRecordAutoRecord, false)
  assert.equal(s.translateSmart, false)
  assert.equal(s.translateConsentAccepted, false)
})

test('setSwitch 写入后 getSwitch 能读回，且拒绝未知键', () => {
  const s = store()
  assert.equal(s.setSwitch('folaxGestureWake', false), true)
  assert.equal(s.getSwitch('folaxGestureWake'), false)

  assert.equal(s.setSwitch('aiRecordAutoRecord', true), true)
  assert.equal(s.getSwitch('aiRecordAutoRecord'), true)

  assert.equal(s.setSwitch('notARealKey', true), false)
  assert.equal(s.getSwitch('notARealKey'), false)
})

test('同意翻译隐私协议后状态置真', () => {
  const s = store()
  assert.equal(s.translateConsentAccepted, false)
  s.acceptTranslateConsent()
  assert.equal(s.translateConsentAccepted, true)
})

/* ============ 三级页配置：结构 + 真机文案 ============ */
test('三级配置覆盖真机全部 14 个设置型入口', () => {
  const keys = Object.keys(AI_SUB_PAGES)
  assert.equal(keys.length, 14)
  for (const k of [
    'folaxVoice', 'folaScreen', 'smartSuggestion', 'circleSearch', 'aiCall', 'aiSubtitle',
    'recordSummary', 'aiRecord', 'translate', 'social', 'aiWriting', 'aiTheme',
    'smartNote', 'docAssistant'
  ]) {
    assert.ok(keys.includes(k), `缺少 ${k}`)
  }
  // Fola 之家 是真机上的独立应用界面，不在设置子页范围内
  assert.ok(!keys.includes('folaHome'))
})

test('每个三级页都有标题，且页面标题与真机一致', () => {
  const expected = {
    folaxVoice: 'Folax 语音',
    folaScreen: 'Fola 识屏',
    smartSuggestion: '智慧建议',
    circleSearch: '圈定即搜',
    aiCall: 'AI 通话助手',
    aiSubtitle: 'AI 字幕',
    recordSummary: '录音摘要',
    aiRecord: 'AI 录',
    translate: '翻译助手',
    social: '社交助手',
    aiWriting: 'AI写作助手',
    aiTheme: 'AI随心主题',
    smartNote: '智慧笔记',
    docAssistant: '文档助手'
  }
  for (const [k, title] of Object.entries(expected)) {
    assert.equal(AI_SUB_PAGES[k].title, title, `${k} 标题不符`)
  }
})

test('Folax 语音：3 张卡片 11 行，文案逐条对齐真机', () => {
  const page = AI_SUB_PAGES.folaxVoice
  assert.equal(page.cards.length, 3)
  const rows = page.cards.flatMap(c => c.rows)
  assert.equal(rows.length, 11)

  assert.deepEqual(
    rows.map(r => r.title),
    [
      '默认语音助手', '电源键唤醒', '手势唤醒', '导航条唤醒', 'One-Tap Button 唤醒', '语音唤醒',
      '语音实时转写', '默认音乐播放器',
      '通知推送', '个性化推荐', '语音指令校验'
    ]
  )

  // 真机上开关共 6 个：卡1（手势/导航条）2 个 · 卡2（实时转写）1 个 · 卡3（推送/推荐/校验）3 个
  assert.equal(rows[0].value, 'Folax')
  assert.equal(rows[4].value, '已关闭')
  assert.equal(rows.filter(r => r.toggle).length, 6)
  assert.deepEqual(
    rows.filter(r => r.toggle).map(r => r.title),
    ['手势唤醒', '导航条唤醒', '语音实时转写', '通知推送', '个性化推荐', '语音指令校验']
  )
})

test('Fola 识屏：支持的应用显示已开启/未开启计数', () => {
  const rows = AI_SUB_PAGES.folaScreen.cards.flatMap(c => c.rows)
  const support = rows.find(r => r.title === '支持的应用')
  assert.ok(support, '缺少「支持的应用」')
  assert.equal(support.subtitle, '44 个已开启，75 个未开启')
  assert.equal(support.toggle, undefined)
})

test('AI 录：第一张卡的「自动推荐」是红色开关，第二张卡是「自动录音」', () => {
  const [card1, card2] = AI_SUB_PAGES.aiRecord.cards
  assert.equal(card1.rows[0].title, '自动推荐')
  assert.equal(card1.rows[0].toggle, 'aiRecordAutoRecommend')
  assert.equal(card1.rows[0].toggleColor, 'red')
  assert.equal(card2.rows[0].title, '自动录音')
  assert.equal(card2.rows[0].toggle, 'aiRecordAutoRecord')
})

test('配置里的 toggle 键都真实存在于 store（防止配置与 store 漂移）', () => {
  const s = store()
  const toggles = new Set()
  for (const page of Object.values(AI_SUB_PAGES)) {
    for (const card of page.cards || []) {
      for (const row of card.rows) {
        if (row.toggle) toggles.add(row.toggle)
      }
    }
  }
  assert.ok(toggles.size >= 9, `toggle 数量偏少：${toggles.size}`)
  for (const key of toggles) {
    // 未知键 setSwitch 返回 false；这里要求全部为真键
    assert.equal(s.setSwitch(key, true), true, `${key} 不是 store 里的开关`)
  }
})

test('说明型页面没有卡片、有段落；带头图的页面必须给出分页点数与说明', () => {
  // 纯说明页（无卡片无开关）
  for (const k of ['circleSearch', 'aiWriting', 'aiTheme', 'docAssistant']) {
    const page = AI_SUB_PAGES[k]
    assert.ok((page.cards || []).length === 0, `${k} 不应有卡片`)
    assert.ok((page.notes || []).length > 0, `${k} 应有说明段落`)
  }
  // 带分页点的头图区
  for (const k of ['folaxVoice', 'folaScreen', 'smartSuggestion', 'aiCall', 'aiSubtitle', 'aiRecord', 'translate', 'social', 'smartNote']) {
    const hero = AI_SUB_PAGES[k].hero
    assert.ok(hero, `${k} 缺少 hero`)
    assert.ok(hero.dots >= 2, `${k} 分页点数量异常`)
  }
  // 底部「去体验」只出现在体验型页面
  for (const k of ['aiSubtitle', 'recordSummary', 'aiTheme', 'smartNote', 'docAssistant']) {
    assert.equal(AI_SUB_PAGES[k].cta, '去体验', `${k} 应有「去体验」`)
  }
})
