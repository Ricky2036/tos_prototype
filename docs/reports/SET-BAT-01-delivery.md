# SET-BAT-01 交付报告 · 设置 → 电池与省电

- 分支：`dsh/lane`
- 代码提交：`beb6935`（实现）+ `4da6685`（既有断言对齐新结构）
- 基线同步：已把 `origin/main`（`461af32`）合入本 lane → 合并提交 `63725b5`；唯一冲突 `.tasks/inbox/codex.md`，两边记录都保留
- 远端：未 push（交给 AG 逐包集成，9999 终验）
- 端口：`7777`（`--strictPort`，本 lane 既定端口，未占 9999/1111/5555/8888）
- 设备：Infinix X6878 / Android 17 / `159467059A001123`；租约 23:17–23:32 独占采集，采完已释放并还原（均衡模式、息屏 30s、`stay_on_while_plugged_in 0`）

## 一、精确文件（全部在本 lane 内，不碰共享面）

| 类型 | 路径 |
|---|---|
| 页面（重写） | `src/components/apps/settings/SettingsBattery.vue` |
| 三级页 | `src/components/apps/settings/battery/BatteryPowerSaving.vue` |
| | `battery/BatterySaverIntro.vue` |
| | `battery/BatteryCharging.vue` |
| | `battery/BatteryWirelessPosition.vue`（全屏模态） |
| | `battery/BatteryReverseWireless.vue` |
| | `battery/BatteryBypassCharging.vue` |
| | `battery/BatteryHealth.vue` |
| | `battery/BatteryAppUsage.vue` |
| 图表/数据 | `battery/BatteryLevelChart.vue` · `battery/BatteryActivityChart.vue` · `battery/batteryData.js` |
| Store | `src/stores/batteryStore.js`（localPrefs 持久化，key `tos.settings.battery.v1`） |
| 测试 | `tests/batterySettings.test.js`（15 例运行时断言） |
| | `tests/settingsFeatureGroup.test.js`（旧电池页断言对齐新结构，用例数不变） |
| 契约/证据 | `spec/captures/SET-BAT-01-battery.md` |

**未改共享文件**：`SettingsApp.vue`（沿用现有 `view === 'battery'` 接线与搜索池）、`systemStore`/`controlStore`、`src/styles/tokens.css`/`global.css`、`pages/*.js`。因此 AG 集成时不需要为接线再改主壳。

## 二、菜单覆盖（真机 → 实现）

完整真机菜单树、逐页行清单、实测交互与 unknown 见 `spec/captures/SET-BAT-01-battery.md`。实现覆盖：

- 首页：电量百分比（取 `controlStore.battery`）/ 剩余时间（按真机三档系数估算）/ 充电胶囊；电池模式双瓷砖 + 超级省电行（同卡）；电池设置三入口；使用情况（距上次充满 + 24h/7d 分段 + 电量/用电量图 + 活动时长图）；耗电占比排行（5 行 + 查看更多展开 4 行）；其他应用耗电；脚注
- 省电管理：自动开启省电模式（开时滑杆可用、关时置灰）/ 自动开启电量 5% / 自动退出省电模式 / 60Hz / 深色主题 / 15 秒息屏 / 了解详情 → 省电模式介绍 / 系统优化 → 睡眠待机优化
- 充电设置：默认充电速度两单选 / 三方充电器提示 / 无线充电感应位置（全屏模态，× 关闭回充电页）/ 无线反向充电（子页 + 开关）/ 旁路充电（子页 + 开关 + 有线说明）
- 电池健康：最大电池容量 99% / 如何延长电池使用寿命（说明层）/ 充电保护三单选 / 自定义上限（80/85/90/95）
- 应用耗电详情：近 24 小时四项 / 耗电行为控制两单选（逐 app 持久化）/ 强行停止应用（确认层 + toast + 行归零）
- 返回栈：首页 → 三级页 → 四级页逐层退；侧滑返回在 `settingsNav` 存在时下沉注册；重进/刷新后模式与开关保持（localPrefs）

## 三、证据

- 真机：`.local-evidence/SET-BAT-01/`（PNG + uiautomator XML，本地不入库；索引见契约文件）
- 浏览器（403×881 @3x，与真机同画布）：`web/01-battery-home.png`、`02-mode-info`、`03/04-power-saving`、`05-charging`、`06-wireless-position`、`07-reverse-wireless`、`08-battery-health`、`09-seven-days`、`10-app-detail`、`11-activity-24h`、`12-activity-7d`、`13-back-to-settings`、`14-supersaver-confirm`、`15-supersaver-cancelled`
- 逐屏对照结论：导航/卡片圆角与底色、模式瓷砖（选中蓝描边、图标保持深色）、超级省电行、三子页行序与文案、无线模态（压暗 + 大圆闪电 + 底部 ×）、反向无线示意图与绿色无线充图标、健康页 99%/三单选、应用详情四行 + 红字强行停止、7 天「用电量/日均…」与堆叠柱配色（息屏深蓝在下、亮屏亮蓝在上）均已对齐；差异见第五节

## 四、测试结果

| 项 | 结果 |
|---|---|
| 本页单测 | `node --test tests/batterySettings.test.js` → **15/15 PASS**（含 store 纯逻辑 + 真实渲染/点击/返回栈/持久化） |
| 既有断言对齐 | `tests/settingsFeatureGroup.test.js` 电池页用例重写为新结构，5/5 PASS，用例数未减 |
| 全量单测 | **978/978 PASS**（gate G3a，56.4s） |
| 生产构建 | **PASS**（10.3s） |
| `gate:merge` | **7 步全过**（G3a/G3b/Gspec/Gtask/Gclaim/G5/G7） |
| 死入口 G1 | **0 个**（`scripts/audit-settings-dead-entries.mjs`） |
| G5 裸样式 | advisory：新增 14 处硬编码（设备实测 16px 卡片圆角/阴影，未套 22px 的 `--radius-card`；不阻断） |
| 全量 E2E（`--all`，串行，7777） | 14 套跑一轮：**12 套全过**；`recorder` 229/230、`phone` 67/68 两套失败（均与电池无关）。按交接页纪律单套复跑：`recorder` **230/230 PASS**（87s）、`phone` **100% PASS**（28s）→ 判定为机器负载导致的假红，非本单回归 |

## 五、已知差异 / 未完成（不宣称 100%）

1. **深色模式**：真机切省电模式会联动全局深色主题；本页仍是浅色固定配色（全局主题属 `controlStore` 共享面）。"启用深色主题"只持久化开关状态，不下发全局主题。
2. **超级省电的真正效果**（限制 6 应用、系统性能受限）只做了确认层 + 状态；不改变原型其余功能。
3. **60Hz / 15 秒息屏**只落 store，不联动系统级行为（原型无对应能力）。
4. **推断实现**（真机未采到，已在契约文件列 unknown）：超级省电确认弹窗、强行停止确认弹窗、自定义充电上限选择器、活动时长 ⓘ 说明、如何延长寿命说明层。
5. **排行内容**：真机是 Transsioner/喜马拉雅/抖音/微信/小红书；原型桌面无这些包，按同一结构换成本仓真实应用（TikTok/YouTube/微信/相机/浏览器 + 展开行），百分比与前后台文案沿用真机数量级。
6. **图表数值**为按截图目测的近似序列，非真实电量日志。
7. AG 登记：`ACTIVE_TASKS.md` 尚未出现 SET-BAT-01 行（已两次请求 AG 登记 Base `63725b5`、白名单见第一节）；本轮先按用户授权推进，未改登记文件。

## 六、下一步

1. AG 登记 SET-BAT-01 并逐包集成到 `main`（预计 cherry-pick `beb6935` + `4da6685`，或按文件取）。
2. AG 在 9999 做最终验收（重点：设置首页进入 → 三级页往返 → 重进保持）。
3. 若需要，我可以按 AG 要求在 9999 复跑本页浏览器对照；深色模式与超级省电真实效果需等共享面/产品取舍再定。
