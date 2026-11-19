# 全页面契约验收基线（10 页）

- 生成时间：2026-11-18T12:22:07.373Z
- 仓库：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh` · 分支 `dsh/lane` · HEAD `9145468ad2594f2582eecae1f20caa5b84730811`
- 构建：`/tmp/dist-head`
- 服务：`http://127.0.0.1:7812/`
- 判决：`tools/accept/accept.mjs`（容差未放宽；spec 未改；10 页全跑，不跳页）

## 一行结论

**10 页里 0 页 0 fail / 10 页有 fail / 0 页环境错误**

## 逐页判决

| # | pageId | 节点数 | pass | fail | missing | extra | 主要失败原因 top3 | scale | 状态 | verdict |
|---|--------|-------:|-----:|-----:|--------:|------:|------------------|------:|--------|---------|
| 1 | `settings/dateTime` | 11 | 0 | 11 | 0 | 0 | geometry-out-of-tolerance×11 | 1.0000 | **fail** | [`reports/accept/baseline/settings-dateTime/verdict.json`](settings-dateTime/verdict.json) |
| 2 | `settings/dateTime/date-time-timezone-picker` | 14 | 0 | 8 | 6 | 0 | geometry-out-of-tolerance×8；not-found-in-dom×6 | 1.0000 | **fail** | [`reports/accept/baseline/settings-dateTime-date-time-timezone-picker/verdict.json`](settings-dateTime-date-time-timezone-picker/verdict.json) |
| 3 | `settings/safetyEmergency` | 13 | 0 | 13 | 0 | 0 | geometry-out-of-tolerance×13 | 1.0000 | **fail** | [`reports/accept/baseline/settings-safetyEmergency/verdict.json`](settings-safetyEmergency/verdict.json) |
| 4 | `settings/system` | 13 | 2 | 11 | 0 | 0 | pitch-drift-out-of-tolerance×6；geometry-out-of-tolerance×2；pitch-anchor-out-of-tolerance×1 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system/verdict.json`](settings-system/verdict.json) |
| 5 | `settings/system/system-developer-options` | 13 | 0 | 11 | 2 | 1 | geometry-out-of-tolerance×11；not-found-in-dom×2；extra:unmatched-row×1 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system-system-developer-options/verdict.json`](settings-system-system-developer-options/verdict.json) |
| 6 | `settings/system/system-enhanced-services` | 7 | 0 | 7 | 0 | 0 | geometry-out-of-tolerance×7 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system-system-enhanced-services/verdict.json`](settings-system-system-enhanced-services/verdict.json) |
| 7 | `settings/system/system-language` | 14 | 0 | 13 | 1 | 0 | geometry-out-of-tolerance×13；not-found-in-dom×1 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system-system-language/verdict.json`](settings-system-system-language/verdict.json) |
| 8 | `settings/system/system-navigation` | 9 | 0 | 9 | 0 | 0 | geometry-out-of-tolerance×8；duplicate-match(also:row:学习手势)×1 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system-system-navigation/verdict.json`](settings-system-system-navigation/verdict.json) |
| 9 | `settings/system/system-power-button` | 6 | 0 | 5 | 1 | 1 | geometry-out-of-tolerance×5；not-found-in-dom×1；extra:unmatched-row×1 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system-system-power-button/verdict.json`](settings-system-system-power-button/verdict.json) |
| 10 | `settings/system/system-schedule-power` | 8 | 0 | 7 | 1 | 1 | geometry-out-of-tolerance×7；not-found-in-dom×1；extra:unmatched-row×1 | 1.0000 | **fail** | [`reports/accept/baseline/settings-system-system-schedule-power/verdict.json`](settings-system-system-schedule-power/verdict.json) |

## scale（壳宽 360 → 画布换算）

| pageId | shell 宽×高 | scale | 判定 |
|--------|-------------|------:|------|
| `settings/dateTime` | 360×788 | 1.0000 | 正常 |
| `settings/dateTime/date-time-timezone-picker` | 360×788 | 1.0000 | 正常 |
| `settings/safetyEmergency` | 360×788 | 1.0000 | 正常 |
| `settings/system` | 360×788 | 1.0000 | 正常 |
| `settings/system/system-developer-options` | 360×788 | 1.0000 | 正常 |
| `settings/system/system-enhanced-services` | 360×788 | 1.0000 | 正常 |
| `settings/system/system-language` | 360×788 | 1.0000 | 正常 |
| `settings/system/system-navigation` | 360×788 | 1.0000 | 正常 |
| `settings/system/system-power-button` | 360×788 | 1.0000 | 正常 |
| `settings/system/system-schedule-power` | 360×788 | 1.0000 | 正常 |

**scale 全部正常：** 10 页壳宽均为 360，scale = 1.0000。

## 跨页信号（纯统计，不解释）

- 判决节点合计：108（pass 2 / fail 95 / missing 11）；额外行 extra 合计 3
- 失败原因分布：geometry-out-of-tolerance×85；not-found-in-dom×11；pitch-drift-out-of-tolerance×6；pitch-anchor-out-of-tolerance×1；card-offset-out-of-tolerance×1；center-out-of-tolerance×1；duplicate-match(also:row:学习手势)×1
- 多页同时红的节点（≥2 页，前 6）：
  - `header:title`（header-title）10 页：`settings/dateTime`、`settings/dateTime/date-time-timezone-picker`、`settings/safetyEmergency` 等，Δy +13.7~+15.7
  - `header:back`（header-back）10 页：`settings/dateTime`、`settings/dateTime/date-time-timezone-picker`、`settings/safetyEmergency` 等，Δy +18~+20.1

## 导航 / 契约探测备注（来自 `spec/page-paths.json`，实测发现，不改 spec）

- `settings/dateTime`：系统页第 2 行 → settingsNav.push('dateTime')，整页替换（不是 sub-shell）
- `settings/dateTime/date-time-timezone-picker`：必须先关「自动设置时区」，否则「选择时区」行是 .is-disabled 点不动；关掉后进城市列表 sub-shell
- `settings/safetyEmergency`：设置首页第 25 个 .list-cell；pages/safetyEmergency.js 懒加载，首次进入约需 >700ms 才挂载
- `settings/system`：设置首页第 28 个 .list-cell（文本「系统」）→ push('general') → SettingsSystem 页
- `settings/system/system-developer-options`：SystemDeveloperOptions
- `settings/system/system-enhanced-services`：SystemEnhancedServices
- `settings/system/system-language`：data-system-row=languageInput 进入 SettingsSystem 的子页 SystemLanguage
- `settings/system/system-navigation`：子页 = SubPageShell（v-if 替换主页，系统页 scope 内只剩 sub-shell）
- `settings/system/system-power-button`：同上，SystemPowerButton
- `settings/system/system-schedule-power`：SystemSchedulePower（定时开关机与重启）

## 失败明细（仅列有 fail / missing / extra 的页）

### `settings/dateTime` — fail

- 判决：pass 0 / fail 11 / missing 0 / extra 0（节点 11，matchRate 1）
- 产物：[`reports/accept/baseline/settings-dateTime/verdict.json`](settings-dateTime/verdict.json) · [`reports/accept/baseline/settings-dateTime/report.md`](settings-dateTime/report.md)
- 路径备注：系统页第 2 行 → settingsNav.push('dateTime')，整页替换（不是 sub-shell）
- 最差几何节点（按 |worst| 降序）：
  - `row:时间`（row）worst=13.5 > tol=1.5 Δ(-0.1,+13.5,+0.2,-2) · geometry-out-of-tolerance
  - `header:title`（header-title）worst=13.1 > tol=1.5 Δ(-8.2,+13.7,-159.8,-1.2) · geometry-out-of-tolerance
  - `header:back`（header-back）worst=13 > tol=1.5 Δ(-0.1,+18,-10.1,-10.1) · geometry-out-of-tolerance
- fail 节点（11）：`header:title`、`header:back`、`row:自动设置时间`、`row:日期`、`row:时间`、`row:使用 24 小时制`、`row:自动设置时区`、`row:选择时区`、`row:系统双时钟`、`row:常驻地`、`row:双时钟显示位置`

### `settings/dateTime/date-time-timezone-picker` — fail

- 判决：pass 0 / fail 8 / missing 6 / extra 0（节点 14，matchRate 0.571）
- 产物：[`reports/accept/baseline/settings-dateTime-date-time-timezone-picker/verdict.json`](settings-dateTime-date-time-timezone-picker/verdict.json) · [`reports/accept/baseline/settings-dateTime-date-time-timezone-picker/report.md`](settings-dateTime-date-time-timezone-picker/report.md)
- 路径备注：必须先关「自动设置时区」，否则「选择时区」行是 .is-disabled 点不动；关掉后进城市列表 sub-shell
- 最差几何节点（按 |worst| 降序）：
  - `row:马尼拉`（row）worst=125.6 > tol=1.5 Δ(-0.1,+125.6,+0.2,-15.7) · geometry-out-of-tolerance
  - `row:吉隆坡`（row）worst=110 > tol=1.5 Δ(-0.1,+110,+0.2,+15.6) · geometry-out-of-tolerance
  - `row:北京`（row）worst=110 > tol=1.5 Δ(-0.1,+110,+0.2,-15.7) · geometry-out-of-tolerance
- fail 节点（8）：`header:title`、`header:back`、`row:吉隆坡`、`row:马尼拉`、`row:北京`、`row:香港`、`row:新加坡`、`row:斯里巴加湾`
- missing 节点（6）：`row:望加锡`、`row:首尔`、`row:东京、大阪`、`row:雅库茨克`、`row:赤塔`、`row:帝力`

### `settings/safetyEmergency` — fail

- 判决：pass 0 / fail 13 / missing 0 / extra 0（节点 13，matchRate 1）
- 产物：[`reports/accept/baseline/settings-safetyEmergency/verdict.json`](settings-safetyEmergency/verdict.json) · [`reports/accept/baseline/settings-safetyEmergency/report.md`](settings-safetyEmergency/report.md)
- 路径备注：设置首页第 25 个 .list-cell；pages/safetyEmergency.js 懒加载，首次进入约需 >700ms 才挂载
- 最差几何节点（按 |worst| 降序）：
  - `row:无线紧急警报`（row）worst=54.3 > tol=1.5 Δ(-0.1,+54.3,+0.2,-29.7) · geometry-out-of-tolerance
  - `row:紧急位置信息服务`（row）worst=52.3 > tol=1.5 Δ(-0.1,+52.3,+0.2,-3.7) · geometry-out-of-tolerance
  - `row:不明追踪器提醒`（row）worst=48.6 > tol=1.5 Δ(-0.1,+48.6,+0.2,-0.5) · geometry-out-of-tolerance
- fail 节点（13）：`header:title`、`header:back`、`row:打开个人安全`、`row:紧急联络`、`row:医疗信息`、`row:紧急联系人`、`row:紧急求救`、`row:无线紧急警报`、`row:地震警报`、`row:灾害警报`、`row:驾车时将通知设为静音`、`row:紧急位置信息服务` …

### `settings/system` — fail

- 判决：pass 2 / fail 11 / missing 0 / extra 0（节点 13，matchRate 1）
- 产物：[`reports/accept/baseline/settings-system/verdict.json`](settings-system/verdict.json) · [`reports/accept/baseline/settings-system/report.md`](settings-system/report.md)
- 路径备注：设置首页第 28 个 .list-cell（文本「系统」）→ push('general') → SettingsSystem 页
- 最差几何节点（按 |worst| 降序）：
  - `header:title`（header-title）worst=13.1 > tol=1.5 Δ(-8.2,+13.7,-210.2,-1.2) · geometry-out-of-tolerance
  - `header:back`（header-back）worst=13 > tol=1.5 Δ(-0.1,+18,-10.1,-10.1) · geometry-out-of-tolerance
  - `row:系统导航`（row）worst=9.9 > tol=1.5 Δ(-0.1,+11.9,+0.2,-0.5) · pitch-anchor-out-of-tolerance
- fail 节点（11）：`header:title`、`header:back`、`row:系统导航`、`row:日期与时间`、`row:语言与输入法`、`row:按住电源按钮`、`row:定时开关机与重启`、`row:USB 备份和恢复`、`row:重置手机`、`row:增强服务`、`group:备份、重置与恢复`
- 行距口径（list-metrics）：fail（首行 Δ9.9）

### `settings/system/system-developer-options` — fail

- 判决：pass 0 / fail 11 / missing 2 / extra 1（节点 13，matchRate 0.846）
- 产物：[`reports/accept/baseline/settings-system-system-developer-options/verdict.json`](settings-system-system-developer-options/verdict.json) · [`reports/accept/baseline/settings-system-system-developer-options/report.md`](settings-system-system-developer-options/report.md)
- 路径备注：SystemDeveloperOptions
- 最差几何节点（按 |worst| 降序）：
  - `row:内存`（row）worst=63.6 > tol=1.5 Δ(-0.1,+63.6,+0.2,-1.8) · geometry-out-of-tolerance
  - `row:错误报告`（row）worst=61.8 > tol=1.5 Δ(-0.1,+61.8,+0.2,+3.4) · geometry-out-of-tolerance
  - `row:自动系统更新`（row）worst=36.2 > tol=1.5 Δ(-0.1,-36.2,+0.2,+18.7) · geometry-out-of-tolerance
- fail 节点（11）：`header:title`、`header:back`、`row:使用“开发者选项”`、`row:内存`、`row:错误报告`、`row:桌面备份密码`、`row:不锁定屏幕`、`row:OEM 解锁`、`row:正在运行的服务`、`row:WebView 实现`、`row:自动系统更新`
- missing 节点（2）：`row:错误报告处理程序`、`row:WebView 开发者工具`
- extra 行（1）：「USB 调试连接 USB 时启用调试模式」

### `settings/system/system-enhanced-services` — fail

- 判决：pass 0 / fail 7 / missing 0 / extra 0（节点 7，matchRate 1）
- 产物：[`reports/accept/baseline/settings-system-system-enhanced-services/verdict.json`](settings-system-system-enhanced-services/verdict.json) · [`reports/accept/baseline/settings-system-system-enhanced-services/report.md`](settings-system-system-enhanced-services/report.md)
- 路径备注：SystemEnhancedServices
- 最差几何节点（按 |worst| 降序）：
  - `row:个人知识库服务`（row）worst=117.2 > tol=1.5 Δ(-0.1,-117.2,+0.2,-34.4) · geometry-out-of-tolerance
  - `row:推荐增强服务`（row）worst=89 > tol=1.5 Δ(-0.1,-89,+0.2,-28.2) · geometry-out-of-tolerance
  - `row:AI 场景增强服务`（row）worst=77.1 > tol=1.5 Δ(-0.1,-77.1,+0.2,-12.1) · geometry-out-of-tolerance
- fail 节点（7）：`header:title`、`header:back`、`row:智慧感知服务`、`row:智慧文本服务`、`row:AI 场景增强服务`、`row:推荐增强服务`、`row:个人知识库服务`

### `settings/system/system-language` — fail

- 判决：pass 0 / fail 13 / missing 1 / extra 0（节点 14，matchRate 0.929）
- 产物：[`reports/accept/baseline/settings-system-system-language/verdict.json`](settings-system-system-language/verdict.json) · [`reports/accept/baseline/settings-system-system-language/report.md`](settings-system-system-language/report.md)
- 路径备注：data-system-row=languageInput 进入 SettingsSystem 的子页 SystemLanguage
- 最差几何节点（按 |worst| 降序）：
  - `group:工具`（group）worst=53.8 > tol=1.5 Δ(+0.1,+53.8,-2,-14.1) · geometry-out-of-tolerance
  - `group:地区偏好设置`（group）worst=50.9 > tol=1.5 Δ(+0.1,+50.9,-6,-14.1) · geometry-out-of-tolerance
  - `row:语音`（row）worst=44.9 > tol=1.5 Δ(-0.1,+44.9,+0.2,-2.8) · geometry-out-of-tolerance
- fail 节点（13）：`header:title`、`header:back`、`row:语言与地区`、`row:应用语言`、`row:当前键盘`、`row:键盘应用`、`row:安全键盘`、`row:拼写检查工具`、`row:个人字典`、`row:语音`、`group:键盘`、`group:工具` …
- missing 节点（1）：`row:温度`

### `settings/system/system-navigation` — fail

- 判决：pass 0 / fail 9 / missing 0 / extra 0（节点 9，matchRate 1）
- 产物：[`reports/accept/baseline/settings-system-system-navigation/verdict.json`](settings-system-system-navigation/verdict.json) · [`reports/accept/baseline/settings-system-system-navigation/report.md`](settings-system-system-navigation/report.md)
- 路径备注：子页 = SubPageShell（v-if 替换主页，系统页 scope 内只剩 sub-shell）
- 最差几何节点（按 |worst| 降序）：
  - `row:学习手势`（row）worst=293.4 > tol=1.5 Δ(-0.1,+20.4,+0.2,-293.4) · geometry-out-of-tolerance
  - `group:手势导航`（group）worst=192.3 > tol=1.5 Δ(-0.2,-192.3,-7.8,+256.9) · geometry-out-of-tolerance
  - `group:三键导航`（group）worst=192.3 > tol=1.5 Δ(+8,-192.3,-7.8,+256.9) · geometry-out-of-tolerance
- fail 节点（9）：`header:title`、`header:back`、`row:学习手势`、`row:学习手势#2`、`row:隐藏手势导航条`、`row:圈定即搜`、`row:语音助手`、`group:手势导航`、`group:三键导航`

### `settings/system/system-power-button` — fail

- 判决：pass 0 / fail 5 / missing 1 / extra 1（节点 6，matchRate 0.833）
- 产物：[`reports/accept/baseline/settings-system-system-power-button/verdict.json`](settings-system-system-power-button/verdict.json) · [`reports/accept/baseline/settings-system-system-power-button/report.md`](settings-system-system-power-button/report.md)
- 路径备注：同上，SystemPowerButton
- 最差几何节点（按 |worst| 降序）：
  - `row:数字助理`（row）worst=321.5 > tol=1.5 Δ(-0.1,-321.5,+0.2,-2.8) · geometry-out-of-tolerance
  - `row:电源菜单`（row）worst=318.7 > tol=1.5 Δ(-0.1,-318.7,+0.2,-2.8) · geometry-out-of-tolerance
  - `group:按住电源按钮即可访问`（group）worst=311.6 > tol=1.5 Δ(+0.1,-311.6,-10.1,-14.1) · geometry-out-of-tolerance
- fail 节点（5）：`header:title`、`header:back`、`row:电源菜单`、`row:数字助理`、`group:按住电源按钮即可访问`
- missing 节点（1）：`group:电源菜单： 
长按电源键 3 秒。`
- extra 行（1）：「电源菜单：长按电源键 3 秒。」

### `settings/system/system-schedule-power` — fail

- 判决：pass 0 / fail 7 / missing 1 / extra 1（节点 8，matchRate 0.875）
- 产物：[`reports/accept/baseline/settings-system-system-schedule-power/verdict.json`](settings-system-system-schedule-power/verdict.json) · [`reports/accept/baseline/settings-system-system-schedule-power/report.md`](settings-system-system-schedule-power/report.md)
- 路径备注：SystemSchedulePower（定时开关机与重启）
- 最差几何节点（按 |worst| 降序）：
  - `row:05:00`（row）worst=105.9 > tol=1.5 Δ(-0.1,+105.9,+0.2,+10.8) · geometry-out-of-tolerance
  - `row:定时重启`（row）worst=99.9 > tol=1.5 Δ(-0.1,+99.9,+0.2,-6) · geometry-out-of-tolerance
  - `row:定时关机`（row）worst=63 > tol=1.5 Δ(-0.1,+63,+0.2,-6) · geometry-out-of-tolerance
- fail 节点（7）：`header:title`、`header:back`、`row:定时开机`、`row:07:00`、`row:定时关机`、`row:定时重启`、`row:05:00`
- missing 节点（1）：`row:20:00`
- extra 行（1）：「23:00每天」

## 环境错误（导航/服务/构建绑定问题，不是产品 fail）

无。

## 复现

```bash
# 1) 静态服务（产物构建）
python3 -m http.server 7812 --bind 127.0.0.1 --directory /tmp/dist-head
# 2) 一轮全跑
node tools/accept/run-baseline.mjs --url http://127.0.0.1:7812/ --build-dir /tmp/dist-head
```

> 口径说明：判决容差沿用 `tools/accept/lib/diff.mjs`（row/group/header ±1.5px，line/divider/border/icon ±0.5px，text 只记录不判）；本轮未改任何 spec、未放宽容差、未跳过页面。进入路径见 `spec/page-paths.json`。
