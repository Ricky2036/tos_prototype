# SET-ACC-01 · 设置 → 辅助功能（整模块真机复刻）

- size: L
- status: review
- priority: P0
- claim: C2（+ 本轮新增 `accessibility/**`、`accessibilitySettingsStore.js`、`tests/accessibilityModule.test.js`、`spec/captures/SET-ACC-01-*`）
- owner: workbuddy
- exclusive_files: [
    "src/components/apps/settings/SettingsAccessibility.vue",
    "src/components/apps/settings/pages/accessibility.js",
    "src/components/apps/settings/accessibility/**",
    "src/stores/accessibilitySettingsStore.js",
    "tests/accessibilityModule.test.js",
    "spec/captures/SET-ACC-01-accessibility.md",
    "src/assets/icons/accessibility/illus/**"
  ]
- depends: []
- 验收：
  1. 从设置首页进入辅助功能，菜单树与真机逐项一致（含两处「入口不同、落地同页」）；
  2. 每个子页的控件、默认值与真机一致，开关/单选/时间弹层有真实状态响应；
  3. 户外增强总开关对「支持的功能」三项的置灰联动与真机一致；
  4. 取消/返回/重进链路真实可用，状态经持久化保持；
  5. 单测与构建绿、`gate-merge` 7 步过、全量 e2e 一次通过；
  6. 未取证的深层页面明示缺口，不用 toast / 空 handler 冒充完成。

## 覆盖菜单（真机实测，13 项 + 3 链接）

| 入口 | 落地 | 实现 |
|---|---|---|
| 无障碍 | `Settings$SubSettings`（服务列表） | `AccA11yServices.vue`，10 行与真机同名同值 |
| 录屏 | screenrecorder | `AccScreenRecord.vue`，6 项 + 清晰度/帧率弹层 |
| 截屏 | screencapture | `AccScreenshot.vue`，4 点插图 + 4 开关 |
| 动作与手势 / 智感握姿 | microintelligence SmartGrip | `AccSmartGrip.vue`（两入口一落地） |
| 小窗 / 应用分屏 | ossettingsext Split | `AccSplitScreen.vue`（两入口一落地） |
| 智能侧边栏 | smartpanel MainPlugin | `AccSidebar.vue`，10 行 + 场景助手组 |
| 户外增强 | `SubSettings` | `AccOutdoor.vue` + `AccOutdoorSchedule.vue`（含时间弹层） |
| 晕动舒缓显示 | microintelligence AntiDizzy | `AccMotion.vue` |
| 游戏模式 | smartpanel Proxy | `AccGame.vue`，4 行 |
| 防误触模式 | 行内开关 | 主页唯一开关，蓝色，默认开 |
| 你可能想找 | 应用双开 / 防偷窥 / 数字健康 | 数字健康走主壳路由；前两项为缺口页 |

## 交付记录（workbuddy · 2026-11-13/14）

- 分支/提交：`workbuddy/lane` @ `b28bc97`
- 真机取证：`159467059A001123`（Infinix X6878 / Android 17），2026-11-13 23:32–23:45，租约 `tos-workbuddy/.device-lock`，采完立即释放并还原设备（防误触回开、总开关回关、定时开启回已关闭）
- 证据：`spec/captures/SET-ACC-01-accessibility.md`（13 行主页表 + 9 子页结构 + 户外两态矩阵 + 定时开启 + 9 条 unknowns）；整屏图本地 `.local-evidence/SET-ACC-01/shots/`
- 测试：`tests/accessibilityModule.test.js` **15/15 PASS**；全量单测 966 cases
- 门禁：`node scripts/gate-merge.mjs` **PASS 7 步**（G3a 46.0s / G3b 14.5s / Gspec / Gtask / Gclaim / G5 / G7）
- 全量 e2e：`node scripts/run-e2e.mjs --all --port 5555` → **14 套 / 654.0s / 失败 0 套**（settings-group3 179、digital-health 151、dnd 56 等全绿）
- 浏览器走查（5555 --strictPort）：设置首页 → 辅助功能 → 9 个子页逐个进出 → 户外两态 → 定时开启 → 时间弹层取消 → 返回主页 → 防误触切换 → 退出到设置首页 → 重进，`aria-checked=false` 保持（21 张截图在 `/tmp/acc01/web/`）
- 未完成（明确列出，不计入完成）：
  - 无障碍各服务详情页（第三方 + 权限）
  - 截屏插图第 3/4 页、小窗/应用分屏插图第 2 页、侧边栏第 2/3 页、游戏第 2 页、晕动第 2–4 页的画面
  - 智能侧边栏的浮标设置 / 中转站 / 可用的应用 / 更多功能；游戏模式的游戏管理 / XArena
  - 录屏清晰度、帧率的真实控件形态（现按底部单选弹层实现，档位为同族候选）
  - 你可能想找：应用双开 / 防偷窥 落地页
- 已知视觉差异：带副标题的行比真机高约 12 CSS px（行高由共享 `ListCell` 决定，本轮未改共享组件）；主页 hero 卡高度较真机偏大；卡片间距与真机差 2–4 px。均需 Integrator 同意后再动共享组件。

## 给 Integrator 的接线需求

1. 首页入口已存在（`SettingsApp.vue` 硬编码 `push('accessibility')`），**无需改主壳**
2. 搜索池已由 `pages/accessibility.js` 自声明（11 项，action 由主壳注入），无主壳 diff
3. 若同意把 `accessibility/**` 纳入 C2，请在 `.claims/C2.json` 追加（本轮按用户授权先实现，登记待补）
