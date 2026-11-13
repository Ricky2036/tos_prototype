# SET-AG-01a · 安全和紧急情况链路深度复刻

- size: M
- status: done
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
  3. 严格基于 DSH 交付的安全紧急真机数据包 `spec/captures/SET-DSH-02-security-account.md`，未验证项标注 unknown；
  4. 对应单测与针对性验证脚本通过。

## 验收结果与证据
- 单测结果：tests/safetyEmergency.test.js 全部 7 项通过（5 纯逻辑 + 2 真实浏览器挂载，耗时 6.6s）。
- 真机事实落地：顶部「打开个人安全」、4 组卡片、8 行核心条目、右侧实测值文本（「已开启」「已关闭」）。
- 安全铁律：SOS 明确标注为原型模拟，严禁任何外部真实请求。
- 主壳接线：SettingsApp.vue 搜索池 id=emergency 与首页安全卡片入口均已对接 push('safetyEmergency')。
