# SET-AG-01 · 安全和紧急情况与用户和账号链路复刻

- size: L
- status: ready
- priority: P1
- claim: C0-a (扩展模块与最小接线)
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
- depends: [LEAD-AG-001 (基建收口), SET-DSH-01 (消费对应采集包)]
- 验收：
  1. 入口可达，返回正确，采用自声明 glob 注册，主壳仅做单点最小接线；
  2. 紧急联系人、求救信息、医疗信息具有响应与交互，**严禁触发真实 SOS**；
  3. 用户账号支持本地多身份展示与状态管理，**严禁修改真实系统账户，Google 模块暂缓**；
  4. 针对性受影响 E2E 与单测通过。
