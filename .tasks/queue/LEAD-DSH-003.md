# LEAD-DSH-003 · 最小真实回调通道建设

- size: S
- status: doing
- priority: P0
- claim: C0-infra
- owner: DSH
- exclusive_files: [
    "tools/agent-bridge/**",
    "tests/agentBridge*.test.js"
  ]
- depends: []
- 验收：
  1. 实现 DSH 与 Codex/各端之间的最小真实回调通道（tools/agent-bridge/**）；
  2. 每次完成/阻塞/待验收报备携带任务、SHA、验证结果与唯一 event ID；
  3. 严格基于真实接口连通性，不得伪造收到回执；
  4. 对应单测通过。
