/**
 * 设置功能分组 —— 运行时行为断言
 * =================================
 * 原先逐条 `assert.match(readFileSync(...), /文案/)` 只证明源码里出现过这些字符，
 * 主壳改 glob 自注册后会整片假红。现在把页面挂起来：
 *   · 文案 → 渲染后的真实文本
 *   · 结构 → 真实 DOM 节点与计算样式
 *   · 接线 → 从设置首页点进去，断言子页真的渲染出来
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRuntime } from './helpers/vueRuntime.mjs'

const ACCESSIBILITY = '/src/components/apps/settings/SettingsAccessibility.vue'
const ONETAP = '/src/components/apps/settings/SettingsOneTap.vue'
const BATTERY = '/src/components/apps/settings/SettingsBattery.vue'
const STORAGE = '/src/components/apps/settings/SettingsStorage.vue'
const SETTINGS_APP = '/src/components/apps/settings/SettingsApp.vue'

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

/** 逐条断言渲染文本里出现某文案 —— 一条文案一条 assert，保持原有断言密度 */
async function expectTexts(id, words, label) {
  const text = await rt.allText(id)
  for (const w of words) {
    assert.ok(text.includes(w), `${label} 渲染结果缺少「${w}」`)
  }
  return text
}

test('辅助功能页：导航 / 引导卡 / 四组条目都真实渲染', async () => {
  const h = await rt.mount(ACCESSIBILITY)
  const text = await expectTexts(h, [
    '辅助功能', '通过视力、肢体活动能力、听力、语音和认知方面',
    '无障碍', '录屏', '截屏', '动作与手势', '智感握姿',
    '小窗', '便捷高效的全局应用浮窗', '应用分屏', '智能侧边栏',
    '户外增强', '晕动舒缓显示', '游戏模式',
    '防误触模式', '你可能想找', '应用双开', '防偷窥', '数字健康',
    '屏幕内同时显示两个应用界面', '访问多任务窗口与智能场景助手',
    '户外使用时增强屏幕亮度', '有助于缓解乘坐交通工具引起的晕动症',
    '提升游戏体验', '手机在口袋中时防止误触',
  ], '辅助功能页')

  assert.equal(await rt.visibleCount(h, '.glass-nav.is-overlay'), 1, '必须挂共享导航条')
  assert.equal(await rt.visibleCount(h, '.accessibility-hero-card'), 1, '必须有引导卡')
  assert.ok((await rt.visibleCount(h, '.settings-card')) >= 3, '分组卡片应成组出现')
  assert.ok((await rt.visibleCount(h, '.list-cell')) >= 10, '条目行应真实可见')
  assert.ok(text.indexOf('无障碍') < text.indexOf('户外增强'), '分组顺序应与真机一致')
  assert.equal(await rt.text(h, '.gn-title'), '辅助功能', '导航标题应为「辅助功能」')
  assert.equal(await rt.visibleCount(h, '.hero-icon-wrap'), 1, '引导卡图标应可见')
  assert.equal(await rt.visibleCount(h, '.relative-links-box'), 1, '「你可能想找」入口应可见')
  assert.equal(rt.pageErrors.length, 0, `运行时不应有异常：${rt.pageErrors.join('; ')}`)
  await rt.unmount(h)
})

test('One-Tap Button：深色机身 / 模式轮播 / 分页与设定键都可用', async () => {
  const h = await rt.mount(ONETAP)
  await expectTexts(h, [
    'One-Tap Button', '自定义', '手电筒', '使用中',
  ], 'One-Tap 页')

  // 源码里那些模式名本来只写在配置数组里；运行时直接读组件实例的状态，
  // 再点分页验证真的能切过去 —— 比「源码里有这几个字」强。
  const modes = await rt.evaluate(({ id }) => {
    const st = window.__wbHosts.get(id).app._instance.setupState
    return JSON.parse(JSON.stringify(st.modes)).map((m) => [m.name, m.alias || '', ...(m.subtitles || [])].join(' '))
  }, { id: h })
  const modeText = modes.join(' ')
  for (const w of ['静音模式', '快捷应用', '翻译助手', '静音模式', '手电筒', '相机', '无操作']) {
    assert.ok(modeText.includes(w), `运行时模式配置里缺少「${w}」`)
  }
  assert.ok(modes.length >= 12, `模式数量偏少：${modes.length}`)

  assert.equal(await rt.style(h, '.onetap-page', 'backgroundColor'), 'rgb(0, 0, 0)', '页面应为真机深色沉浸')
  for (const sel of ['.phone-rail', '.button-cavity', '.active-capsule-button', '.pagination-dots', '.apply-btn']) {
    assert.equal(await rt.visibleCount(h, sel), 1, `缺少可见的 ${sel}`)
  }
  assert.equal(await rt.count(h, '.dot-node'), modes.length, '分页点数应等于模式数')

  const before = await rt.text(h, '.mode-title')
  // 某个分页点可能正好是当前模式，逐个试到真的切走为止（别赌固定动画时长）
  let after = before
  const dotCount = Math.min(5, await rt.count(h, '.dot-node'))
  for (let i = 1; i <= dotCount; i += 1) {
    await rt.click(h, `.dots-row .dot-node:nth-child(${i})`, 240)
    after = await rt.text(h, '.mode-title')
    if (after !== before) break
  }
  assert.ok(before && after, '模式标题应始终渲染')
  assert.notEqual(after, before, '点分页后当前模式应真的切换')
  assert.ok(modes.some((m) => m.includes(after.trim())), `切换后的「${after}」应在模式配置里`)
  assert.equal(await rt.visibleCount(h, '.chassis-bg-img'), 1, '机身底图应可见')
  assert.equal(await rt.visibleCount(h, '.capsule-glow'), 1, '胶囊发光层应可见')
  await rt.unmount(h)
})

test('电池与省电页：电量 / 三种模式 / 设置项 / 用量图表都真实渲染', async () => {
  const h = await rt.mount(BATTERY)
  const text = await expectTexts(h, [
    '电池与省电', '91%', '正在充电', '剩余 27 小时 51 分钟',
    '省电模式', '30 小时 44 分钟', '均衡模式', '27 小时 51 分钟', '超级省电',
    '省电管理', '充电设置', '电池健康', '最大容量 100%',
    '距上次充满电已使用', '9 小时 13 分钟', '过去 24 小时', '过去 7 天',
    '亮屏活动时长', '息屏活动时长',
    'TikTok', 'YouTube', '微信',
    '电池模式', '预计可用', '电池使用情况', '耗电占比排行',
    '前台', '相机', '浏览器',
  ], '电池页')

  assert.equal(await rt.visibleCount(h, '.glass-nav.is-overlay'), 1, '必须挂共享导航条')
  assert.equal(await rt.visibleCount(h, '.battery-modes-row .mode-select-card'), 2, '省电 / 均衡两张模式卡')
  assert.ok((await rt.visibleCount(h, '.settings-card')) >= 2, '设置分组卡应渲染')
  assert.ok(text.indexOf('省电模式') < text.indexOf('均衡模式'), '模式顺序应与真机一致')
  assert.ok(text.indexOf('电池设置') < text.indexOf('电池使用情况'), '设置项应排在用量图表之前')
  assert.equal(await rt.visibleCount(h, '.battery-hero-section'), 1, '电量头图应可见')
  assert.equal(await rt.text(h, '.percentage-num'), '91', '电量百分比应真实渲染')
  await rt.unmount(h)
})

test('存储页：容量条 / 推荐清理 / 分类数值 / 系统项都真实渲染，且几何对齐', async () => {
  const h = await rt.mount(STORAGE)
  const text = await expectTexts(h, [
    '存储', '清理', '已用 213 GB', '推荐', '老旧文件清理',
    '图片', '7.79 GB', '视频', '65.89 GB', '音频', '文档', '安装包', '应用',
    '91.41 GB', '系统数据', '18.16 GB', '系统固件', '28.43 GB', '低存储管理',
    '已用 213 GB/256 GB', '更多', '立即清理', '其它', '系统',
  ], '存储页')

  assert.equal(await rt.visibleCount(h, '.glass-nav.is-overlay'), 1, '必须挂共享导航条')
  assert.equal(await rt.count(h, '.storage-segmented-bar .seg-fill'), 5, '容量条应由 5 段组成')
  assert.equal(await rt.style(h, '.storage-segmented-bar', 'gap'), '0px', '分段条不许留缝')
  assert.equal(await rt.style(h, '.recommend-icon', 'borderTopLeftRadius'), '50%', '推荐图标必须是圆形')
  assert.equal(await rt.style(h, '.color-dot-wrap', 'marginRight'), '16px', '分类圆点右间距应与左内缩对称')
  assert.ok(text.indexOf('图片') < text.indexOf('视频'), '分类顺序应与真机一致')
  assert.equal(await rt.visibleCount(h, '.storage-hero-card'), 1, '容量头卡应可见')
  assert.equal(await rt.visibleCount(h, '.clean-pill-btn'), 1, '清理按钮应可见')
  await rt.unmount(h)
})

test('设置首页 card 6 四个条目可点，点击后真的进入对应子页', async () => {
  const routes = [
    ['辅助功能', '.settings-accessibility-page', '辅助功能'],
    ['One-Tap Button', '.onetap-page', 'One-Tap Button'],
    ['电池与省电', '.settings-battery-page', '电池与省电'],
    ['存储', '.settings-storage-page', '存储'],
  ]

  for (const [label, pageSel, title] of routes) {
    // 每次从干净的首页出发，避免上一轮的导航栈影响下一轮
    const h = await rt.mount(SETTINGS_APP)
    assert.equal(await rt.visibleCount(h, '.settings-card'), 8, `${label}：首页应有 8 组卡片`)
    assert.equal(await rt.count(h, pageSel), 0, `${label}：首页阶段不应提前挂出子页`)

    await rt.clickText(h, '.list-cell', label, 400)
    assert.equal(await rt.visibleCount(h, pageSel), 1, `点「${label}」后应渲染出对应子页`)
    assert.ok((await rt.allText(h)).includes(title), `子页应显示标题「${title}」`)
    assert.equal(await rt.visibleCount(h, '.glass-nav.is-overlay'), 1, '子页应有共享导航条')
    assert.equal(await rt.count(h, '.account-card'), 0, '首页应随路由切换卸载')

    await rt.click(h, '.gn-btn.gn-back', 400)
    assert.equal(await rt.visibleCount(h, '.settings-card'), 8, `${label}：返回后应回到首页`)
    assert.equal(await rt.count(h, '.account-card'), 1, `${label}：返回后首页账号卡应回来`)
    assert.equal(await rt.count(h, pageSel), 0, `${label}：返回后子页应卸载`)
    await rt.unmount(h)
  }
  assert.equal(rt.pageErrors.length, 0, `路由过程不应有异常：${rt.pageErrors.join('; ')}`)
})
