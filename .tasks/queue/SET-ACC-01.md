# SET-ACC-01 · 设置辅助功能全链路真机复刻

- size: L
- status: ready
- priority: P1
- claim: C2
- owner: Workbuddy
- branch: workbuddy/lane
- exclusive_files: [
    "src/components/apps/settings/SettingsAccessibility.vue",
    "src/components/apps/settings/pages/accessibility.js",
    "src/components/apps/settings/accessibility/**",
    "src/stores/accessibilityStore.js",
    "tests/accessibilitySettings.test.js"
  ]
- depends: []
- 验收标准：
  1. 页面自声明：`pages/accessibility.js` 导出规范元数据，通过 glob 自动注册进入设置；
  2. 严格基于真机证据还原辅助功能全部层级与叶子页；
  3. 专属 store 与单测 `tests/accessibilitySettings.test.js` 全绿；
  4. 浏览器端视觉走查与真实返回栈无死角。
