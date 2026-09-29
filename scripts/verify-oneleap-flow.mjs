import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const ARTIFACT_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7'
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const context = await browser.newContext({
    viewport: { width: 1200, height: 950 }
  })
  const page = await context.newPage()

  console.log('Navigating to http://127.0.0.1:1111/?overlay=controlCenter...')
  await page.goto('http://127.0.0.1:1111/?overlay=controlCenter', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  await page.waitForFunction(() => window.__system?.overlays?.controlCenter?.status === 'open', null, { timeout: 5000 })
  console.log('Control Center is open!')

  // Screenshot Control Center with 设备中心
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_cc_entry.png') })
  console.log('Saved oneleap_cc_entry.png')

  // 3. Click 设备中心 pill in Control Center
  console.log('Clicking 设备中心 (joyConnect)...')
  const devicePill = page.locator('.cc-cell[data-id="joyConnect"]')
  await devicePill.click()
  await page.waitForTimeout(800)

  // Verify that OneLeap is open
  const activeApp = await page.evaluate(() => window.__system?.activeAppId)
  console.log('Active App ID:', activeApp)

  // Screenshot OneLeap initial screen (Recorder panel active)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_recorder_panel.png') })
  console.log('Saved oneleap_recorder_panel.png')

  // 4. Click 开始录音
  console.log('Clicking 开始录音 button...')
  const recordBtn = page.locator('.main-record-btn')
  await recordBtn.click()
  await page.waitForTimeout(2500) // Wait for recording timer to reach 2-3s

  // Screenshot Recording state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_recording_state.png') })
  console.log('Saved oneleap_recording_state.png')

  // 5. Open Pickup Mode sheet
  console.log('Clicking 拾音模式 row...')
  const modeRow = page.locator('.quick-row').filter({ hasText: '拾音模式' })
  await modeRow.click()
  await page.waitForTimeout(500)

  // Screenshot Mode Sheet
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_mode_sheet.png') })
  console.log('Saved oneleap_mode_sheet.png')

  // Select 会议 mode
  console.log('Selecting 会议 mode...')
  const meetingModeBtn = page.locator('.mode-option-btn').filter({ hasText: '会议' })
  await meetingModeBtn.click()
  await page.waitForTimeout(600)

  // Toggle Reverse Charging
  console.log('Toggling 反向充电...')
  const chargeSwitch = page.locator('.switch-control')
  await chargeSwitch.click()
  await page.waitForTimeout(600)

  // 6. Click 我的口袋打印机 node
  console.log('Clicking 我的口袋打印机 node...')
  const printerNode = page.locator('.printer-node')
  await printerNode.click()
  await page.waitForTimeout(600)

  // Screenshot Printer panel
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_printer_panel.png') })
  console.log('Saved oneleap_printer_panel.png')

  // Click 开始打印
  console.log('Clicking 开始打印...')
  const printActionBtn = page.locator('.only-action-btn')
  await printActionBtn.click()
  await page.waitForTimeout(400)

  // Screenshot Launch Overlay
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_launch_overlay.png') })
  console.log('Saved oneleap_launch_overlay.png')

  await page.waitForTimeout(1000)

  // 7. Click top back button
  console.log('Testing back navigation...')
  const backBtn = page.locator('.nav-round-btn').first()
  await backBtn.click()
  await page.waitForTimeout(600)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'oneleap_returned_home.png') })
  console.log('Saved oneleap_returned_home.png')

  await browser.close()
  console.log('Verification finished successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
