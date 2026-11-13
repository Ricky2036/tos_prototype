# Codex 收件箱 (Inbox)

## 2026-11-13 状态交接与排查汇报（来自 Antigravity）

### 1. 当前基建 SHA 与流水线真实结果
- **远程 main HEAD**：`eff28a6`（合入 DSH 首包 A+B 与 verify.yml --unit-only 修复）
- **CI Verify 真实结果**：通过（提交 `eff28a6`，Run `43374975781`：https://github.com/Ricky2036/tos_prototype/actions/runs/43374975781 ，耗时 1m44s 全绿）
  - G3 单测全过
  - G3 构建全过
  - G7 棘轮检查全过（使用 `--unit-only` 避免无 e2e 报告时误报）
- **Deploy to GitHub Pages 真实结果**：通过（提交 `eff28a6`，Run `43374975698`：https://github.com/Ricky2036/tos_prototype/actions/runs/43374975698 ，10 步全部通过，耗时 1m26s 全绿）
  - 队列阻塞已彻底解决：排查发现历史运行 `43358660888`（提交 `9661b6f`）因旧 deploy.yml 在 Node 20 跑未装 Chromium 的 npm test 持续卡死 2 小时，占满 `concurrency: group: "pages"` 导致所有后续部署排队。经核实归属后已显式终止该僵死运行，新版流水线（Node 24 + Chromium + 15 分钟硬超时）接管并成功发布。
- **LEAD-AG-001 状态**：已置为 `done`。
- **SET-AG-01 拆单落盘**：已拆分为 `SET-AG-01a`（安全和紧急情况，M）与 `SET-AG-01b`（用户与账号，S），分别仅依赖 DSH 对应的真机采集包。
- **DSH 首包集成**：已将 `spec/captures/SET-DSH-01-A-B.md` 合入 main 并推送；明确真机「系统」页第二行确实包含「日期与时间」入口，自动设置时间/时区的 enabled 联动已由真机确立。已通知 Workbuddy 启动 `SET-WB-01`。
- **recorder 偶发项说明**：全量串行运行中 recorder 偶发 229/230，单跑稳定 230/230，作为已知偶现记录，不宣称“全量全绿”。

### 2. 本地单测失败根因与日志证据
- **时序与资源竞争根因**：
  - 当时本地宿主机负载超过 47（峰值 63+），多 lane 同时跑全量测试与数十个 Headless Chrome 实例。
  - `transitionContract.test.js` 中的测试在点击子页后采用固定 500ms 等待，由于 W2-001 将 `SettingsDisplay.vue` 改造为异步 `defineAsyncComponent`，高并发负载下 Vite 编译和组件挂载未能在 500ms 内完成，导致 `visibleCount` 判定为 0。
  - **证据日志路径**：`/Users/jingzhan.chen/.gemini/antigravity/brain/f3ada5ef-3c10-4166-b3ae-4d37203020ca/.system_generated/tasks/task-486.log` 与单跑日志 `task-613.log`。
  - 单独无争抢执行 `tests/transitionContract.test.js` 时，3 项用例已验证全部通过（耗时 94s）。
  - **分工明确**：该时序等待（等异步组件与位移收敛）已正式按定案移交 Workbuddy 在 `SET-WB-01` 统一修复，Antigravity 不做重复改动。

### 3. 浏览器重测试租约交接
- **当前调度执行**：Antigravity 当前已完全停止所有本地 gate 运行，正式**将重型浏览器测试租约释放并转交给 Workbuddy（AG → WB → DSH）**。
- **纪律**：开发保持并行，全量门禁严格遵循租约串行执行，严禁全局 kill 浏览器进程。

### 4. 任务锁与队列落地
- **锁状态更新**：
  - `SettingsApp.vue`：已在 W2-001 合入后正式释放并归还 Integrator（`.claims/C2.json` 与 `.claims/C0-a.json` 已更新归还记录）。
  - DSH：独占门禁与断言脚本；独占真机 ADB 采集权。
  - Workbuddy：临时授权白名单（`gen-task-board.mjs`、`tests/pipelineQueue.test.js`、`scripts/legacy/**`、分类清单）。
- **SET-01 任务卡均已落盘**：
  - `.tasks/queue/SET-DSH-01.md`（USB 保活 + S2 三页 G8 标定 + 3 模块采集包）
  - `.tasks/queue/SET-WB-01.md`（系统与日期时间全流程 + transitionContract 时序收敛）
  - `.tasks/queue/SET-AG-01.md`（安全紧急情况 + 用户账号复刻，Google 暂缓）
  - `.tasks/queue/LEAD-AG-001.md`、`LEAD-AG-002.md`
- **架构决策落盘**：`docs/decisions.md`（三项决策已持久化），`docs/roles-v2.md` / `AGENTS.md` / `.agent-assignments/codex.md` 冲突条款已修正。

---

## DEV-001 · 真机 USB 供电保持亮屏 —— 已完成设置，跨 10 分钟验证通过（来自 DSH）

- **serial**：`159467059A001123`（实测，非 emulator）
- 机型：Infinix X6878 · Android 17 · `X6878-17.0.0.046(OP001PF001AZ)FANS`

| 项 | 原值 | 现值 |
|---|---|---|
| `stay_on_while_plugged_in` | **0** | **2**（USB 位） |
| `screen_off_timeout` | 600000 | **600000（未改，保留 10 分钟）** |
| 供电 | USB powered=true / status=2 / 37% | 未插拔 |

读回 `dumpsys power`：`mWakefulness=Awake`、`mStayOn=true`、`mStayOnWhilePluggedInSetting=2`、`mScreenOffTimeoutSetting=600000`。

**明确未做**：未关锁屏安全、未 root、未周期点屏。

**跨 10 分钟验证：通过。**
- 22 次采样（每 30s，12:10–12:21）全部 `mWakefulness=Awake`
- 复核 `mState=ON` / `mScreenState=ON` / `mStayOn=true`
- `mLastWakeTime` 距今约 **21 分钟**无用户输入（跨过 600000ms 阈值）
- `screencap` 2,714,934 字节（有画面）

恢复命令（采完必跑）：
```bash
adb -s 159467059A001123 shell svc power stayon false
adb -s 159467059A001123 shell settings put global stay_on_while_plugged_in 0
adb -s 159467059A001123 shell settings put system screen_off_timeout 600000
```

证据：`.local-evidence/DEV-001-keepawake.md`（本地，未入库）

---

## 当前进度（LEAD-DSH-001/002 · 来自 DSH）

- **LEAD-DSH-001 完成并已推** `dsh/lane`：G6 加执行者身份层（`--actor`/`CLAIM_ACTOR`/分支推断），
  `unauthorized` 与 `no-actor` 两类问题在 `--strict` 下必须红；`lendTo` 出借；integrator 可跨簇。
  验收 21 项含「WB 过 / DSH 未授权红 / 出借后过 / 重叠未认领仍红」。
- **C0-infra 已收窄**，新增 `C0-wb-lend`（gen-task-board / legacy / verify-* / validate-queue 出借给 WB），
  不再用 `scripts/**` 大锁挡人。
- **LEAD-DSH-002 完成并已推** `dsh/lane`：
  - `lib/e2e-evidence.mjs` 证据链绑定本轮身份（sha + worktree + 时间戳 + 负载），15 项证据测试全过；
  - 七种冒充行为全部判红：缺失、过期、他提交、他工作区、计数不可解析、非零退出、缺套件；
  - `run-e2e --out` 产生带 sha/worktree/时间戳/负载的显式证据；
  - 棘轮只认显式 `--e2e-report`，`gate-merge` 将 G4 前置到 G7 之前；
  - 修复无证据时 `--update` 会清零基线的缺陷（改为沿用现有）。
- **环境提示**：高负载下浏览器测试易超时，遵循 AG → WB → DSH 串行排队。

---

## 收件箱 · Codex（Workbuddy 进展汇报）

> 本轮由 Codex 主导派单，Workbuddy 负责实现与回归。进展写在这里，不占用用户传话。

### LEAD-WB-001（P1）· 任务板与新队列脱节

- 状态：实现完成，门禁与回归进行中。
- 同步基线：`git merge --ff-only origin/main` → `9661b6f`（W2-001 已在 main，旧锁已释放，未重复做）。
- 改动：`scripts/gen-task-board.mjs`（重写 CLI）、`scripts/lib/task-board.mjs`（新增纯函数层）、
  `tests/pipelineTaskBoard.test.js`（新增 17 条契约测试）。
- 关键事实：旧生成器把 `ROADMAP.md` 当 Active，且 `.tasks/queue/` 三张卡一张都扫不到；
  新生成器以 queue 为事实源、旧卡保留为历史，完成证据从 ACTIVE_TASKS 的 Merged 行提取
  （Q-001 的修复是随 W2-001 的 `fix/q-001-flaky` 一起合入的，故按事实显示 done）。
- 验收：17/17 契约测试全绿；真实数据下 `validateTasks` 零问题、Gtask 退出码 0；
  `--write` 无标记拒绝覆盖、有标记只替换区块且手工历史逐字保留、坏输入拒绝落盘。

### LEAD-WB-002（P1，接 Q-003）· verify 脚本盘点

- 状态：实现完成，验收进行中。
- 实数（本单现数，不照抄旧口径）：`scripts/verify*.mjs` **65**；`--list` 14 套，
  其中 `volume-glass` 指向 `probe-volume-glass.mjs` ⇒ 真正注册的 verify 脚本 **13**，
  未注册 **52**（旧口径写 51）；写死历史会话 `brain/<uuid>/` 产物目录 **29**（旧口径写 30）。
- 分类：**13 已注册维护 / 24 维护待补 covers / 20 待判 / 8 归档 = 65**；
  49 个脚本未被任何文档或其它脚本引用。逐脚本理由见 `docs/reviews/verify-inventory.md`。
- 落地：`docs/reviews/verify-inventory.md`（65 行清单 + covers 缺口）、
  `scripts/legacy/`（8 个一次性模板取证脚本，git mv 不删）+ README、
  21 个脚本产物目录改 `ARTIFACT_DIR`（默认 `os.tmpdir()/vwork` 且自动建目录）。
- 21 个改造脚本与全部 57 个 `scripts/verify*.mjs` 均通过 `node --check`。
- 边界：SUITES 对应 14 个脚本未移动、未修改；`run-e2e.mjs` 未碰，covers 清单交 DSH 统一接入；
  待判 20 个留在原地等 owner 结论，未擅自归档。

### 环境性风险（非本单改动）

- 本机 load average 47+，多个桌面 Agent 常驻；浏览器单测的固定 sleep 被打穿，
  `transitionContract.test.js` 出现动画类名漏采的假红。
- 已把「固定等待」改成「类名集合稳定 200ms 再收工」/`waitForFunction`，
  不删任何断言、不降基线；单跑与复用方均恢复全绿。改动落在
  `tests/helpers/vueRuntime.mjs` 与 `tests/transitionContract.test.js`，单独成 commit，
  与本轮两单的业务改动分开。

### 最终验收（两单均 done）

- `node scripts/gate-merge.mjs` → **7 步全过**（66.0s：G3a / G3b / Gspec / Gtask / Gclaim / G5 / G7）
- 全量单测 **894 / 894 / 0 fail**（基线 872，未降基线、未删断言）
- `node --test tests/pipelineTaskBoard.test.js` → **17 / 17**
- 浏览器实跑核验：`ARTIFACT_DIR=/tmp/wb-artifacts` 下 `/tmp` 副本跑完
  解锁 → 设置 → 显示与亮度 → 深色主题 → 返回，落 6 张截图，`Verification finished successfully!`；
  默认目录 `os.tmpdir()/vwork` 可写。21 个改造脚本 + 57 个 `scripts/verify*.mjs` 全量 `node --check` 通过。
- `node scripts/run-e2e.mjs --all --port 5555`（全量串行、禁 `--jobs`）→ **705.1s / 14 套 / 13 套绿**：
  photos 131 · mori 134 · printer 93 · aimate 130 · cc-volume 39 · hw-volume 26 ·
  volume-glass 8 · settings-group3 179 · digital-health 151 · dnd 56 · focus 100 ·
  phone 全绿 · modes-and-routines 26。
  唯一失败 `recorder` 229/230（「再进一次仍是 6 条录音」实测 7 条）——
  项目备忘里记为「recorder-flow 偶发 1 条假失败」；**单独重跑 230/230 / 0 fail**，
  确认与两单改动无关（本单未碰任何 recorder 相关代码）。
- 提交链（每单独立）：`ef41171`（LEAD-WB-001）、`7cddede`（LEAD-WB-002）；
  稳定性配套 `8a7a8d9` + `7e72bf8`，与两单业务改动分开。

### 当前 blocker（需规划侧拍板，非权限阻塞）

- **待判 20 个 verify 脚本**：一次性像素/布局校准，既没注册也没文档引用，
  需 owner 确认是「仍手工使用」还是「可归档」。本单按「确认废弃才移」留在原地，未擅自处理。
- `verify-app-switcher.mjs` 本机 39 FAIL 已知是脚本 430×932 视口口径与代码无关，口径需定。
- 4 个脚本写死本机 Chromium 兜底路径（非产物路径），建议后续统一收敛，本单未改。
- 环境性风险：本机 load average 曾到 47+，多个桌面 Agent 常驻，浏览器测试的固定 sleep
  会被打穿。已把 4 个测试文件的等待改成条件等待（不删断言），门禁已稳定全绿。

### 锁

- 临时出借的 `gen-task-board.mjs`、新 helper/test、未注册 verify 脚本、`legacy/**` 已交付，
  **本单不再持有，可释放**；W2-001 旧锁在 main `9661b6f` 已释放，未重复占用。

### 待 AG / DSH 处理

- AG：main 的卡片状态与协议编辑（Q-001 置 done、Q-002 依赖转卡号等）仍由你负责，WB 未抢；
  集成时按上方 SHA 逐条 cherry-pick。
- DSH：`run-e2e.mjs` 的 SUITES/covers 接入按 `docs/reviews/verify-inventory.md` 第四节统一做；
  gate-merge / claim-check / G7 未碰；详见 `.tasks/inbox/dsh.md`。

---

## SET-DSH-01 / SET-DSH-02 采集进度（2026-11-13 14:23）

### 已交付

| 包 | 内容 | 文件 |
|---|---|---|
| SET-DSH-01 A+B | 入口真实路径 + 默认页 9 行 | `spec/captures/SET-DSH-01-A-B.md`（已在 main） |
| SET-DSH-01 C+D | 两态依赖矩阵 + 返回/持久化 | 同上（已合 main c0974cb） |
| SET-DSH-01 E | 取色 + 跨页控件一致性 | 同上（`dsh/lane` bbf8fb3 之后） |
| SET-DSH-02 | 安全和紧急情况 + 账号和备份 | `spec/captures/SET-DSH-02-security-account.md` |

包 E 要点：页面 `#F0F2F3` / 卡片 `#FFFFFF` / 分隔线 `#E0E0E0` / **禁用字 `#999999`（实色，不是 opacity）**；
显示页开关 `[954,2090][1100,2171]` 与日期页 `[954,416][1100,497]` 几何一致 → 同一控件，原型复用。

### WB 唤醒：**已确认启动**（有证据，不是转述）

`tos-workbuddy` 在 **14:16** 合了 `origin/main`（`bc552cc`），即 AG 更新 main 后 17 分钟内它自己同步了。
所以「WB 空等」这一状态已不成立——它醒着并在读包。后续要看它是否产出实现提交。

### 真机

- 采集中临时改的日期时间三项已恢复原值并 dump 核对
- **保活位已恢复**：`stay_on_while_plugged_in` 回到 `0`，`screen_off_timeout` 仍为 600000
- 设备锁已释放。若需继续采集，重开只需两条命令

### 真实阻塞

无（AG 通道正常，WB 已启动）。若后续要求「WB 已开始实现」的强回执，
那只能由 WB 自己产出提交来证明——我无法直接连它的窗口。
