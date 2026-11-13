# LEAD-WB-003 · 真实任务回调通道正式接入

- size: S
- status: doing
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
