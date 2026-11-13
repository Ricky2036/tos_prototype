# SET-WB-01 第一条链路 · 视觉对照报告

- 真机证据：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/.local-evidence/SET-DSH-01/04-datetime-default.png`
  （DSH 本地整屏截图，未入库；**只读取文件，未连设备/未抢 ADB**）
- 原型截图：`/tmp/wb-datetime-prototype.png`（360×788 画布，`vueRuntime` 挂载 `SettingsDateTime.vue` 后截取）
- 文字规格：`spec/captures/SET-DSH-01-A-B.md`（包 A + B1/B2）

## 逐项对照

| 项 | 真机 | 原型 | 结论 |
| --- | --- | --- | --- |
| 导航 | 标题「日期与时间」+ 左上圆形返回键 | 同 | ✅ |
| 分组 | 4 组白卡 | 4 组白卡 | ✅ |
| 9 行顺序 | 自动设置时间 / 日期 / 时间 / 使用 24 小时制 / 自动设置时区 / 选择时区 / 系统双时钟 / 常驻地 / 双时钟显示位置 | 同（浏览器断言逐项核对） | ✅ |
| 行文案与副标题 | 使用您的网络和无线信号自动设定 · 使用网络提供的时区。 · 系统时区与常驻地时区不一致时，显示双时钟。 | 逐字一致 | ✅ |
| 自动设置时间 | 开 | 开 | ✅ |
| 自动设置时区 | 开 | 开 | ✅ |
| 使用 24 小时制 | 关（示例「下午1:00」） | 关（示例「下午1:00」） | ✅ |
| 系统双时钟 | **开** | 初版关 → **已按截图改为开** | ✅ 已修 |
| 常驻地 / 双时钟显示位置 | 右侧均有 `>` 箭头 | 初版无 → **已补 chevron + 上报点击意图** | ✅ 已修 |
| 禁用态 | 日期 / 时间 / 选择时区 三行置灰、箭头浅色 | 三行 `is-disabled`，浏览器断言核对 | ✅ |
| 卡片 | 白底、大圆角 | `#FFFFFF` / `16px` / 无描边无投影（cardSpec 运行时量过） | ✅ |
| 组间距 | 真机四组间有留白 | 18px 画布（由包 B bounds 组间约 54 真机像素推得，未做单位标定） | ⚠️ 待包 E 量化 |
| 开关配色/几何 | 蓝色 Android 开关 | 项目既有 `ToggleSwitch`（绿色） | ⚠️ 保留项目统一控件，待包 E 与 Ricky 拍板 |
| 字号 / 取色点 | 未采 | 走仓库 tokens | ⚠️ 待包 E |

## 结论

**结构、文案、顺序、开关初值、依赖禁用态与返回链已逐项对齐并通过浏览器断言。**
三项量化差异（组间距、开关配色、字号取色）不自行脑补，已列入包 E 追问；
本条链路按「有证据即落代码、未知标 unknown」交付，不因这三项停整单。

## 对照中发现并修正的两处（包 B 表格与整屏截图有出入，以截图为准）

1. `系统双时钟`：包 B1 只写「开关」未标状态；截图是蓝色开态 → store 默认值 `false → true`。
2. `常驻地` / `双时钟显示位置`：包 B1 右侧写「无」；截图两行都有 `>` → 组件补 `chevron`，
   且挂 `open-picker` 上报意图，避免变成死入口（选择器实现等包 C/D）。

## 相关验收证据

```bash
node --test tests/dateTimeSettings.test.js   # 13/13（9 纯逻辑 + 4 真实浏览器）
node scripts/gate-merge.mjs                  # 7 步全过
node /tmp/wb-datetime-route.mjs              # glob 路由探针（模拟 AG 接线）
```

glob 路由探针输出：注册页 `["display","sound","accessibility","dateTime"]`、
`dateTime` 路由 `true`、`push('dateTime')` 后落地页可见、标题正确、9 行顺序正确、
默认禁用 `["date","time","timezone"]`、返回后首页 8 卡片、`pageErrors` 为空。
⇒ **主壳无需改一行即可路由到新页面**（§6.3 定义性指标），AG 只需接两处入口。

---

## 追加：包 C / D / E 入库后的第二条链路（14:33 起）

DSH 把 C/D/E 追加进了 `spec/captures/SET-DSH-01-A-B.md`，本页据此继续落代码，
未整单停工、未猜未知项。

| 包 | 证据 | 落地 |
| --- | --- | --- |
| C1 两态矩阵 | 关态日期/时间 `enabled=true` | 与首版 `disabled = autoTime` 完全一致，浏览器断言逐组解禁/重新锁回 |
| C2 时区支路 | 关态进 SubSettings 城市列表，44 节点，样例 6 城市 + GMT 偏移两列，**未选中任何城市** | 新增 `dateTime/DateTimeTimezonePicker.vue`：6 个采集包样例城市、只读浏览、一次返回；**不实现选中写回** |
| C3 / E2 开关 | 43.5×24.1 画布 px；两页开关几何一致、是同一控件 | 继续复用 `ui/ToggleSwitch`，未在本页另写一份、未改共享控件 |
| D 返回链 | 子页一次返回回日期与时间；主页返回回系统页；改值后重进状态保持 | 组件内 `subPage` + `useBackHandler` 先关子页再 pop；store 走 `localPrefs` 持久化，浏览器断言验证 |
| E1 取色 | 底色 `#F0F2F3`、分隔线 `#E0E0E0`、禁用行**实色** `#999999`、副标题 `#595959` | 本页 scoped `:deep()` 覆盖（原 `ListCell` 是 `opacity:0.45`），浏览器逐项量 computed 值 |

三项仍 unknown、明确不猜：日期/时间选择器形态、常驻地/双时钟位置点击去向、
切应用回来是否保持（D1 未测）。这些行只上报 `open-picker` 意图，不臆造 UI。

第二条链路验收：`node --test tests/dateTimeSettings.test.js` **16/16**（9 纯逻辑 +
7 真实浏览器，含取色与城市列表往返）；`node scripts/gate-merge.mjs` 7 步全过。
