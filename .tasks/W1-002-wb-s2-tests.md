# W1-002 · S2 八个源码正则测试转运行时行为断言

- 类型：常规任务
- 状态：Review
- 簇：C2
- Owner：Workbuddy
- 依据：`docs/tOS-pipeline-1.0.md` §6.5
- 前置：无（可立即开工，不依赖 AG 的补丁）

## 为什么是这八个

主壳要从「34 个页面静态 import」改成「glob 自注册」。而那批测试是
`readFileSync('SettingsApp.vue')` + 正则匹配源码文本——**一改 import 就整片假红**。

不改测试，S2 迁移第一天就会红 8 个文件，然后所有人开始怀疑门禁。

## 清单（每个都要从"读源码匹配"改成"跑起来断言行为"）

| 测试文件 | 现在在断什么 | 改成 |
|---|---|---|
| `tests/displaySoundSubpages.test.js` | 匹配 `SettingsDisplay.vue` 里的字符串/结构 | 挂载后断言 DOM：行数、文案、点击后路由 |
| `tests/cardSpec.test.js` | 匹配卡片样式字面量 | 断言渲染后 `getComputedStyle` 的圆角/内边距 |
| `tests/settingsFeatureGroup.test.js` | 匹配分组与条目名 | 断言分组数与条目可见性 |
| `tests/transitionContract.test.js` | 匹配过渡类名存在 | 触发后断言类名出现再消失 |
| `tests/sheetModalAnim.test.js` | 匹配动画关键帧字符串 | 断言弹层打开/关闭的最终态 |
| `tests/phoneApp.test.js` | 匹配电话页结构 | 断言拨号/最近任务的真实交互 |
| `tests/settingsMenu.test.js` | 匹配首页列表条目 | 断言条目可点且跳转正确（**只改显示/声音/无障碍相关片段**） |
| `tests/largeTitle.test.js` | 匹配标题字符串 | 断言大标题文本随路由变化（**同上，只改相关片段**） |

## 硬要求

1. **不许删断言换绿灯。** G7 棘轮会拦（`tests/baseline.json` 记着 835 用例）。
   改造后用例数应**不减少**；确需减少必须同批更新基线并说明。
2. **先跑一次** `node scripts/gate-merge.mjs`（~19s）确认当前是绿的，再动手。
3. 每改完一个文件跑 `node --test tests/<file>`，绿了再下一个。
4. **不要动** `src/` 下任何代码——这一单只改测试。

## 交付

```bash
node scripts/gate-merge.mjs     # 必须全绿
git add tests/                  # 只提交这 8 个文件
```

交接时贴：改了哪几个、用例数前后（`node --test --test-reporter=tap tests/*.test.js | grep "^# pass"`）。

## 备注

八改完之前，**S2 三页迁移不要开工**——顺序反了会制造一片假红，比不做更糟。
