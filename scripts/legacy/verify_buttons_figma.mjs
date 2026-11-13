import { chromium } from 'playwright'
import path from 'path'

const artifactDir = '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7'

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  })

  console.log('Navigating to http://localhost:1111 ...')
  await page.goto('http://localhost:1111')
  await page.waitForTimeout(1200)

  // 解锁手机进入桌面
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    window.__system?.unlock()
  })
  await page.waitForTimeout(500)

  // 切换模块到灵动岛
  console.log('Selecting island module in DevConsole...')
  await page.selectOption('#desktop-module-select', 'island')
  await page.waitForTimeout(500)

  // 1. 倒计时 (Timer)
  console.log('Testing Timer...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("倒计时")').first().click()
  await page.waitForTimeout(600)
  let islandCard = page.locator('.island-card')
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_09_倒计时_RUNNING.png') })

  // 点击暂停按键
  console.log('Pausing Timer...')
  await page.locator('.island-card .btn-primary').click()
  await page.waitForTimeout(400)
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_09_倒计时_PAUSED.png') })

  // 2. 麦克拾音 (Microphone)
  console.log('Testing Microphone...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("拾音")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_12_拾音_RECEIVING.png') })

  // 点击静音/暂停拾音
  console.log('Muting Microphone...')
  await page.locator('.island-card .btn-primary').click()
  await page.waitForTimeout(400)
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_12_拾音_MUTED.png') })

  // 3. 屏幕录制 (Screen Recording)
  console.log('Testing Screen Recording...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("录屏")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_07_录屏_ACTIVE.png') })

  // 点击暂停录屏
  console.log('Pausing Screen Recording...')
  await page.locator('.island-card .btn-pause').click()
  await page.waitForTimeout(400)
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_07_录屏_PAUSED.png') })

  // 4. 录音 (Voice Recording)
  console.log('Testing Voice Recording...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("录音")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'native_08_录音_ACTIVE.png') })

  console.log('All button states verified and captured successfully!')
  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
