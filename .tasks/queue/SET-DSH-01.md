# SET-DSH-01 · 真机保活与 G8 标定及三模块采集

- size: M
- status: doing
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

## 进度

- 2026-11-13 13:52 · **包 A + B 已交付** → `spec/captures/SET-DSH-01-A-B.md`
  - A：入口真实路径 = 设置首页 →「系统」卡片 → SystemDashboardActivity → 「日期与时间」第 2 行
  - B：默认页 9 行完整清单（含 enabled 联动），顺带得到包 C 的「开」态矩阵
- 2026-11-13 14:00 · **包 C + D 已交付**
  - C：两态矩阵（总开关关后日期/时间解除禁用）、时区二级联动、开关几何 43.5×24.1 画布 px
  - D：返回层级（时区列表一次返回）、跨页面重进状态保持 → 需 store 持久化
  - 采集改动的三项已全部恢复原值并 dump 核对
- 待交：E（视觉标定）
