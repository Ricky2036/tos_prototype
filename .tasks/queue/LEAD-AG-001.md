# LEAD-AG-001 · GitHub Pages 发布流水线修复

- size: S
- status: review
- priority: P0
- claim: C0-infra
- owner: Antigravity
- exclusive_files: [".github/workflows/deploy.yml"]
- depends: []
- 验收：`deploy.yml` 统一为 Node 24 + 安装 Chromium + 15 分钟硬超时，排查 Pages 排队原因并确保后续部署不再挂死。

## 进展

1. 修复根因：原 `deploy.yml` 使用 Node 20 且显式跳过 Chromium 安装，但在未预置浏览器环境下执行 `npm test` 会导致 `vueRuntime` 启动 Vite 后卡死子进程，且缺乏超时时间，阻塞了 `concurrency: group: "pages"` 队列。
2. 修复对齐：统一环境为 `ubuntu-24.04`、`Node 24`、`actions/checkout@v5`、`actions/setup-node@v5`、真实安装 Chromium 并设定 15 分钟硬超时。
3. 提交与分支：已在 `antigravity/lane` 产出提交 `0b83fba`，并在集成工作区 cherry-pick 形成 `ad0b33a`。
