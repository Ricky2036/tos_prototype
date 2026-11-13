# SET-WB-01 · 给 Integrator 的 route 契约（主壳单点接线）

WB 已交付页面骨架与自声明，**不改 `SettingsApp.vue`**。主壳只需下面两处最小接线。
证据：`spec/captures/SET-DSH-01-A-B.md`（真机 Infinix X6878 / Android 17）。

## 契约

| 项 | 值 |
| --- | --- |
| route id | `dateTime` |
| 标题 | `日期与时间` |
| 组件 | `src/components/apps/settings/dateTime/SettingsDateTime.vue` |
| 自声明 | `src/components/apps/settings/pages/dateTime.js`（glob 自动注册，**无需 import 组件**） |
| 搜索项 | `{ id: 'dateTime', title: '日期与时间', group: '系统' }`（action 由主壳注入） |
| 页面 emit | `back`（返回键）、`open-picker(key)`（下一条小单，本条无需接） |
| 返回栈 | 页面自行 `inject('settingsNav') + useBackHandler()`，主壳**不要**给它加 `.back?.()` 轮询 |
| 独占目录 | `dateTime/**`、`system/**`、`dateTimeStore.js`、`pages/dateTime.js`、`tests/dateTimeSettings.test.js` |

## 主壳两处接线

### ① 搜索池（当前 `SettingsApp.vue:352`）

```diff
- { id: 'dateTime', title: '日期与时间', group: '系统', action: () => pushUnimplemented('日期与时间') },
+ { id: 'dateTime', title: '日期与时间', group: '系统', action: () => push('dateTime') },
```

`pages/dateTime.js` 的 `searchItems` 也声明了同 id；若主壳已按 glob 汇总搜索池，
则这行可整行删除、`push` 由汇总时注入 —— 两种写法二选一，**不要重复注册**。

### ② 「系统」页入口（当前 `SettingsApp.vue` 兜底 `v-else` 分支）

真机包 A1：设置首页 →「系统」卡片 → `SystemDashboardActivity`，
组内顺序是 **系统导航 → 日期与时间 → 语言与输入法 → …**，即第 2 行。
原型现有「系统控制与偏好」卡片里只有「系统语言与输入法」「系统导航方式」两行，缺「日期与时间」。

```vue
<ListCell title="日期与时间" chevron clickable @click="push('dateTime')" />
```

按真机顺序插在「系统导航方式」之后、「系统语言与输入法」之前（或按主壳现有分组顺序对齐第 2 行）。
**不要**改行文案、不要加副标题 —— 包 A 未采到该行的副标题。

## 不需要做的事

- 不要 import `SettingsDateTime.vue`：`pages/*.js` 由 `import.meta.glob('./pages/*.js', { eager: true })` 汇总。
- 不要给该页写 `viewTitles` 字面量：标题来自 `pages/dateTime.js` 的 `title`。
- 不要给它加 `ref="xxxRef"` + `.back?.()`：返回已下沉到页面自身。
- 不要接 `open-picker`：日期/时间/时区选择器属下一条小单，等包 D 证据。

## WB 侧验收证据（本条链路）

```bash
node --test tests/dateTimeSettings.test.js     # 纯逻辑 + 真实浏览器挂载
node scripts/gate-merge.mjs                    # 7 步（租约在 WB 时跑）
```

浏览器断言覆盖：9 行顺序、4 组卡片样式（白底 / 16 圆角 / 无描边无投影）、
开态禁用 `date/time/timezone`、两个总开关逐组解禁与重新锁回、
24 小时制示例时间响应、返回键派发 `back`、卸载重挂后状态保持。

## unknown（等包 C / D / E，不猜）

- 关态下三个被放行行落到哪个选择器、是否有 toast / 联网校验（包 C）
- 「使用 24 小时制」「系统双时钟」真机开态初值（包 B 只标「开关」）
- 返回键与侧滑分别落到哪、跨应用回来是否保留（包 D）
- 开关本体几何与配色、禁用态取色（包 E）
- 地区 / 运营商 / SIM 是否影响入口（包 A3）
