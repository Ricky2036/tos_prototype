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
    CONVERSATIONS.map(c => c.id),
    ['notice', 'conv-su', 'conv-chen', 'n13700003456', 'n13600004567', 'conv-zhou', 'n13300006789', 'conv-sub']
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
  const lai = CONVERSATIONS.find(c => c.id === 'conv-su')
  assert.equal(lai.time, '11/13')
  assert.ok(lai.snippet.startsWith('合同附件我已经发到邮箱了'))
  assert.ok(lai.snippet.endsWith('...'), '列表摘要在两行处截断并带省略号')
  const fuka = CONVERSATIONS.find(c => c.id === 'conv-sub')
  assert.equal(fuka.time, '3/17')
})

test('己方消息带"已发送"状态，对方消息没有', () => {
  const mine = THREADS['conv-zhou'].filter(m => m.from === 'me')
  const theirs = THREADS['conv-sub'].filter(m => m.from === 'them')
  assert.equal(mine.length, 2)
  for (const m of mine) assert.equal(m.status, 'sent')
  for (const m of theirs) assert.equal(m.status, undefined)
  assert.equal(mine[0].time, '2024/4/20 19:05', '跨年消息带年份')
  assert.equal(mine[1].time, '4/26 15:04', '当年消息不带年份')
})

test('通知信息 9 条，认证号带 verified 标记', () => {
  assert.equal(ENTERPRISE_THREADS.length, 9)
  const ids = ENTERPRISE_THREADS.map(t => t.number)
  assert.equal(ids[0], '10690000001')
  assert.equal(ids[3], '10690000004')
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

test('演示数据全部虚构：不含真实机构、人名、域名与真实号段', () => {
  const raw = read(`${DIR}/msgData.js`)
  const banned = [
    '中国农业银行', '招商银行', '中信银行', '中国电信', '抖音', '淘宝', '谷歌',
    'OPPO', '小天才', 'Gboard', 'zxcard', 'cmbt', 'abchina', '丰顺', '陈敬展',
    '赖光政', '陈弘洋', '陈静丽', '周老四', 'Walter', '阿里巴巴', '钉钉', '窗帘'
  ]
  for (const w of banned) assert.ok(!raw.includes(w), `演示数据里出现了真实信息：${w}`)
  // 手机号必须落在编造号段（1xx 0000 xxxx）
  const phones = raw.match(/1[3-9]\d{9}/g) || []
  assert.ok(phones.length >= 8, `手机号数量异常：${phones.length}`)
  for (const ph of phones) assert.match(ph, /^1\d{2}0000\d{4}$/, `号码 ${ph} 不在编造号段`)
  // 正文里的域名只允许 example.com 占位
  const domains = (raw.match(/[a-z0-9-]+\.(com|cn|net)(\/[^\s'")]*)?/gi) || [])
    .filter(d => !d.startsWith('example.com'))
  assert.deepEqual(domains, [], `正文里仍有真实域名：${domains.join(',')}`)
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
  s.openConversation('conv-su')
  assert.equal(s.byId('conv-su').unread, 0)
  assert.equal(s.totalUnread, before - 1)
})

test('发送消息追加到线程尾部，空内容被拒绝', () => {
  const s = fresh()
  const before = s.messagesOf('conv-zhou').length
  assert.equal(s.sendMessage('conv-zhou', '   ', '今天 10:00'), false)
  assert.equal(s.sendMessage('conv-zhou', '收到', '今天 10:00'), true)
  const list = s.messagesOf('conv-zhou')
  assert.equal(list.length, before + 1)
  assert.equal(list[list.length - 1].text, '收到')
  assert.equal(list[list.length - 1].from, 'me')
})

test('删除会话后从列表消失，但原始数据不被改写', () => {
  const s = fresh()
  s.deleteConversations(['conv-sub'])
  assert.equal(s.byId('conv-sub'), null)
  assert.equal(s.list.length, CONVERSATIONS.length - 1)
  assert.ok(CONVERSATIONS.some(c => c.id === 'conv-sub'), '源数据必须保持不可变')
})

test('置顶排在通知信息下方（通知信息永远占第一行），再点取消', () => {
  const s = fresh()
  const last = s.list[s.list.length - 1].id
  s.togglePin(last)
  assert.equal(s.list[0].id, 'notice', '通知信息不被置顶项挤下去')
  assert.equal(s.list[1].id, last)
  assert.equal(s.list[1].pinned, true)
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
  s.openEnterprise('e-1')
  assert.equal(s.enterpriseById('e-1').unread, 0)
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
  s.setDraft('conv-zhou', '半句')
  assert.equal(s.draftOf('conv-zhou'), '半句')
  assert.equal(s.draftOf('conv-sub'), '')
})

/* ==================== 源码契约（几何 / 颜色 / 结构） ==================== */

test('列表页的关键几何常量与真机一致（物理 ÷ 3.3556）', () => {
  const src = strip(read(`${DIR}/ConversationListView.vue`))
  assert.match(src, /<LargeTitleHeader/, '大标题走通用件')
  assert.match(src, /margin: 4px 22px 10px/, '云卡在列表流里（随滚动）')
  assert.match(src, /min-height: 62px/, '单行摘要行高 62（名 17px 后收紧，真机 65.9 是按 20px 名算的）')
  assert.match(src, /width: 40px|:size="40"|size = 40/, '头像 40')
  assert.match(src, /font-size: 17px/, '会话名 17px（与设置列表同级）')
  assert.match(src, /8.5px 21\.5px 8\.5px 22px/, '行内边距：左 22 / 右 21.5 / 上 8.5')
  assert.match(src, /right: 16px/, '胶囊距右 16')
  assert.match(src, /width: 100px/, '搜索/更多胶囊宽 100')
  assert.match(src, /width: 60px/, 'FAB 60')
})

test('列表页接入通用大标题件，不再自绘折叠量', () => {
  const src = strip(read(`${DIR}/ConversationListView.vue`))
  assert.match(src, /useLargeTitle\(\)/, '必须用通用件的折叠契约')
  assert.match(src, /const \{ progress: titleProgress, onScroll: onTitleScroll \} = useLargeTitle\(\)/, '必须解构出 ref')
  assert.match(src, /<LargeTitleHeader/, '必须用通用件渲染大标题')
  assert.ok(!/headHeight|collapse\.value/.test(src), '不许再自算折叠高度')
  // 真机分割线：从头像右侧 76 到内容右缘 336、1px #EAEBEC（比背景只深 6）
  // 分割线画成行背景的 1px 渐变（独立 1px 元素会落在半像素上，被抗锯齿切成两段）
  assert.match(src, /background-image: linear-gradient/, '分割线用背景渐变')
  assert.match(src, /#e6e7e8/i, '分割线颜色（真机取样偏深一档，抗锯齿后视觉一致）')
  assert.match(src, /#f0f1f2 76px/, '线从 76 起')
  assert.match(src, /336px/, '线到 336 止')
  assert.match(src, /visibility: hidden/, '未滑开时操作层不可见，避免露底成粉线')
  assert.match(src, /F5A623/, '置顶黄色图钉')
})

test('通知信息列表与首页同一套行结构（分割线 / 行高 / 字号）', () => {
  const ent = strip(read(`${DIR}/EnterpriseListView.vue`))
  assert.match(ent, /background-image: linear-gradient/, '通知信息也要同款分割线')
  assert.match(ent, /#e6e7e8/i, '颜色同首页')
  assert.match(ent, /#f0f1f2 76px/)
  assert.match(ent, /336px/)
  assert.match(ent, /min-height: 62px/, '行高同首页')
  assert.match(ent, /font-size: 17px/, '标题字号同首页')
  assert.match(ent, /gap: 5px/, '名称与时间间距同首页')
})

test('对话页气泡配色与输入栏尺寸照真机标定', () => {
  const src = strip(read(`${DIR}/ConversationView.vue`))
  assert.match(src, /#d9e0f1/i, '己方气泡 #D9E0F1')
  assert.match(src, /#e7e8e9/i, '对方气泡 #E7E8E9')
  assert.match(src, /#3375f6/i, '品牌蓝 #3375F6')
  assert.match(src, /max-width: 290px/, '气泡最大宽 290')
  assert.match(src, /border-radius: 16px/, '气泡圆角 16')
  assert.match(src, /padding: 10px 12px/, '气泡内边距 10 / 12')
  assert.match(src, /height: 69\.4px/, '输入栏高 69.4')
  assert.match(src, /159/, '字数上限 159')
})

test('删除图标全仓同源 ui/TrashIcon，且必须带桶内两条竖线', () => {
  const icon = strip(read('src/components/ui/TrashIcon.vue'))
  assert.ok(icon.includes('M3 6h18'), '缺桶盖横线')
  assert.ok(icon.includes('M19 6v14c0 1-1 2-2 2H7'), '缺桶身')
  assert.equal((icon.match(/<line/g) || []).length, 2, '桶内必须有两条竖线（历史残次品就少这两条）')

  // system 层（通知中心 / 锁屏 / 灵动岛 / 最近任务）已全部复用 TrashIcon，
  // 源码里不应再有内联的那份 path
  for (const f of [
    'src/components/system/NotificationCenter.vue',
    'src/components/system/LockScreen.vue',
    'src/components/system/DynamicIsland.vue',
    'src/components/system/AppSwitcher.vue'
  ]) {
    const src = strip(read(f))
    assert.ok(src.includes('<TrashIcon'), `${f} 应复用 TrashIcon`)
    assert.ok(!src.includes('M3 6h18M19 6v14'), `${f} 仍有内联垃圾桶`)
  }

  const list = strip(read(`${DIR}/ConversationListView.vue`))
  assert.equal((list.match(/<TrashIcon/g) || []).length, 2, '短信左滑 + 多选栏各一处')
  assert.ok(!list.includes('GLYPHS.trash'), '不应回退到实心垃圾桶')

  // 电话应用六处曾各内联一份少竖线的残次品，全部收敛到通用件
  for (const f of [
    'src/components/apps/phone/PhoneRecentsTab.vue',
    'src/components/apps/phone/PhoneContactsTab.vue',
    'src/components/apps/phone/PhoneCallDetailModal.vue',
    'src/components/apps/phone/PhoneContactDetailModal.vue',
    'src/components/apps/phone/settings/PhoneHarassmentInterception.vue',
    'src/components/apps/phone/settings/PhoneAutoRecord.vue'
  ]) {
    const src = strip(read(f))
    assert.ok(src.includes('<TrashIcon'), `${f} 未使用通用删除图标`)
    assert.ok(!src.includes('M3 6h18M19 6v14'), `${f} 仍有缺竖线的内联垃圾桶`)
  }
})

test('单选弹窗走标准底部弹层，不用居中对话框', () => {
  const src = strip(read(`${DIR}/SettingsView.vue`))
  assert.match(src, /SheetOptionPicker/, '必须复用 ui/SheetOptionPicker')
  assert.ok(!src.includes('MsgDialog'), '设置页不再用居中 MsgDialog')
  assert.match(src, /show-bottom-cancel/, '底部取消按钮')
})

test('SIM 卡图标四处同源（MsgSimIcon）', () => {
  const icon = strip(read(`${DIR}/components/MsgSimIcon.vue`))
  assert.match(icon, /M6\.6 3\.6h7\.6l4\.4 4\.4/, '右上折角外框')
  assert.equal((icon.match(/<rect/g) || []).length, 4, '2×2 四格芯片')
  for (const f of ['ConversationView.vue', 'ComposeView.vue', 'settings/SimSmsView.vue', 'settings/XMessageView.vue']) {
    assert.ok(strip(read(`${DIR}/${f}`)).includes('MsgSimIcon'), `${f} 未使用统一图标`)
  }
})

test('XMessage 页开关贴卡片右缘', () => {
  const src = strip(read(`${DIR}/settings/XMessageView.vue`))
  assert.match(src, /margin-left: auto/, '开关靠右')
})

test('搜索页类别图标取自系统图标库（image / videoCamera）', () => {
  const src = strip(read(`${DIR}/SearchView.vue`))
  assert.match(src, /LIcon name="image"/)
  assert.match(src, /LIcon name="videoCamera"/)
  const lucide = strip(read('src/assets/icons/lucide.js'))
  assert.match(lucide, /videoCamera/, '共享图标库必须有这个键')
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
