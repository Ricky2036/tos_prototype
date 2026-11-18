/**
 * recipe · settings/system —— 把「设置 → 系统」页开到可判决状态
 * =============================================================
 * recipe 契约：export async function navigate(page, ctx)
 *   ctx = { url, shell }
 * 成功返回即代表页面已就绪；抛错 = 环境错误（accept 退出码 2）。
 *
 * 进页面步骤（已在本机实测可用，见任务书）：
 *   1. goto → 等 800ms（壳初始化）
 *   2. window.__system.unlock() → 400ms（解锁锁屏）
 *   3. window.__system.openApp('settings') → 900ms
 *   4. 在 .settings-scroll-container .list-cell 里找「系统」的最后一个
 *      → scrollIntoViewIfNeeded + click → 700ms
 *   5. 断言 .settings-system-page 存在（10 行 data-system-row）
 *
 * 返回 { scope: '.settings-system-page' }：定位/截图只在这个页面作用域里做，
 * 避免下层 settings 首页残留文本（如「系统」列表单元格）干扰文本唯一性判定。
 */
export async function navigate(page, ctx) {
  const url = ctx.url

  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  await page.evaluate(() => {
    if (!window.__system) throw new Error('window.__system 不存在：页面没有启动')
    window.__system.unlock()
  })
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system.openApp('settings'))
  await page.waitForTimeout(900)

  const cell = page.locator('.settings-scroll-container .list-cell', { hasText: '系统' }).last()
  await cell.waitFor({ state: 'visible', timeout: 8000 })
  await cell.scrollIntoViewIfNeeded()
  await cell.click()
  await page.waitForTimeout(700)

  await page.waitForSelector('.settings-system-page', { state: 'visible', timeout: 8000 })

  const rows = await page.locator('.settings-system-page .list-cell[data-system-row]').count()
  if (rows !== 10) {
    throw new Error(`系统页行数断言失败：期望 10 行 .list-cell[data-system-row]，实测 ${rows}`)
  }

  return { scope: '.settings-system-page' }
}