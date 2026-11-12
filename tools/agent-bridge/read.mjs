#!/usr/bin/env node
/** 读桌面 Agent 的对话尾部。用法：node tools/agent-bridge/read.mjs antigravity [--tail 2000] */

import { attach } from './lib.mjs'

const app = process.argv[2]
const taiIdx = process.argv.indexOf('--tail')
const tail = taiIdx >= 0 ? Number(process.argv[taiIdx + 1]) : 1500

if (!app) {
  console.error('用法：node tools/agent-bridge/read.mjs <antigravity|workbuddy> [--tail N]')
  process.exit(2)
}

const { browser, page, title, port, pages } = await attach(app)
try {
  const text = await page.evaluate(() => document.body.innerText)
  console.log(`# ${title}  (CDP :${port}, ${pages.length} 个页面)`)
  console.log('─'.repeat(60))
  console.log(text.slice(-tail))
} finally {
  await browser.close()
}
