/**
 * 设置首页 / 搜索控件 —— 运行时行为断言
 * =======================================
 * 主壳从静态 import 改 glob 自注册后，`readFileSync(SettingsApp.vue)` + 正则会整片假红。
 * 这里改成：挂载真实首页 → 断言渲染出的卡片与文案 → 点「显示与亮度 / 声音与振动 /
 * 辅助功能」验证三页真的进得去 → 搜索 Dock / 大标题 / 标准控件读计算样式与交互结果。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRuntime } from './helpers/vueRuntime.mjs'

const SETTINGS_APP = '/src/components/apps/settings/SettingsApp.vue'
const SEARCH_BAR = '/src/components/ui/SettingsSearchBar.vue'
const SEARCH_DOCK = '/src/components/ui/SettingsSearchDock.vue'
const LIST_CELL = '/src/components/ui/ListCell.vue'
const SYSTEM_ICON = '/src/components/ui/SettingsSystemIcon.vue'
const ICON_DIR = path.resolve('src/assets/icons/settings')

const FIGMA_SETTING_ICONS = [
  'accessibility', 'ai', 'apps', 'battery', 'bluetooth', 'device', 'display', 'health',
  'location', 'multi-device', 'notifications', 'privacy', 'security', 'sim',
  'sound', 'storage', 'system', 'user', 'wallpaper', 'wifi'
]

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

test('设置首页 8 组卡片与条目真实渲染，显示 / 声音 / 无障碍三条目可点进去', async () => {
  const h = await rt.mount(SETTINGS_APP)
  const text = await rt.allText(h)

  assert.equal(await rt.visibleCount(h, '.settings-card'), 8, '首页应有 8 组标准卡片')
  for (const w of [
    'Ricky', '使用云服务、查找等', 'Infinix NOTE 60 Pro',
    '飞行模式', 'SIM 卡与网络设置', 'WLAN', '蓝牙', '多设备连接',
    'Infinix AI', '主题与个性化', '显示与亮度', '声音与振动', '通知与状态栏',
    '密码与安全', '权限与隐私', '应用管理', '位置信息',
    '卫星网络', '辅助功能', '电池与省电', '存储',
    '数字健康', '家长控制', '安全和紧急情况', '用户与账号', 'Google', '系统',
  ]) {
    assert.ok(text.includes(w), `首页渲染结果缺少「${w}」`)
  }
  assert.ok(!text.includes('数字健康与家长控制'), '旧的合并行必须不再渲染')
  assert.ok(await rt.exists(h, '.account-avatar'), '账号卡应有自定义头像')
  assert.ok(await rt.exists(h, '.sfd'), '首页应挂标准搜索 Dock')

  // GT Zone 不铺在首页卡片里，但必须是运行时可搜索、可跳转的条目
  const searchable = await rt.evaluate(({ id }) => {
    const st = window.__wbHosts.get(id).app._instance.setupState
    return JSON.parse(JSON.stringify(st.allSearchableItems)).map((x) => x.title)
  }, { id: h })
  assert.ok(searchable.includes('GT Zone'), 'GT Zone 应注册在运行时可搜索条目里')

  // WLAN 行的已连接网络名必须是真实渲染出来的值，而不是某个写死的字符串
  const wlan = await rt.evaluate(({ id }) => {
    const host = window.__wbHosts.get(id).host
    const row = [...host.querySelectorAll('.list-cell')].find((e) => e.textContent.includes('WLAN'))
    return row ? row.querySelector('.lc-value')?.textContent.trim() : null
  }, { id: h })
  assert.ok(wlan && wlan.length > 0, 'WLAN 行应显示当前连接的网络名')

  for (const [label, sel] of [
    ['显示与亮度', '.settings-display-page'],
    ['声音与振动', '.settings-sound-page'],
    ['辅助功能', '.settings-accessibility-page'],
  ]) {
    await rt.clickText(h, '.list-cell', label, 400)
    // 8 个测试文件并发时 Vite 首次编译子页可能要几十秒，固定 sleep 会假红
    await rt.page.waitForFunction(({ hostId, sel }) => {
      const host = window.__wbHosts.get(hostId)?.host
      const el = host?.querySelector(sel)
      if (!el) return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }, { hostId: h, sel }, { timeout: 20000 })
    assert.equal(await rt.visibleCount(h, sel), 1, `点「${label}」应进入对应二级页`)
    assert.equal(await rt.count(h, '.account-card'), 0, '首页应随路由卸载')
    await rt.click(h, '.gn-btn.gn-back', 400)
    assert.equal(await rt.visibleCount(h, '.settings-card'), 8, `${label}：返回后应回到首页`)
  }
  assert.equal(rt.pageErrors.length, 0, `交互过程不应有异常：${rt.pageErrors.join('; ')}`)
  await rt.unmount(h)
})

test('大标题随滚动折叠、搜索 Dock 可激活、卡片样式来自统一样式', async () => {
  const h = await rt.mount(SETTINGS_APP)

  assert.equal(await rt.text(h, '[data-large-title-text]'), '设置', '首页大标题文本应为「设置」')
  assert.equal(await rt.count(h, '.large-title'), 1, '只允许一个标题节点（不许双节点交叉淡入）')
  assert.equal(await rt.count(h, '.settings-compact-header'), 0, '不许回到旧的紧凑标题')
  const size0 = await rt.style(h, '[data-large-title-text]', 'fontSize')
  assert.equal(size0, '36px', '起手态标题字号 36px')

  // 真实滚动：监听的是 @scroll.passive，直接改 scrollTop 再派发事件
  await rt.evaluate(({ id }) => {
    const el = window.__wbHosts.get(id).host.querySelector('.settings-scroll-container')
    Object.defineProperty(el, 'scrollTop', { value: 72, configurable: true })
    el.dispatchEvent(new Event('scroll', { bubbles: true }))
  }, { id: h })
  await rt.settle(h, 80)
  assert.equal(await rt.style(h, '[data-large-title-text]', 'fontSize'), '22px', '折叠到底后字号应为 22px')

  assert.equal(await rt.style(h, '.settings-card', 'borderTopLeftRadius'), '16px', '卡片圆角 16px')
  assert.equal(await rt.style(h, '.settings-card', 'backgroundColor'), 'rgb(255, 255, 255)', '卡片纯白')
  assert.equal(await rt.style(h, '.settings-app', 'backgroundColor'), 'rgb(240, 241, 242)', '页面底色 #F0F1F2')

  // 点 Dock 的闲置胶囊 → 应真的切进搜索视图
  assert.equal(await rt.count(h, '.sfd-idle'), 1, '首页 Dock 处于闲置态')
  await rt.click(h, '.sfd-idle', 400)
  await rt.page.waitForFunction(({ hostId }) => {
    const host = window.__wbHosts.get(hostId)?.host
    return !!host && host.querySelectorAll('.settings-card').length === 0
  }, { hostId: h }, { timeout: 20000 })
  assert.equal(await rt.count(h, '.settings-card'), 0, '进入搜索页后首页卡片应卸载')
  assert.ok(await rt.exists(h, 'input'), '搜索页应渲染出输入框')
  await rt.unmount(h)
})

test('SettingsSearchBar：图标 / 毛玻璃 / 44 高 / 清除按钮都在渲染结果里', async () => {
  const h = await rt.mount(SEARCH_BAR)
  assert.equal(await rt.visibleCount(h, '.search-icon'), 1, '应渲染放大镜')
  assert.equal(await rt.visibleCount(h, '.mic-icon'), 1, '应渲染麦克风')
  const micSrc = await rt.attr(h, '.mic-icon', 'src')
  // Vite 把小于阈值的 SVG 内联成 data URL —— 判据看「浏览器是否真拿到一张 SVG」
  assert.ok(
    micSrc && (micSrc.startsWith('data:image/svg+xml') || micSrc.includes('.svg')),
    '麦克风应解析成真实 SVG 资源',
  )

  const bar = await rt.styleMap(h, '.settings-search-bar', [
    'height', 'borderTopLeftRadius', 'backgroundColor', 'backdropFilter',
  ])
  assert.equal(bar.height, '44px', '搜索框高 44px（真机实测）')
  assert.equal(bar.borderTopLeftRadius, '22px', '圆角应为高的一半')
  assert.ok(bar.backgroundColor.startsWith('rgba(255, 255, 255'), '半透明白底')
  assert.ok(bar.backdropFilter.includes('blur('), '必须模糊背后的内容')

  const asset = path.join(ICON_DIR, 'microphone.svg')
  assert.ok(fs.existsSync(asset), '导出的麦克风 SVG 应存在')
  assert.ok(fs.readFileSync(asset, 'utf-8').trimStart().startsWith('<svg'), '应是真实 SVG 资源')

  const typed = await rt.mount(SEARCH_BAR, { modelValue: '显示' })
  assert.equal(await rt.visibleCount(typed, '.search-clear-btn'), 1, '输入文字后应出现标准深灰清除按钮')
  assert.equal(await rt.count(typed, '.mic-icon'), 0, '输入态麦克风应让位给清除按钮')
  await rt.unmount(h)
  await rt.unmount(typed)
})

test('ListCell 行高与图标块几何：36 / 36 / 10.5 圆角 + 52 单行', async () => {
  const cell = await rt.mount(LIST_CELL, { title: '显示与亮度' })
  assert.equal(await rt.style(cell, '.list-cell', 'minHeight'), '52px', '单行高度 52px')
  await rt.unmount(cell)

  // 图标块只在带 #icon 槽的真实行里出现，从设置首页读
  const app = await rt.mount(SETTINGS_APP)
  const icon = await rt.styleMap(app, '.squircle-icon', [
    'width', 'height', 'borderTopLeftRadius',
  ])
  assert.equal(icon.width, '36px', '图标块宽 36px')
  assert.equal(icon.height, '36px', '图标块高 36px')
  // 真机渲染值 10.5px；旧断言匹配的是另外一处 10px 声明，量不到真正生效的那条
  assert.equal(icon.borderTopLeftRadius, '10.5px', '图标块 squircle 圆角 10.5px')
  assert.ok((await rt.visibleCount(app, '.squircle-icon')) >= 20, '首页应铺满标准图标块')
  const divider = await rt.style(app, '.lc-main:not(.no-sep)', 'borderBottomColor')
  assert.equal(divider, 'rgb(240, 241, 243)', '分隔线色应为真机实测的 #F0F1F3')
  await rt.unmount(app)
})

test('20 个 Figma 系统图标都能在运行时解析成真实图片，并用在设置首页', async () => {
  const resolved = []
  for (const name of FIGMA_SETTING_ICONS) {
    const asset = path.join(ICON_DIR, `${name}.svg`)
    assert.ok(fs.existsSync(asset), `缺少导出的 Figma 图标：${name}.svg`)
    assert.ok(fs.readFileSync(asset, 'utf-8').trimStart().startsWith('<svg'), `${name}.svg 应是真实 SVG`)

    const id = await rt.mount(SYSTEM_ICON, { name })
    const src = await rt.attr(id, '.settings-system-icon', 'src')
    assert.ok(src && src.length > 0, `${name} 应渲染出图片资源`)
    assert.ok(
      src.startsWith('data:image/svg+xml') || src.includes('.svg'),
      `${name} 应解析成 SVG 资源（实际 ${src.slice(0, 60)}）`,
    )
    resolved.push(src)
    assert.equal(await rt.visibleCount(id, '.settings-system-icon'), 1, `${name} 图标应可见`)
    await rt.unmount(id)
  }
  assert.equal(new Set(resolved).size, FIGMA_SETTING_ICONS.length, '20 个名字必须解析成 20 张不同的图')

  const app = await rt.mount(SETTINGS_APP)
  const used = await rt.count(app, '.settings-system-icon')
  assert.ok(used >= 12, `首页实际用到的系统图标偏少：${used}`)
  await rt.unmount(app)
})

test('搜索 Dock 两个状态同规格：44 高 / 22 圆角 / 左右 16 / 离底 25 / 间距 12', async () => {
  const idle = await rt.mount(SEARCH_DOCK, { active: false })
  assert.ok(await rt.exists(idle, '.sfd-idle'), '闲置态胶囊应存在')
  assert.equal(await rt.visibleCount(idle, '.sfd-idle'), 1, '闲置胶囊应真实可见')
  assert.equal(await rt.count(idle, '.sfd-back'), 0, '闲置态不应有返回圆钮')
  assert.equal(await rt.visibleCount(idle, '.mic-icon'), 1, '闲置态右侧是麦克风')
  await rt.unmount(idle)

  const active = await rt.mount(SEARCH_DOCK, { active: true, modelValue: '显示' })
  assert.equal(await rt.count(active, '.sfd.is-active'), 1, '应进入激活态')
  assert.equal(await rt.visibleCount(active, '.sfd-input'), 1, '激活态输入框应可见')
  assert.equal(await rt.count(active, '.sfd-idle'), 0, '激活态闲置胶囊应卸载')
  assert.equal(await rt.visibleCount(active, '.search-clear-btn'), 1, '输入后应出现清除按钮')
  assert.equal(await rt.count(active, '.mic-icon'), 0, '激活态麦克风应消失')

  const back = await rt.styleMap(active, '.sfd-back', ['width', 'height', 'borderTopLeftRadius'])
  assert.equal(back.width, '44px', '返回圆钮宽 44px')
  assert.equal(back.height, '44px', '返回圆钮高 44px')
  assert.equal(back.borderTopLeftRadius, '50%', '返回圆钮应为正圆')

  const cap = await rt.styleMap(active, '.sfd-capsule', ['height', 'borderTopLeftRadius'])
  assert.equal(cap.height, '44px', '输入胶囊高 44px')
  assert.equal(cap.borderTopLeftRadius, '22px', '输入胶囊圆角 22px')

  // getComputedStyle 会把 4 值简写归一化（左右相同省掉第 4 项），逐方向读才量得准
  const bar = await rt.styleMap(active, '.sfd.is-active', [
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap',
  ])
  assert.equal(bar.paddingTop, '12px', '激活态上内边距 12px')
  assert.equal(bar.paddingRight, '16px', '激活态右内边距 16px')
  assert.equal(bar.paddingBottom, '25px', '激活态离屏底 25px')
  assert.equal(bar.paddingLeft, '16px', '激活态左内边距 16px')
  assert.equal(bar.gap, '12px', '返回钮与胶囊间距 12px')
  await rt.unmount(active)
})
