# verify 脚本盘点 · LEAD-WB-002（接 Q-003）

盘点时间：2026-11-13。执行人：Workbuddy。本文件是**分类清单**，不是注册表；
`scripts/run-e2e.mjs` 的 SUITES/covers 接入由 DSH 统一做，本单未改那个文件。

## 一、实数（本次现数，不沿用旧口径）

| 项 | 本次实测 | 旧口径 | 差异原因 |
| --- | --- | --- | --- |
| `scripts/verify*.mjs` | **65** | 65 | 总数一致，但下表是逐个核过的，不是照抄 |
| `run-e2e --list` 套件 | **14 套** | 14 | 一致 |
| 其中由 verify 脚本承载 | **13** | 14 | `volume-glass` 指向 `probe-volume-glass.mjs`，不是 verify 脚本 |
| 未注册 SUITES | **52** | 51 | 差 1 来自上面那颗 probe，不是 verify |
| 写死历史会话产物目录 | **29** | 30 | 逐文件 grep 现数；其中 8 个已归档、21 个已改 ARTIFACT_DIR |
| 归档到 `scripts/legacy/` | **8** | — | 本单新增，只归档高置信度废弃项 |
| 归档后 `scripts/verify*.mjs` | **57** | — | 65 − 8 |

判定分布：**13 已注册 + 24 维护待补 covers + 20 待判 + 8 归档 = 65**。

采集命令（可复核）：

```bash
ls scripts/verify*.mjs | wc -l
node scripts/run-e2e.mjs --list
grep -rl "/Users/.*brain" scripts/verify*.mjs | wc -l
git log -1 --format=%ad --date=short -- scripts/verify-<name>.mjs
```

## 二、判定标准

- **维护·已注册**：已在 SUITES 里。按派单边界，这 14 个脚本**不移动、不修改**。
- **维护·待补 covers**：契约明确、可重复跑、功能仍在（不少是 W2-001/W2-002 刚改过的模块）。
  本单只记录建议 covers，**不改 `run-e2e.mjs`**，交 DSH 接入。
- **待判**：一次性像素/布局校准或已知口径问题，既没注册也没文档引用。
  留在原地，需 owner 确认是否还手工使用；**不擅自归档**。
- **归档**：同时满足 ① 2026-10-26/27 同一批一次性模板截图取证；
  ② 产物路径写死已消失的历史会话目录 `/Users/.../.gemini/antigravity/brain/<uuid>/`；
  ③ 未注册 SUITES、未被任何文档或其它脚本引用。移到 `scripts/legacy/`，**不删除**。

引用扫描：65 个里 **49 个**未被任何文档/其它脚本引用（仅脚本自身出现 1 次），
这也是「既不被跑、也不敢删」的根因，清单逐条标注了关联流程便于 owner 认领。

## 三、逐脚本清单（65 行）

| 脚本 | 判定 | 理由 | 关联流程 / 建议 covers |
| --- | --- | --- | --- |
| `verify-account-login.mjs` | 维护·待补 covers | 账号登录全流程（短信/密码/二维码弹窗）仍是可重复回归 | src/components/apps/settings/SettingsAccountLogin.vue; src/stores/accountStore.js |
| `verify-account-security.mjs` | 维护·待补 covers | 账号安全子页的交互链路仍有效 | src/components/apps/settings/SettingsAccountSecurity.vue |
| `verify-aimate-flow.mjs` | 维护·已注册 | 已在 SUITES 的 aimate 套件中，本单不移动、不修改（按派单边界） | src/components/apps/aimate/ |
| `verify-aimate-printer.mjs` | 维护·已注册 | 已在 SUITES 的 printer 套件中，本单不移动、不修改（按派单边界） | src/components/apps/aimate/PrinterFlow.vue |
| `verify-app-switcher.mjs` | 待判 | 5059 行冒烟脚本；本机 39 FAIL 已知是脚本 430×932 视口口径与代码无关，需 owner 定口径 | src/components/system/AppSwitcher.vue |
| `verify-big-folder-handle.mjs` | 待判 | 大文件夹把手一次性几何取证，无后续引用 | 桌面大文件夹 |
| `verify-cc-row.mjs` | 维护·待补 covers | 控制中心「隐私指示+双卡」合并行，2026-10-14 按新结构重写过 | src/components/system/cc/** |
| `verify-cc-status-bar.mjs` | 维护·待补 covers | CC 状态行指示器与开关同源 | src/components/system/cc/** |
| `verify-cc-volume-plus.mjs` | 维护·已注册 | 已在 SUITES 的 cc-volume 套件中，本单不移动、不修改（按派单边界） | src/components/system/ControlCenter.vue |
| `verify-chrome-inversion.mjs` | 待判 | Chrome 反色一次性截图取证 | 桌面/Chrome 外观 |
| `verify-close-precision.mjs` | 待判 | 关闭手势精度一次性校准 | AppSwitcher 手势 |
| `verify-cloud-backup-flow.mjs` | 维护·待补 covers | 云备份流程有独立断言链 | src/components/apps/settings/SettingsCloudBackup.vue |
| `verify-devconsole-preset-seg.mjs` | 待判 | DevConsole 预设分段一次性版式取证 | src/components/dev/DevConsole.vue |
| `verify-digital-health.mjs` | 维护·已注册 | 已在 SUITES 的 digital-health 套件中，本单不移动、不修改（按派单边界） | src/components/apps/settings/digitalhealth/ |
| `verify-display-page.mjs` | 维护·待补 covers | S2 显示页验收，W2-001 迁移后仍需回归 | src/components/apps/settings/SettingsDisplay.vue; display/** |
| `verify-dnd-flow.mjs` | 维护·已注册 | 已在 SUITES 的 dnd 套件中，本单不移动、不修改（按派单边界） | src/components/apps/settings/dnd/ |
| `verify-drawer-interaction.mjs` | 待判 | 抽屉交互一次性截图取证 | 应用抽屉 |
| `verify-filter-layout.mjs` | 待判 | 筛选布局一次性截图取证 | 应用抽屉筛选 |
| `verify-focus-flow.mjs` | 维护·已注册 | 已在 SUITES 的 focus 套件中，本单不移动、不修改（按派单边界） | src/components/apps/settings/focus/ |
| `verify-hardware-volume-keys.mjs` | 维护·已注册 | 已在 SUITES 的 hw-volume 套件中，本单不移动、不修改（按派单边界） | src/components/system/ControlCenter.vue |
| `verify-hero-anchors.mjs` | 维护·待补 covers | Hero 锚点「从哪来回哪去」，W2-002 刚改过 Hero | src/composables/useHeroTransition.js; src/utils/heroGeometry.js |
| `verify-hios17-layout.mjs` | 待判 | hiOS 17 模板布局一次性对比 | OS 模板页 |
| `verify-infinix-icon.mjs` | 维护·待补 covers | 系统图标资源回归 | src/assets/icons/** |
| `verify-infinix-notif.mjs` | 维护·待补 covers | Infinix 通知样式回归 | src/components/system/NotificationCenter.vue |
| `verify-lock-bottom-bounce.mjs` | 待判 | 锁屏底部回弹一次性校准 | src/components/system/LockScreen.vue |
| `verify-lock-card-alpha.mjs` | 待判 | 锁屏卡片透明度一次性校准（47 行） | src/components/system/LockScreen.vue |
| `verify-lock-cc-style.mjs` | 待判 | 锁屏 CC 样式一次性截图取证 | src/components/system/LockScreen.vue |
| `verify-lock-fix-stack.mjs` | 待判 | 锁屏栈修复一次性取证 | src/components/system/LockScreen.vue |
| `verify-lock-wallpapers.mjs` | 待判 | 锁屏壁纸一次性截图取证（48 行） | src/components/system/LockScreen.vue |
| `verify-modes-and-routines.mjs` | 维护·已注册 | 已在 SUITES 的 modes-and-routines（已隔离） 套件中，本单不移动、不修改（按派单边界） | src/components/apps/settings/modes/ |
| `verify-mori-flow.mjs` | 维护·已注册 | 已在 SUITES 的 mori 套件中，本单不移动、不修改（按派单边界） | src/components/apps/aimate/MoriFlow.vue |
| `verify-no-jbl.mjs` | 待判 | 「JBL 磁贴下线」一次性状态校验，结论已固化进实现 | 控制中心默认布局 |
| `verify-notif-clear.mjs` | 待判 | 通知清除一次性截图取证 | 通知中心 |
| `verify-oneleap-flow.mjs` | 维护·待补 covers | OneLeap 跨屏流程，脚本已用 ARTIFACT_DIR 形态 | src/components/apps/oneleap/** |
| `verify-os16-templates.mjs` → `scripts/legacy/` | 归档 | 2026-10-26 同一批 OS16 模板截图取证，写死历史会话 brain 目录 | OS16 通知模板 |
| `verify-phone-flow.mjs` | 维护·已注册 | 已在 SUITES 的 phone 套件中，本单不移动、不修改（按派单边界） | src/components/apps/phone/ |
| `verify-phone-settings-jump.mjs` | 维护·待补 covers | 电话设置跳系统设置的链路 | src/components/apps/phone/settings/** |
| `verify-photos-flow.mjs` | 维护·已注册 | 已在 SUITES 的 photos 套件中，本单不移动、不修改（按派单边界） | src/components/apps/photos/ |
| `verify-photos-share-e2e.mjs` | 维护·待补 covers | 照片分享端到端链路 | src/components/apps/photos/**; src/stores/shareStore.js |
| `verify-prayer-ai-status.mjs` | 维护·待补 covers | 礼拜/AI 状态联动 | src/components/apps/settings/SettingsPrayer.vue |
| `verify-privacy-dualsim-switch.mjs` | 维护·待补 covers | 控制台双卡开关行为回归 | src/components/dev/** |
| `verify-privacy-integration.mjs` | 维护·待补 covers | 隐私开关集成回归 | src/components/dev/**; src/stores/controlStore.js |
| `verify-recorder-flow.mjs` | 维护·已注册 | 已在 SUITES 的 recorder 套件中，本单不移动、不修改（按派单边界） | src/components/apps/aimate/RecorderFlow.vue |
| `verify-settings-account.mjs` | 维护·待补 covers | 设置账号页，已用 ARTIFACT_DIR + /tmp/vwork 默认值 | src/components/apps/settings/SettingsAccount.vue |
| `verify-settings-group3.mjs` | 维护·已注册 | 已在 SUITES 的 settings-group3 套件中，本单不移动、不修改（按派单边界） | src/components/apps/settings/Settings{Security,Privacy,AppsManage,Location}.vue |
| `verify-settings-search.mjs` | 维护·待补 covers | 设置搜索双态 Dock 流程 | src/components/ui/SettingsSearch*.vue |
| `verify-settings-wallet.mjs` | 维护·待补 covers | 钱包页，已用 ARTIFACT_DIR + /tmp/vwork 默认值 | src/components/apps/settings/SettingsWallet.vue |
| `verify-share-sheet-flow.mjs` | 维护·待补 covers | 系统分享面板流程 | src/components/system/ShareSheet.vue |
| `verify-side-volume-cc-style.mjs` | 待判 | 侧栏音量 CC 样式对比，写死本机 Chromium 路径 | 控制中心音量条 |
| `verify-sound-page.mjs` | 维护·待补 covers | S2 声音页验收，W2-001 迁移后仍需回归 | src/components/apps/settings/SettingsSound.vue; sound/** |
| `verify-status-bar-camera.mjs` | 维护·待补 covers | 状态栏右簇不与居中摄像头重叠 | src/components/phone/StatusBar.vue |
| `verify-status-bar.mjs` | 维护·待补 covers | 状态栏指示器与开关同源（数可见槽位） | src/components/phone/StatusBar.vue |
| `verify-status-bluetooth.mjs` | 维护·待补 covers | 2026-11-10 新改的蓝牙/Wi-Fi 隐藏判据 | src/components/phone/StatusBar.vue |
| `verify-status-icon-size.mjs` | 待判 | 状态栏图标尺寸一次性量测 | src/components/phone/StatusBar.vue |
| `verify-tos17-layout.mjs` | 待判 | tOS 17 布局一次性对比 | OS 模板页 |
| `verify-track-carousel.mjs` | 维护·待补 covers | One-Tap 轮播跟手轨迹 | src/components/apps/settings/SettingsOneTap.vue |
| `verify-volume-cc-comparison.mjs` | 待判 | 音量条 CC 对照一次性截图 | 控制中心音量条 |
| `verify-volume-four-fixes.mjs` | 待判 | 音量条四处修复一次性验收 | 控制中心音量条 |
| `verify_all_native_templates.mjs` → `scripts/legacy/` | 归档 | 2026-10-27 同一批下划线命名取证脚本，写死历史会话 brain 目录 | 原生通知模板 |
| `verify_buttons_figma.mjs` → `scripts/legacy/` | 归档 | 同上，Figma 按钮一次性截图 | Figma 按钮资源 |
| `verify_charging_and_hotspot.mjs` → `scripts/legacy/` | 归档 | 同上，充电/热点一次性截图 | 状态栏充电/热点 |
| `verify_devconsole_icons.mjs` → `scripts/legacy/` | 归档 | 同上，DevConsole 图标一次性截图（49 行） | DevConsole 图标 |
| `verify_fixes.mjs` → `scripts/legacy/` | 归档 | 同上，灵动岛若干修复一次性截图 | Dynamic Island |
| `verify_food_layer_separated.mjs` → `scripts/legacy/` | 归档 | 同上，图层分离一次性截图 | 通知卡片图层 |
| `verify_interactive_cards.mjs` → `scripts/legacy/` | 归档 | 同上，交互卡片一次性截图 | 通知交互卡片 |

## 四、covers 缺口清单（交 DSH，不是本单改动）

以下 24 个「维护·待补 covers」脚本建议按下表补 `run-e2e.mjs` 的 SUITES/covers。
路径是**建议**，接入前请核实模块是否仍存在；`modes-and-routines` 仍保持隔离口径。

- `verify-account-login.mjs` → src/components/apps/settings/SettingsAccountLogin.vue; src/stores/accountStore.js
- `verify-account-security.mjs` → src/components/apps/settings/SettingsAccountSecurity.vue
- `verify-cc-row.mjs` → src/components/system/cc/**
- `verify-cc-status-bar.mjs` → src/components/system/cc/**
- `verify-cloud-backup-flow.mjs` → src/components/apps/settings/SettingsCloudBackup.vue
- `verify-display-page.mjs` → src/components/apps/settings/SettingsDisplay.vue; display/**
- `verify-hero-anchors.mjs` → src/composables/useHeroTransition.js; src/utils/heroGeometry.js
- `verify-infinix-icon.mjs` → src/assets/icons/**
- `verify-infinix-notif.mjs` → src/components/system/NotificationCenter.vue
- `verify-oneleap-flow.mjs` → src/components/apps/oneleap/**
- `verify-phone-settings-jump.mjs` → src/components/apps/phone/settings/**
- `verify-photos-share-e2e.mjs` → src/components/apps/photos/**; src/stores/shareStore.js
- `verify-prayer-ai-status.mjs` → src/components/apps/settings/SettingsPrayer.vue
- `verify-privacy-dualsim-switch.mjs` → src/components/dev/**
- `verify-privacy-integration.mjs` → src/components/dev/**; src/stores/controlStore.js
- `verify-settings-account.mjs` → src/components/apps/settings/SettingsAccount.vue
- `verify-settings-search.mjs` → src/components/ui/SettingsSearch*.vue
- `verify-settings-wallet.mjs` → src/components/apps/settings/SettingsWallet.vue
- `verify-share-sheet-flow.mjs` → src/components/system/ShareSheet.vue
- `verify-sound-page.mjs` → src/components/apps/settings/SettingsSound.vue; sound/**
- `verify-status-bar-camera.mjs` → src/components/phone/StatusBar.vue
- `verify-status-bar.mjs` → src/components/phone/StatusBar.vue
- `verify-status-bluetooth.mjs` → src/components/phone/StatusBar.vue
- `verify-track-carousel.mjs` → src/components/apps/settings/SettingsOneTap.vue

## 五、ARTIFACT_DIR 改造

21 个仍在 `scripts/` 的脚本原本写死同一个历史会话目录，现统一为：

```js
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || pathSync.join(osSync.tmpdir(), 'vwork')
fsSync.mkdirSync(ARTIFACT_DIR, { recursive: true })
```

- 默认值落在系统临时目录且自动建目录，**不依赖任何个人路径**，跨机器/跨 lane 可移植；
- 内联 `path: '/Users/.../x.png'` 改成 `path: `${ARTIFACT_DIR}/x.png``；
- 原变量名恰好也叫 `ARTIFACT_DIR` 的别名行已删除（否则会重复声明）；
- 21 个脚本全部通过 `node --check`；57 个 `scripts/verify*.mjs` 全量语法检查通过；
- 已注册的 14 个脚本未改；归档的 8 个不再运行，保留原样作为历史记录。
- 遗留（不在本单范围）：4 个脚本把本机 Chromium 可执行路径写死在 `PLAYWRIGHT_CHROME` 兜底里
  （`verify-side-volume-cc-style` / `verify-volume-cc-comparison` / `verify-volume-four-fixes` / `verify-status-icon-size`），
  属于「浏览器路径」而非产物路径，建议后续统一收敛。

## 六、本单明确未做的事

- 未改 `scripts/run-e2e.mjs`（DSH 持锁，按清单统一接入）。
- 未移动/修改 SUITES 对应的 14 个脚本。
- 未删除任何脚本（只有 `git mv` 到 `scripts/legacy/`）。
- 未删断言、未降 G7 基线。
- 待判 20 个留在原地，等 owner 结论后再决定归档或接入。
