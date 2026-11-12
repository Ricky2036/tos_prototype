# W2-003 · DSH：G6 认领边界（并行前的地基）

- 类型：常规任务
- 状态：Active
- 簇：C0（基建）
- Owner：DSH
- 依据：`docs/tOS-pipeline-1.0.md` §3.3 / §6 G6

## 为什么它排在并行之前

今天已经出了两次同类事故，都不是谁不小心：

| 事故 | 根因 |
|---|---|
| AG 从 `dsh/lane` checkout 文件 → 索引里塞了外来改动 | 没有"哪些文件归谁"的登记 |
| WB 把基建拷过去 → 4 个文件分叉，合并冲突 | 同上 |

默契在三个 Agent 之间必然失效。G6 把默契换成登记表。

## 设计

```
.claims/C2.json
  { "owner": "workbuddy", "since": "2026-11-13", "branch": "workbuddy/lane",
    "files": ["src/components/apps/settings/display/**", "src/components/apps/settings/SettingsDisplay.vue"] }
```

校验规则：

```
改动文件 ⊆ (认领簇的文件列表) ∪ (C0 锁 ∧ owner 是 Integrator) ∪ ([handoff] 白名单)
```

## 交付

| 文件 | 内容 |
|---|---|
| `.claims/*.json` | 每簇一个，登记 owner 与文件 glob |
| `scripts/claim-check.mjs` | 读 `git diff --name-only <base>..HEAD`，比对认领表，输出越界清单 |
| `scripts/gate-merge.mjs` | 追加 `Gclaim` 一步（先 advisory，不阻塞） |
| `tests/pipelineClaim.test.js` | 纯函数单测：命中 / 越界 / 白名单 / C0 锁 |

## 退出码

`0` 全部在认领范围内 / `1` 有越界 / `2` 参数错

## 验收

```bash
node scripts/claim-check.mjs --base origin/main
# 应列出本分支改动落在哪个簇、有无越界

node --test tests/pipelineClaim.test.js
node scripts/gate-merge.mjs      # 6 步
```

## 之后

W3 把 `Gclaim` 从 advisory 转阻塞。转阻塞前必须先跑满两周、确认无误报。
