import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const ARTIFACTS_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/06385522-e5db-4865-9631-53c325d2b43f'

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  })
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    deviceScaleFactor: 2
  })
  const page = await ctx.newPage()

  console.log('Navigating...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  await page.evaluate(() => window.__system && window.__system.unlock())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system && window.__system.openApp('settings'))
  await page.waitForTimeout(600)

  const cell = page.locator('text=One-Tap Button').first()
  await cell.click()
  await page.waitForTimeout(600)

  const oneTapPage = page.locator('.onetap-page').first()
  const stage = page.locator('.onetap-stage').first()
  const dots = page.locator('.dot-node')

  // 1. 切换到 Mode 0 (静音)
  console.log('Clicking dot 0 (静音)...')
  await dots.nth(0).click()
  // 等待动画完成
  await page.waitForTimeout(500)
  await oneTapPage.screenshot({
    path: `${ARTIFACTS_DIR}/verify_track_mode0_mute.png`
  })
  console.log('Saved verify_track_mode0_mute.png')

  // 2. 模拟从 Mode 0 拖向 Mode 1，拖拽到一半时截图检查是否无缝位移放大/缩小、绝无重复图标
  console.log('Dragging halfway between Mode 0 and Mode 1...')
  const box = await stage.boundingBox()
  if (box) {
    const startX = box.x + box.width * 0.5
    const startY = box.y + box.height * 0.5

    // 向左拖动 70px (约为间距 148px 的一半)
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX - 70, startY, { steps: 8 })
    await page.waitForTimeout(100)

    await oneTapPage.screenshot({
      path: `${ARTIFACTS_DIR}/verify_track_drag_halfway.png`
    })
    console.log('Saved verify_track_drag_halfway.png')

    // 释放并完成切换
    await page.mouse.move(startX - 120, startY, { steps: 5 })
    await page.mouse.up()
    await page.waitForTimeout(500)

    await oneTapPage.screenshot({
      path: `${ARTIFACTS_DIR}/verify_track_after_drag_to_mode1.png`
    })
    console.log('Saved verify_track_after_drag_to_mode1.png')
  }

  // 3. 点击右侧预告图标 (手电筒 - Mode 2)
  console.log('Clicking right flank icon (Mode 2 - 手电筒)...')
  const rightSlot = page.locator('.track-icon-slot.is-right').first()
  if (await rightSlot.isVisible()) {
    await rightSlot.click()
  } else {
    await dots.nth(2).click()
  }
  // 观察平滑切换
  await page.waitForTimeout(500)
  await oneTapPage.screenshot({
    path: `${ARTIFACTS_DIR}/verify_track_click_flank_mode2.png`
  })
  console.log('Saved verify_track_click_flank_mode2.png')

  // 4. 点击第 12 个点 (自定义)，测试多步连续平滑动画
  console.log('Clicking dot 12 (自定义) to test multi-step smooth transition...')
  await dots.nth(12).click()
  // 等待动画完成
  await page.waitForTimeout(600)
  await oneTapPage.screenshot({
    path: `${ARTIFACTS_DIR}/verify_track_click_dot12_custom.png`
  })
  console.log('Saved verify_track_click_dot12_custom.png')

  await browser.close()
  console.log('All carousel track tests completed successfully!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
