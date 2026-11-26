import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  CONVERSATIONS, ENTERPRISE_THREADS, MSG_TEXT, SETTINGS_GROUPS,
  THREADS, msgText
} from '../src/components/apps/messages/msgData.js'
import { useMessagesStore, defaultSettings } from '../src/stores/messagesStore.js'

const DIR = 'src/components/apps/messages'
const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
/** 结构类断言先剥注释，避免注释里写同值假绿 */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const fresh = () => { setActivePinia(createPinia()); return useMessagesStore() }
/** 全仓禁用动态求值（技能包审核红线之一） */
const NO_DYNAMIC_EVAL = (src) => !/\beval\s*\(|\bnew Function\s*\(/.test(src)

/* ==================== 数据自洽（真机逐字） ==================== */

test('会话列表顺序与真机一致：通知信息置顶，其后按时间倒序', () => {
  assert.equal(CONVERSATIONS.length, 8)
  assert.deepEqual(
    CONVERSATIONS.map(c => c.name),
    ['通知信息', '赖光政~借款人', '陈弘洋', '17896447783', '13076902075', 'Walter', '17386937368', '副卡']
  )
  assert.equal(CONVERSATIONS[0].kind, 'enterprise')
  assert.equal(CONVERSATIONS[0].unread, 99, '真机显示 99+，阈值 >=99')
  assert.equal(CONVERSATIONS[1].unread, 1)
})

test('每个普通会话都有消息，且不会出现空线程', () => {
  for (const c of CONVERSATIONS) {
    if (c.kind === 'enterprise') continue
    const list = THREADS[c.id]
    assert.ok(Array.isArray(list) && list.length > 0, `${c.name} 缺消息`)
    for (const m of list) {
      assert.ok(['me', 'them'].includes(m.from), `${c.name} 消息方向非法`)
      assert.ok(m.time && m.text, `${c.name} 消息缺时间或正文`)
    }
  }
})

test('摘要与搜索结果是真机原样，不做二次拼装', () => {
  const lai = CONVERSATIONS.find(c => c.id === 'laiguangzheng')
  assert.equal(lai.time, '11/13')
  assert.ok(lai.snippet.startsWith('你好，我是周老四的姐夫赖光政'))
  assert.ok(lai.snippet.endsWith('...'), '真机列表摘要在两行处截断并带省略号')
  const fuka = CONVERSATIONS.find(c => c.id === 'fuka')
  assert.equal(fuka.time, '3/17')
})

test('己方消息带"已发送"状态，对方消息没有', () => {
  const mine = THREADS.walter.filter(m => m.from === 'me')
  const theirs = THREADS.fuka.filter(m => m.from === 'them')
  assert.equal(mine.length, 2)
  for (const m of mine) assert.equal(m.status, 'sent')
  for (const m of theirs) assert.equal(m.status, undefined)
  assert.equal(mine[0].time, '2024/4/20 19:05', '跨年消息带年份')
  assert.equal(mine[1].time, '4/26 15:04', '当年消息不带年份')
})

test('通知信息 9 条，认证号带 verified 标记', () => {
  assert.equal(ENTERPRISE_THREADS.length, 9)
  const ids = ENTERPRISE_THREADS.map(t => t.number)
  assert.equal(ids[0], '10690955998')
  assert.equal(ids[3], '10000')
  const abchina = ENTERPRISE_THREADS[0]
  assert.equal(abchina.verified, true)
  assert.equal(abchina.unread, 2)
  assert.equal(abchina.messages.length, 4)
  // 链接片段必须真的出现在正文里，否则高亮会渲染不出来
  for (const m of abchina.messages) {
    for (const link of m.links || []) assert.ok(m.text.includes(link), `链接 ${link} 不在正文中`)
  }
})

test('设置页分组与真机一致，开关默认值逐条对得上', () => {
  assert.deepEqual(SETTINGS_GROUPS.map(g => g.title), ['XMessage', '安全', '其他', '', ''])
  const flat = SETTINGS_GROUPS.flatMap(g => g.rows)
  assert.deepEqual(flat.map(r => r.id), [
    'xmessageService', 'smsWhenFail',
    'urlCheck', 'dbUpdate',
    'autoMms', 'sendTone', 'bigText', 'foldNotif', 'deliveryReport',
    'cloudSync', 'smartDb', 'moreSettings', 'about'
  ])
  const d = defaultSettings()
  assert.equal(d.smsWhenFail, false)
  assert.equal(d.urlCheck, true)
  assert.equal(d.autoMms, true)
  assert.equal(d.sendTone, false)
  assert.equal(d.bigText, true)
  assert.equal(d.foldNotif, true)
  assert.equal(d.deliveryReport, false)
  assert.equal(d.xmessageOn, true)
  assert.equal(d.dbUpdatePref, 'wlan')
})

/* ==================== 词条 ==================== */

test('中英文词条键集合一致，且插值占位可替换', () => {
  const zh = Object.keys(MSG_TEXT.zh).sort()
  const en = Object.keys(MSG_TEXT.en).sort()
  assert.deepEqual(en, zh, '英文缺项会导致切语言后回落中文')
  assert.equal(msgText('zh')('selected', { n: 3 }), '已选择 3 项')
  assert.equal(msgText('en')('selected', { n: 3 }), '3 selected')
  assert.equal(msgText('bn')('appTitle'), '短信', '未支持语言回落中文')
})

/* ==================== store 行为 ==================== */

test('打开会话清未读；未读总数随之下降', () => {
  const s = fresh()
  const before = s.totalUnread
  assert.ok(before > 0)
  s.openConversation('laiguangzheng')
  assert.equal(s.byId('laiguangzheng').unread, 0)
  assert.equal(s.totalUnread, before - 1)
})

test('发送消息追加到线程尾部，空内容被拒绝', () => {
  const s = fresh()
  const before = s.messagesOf('walter').length
  assert.equal(s.sendMessage('walter', '   ', '今天 10:00'), false)
  assert.equal(s.sendMessage('walter', '收到', '今天 10:00'), true)
  const list = s.messagesOf('walter')
  assert.equal(list.length, before + 1)
  assert.equal(list[list.length - 1].text, '收到')
  assert.equal(list[list.length - 1].from, 'me')
})

test('删除会话后从列表消失，但原始数据不被改写', () => {
  const s = fresh()
  s.deleteConversations(['fuka'])
  assert.equal(s.byId('fuka'), null)
  assert.equal(s.list.length, CONVERSATIONS.length - 1)
  assert.ok(CONVERSATIONS.some(c => c.id === 'fuka'), '源数据必须保持不可变')
})

test('置顶排到最前，再点取消', () => {
  const s = fresh()
  const last = s.list[s.list.length - 1].id
  s.togglePin(last)
  assert.equal(s.list[0].id, last)
  assert.equal(s.list[0].pinned, true)
  s.togglePin(last)
  assert.equal(s.isPinned(last), false)
})

test('清除未读把普通会话与通知信息一起归零', () => {
  const s = fresh()
  s.clearAllUnread()
  assert.equal(s.totalUnread, 0)
  for (const c of s.list) assert.equal(c.unread, 0)
})

test('打开通知信息里的某条会清掉它的未读', () => {
  const s = fresh()
  s.openEnterprise('e-abchina')
  assert.equal(s.enterpriseById('e-abchina').unread, 0)
})

test('设置项写入即时生效并可被 resetAll 复位', () => {
  const s = fresh()
  s.setSetting('smsWhenFail', true)
  assert.equal(s.settings.smsWhenFail, true)
  s.setSetting('dbUpdatePref', 'off')
  assert.equal(s.settings.dbUpdatePref, 'off')
  s.resetAll()
  assert.equal(s.settings.smsWhenFail, false)
  assert.equal(s.settings.dbUpdatePref, 'wlan')
  assert.equal(s.list.length, CONVERSATIONS.length)
})

test('草稿按会话隔离保存', () => {
  const s = fresh()
  s.setDraft('walter', '半句')
  assert.equal(s.draftOf('walter'), '半句')
  assert.equal(s.draftOf('fuka'), '')
})

/* ==================== 源码契约（几何 / 颜色 / 结构） ==================== */

test('列表页的关键几何常量与真机一致（物理 ÷ 3.3556）', () => {
  const src = strip(read(`${DIR}/ConversationListView.vue`))
  assert.match(src, /174px/, '头部内容高 174（不含状态栏）')
  assert.match(src, /206\.2px|174px/, '头部折叠高度基准')
  assert.match(src, /min-height: 65\.9px/, '单行摘要行高 65.9')
  assert.match(src, /width: 40px|:size="40"|size = 40/, '头像 40')
  assert.match(src, /font-size: 20px/, '会话名 20px')
  assert.match(src, /left: 22px/, '列表左内边距 22')
  assert.match(src, /right: 16px/, '胶囊距右 16')
  assert.match(src, /width: 100px/, '搜索/更多胶囊宽 100')
  assert.match(src, /width: 60px/, 'FAB 60')
})

test('对话页气泡配色与输入栏尺寸照真机标定', () => {
  const src = strip(read(`${DIR}/ConversationView.vue`))
  assert.match(src, /#d9e0f1/i, '己方气泡 #D9E0F1')
  assert.match(src, /#e7e8e9/i, '对方气泡 #E7E8E9')
  assert.match(src, /#3375f6/i, '品牌蓝 #3375F6')
  assert.match(src, /max-width: 290px/, '气泡最大宽 290')
  assert.match(src, /padding: 10px 12px/, '气泡内边距 10 / 12')
  assert.match(src, /height: 69\.4px/, '输入栏高 69.4')
  assert.match(src, /159/, '字数上限 159')
})

test('开关几何 43.5 × 24.1 与真机实测一致', () => {
  const src = strip(read(`${DIR}/components/MsgSwitch.vue`))
  assert.match(src, /width: 43\.5px/)
  assert.match(src, /height: 24\.1px/)
})

test('外壳用页面栈 + 全局返回注册，且无动态求值', () => {
  const src = strip(read(`${DIR}/MessagesApp.vue`))
  assert.match(src, /useBackHandler/)
  assert.match(src, /stack\.value\.push/)
  assert.ok(NO_DYNAMIC_EVAL(src))
  for (const f of ['ConversationListView.vue', 'ConversationView.vue', 'SearchView.vue', 'ComposeView.vue', 'ContactPickerView.vue', 'SettingsView.vue']) {
    assert.ok(NO_DYNAMIC_EVAL(strip(read(`${DIR}/${f}`))), `${f} 含动态求值`)
  }
})

test('存储键与设置页文案：真机逐字，不改写成更"顺"的说法', () => {
  const store = strip(read('src/stores/messagesStore.js'))
  assert.match(store, /tos\.messages\.v1/)
  const data = strip(read(`${DIR}/msgData.js`))
  for (const copy of [
    '发送失败时转为短信发送', '核验短信内的 URL 链接，提醒诈骗风险。查阅',
    '自动更新 URL 数据库。', '双指扩展放大信息内容文字。',
    '开启后将通知类消息折叠为一个会话条目。', '显示消息送达状态。',
    '完善信息内容的识别，提供更精准的服务。', '号码验证成功后，XMessage联系人之间支持使用WLAN或移动网络，免费收发消息。'
  ]) {
    assert.ok(data.includes(copy), `缺文案：${copy}`)
  }
})

test('e2e 套件已在 run-e2e 登记（--changed 才挑得到）', () => {
  const runner = read('scripts/run-e2e.mjs')
  assert.match(runner, /id: 'messages'/)
  assert.match(runner, /verify-messages-flow\.mjs/)
  assert.ok(fs.existsSync(path.resolve('scripts/verify-messages-flow.mjs')))
})
