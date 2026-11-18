/**
 * report.mjs —— verdict → report.md（人只看异常，所以表格里 FAIL/MISSING 一眼可见）
 * =================================================================================
 * 表格列：节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本
 * 末尾：合计 + 结论 + 复现命令。
 */

const fmtRect = (r) => (r ? `${r.x},${r.y},${r.w},${r.h}` : '—')
const fmtDelta = (d, worst) => {
  if (!d) return '—'
  return `dx ${d.dx} dy ${d.dy} dw ${d.dw} dh ${d.dh}（worst ${worst}）`
}

export function statusMark(status) {
  switch (status) {
    case 'pass':
      return '✅ PASS'
    case 'fail':
      return '❌ FAIL'
    case 'missing':
      return '⬜ MISSING'
    case 'skip':
      return '⏭️ SKIP'
    default:
      return status
  }
}

function textCell(fact) {
  if (!fact) return '—'
  return fact.ok ? '✓' : `✗（实测「${fact.actual == null ? '∅' : fact.actual}」）`
}

function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|')
}

/**
 * @param {{verdict: object, extras: object[]}} input
 * @returns {string} markdown
 */
export function renderReport({ verdict, extras = [] }) {
  const s = verdict.summary
  const lines = []
  lines.push(`# 验收判决书 · ${verdict.page}`)
  lines.push('')
  lines.push(`> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。`)
  lines.push('')
  lines.push(`- **spec**：\`${verdict.spec_path}\`（sha256 \`${verdict.spec_sha256}\`）`)
  lines.push(`- **commit**：\`${verdict.commit || 'n/a'}\`${verdict.repo ? `（repo: \`${verdict.repo}\`）` : ''}`)
  lines.push(`- **url**：\`${verdict.url}\``)
  lines.push(
    `- **容器**：\`${verdict.shell}\`　**缩放**：${verdict.scale}（画布 ${verdict.canvas.w}×${verdict.canvas.h} → DOM ${Math.round(verdict.canvas.w * verdict.scale)}×${Math.round(verdict.canvas.h * verdict.scale)}）`
  )
  lines.push(`- **生成时间**：${verdict.generated_at}`)
  lines.push('')
  lines.push('## 逐节点几何')
  lines.push('')
  lines.push('| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const row of verdict.nodes) {
    lines.push(
      `| ${escapeCell(row.id)} | ${row.role} | ${fmtRect(row.expected)} | ${fmtRect(row.actual)} | ${fmtDelta(row.delta, row.worst)} | ${statusMark(row.status)} | ${row.via || '—'} | ${textCell(row.text)} |`
    )
  }
  lines.push('')
  lines.push('## 集合差 · extras（DOM 有、spec 没有 → 自造）')
  lines.push('')
  if (!extras.length) {
    lines.push('无。DOM 中的行级元素全部能对上 spec 节点。')
  } else {
    lines.push('| # | 文本 | 实测(x,y,w,h) | 选择器线索 |')
    lines.push('|---|---|---|---|')
    extras.forEach((e, i) => {
      lines.push(
        `| ${i + 1} | ${escapeCell(e.text === '' ? '（无文本）' : e.text)} | ${fmtRect(e.rect)} | \`${escapeCell(e.selectionHint || '—')}\` |`
      )
    })
  }
  lines.push('')
  lines.push('## 集合差 · missing（spec 有、DOM 没有 → 漏做）')
  lines.push('')
  const missing = verdict.nodes.filter((n) => n.status === 'missing')
  if (!missing.length) {
    lines.push('无。')
  } else {
    for (const n of missing) lines.push(`- ⬜ \`${n.id}\`（${n.role}，期望 ${fmtRect(n.expected)}${n.text ? `，文本「${n.text}」` : ''}）`)
  }
  lines.push('')
  lines.push('## 合计')
  lines.push('')
  lines.push(
    `- spec 节点 **${s.totalSpec}**；命中 **${s.matched}/${s.totalSpec}**（matchRate **${s.matchRate}**）`
  )
  lines.push(
    `- pass **${s.pass}** / fail **${s.fail}** / missing **${s.missing}** / extra **${s.extra}** / skipped **${s.skipped}**`
  )
  const verdictText =
    s.fail === 0 && s.missing === 0 && s.extra === 0
      ? s.matchRate >= verdict.min_match
        ? '✅ **通过**：无几何超差、无漏做、无自造，覆盖率达标'
        : '⚠️ **覆盖率不足**：无 fail/missing/extra，但 matchRate 低于门槛'
      : `❌ **不通过**：${[
          s.fail ? `${s.fail} 个几何超差` : null,
          s.missing ? `${s.missing} 个漏做` : null,
          s.extra ? `${s.extra} 个自造` : null,
        ]
          .filter(Boolean)
          .join('，')}`
  lines.push(`- **结论**：${verdictText}（门槛 min-match=${verdict.min_match}）`)
  lines.push('')
  lines.push('## 复现命令')
  lines.push('')
  lines.push('```bash')
  lines.push(verdict.reproduce_command)
  lines.push('```')
  lines.push('')
  if (verdict.diagnostics && verdict.diagnostics.length) {
    lines.push('## 定位诊断（不影响判定，供人复核）')
    lines.push('')
    for (const d of verdict.diagnostics) lines.push(`- \`${d.id}\`：${d.reason} —— ${d.detail}`)
    lines.push('')
  }
  return lines.join('\n')
}