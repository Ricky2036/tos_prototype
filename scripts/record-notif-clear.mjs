import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const VIDEO_DIR = path.resolve('.motion/verify-clear/video')
fs.mkdirSync(VIDEO_DIR, { recursive: true })

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })
  const context = await browser.newContext({
    viewport: { width: 444, height: 960 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 444, height: 960 }
    }
  })
  const page = await context.newPage()

  console.log('Navigating to http://localhost:1111/ ...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })

  // Open notification center
  console.log('Opening Notification Center...')
  await page.click('.edge-zone.edge-nc')
  await page.waitForTimeout(800) // wait for NC open transition

  // Check clear button
  const clearBtn = page.locator('.nc-clear-fab-slot button')
  await clearBtn.waitFor({ state: 'visible', timeout: 3000 })
  console.log('Clear button ready. Waiting 400ms before click...')
  await page.waitForTimeout(400)

  // Click clear button
  console.log('Clicking clear button...')
  await clearBtn.click()

  // Wait for clear flight animation (~350ms) + FLIP upward transition (~400ms) + settle (~400ms)
  await page.waitForTimeout(1400)

  // Close context to save video
  await page.close()
  await context.close()
  await browser.close()
  console.log('Recorded video successfully saved.')

  // Find saved video file
  const videoFiles = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'))
  if (videoFiles.length === 0) {
    throw new Error('No video file found in ' + VIDEO_DIR)
  }
  const videoPath = path.join(VIDEO_DIR, videoFiles[0])
  console.log('Saved video:', videoPath)

  // Extract frames with ffmpeg
  const FRAMES_DIR = path.resolve('.motion/verify-clear/video_frames')
  fs.mkdirSync(FRAMES_DIR, { recursive: true })
  execSync(`ffmpeg -y -i "${videoPath}" -fps_mode passthrough "${FRAMES_DIR}/f_%03d.png"`)
  console.log('Extracted frames to:', FRAMES_DIR)
}

run().catch((err) => {
  console.error('Recording failed:', err)
  process.exit(1)
})
