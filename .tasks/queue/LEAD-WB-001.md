# LEAD-WB-001 · 任务板与拉取式队列对齐

- size: M
- status: done
- claim: C0-infra
- owner: workbuddy
- depends: []
- files: [scripts/gen-task-board.mjs, scripts/lib/task-board.mjs, tests/pipelineTaskBoard.test.js]
- 验收：`node --test tests/pipelineTaskBoard.test.js` 全绿；`node scripts/gen-task-board.mjs` 退出码 0 且输出含 Q-001/Q-002/Q-003

## 背景

`gen-task-board.mjs` 只扫 `.tasks/*.md` 顶层、只认中文「状态/簇/Owner」，
结果把 `ROADMAP.md` 当 Active 任务，而 `.tasks/queue/` 的三张新卡一张都看不到。

## 做什么

1. `.tasks/queue/*.md` 作为事实源，旧卡作为历史只读保留；ROADMAP/TEMPLATE/占位标题排除
2. 统一状态映射（ready/doing/blocked/done ← 中英旧值），完成证据从 ACTIVE_TASKS 的 Merged 行提取
3. 校验重复 ID / doing 无 owner / 依赖缺失 / 依赖未完成却 ready / 同文件互斥冲突（不同文件不误报）
4. 保留 GENERATED 安全标记，禁止整份覆盖手工表；坏输入明确报错且拒绝 --write

## 进展（Workbuddy）

- 已实现：`scripts/lib/task-board.mjs`（纯函数层）+ 重写 `scripts/gen-task-board.mjs` CLI + `tests/pipelineTaskBoard.test.js`（17 条）
- 真实数据验收：Q-001 显示 `done（完成记录，卡片待更新）` 而非 ready；Q-002 依赖列显示 `W2-001 ✓`；
  队列卡 owner/status/claim 完整；ROADMAP/TEMPLATE 不在表里；6 张旧卡保留在历史段；`validateTasks` 零问题
- 未碰：`gate-merge.mjs` / `claim-check.mjs` / G7 / `run-e2e.mjs`（仍归 DSH）
- 未碰：ACTIVE_TASKS.md / ROADMAP.md / TEMPLATE.md / roles-v2.md（AG 负责 main 的卡片状态与协议编辑）

## 最终验收（Workbuddy）

- `node --test tests/pipelineTaskBoard.test.js` → **17 / 17**
- `node scripts/gate-merge.mjs` → **7 步全过**（G3a / G3b / Gspec / Gtask / Gclaim / G5 / G7）
- 全量单测 **894 / 894 / 0 fail**（基线 872，未降基线、未删断言）
- 浏览器核验：生成器真实数据输出 Q-001=done、Q-002 依赖 `W2-001 ✓`、ROADMAP/TEMPLATE 不在表内；
  `--write` 无标记拒绝覆盖、有标记只替换区块且手工历史逐字保留、坏输入拒绝落盘
- commit `ef41171`；稳定性配套 `8a7a8d9` / `7e72bf8`（本机 load 47+ 导致浏览器固定 sleep 假红，改条件等待，不删断言）

## 不许做什么

- 不许整份覆盖 ACTIVE_TASKS.md；不许删断言降基线换绿；不许改别人的门禁脚本
