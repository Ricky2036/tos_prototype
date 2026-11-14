# tools/team-watch —— 协作监测（事件记录 + 低成本巡检）

> 只采事实。**不调用模型、不唤醒 CLI/会话、不自动审查、不派单、不合并、不抢任务锁。**
> 事件与唤醒是两件事：事件写进共享队列；谁会读它由原生定时巡检/人决定，本工具不承诺能唤醒当前 ChatGPT。

## 一句话用法

```bash
# AG / WB / DSH 完工或受阻时报一条（同 event_id 同内容幂等，异内容只记冲突、不改原事件）
node tools/team-watch/watch.mjs emit --task SET-BAT-01 --agent dsh --event delivery-ready \
  --sha 40bb303 --artifact docs/reports/SET-BAT-01-delivery.md --next-action "等 AG 集成到 9999"
```

`--event` 只接受：`delivery-ready` / `blocked` / `test-failed` / `integrated`。
不知道 SHA 就写 `unknown`；`--event-id` 省略时默认 `<task>:<event>:<sha>`。

## 命令

| 命令 | 作用 |
|---|---|
| `scan [--json]` | 单次只读扫描 3 条执行 lane + 集成根：HEAD / dirty 内容哈希 / 任务卡 status / docs/reports / 9999 HTTP；与上轮快照对比。**首轮只建 baseline，不推断完成** |
| `watch [--interval 60000] [--stall-ms 1800000] [--once]` | 普通 Node 定时器循环 scan；只有事实变化才追加 `events.jsonl` 与 `summary.json/md`；每段停工只发一次 `suspected-stall` |
| `status [--json]` | 只读查看快照、事件、已读回执、watch 进程、9999 |
| `ack --event <id> --by <lane> [--note "…"]` | 标「已读」。**只代表读过，不代表验收完成**；同一人重复 ack 幂等 |
| `start [--interval]` / `stop` | 只管理本工具自己的 pid（写 `watch.pid`/`watch.log`）；stop 校验 cmdline，不做全局 kill |
| `emit ...` | 见上；冲突时退出码 3，原事件与内容哈希保持不变 |

## 共享运行目录（跨 worktree）

从 `git rev-parse --git-common-dir` 解析，默认：

```
<integration-root>/.local-evidence/team-watch/
├── snapshot.json      # 上一轮事实快照（含 dirty 内容哈希、任务卡、端口）
├── summary.json/.md   # 简洁摘要（只给事实，不写建议）
├── events.jsonl       # 事件队列（append-only）
├── conflicts.jsonl    # 同 event_id 异内容的冲突记录（不覆盖原事件）
├── acks.jsonl         # 已读回执
├── watch.pid / watch.log / .events.lock / watch.lock
```

四个 worktree 共用；`.local-evidence/` 已被 gitignore。换机/测试用 `--config <json>` 或 `TEAM_WATCH_CONFIG` 覆盖
`{ home, stallMs, intervalMs, httpTimeoutMs, roots: [{ id, agent, role, root, port }] }`。

默认 root 从 `git worktree list` 按分支识别：`dsh/lane`、`workbuddy/lane`、`antigravity/lane`、`main`（integration，9999）。

## 判定规则

- **进展** = HEAD、dirty 文件**内容**、任务卡 status/owner、`docs/reports` 任一变化。
  只看 commit 会把「在改但没提交」误判成停工；dirty 路径/数量不变但内容变了同样算进展。
- **端口上下线不算进展**（服务重启不是内容产出），只进摘要。
- **停工** = 内容进展时长 ≥ `stallMs`（默认 30 分钟）。每段只发一次 `suspected-stall`，有进展后重置；
  快照里保留 `stall` 供 status 展示。blocked 卡的显式原因会进入事件/摘要。
- **首轮 baseline** 不产生任何事件，避免把「第一次看到」当成「刚完成」。
- **ack** 不写 done：验收结论只能由人/AG 按流程给出。

## 幂等、并发与锁

- `emit` 的读-判-写全程持 `.events.lock`；多个 worktree 并发 emit 不会产生重复 `event_id`。
- 同 `event_id` + 同内容 → `duplicate` 返回原记录；同 `event_id` + 异内容 → 写 `conflicts.jsonl`，**原事件不变**。
- 所有落盘为 `临时文件 + rename`；JSONL 追加在锁内完成。
- 本工具只锁自己的共享目录，**不碰** `.claims/` 或任何任务锁，也不会自动取单。

## 生命周期与日志

- `start` 用 `spawn(detached)` 起一个 `watch` 子进程，写 `watch.pid`（pid/启动时间/每次 tick 时间）。
- `stop` 只对 `watch.pid` 里的进程发 SIGTERM，并校验 `ps` cmdline 含 `team-watch/watch.mjs`；不匹配就拒绝。
- `watch.log` 单文件 2MB 上限，滚动为 `watch.log.1`（只留一份）。
- 扫描/HTTP 失败按指数退避重试；端口离线在摘要里写 `DOWN + 原因`，不崩。
- **不提供** launchd / cron / 登录启动配置；定时由外部原生巡检（每小时）或人执行 `scan`/`status`。

## 测试

```bash
node --test tools/team-watch/test/teamWatch.test.js
```

11 例：baseline、无变化去重、dirty 内容变化、冲突不覆盖、并发 emit、停工只报一次 + 恢复、
blocked 原因入摘要、ack 不标 done、坏路径、离线端口、start/stop 只管理自身 pid。
全部用临时 git 仓库 + 临时 home，不写生产队列。

## 不做什么

- 不实现「往聊天框自动输入」的脆弱唤醒，也不承诺事件能唤醒当前会话；
- 不自动审查/派单/合并，不修改 `tools/task-callback/**` 或旧 receipts；
- 不统计 token、不做平台化看板；需要历史时直接读 `events.jsonl`/`snapshot.json`。
