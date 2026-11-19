/**
 * recipe · by-text-path —— 通用「按路径点进目标页」配方（全页面基线用）
 * =====================================================================
 * 契约：export async function navigate(page, ctx) → { scope }
 *   ctx = { url, shell, outDir, spec }；抛错 = 环境错误（accept 退出码 2）。
 *
 * 与 recipes/settings-system.mjs 的区别：**不写死任何页面**。点击路径由环境变量给：
 *   OPEN_PATH  JSON 数组，逐步点击。每步二选一：
 *                { "text": "系统" }                       按可见文本（整串精确匹配）点
 *                { "sel": "[data-system-row=\"dateTime\"]" } 按选择器点
 *              可选字段：
 *                expect      点完后必须变为 visible 的选择器（等懒加载页面挂载）
 *                settle      点完后额外等待毫秒（默认 650）
 *                timeout     本步显隐等待毫秒（默认 10000）
 *                nth         选择器多命中时取第几项（默认 0）
 *   SCOPE      JSON 字符串或裸选择器。缺省 = 不限定（accept 退回 --shell .screen-view）。
 *              结束时会等它 visible，确认子页真的挂上了。
 *
 * 例：
 *   OPEN_PATH='[{"text":"系统"},{"sel":"[data-system-row=\"dateTime\"]"}]' \
 *   SCOPE='.settings-datetime-page' \
 *   node tools/accept/accept.mjs --spec spec/settings/dateTime.geometry.json ...
 *
 * 失败语义（重要，基线要诚实）：
 *   - 每一步都先等 visible（含滚动），点不动/找不到/被遮挡/行是 disabled → 抛错，
 *     错误信息带「第几步 / 步骤内容 / 卡在哪」，accept 会记 env-error 而不是 fail 判决。
 *   - 不吞异常、不放宽任何等待、不做「找不到就整页兜底」。
 */

const CLICKABLE = '.list-cell, button, a, [role="button"], [role="switch"], .toggle-switch'

function parseOpenPath() {
  const raw = process.env.OPEN_PATH
  if (raw == null || raw.trim() === '') return []
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`OPEN_PATH 不是合法 JSON：${err.message}`)
  }
  if (!Array.isArray(parsed)) throw new Error(`OPEN_PATH 必须是 JSON 数组，收到 ${typeof parsed}`)
  return parsed.map((step, i) => {
    if (!step || typeof step !== 'object') throw new Error(`OPEN_PATH[${i}] 必须是对象`)
    const hasText = typeof step.text === 'string' && step.text !== ''
    const hasSel = typeof step.sel === 'string' && step.sel !== ''
    if (hasText === hasSel) throw new Error(`OPEN_PATH[${i}] 必须且只能有 text / sel 之一`)
    return {
      index: i,
      text: hasText ? step.text : null,
      sel: hasSel ? step.sel : null,
      expect: typeof step.expect === 'string' && step.expect !== '' ? step.expect : null,
      nth: Number.isInteger(step.nth) ? step.nth : 0,
      settle: Number.isFinite(step.settle) ? step.settle : Number(process.env.OPEN_SETTLE_MS || 650),
      timeout: Number.isFinite(step.timeout) ? step.timeout : Number(process.env.OPEN_STEP_TIMEOUT || 10000),
    }
  })
}

/** 在 rootSel 内按「整串文本精确相等」找最深节点，再上溯到可点击行；返回已打标记的元素 */
async function markByText(page, rootSel, text) {
  const marker = `data-accept-path-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const info = await page.evaluate(
    ({ rootSel, text, marker, clickableSel }) => {
      const root = document.querySelector(rootSel)
      if (!root) return { error: `找不到文本搜索根容器 ${rootSel}` }
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
      const hits = []
      for (const el of root.querySelectorAll('*')) {
        if (norm(el.textContent) === text) hits.push(el)
      }
      if (!hits.length) {
        return {
          error: `在 ${rootSel} 内找不到文本 === ${JSON.stringify(text)} 的可见元素（整串精确匹配；若该行有副标题，请改用 sel）`,
        }
      }
      // 取最深命中（不含其它命中的那个），再上溯到可点击行
      let target = null
      for (const el of hits) {
        if (!hits.some((other) => other !== el && el.contains(other))) target = el
      }
      let click = target
      while (click && click !== root && !click.matches(clickableSel)) click = click.parentElement
      if (!click || click === root) click = target
      if (click.classList && click.classList.contains('is-disabled')) {
        return { error: `文本 ${JSON.stringify(text)} 所在行是 disabled（class 含 is-disabled），点不进去` }
      }
      click.setAttribute(marker, '1')
      const r = click.getBoundingClientRect()
      return {
        ok: true,
        cls: typeof click.className === 'string' ? click.className : '',
        tag: click.tagName,
        rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v)),
        hitCount: hits.length,
      }
    },
    { rootSel, text, marker, clickableSel: CLICKABLE }
  )
  return { marker, info }
}

async function clickByText(page, step, url) {
  const rootSel = '.screen-view'
  const { marker, info } = await markByText(page, rootSel, step.text)
  if (info.error) throw new Error(info.error)
  const loc = page.locator(`[${marker}="1"]`).first()
  try {
    await loc.waitFor({ state: 'visible', timeout: step.timeout })
    await loc.scrollIntoViewIfNeeded({ timeout: step.timeout })
    await loc.click({ timeout: step.timeout })
  } catch (err) {
    throw new Error(
      `文本 ${JSON.stringify(step.text)} 命中元素（${info.tag}.${info.cls}，rect=${info.rect.join(',')}）但点不动：${err.message.split('\n')[0]}`
    )
  } finally {
    await page.evaluate((m) => document.querySelector(`[${m}="1"]`)?.removeAttribute(m), marker).catch(() => {})
  }
}

async function clickBySel(page, step) {
  const loc = page.locator(step.sel).nth(step.nth)
  try {
    await loc.waitFor({ state: 'visible', timeout: step.timeout })
  } catch (err) {
    throw new Error(`选择器 ${JSON.stringify(step.sel)} 在 ${step.timeout}ms 内没有可见元素（第 ${step.nth} 项）`)
  }
  const cls = (await loc.getAttribute('class')) || ''
  if (cls.includes('is-disabled')) {
    throw new Error(`选择器 ${JSON.stringify(step.sel)} 命中的行是 disabled（class=${cls}），前置开关没打开或该入口当前不可用`)
  }
  try {
    await loc.scrollIntoViewIfNeeded({ timeout: step.timeout })
    await loc.click({ timeout: step.timeout })
  } catch (err) {
    throw new Error(
      `选择器 ${JSON.stringify(step.sel)} 可见但点不动（可能被上层 card/overlay 拦截）：${err.message.split('\n')[0]}`
    )
  }
}

export async function navigate(page, ctx) {
  const url = ctx.url
  const steps = parseOpenPath()
  const scope = process.env.SCOPE && process.env.SCOPE.trim() !== '' ? process.env.SCOPE.trim() : null

  // 1) 壳启动 + 解锁 + 打开设置
  try {
    await page.goto(url, { waitUntil: 'load' })
  } catch (err) {
    throw new Error(`打开 ${url} 失败：${err.message.split('\n')[0]}`)
  }
  await page.waitForTimeout(800)
  try {
    await page.evaluate(() => {
      if (!window.__system) throw new Error('window.__system 不存在：页面壳没有启动')
      window.__system.unlock()
    })
  } catch (err) {
    throw new Error(`解锁锁屏失败：${err.message.split('\n')[0]}`)
  }
  await page.waitForTimeout(400)
  try {
    await page.evaluate(() => window.__system.openApp('settings'))
  } catch (err) {
    throw new Error(`openApp('settings') 失败：${err.message.split('\n')[0]}`)
  }
  // 设置首页列表是懒渲染的，等首页容器挂上再开始点
  try {
    await page.waitForSelector('.settings-app .settings-page', { state: 'visible', timeout: 12000 })
  } catch {
    throw new Error('设置首页没有挂载（.settings-app .settings-page 不可见）：openApp 之后 12s 仍未就绪')
  }
  await page.waitForTimeout(500)

  // 2) 逐步点击
  for (const step of steps) {
    const what = step.text != null ? `text=${JSON.stringify(step.text)}` : `sel=${JSON.stringify(step.sel)}`
    try {
      if (step.sel != null) await clickBySel(page, step)
      else await clickByText(page, step, url)
      if (step.expect) {
        try {
          await page.waitForSelector(step.expect, { state: 'visible', timeout: step.timeout })
        } catch {
          throw new Error(`点击后等不到 expect=${JSON.stringify(step.expect)} 变为可见（页面没打开或不是预期页）`)
        }
      }
      await page.waitForTimeout(step.settle)
    } catch (err) {
      throw new Error(`OPEN_PATH 第 ${step.index + 1}/${steps.length} 步 ${what} 失败：${err.message}`)
    }
  }

  // 3) 目标 scope 就绪校验（懒加载子页可能晚于点击）
  if (scope) {
    try {
      await page.waitForSelector(scope, { state: 'visible', timeout: Number(process.env.OPEN_SCOPE_TIMEOUT || 12000) })
    } catch {
      throw new Error(`路径点完了，但目标 scope=${JSON.stringify(scope)} 在 12s 内仍不可见：页面可能没进到契约声明的那个页`)
    }
  }

  // 4) 等字体稳定（与 accept 的等待一致，避免文本盒量到 fallback 字体）
  await page.evaluate(() => (document.fonts && document.fonts.ready ? document.fonts.ready : true)).catch(() => {})

  return { scope: scope || null }
}