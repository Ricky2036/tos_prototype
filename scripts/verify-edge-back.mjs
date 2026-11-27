import assert from 'node:assert/strict'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const port = process.argv[2] || '8888'
const output = process.env.ARTIFACT_DIR
const chrome = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : undefined })

async function openSettings(options) {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  await page.goto(`http://127.0.0.1:${port}/`)
  await page.waitForFunction(() => window.__system)
  await page.evaluate(() => {
    window.__system.unlock()
    window.__system.openApp('settings')
  })
  const screen = page.locator('.screen-view')
  const row = page.locator('.settings-scroll-container .list-cell').filter({ hasText: '显示与亮度' }).first()
  const detail = page.locator('.settings-display-page')
  const bubble = page.getByTestId('edge-back-bubble')
  async function enterDetail() {
    await row.click()
    await detail.waitFor({ state: 'visible' })
  }
  await enterDetail()
  return { context, page, screen, row, detail, bubble, enterDetail }
}

async function edgePoint(screen, side) {
  const box = await screen.boundingBox()
  const width = await screen.evaluate(el => el.offsetWidth)
  const direction = side === 'left' ? 1 : -1
  const scale = box.width / width
  return {
    x: side === 'left' ? box.x + 6 * scale : box.x + box.width - 6 * scale,
    y: box.y + box.height * 0.51,
    dx: distance => direction * distance * scale
  }
}

async function screenshot(screen, name) {
  if (!output) return
  mkdirSync(output, { recursive: true })
  await screen.screenshot({ path: join(output, `${name}.png`) })
}

async function verifyDesktop() {
  const { context, page, screen, row, detail, bubble, enterDetail } = await openSettings({
    viewport: { width: 1080, height: 740 }
  })
  const left = await edgePoint(screen, 'left')
  const right = await edgePoint(screen, 'right')
  const mouse = page.mouse
  const pull = async (edge, distance, y = edge.y) => {
    await mouse.move(edge.x + edge.dx(distance), y, { steps: 6 })
  }
  const start = async edge => {
    await mouse.move(edge.x, edge.y)
    await mouse.down()
  }
  const checkBubble = async (side, distanceArmed) => {
    await bubble.waitFor({ state: 'visible' })
    assert.equal(await bubble.getAttribute('data-side'), side)
    const geometry = await bubble.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const screenRect = element.closest('.screen-view').getBoundingClientRect()
      const fill = getComputedStyle(element, '::before')
      const arrow = getComputedStyle(element.querySelector('.edge-back-chevron'))
      return {
        gap: element.dataset.side === 'left' ? rect.left - screenRect.left : screenRect.right - rect.right,
        scale: new DOMMatrixReadOnly(fill.transform).a,
        height: parseFloat(fill.height),
        color: fill.backgroundColor,
        arrowScale: new DOMMatrixReadOnly(arrow.transform).a,
        armed: element.classList.contains('is-armed')
      }
    })
    assert.ok(Math.abs(geometry.gap) < 1, 'the bubble hugs its originating edge')
    assert.ok(geometry.scale > 0 && geometry.scale <= 1, 'the bubble has bounded drag resistance')
    assert.ok(Math.abs(geometry.height - 128.32) < .05, 'the bubble uses the measured reference height')
    assert.equal(geometry.color, 'rgb(51, 51, 51)')
    assert.equal(geometry.arrowScale, side === 'left' ? 1 : -1, 'the native back arrow points left on both edges')
    assert.equal(geometry.armed, distanceArmed)
    assert.equal(await page.evaluate(() => window.__system.homeGestureProgress), 0)
    return geometry.scale
  }

  await screenshot(screen, 'desktop-detail-baseline')
  await start(left)
  await pull(left, 18)
  const pendingStretch = await checkBubble('left', false)
  await screenshot(screen, 'left-pending')
  // Waiting past the velocity window makes this a distance-only release.
  await page.waitForTimeout(120)
  await mouse.up()
  await bubble.waitFor({ state: 'detached' })
  assert.ok(await detail.isVisible(), 'short pull cancels')

  await start(right)
  await pull(right, 78, right.y + 24)
  assert.ok(await checkBubble('right', true) < pendingStretch, 'the held outline narrows at the return threshold')
  await screenshot(screen, 'right-armed')
  await pull(right, 17)
  await checkBubble('right', false)
  await mouse.up()
  await bubble.waitFor({ state: 'detached' })
  assert.ok(await detail.isVisible(), 'reversing an armed pull cancels')

  await start(right)
  await pull(right, 35)
  await checkBubble('right', true)
  await mouse.up()
  await detail.waitFor({ state: 'hidden' })
  await row.waitFor({ state: 'visible' })
  assert.equal(await page.evaluate(() => window.__system.activeAppId), 'settings')
  await bubble.waitFor({ state: 'detached' })
  await screenshot(screen, 'after-back')

  await enterDetail()
  await start(left)
  await pull(left, 77)
  await checkBubble('left', true)
  await screenshot(screen, 'left-armed')
  await mouse.up()
  await detail.waitFor({ state: 'hidden' })
  await row.waitFor({ state: 'visible' })
  await start(left)
  await pull(left, 81)
  await mouse.up()
  await page.waitForFunction(() => window.__system.baseLayer === 'home' && !window.__system.activeAppId)

  await page.evaluate(() => window.__system.openApp('settings'))
  await enterDetail()
  await start(right)
  await pull(right, 82)
  await checkBubble('right', true)
  await page.evaluate(() => window.__system.setNavigationMode('threeButton'))
  await bubble.waitFor({ state: 'detached' })
  await mouse.up()
  await start(left)
  await pull(left, 80)
  await mouse.up()
  assert.ok(await detail.isVisible(), 'three-button mode disables the edge gesture')
  assert.equal(await bubble.count(), 0)
  await page.locator('.three-button-nav button[title="返回"]').click()
  await detail.waitFor({ state: 'hidden' })
  await page.evaluate(() => window.__system.setNavigationMode('gesture'))
  await page.locator('.edge-nc').click({ position: { x: 65, y: 20 } })
  await page.waitForFunction(() => window.__system.overlays.notificationCenter.status === 'open')
  await start(right)
  await pull(right, 80)
  assert.equal(await bubble.count(), 0, 'system overlay keeps its own back feedback')
  await mouse.up()
  await page.waitForFunction(() => window.__system.overlays.notificationCenter.status === 'closed')
  assert.equal(await page.evaluate(() => window.__system.activeAppId), 'settings')

  await start({ x: left.x + left.dx(60), y: left.y })
  await pull(left, 155)
  await mouse.up()
  assert.equal(await bubble.count(), 0, 'a swipe that starts in content cannot become an edge gesture')
  assert.equal(await page.evaluate(() => window.__system.baseLayer), 'app')

  await page.evaluate(() => window.__system.lock())
  await start(left)
  await pull(left, 80)
  await mouse.up()
  assert.equal(await bubble.count(), 0)
  assert.equal(await page.evaluate(() => window.__system.baseLayer), 'lock')
  await context.close()
  console.log('PASS desktop: symmetric feedback, short/reversed cancel, back stack, home, mode, overlays, and lock')
}

async function verifyTouch() {
  const { context, page, screen, row, detail, bubble } = await openSettings({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce', deviceScaleFactor: 2
  })
  const client = await context.newCDPSession(page)
  const send = (type, touchPoints = []) => client.send('Input.dispatchTouchEvent', { type, touchPoints })
  const left = await edgePoint(screen, 'left')
  const right = await edgePoint(screen, 'right')
  const start = edge => send('touchStart', [{ x: edge.x, y: edge.y }])
  const pull = async (edge, distance) => {
    for (const fraction of [0.2, 0.4, 0.6, 0.8, 1]) {
      await send('touchMove', [{ x: edge.x + edge.dx(distance * fraction), y: edge.y }])
    }
  }

  await screenshot(screen, 'touch-detail-baseline')
  await start(left)
  await pull(left, 18)
  await bubble.waitFor({ state: 'visible' })
  assert.equal(await bubble.evaluate(el => el.classList.contains('is-armed')), false)
  await screenshot(screen, 'touch-left-cancel-ready')
  await pull(left, 35)
  assert.equal(await bubble.evaluate(el => el.classList.contains('is-armed')), true)
  await screenshot(screen, 'touch-left-short')
  await pull(left, 77)
  await bubble.waitFor({ state: 'visible' })
  assert.equal(await bubble.getAttribute('data-side'), 'left')
  await screenshot(screen, 'touch-left-armed')
  await send('touchCancel')
  await bubble.waitFor({ state: 'detached' })
  assert.ok(await detail.isVisible(), 'OS cancel never commits an armed gesture')

  await start(right)
  await pull(right, 166)
  await bubble.waitFor({ state: 'visible' })
  assert.equal(await bubble.getAttribute('data-side'), 'right')
  await screenshot(screen, 'touch-right-armed')
  await send('touchEnd')
  await detail.waitFor({ state: 'hidden' })
  await row.waitFor({ state: 'visible' })
  await bubble.waitFor({ state: 'detached' })

  const scroll = page.locator('.settings-scroll-container').first()
  await scroll.evaluate(el => { el.scrollTop = 0 })
  await start(left)
  for (const delta of [20, 46, 75, 110, 148, 180]) {
    await send('touchMove', [{ x: left.x, y: left.y - delta }])
  }
  await send('touchEnd')
  await page.waitForFunction(() => document.querySelector('.settings-scroll-container').scrollTop > 0)
  assert.equal(await bubble.count(), 0, 'vertical edge scroll remains native')
  await context.close()
  console.log('PASS touch: both edges, armed pointer cancellation, reduced motion, and vertical scroll')
}

try {
  await verifyDesktop()
  await verifyTouch()
} finally {
  await browser.close()
}
