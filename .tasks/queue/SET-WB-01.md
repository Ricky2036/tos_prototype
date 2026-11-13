# SET-WB-01 · 设置系统与日期时间链路深度复刻

- size: M
- status: ready
- priority: P1
- claim: C2 (系统/日期时间扩展)
- owner: Workbuddy
- exclusive_files: [
    "src/components/apps/settings/pages/dateTime.js",
    "src/components/apps/settings/dateTime/**",
    "src/components/apps/settings/system/**",
    "src/stores/dateTimeStore.js",
    "tests/dateTimeSettings.test.js"
  ]
- depends: []
- 验收：
  1. 入口可达，自声明页面通过 glob 自动注册进入设置；
  2. 日期、时间、24小时制、时区切换控件具有真实状态响应与 store 联动；
  3. 严格基于 DSH 交付的日期时间首包 `spec/captures/dateTime/`（采到即启动，不待整批完成）；
  4. 对应单测与针对性验证脚本通过。

## 约束

- 不改 `SettingsApp.vue` 主壳（由 Integrator 单点最小接线）；
- 严格基于 DSH 交付的真机证据确定叶子页与控件边界，未验证项标为 unknown。
