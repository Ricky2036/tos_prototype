import { createRuntime } from '../tests/helpers/vueRuntime.mjs'
import path from 'path'
import fs from 'fs'

async function run() {
  const rt = await createRuntime()
  const page = rt.page
  await page.setViewportSize({ width: 412, height: 1000 })
  const outDir = '.local-evidence/verification_final'
  fs.mkdirSync(outDir, { recursive: true })

  // 1. Mount SystemNavigation
  const navId = await rt.mount('/src/components/apps/settings/system/subpages/SystemNavigation.vue')
  await page.screenshot({ path: path.join(outDir, '01_system_nav_full.png') })

  // Screenshot thumbnails card
  const thumbnails = await page.$('.mode-select-card')
  if (thumbnails) {
    await thumbnails.screenshot({ path: path.join(outDir, '02_nav_thumbnails.png') })
  }

  // Screenshot sensitivity card
  const sensitivity = await page.$('[data-test="card-sensitivity"]')
  if (sensitivity) {
    await sensitivity.screenshot({ path: path.join(outDir, '03_sensitivity_slider.png') })
  }
  await rt.unmount(navId)

  // 2. Mount DisplayFont
  const fontId = await rt.mount('/src/components/apps/settings/display/DisplayFont.vue')
  await page.screenshot({ path: path.join(outDir, '04_font_page_full.png') })
  const fontSheet = await page.$('.font-sheet')
  if (fontSheet) {
    await fontSheet.screenshot({ path: path.join(outDir, '05_font_sliders.png') })
  }
  await rt.unmount(fontId)

  await rt.close()
  console.log('Captures completed successfully!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
