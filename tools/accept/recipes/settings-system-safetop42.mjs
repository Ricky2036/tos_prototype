/**
 * recipe · settings/system + 运行时注入 `--safe-top: 42px`
 * ==========================================================
 * 用途：**只做诊断实验，不改产品仓库**。
 *
 * 假设：设置 → 系统 页整页下移 ~12px，根因是 tokens.css 的 `--safe-top: 54px`
 * 与真机页头位置（42 画布 px）不符。
 *
 * 做法：正常进页面后，用 addStyleTag 覆盖 :root 的 --safe-top，让浏览器重排，
 * 再让 accept 正常测量。这样可以在「不动一行产品代码」的前提下回答两个问题：
 *   1) 只改这一个 token，能不能变绿？→ 能，说明是单根因；不能，说明还有别的因。
 *   2) 改完还剩哪些红？→ 剩下的就是行高档位 / 盒模型 / 真实布局差。
 *
 * 注意：它只影响本次测量会话，跑完页面就关；不会写回仓库。
 */
import { navigate as base } from './settings-system.mjs'

export async function navigate(page, ctx) {
  const result = await base(page, ctx)
  const top = ctx.safeTop || process.env.SAFE_TOP || '42px'
  await page.addStyleTag({ content: `:root{--safe-top:${top} !important;}` })
  await page.waitForTimeout(350) // 等重排/字体稳定
  return result
}