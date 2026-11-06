#!/usr/bin/env node
/** Capture named frames from a mobile web interaction with Playwright. */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

function fail(message, code = 2) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(code);
}

function usage() {
  process.stdout.write('Usage: node capture_web.mjs capture.json\n');
}

function safeName(value) {
  const name = String(value).trim().replace(/[^A-Za-z0-9._-]+/g, '-');
  if (!name || name === '.' || name === '..') fail(`invalid sample name: ${value}`);
  return name;
}

function validateConfig(config) {
  if (!config || typeof config !== 'object') fail('config must be a JSON object');
  if (typeof config.url !== 'string' || !config.url) fail('config.url is required');
  if (!Array.isArray(config.samples) || config.samples.length === 0) fail('config.samples must be a non-empty array');
  let previous = -1;
  const names = new Set();
  for (const sample of config.samples) {
    const val = sample.timeMs ?? sample.progress;
    if (typeof val !== 'number' || !Number.isFinite(val) || val < previous) {
      fail('sample timeMs or progress values must be finite, non-negative, and ascending');
    }
    previous = val;
    const name = safeName(sample.name);
    if (names.has(name)) fail(`duplicate sample name: ${name}`);
    names.add(name);
  }
}

async function runAction(page, action) {
  const timeout = action.timeoutMs ?? 5000;
  switch (action.type) {
    case 'click':
      await page.locator(action.selector).first().click({ timeout, position: action.position });
      break;
    case 'tap':
      await page.locator(action.selector).first().tap({ timeout, position: action.position });
      break;
    case 'fill':
      await page.locator(action.selector).first().fill(String(action.value ?? ''), { timeout });
      break;
    case 'press':
      await page.locator(action.selector).first().press(action.key, { timeout });
      break;
    case 'hover':
      await page.locator(action.selector).first().hover({ timeout, position: action.position });
      break;
    case 'wait':
      await page.waitForTimeout(action.durationMs ?? 0);
      break;
    case 'waitFor':
      await page.locator(action.selector).first().waitFor({ state: action.state ?? 'visible', timeout });
      break;
    case 'drag': {
      const steps = action.steps ?? 12;
      const pauseBeforeUpMs = action.pauseBeforeUpMs ?? 0;
      if (action.selector) {
        const box = await page.locator(action.selector).first().boundingBox();
        if (!box) throw new Error(`drag target is not visible: ${action.selector}`);
        const from = action.from ?? { x: box.width / 2, y: box.height / 2 };
        const to = action.to;
        if (!to) throw new Error('drag action requires to: {x,y}');
        await page.mouse.move(box.x + from.x, box.y + from.y);
        await page.mouse.down();
        await page.mouse.move(box.x + to.x, box.y + to.y, { steps });
        if (pauseBeforeUpMs > 0) await page.waitForTimeout(pauseBeforeUpMs);
        await page.mouse.up();
      } else {
        if (!action.from || !action.to) throw new Error('drag action requires from and to coordinates');
        await page.mouse.move(action.from.x, action.from.y);
        await page.mouse.down();
        await page.mouse.move(action.to.x, action.to.y, { steps });
        if (pauseBeforeUpMs > 0) await page.waitForTimeout(pauseBeforeUpMs);
        await page.mouse.up();
      }
      break;
    }
    case 'fling': {
      const steps = action.steps ?? 3;
      if (action.selector) {
        const box = await page.locator(action.selector).first().boundingBox();
        if (!box) throw new Error(`fling target is not visible: ${action.selector}`);
        const from = action.from ?? { x: box.width / 2, y: box.height / 2 };
        const to = action.to ?? { x: box.width / 2, y: 0 };
        await page.mouse.move(box.x + from.x, box.y + from.y);
        await page.mouse.down();
        await page.mouse.move(box.x + to.x, box.y + to.y, { steps });
        await page.mouse.up();
      } else {
        if (!action.from || !action.to) throw new Error('fling requires from and to coordinates');
        await page.mouse.move(action.from.x, action.from.y);
        await page.mouse.down();
        await page.mouse.move(action.to.x, action.to.y, { steps });
        await page.mouse.up();
      }
      break;
    }
    case 'evaluate':
      await page.evaluate(action.script ?? action.expression);
      break;
    default:
      throw new Error(`unsupported action type: ${action.type}`);
  }
}

async function runAssertion(page, assertion) {
  const locator = page.locator(assertion.selector);
  const state = assertion.state ?? 'visible';
  try {
    if (state === 'visible') await locator.waitFor({ state: 'visible', timeout: assertion.timeoutMs ?? 1000 });
    else if (state === 'hidden') await locator.waitFor({ state: 'hidden', timeout: assertion.timeoutMs ?? 1000 });
    else if (state === 'attached') await locator.waitFor({ state: 'attached', timeout: assertion.timeoutMs ?? 1000 });
    else if (state === 'detached') await locator.waitFor({ state: 'detached', timeout: assertion.timeoutMs ?? 1000 });
    else if (state === 'text') {
      const text = await locator.first().textContent({ timeout: assertion.timeoutMs ?? 1000 });
      if (!String(text ?? '').includes(String(assertion.value ?? ''))) throw new Error(`text does not include '${assertion.value}'`);
    } else throw new Error(`unsupported assertion state: ${state}`);
    return { ...assertion, pass: true };
  } catch (error) {
    return { ...assertion, pass: false, error: String(error.message ?? error) };
  }
}

async function main() {
  const configArgument = process.argv[2];
  if (!configArgument || ['-h', '--help'].includes(configArgument)) {
    usage();
    process.exit(configArgument ? 0 : 2);
  }
  const configPath = path.resolve(configArgument);
  let config;
  try {
    config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  } catch (error) {
    fail(`cannot read config: ${error.message}`);
  }
  validateConfig(config);
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    fail("Playwright is unavailable. Install it in the project or set NODE_PATH to a runtime containing 'playwright'.", 1);
  }
  const configDir = path.dirname(configPath);
  const outputDir = path.resolve(configDir, config.outputDir ?? 'motion-capture');
  await fs.mkdir(outputDir, { recursive: true });
  const viewport = config.viewport ?? { width: 393, height: 852, deviceScaleFactor: 1 };
  let executablePath = config.browserExecutable;
  if (!executablePath) {
    const fallbackCandidates = [
      '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell',
      '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell'
    ];
    for (const candidate of fallbackCandidates) {
      try {
        await fs.access(candidate);
        executablePath = candidate;
        break;
      } catch {}
    }
  }
  const browser = await chromium.launch({
    headless: config.headless ?? true,
    executablePath,
  });
  const contextOptions = {
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    reducedMotion: config.reducedMotion ?? 'no-preference',
    colorScheme: config.colorScheme ?? 'light',
    locale: config.locale,
    timezoneId: config.timezoneId,
    hasTouch: config.hasTouch ?? true,
    isMobile: config.isMobile ?? true,
  };
  if (config.recordVideo) {
    contextOptions.recordVideo = { dir: outputDir, size: { width: viewport.width, height: viewport.height } };
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', message => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', error => pageErrors.push(String(error.message ?? error)));
  const report = {
    tool: 'mobile-motion-builder/capture_web.mjs',
    url: config.url,
    viewport,
    reducedMotion: config.reducedMotion ?? 'no-preference',
    samples: [],
    assertions: [],
  };
  try {
    await page.goto(config.url, { waitUntil: config.waitUntil ?? 'networkidle', timeout: config.navigationTimeoutMs ?? 30000 });
    if (config.readySelector) await page.locator(config.readySelector).waitFor({ state: 'visible', timeout: config.readyTimeoutMs ?? 10000 });
    if (config.initialWaitMs) await page.waitForTimeout(config.initialWaitMs);
    if (config.hideSelectors?.length) {
      await page.addStyleTag({ content: config.hideSelectors.map(selector => `${selector}{visibility:hidden!important}`).join('\n') });
    }
    const screenshotTarget = config.targetSelector ? page.locator(config.targetSelector).first() : page;
    await screenshotTarget.screenshot({ path: path.join(outputDir, 'initial.png') });
    for (const action of config.actions ?? []) await runAction(page, action);

    const isSeekMode = config.mode === 'seek' || Boolean(config.seek);
    const start = process.hrtime.bigint();
    for (const sample of config.samples) {
      if (isSeekMode || sample.seekScript || sample.progress !== undefined) {
        if (sample.seekScript) {
          await page.evaluate(sample.seekScript);
        } else if (config.seek?.function) {
          const val = sample.progress !== undefined ? sample.progress : (sample.seekValue ?? sample.timeMs);
          await page.evaluate(({ fn, val }) => {
            const parts = fn.split('.');
            let obj = window;
            for (let i = 0; i < parts.length - 1; i++) obj = obj ? obj[parts[i]] : undefined;
            if (obj && typeof obj[parts[parts.length - 1]] === 'function') {
              obj[parts[parts.length - 1]](val);
            }
          }, { fn: config.seek.function, val });
        } else if (config.seek?.script) {
          const val = sample.progress !== undefined ? sample.progress : (sample.seekValue ?? sample.timeMs);
          await page.evaluate(config.seek.script.replace(/\$value/g, String(val)).replace(/\$progress/g, String(val)));
        }
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      } else {
        const elapsedBeforeWait = Number(process.hrtime.bigint() - start) / 1e6;
        const remaining = (sample.timeMs ?? 0) - elapsedBeforeWait;
        if (remaining > 0) await page.waitForTimeout(remaining);
      }
      const name = safeName(sample.name);
      const file = `${String(report.samples.length).padStart(2, '0')}-${name}.png`;
      const captureStartedMs = Number(process.hrtime.bigint() - start) / 1e6;
      await screenshotTarget.screenshot({ path: path.join(outputDir, file), animations: 'allow' });
      const captureCompletedMs = Number(process.hrtime.bigint() - start) / 1e6;
      report.samples.push({
        name,
        requestedTimeMs: sample.timeMs,
        progress: sample.progress,
        captureStartedMs: Number(captureStartedMs.toFixed(3)),
        captureCompletedMs: Number(captureCompletedMs.toFixed(3)),
        file,
      });
    }

    if (report.samples.length >= 2) {
      try {
        const ffmpegPath = require('child_process').execSync('which ffmpeg 2>/dev/null').toString().trim();
        if (ffmpegPath) {
          const sampleFiles = report.samples.map(s => path.join(outputDir, s.file));
          const inputs = sampleFiles.map(f => `-i "${f}"`).join(' ');
          const filter = `hstack=inputs=${sampleFiles.length}`;
          const sheetPath = path.join(outputDir, 'contact-sheet.png');
          require('child_process').execSync(`"${ffmpegPath}" -y ${inputs} -filter_complex "${filter}" "${sheetPath}" 2>/dev/null`);
          report.contactSheet = 'contact-sheet.png';
        }
      } catch {}
    }

    for (const assertion of config.assertions ?? []) report.assertions.push(await runAssertion(page, assertion));
  } catch (error) {
    report.error = String(error.stack ?? error);
  } finally {
    report.console = consoleMessages;
    report.pageErrors = pageErrors;
    report.functionalPass = !report.error && report.assertions.every(assertion => assertion.pass);
    await context.close();
    if (config.recordVideo) {
      try {
        const files = await fs.readdir(outputDir);
        const webm = files.find(f => f.endsWith('.webm'));
        if (webm) {
          report.videoWebm = webm;
          const ffmpegPath = require('child_process').execSync('which ffmpeg 2>/dev/null').toString().trim();
          if (ffmpegPath) {
            const mp4 = path.join(outputDir, 'interaction.mp4');
            require('child_process').execSync(`"${ffmpegPath}" -y -i "${path.join(outputDir, webm)}" -c:v libx264 -pix_fmt yuv420p "${mp4}" 2>/dev/null`);
            report.videoMp4 = 'interaction.mp4';
          }
        }
      } catch {}
    }
    await fs.writeFile(path.join(outputDir, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await browser.close();
  }
  process.stdout.write(`${JSON.stringify({ outputDir, functionalPass: report.functionalPass, samples: report.samples.length })}\n`);
  if (report.error) fail(report.error, 1);
  process.exit(report.functionalPass ? 0 : 1);
}

main().catch(error => fail(error.stack ?? error.message ?? String(error), 1));
