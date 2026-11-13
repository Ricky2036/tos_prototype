# LEAD-AG-001 · GitHub Pages 发布流水线修复

- size: S
- status: done
- priority: P0
- claim: C0-infra
- owner: Antigravity
- exclusive_files: [".github/workflows/deploy.yml"]
- depends: []
- 验收：`deploy.yml` 统一为 Node 24 + 安装 Chromium + 15 分钟硬超时，排查 Pages 排队原因并确保后续部署不再挂死。

## 进展与验收证据

1. 修复根因：原 `deploy.yml` 使用 Node 20 且显式跳过 Chromium 安装，但在未预置浏览器环境下执行 `npm test` 会导致 `vueRuntime` 启动 Vite 后卡死子进程，且缺乏超时时间，阻塞了 `concurrency: group: "pages"` 队列。
2. 修复对齐：统一环境为 `ubuntu-24.04`、`Node 24`、`actions/checkout@v5`、`actions/setup-node@v5`、真实安装 Chromium 并设定 15 分钟硬超时。
3. 真实运行结果：
   - Deploy to GitHub Pages Run：https://github.com/Ricky2036/tos_prototype/actions/runs/43374975698（提交 `eff28a6`，10 步全部通过，耗时 1m26s，状态 success）
   - Verify CI Run：https://github.com/Ricky2036/tos_prototype/actions/runs/43374975781（提交 `eff28a6`，G3 单测、G3 构建、G7 棘轮全部通过，耗时 1m44s，状态 success）
   - 排队阻塞已消除：卡死的旧运行 43358660888 已取消，互斥组恢复正常调度。
