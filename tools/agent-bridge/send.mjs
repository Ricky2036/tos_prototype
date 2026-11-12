#!/usr/bin/env node
/**
 * 给桌面 Agent 发一条消息。
 *
 *   node tools/agent-bridge/send.mjs antigravity "文字" [--dry]
 *
 * 换行用 Shift+Enter（Lexical 里 Enter 会直接发送）。
 * --dry 只定位输入框并打印，不输入、不发送。
 */

import { attach, findComposer } from './lib.mjs'

const app = process.argv[2]
const dry = process.argv.includes('--dry')
const text = process.argv.slice(3).filter((a) => a !== '--dry').join(' ')

if (!app || !text) {
  console.error('用法：node tools/agent-bridge/send.mjs <antigravity|workbuddy> "文字" [--dry]')
  process.exit(2)
}

const { browser, page, title, port } = await attach(app)
try {
  const composer = await findComposer(page)
  if (!composer) throw new Error('找不到输入框（contenteditable / textarea / role=textbox）')

  const box = await composer.boundingBox()
  console.log(`目标：${title}`)
  console.log(`CDP :${port} · 输入框 ${Math.round(box.width)}×${Math.round(box.height)}`)

  if (dry) {
    console.log('--- 将要发送（dry run，未发送）---')
    console.log(text)
    await browser.close()
    process.exit(0)
  }

  await composer.click()
  // 逐行输入：行间 Shift+Enter，避免 Enter 直接发送
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i]) await page.keyboard.type(lines[i], { delay: 8 })
    if (i < lines.length - 1) await page.keyboard.press('Shift+Enter')
  }
  await page.waitForTimeout(300)

  // 发送前确认输入框里真有内容，避免"点空了直接回车"发出一条空消息
  const filled = await composer.evaluate((el) => (el.innerText || el.value || '').trim().length)
  if (filled < 5) throw new Error(`输入框内容异常（${filled} 字符），已中止，未发送`)

  await page.keyboard.press('Enter')
  await page.waitForTimeout(800)

  const after = await composer.evaluate((el) => (el.innerText || el.value || '').trim().length)
  console.log(after === 0 ? '已发送（输入框已清空）' : `警告：发送后输入框仍有 ${after} 字符`)
} finally {
  await browser.close()
}
