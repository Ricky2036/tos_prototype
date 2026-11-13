# LEAD-AG-002 · 架构决策与角色规范落地

- size: M
- status: in_progress
- priority: P1
- claim: C0-infra
- owner: Antigravity
- exclusive_files: [
    "docs/decisions.md",
    "docs/roles-v2.md",
    "AGENTS.md",
    ".agent-assignments/codex.md",
    ".claims/**",
    ".tasks/**"
  ]
- depends: []
- 验收：`docs/decisions.md` 落盘，协议冲突条款清除，锁状态更新（SettingsApp 归还，WB 白名单授权，DSH 门禁与真机独占登记），队列卡片与收件箱完整同步。

## 进展

1. 落盘 `docs/decisions.md`，明确用户授权 Codex 全面负责规划、审查与派单。
2. 更新 `docs/roles-v2.md`、`AGENTS.md`、`.agent-assignments/codex.md`，去除直接写 main 的表述，规范 Antigravity 独占主干集成。
3. 锁与认领：更新 `.claims/C2.json` 释放 `SettingsApp.vue` 并归还 Integrator；更新 `.claims/C0-a.json`；在 `.agent-assignments/ACTIVE_TASKS.md` 登记 WB 白名单临时授权与 DSH 门禁独占。
4. 队列更新：关闭 Q-001，解开 Q-002 依赖并注明真实真机前置，更新 Q-003 白名单。
