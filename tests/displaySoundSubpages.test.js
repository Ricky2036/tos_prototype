import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  useDisplaySettingsStore, AUTO_SLEEP_OPTIONS, THEME_SCHEDULE_OPTIONS
} from '../src/stores/displaySettingsStore.js'
import {
  useSoundSettingsStore, RINGTONE_CLASSIC, RINGTONE_FUN, JBL_MODES
} from '../src/stores/soundSettingsStore.js'

const display = () => {
  setActivePinia(createPinia())
  return useDisplaySettingsStore()
}
const sound = () => {
  setActivePinia(createPinia())
  return useSoundSettingsStore()
}
const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

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

/* ==================== 二级页结构：所有行都接到三级页 ==================== */
test('显示与亮度页：9 个三级页全部接线，且补上了「强光模式」', () => {
  const src = read('src/components/apps/settings/SettingsDisplay.vue')

  // 强光模式（真机在自动调节亮度下方，带副标题与开关）
  assert.match(src, /title="强光模式"/)
  assert.match(src, /在强光下提高屏幕亮度，但会增加耗电与发热。/)
  assert.match(src, /strongLightMode/)

  for (const key of [
    'scheduleTheme', 'darkMode', 'eyeCare', 'colorStyle',
    'refreshRate', 'autoSleep', 'font', 'size', 'fullscreenApps'
  ]) {
    assert.match(src, new RegExp(`openSubPage\\('${key}'\\)`), `缺少 ${key} 的入口`)
  }

  // 不允许再有「只弹提示」的死入口
  assert.doesNotMatch(src, /handleItemTap\(/)
})

test('声音与振动页：7 个三级页全部接线', () => {
  const src = read('src/components/apps/settings/SettingsSound.vue')
  for (const key of ['haptics', 'ringtone', 'notifRingtone', 'vibration', 'jbl', 'noise', 'prompts']) {
    assert.match(src, new RegExp(`openSubPage\\('${key}'\\)`), `缺少 ${key} 的入口`)
  }
  assert.doesNotMatch(src, /handleItemTap\(/)
})

test('16 个三级页组件文件都存在，且都被二级页引用', () => {
  const displayPages = [
    'DisplayScheduleTheme', 'DisplayDarkMode', 'DisplayEyeCare', 'DisplayColorStyle',
    'DisplayRefreshRate', 'DisplayFont', 'DisplaySize', 'DisplayFullscreenApps'
  ]
  const soundPages = [
    'SoundHaptics', 'SoundRingtone', 'SoundNotifRingtone', 'SoundVibration',
    'SoundJbl', 'SoundNoiseReduction', 'SoundPrompts'
  ]

  for (const name of displayPages) {
    const p = `src/components/apps/settings/display/${name}.vue`
    assert.ok(fs.existsSync(p), `${p} 不存在`)
    assert.match(read('src/components/apps/settings/SettingsDisplay.vue'), new RegExp(name))
  }
  for (const name of soundPages) {
    const p = `src/components/apps/settings/sound/${name}.vue`
    assert.ok(fs.existsSync(p), `${p} 不存在`)
    assert.match(read('src/components/apps/settings/SettingsSound.vue'), new RegExp(name))
  }

  // 自动息屏是弹层而不是整页（真机如此）
  assert.ok(fs.existsSync('src/components/apps/settings/display/DisplayAutoSleepSheet.vue'))
})

test('三级页统一使用共享外壳，不允许各写一套导航与卡片', () => {
  const files = [
    ...fs.readdirSync('src/components/apps/settings/display').map(f => `src/components/apps/settings/display/${f}`),
    ...fs.readdirSync('src/components/apps/settings/sound').map(f => `src/components/apps/settings/sound/${f}`)
  ].filter(f => f.endsWith('.vue') && !f.endsWith('DisplayAutoSleepSheet.vue'))

  for (const f of files) {
    const src = read(f)
    assert.match(src, /SubPageShell/, `${f} 没有使用共享外壳`)
    // 外壳之外不应再自己画导航栏
    assert.doesNotMatch(src, /class="nav-round-btn"/, `${f} 自己又写了一版返回键`)
  }
})

/* ==================== 手机示意框比例守卫（2026-11-05 Ricky 打回） ==================== */
test('设置页里所有「手机屏幕示意框」都必须接近真机比例 360:788 ≈ 0.457', () => {
  const ROOT = 'src/components/apps/settings'
  const files = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(p)
      else if (entry.name.endsWith('.vue')) files.push(p)
    }
  }
  walk(ROOT)

  const BLOCK = /\.([\w-]*phone[\w-]*)\s*\{([^}]*)\}/g
  const checked = []

  for (const file of files) {
    const src = read(file)
    let m
    while ((m = BLOCK.exec(src)) !== null) {
      const cls = m[1]
      const body = m[2]
      // 只检查「单个手机屏幕示意框」：名字以 -phone 结尾，或 phone-mini / phone-big
      // （.two-phones-illustration 这类是并排容器的外层，不是单个屏幕，跳过）
      const isPhoneFrame = /-phone$/.test(cls) || cls === 'phone' || /^phone-(mini|big)$/.test(cls)
      if (!isPhoneFrame) continue

      const w = body.match(/width:\s*([\d.]+)px/)
      const h = body.match(/height:\s*([\d.]+)px/)
      if (!w || !h) continue

      const ratio = Number(w[1]) / Number(h[1])
      checked.push({ file, cls, ratio })
      assert.ok(
        ratio >= 0.40 && ratio <= 0.52,
        `${file} 的 .${cls} 宽高比 ${ratio.toFixed(3)} 不像手机屏幕（应在 0.40–0.52，真机是 0.457）`
      )
    }
  }

  assert.ok(checked.length >= 6, `扫到的手机示意框偏少：${checked.length}`)
})

test('手机示意框的内部内容不许挤在顶部（要用 space-evenly / space-between 铺开）', () => {
  const targets = [
    ['src/components/apps/settings/notifications/NotifControlCenter.vue', '.cc-phone', 'align-content: space-evenly'],
    ['src/components/apps/settings/display/DisplaySize.vue', '.size-phone', 'justify-content: space-between'],
    ['src/components/apps/settings/display/DisplayRefreshRate.vue', '.rate-phone', 'justify-content: space-between']
  ]
  for (const [file, cls, expect] of targets) {
    const src = read(file)
    const block = src.slice(src.indexOf(`${cls} {`), src.indexOf('}', src.indexOf(`${cls} {`)))
    assert.ok(block.includes(expect) || src.includes(expect), `${file} 的 ${cls} 缺少「${expect}」`)
  }
})

test('Dynamic Bar 头图必须是「被裁切的半部手机」（Ricky 2026-11-05 指出）', () => {
  const src = read('src/components/apps/settings/SettingsNotifications.vue')

  // 容器定高 + 裁切
  const wrap = src.slice(src.indexOf('.db-figure {'), src.indexOf('.db-figure-phone {'))
  assert.match(wrap, /overflow:\s*hidden/, '头图容器必须裁切')
  const wrapH = wrap.match(/height:\s*(\d+)px/)
  assert.ok(wrapH, '头图容器必须有固定高度')

  // 机器本身比容器高 ⇒ 底部被切掉，只露上半部
  const phone = src.slice(src.indexOf('.db-figure-phone {'), src.indexOf('.db-figure-hole {'))
  const phoneH = phone.match(/height:\s*(\d+)px/)
  assert.ok(phoneH, '.db-figure-phone 必须有高度')
  assert.ok(
    Number(phoneH[1]) > Number(wrapH[1]) * 1.5,
    `手机高度(${phoneH[1]}) 应远大于容器(${wrapH[1]})，否则就不是「半部手机」`
  )

  // 机身内部与页面同色，只留描边（真机效果）
  assert.doesNotMatch(phone, /background:\s*#FFFFFF/, '机身不该是白底')

  // 网格要铺到裁切边，不能只有几行
  assert.match(src, /v-for="n in (1[6-9]|2\d)"[^>]*><\/i>|<i v-for="n in (1[6-9]|2\d)"/, '头图网格格数太少，填不满裁切区')
})
