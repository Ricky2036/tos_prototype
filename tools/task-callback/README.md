# tools/task-callback

CALLBACK-02 任务级回调闭环入口（生产者报完工 → 只读主控审查 → 严格 JSON 回执 → 消费确认）。

## 入口

- `bin/finish.mjs`：生产者报 done/blocked/review → 生成事件 → 调用只读主控 → 校验回执落盘。
  `node bin/finish.mjs --task <ID> --producer <lane> --status review --commits <sha,...> --artifact <path> [--evidence ...] [--repo <仓库根>] [--event-id <id>]`
- `bin/ack.mjs`：发送方实际读取回执后写消费确认（引用 event_id + 回执摘要，禁止执行回执命令）。
  `node bin/ack.mjs --event <event_id> --summary "<处理说明>" --consumer <lane>`
- `bin/status.mjs`：跨 worktree 共用 ledger 的任务/事件/回执/消费状态一览（只读，不调模型）。
  `node bin/status.mjs [--task <ID>] [--json]`
- `bin/unlock.mjs`：残留锁显式安全恢复。`node bin/unlock.mjs [--force]`（锁含 pid/时间；进程存活且非 --force 拒绝强抢，不靠 TTL）。

## 运行目录（跨 worktree 共用，已 gitignore）

`~/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02/`（主仓根，四个 worktree 共享）。
内含 events/ receipts/ consumed/ ledger.json state.json runs/，以及共享文档 HANDOFF-AG.md / result.md。
默认 `CB02_HOME` 指向该目录；可用环境变量覆盖。

## 当前审批边界（CALLBACK-02）

- 授权：`.claims/C0-wb-callback.json`（main 9726f46）— WB 独立 claim，不挤占 DSH 既有 3 个 `tools/**` 目录。
- 回执契约：delivery(accepted/rejected) 仅代表收件；task_status(complete/incomplete/blocked) 才是验收；
  findings / next_action / requires_user_review / next_task。
- 本轮（CALLBACK-02）无获批后继任务，`next_task` 必须严格为 null，主控返回非 null 直接拒收。
- `delivery=rejected` 保留拒收记录但不算成功（exit 3）、不可被 ack 消费。
- 同 event_id 同内容才去重；同 id 异内容拒绝覆盖（写冲突记录）。
- 共享串行锁 `.lock`（mkdir 原子），持锁跨整个模型调用；锁内写 pid/时间，残留用 `unlock.mjs` 显式释放。
- 源码零 `eval(`/`Function(`：回执仅结构化数据，入口不执行其 `next_action`。

## 测试

`node --test tests/taskCallback.test.js`（stub 注入，不联网、不调真实模型，16 项覆盖 boot/拒收/锁/去重/互斥）。
