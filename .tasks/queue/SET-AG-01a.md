# SET-AG-01a · 安全和紧急情况链路深度复刻

- size: M
- status: ready
- priority: P1
- claim: C0-a (扩展模块与主壳最小接线)
- owner: Antigravity
- exclusive_files: [
    "src/components/apps/settings/pages/safetyEmergency.js",
    "src/components/apps/settings/safety/**",
    "src/stores/safetyStore.js",
    "tests/safetyEmergency.test.js"
  ]
- depends: []
- 验收：
  1. 入口可达，返回正确，通过自声明 glob 注册进入设置；
  2. 紧急联系人、求救信息、医疗信息具有真实交互与状态响应，**严禁触发真实 SOS**；
  3. 严格基于 DSH 交付的安全紧急真机数据包 `spec/captures/safety/`，未验证项标注 unknown；
  4. 对应单测与针对性验证脚本通过。
