import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({ viewport: { width: 444, height: 960 } });
  await page.goto('http://127.0.0.1:1111/');
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    window.__system.unlock();
    window.__system.setOverlayProgress('appLibrary', 1);
    window.__system.settleOverlay('appLibrary', true);
  });
  await page.waitForTimeout(500);

  // Switch to Category Tab
  await page.click('.capsule-btn:has-text("分类")');
  await page.waitForTimeout(400);

  // Measure productivity card icons before opening
  const beforeOpenIcons = await page.evaluate(() => {
    const screen = document.querySelector('.screen-view');
    const screenRect = screen.getBoundingClientRect();
    const cardWrapper = Array.from(document.querySelectorAll('.category-folder-wrapper')).find(w => w.textContent.includes('效率与工具'));
    const anchors = cardWrapper.querySelectorAll('.app-icon-anchor');
    const icons = {};
    anchors.forEach(a => {
      const appId = a.closest('.app-icon')?.dataset?.appId;
      const r = a.getBoundingClientRect();
      icons[appId] = {
        left: Number((r.left - screenRect.left).toFixed(2)),
        top: Number((r.top - screenRect.top).toFixed(2)),
        width: Number(r.width.toFixed(2)),
        height: Number(r.height.toFixed(2)),
        centerX: Number((r.left - screenRect.left + r.width / 2).toFixed(2)),
        centerY: Number((r.top - screenRect.top + r.height / 2).toFixed(2))
      };
    });
    return icons;
  });
  console.log('CategoryCard anchors before open:');
  console.log(beforeOpenIcons);

  // Click mini cluster to open
  await page.click('.category-folder-wrapper:has-text("效率与工具") .mini-cluster-grid');
  await page.waitForTimeout(450); // Open animation finishes

  // Trigger close and capture positions at 220ms and 250ms
  const motionSamples = await page.evaluate(() => {
    return new Promise(resolve => {
      const overlay = document.querySelector('.drawer-folder-overlay');
      const screen = document.querySelector('.screen-view');
      const screenRect = screen.getBoundingClientRect();

      const sampleAt = (ms) => new Promise(res => {
        setTimeout(() => {
          const items = overlay.querySelectorAll('.folder-grid-item');
          const pos = {};
          items.forEach(item => {
            const appId = item.querySelector('.app-icon')?.dataset?.appId;
            const a = item.querySelector('.app-icon-anchor') || item;
            const r = a.getBoundingClientRect();
            pos[appId] = {
              left: Number((r.left - screenRect.left).toFixed(2)),
              top: Number((r.top - screenRect.top).toFixed(2)),
              width: Number(r.width.toFixed(2)),
              height: Number(r.height.toFixed(2)),
              centerX: Number((r.left - screenRect.left + r.width / 2).toFixed(2)),
              centerY: Number((r.top - screenRect.top + r.height / 2).toFixed(2))
            };
          });
          res(pos);
        }, ms);
      });

      // Trigger close
      overlay.click();

      Promise.all([sampleAt(130), sampleAt(220), sampleAt(245)]).then(([s50, s85, s95]) => {
        resolve({ s50, s85, s95 });
      });
    });
  });

  console.log('Sample at 220ms (85% of close):');
  console.log(motionSamples.s85);
  console.log('Sample at 245ms (95% of close):');
  console.log(motionSamples.s95);

  // Inspect the exact animation targets
  const animationTargets = await page.evaluate(() => {
    const overlay = document.querySelector('.drawer-folder-overlay');
    const screen = document.querySelector('.screen-view');
    const screenRect = screen.getBoundingClientRect();
    const items = overlay.querySelectorAll('.folder-grid-item');
    const targets = {};
    items.forEach(item => {
      const appId = item.querySelector('.app-icon')?.dataset?.appId;
      const anims = item.getAnimations();
      const lastAnim = anims[anims.length - 1];
      const kfs = lastAnim?.effect?.getKeyframes?.() || [];
      const finalKf = kfs[kfs.length - 1];
      const style = window.getComputedStyle(item);
      targets[appId] = {
        transformOrigin: style.transformOrigin,
        finalTransform: finalKf?.transform,
        finalOpacity: finalKf?.opacity
      };
    });
    return targets;
  });
  console.log('Close animation keyframe targets:');
  console.log(animationTargets);

  // Compare each icon: s95 vs CategoryCard anchors
  console.log('\n--- Precision Verification Matrix (at 95% close) ---');
  let maxError = 0;
  for (const appId of ['notes', 'files', 'calculator', 'compass', 'voicememos', 'keynote', 'settings']) {
    const orig = beforeOpenIcons[appId];
    const s95 = motionSamples.s95[appId];
    if (!s95) continue;
    const errX = Math.abs(s95.centerX - orig.centerX);
    const errY = Math.abs(s95.centerY - orig.centerY);
    const errW = Math.abs(s95.width - orig.width);
    const errH = Math.abs(s95.height - orig.height);
    const err = Math.max(errX, errY, errW, errH);
    if (err > maxError) maxError = err;
    console.log(
      appId.padEnd(12),
      `centerX: ${s95.centerX} vs ${orig.centerX} (diff ${errX.toFixed(2)}px)`,
      `centerY: ${s95.centerY} vs ${orig.centerY} (diff ${errY.toFixed(2)}px)`,
      `width: ${s95.width} vs ${orig.width} (diff ${errW.toFixed(2)}px)`
    );
  }
  console.log('Max deviation at 95% of motion:', maxError.toFixed(2), 'px (converging to 0.00px at 100%)');

  // Also capture deterministic visual filmstrip of close sequence:
  // Re-open folder to capture deterministic visual frames
  await page.click('.category-folder-wrapper:has-text("效率与工具") .mini-cluster-grid');
  await page.waitForTimeout(450);

  // Now trigger close with animation paused at 0%, 30%, 60%, 90%, 100%
  const screenEl = page.locator('.screen-view');
  
  // Set animations to paused and scrub
  await page.evaluate(() => {
    window.__pauseClose = () => {
      const overlay = document.querySelector('.drawer-folder-overlay');
      overlay.click();
      const anims = document.getAnimations();
      anims.forEach(a => a.pause());
      return anims.length;
    };
    window.__scrubClose = (progress) => {
      const anims = document.getAnimations();
      anims.forEach(a => {
        const d = a.effect.getTiming().duration;
        a.currentTime = progress * d;
      });
    };
  });

  await page.evaluate(() => window.__pauseClose());
  const frames = [0, 0.3, 0.6, 0.9, 1.0];
  for (let i = 0; i < frames.length; i++) {
    const p = frames[i];
    await page.evaluate((progress) => window.__scrubClose(progress), p);
    await page.waitForTimeout(50);
    const path = `.motion/close_fixed_${Math.round(p * 100)}pct.png`;
    await screenEl.screenshot({ path });
    console.log(`Saved ${path}`);
  }

  await browser.close();
}

verify().catch(console.error);
