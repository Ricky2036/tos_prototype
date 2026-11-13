# LEAD-WB-003 · 真实任务回调通道正式接入

- size: S
- status: review
- priority: P0
- claim: C0-wb-callback
- owner: workbuddy
- exclusive_files: [
    "tools/task-callback/**",
    "tests/taskCallback.test.js"
  ]
- depends: []
- 验收：
  1. 正式接入任务回调通道（tools/task-callback/** 与 tests/taskCallback.test.js）；
  2. 基于 .local-evidence/callback-pilot/ 真实 4 轮回调试点成果；
  3. 提供标准化发送接口与本地审查契约，支持生产者结构化报备；
  4. 对应测试全绿，通过门禁检查。

## 交付记录（workbuddy · 2026-11-13）

- 分支/提交：`workbuddy/lane` @ `57ab3cf`（`tools/task-callback/{README.md,bin/{finish,ack,status,unlock}.mjs,tests/stub-codex.mjs}` + `tests/taskCallback.test.js`，815 行）
- 验收1：入口已落在正式路径，授权 `.claims/C0-wb-callback.json`（main `9726f46`），未占用 `tools/**` 其他所有权
- 验收2：基于 `callback-pilot` 4 轮试点，含 boot 建主控 + SET-WB-01 真实审查 + ack + status
- 验收3：`finish/ack/status/unlock` 四个标准化入口；回执契约 delivery/task_status/findings/next_action/requires_user_review/next_task 强校验，`delivery` 与 `task_status` 分列，`next_task` 非 null 拒收
- 验收4：`node --test tests/taskCallback.test.js` → **16/16 PASS**（8.5s，stub 不联网）；`node scripts/gate-merge.mjs` → **PASS 7 步**（30.4s，含 G3b 生产构建与 G7 断言棘轮）
- 跨 lane 验证：AG 以 `--repo tos-antigravity` 复用同一主控 thread 完成 SET-AG-01a 报备 + ack（event `cbfafd4e-…`），证明第二生产者可用
- 证据：主仓 `~/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02/`（events/receipts/consumed/ledger/state/HANDOFF-AG.md）；报告 WB worktree `.local-evidence/callback-02/result.md` v2
- 待 Integrator：合入 `main` 并在 `ACTIVE_TASKS.md` 更新本卡为完成（该表为集成方所有，本 lane 未改）
- 已知风险：ledger/锁为文件级实现，codex 进程被 kill 时 `.lock` 需 `unlock.mjs` 释放；mkdir 锁跨 NFS 无原子性保证
