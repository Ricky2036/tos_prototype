# 真机证据清单（device-infinix）

采集设备：Infinix X6878 / 1208×2644 / XOS 17.0.0.046。
每页一份 `page.xml`（uiautomator dump）+ `page.png`（整屏截图），契约由 `tools/contract/spec-batch.mjs` 生成。

| pageId | 期望页面 | dump 实际标题 | sha12 | 状态 |
|---|---|---|---|---|
| `settings/dateTime/date-time-residence-picker` | date time residence picker | 日期与时间 | fe169d5cccf1 | ❌ 取证错页（需重采） |
| `settings/dateTime/date-time-timezone-picker` | date time timezone picker | 选择时区 | 1e812f255efa | ✅ |
| `settings/dateTime` | dateTime | 日期与时间 | 6f1dbcd76e58 | ✅ |
| `settings/safetyEmergency` | safetyEmergency | 安全和紧急情况 | ca858ff8e3b9 | ✅ |
| `settings/system` | system | 系统 | e1a83c38cd73 | ✅ |
| `settings/system/system-developer-options` | developer options | 开发者选项 | 851cc4598f98 | ✅ |
| `settings/system/system-enhanced-services` | enhanced services | 增强服务 | 732b543ef727 | ✅ |
| `settings/system/system-language` | language | 语言与输入法 | 098365ea2acc | ✅ |
| `settings/system/system-navigation` | navigation | 系统导航 | 666a49ef5c8f | ✅ |
| `settings/system/system-power-button` | power button | 按住电源按钮 | fa7737759ff8 | ✅ |
| `settings/system/system-reset-phone` | reset phone | 定时开关机与重启 | 38290d289954 | ❌ 取证错页（需重采） |
| `settings/system/system-schedule-power` | schedule power | 定时开关机与重启 | 38290d289954 | ✅ |
| `settings/system/system-usb-backup` | usb backup | 设置定时开机 | 44ac5ed7fc83 | ❌ 取证错页（需重采） |

合格 10 页 / 错页 3 页。

## 已知错页（遍历脚本点错行，dump 落在了别的页面）

- `settings/system/system-reset-phone`：实际内容是「定时开关机与重启」页（与 schedule-power 的 sha 完全相同）。
- `settings/system/system-usb-backup`：实际内容是「设置定时开机」时间弹层，不是 USB 备份页。
- `settings/dateTime/date-time-residence-picker`：实际内容是「日期与时间」页本体；常驻地在实现里是底部弹层（SheetOptionPicker），不是独立页。

这三页的契约已删除，覆盖矩阵里显示为「无 spec」。重采要点：
1) 每次点击后先确认 `toolbar_title` 变成目标页标题，再 dump；
2) 弹层类目标（时间/常驻地）要确认 dump 里出现弹层节点（如 `modal`/`sheet` 层级），不能只看 Activity；
3) dump 落盘时把 `toolbar_title` 写进文件名，便于事后核对（本次三页错在遍历脚本没有断言标题）。
