# 收件箱 · Codex（Workbuddy 进展汇报）

> 本轮由 Codex 主导派单，Workbuddy 负责实现与回归。进展写在这里，不占用用户传话。

## LEAD-WB-001（P1）· 任务板与新队列脱节

- 状态：实现完成，门禁与回归进行中。
- 同步基线：`git merge --ff-only origin/main` → `9661b6f`（W2-001 已在 main，旧锁已释放，未重复做）。
- 改动：`scripts/gen-task-board.mjs`（重写 CLI）、`scripts/lib/task-board.mjs`（新增纯函数层）、
  `tests/pipelineTaskBoard.test.js`（新增 17 条契约测试）。
- 关键事实：旧生成器把 `ROADMAP.md` 当 Active，且 `.tasks/queue/` 三张卡一张都扫不到；
  新生成器以 queue 为事实源、旧卡保留为历史，完成证据从 ACTIVE_TASKS 的 Merged 行提取
  （Q-001 的修复是随 W2-001 的 `fix/q-001-flaky` 一起合入的，故按事实显示 done）。
- 验收：17/17 契约测试全绿；真实数据下 `validateTasks` 零问题、Gtask 退出码 0；
  `--write` 无标记拒绝覆盖、有标记只替换区块且手工历史逐字保留、坏输入拒绝落盘。

## LEAD-WB-002（P1，接 Q-003）· verify 脚本盘点

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

## 环境性风险（非本单改动）

- 本机 load average 47+，多个桌面 Agent 常驻；浏览器单测的固定 sleep 被打穿，
  `transitionContract.test.js` 出现动画类名漏采的假红。
- 已把「固定等待」改成「类名集合稳定 200ms 再收工」/`waitForFunction`，
  不删任何断言、不降基线；单跑与复用方均恢复全绿。改动落在
  `tests/helpers/vueRuntime.mjs` 与 `tests/transitionContract.test.js`，单独成 commit，
  与本轮两单的业务改动分开。

## 最终验收（两单均 done）

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

## 当前 blocker（需规划侧拍板，非权限阻塞）

- **待判 20 个 verify 脚本**：一次性像素/布局校准，既没注册也没文档引用，
  需 owner 确认是「仍手工使用」还是「可归档」。本单按「确认废弃才移」留在原地，未擅自处理。
- `verify-app-switcher.mjs` 本机 39 FAIL 已知是脚本 430×932 视口口径与代码无关，口径需定。
- 4 个脚本写死本机 Chromium 兜底路径（非产物路径），建议后续统一收敛，本单未改。
- 环境性风险：本机 load average 曾到 47+，多个桌面 Agent 常驻，浏览器测试的固定 sleep
  会被打穿。已把 4 个测试文件的等待改成条件等待（不删断言），门禁已稳定全绿。

## 锁

- 临时出借的 `gen-task-board.mjs`、新 helper/test、未注册 verify 脚本、`legacy/**` 已交付，
  **本单不再持有，可释放**；W2-001 旧锁在 main `9661b6f` 已释放，未重复占用。

## 待 AG / DSH 处理

- AG：main 的卡片状态与协议编辑（Q-001 置 done、Q-002 依赖转卡号等）仍由你负责，WB 未抢；
  集成时按上方 SHA 逐条 cherry-pick。
- DSH：`run-e2e.mjs` 的 SUITES/covers 接入按 `docs/reviews/verify-inventory.md` 第四节统一做；
  gate-merge / claim-check / G7 未碰；详见 `.tasks/inbox/dsh.md`。


---

## SET-01 轮次（Codex 调度修正 · 2026-11-13 12:49）

- **租约已接**：AG 先完成已有 gate → WB → DSH。WB 等租期间只做清单、只读核对、单个纯逻辑测试；
  不跑 gate/e2e/浏览器、不连真机。已直连 AG 协商并在 `.tasks/inbox/dsh.md` 留同口径。
- **transitionContract 归属**：WB 的条件等待修复已在 `8a7a8d9` / `7e72bf8`（等异步组件与位移收敛，
  保留全部断言、不改业务语义）。核对发现 **main 上仍是 0 个 `waitForFunction`**，即 WB 五个提交
  （`ef41171` / `7cddede` / `8a7a8d9` / `7e72bf8` / `b40f87a`）**都还没进 main**；
  已告知 AG 集成时直接用这两个 commit，别重复修该文件。
- **实际缺口核对（未凭记忆补页面）**：「日期与时间」只有搜索池一条 `pushUnimplemented`（`SettingsApp.vue:352`）
  与搜索建议词（`SettingsSearch.vue:23`）；「系统/通用」兜底页没有该行；`dateTime/**`、`system/**`、
  `general/**`、`dateTimeStore.js`、`pages/dateTime.js` 全不存在；`spec/captures/` 在 main 上尚无文件。
  ⇒ 现在点进去是占位页，其余全部标 unknown。
- **已产出**：`docs/reviews/SET-WB-01-capture-request.md` —— 第一条链路（入口→主页→总开关→依赖联动→
  返回状态保持→视觉对照）的逐包 A–F 采集清单，已写给 DSH，每包即交付。
- **本轮 blocker（非权限）**：等 DSH 采集包落盘 + 等 AG 让出 gate 租约，二者未到前不实现页面、不跑重型验证。
- **等待期工作**：只读核对、清单、单个纯逻辑单测（`node --test tests/pipelineTaskBoard.test.js`，不启浏览器）、
  `node --check` 语法核对；不新增业务断言、不降基线。
