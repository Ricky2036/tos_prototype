# W2-002 · Antigravity：App 级自注册 + Hero 就绪信号

- 类型：常规任务
- 状态：Active
- 簇：C0-a
- Owner：AG
- 依据：`docs/tOS-pipeline-1.0.md` §6.1 / §6.4

## 目标一：加一个 App 不再改 7 个文件

现状：38 个应用只有 10 个有目录；加一个应用到要改
`apps.js` / `registry.js` / `app-names.js` / `i18nStore.js` / `ScreenView.vue` / `lucide.js` / `public/icons`。

### 做法

1. **统一纯数据应用表**：`id`、`names`(zh/en/bn)、`initial`、`pinyin`、`dock`/`pinned`/`page`、
   `icon`、`heroBackground`、`special`、`darkStatusBar`、`hiddenOnDesktop`。
   `apps.js`、`drawerApps.js`、状态栏反色都从它派生。
2. **只给 10 个深度应用**建 `apps/<id>/entry.js`：
   `export default { id, component: () => import('./XxxApp.vue') }`
   `registry.js` 用 `import.meta.glob('./*/entry.js', { eager: true })` 汇总，未注册回落 `PlaceholderApp`。
3. 删掉 `vite.config.js` 里手工枚举业务路径的 `manualChunks`。

### 红线

- **不要**给 28 个占位应用建空目录
- `appDrawer.test.js` 锁死 38 个应用一致、`registeredAppList.test.js` 校验同源——**不能破**

### 验收

```bash
node scripts/gate-merge.mjs        # 5 步全过
node --test tests/appDrawer.test.js tests/registeredAppList.test.js
# 手工：临时加一个假 entry.js，确认只需 1 个新文件即可出现在桌面与抽屉
```

## 目标二：Hero 白闪

`AppWindow.vue` 的 `ready.value = true` 在 `:168` 与 `:180` 都是**无条件**的，
与异步子组件是否挂载无关。把淡入挂在 `ready` 上等于没等。

| 信号 | 控制 | 置位时机 |
|---|---|---|
| `ready` | `heroFill` 与图标过渡 | 保持现状 |
| `contentReady` | `.aw-content` 的 opacity | 异步组件 `@vue:mounted` 或 `<Suspense>` resolve |

外加**按下即预载**：桌面图标 `pointerdown` 触发 `preload()`。

### 验收

**真机录屏逐帧**看 hero 展开末段是否露底色。单测抓不住——这条不接受"我看没问题"。
