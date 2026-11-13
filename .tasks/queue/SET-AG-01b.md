# SET-AG-01b · 用户与账号链路深度复刻

- size: S
- status: ready
- priority: P2
- claim: C0-a (扩展模块与主壳最小接线)
- owner: Antigravity
- exclusive_files: [
    "src/components/apps/settings/pages/accounts.js",
    "src/components/apps/settings/accounts/**",
    "src/stores/accountsStore.js",
    "tests/accountsSettings.test.js"
  ]
- depends: []
- 验收：
  1. 入口可达，返回正确，采用自声明 glob 注册进入设置，主壳单点最小接线；
  2. 支持本地多账号展示与状态管理，**严禁修改真实系统账户，Google 模块暂缓**；
  3. 严格基于 DSH 交付的用户账号真机数据包 `spec/captures/accounts/`；
  4. 对应单测与针对性验证脚本通过。
