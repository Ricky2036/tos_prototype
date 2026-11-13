# SET-AG-01 · 安全和紧急情况与用户和账号链路复刻（汇总单）

- size: L
- status: blocked
- priority: P1
- claim: C0-a (扩展模块与主壳最小接线)
- owner: Antigravity
- exclusive_files: [
    "src/components/apps/settings/pages/safetyEmergency.js",
    "src/components/apps/settings/pages/accounts.js",
    "src/components/apps/settings/safety/**",
    "src/components/apps/settings/accounts/**",
    "src/stores/safetyStore.js",
    "src/stores/accountsStore.js",
    "tests/safetyEmergency.test.js",
    "tests/accountsSettings.test.js"
  ]
- depends: [SET-AG-01a, SET-AG-01b]
- 验收：子单 SET-AG-01a 与 SET-AG-01b 全部验收通过，主壳单点最小接线完成，受影响单测与 E2E 绿灯。

## 拆解说明

根据 2026-11-13 Codex 进度核查决策，原 L 单拆分为两个独立的单模块子单：
- **SET-AG-01a**（M）：安全和紧急情况（依赖 DSH 安全紧急真机采集包）；
- **SET-AG-01b**（S/M）：用户与账号（依赖 DSH 账号真机采集包，Google 暂缓）；
采到即直接启动实现，不再待整批完成。
