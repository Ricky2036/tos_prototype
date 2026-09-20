import { chromium } from 'playwright'
import { mkdir, copyFile } from 'node:fs/promises'
import { join } from 'node:path'

const ARTIFACT_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a'
const OUT_DIR = '/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-antigravity/.motion/verify-filter'

async function run() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })
  const context = await browser.newContext({
    viewport: { width: 444, height: 960 },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  console.log('Navigating to http://127.0.0.1:1111/ ...')
  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. 解锁
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  // 2. 打开抽屉
  console.log('Opening App Drawer...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.setOverlayProgress('appLibrary', 1)
      window.__system.settleOverlay('appLibrary', true)
    }
  })
  await page.waitForTimeout(600)

  // 截图 1: 抽屉全量视图，验证右侧导轨仅显示有对应应用的字母 (D J L R S T W X Y Z)
  console.log('Taking screenshot of drawer with active-only letters...')
  const letters = await page.locator('.scrubber-item').allInnerTexts()
  console.log('Rendered scrubber letters:', letters.join(' '))

  const shotAll = join(OUT_DIR, 'drawer_active_letters_only.png')
  await page.screenshot({ path: shotAll })
  await copyFile(shotAll, join(ARTIFACT_DIR, 'drawer_active_letters_only.png'))

  // 3. 点击 'J' 字母进入过滤模式（有应用）
  console.log('Clicking letter J on scrubber rail...')
  const letterJ = page.locator('.scrubber-item[data-letter="J"]')
  await letterJ.click()
  await page.waitForTimeout(500)

  const shotJ = join(OUT_DIR, 'filter_mode_j.png')
  await page.screenshot({ path: shotJ })
  await copyFile(shotJ, join(ARTIFACT_DIR, 'drawer_filter_mode_j.png'))

  // 4. 点击 'S' 字母（有应用，展示过滤模式）
  console.log('Clicking letter S on scrubber rail...')
  const letterS = page.locator('.scrubber-item[data-letter="S"]')
  await letterS.click()
  await page.waitForTimeout(500)

  const shotS = join(OUT_DIR, 'filter_mode_s.png')
  await page.screenshot({ path: shotS })
  await copyFile(shotS, join(ARTIFACT_DIR, 'drawer_filter_mode_s.png'))

  // 5. 点击背景空白处退出过滤模式
  console.log('Clicking blank area to exit filter mode...')
  await page.mouse.click(200, 650)
  await page.waitForTimeout(500)

  const shotExit = join(OUT_DIR, 'filter_mode_exit.png')
  await page.screenshot({ path: shotExit })
  await copyFile(shotExit, join(ARTIFACT_DIR, 'drawer_filter_mode_exit.png'))

  await browser.close()
  console.log('Verification completed successfully!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
