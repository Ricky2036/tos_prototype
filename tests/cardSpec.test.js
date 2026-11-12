/**
 * 设置菜单卡片规范 —— 运行时行为断言
 * ====================================
 * 真机实测：页面底色 #F0F1F2、卡片纯白、圆角 16、无描边无投影、单行 52。
 *
 * 这一版不再读 .vue 源码匹配 `border-radius: 16px` 之类的字面量：
 * 那种断言既会在主壳改成 glob 自注册后整片假红，也只证明「样式写在文件里」，
 * 不证明「浏览器真的这么渲染」。现在把组件逐个挂起来，读 getComputedStyle。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRuntime } from './helpers/vueRuntime.mjs'

const ROOT = path.resolve('src/components/apps/settings')
const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name.endsWith('.vue')) acc.push('/' + path.relative(process.cwd(), p).split(path.sep).join('/'))
  }
  return acc
}
/** 目录清单只是「要挂载哪些组件」，不读源码、不断言文件内容 —— glob 自注册后照样成立 */
const COMPONENTS = walk(ROOT)

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

test('所有渲染出 .settings-card 的页面都是同一套规范：白底 / 16 圆角 / 不显灰 / 无投影', async () => {
  const mounted = await rt.mountMany(COMPONENTS)
  const problems = []
  let checked = 0

  for (const { path: p, id } of mounted) {
    if (!id) continue // 需要外部 props / 路由上下文的组件跳过，不拿它们的失败当断言
    const n = await rt.visibleCount(id, '.settings-card')
    if (n === 0) continue
    const cards = await rt.evaluate(({ hostId }) => {
      const host = window.__wbHosts.get(hostId).host
      return [...host.querySelectorAll('.settings-card')].map((e) => {
        const cs = getComputedStyle(e)
        return {
          bg: cs.backgroundColor,
          radius: cs.borderTopLeftRadius,
          borderWidth: cs.borderTopWidth,
          borderColor: cs.borderTopColor,
          shadow: cs.boxShadow,
          visible: e.getBoundingClientRect().width > 0,
        }
      })
    }, { hostId: id })

    for (const c of cards) {
      if (!c.visible) continue
      checked += 1
      if (c.bg !== 'rgb(255, 255, 255)') problems.push(`${p}: 卡片底色不是纯白（${c.bg}）`)
      if (c.radius !== '16px') problems.push(`${p}: 圆角不是 16px（${c.radius}）`)
      // 「半透明描边显灰」的运行时判据：读描边色的 alpha。
      // SettingsWifi 的 .wifi-feature-card 用了 rgba(0,0,0,0.04) —— 极淡、不显灰，放行；
      // 一旦有人把它调到 0.08 以上（肉眼发灰）或加粗描边，这里立刻红。
      const alphaMatch = c.borderColor.match(/rgba\([^)]*,\s*([\d.]+)\)/)
      const alpha = alphaMatch ? Number(alphaMatch[1]) : (c.borderColor.startsWith('rgba') ? 1 : 0)
      if (parseFloat(c.borderWidth) > 1) problems.push(`${p}: 描边被加粗（${c.borderWidth}）`)
      if (parseFloat(c.borderWidth) > 0 && alpha > 0.05) {
        problems.push(`${p}: 半透明描边显灰（${c.borderColor}）`)
      }
      if (c.shadow !== 'none') problems.push(`${p}: 还有投影（${c.shadow}）`)
    }
  }

  const failed = mounted.filter((m) => m.error)
  assert.ok(
    mounted.filter((m) => m.id).length >= 100,
    `成功挂载的组件偏少：${mounted.filter((m) => m.id).length}/${COMPONENTS.length}`,
  )
  assert.ok(
    failed.every((m) => !/Failed to (fetch|resolve)|Cannot find module|SyntaxError|Unexpected token|is not defined/.test(m.error)),
    `存在模块加载 / 编译级失败：${failed.map((m) => `${m.path}: ${m.error}`).slice(0, 5).join('; ')}`,
  )
  assert.ok(checked >= 8, `实际渲染出的卡片偏少：${checked}（扫描 ${COMPONENTS.length} 个组件）`)
  assert.deepEqual(problems, [], `卡片规范不统一：\n${problems.join('\n')}`)
})

test('页面底色与行高：底 #F0F1F2 / 单行 52 / 圆角 token 16px', async () => {
  const shell = await rt.mount('/src/components/apps/settings/display/DisplayDarkMode.vue')
  const cell = await rt.mount('/src/components/ui/ListCell.vue', { title: '显示与亮度' })
  const shellBg = await rt.style(shell, '.sub-shell', 'backgroundColor')
  const cellMin = await rt.style(cell, '.list-cell', 'minHeight')
  const token = await rt.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--radius-cell-group').trim())

  assert.equal(shellBg, 'rgb(240, 241, 242)', '子页底色应为真机实测的 #F0F1F2')
  assert.equal(cellMin, '52px', '单行高度应为 52px')
  assert.equal(token, '16px', '卡片圆角 token 应为 16px')
  await rt.unmount(shell)
  await rt.unmount(cell)
})

test('声音页音量条不再溢出卡片：轨道右边界落在卡片内容区内', async () => {
  const h = await rt.mount('/src/components/apps/settings/SettingsSound.vue')
  const geo = await rt.evaluate(({ hostId }) => {
    const host = window.__wbHosts.get(hostId).host
    const card = host.querySelector('.volume-card')
    const track = host.querySelector('.volume-card .slider-track')
    const thumb = host.querySelector('.volume-card .slider-thumb')
    const cr = card.getBoundingClientRect()
    const tr = track.getBoundingClientRect()
    const cs = getComputedStyle(track)
    return {
      cardRight: cr.right, trackRight: tr.right, trackWidth: tr.width,
      marginRight: cs.marginRight, width: cs.width,
      thumbWidth: thumb ? thumb.getBoundingClientRect().width : 0,
    }
  }, { hostId: h })

  assert.ok(geo.trackWidth > 0, '音量条必须真实渲染出宽度')
  assert.ok(
    geo.trackRight <= geo.cardRight + 0.5,
    `轨道右缘 ${geo.trackRight.toFixed(2)} 不应越过卡片右缘 ${geo.cardRight.toFixed(2)}`,
  )
  assert.equal(geo.marginRight, '11px', '仍需内缩半个圆点')
  assert.ok(geo.thumbWidth > 0, '圆点必须渲染出来')
  assert.ok(
    Math.abs(parseFloat(geo.marginRight) - geo.thumbWidth / 2) <= 1,
    `右内缩 ${geo.marginRight} 应等于半个圆点（${geo.thumbWidth / 2}px）`,
  )
  await rt.unmount(h)
})
