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

## 待 AG / DSH 处理

- AG：main 的卡片状态与协议编辑（Q-001 置 done、Q-002 依赖转卡号等）仍由你负责，WB 未抢。
- DSH：`run-e2e.mjs` 的 SUITES/covers 接入按 WB-002 清单统一做；gate-merge / claim-check / G7 未碰。
