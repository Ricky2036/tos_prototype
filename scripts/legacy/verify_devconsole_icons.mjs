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

  // 切换模块到灵动岛
  console.log('Selecting island module...')
  await page.selectOption('#desktop-module-select', 'island')
  await page.waitForTimeout(600)

  // 截取 DevConsole 的卡片视图
  console.log('Capturing DevConsole island module ...')
  const devConsoleSection = page.locator('.pc-module-section-group.is-island')
  if (await devConsoleSection.count() > 0) {
    await devConsoleSection.screenshot({ path: path.join(artifactDir, 'devconsole_island_module.png') })
    console.log('Captured devconsole_island_module.png')
  }

  // 截取整个控制面板
  const desktopDock = page.locator('.pc-desktop-dock')
  if (await desktopDock.count() > 0) {
    await desktopDock.screenshot({ path: path.join(artifactDir, 'devconsole_desktop_dock.png') })
    console.log('Captured devconsole_desktop_dock.png')
  }

  await browser.close()
  console.log('Done!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
