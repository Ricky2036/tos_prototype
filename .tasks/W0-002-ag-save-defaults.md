# W0-002 · 由 Integrator 合入：`save-defaults` 默认关闭

- 类型：**跨 lane 交接单**（`[handoff]`）
- 提出：DSH
- **执行：AG（Integrator）**——`vite.config.js` 属 C0-a，DSH 不直接改
- 依据：`docs/tOS-pipeline-1.0.md` §8.1
- 补丁：`.tasks/patches/W0-002-save-defaults.patch`（20 行，纯新增）

## 为什么

`vite.config.js` 的 `save-defaults` 中间件会 `writeFileSync` 覆盖
`src/stores/controlStore.js`。触发点只是开发控制台里拖一下微调滑杆。

后果：**没人改代码，工作区却出现 diff**。三个 lane 并行时，这会被误判成
「我的改动被回退了」，从而浪费排查时间——v1.2 稿里那条"共享 `.git` 导致改动丢失"
的误诊，根源就是它。

## 怎么合

```bash
git apply .tasks/patches/W0-002-save-defaults.patch
node scripts/gate-merge.mjs        # 18.9s，应全绿
git add vite.config.js && git commit -m "fix(dev): save-defaults 默认关闭，改显式开关"
```

## 验收

| 检查 | 期望 |
|---|---|
| 默认 `npm run dev` | 控制台出现 `[save-defaults] 已禁用（默认）` |
| 拖动微调滑杆后 `git status` | **无 diff** |
| `TOS_ENABLE_SAVE_DEFAULTS=1 npm run dev` | 原有回写行为恢复 |

## 影响面

- 只影响开发期控制台微调面板的"设为默认"功能；生产构建不包含该中间件
- 若有人依赖它批量保存默认值，需显式带环境变量启动，在 README 里注明
