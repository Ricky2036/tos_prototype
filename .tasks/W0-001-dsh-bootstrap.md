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

## D1 下午 + D2 上午实测结果

| 项 | 实测 | 与文档假设的差 |
|---|---|---|
| 全量**串行** e2e | **632.6s** | 文档 §10.1 假设 211s —— **差 3 倍**，`<150s` 目标不现实 |
| 并发 4 | ~110s | 有假失败，不可用于门禁 |
| e2e 通过数合计 | **1345** | 文档写 1,024（旧值） |
| 单测用例 | **824**（含新增 5 条） | 文档写 819 |
| `gate:merge`（G3a+G3b+G7） | **22.0s** | 可用 |

## 已落地

- `scripts/lib/parse-suite-checks.mjs` — 7 种形态多模式解析，解析不到返回 null
- `run-e2e.mjs`：`checks` 纳入 `ok`；新增 `--port`；支持 `quarantined`
- `scripts/check-assert-ratchet.mjs` — G7；隔离名单受棘轮约束（新隔离即红）
- `scripts/gate-merge.mjs` — 本地合入预检
- `tests/baseline.json` — 824 用例 / 13 套 e2e / 隔离 1 套
- 自测通过：删 1 条用例 → `824 → 823` 判红；恢复 → 绿

## 新发现：`modes-and-routines` 不稳定

同一套件：单独跑通过（26.5s）→ 全量串行跑到它时 `locator.click` 超时（39.9s）。
疑似与前序套件共享 `localStorage` / 路由状态有关，**未定位**。已隔离，不参与 G4 判定。
后续二选一：修到确定性，或长期 quarantine（但需在 baseline 里显式登记）。

## 剩余 e2e 债务

- 30 个 `scripts/verify-*.mjs` 仍硬编码写 `/Users/…/.gemini/antigravity/brain/<uuid>/`
  （仅 `modes-and-routines` 已改为 `ARTIFACT_DIR`）。这些不是套件，按簇懒改。

## 收尾（W0 完成项）

| 项 | 结果 |
|---|---|
| `pixel-refs/sources.json` | 只存像素，kx/ky 由 `canvas-transform.mjs` 现算；三星各向异性已被测试钉住（用 kx 算高少 8.0px） |
| `spec/_TEMPLATE.yaml` | 三段式模板：geometry 脚本生成 / appearance 人工 / unknowns 不许空着进实施 |
| `scripts/check-spec-literals.mjs` | 从 sources.json **派生**禁用字面量，只禁 ky（kx 单独出现不算错，且 1/3 会与 SVG 滤镜撞车）；全仓 97 文件零违规 |
| `save-defaults` 关闭 | 见 `W0-002-ag-save-defaults.md`，属 C0-a，交 AG 合入 |

`gate:merge` 现为 4 步（单测 / 构建 / 画布字面量 / G7 棘轮），18.9s。
