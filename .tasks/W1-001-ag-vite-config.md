# W1-001 · 由 Integrator 合入：`vite.config.js` 端口解耦 + `save-defaults` 默认关闭

- 类型：跨 lane 交接单（[handoff]）
- 状态：Merged
- 簇：C0-a
- Owner：AG
- 提出 / 验证：DSH
- **执行：AG（Integrator）**——`vite.config.js` 属 C0-a，DSH 不直接改
- 补丁：`.tasks/patches/W1-001-vite-config.patch`（61 行，一处文件）
- 依据：`docs/tOS-pipeline-1.0.md` §8.1 / §10 W1

## 为什么合并成一个补丁

两件事都改 `vite.config.js`。拆成两个补丁会让 AG 应用时互相冲掉上下文，
所以合成一个，**一次 apply、一次验证**。

## 改了什么

| # | 位置 | 改动 |
|---|---|---|
| 1 | `DEV_SERVER_PORT` 常量 | 从 `VITE_DEV_PORT` 或 `--port` 读取，默认 5555 |
| 2 | `server.port` | 跟随 `DEV_SERVER_PORT`（原来是写死的 `5555`） |
| 3 | `save-defaults` 的 origin 校验 | 比对**运行时实际端口**，不再比对写死常量 |
| 4 | 埋点默认端口 | 跟随 `DEV_SERVER_PORT` |
| 5 | `saveDefaultsPlugin` | 默认不注册中间件，需 `TOS_ENABLE_SAVE_DEFAULTS=1` |

## DSH 已完成的验证（不是"应该能行"）

```bash
VITE_DEV_PORT=7777 TOS_ENABLE_SAVE_DEFAULTS=1 npx vite
# → Local: http://127.0.0.1:7777/

curl -X POST localhost:7777/__api/save-defaults -H "Origin: http://127.0.0.1:7777" -d '{}'
# → 200 {"success":true,...}        ← 自定义端口不再 403

curl -X POST localhost:7777/__api/save-defaults -H "Origin: http://127.0.0.1:5555" -d '{}'
# → 403 {"error":"origin not allowed"}   ← 跨端口仍被拒

VITE_DEV_PORT=7777 npx vite            # 不带开关
# → 控制台：[save-defaults] 已禁用（默认）
# → POST 该路径 404，中间件根本没注册
```

> 验证时踩到一个坑，写在这里免得别人重犯：原先用「匹配 `configureServer` + `middlewares.use`」
> 做替换，会**误命中它前面的 `auto-transcode-mov` 插件**，把视频转码禁掉。
> 最终补丁锚定在 `name: 'save-defaults-plugin'` 上。

## 怎么合

```bash
git apply .tasks/patches/W1-001-vite-config.patch
node scripts/gate-merge.mjs      # 4 步，~19s，应全绿
git add vite.config.js && git commit -m "fix(dev): 端口解耦 + save-defaults 默认关闭"
```

## 验收（合入后）

| 检查 | 期望 |
|---|---|
| 各 lane 用自己的端口 `VITE_DEV_PORT=7777 npm run dev` | 起得来，控制台开始就是 7777 |
| 不开开关时拖微调滑杆 | `git status` 无 diff |
| 开 `TOS_ENABLE_SAVE_DEFAULTS=1` | 原回写行为恢复 |

## 影响面

- 生产构建不包含这些中间件，构建产物无变化
- 若有人依赖控制台"设为默认"，需显式带环境变量启动，建议写进 README
