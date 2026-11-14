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
| 录屏 | screenrecorder | `AccScreenRecord.vue`，6 项（清晰度/帧率落缺口页，等真机选择器取证） |
| 截屏 | screencapture | `AccScreenshot.vue`，4 点插图（页 1/2 文案，页 3/4 未采）+ 4 开关 |
| 动作与手势 / 智感握姿 | microintelligence SmartGrip | `AccSmartGrip.vue`（两入口一落地） |
| 小窗 / 应用分屏 | ossettingsext Split | `AccSplitScreen.vue`（两入口一落地） |
| 智能侧边栏 | smartpanel MainPlugin | `AccSidebar.vue`，10 行 + 场景助手组 |
| 户外增强 | `SubSettings` | `AccOutdoor.vue` + `AccOutdoorSchedule.vue`（含时间弹层） |
| 晕动舒缓显示 | microintelligence AntiDizzy | `AccMotion.vue` |
| 游戏模式 | smartpanel Proxy | `AccGame.vue`，4 行 |
| 防误触模式 | 行内开关 | 主页唯一开关，蓝色，默认开 |
| 你可能想找 | 应用双开 / 防偷窥 / 数字健康 | 数字健康走主壳路由；前两项为缺口页 |

## 交付记录（workbuddy · 2026-11-13/14）

- 分支/提交：`workbuddy/lane` @ `b28bc97`（第一轮）
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
- ~~已知视觉差异：带副标题行高比真机高 12px / hero 偏大 / 卡间距差 2–4px~~ → **2026-11-14 已标定修正**，见下节。

## 第二轮：几何标定 + 插图重裁（2026-11-14 夜）

设备离线（`adb devices` 空、`ioreg` 无 Android 设备），本轮只做不依赖真机新采集的分支：用**已入库的真机截图**重新逐像素量测，纠正上一轮被圆角内缩带偏的数值。

**量测方法纠错（关键）**：上一轮在卡片左缘 x=60 物理处扫色带，被 16px 圆角内缩吃掉上下各约 28 物理 px，读出「卡更矮 / 间距更大」的假值——据此把卡片间距做成 28px，真机其实只有 16。正确做法是在卡片中线 x≈1000 处扫。

| 项 | 上一轮 | 真机实测 | 本轮 |
|---|---|---|---|
| 卡片间距 | 28 | 16.1 | 16（主页 + 子页） |
| hero 卡高 | 228 | 178.8 | 179 |
| hero 图标 | 64 | 47.7 | 48 |
| hero 标题/说明 | 18/13 | 18/12.5、行距 15.8 | 18/12.5、行高 16 |
| 单行卡「无障碍」 | 52 | 56.3 | 56 |
| 单行卡「防误触」 | 66.7 | 72.1 | 72 |
| 分组内无副标题行 | 52 | 50.4 | 50 |
| 「你可能想找」距卡底 | 8 | 32.5 | 32（含外边距合并） |
| 组标题 | 13px、左缘 20 | 14px、左缘 32.3 | 14px、左缘 32 |
| 子页卡片宽 | 296（双重内边距） | 328（16→344） | 328 |
| 插图 | 碎片切片、260 高、非满幅 | 整条横带 360×240 | 满幅 360×240 |

**插图重裁**：`illus-*.png` 六张全部作废重出——上一版是**竖切片**（如侧边栏只有 137×420 的右缘一条），显示时被拉成 260 高，等于把一个碎片放大；现在按真机**整条横带**（物理 y 369–1174 = 设计 110–350，满幅 1208 宽）裁切并降采样到 720×480，页面底色一并带上，渲染即 1:1。

**结构纠错**：
- 侧边栏、游戏模式两个插图页真机**只有一行灰字说明、没有加粗标题**，之前多渲染了一个标题（`AccCarousel` 的 title 改为可选，说明加 `.is-solo` 间距 25）
- 智感握姿页说明可用宽 330（26 字/行），原来留 32px 内边距导致提前换行
- 组标题字号 13→14、左缘补齐到 32；子页 `.acc-page` 去掉与 `SubPageShell` 重复的左右 16px（卡片因此从 296 恢复到 328）
- 截图页/侧边栏页圆点数量复核：截屏 4、分屏 2、侧边栏 3、游戏 2、晕动 4（按圆点行宽 ÷ 11.5 反推，与代码一致）

**验证**：
- `tests/accessibilityModule.test.js` **19/19 PASS**（新增 3 条几何契约：hero 179/图标 48/卡间距 16/行高 56·50·67·72、插图满幅 360×240 + 侧边栏无标题、截屏 4 点 + 组标题 14px）
- 全量单测 **970/970 PASS**；`vite build` 通过
- 浏览器走查（360×788 设计画布）：设置首页 → 辅助功能 → 防误触切换 → 截屏（滑动翻到「区域截屏」）→ 返回 → 侧边栏 → 浮标设置缺口页 → 返回 → 户外增强总开关两态 → 返回 → 退出重进，`aria-checked` 保持 false，**console 0 error**
- 真机/原型并排对照 7 张（主页、侧边栏、截屏、小窗、游戏、晕动、握姿、户外两态）在 `/tmp/acc01/cmp/*_sbs.png`，主体误差 ≤5px

**仍未完成（设备侧阻塞，非实现取舍）**：侧边栏浮标设置/中转站/可用的应用/更多功能、游戏管理/XArena、录屏清晰度与帧率真实选择器、截屏 3/4 与各页第 2+ 页插图、应用双开/防偷窥落地页。这些全部需要新采集，等 `adb devices` 恢复后按共享租约继续。

**遗留小差异（已量化，未强改）**：分组带副标题行 66.7 vs 真机 67.2（主站）/ 61（smartpanel 侧边栏页）；圆点到卡片 30 vs 34/24；户外增强顶部卡起点 110 vs 103。均 ≤7px，再压需要动共享 `ListCell` 或按应用分别硬编码，收益不划算。

## 给 Integrator 的接线需求

1. 首页入口已存在（`SettingsApp.vue` 硬编码 `push('accessibility')`），**无需改主壳**
2. 搜索池已由 `pages/accessibility.js` 自声明（11 项，action 由主壳注入），无主壳 diff
3. 若同意把 `accessibility/**` 纳入 C2，请在 `.claims/C2.json` 追加（本轮按用户授权先实现，登记待补）


---

## 第三轮：把 8 个 AccPending 全部收掉（2026-11-14 上午，设备恢复后）

设备重新连上（`Infinix_X6878` / serial `159467059A001123`），按共享租约补采，采完立即释放锁。
本轮**新增 9 个真页 + 1 个共用弹层 + 1 个滑块控件**，模块内 `AccPending` 从 8 处降到 4 处（剩下的都指向真机里存在、但本轮确实没采到的层，理由逐条写在页面上）。

### 新增/重写

| 文件 | 内容 | 依据 |
|---|---|---|
| `AccFloatMark.vue` + `AccSlider.vue` | 浮标设置：两套预览 + 大小/透明度滑块（轨道 10、钮 22 蓝环）+ 屏幕位置（左右切换）+ 恢复默认 | 7.1 |
| `AccRelay.vue` | 中转站：插图 3 点 + 中转站开关 + 功能介绍 | 7.1 |
| `AccAppManage.vue` + `AccAppToggleList.vue` | 软件管理：30 行应用（真机图标裁切）+ 开关，默认前三个开 | 7.1 |
| `AccMoreFeatures.vue` | 更多功能：5 行，首行置灰 | 7.1 |
| `AccGameManage.vue` | 游戏管理：说明 + 13 行应用 | 7.2 |
| `AccXArena.vue` | XArena：横幅 + 说明 + 蓝色胶囊 + 四项 | 7.2 |
| `AccGameAutoUpdate.vue` | 游戏自动更新：空态「无游戏」 | 7.2 |
| `AccAppClone.vue` | 应用双开：⋮ 菜单 + 4 个推荐应用 + 体验更多应用 + XGuard 水印 | 7.5 |
| `AccAntiPeep.vue` | 防偷窥：2 页手绘插图 + 开关 + 水印 | 7.5 |
| `AccMotion.vue`（重写） | 乘车/游戏两段标签 + 4/2 页插图 + 自定义外观 + 脚注 | 7.4 |
| `AccScreenRecord.vue`（重写） | 清晰度/帧率接仓里既有的 `SheetOptionPicker`，档位换成实测 2K/1080P/720P、60/24 | 7.3 |
| `AccGame.vue`（重写） | 插图 2 页 + 两个深层入口接真页 | 7.2 |
| `AccSidebar.vue`（重写） | 四个深层入口接真页 | 7.1 |
| `SettingsAccessibility.vue` | 「动作与手势」→「手势体感」；「你可能想找」两入口接真页；删掉 `AccPending` 兜底 | 三 |
| `accessibilitySettingsStore.js` | 新增 relayEnabled / buoy* / cloneApps / antiPeep / motionTab / gameApps / sidebarApps / xarena*；`sidebarRelay` 改为由开关派生的 computed | — |

### 素材

- 插图 10 张新增/重出：`illus-relay` `illus-game2` `illus-motion(重出)/2/3/4` `illus-motion-game1/2` `illus-peep1/2` `xarena-banner` `buoy-persistent/hidden`
- 应用图标 36 张：`assets/icons/accessibility/apps/*.png`（真机截图逐行裁切，81 物理 px → 48px）

### 几何复核（真机 vs 原型，设计 px）

| 位置 | 真机 | 原型 |
|---|---|---|
| 浮标：预览图 x/宽 | 50 / 96 | 50 / 96 |
| 浮标：标签顶 / 圆点顶 | 328 / 358 | 328 / 358 |
| 浮标：卡 1 顶 / 高 | 419 / 223 | 419 / 223 |
| 浮标：轨道中线 | 477 | 477 |
| 更多功能：卡顶 / 卡高 | 98.3 / 333 | 98 / 332.4 |
| XArena：按钮顶 / 卡顶 | 344.5 / 436 | 342 / 434 |
| 软件管理：卡顶 | 98 | 98（margin-top −10） |
| 应用双开：卡顶 | 122 | 122 |
| 录屏：卡 1 顶 | 134 | 134 |
| 晕动：卡 1 顶 | 530 | 526 |
| 圆点行底 → 卡顶 | 24 | 24（acc.css 由 30 调到 24） |

### 验证

- `tests/accessibilityModule.test.js` **22/22 PASS**（重写 3 条过时断言 + 新增 4 条：侧边栏四层、游戏两层、录屏弹层档位、晕动两段标签、双开+防偷窥）
- 全量单测 **973/973 PASS**；`vite build` 通过
- 浏览器逐页走查 16 张真机并排对照：`/tmp/acc02/cmp/*.png`，主体误差 ≤4px
- 顺手修：`SheetOptionPicker` 遮罩层级（⋮ 菜单原来压住导航栏，改 z-index 11 → 导航栏仍可点）

### 仍为缺口（页面内明示，不伪装）

中转站「功能介绍」/ 更多功能四层 / 晕动「自定义外观」/ 双开「体验更多应用」/ XArena「进入 XArena」（跨应用）/ 各页第 2+ 页插图（圆点数已按实测，画面未采）。
