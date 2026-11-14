# COORD-WATCH-01 · 协作监测框架：只读scan+共享事件队列+去重冲突隔离+watch

- size: M
- status: doing
- priority: P1
- claim: C-watch
- owner: DSH
- branch: dsh/lane
- exclusive_files: [
    "tools/team-watch/**",
    "docs/reports/COORD-WATCH-01.md",
    ".tasks/queue/COORD-WATCH-01.md"
  ]
- depends: []
- 验收标准：
  1. 实现只读 scan + 共享事件队列 + 去重/冲突隔离 + watch 工具；
  2. 不调用模型/CLI，不自动派单或合并，不动旧 callback/receipts；
  3. 各模块（含 tests）及单测通过；
  4. 产出交付报告 docs/reports/COORD-WATCH-01.md。
