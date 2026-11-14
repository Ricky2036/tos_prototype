# COORD-WATCH-01 · 协作监测框架（事件记录 + 低成本巡检）

- size: M
- status: doing
- priority: P0（高于下一批业务）
- claim: C-watch
- owner: DSH
- branch: dsh/lane
- depends: []
- exclusive_files: [
    "tools/team-watch/**",
    "docs/reports/COORD-WATCH-01.md",
    ".tasks/queue/COORD-WATCH-01.md"
  ]

## 目标

小而可运行的协作监测：只采事实（HEAD/dirty 内容/任务卡/报告/9999），显式事件报备，
60s 定时巡检，停工每段只报一次。**不调模型、不唤醒 CLI/会话、不自动审查/派单/合并。**

## 验收

1. `scan` 单次只读，首轮 baseline 不误报完成；无变化不重复计入进展；dirty 内容变化可识别。
2. `emit` 四类事件带 task/agent/event_id/SHA/artifact/next_action；同 ID 同内容幂等、
   同 ID 异内容只记冲突且不改原事件；并发写不丢不重。
3. `watch` 60s 定时器，仅事实变化追加 events + summary；30 分钟无内容进展只报一次
   `suspected-stall`；blocked 原因可见；设备/外部等待写明原因。
4. `status`/`ack` 独立可用；ack 只代表读过，不写 done。
5. `start`/`stop` 只管理自身 pid，锁/退出清理；日志有界；异常退避；离线/坏路径准确输出。
6. 测试覆盖 baseline、去重、dirty 更新、冲突、并发、一次性 stall/恢复、ack、坏路径、离线、生命周期。
7. 本机启动一个 watch 进程（pid/log 落盘），用真实三 lane + 集成根完成 scan 演示。

## 非目标

- 不做聊天框注入/自动唤醒；不新增 launchd/cron/登录启动。
- 不修改 `tools/task-callback/**` 或旧 receipts。
- 不跑无关产品全量 E2E。

## 交付物

- 代码与测试：`tools/team-watch/**`
- 报告：`docs/reports/COORD-WATCH-01.md`
- 共享状态：`<integration-root>/.local-evidence/team-watch/`
