/**
 * playwright.mjs —— 加载 playwright / 启动系统 Chrome
 * ==================================================
 * 本机事实（不要装依赖）：
 *   - playwright 在 /Users/.../tos-workbuddy/node_modules
 *   - 用系统 Chrome：/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
 * 两个路径都可用环境变量覆盖，CI 上换成自己的即可：
 *   ACCEPT_PLAYWRIGHT_ROOT=<含 playwright 的 node_modules 目录>
 *   ACCEPT_CHROME_PATH=<Chrome 可执行文件>
 */
import path from 'node:path'
import { createRequire } from 'node:module'

export const DEFAULT_PLAYWRIGHT_ROOT =
  '/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-workbuddy/node_modules'
export const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export function loadPlaywright() {
  const root = process.env.ACCEPT_PLAYWRIGHT_ROOT || DEFAULT_PLAYWRIGHT_ROOT
  const req = createRequire(path.join(root, '_accept_probe.cjs'))
  return req('playwright')
}

/** @returns {Promise<import('playwright').Browser>} */
export async function launchBrowser({ headless = true } = {}) {
  const { chromium } = loadPlaywright()
  const executablePath = process.env.ACCEPT_CHROME_PATH || DEFAULT_CHROME_PATH
  return chromium.launch({
    headless,
    executablePath,
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text'],
  })
}