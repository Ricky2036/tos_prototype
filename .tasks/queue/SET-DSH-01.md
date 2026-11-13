# SET-DSH-01 · 真机保活与 G8 标定及三模块采集

- size: M
- status: ready
- priority: P0
- claim: C0-infra
- owner: DSH
- exclusive_files: [
    "spec/**",
    "scripts/gate-geometry.mjs",
    "tests/pipelineGeometry.test.js"
  ]
- depends: []
- 验收：
  1. 手机 USB 供电保活，完成显示、声音、无障碍三页 G8 标定（`node scripts/gate-geometry.mjs` 偏差 < 0.5px）；
  2. 提取并交付「日期与时间」、「安全和紧急情况」、「用户与账号」的真机 XML dump 与视觉快照数据包，置于 `spec/captures/`，每包即交付。

## 范围与约束

- 独占真机 ADB 采集权，其他 lane 不连真机，仅消费采集包；
- 采集包内包含控件层级、bounds、文本、真机截图及未知项标记（不猜样式）。
