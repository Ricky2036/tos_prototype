import { chromium } from 'playwright'

const BASE = 'http://localhost:1111/'
const OUT_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/'

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'
  })
  const page = await browser.newPage({ viewport: { width: 440, height: 950 } })
  page.on('pageerror', (e) => console.log('[pageerror]', e.message))
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1000)

  // 1. Unlock if on lockscreen
  await page.evaluate(() => {
    const pinia = document.querySelector('#app')?.__vue_app__?._context?.config?.globalProperties?.$pinia
    const system = pinia?._s?.get('system')
    if (system && system.unlock) system.unlock()
  })
  await page.waitForTimeout(1000)

  // 2. Set up a big folder (2x2) with >9 apps to verify 3x3 layout and mini cluster
  await page.evaluate(() => {
    const pinia = document.querySelector('#app')?.__vue_app__?._context?.config?.globalProperties?.$pinia
    const home = pinia?._s?.get('home')
    if (!home) return

    // Create a 2x2 folder with 12 apps
    const appItemIds = ['app:calculator', 'app:notes', 'app:settings', 'app:files', 'app:voicememos', 'app:fitness', 'app:theme', 'app:safari', 'app:camera', 'app:photos', 'app:calendar', 'app:clock']
    const fItemId = home.createFolder(appItemIds, 0, 0)
    const folderId = home.items[fItemId]?.folderId
    if (folderId && home.folders[folderId]) {
      home.folders[folderId].width = 2
      home.folders[folderId].height = 2
      home.reflow()
    }
  })
  await page.waitForTimeout(600)

  // Take screenshot of 2x2 big folder with mini cluster
  await page.screenshot({ path: OUT_DIR + 'verify_big_folder_cluster.png' })
  console.log('Saved verify_big_folder_cluster.png')

  // 3. Inspect folder state in DOM
  const folderInfo = await page.evaluate(() => {
    const f = document.querySelector('.home-folder.large');
    if (!f) return null;
    return {
      classes: f.className,
      appsCount: f.querySelectorAll('.folder-app').length,
      hasCluster: !!f.querySelector('.folder-mini-cluster'),
      clusterIconsCount: f.querySelectorAll('.folder-mini-cluster .cluster-icon').length,
      gridStyle: window.getComputedStyle(f.querySelector('.folder-apps')).gridTemplateColumns,
      gridRows: window.getComputedStyle(f.querySelector('.folder-apps')).gridTemplateRows,
    };
  })
  console.log('Folder info:', JSON.stringify(folderInfo, null, 2))

  // 4. Test long press on big folder to show resize handle
  const folderBox = await page.evaluate(() => {
    const f = document.querySelector('.home-folder.large');
    if (!f) return null;
    const r = f.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })

  if (folderBox) {
    console.log('Long pressing big folder at', folderBox);
    await page.mouse.move(folderBox.x, folderBox.y);
    await page.mouse.down();
    await page.waitForTimeout(600); // Trigger 450ms long press timer
    console.log('Lifting mouse (pointerup)...');
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Verify handle is STILL VISIBLE after mouse up!
    const handleInfo = await page.evaluate(() => {
      const handle = document.querySelector('.folder-resize-handle');
      const isFolderOpen = !!document.querySelector('.folder-overlay');
      return {
        hasHandle: !!handle,
        isFolderOpen,
        handleArcVisible: !!handle?.querySelector('.handle-arc')
      };
    });
    console.log('After release handleInfo:', JSON.stringify(handleInfo, null, 2));

    await page.screenshot({ path: OUT_DIR + 'verify_handle_persists_after_release.png' });
    console.log('Saved verify_handle_persists_after_release.png');

    // 5. Test dragging the handle to resize to 2x1!
    const handleBox = await page.evaluate(() => {
      const h = document.querySelector('.folder-resize-handle');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    console.log('Handle position before resize drag:', handleBox);
    if (handleBox) {
      console.log('Dragging handle upwards by 60px to resize to 2x1...');
      await page.mouse.move(handleBox.x, handleBox.y);
      await page.mouse.down();
      await page.mouse.move(handleBox.x, handleBox.y - 65, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);

      const resize2x1Info = await page.evaluate(() => {
        const f = document.querySelector('.home-folder.large');
        const h = document.querySelector('.folder-resize-handle');
        return {
          isSize21: f?.querySelector('.folder-apps')?.classList.contains('size-2-1'),
          hasHandle: !!h,
          appsCount: f?.querySelectorAll('.folder-app').length,
          hasCluster: !!f?.querySelector('.folder-mini-cluster')
        };
      });
      console.log('Resize 2x1 info:', JSON.stringify(resize2x1Info, null, 2));
      await page.screenshot({ path: OUT_DIR + 'verify_resize_2x1.png' });
      console.log('Saved verify_resize_2x1.png');

      // Drag handle back to 2x2
      const handleBox21 = await page.evaluate(() => {
        const h = document.querySelector('.folder-resize-handle');
        if (!h) return null;
        const r = h.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (handleBox21) {
        console.log('Dragging handle downwards by 65px to restore 2x2...');
        await page.mouse.move(handleBox21.x, handleBox21.y);
        await page.mouse.down();
        await page.mouse.move(handleBox21.x, handleBox21.y + 70, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(500);

        await page.screenshot({ path: OUT_DIR + 'verify_resize_back_to_2x2.png' });
        console.log('Saved verify_resize_back_to_2x2.png');
      }
    }

    // 6. Click background to dismiss handle
    console.log('Clicking empty desktop background at (200, 550)...');
    await page.mouse.click(200, 550);
    await page.waitForTimeout(400);

    const handleAfterEmptyClick = await page.evaluate(() => {
      return !!document.querySelector('.folder-resize-handle');
    });
    console.log('Handle after empty click:', handleAfterEmptyClick);
    await page.screenshot({ path: OUT_DIR + 'verify_handle_dismissed_on_tap_outside.png' });

    // 7. Click mini-cluster in slot 9 to verify it opens the folder!
    console.log('Clicking slot-9 mini cluster...');
    const clusterBox = await page.evaluate(() => {
      const c = document.querySelector('.folder-mini-cluster');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (clusterBox) {
      await page.mouse.click(clusterBox.x, clusterBox.y);
      await page.waitForTimeout(500);
      const isFolderOverlayOpen = await page.evaluate(() => {
        return !!document.querySelector('.folder-overlay');
      });
      console.log('Folder overlay open after cluster click:', isFolderOverlayOpen);
      await page.screenshot({ path: OUT_DIR + 'verify_folder_overlay_from_cluster.png' });
      console.log('Saved verify_folder_overlay_from_cluster.png');
    }
  }

  await browser.close()
  console.log('Verification completed successfully!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
