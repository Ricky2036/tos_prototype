/**
 * 显示与亮度 / 声音与振动 —— 运行时行为断言
 * ==============================================
 * 这一版不再 `readFileSync(X.vue)` + 正则匹配源码。主壳改 glob 自注册后，
 * 那种断言会整片假红；而且「源码里写了」不等于「页面真渲染、点得动」。
 *
 * 现在：挂起真实组件 → 断言渲染出的行 / 文案 / 计算样式 → 点进去验证三级页、
 * 四级页、弹层、确认框、禁用态；store 侧的纯逻辑断言保持原样。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import {
  useDisplaySettingsStore, AUTO_SLEEP_OPTIONS, THEME_SCHEDULE_OPTIONS
} from '../src/stores/displaySettingsStore.js'
import {
  useSoundSettingsStore, RINGTONE_CLASSIC, RINGTONE_FUN, JBL_MODES
} from '../src/stores/soundSettingsStore.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const display = () => {
  setActivePinia(createPinia())
  return useDisplaySettingsStore()
}
const sound = () => {
  setActivePinia(createPinia())
  return useSoundSettingsStore()
}

const DISPLAY = '/src/components/apps/settings/SettingsDisplay.vue'
const SOUND = '/src/components/apps/settings/SettingsSound.vue'
const NOTIFICATIONS = '/src/components/apps/settings/SettingsNotifications.vue'
const DISPLAY_PAGES = [
  'DisplayScheduleTheme', 'DisplayDarkMode', 'DisplayEyeCare', 'DisplayColorStyle',
  'DisplayRefreshRate', 'DisplayFont', 'DisplaySize', 'DisplayFullscreenApps'
]
const SOUND_PAGES = [
  'SoundHaptics', 'SoundRingtone', 'SoundNotifRingtone', 'SoundVibration',
  'SoundJbl', 'SoundNoiseReduction', 'SoundPrompts'
]
const pagePath = (name) =>
  `/src/components/apps/settings/${DISPLAY_PAGES.includes(name) ? 'display' : 'sound'}/${name}.vue`

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

/** 读当前 host 的 displaySettingsStore 字段 */
const displayOf = (id, expr) => rt.evaluate(async ({ id, expr }) => {
  const pinia = window.__wbHosts.get(id).host.__wbPinia
  const m = await import('/src/stores/displaySettingsStore.js')
  // eslint-disable-next-line no-new-func
  return new Function('s', `return (${expr})`)(m.useDisplaySettingsStore(pinia))
}, { id, expr })

/** 点一行后等共享外壳真的出现，别用固定 sleep 赌转场 */
async function clickIntoSubpage(id, label) {
  await rt.clickText(id, '.list-cell', label, 380)
  await rt.page.waitForFunction(({ hostId }) => {
    const h = window.__wbHosts.get(hostId)?.host
    return !!h && h.querySelectorAll('.sub-shell').length > 0
  }, { hostId: id }, { timeout: 4000 })
}

/* ==================== 显示与亮度：默认态对齐真机 ==================== */
test('显示与亮度默认态对齐真机 XOS 17', () => {
  const d = display()
  assert.equal(d.themeSchedule, 'off')
  assert.equal(d.darkWallpaperDim, true)
  assert.equal(d.sleepAssist, false)
  assert.equal(d.eyeCare, false)
  assert.equal(d.colorMode, 'original')
  assert.equal(d.colorTemp, 0.5)
  assert.equal(d.refreshRate, 'auto')
  assert.equal(d.autoSleep, '10 分钟')
  assert.equal(d.fontFamily, 'TransSans')
  assert.equal(d.displaySize, 'standard')
  assert.equal(d.gestureQuickSize, true)
  assert.equal(d.strongLightMode, true)
})

test('显示与亮度：非法选项被拒绝，合法值写回', () => {
  const d = display()
  assert.equal(d.setColorMode('rainbow'), false)
  assert.equal(d.setColorMode('vivid'), true)
  assert.equal(d.colorMode, 'vivid')

  assert.equal(d.setRefreshRate('120'), false)
  assert.equal(d.setRefreshRate('high'), true)
  assert.equal(d.refreshRate, 'high')

  assert.equal(d.setAutoSleep('3 分钟'), false)
  assert.equal(d.setAutoSleep('1 分钟'), true)

  assert.equal(d.setDisplaySize('giant'), false)
  assert.equal(d.setFontFamily('Comic'), false)
  assert.equal(d.setBool('notAKey', true), false)

  assert.equal(d.setNumber('colorTemp', 2), true)
  assert.equal(d.colorTemp, 1, '越界值应被夹到 1')
})

test('定时切换主题的三档取值与真机一致', () => {
  assert.deepEqual(
    THEME_SCHEDULE_OPTIONS.map(o => o.label),
    ['已关闭', '定时切换', '日落至日出']
  )
  const d = display()
  assert.equal(d.themeScheduleLabel(), '已关闭')
  d.setThemeSchedule('sunset')
  assert.equal(d.themeScheduleLabel(), '日落至日出')
})

test('自动息屏的六个档位与真机一致', () => {
  assert.deepEqual(AUTO_SLEEP_OPTIONS, ['15 秒', '30 秒', '1 分钟', '2 分钟', '5 分钟', '10 分钟'])
})

/* ==================== 声音与振动：默认态对齐真机 ==================== */
test('声音与振动默认态对齐真机 XOS 17', () => {
  const s = sound()
  assert.equal(s.soundMode, 'ring')
  assert.equal(s.touchFeedback, true)
  assert.equal(s.keyboardHaptic, true)
  assert.equal(s.ringtoneSim1, 'Elegant')
  assert.equal(s.ringtoneSim2, 'Elegant')
  assert.equal(s.notifRingtone, 'Acclivity')
  assert.equal(s.ringtoneCrescendo, false)
  assert.equal(s.vibrateLoudSpeaker, false)
  assert.equal(s.jblMode, 'smart')
  assert.equal(s.equalizer, true)
  assert.equal(s.noiseSystem, '标准降噪')
  assert.equal(s.noiseNet, '标准降噪')

  // 提示音：锁屏 / 触摸默认关，其余默认开
  assert.equal(s.promptDial, true)
  assert.equal(s.promptScreenshot, true)
  assert.equal(s.promptDelete, true)
  assert.equal(s.promptLock, false)
  assert.equal(s.promptCharge, true)
  assert.equal(s.promptTouch, false)
})

test('声音：铃声按 SIM 分别写入，未知通道被拒绝', () => {
  const s = sound()
  assert.equal(s.setRingtone('sim1', 'Grace'), true)
  assert.equal(s.ringtoneSim1, 'Grace')
  assert.equal(s.ringtoneSim2, 'Elegant', '不应串到 SIM2')

  assert.equal(s.setRingtone('notif', 'Cat'), true)
  assert.equal(s.notifRingtone, 'Cat')

  assert.equal(s.setRingtone('sim3', 'Grace'), false)
})

test('声音：JBL 四模式 / 降噪通道 / 振动强度夹值', () => {
  const s = sound()
  assert.deepEqual(JBL_MODES.map(m => m.label), ['智能', '视频', '游戏', '音乐'])
  assert.equal(s.setJblMode('cinema'), false)
  assert.equal(s.setJblMode('game'), true)
  assert.equal(s.jblMode, 'game')

  assert.equal(s.setNoiseMode('system', '深度降噪'), true)
  assert.equal(s.noiseSystem, '深度降噪')
  assert.equal(s.noiseNet, '标准降噪', '不应串到网络通话')
  assert.equal(s.setNoiseMode('bluetooth', '关闭'), false)

  s.setNumber('vibrateCall', -1)
  assert.equal(s.vibrateCall, 0)
  s.setNumber('vibrateNotif', 5)
  assert.equal(s.vibrateNotif, 1)
})

test('真机铃声清单与参考图一致', () => {
  assert.deepEqual(RINGTONE_CLASSIC, [
    'Desk phone', 'Drumming', 'Fast Pace', 'Fixed Telephone', 'Grace', 'Graceful Time', 'Landline'
  ])
  assert.deepEqual(RINGTONE_FUN, [
    'Baa Baa', 'Bicycle Bell', 'Blister', 'Bubble', 'Cat', 'Cave Drip', 'Cluck', 'Cricket'
  ])
})

/* ==================== 二级页：所有行都真的接得到三级页 ==================== */
test('显示与亮度页：9 个三级页入口都能点进去，且补上了「强光模式」', async () => {
  const h = await rt.mount(DISPLAY)
  const rows = await rt.texts(h, '.lc-title')
  for (const w of [
    '定时切换主题', '深色主题设置', '自动调节亮度', '强光模式', '护眼模式', '色彩风格',
    '屏幕刷新率', '自动息屏时间', '字体', '显示大小', '竖屏锁定', '应用全屏显示',
  ]) {
    assert.ok(rows.includes(w), `显示页缺少「${w}」这一行`)
  }
  assert.ok((await rt.allText(h)).includes('在强光下提高屏幕亮度，但会增加耗电与发热。'), '强光模式副标题')
  assert.ok((await rt.count(h, '.toggle-switch')) >= 3, '强光模式等开关应真实渲染')
  assert.equal(await rt.count(h, '.settings-card'), 4, '显示页应有 4 组卡片')
  await rt.unmount(h)

  const entries = [
    ['定时切换主题', '定时切换主题'],
    ['深色主题设置', '深色主题设置'],
    ['护眼模式', '护眼模式'],
    ['色彩风格', '色彩风格'],
    ['屏幕刷新率', '屏幕刷新率'],
    ['字体', '字体'],
    ['显示大小', '显示大小'],
    ['应用全屏显示', '应用全屏显示'],
  ]
  for (const [label, title] of entries) {
    const id = await rt.mount(DISPLAY)
    await clickIntoSubpage(id, label)
    assert.equal(await rt.visibleCount(id, '.sub-shell'), 1, `点「${label}」应进入三级页`)
    const titles = await rt.texts(id, '.gn-title')
    assert.ok(titles.some((t) => t.includes(title)), `三级页标题应含「${title}」`)
    await rt.unmount(id)
  }

  // 自动息屏是弹层不是整页（真机如此）
  const sleep = await rt.mount(DISPLAY)
  await rt.clickText(sleep, '.list-cell', '自动息屏时间', 400)
  await rt.page.waitForFunction(({ hostId }) => {
    const host = window.__wbHosts.get(hostId)?.host
    return !!host && !!host.querySelector('.sheet-panel')
  }, { hostId: sleep }, { timeout: 20000 })
  assert.equal(await rt.visibleCount(sleep, '.sheet-panel'), 1, '自动息屏应弹出弹层')
  assert.equal(await rt.count(sleep, '.sub-shell'), 0, '自动息屏不该推进三级页')
  assert.equal(await rt.count(sleep, '.sheet-option'), 6, '六档息屏时间应真实渲染')
  await rt.unmount(sleep)
})

test('声音与振动页：7 个三级页入口都能点进去', async () => {
  const h = await rt.mount(SOUND)
  const rows = await rt.texts(h, '.lc-title')
  for (const w of ['触感反馈', '来电铃声', '通知铃声', '振动强度', 'JBL 音效实验室', '全场景降噪', '提示音']) {
    assert.ok(rows.includes(w), `声音页缺少「${w}」这一行`)
  }
  assert.ok((await rt.count(h, '.volume-card .slider-track')) >= 1, '音量条应真实渲染')
  await rt.unmount(h)

  for (const label of ['触感反馈', '来电铃声', '通知铃声', '振动强度', 'JBL 音效实验室', '全场景降噪', '提示音']) {
    const id = await rt.mount(SOUND)
    await clickIntoSubpage(id, label)
    assert.equal(await rt.visibleCount(id, '.sub-shell'), 1, `点「${label}」应进入三级页`)
    assert.equal(await rt.visibleCount(id, '.glass-nav.is-overlay'), 1, '三级页应有共享导航条')
    await rt.unmount(id)
  }
})

test('16 个三级页组件都能被加载并渲染出内容，自动息屏是弹层', async () => {
  const paths = [...DISPLAY_PAGES, ...SOUND_PAGES].map(pagePath)
  assert.equal(paths.length, 15, '显示 8 + 声音 7 = 15 个三级页')
  const mounted = await rt.mountMany(paths)
  for (const m of mounted) {
    assert.ok(m.id, `${m.path} 应能挂载：${m.error || ''}`)
    assert.ok((await rt.count(m.id, '*')) > 0, `${m.path} 应渲染出真实节点`)
  }
  assert.equal(mounted.filter((m) => m.error).length, 0, '不允许有加载失败的三级页')

  const sheet = await rt.mount('/src/components/apps/settings/display/DisplayAutoSleepSheet.vue', { visible: true })
  assert.equal(await rt.visibleCount(sheet, '.sheet-panel'), 1, '自动息屏应渲染成弹层')
  assert.equal(await rt.count(sheet, '.sub-shell'), 0, '自动息屏不该是整页')
  await rt.unmount(sheet)
})

test('三级页统一使用共享外壳，不允许各写一套导航与卡片', async () => {
  for (const name of [...DISPLAY_PAGES, ...SOUND_PAGES]) {
    const p = pagePath(name)
    const id = await rt.mount(p)
    assert.equal(await rt.visibleCount(id, '.sub-shell'), 1, `${name} 应使用共享外壳`)
    assert.equal(await rt.visibleCount(id, '.glass-nav.is-overlay'), 1, `${name} 应挂共享导航条`)
    assert.equal(await rt.count(id, '.sub-nav'), 0, `${name} 不许自己画导航条`)
    assert.equal(await rt.count(id, '.gn-btn.gn-back'), 1, `${name} 只许一个返回键`)
    assert.equal(await rt.count(id, '.large-title'), 0, `${name} 不该再叠一层大标题`)
    await rt.unmount(id)
  }
})

/* ==================== 手机示意框比例守卫 ==================== */
test('设置页里所有「手机屏幕示意框」都接近真机比例 360:788 ≈ 0.457', async () => {
  const pages = [
    '/src/components/apps/settings/notifications/NotifControlCenter.vue',
    '/src/components/apps/settings/display/DisplaySize.vue',
    '/src/components/apps/settings/display/DisplayRefreshRate.vue',
    '/src/components/apps/settings/display/DisplayFullscreenApps.vue',
    NOTIFICATIONS,
  ]
  const checked = []
  for (const p of pages) {
    const id = await rt.mount(p)
    const frames = await rt.evaluate(({ hostId }) => {
      const host = window.__wbHosts.get(hostId).host
      const out = []
      for (const e of host.querySelectorAll('*')) {
        for (const c of e.classList) {
          const isFrame = /-phone$/.test(c) || c === 'phone' || /^phone-(mini|big)$/.test(c)
          if (!isFrame) continue
          const r = e.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) out.push({ cls: c, ratio: r.width / r.height })
        }
      }
      return out
    }, { hostId: id })
    for (const f of frames) {
      checked.push(f)
      assert.ok(
        f.ratio >= 0.40 && f.ratio <= 0.52,
        `${p} 的 .${f.cls} 宽高比 ${f.ratio.toFixed(3)} 不像手机屏幕（应在 0.40–0.52）`,
      )
    }
    await rt.unmount(id)
  }
  assert.ok(checked.length >= 6, `扫到的手机示意框偏少：${checked.length}`)
})

test('手机示意框的内容不许挤在顶部（要铺满整块屏）', async () => {
  const cc = await rt.mount('/src/components/apps/settings/notifications/NotifControlCenter.vue')
  const spread = await rt.evaluate(({ id }) => {
    const el = window.__wbHosts.get(id).host.querySelector('.cc-phone')
    const cr = el.getBoundingClientRect()
    const kids = [...el.children].map((k) => k.getBoundingClientRect())
    return { height: cr.height, gap: getComputedStyle(el).rowGap, lastBottom: cr.bottom - kids[kids.length - 1].bottom }
  }, { id: cc })
  assert.ok(spread.lastBottom < spread.height * 0.15, '控制中心示意框内容应铺到底部')
  assert.ok(parseFloat(spread.gap) > 0, '控制中心示意框要靠 gap 均匀铺开')
  await rt.unmount(cc)

  for (const [p, sel] of [
    ['/src/components/apps/settings/display/DisplaySize.vue', '.size-phone'],
    ['/src/components/apps/settings/display/DisplayRefreshRate.vue', '.rate-phone'],
  ]) {
    const id = await rt.mount(p)
    assert.equal(await rt.style(id, sel, 'justifyContent'), 'space-between', `${sel} 内容应两端铺开`)
    await rt.unmount(id)
  }
})

test('Dynamic Bar 头图是「被裁切的半部手机」（Ricky 2026-11-05 指出）', async () => {
  const h = await rt.mount(NOTIFICATIONS)
  await rt.clickText(h, '.list-cell', 'Dynamic Bar', 420)
  await rt.page.waitForFunction(({ id }) => {
    const host = window.__wbHosts.get(id)?.host
    return !!host && !!host.querySelector('.db-figure')
  }, { id: h }, { timeout: 4000 })

  const figure = await rt.styleMap(h, '.db-figure', ['height', 'overflow'])
  const phone = await rt.styleMap(h, '.db-figure-phone', ['height', 'backgroundColor'])
  assert.equal(figure.overflow, 'hidden', '头图容器必须裁切')
  assert.ok(parseFloat(figure.height) > 0, '头图容器必须有固定高度')
  assert.ok(parseFloat(phone.height) > 0, '.db-figure-phone 必须有高度')
  assert.ok(
    parseFloat(phone.height) > parseFloat(figure.height) * 1.5,
    `手机高度(${phone.height}) 应远大于容器(${figure.height})，否则不是「半部手机」`,
  )
  assert.notEqual(phone.backgroundColor, 'rgb(255, 255, 255)', '机身不该是白底')
  for (const sel of ['.db-figure-card', '.db-figure-expand', '.db-figure-tap']) {
    assert.equal(await rt.count(h, sel), 1, `缺少 ${sel}`)
  }
  await rt.unmount(h)
})

test('自动息屏弹层把几何交给 SheetModal（自身不再写遮罩/圆角）', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayAutoSleepSheet.vue', { visible: true })
  assert.equal(await rt.visibleCount(h, '.sheet-panel'), 1, '应由 visible 驱动统一弹层控件')
  assert.equal(await rt.style(h, '.sheet-mask', 'position'), 'absolute', '遮罩必须是应用内绝对定位')
  assert.equal(await rt.style(h, '.sheet-panel', 'borderTopLeftRadius'), '26px', '卡片圆角交给统一控件')
  assert.equal(await rt.style(h, '.sheet-panel', 'borderBottomLeftRadius'), '26px', '四角都圆，不是只圆上两角')
  assert.equal(await rt.count(h, '.rs-mask, .sheet-mask-custom'), 0, '不应再自己画遮罩')
  assert.equal(await rt.count(h, '.sheet-option'), 6, '六档息屏时间')
  await rt.unmount(h)

  const closed = await rt.mount('/src/components/apps/settings/display/DisplayAutoSleepSheet.vue', { visible: false })
  assert.equal(await rt.count(closed, '.sheet-panel'), 0, 'visible=false 时面板应卸载')
  await rt.unmount(closed)
})

test('振动模式：来电与通知是两套不同清单，按 SIM 分别存储', async () => {
  const m = await import('../src/stores/soundSettingsStore.js')
  assert.deepEqual(m.SIM_VIBRATE_PATTERNS, [
    '标准', '动感', '飞速', '非洲鼓', '华尔兹', '紧急', '落珠', '切分音', '心动', '中东鼓'
  ])
  assert.deepEqual(m.NOTIF_VIBRATE_PATTERNS, [
    '标准', '电报', '动感', '连击', '快速', '鸣笛', '三连音', '舒缓', '心跳', '摇摆'
  ])

  setActivePinia(createPinia())
  const s = m.useSoundSettingsStore()
  assert.equal(s.sim1VibratePattern, '跟随音乐节奏')
  assert.equal(s.sim2VibratePattern, '跟随音乐节奏')
  assert.equal(s.notifVibratePattern, '跟随音乐节奏')

  s.setVibratePattern('sim1', '落珠')
  assert.equal(s.sim1VibratePattern, '落珠')
  assert.equal(s.sim2VibratePattern, '跟随音乐节奏', '不应串到 SIM2')
  assert.equal(s.setVibratePattern('sim3', '标准'), false)
})

test('自定义铃声：按通道分别记录文件，未知名通道被拒绝', () => {
  setActivePinia(createPinia())
  const s = useSoundSettingsStore()
  assert.equal(s.customRingtoneSim, '', '默认用内置铃声')
  assert.equal(s.setCustomRingtone('sim', '五彩彝裳'), true)
  assert.equal(s.customRingtoneSim, '五彩彝裳')
  assert.equal(s.customRingtoneNotif, '')
  assert.equal(s.setCustomRingtone('nope', 'x'), false)
})

test('四级页：我的字体 / 振动模式 / 自定义铃声 都能从三级页点进去', async () => {
  // 三级页本身就带一个 .sub-shell，四级页是替换内容而不是叠加，所以判据看内容是否切换
  const font = await rt.mount('/src/components/apps/settings/display/DisplayFont.vue')
  const fontBefore = await rt.allText(font)
  await clickIntoSubpage(font, '我的字体')
  assert.notEqual(await rt.allText(font), fontBefore, '「我的字体」必须可点进四级页')
  assert.ok((await rt.allText(font)).includes('TransSans'), '四级页应列出字体')
  await rt.unmount(font)

  for (const [p, label] of [
    ['/src/components/apps/settings/sound/SoundRingtone.vue', '振动'],
    ['/src/components/apps/settings/sound/SoundNotifRingtone.vue', '振动'],
  ]) {
    const id = await rt.mount(p)
    const before = await rt.allText(id)
    await clickIntoSubpage(id, label)
    assert.notEqual(await rt.allText(id), before, `${p} 的「${label}」应可点进四级页`)
    assert.ok((await rt.count(id, '.sub-shell')) >= 1, `${p} 四级页应挂在共享外壳里`)
    await rt.unmount(id)
  }

  for (const p of [
    '/src/components/apps/settings/display/DisplayMyFonts.vue',
    '/src/components/apps/settings/sound/SoundVibratePattern.vue',
    '/src/components/apps/settings/sound/SoundCustomRingtone.vue',
  ]) {
    const id = await rt.mount(p)
    assert.ok((await rt.count(id, '*')) > 0, `${p} 应渲染出真实节点`)
    await rt.unmount(id)
  }
})

test('屏幕刷新率：选「高」要先弹功耗确认，确认后才写 store', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayRefreshRate.vue')
  await rt.evaluate(async ({ id }) => {
    const pinia = window.__wbHosts.get(id).host.__wbPinia
    const m = await import('/src/stores/displaySettingsStore.js')
    m.useDisplaySettingsStore(pinia).setRefreshRate('auto')
  }, { id: h })
  await rt.settle(h, 80)
  assert.equal(await displayOf(h, 's.refreshRate'), 'auto', '默认是智能切换')
  assert.equal(await rt.count(h, '.confirm-title'), 0, '初始不应有确认弹窗')

  await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    const row = [...host.querySelectorAll('.list-cell')].find((e) => e.textContent.trim().startsWith('高'))
    if (row) row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  }, { id: h })
  await rt.page.waitForFunction(({ id }) => {
    const host = window.__wbHosts.get(id)?.host
    return !!host && !!host.querySelector('.confirm-title')
  }, { id: h }, { timeout: 4000 })

  assert.equal(await rt.count(h, '.confirm-title'), 1, '选「高」应弹确认')
  assert.equal(await rt.text(h, '.confirm-title'), '切换为高刷新率', '确认弹窗标题')
  assert.equal(await rt.text(h, '.confirm-desc'), '高刷新率将增加耗电，推荐保持智能切换模式。', '确认弹窗正文')
  assert.equal(await displayOf(h, 's.refreshRate'), 'auto', '未确认前不能写 store')

  await rt.click(h, '.confirm-btn.primary', 220)
  assert.equal(await rt.count(h, '.confirm-title'), 0, '确认后弹窗应关闭')
  assert.equal(await displayOf(h, 's.refreshRate'), 'high', '确认后才写入 high')
  await rt.unmount(h)
})

test('自定义应用刷新率与「高」绑定：非高亮率档位禁用且不可进', () => {
  setActivePinia(createPinia())
  const d = useDisplaySettingsStore()

  d.setRefreshRate('auto')
  assert.equal(d.canCustomizePerApp(), false, '智能切换下不可自定义')
  d.setRefreshRate('standard')
  assert.equal(d.canCustomizePerApp(), false, '标准下不可自定义')
  d.setRefreshRate('high')
  assert.equal(d.canCustomizePerApp(), true, '只有「高」可以自定义')

  // store 自己也要挡住（不只是 UI 禁用）
  d.setRefreshRate('auto')
  assert.equal(d.setPerAppRefresh('douyin', 'high'), false, '非高亮率档位写入应被拒绝')
  assert.equal(d.perAppRefreshOf('douyin'), 'auto')

  d.setRefreshRate('high')
  assert.equal(d.setPerAppRefresh('douyin', 'high'), true)
  assert.equal(d.perAppRefreshOf('douyin'), 'high')
  assert.equal(d.setPerAppRefresh('douyin', 'ultra'), false, '非法档位被拒')
})

test('刷新率页：该行用 disabled 表达绑定关系，而不是静默无响应', async () => {
  const locked = await rt.mount('/src/components/apps/settings/display/DisplayRefreshRate.vue')
  // 前一个用例把档位切到过 high，这里显式回到 auto 再验绑定关系
  await rt.evaluate(async ({ id }) => {
    const pinia = window.__wbHosts.get(id).host.__wbPinia
    const m = await import('/src/stores/displaySettingsStore.js')
    m.useDisplaySettingsStore(pinia).setRefreshRate('auto')
  }, { id: locked })
  await rt.settle(locked, 80)
  assert.equal(await displayOf(locked, 's.refreshRate'), 'auto', '智能切换档位')
  assert.equal(await rt.count(locked, '.list-cell.is-disabled'), 1, '非高亮率档位应有一行禁用')
  const titlesBefore = await rt.texts(locked, '.gn-title')
  await rt.clickText(locked, '.list-cell.is-disabled', '自定义应用刷新率', 300)
  assert.deepEqual(await rt.texts(locked, '.gn-title'), titlesBefore, '禁用行点了也不该切到四级页')
  assert.ok(
    !(await rt.texts(locked, '.gn-title')).some((t) => t.includes('自定义应用刷新率')),
    '禁用行不该打开四级页',
  )
  await rt.unmount(locked)

  const unlocked = await rt.mount('/src/components/apps/settings/display/DisplayRefreshRate.vue')
  await rt.evaluate(async ({ id }) => {
    const pinia = window.__wbHosts.get(id).host.__wbPinia
    const m = await import('/src/stores/displaySettingsStore.js')
    m.useDisplaySettingsStore(pinia).setRefreshRate('high')
  }, { id: unlocked })
  await rt.settle(unlocked, 100)
  assert.equal(await rt.count(unlocked, '.list-cell.is-disabled'), 0, '切到「高」后该行应解禁')
  await rt.clickText(unlocked, '.list-cell', '自定义应用刷新率', 420)
  await rt.page.waitForFunction(({ id }) => {
    const host = window.__wbHosts.get(id)?.host
    return !!host && [...host.querySelectorAll('.gn-title')].some((e) => e.textContent.includes('自定义应用刷新率'))
  }, { id: unlocked }, { timeout: 4000 })
  assert.equal(await rt.visibleCount(unlocked, '.sub-shell'), 1, '解禁后应能进四级页')
  await rt.unmount(unlocked)
})

test('ListCell 支持禁用态（置灰 + 不触发点击）', async () => {
  const mountCell = (disabled, flag) => rt.evaluate(async ({ disabled, flag }) => {
    const mod = await import('/src/components/ui/ListCell.vue')
    const { createApp, createPinia, setActivePinia, nextTick } = window.__wb
    window[flag] = 0
    const host = document.createElement('div')
    host.className = 'wb-host'
    host.id = `wb-host-${++window.__wbSeq}`
    document.body.appendChild(host)
    const app = createApp(mod.default, {
      title: '自定义应用刷新率', disabled, onClick: () => { window[flag] += 1 },
    })
    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
    app.config.warnHandler = () => {}
    app.mount(host)
    await nextTick()
    host.__wbPinia = pinia
    window.__wbHosts.set(host.id, { host, app, pinia })
    return host.id
  }, { disabled, flag })

  const off = await mountCell(true, '__wbDisabledClicks')
  assert.ok((await rt.classes(off, '.list-cell')).includes('is-disabled'), '禁用态应有 is-disabled')
  await rt.click(off, '.list-cell', 40)
  assert.equal(await rt.evaluate(() => window.__wbDisabledClicks), 0, '禁用时不应派发 click')
  await rt.unmount(off)

  const on = await mountCell(false, '__wbEnabledClicks')
  assert.ok(!(await rt.classes(on, '.list-cell')).includes('is-disabled'), '启用态不应有 is-disabled')
  await rt.click(on, '.list-cell', 40)
  assert.equal(await rt.evaluate(() => window.__wbEnabledClicks), 1, '启用时应派发 click')
  await rt.unmount(on)
})

test('护眼「定时开启」：三档与真机一致，非法值被拒', async () => {
  setActivePinia(createPinia())
  const d = useDisplaySettingsStore()
  assert.equal(d.eyeCareSchedule, 'off')
  assert.equal(d.setEyeCareSchedule('sunset'), true)
  assert.equal(d.eyeCareSchedule, 'sunset')
  assert.equal(d.setEyeCareSchedule('always'), false)

  const page = await rt.mount('/src/components/apps/settings/display/DisplayEyeCare.vue')
  await clickIntoSubpage(page, '定时开启')
  const text = await rt.allText(page)
  for (const label of ['已关闭', '定时开启', '日落至日出']) {
    assert.ok(text.includes(label), `定时开启页缺少选项「${label}」`)
  }
  assert.ok((await rt.count(page, '.sub-shell')) >= 1, '定时开启应推进子页')
  await rt.unmount(page)
})

test('亮度条端点要与卡片内容边距对齐（滑块居中会外溢半个滑块宽）', async () => {
  const h = await rt.mount(DISPLAY)
  const track = await rt.styleMap(h, '.slider-track', ['marginRight', 'height', 'width'])
  const thumb = await rt.styleMap(h, '.slider-thumb', ['width', 'height'])
  const inset = parseFloat(track.marginRight)
  const thumbW = parseFloat(thumb.width)
  assert.ok(thumbW > 0, '滑块必须是固定宽度')
  assert.equal(thumb.width, thumb.height, '滑块应是正圆')
  assert.equal(track.height, '10px', '亮度条轨道 10px')
  assert.equal(
    inset,
    Math.round(thumbW / 2),
    `滑块右内缩应等于半个滑块宽（${thumbW}/2=${thumbW / 2}px），当前 ${inset}px`,
  )
  assert.ok(parseFloat(track.width) > 0, '轨道必须真实渲染出宽度')
  await rt.unmount(h)
})

test('深色主题设置用真正的壁纸预览，不是商品照', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayDarkMode.vue')
  const src = await rt.attr(h, '.sub-preview-img', 'src')
  assert.ok(src && src.includes('wallpaper-lock'), '应使用壁纸图')
  assert.ok(!src.includes('album-2'), '不该再用专辑/商品照片当壁纸预览')
  assert.equal(await rt.visibleCount(h, '.sub-preview-img'), 1, '壁纸预览应真实可见')
  await rt.unmount(h)
})

test('字体页：顶部预览区随字体/字号实时变化（真机是「上预览下切换」）', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayFont.vue')
  assert.equal(await rt.visibleCount(h, '.font-preview'), 1, '缺少顶部预览区')
  assert.equal(await rt.visibleCount(h, '.font-sheet'), 1, '缺少底部统一卡片')

  const order = await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    const a = host.querySelector('.font-preview')
    const b = host.querySelector('.font-sheet')
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? 'preview-first' : 'sheet-first'
  }, { id: h })
  assert.equal(order, 'preview-first', '预览区必须排在切换卡片之前')

  const size0 = await rt.style(h, '.font-preview', 'fontSize')
  await rt.evaluate(async ({ id }) => {
    const pinia = window.__wbHosts.get(id).host.__wbPinia
    const m = await import('/src/stores/displaySettingsStore.js')
    m.useDisplaySettingsStore(pinia).setNumber('fontSize', 1)
  }, { id: h })
  await rt.settle(h, 100)
  const size1 = await rt.style(h, '.font-preview', 'fontSize')
  assert.notEqual(size1, size0, '字号滑块应驱动预览的实时字号')
  assert.ok(parseFloat(size1) > parseFloat(size0), '字号调大后预览字也应变大')

  await rt.evaluate(async ({ id }) => {
    const pinia = window.__wbHosts.get(id).host.__wbPinia
    const m = await import('/src/stores/displaySettingsStore.js')
    m.useDisplaySettingsStore(pinia).fontFamily = 'Roboto'
  }, { id: h })
  await rt.settle(h, 100)
  assert.ok((await rt.style(h, '.font-preview', 'fontFamily')).includes('Roboto'), '字体卡应驱动预览字体')
  await rt.unmount(h)
})

test('应用全屏显示：用桌面注册的应用与真实图标，不用首字母色块', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayFullscreenApps.vue')
  const icons = await rt.count(h, '.app-icon-img')
  assert.ok(icons >= 10, `应用图标数量偏少：${icons}`)
  const srcs = await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    return [...host.querySelectorAll('.app-icon-img')].map((e) => e.getAttribute('src') || '')
  }, { id: h })
  for (const src of srcs) assert.ok(src && src.length > 0, '每个应用都要有真实图标 src')
  assert.equal(await rt.count(h, '.app-letter'), 0, '不该再用首字母色块')
  assert.equal(await rt.count(h, '[style*="F97316"]'), 0, '不该再有硬编码品牌色块')
  await rt.unmount(h)
})

test('滑块控件按真机实测：轨道 10px / 圆点 22px + 3px 蓝环 / 无阴影 / 右端内缩', async () => {
  const h = await rt.mount('/src/components/apps/settings/subpage/HSettingSlider.vue', { modelValue: 0.5, steps: 5 })
  const track = await rt.styleMap(h, '.h-slider-track', ['height', 'backgroundColor', 'marginRight'])
  const fill = await rt.styleMap(h, '.h-slider-fill', ['backgroundColor'])
  const thumb = await rt.styleMap(h, '.h-slider-thumb', [
    'width', 'borderTopWidth', 'borderTopColor', 'boxShadow', 'boxSizing',
  ])
  assert.equal(track.height, '10px', '轨道厚应为 10px（真机实测）')
  assert.equal(track.backgroundColor, 'rgb(235, 235, 235)', '未填充轨道色 #EBEBEB')
  assert.equal(track.marginRight, '11px', '右端要内缩半个圆点')
  assert.equal(fill.backgroundColor, 'rgb(51, 117, 246)', '填充色 #3375F6')
  assert.equal(thumb.width, '22px', '圆点直径 22px')
  assert.equal(thumb.borderTopWidth, '3px', '圆点 = 白底 + 3px 蓝环')
  assert.equal(thumb.borderTopColor, 'rgb(51, 117, 246)', '蓝环颜色')
  assert.equal(thumb.boxShadow, 'none', '圆点不该有灰糊阴影')
  assert.equal(thumb.boxSizing, 'border-box', '描边不能把圆点撑大')

  assert.equal(await rt.count(h, '.h-slider-tick'), 5, '5 档滑块的刻度点数应等于档位数（含首尾）')
  assert.ok((await rt.count(h, '.h-slider-tick.covered')) >= 1, '已填充刻度点要有 covered 态')
  const ticks = await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    return [...host.querySelectorAll('.h-slider-tick')].map((e) => parseFloat(getComputedStyle(e).left))
  }, { id: h })
  assert.equal(ticks.length, 5, '刻度点应铺在 0%..100%')
  assert.ok(ticks[0] <= ticks[4], '刻度点应从左到右递增')

  const continuous = await rt.mount('/src/components/apps/settings/subpage/HSettingSlider.vue', { modelValue: 0.5 })
  assert.equal(await rt.count(continuous, '.h-slider-tick'), 0, '无极滑块不该画档位刻度点')
  await rt.unmount(continuous)
  await rt.unmount(h)
})

test('字体页底部是「一张统一白卡」，预览区在其上方', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayFont.vue')
  const sheet = await rt.styleMap(h, '.font-sheet', ['backgroundColor', 'marginTop'])
  assert.equal(sheet.backgroundColor, 'rgb(255, 255, 255)', '卡片应为白底')
  assert.ok(parseFloat(sheet.marginTop) > 0, 'margin-top:auto 应把卡片推到底部')

  const inside = await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    const el = host.querySelector('.font-sheet')
    return {
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      cards: el.querySelectorAll('.font-cards').length,
      sliders: el.querySelectorAll('.h-slider').length,
    }
  }, { id: h })
  assert.ok(inside.text.includes('我的字体'), '卡片内缺少「我的字体」')
  assert.equal(inside.cards, 1, '卡片内缺少字体卡')
  assert.ok(inside.text.includes('字体大小'), '卡片内缺少字号滑块')
  assert.ok(inside.text.includes('字体粗细'), '卡片内缺少字重滑块')
  assert.equal(inside.sliders, 2, '卡片内应同时装下两个滑块')
  await rt.unmount(h)
})

test('两种滑块：字体大小 5 档（含首尾）、字体粗细无极', async () => {
  const h = await rt.mount('/src/components/apps/settings/display/DisplayFont.vue')
  const ticks = await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    return [...host.querySelectorAll('.h-slider')].map((s) => s.querySelectorAll('.h-slider-tick').length)
  }, { id: h })
  assert.equal(ticks.length, 2, '字体页应有两条滑块')
  assert.equal(ticks[0], 5, '字号滑块应是 5 档')
  assert.equal(ticks[1], 0, '字重滑块应为无极（无刻度点）')
  await rt.unmount(h)
})

test('声音与振动页音量条也统一到同一套滑块视觉', async () => {
  const h = await rt.mount(SOUND)
  const track = await rt.styleMap(h, '.volume-card .slider-track', [
    'height', 'backgroundColor', 'marginRight',
  ])
  const thumb = await rt.styleMap(h, '.volume-card .slider-thumb', [
    'borderTopWidth', 'borderTopColor', 'boxShadow', 'boxSizing', 'width',
  ])
  assert.equal(track.height, '10px', '音量条轨道应为 10px')
  assert.equal(track.backgroundColor, 'rgb(235, 235, 235)', '未填充轨道色')
  assert.equal(track.marginRight, '11px', '右端内缩半个圆点')
  assert.equal(thumb.borderTopWidth, '3px', '圆点 = 白底 + 3px 蓝环')
  assert.equal(thumb.borderTopColor, 'rgb(51, 117, 246)', '蓝环颜色')
  assert.equal(thumb.boxShadow, 'none', '音量条圆点也不该有投影')
  assert.equal(thumb.width, '22px', '圆点直径 22px')
  assert.equal(thumb.boxSizing, 'border-box', '描边不撑大圆点')
  assert.equal(rt.pageErrors.length, 0, `运行时不应有异常：${rt.pageErrors.join('; ')}`)
  await rt.unmount(h)
})
