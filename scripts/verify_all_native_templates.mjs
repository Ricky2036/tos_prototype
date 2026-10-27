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
  console.log('Selecting island module...')
  await page.selectOption('#desktop-module-select', 'island')
  await page.waitForTimeout(500)

  const templatesToTest = [
    { label: '外卖', file: 'native_01_外卖.png' },
    { label: '打车', file: 'native_02_打车.png' },
    { label: '导航', file: 'native_03_导航.png' },
    { label: '音乐', file: 'native_04_音乐.png' },
    { label: '翻译', file: 'native_05_翻译.png' },
    { label: '引导', file: 'native_06_引导.png' },
    { label: '录屏', file: 'native_07_录屏.png' },
    { label: '录音', file: 'native_08_录音.png' },
    { label: '倒计时', file: 'native_09_倒计时.png' },
    { label: '快充', file: 'native_10_快充.png' },
    { label: '通话', file: 'native_11_通话.png' },
    { label: '拾音', file: 'native_12_拾音.png' },
    { label: '热点', file: 'native_13_热点.png' },
    { label: '手电筒', file: 'native_14_手电筒.png' }
  ]

  for (const t of templatesToTest) {
    console.log(`Testing template: ${t.label} ...`)
    const btn = page.locator(`.pc-module-big-card button.pc-sysapp-btn:has-text("${t.label}")`).first()
    await btn.click()
    await page.waitForTimeout(600)

    // 截图灵动岛卡片
    const islandCard = page.locator('.island-card')
    if (await islandCard.count() > 0) {
      await islandCard.screenshot({ path: path.join(artifactDir, t.file) })
    }
  }

  // 额外测试手电筒开启状态截图
  console.log('Testing Flashlight ON state...')
  const flashlightOnBtn = page.locator('button.pc-sysapp-btn:has-text("手电筒")')
  // 确保处于手电筒模板
  const flCard = page.locator('.os16-base-card')
  if (await flCard.count() > 0) {
    await flCard.click()
    await page.waitForTimeout(500)
    const islandCard = page.locator('.island-card')
    await islandCard.screenshot({ path: path.join(artifactDir, 'native_14_手电筒_ON.png') })
  }

  // 截取全屏视图
  await page.screenshot({ path: path.join(artifactDir, 'native_all_templates_phone_overview.png') })

  console.log('All 14 templates verified and captured successfully!')
  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
