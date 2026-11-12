/**
 * 解析 e2e 套件收尾行的通过/失败计数 —— G7 断言棘轮的口径实现
 * ============================================================
 * 为什么需要多模式：
 *   实测 14 套有 7 种收尾形态（见 tests/e2e-summary-baseline.txt）。一次性重写
 *   14 个脚本风险高，所以先做「多模式解析 + 新套件强制统一格式」，老套件按簇懒改。
 *
 * 铁律：解析不到 → 返回 null → 调用方必须判失败，**不许跳过**。
 *   一旦允许跳过，格式改一次就静默放行一批，棘轮回到零输入通过。
 */

/* 顺序即优先级：越具体的形态越靠前 */
const PATTERNS = [
  // [id] 12 PASS / 3 FAIL          ← 目标格式
  { re: /\[[\w-]+\]\s+(\d+)\s+PASS\s*\/\s*(\d+)\s*FAIL/g,
    map: (m) => ({ pass: +m[1], fail: +m[2] }) },

  // 走查 15 步 / 断言 131 条 / 通过 131 条 / 失败 0 条 / 控制台报错 0 条
  { re: /通过\s*(\d+)\s*条\s*\/\s*失败\s*(\d+)\s*条/g,
    map: (m) => ({ pass: +m[1], fail: +m[2] }) },

  // 93/93 PASS（AI Mate 系）
  { re: /(\d+)\s*\/\s*(\d+)\s*PASS/g,
    map: (m) => ({ pass: +m[1], fail: Math.max(0, +m[2] - +m[1]) }) },

  // PASS 8 / FAIL 0
  { re: /PASS\s*(\d+)\s*\/\s*FAIL\s*(\d+)/g,
    map: (m) => ({ pass: +m[1], fail: +m[2] }) },

  // ===== 实体音量键验收: 26 PASS / 0 FAIL =====（无 bracket）
  { re: /(\d+)\s+PASS\s*\/\s*(\d+)\s+FAIL/g,
    map: (m) => ({ pass: +m[1], fail: +m[2] }) },
]

/**
 * @param {string} out 套件的完整 stdout+stderr
 * @returns {{pass:number,fail:number}|null} null = 解析不到，调用方须判红
 */
export function parseChecks(out) {
  if (!out) return null
  for (const p of PATTERNS) {
    const all = [...out.matchAll(p.re)]
    if (all.length) return p.map(all[all.length - 1])
  }
  return null
}
