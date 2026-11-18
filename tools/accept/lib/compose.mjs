/**
 * compose.mjs —— 真机截图 + 本轮渲染截图 → side-by-side.png（左右等高并排）
 * ====================================================================
 * 做法：落一个本地 HTML（两张 <img> 等高、并排），用 Playwright 打开 file://
 * 页面再截图。产物两个都留在 out 目录：side-by-side.html（可复现）+ .png。
 * 真机截图会复制进 out（ref-shot.png），保证产物目录自包含、可拷走。
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function composeSideBySide({
  browser,
  refShot,
  actualShot,
  outDir,
  height = 1100,
  labels = { ref: '真机截图', actual: '本轮渲染' },
}) {
  if (!fs.existsSync(refShot)) throw new Error(`--ref-shot 不存在: ${refShot}`)
  if (!fs.existsSync(actualShot)) throw new Error(`actual.png 不存在: ${actualShot}`)

  const refCopy = path.join(outDir, 'ref-shot.png')
  fs.copyFileSync(refShot, refCopy)
  const actCopy = path.join(outDir, 'actual.png')

  const htmlPath = path.join(outDir, 'side-by-side.html')
  const pngPath = path.join(outDir, 'side-by-side.png')
  const html = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>side-by-side · ${labels.ref} vs ${labels.actual}</title>
<style>
  html, body { margin: 0; background: #0f1012; width: fit-content; }
  body { font: 13px/1.5 -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", sans-serif; color: #cfd3d8; }
  .wrap { display: flex; align-items: flex-start; gap: 16px; padding: 16px; }
  figure { margin: 0; }
  figcaption { padding: 0 0 8px; letter-spacing: .02em; }
  img { display: block; height: ${height}px; width: auto; }
</style>
</head>
<body>
<div class="wrap">
  <figure><figcaption>${labels.ref}</figcaption><img src="ref-shot.png" alt="ref"></figure>
  <figure><figcaption>${labels.actual}</figcaption><img src="actual.png" alt="actual"></figure>
</div>
</body>
</html>
`
  fs.writeFileSync(htmlPath, html)

  const context = await browser.newContext({ viewport: { width: 2600, height: height + 120 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  try {
    await page.goto(pathToFileURL(htmlPath).href)
    await page.evaluate(
      () =>
        Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.onload = resolve
                  img.onerror = resolve
                })
          )
        )
    )
    await page.waitForTimeout(200)
    const box = await page.locator('.wrap').boundingBox()
    if (!box) throw new Error('side-by-side 布局测量失败（.wrap 不存在）')
    await page.screenshot({
      path: pngPath,
      clip: { x: 0, y: 0, width: Math.ceil(box.width), height: Math.ceil(box.height) },
    })
  } finally {
    await context.close()
  }
  return { htmlPath, pngPath, refCopy }
}