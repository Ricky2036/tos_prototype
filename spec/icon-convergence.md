# 图标收敛审计（2026-11-27）

## 方法

用脚本扫 `src/**/*.vue` 共 **490 个文件**，把每个内联 `<svg>` 按
「viewBox + 排序后的 path 集合 + 子元素数」做指纹，忽略尺寸/颜色差异后分组，
取出出现 **≥3 次** 的重复组，共 **49 组**。

## 重复最严重的 10 组

| 图标 | 处数 | 文件数 | 现状 | 处理 |
|---|---|---|---|---|
| 右箭头 `viewBox 0 0 7 12` | 57 | 18 | 内联（50 处带 `.lc-chevron` 等 class） | **未收敛**，见下 |
| 右箭头 `M9 18l6-6-6-6` | 54 | 13 | 内联 | **未收敛** |
| 搜索放大镜 | 47 | 38 | 内联 + 部分 LIcon | 后续 |
| 勾选 ✓ | 38 | 25 | 内联 | 后续 |
| 关闭 × | 37 | 31 | 内联（多形态） | 部分收敛（形状唯一那支） |
| `CLOCK_ICONS.*` | 59 | 4–5 | **已是共享常量** | 无需处理 |
| 垃圾桶 | 13 | 7 | 部分内联 | **已收敛** |
| 关闭 ×（18×24 版） | 13 | 2 | 内联 | **已收敛** |
| 电话听筒（填充） | 9 | 7 | 内联 | **已收敛** |
| 加号 `M12 5v14M5 12h14` | 8 | 7 | 内联 | **已收敛** |

## 本轮落地：4 个通用件 / 40 处 / 20 个文件

| 组件 | 路径 | API | 替换处数 |
|---|---|---|---|
| `PhoneIcon` | `ui/PhoneIcon.vue` | `size` `color` `style` | 9 / 7 文件 |
| `PlusIcon` | `ui/PlusIcon.vue` | `size` `color` `strokeWidth` | 8 / 7 文件 |
| `CloseIcon` | `ui/CloseIcon.vue` | `size` `color` `strokeWidth` | 13 / 2 文件 |
| `TrashIcon` | `ui/TrashIcon.vue` | `size` `color` `strokeWidth` | 10 / 4 文件（system 层）+ 之前电话 6 处 |

`TrashIcon` 同时是「带两条竖线」的唯一正确来源，单测已固化这条。

## 为什么右箭头这 127 处没动

- **50 处带 class**（`.lc-chevron` 等），尺寸/颜色由 CSS 决定，换成组件会丢样式，
  必须逐个配合 CSS 改写；
- 剩下 77 处横跨 22 个文件、尺寸 6–16 各不相同，且两种 viewBox 网格混用。
- 一次性替换的 diff 会覆盖 40 个文件，排查成本高于收益。

建议单独一轮做，并同步把 `.lc-chevron` 这类选择器改成组件内的 props。

## 防回归

`tests/messagesApp.test.js` 里三条用例守门：
1. `TrashIcon` 必须有 2 条 `<line>`（桶内竖线）
2. 电话 6 个文件必须用 `<TrashIcon>`，不得再出现缺竖线的内联 path
3. 短信左滑 + 多选栏必须都用 `<TrashIcon>`

## 附录：右箭头 127 处明细（按文件 / 行号）

```
════ 7×12 网格：57 处 / 18 文件 ════
   10  apps/settings/SettingsPrayer.vue  [cell-chevron]  行 512,536,547,564,657,672,691,726,757,767
    8  apps/settings/SettingsAccount.vue  [chevron-icon]  行 146,161,180,197,214,234,252,278
    8  apps/settings/SettingsCloudBackup.vue  [cb-cell-state / cb-restore / cb-cell-sub]  行 538,572,612,652,692,820,1000,1021
    7  apps/settings/SettingsAccountSecurity.vue  [chevron-icon]  行 199,212,224,250,262,274,286
    4  apps/clock/subpages/MuslimAlarmSettings.vue  [setting-chevron]  行 146,159,172,185
    3  apps/settings/SettingsDND.vue  [dc-val / dc-right]  行 132,148,160
    3  apps/settings/SettingsCloudHome.vue  [chevron-icon / apps-sync-all]  行 96,122,282
    2  apps/settings/SettingsWallet.vue  [chevron-icon]  行 85,107
    2  apps/settings/sim/TrafficManage.vue  [tm-chevron]  行 187,206
    2  apps/settings/sim/TmSettings.vue  [tm-chevron]  行 46,70
    1  ui/RegisteredAppList.vue  [lc-chevron]  行 57
    1  ui/ListCell.vue  [lc-chevron]  行 52
    1  apps/settings/SettingsNotifications.vue  [pm-label]  行 360
    1  apps/settings/SettingsApp.vue  [lc-chevron]  行 393
    1  apps/settings/infinixai/AiSubPage.vue  [lc-chevron]  行 87
    1  apps/settings/sim/TmLimit.vue  [tm-chevron]  行 92
    1  apps/settings/sim/TmSaveMode.vue  [tm-chevron]  行 44
    1  apps/settings/accessibility/AccAppClone.vue  [clone-chevron]  行 89

════ 24×24 网格：54 处 / 13 文件 ════
   14  apps/phone/settings/PhoneSettings.vue  [chevron-icon]  行 85,95,105,112,122,129,136,143,152,162,170,180,187,194
   10  apps/phone/settings/PhoneAiAssistant.vue  [row-label / red-dot / summary-text]  行 81,91,123,133,140,178,188,210,220,233
    6  apps/phone/settings/PhoneAdvancedSettings.vue  [row-label / summary-text / row-sub]  行 129,136,149,159,169,241
    5  apps/phone/settings/PhoneCarrierFeatures.vue  [row-label / row-sub]  行 60,74,109,116,123
    4  apps/phone/settings/PhoneHarassmentInterception.vue  [badge-count / row-sub]  行 198,215,228,243
    3  apps/phone/PhoneCallDetailModal.vue  [menu-text]  行 217,224,233
    3  apps/phone/PhoneContactDetailModal.vue  [menu-text]  行 167,174,183
    2  system/ShareSheet.vue  [share-privacy-link / share-transfer-arrow]  行 148,220
    2  apps/phone/settings/PhoneUnknownId.vue  [summary-text / row-label]  行 103,111
    2  apps/phone/settings/PhoneNoiseReduction.vue  [summary-text]  行 68,78
    1  apps/phone/settings/PhoneAbout.vue  [row-sub]  行 49
    1  apps/phone/settings/PhoneAutoRecord.vue  [badge-count]  行 146
    1  apps/phone/settings/PhoneFlashCallSettings.vue  [add-text]  行 103

════ 24 变体：16 处 / 9 文件 ════
    4  apps/settings/modes/ModeDetailView.vue  [cell-chevron]  行 188,214,240,294
    2  apps/settings/modes/ModeActionCategoriesPage.vue  [search-item-cat / cat-chevron]  行 112,143
    2  apps/settings/modes/ModesTab.vue  [mode-chevron]  行 109,124
    2  apps/settings/modes/ModeDndSubpage.vue  [chevron-icon]  行 63,73
    2  apps/settings/modes/AddCustomModeModal.vue  [chevron-icon]  行 96,114
    1  apps/settings/modes/RoutineActionPicker.vue  [picker-row-action]  行 123
    1  apps/settings/modes/ModeActionListPage.vue  [action-item-arrow]  行 98
    1  apps/settings/modes/RoutineConditionPicker.vue  [picker-row-action]  行 134
    1  apps/settings/modes/ModeConditionCategoriesPage.vue  [condition-item-arrow]  行 124

════ 7×12 变体：8 处 / 2 文件 ════
    6  apps/clock/subpages/AlarmEditModal.vue  [chevron-icon]  行 196,230,248,261,274,289
    2  apps/clock/subpages/ClockGeneralSettings.vue  [setting-hint / setting-value]  行 27,40
```
