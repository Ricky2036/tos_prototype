/**
 * recipe · settings/system —— 运行时模拟修复（诊断用，不写仓库）
 * ============================================================
 * 同时注入两件事：
 *   1) --safe-top（默认 42px）：全局竖直偏移
 *   2) 行高（默认 48.8px）：把 .list-cell 的 min-height 从 52 降到真机行距
 * 环境变量：SAFE_TOP / ROW_H
 */
import { navigate as base } from './settings-system.mjs'

export async function navigate(page, ctx) {
  const result = await base(page, ctx)
  const top = ctx.safeTop || process.env.SAFE_TOP || '42px'
  const rowH = ctx.rowH || process.env.ROW_H || '48.8px'
  await page.addStyleTag({
    content: `
      :root{--safe-top:${top} !important;}
      .settings-system-page .list-cell{min-height:${rowH} !important;}
      .settings-system-page .list-cell{padding-top:0 !important;padding-bottom:0 !important;}
      .settings-system-page .system-body{padding-top:${process.env.BODY_PT || '15.7px'} !important;}
    `,
  })
  await page.waitForTimeout(350)
  return result
}
