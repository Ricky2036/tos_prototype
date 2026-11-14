# SET-SYS-01 · 设置系统主页与全部子菜单 100% 真机复刻

- size: L
- status: done
- priority: P1
- claim: C-sys
- owner: Antigravity
- branch: antigravity/lane
- exclusive_files: [
    "src/components/apps/settings/pages/system.js",
    "src/components/apps/settings/system/**",
    "src/components/apps/settings/pages/dateTime.js",
    "src/components/apps/settings/dateTime/**",
    "src/stores/dateTimeStore.js",
    "tests/systemSettings.test.js",
    "tests/dateTimeSettings.test.js"
  ]
- depends: []
- 验收标准：
  1. 页面自声明：`pages/system.js` 导出规范元数据（id: 'general', title: '系统', group: '系统'），通过 glob 自动接入设置路由与搜索池。
  2. 10 行 4 卡 1 组头完全一致：严格基于真机证据 `system.xml` 与 `03-system-page.png`，彻底废除旧版虚构内容。
  3. 全部子菜单真实落地：
     - 卡片 1：系统导航（手势 vs 三键、灵敏度）、日期与时间（补齐日期/时间选择器、时区写回、常驻地与双时钟等真机叶子）、语言与输入法（语言列表与输入法管理）
     - 卡片 2：按住电源按钮（访问数字助理 vs 电源菜单）、定时开关机与重启（开机/关机定时计划）
     - 独立组头：备份、重置与恢复
     - 卡片 3：备份到Google云端硬盘（深层沿用既有暂缓并列出）、USB 备份和恢复（本地/OTG 存储备份）、重置手机（还原网络/还原偏好/清除所有数据原型模拟）
     - 卡片 4：开发者选项（总开关、核心调试项）、增强服务（体验改善计划开关）
  4. 返回栈闭环：各子页面通过 inject('settingsNav') 或内联子路由返回系统主页，再由系统主页返回设置首页。
  5. 自动化测试通过：`node --test tests/systemSettings.test.js` 与 `node scripts/gate-merge.mjs` 全绿。

## 一、真实真机数据源
- 设备：Infinix X6878 / Android 17 / XOS 17.0.0.046
- 证据路径：`.local-evidence/SET-DSH-01/system.xml` 及 `03-system-page.png`

## 二、主页结构清单（10 行 4 卡 1 分组标题）

### 卡片 1（3 行）：
1. 系统导航：右侧 chevron，点击进入系统导航方式子页。
2. 日期与时间：右侧 chevron，点击进入日期与时间子页（补齐真机叶子缺口）。
3. 语言与输入法：右侧 chevron，点击进入系统语言与输入法子页。

### 卡片 2（2 行）：
4. 按住电源按钮：右侧显示「访问数字助理」及 chevron，点击进入电源键长按行为子页。
5. 定时开关机与重启：右侧 chevron，点击进入定时开关机计划子页。

### 分组标题（独立节点，class: `group-header`）：
- 标题文本：`备份、重置与恢复`

### 卡片 3（3 行）：
6. 备份到Google云端硬盘：右侧 chevron，点击进入云端备份状态子页。
7. USB 备份和恢复：右侧 chevron，点击进入本地/OTG 备份子页。
8. 重置手机：右侧 chevron，点击进入重置选项子页。

### 卡片 4（2 行）：
9. 开发者选项：右侧 chevron，点击进入开发者选项子页。
10. 增强服务：右侧 chevron，点击进入增强服务子页。

## 三、文件布局规范
- `src/components/apps/settings/pages/system.js`
- `src/components/apps/settings/system/SettingsSystem.vue`
- `src/components/apps/settings/system/subpages/SystemNavigation.vue`
- `src/components/apps/settings/system/subpages/SystemLanguage.vue`
- `src/components/apps/settings/system/subpages/SystemPowerButton.vue`
- `src/components/apps/settings/system/subpages/SystemSchedulePower.vue`
- `src/components/apps/settings/system/subpages/SystemUsbBackup.vue`
- `src/components/apps/settings/system/subpages/SystemResetPhone.vue`
- `src/components/apps/settings/system/subpages/SystemDeveloperOptions.vue`
- `src/components/apps/settings/system/subpages/SystemEnhancedServices.vue`
- `tests/systemSettings.test.js`
