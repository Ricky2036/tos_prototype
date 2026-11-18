/**
 * recipe · settings/system —— 「已验证处方」的运行时模拟（回归基线用）
 * ==================================================================
 * 这不是产品代码修复，而是把 0002 处方的 CSS 值在运行时注入，用来证明：
 *   **按这组值改，本页就能 13/13 通过**；改完产品代码后应删掉这份 recipe，
 *   改用 recipes/settings-system.mjs 直接验收（不再注入任何东西）。
 *
 * 来自真机实测（spec/settings-system.list-metrics.json + 03-system-page.png）：
 *   --safe-top            54 → 42px      （页头返回 Δ 13 → 1.0）
 *   .system-body          padding-top 12 → 15.7px，gap 12 → 0
 *   .list-cell            min-height 52 → 48.8px（行距 163.8 device = 48.8 画布）
 *   卡片间距（真机四段不等，逐项设）：
 *     card-2  margin-top 24.6px
 *     group   margin-top 19.7px / margin-bottom 3.1px
 *     card-3  margin-top 3.1px
 *     card-4  margin-top 23.2px
 *
 * 实测：注入前 2/13 pass，注入后 13/13 pass（同一构建 /tmp/dist-head）。
 */
import { navigate as base } from './settings-system.mjs'

export const PRESCRIPTION = {
  safeTop: '42px',
  bodyPaddingTop: '15.7px',
  rowMinHeight: '48.8px',
  gaps: {
    'system-card-2': { marginTop: '24.6px' },
    'system-group-header': { marginTop: '19.7px', marginBottom: '3.1px' },
    'system-card-3': { marginTop: '3.1px' },
    'system-card-4': { marginTop: '23.2px' },
  },
}

export async function navigate(page, ctx) {
  const result = await base(page, ctx)
  const p = PRESCRIPTION
  const gaps = Object.entries(p.gaps)
    .map(([t, v]) => {
      const decls = Object.entries(v).map(([k, val]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${val}`).join(';')
      return `.settings-system-page [data-test="${t}"]{${decls}}`
    })
    .join('\n')
  await page.addStyleTag({
    content: `
      :root{--safe-top:${p.safeTop} !important}
      .settings-system-page .system-body{padding-top:${p.bodyPaddingTop} !important; gap:0 !important}
      .settings-system-page .list-cell{min-height:${p.rowMinHeight} !important}
      ${gaps}
    `,
  })
  await page.waitForTimeout(350)
  return result
}
