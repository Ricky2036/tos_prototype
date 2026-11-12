#!/usr/bin/env node
/**
 * agent-bridge —— 直接给桌面 Agent 发消息 / 读消息（免复制粘贴）
 * =================================================================
 * 原理：Electron 应用若以 --remote-debugging-port 启动（端口可能是 0 = 随机），
 * 端口号会写到 `<userData>/DevToolsActivePort`。读到它就能用 CDP 连进去，
 * 找到输入框直接打字回车——和人在窗口里敲字完全一样。
 *
 * 用法：
 *   node tools/agent-bridge/read.mjs antigravity [--tail 2000]
 *   node tools/agent-bridge/send.mjs antigravity "文字" [--dry]
 *
 * --dry  只定位输入框，不输入不发送（安全自检）
 *
 * 已知应用：
 *   antigravity → ~/Library/Application Support/Antigravity/DevToolsActivePort
 *   workbuddy   → ~/Library/Application Support/WorkBuddy/DevToolsActivePort
 *                 （需先带 --remote-debugging-port 启动一次）
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const APPS = {
  antigravity: {
    support: 'Antigravity',
    titleRe: /antigravity|git branch/i,
  },
  workbuddy: {
    support: 'WorkBuddy',
    titleRe: /workbuddy|buddy/i,
  },
}

export function readPort(app) {
  const cfg = APPS[app]
  if (!cfg) throw new Error(`未知应用：${app}（支持 ${Object.keys(APPS).join(' / ')}）`)
  const file = path.join(os.homedir(), 'Library/Application Support', cfg.support, 'DevToolsActivePort')
  if (!fs.existsSync(file)) {
    throw new Error(
      `${cfg.support} 没有开调试端口。\n` +
      `  ${cfg.support} 需以 --remote-debugging-port 启动（一次性）：\n` +
      `    osascript -e 'quit app "${cfg.support}"'\n` +
      `    open -a ${cfg.support} --args --remote-debugging-port=9222\n` +
      `  启动后 ${file} 会出现。`,
    )
  }
  const port = Number(fs.readFileSync(file, 'utf8').split('\n')[0].trim())
  if (!port) throw new Error(`${file} 里的端口无效`)
  return port
}

/** 连上并挑出对话页 */
export async function attach(app) {
  const port = readPort(app)
  const { chromium } = await import('playwright')
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`)
  const pages = browser.contexts()[0].pages()
  const metas = []
  for (const p of pages) metas.push({ p, t: await p.title().catch(() => ''), u: p.url() })

  const cfg = APPS[app]
  const hit =
    metas.find((m) => cfg.titleRe.test(m.t)) ||
    metas.find((m) => /\/c\//.test(m.u)) ||
    metas.find((m) => m.t && !m.u.startsWith('data:'))

  if (!hit) throw new Error(`在 ${cfg.support} 里没找到对话页（${pages.length} 个页面）`)
  return { browser, page: hit.p, title: hit.t, port, pages: metas.map((m) => m.t) }
}

/** 定位输入框：contenteditable / textarea / role=textbox */
export async function findComposer(page) {
  const sel = [
    '[contenteditable="true"][role="combobox"]',
    '[contenteditable="true"]',
    'textarea',
    '[role="textbox"]',
  ]
  for (const s of sel) {
    const loc = page.locator(s).last()
    if (await loc.count().catch(() => 0)) {
      const box = await loc.boundingBox().catch(() => null)
      if (box && box.width > 50) return loc
    }
  }
  return null
}
