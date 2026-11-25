# Q-040 双机型桌面正式接入

补丁以 `8b9569a` 为基线，包含 AG 已合入的机型开关 `c512b6e` 和预览适配 `4fdb561`。集成分支合入这条基线后，校验并应用同目录下的 `Q-040-device-desktop-release.patch`。补丁直接改动正式前端的 20 个文件，上线采用现有 GitHub Pages 工作流。素材使用已有的预览素材，由 Vite 按部署子路径打包。

```sh
git apply --check .tasks/patches/Q-040-device-desktop-release.patch
git apply .tasks/patches/Q-040-device-desktop-release.patch
```

- 直板使用旧版桌面网格，图标 55、Widget 145 逻辑像素。阔直板使用设计稿布局，图标 58、Widget 154。保留已有的直板桌面存档读取路径。
- 两种机型使用同一个系统和应用窗口。补丁整合时钟、AI Suggestions 和普通应用图标的返回动画，并修正切换机型期间普通图标的隐藏状态。
- 已在隔离副本验证补丁应用、Vite 生产构建和 25 项桌面布局及 Hero 几何单测。使用 Chromium 通过 Pages 子路径验证素材、机型往返切换、正在运行的 AppWindow 实例保留、Clock 和 AI Suggestions 返回，以及普通图标在两种机型下恢复。生产构建仍有分包体积警告。
- 集成者负责登记补丁中的共享文件，运行正式合并门禁和完整的跨模块双机型验收，然后发布并在 Pages 检查上述路径。本补丁的浏览器验证覆盖桌面控制台，移动控制台、其余应用与真机规格按迁移队列继续验收。
