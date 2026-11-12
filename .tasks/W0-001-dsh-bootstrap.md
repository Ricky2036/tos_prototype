# W0-001 · 地基

- 簇：C0（基建，不认领业务簇）
- Owner：DSH
- 分支：`dsh/lane`
- 起始：`3ff2884`
- 依据：`docs/tOS-pipeline-1.0.md` §10 W0

## 交付清单

| # | 项 | 验收 |
|---|---|---|
| 1 | `tos-dsh` 四件套 | worktree + 分支 + `.agent-assignments/dsh.md` + `AGENTS.md` 登记 |
| 2 | 抓 14 套真实收尾行 → `tests/e2e-summary-baseline.txt` | 恰 14 行 |
| 3 | 统一 14 套收尾格式 + `run-e2e.mjs` 输出 `checks` | 解析不到计数的套件 = 0 |
| 4 | `tests/baseline.json` + `check-assert-ratchet.mjs` | 删一条断言 → 红；恢复 → 绿 |
| 5 | `verify.yml`（分层触发）+ `gate:merge` | 分支推上去能看到 G3+G7 |
| 6 | `source` 表（kx/ky）+ spec 模板 + 字面量静态检查 | 手写 `0.298` 被拦下 |
| 7 | `save-defaults` 改显式开关、默认关（提 patch，待 AG 持 C0-a 锁合入） | 关闭时点滑杆 `git status` 无 diff |

## 口径备忘

- `run-e2e.mjs:352` 现字段：`{ id, ms, code, ok, summary, fails, out }`，**无 `pass`/`fail`**
- `run-e2e.mjs:381` 已用 `({ out, ...r }) => r` 剔掉 `out`
- 单测侧：`node --test --test-reporter=tap tests/*.test.js | grep -E "^# (pass|fail)"` → `# pass 819 / # fail 0`
- 基线字段名用 `cases`（不是 `asserts`）

## 遗留（不在本单）

- `AGENTS.md` 第 40 行写「48 files」，实测 82 个测试文件 —— 顺手修不在本单范围，单独提
- Codex 下线三件事（`AGENTS.md:3/11/31`、`codex.md.retired`、worktree 归档）需与 AG 协调，本单不动

## D1 上午实测结果（2026-11-12）

| 发现 | 证据 | 影响 |
|---|---|---|
| 收尾格式有 **7 种**，不是 4 种 | `tests/e2e-summary-baseline.txt` | 统一格式的清单要重写 |
| 可被 `[id] N PASS / M FAIL` 解析的只有 **4 套** | dnd / focus / digital-health / settings-group3 | 解析器上线前必须先统一 |
| **`--jobs 4` 会产生假失败** | settings-group3 并发跑 176/3 FAIL；单独跑 **179/0 PASS** | **G4 不能跑并发**，见下 |
| 脚本硬编码写进别的 Agent 目录 | `verify-account-login.mjs:7`、`verify-chrome-inversion.mjs:29` 等写 `/Users/…/.gemini/antigravity/brain/<uuid>/` | modes-and-routines 因此 EPERM 挂掉；跨 lane 不可移植 |

### 待决：G4 的并发策略

- 并发 4：82s，但**有假失败**（本轮 settings-group3 平白红 3 条）
- 串行：~211s，零假失败

门禁一旦报假失败，一周内就会被所有人忽略。**建议 G4 默认串行，仅在本地临时加速时用 `--jobs`。**
