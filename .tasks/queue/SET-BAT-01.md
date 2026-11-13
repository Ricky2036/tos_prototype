# SET-BAT-01 · 设置电池与省电全链路真机复刻

- size: L
- status: doing
- priority: P1
- claim: C-bat
- owner: DSH
- branch: dsh/lane
- exclusive_files: [
    "src/components/apps/settings/SettingsBattery.vue",
    "src/components/apps/settings/pages/battery.js",
    "src/components/apps/settings/battery/**",
    "src/stores/batteryStore.js",
    "tests/batterySettings.test.js",
    "spec/captures/SET-BAT-01-battery.md"
  ]
- depends: []
- 验收标准：
  1. 页面自声明或现有视图分支接线规范；
  2. 严格基于真机证据还原电池与省电全部功能与叶子项；
  3. 专属 store 与单测 `tests/batterySettings.test.js` 全绿，`gate:merge` 7 步全绿；
  4. 浏览器端视觉走查与端口 7777 E2E 验证通过。
