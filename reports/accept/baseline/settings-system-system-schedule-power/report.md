# 验收判决书 · settings/system/system-schedule-power

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-schedule-power.geometry.json`（sha256 `1b36ed28b5905c7c523b9a575cdf5b930df480bb4a372842c66817bdabf84053`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:58.684Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,51.3,243.8,21.2 | 72,67,134.4,20 | dx -8.2 dy 15.7 dw -109.4 dh -1.2（worst 15.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,39.9,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 20.1 dw -10.1 dh -10.1（worst 15） | ❌ FAIL | role:header-back | — |
| row:定时开机 | row | 16.1,96,327.8,34 | 16,122,328,28 | dx -0.1 dy 26 dw 0.2 dh -6（worst 26） | ❌ FAIL | text | ✓ |
| row:07:00 | row | 16.1,129.9,327.8,71.8 | 16,162,328,82.6 | dx -0.1 dy 32.1 dw 0.2 dh 10.8（worst 32.1） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:定时关机 | row | 16.1,205.6,327.8,34 | 16,268.6,328,28 | dx -0.1 dy 63 dw 0.2 dh -6（worst 63） | ❌ FAIL | text | ✓ |
| row:20:00 | row | 16.1,239.6,327.8,71.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:定时重启 | row | 16.1,315.3,327.8,34 | 16,415.2,328,28 | dx -0.1 dy 99.9 dw 0.2 dh -6（worst 99.9） | ❌ FAIL | text | ✓ |
| row:05:00 | row | 16.1,349.3,327.8,71.8 | 16,455.2,328,82.6 | dx -0.1 dy 105.9 dw 0.2 dh 10.8（worst 105.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

| # | 文本 | 实测(x,y,w,h) | 选择器线索 |
|---|---|---|---|
| 1 | 23:00每天 | 16,308.6,328,82.6 | `.settings-card（无行级 data-* 属性）` |

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `row:20:00`（row，期望 16.1,239.6,327.8,71.8，文本「[object Object]」）

## 合计

- spec 节点 **8**；命中 **7/8**（matchRate **0.875**）
- pass **0** / fail **7** / missing **1** / extra **1** / skipped **0**
- **结论**：❌ **不通过**：7 个几何超差，1 个漏做，1 个自造（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-schedule-power.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-schedule-power \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-schedule-power
```

## 定位诊断（不影响判定，供人复核）

- `row:07:00`：ambiguous-row-text —— 2 个行级元素匹配「07:00」
- `row:20:00`：text-not-found —— 精确文本「20:00」不存在
- `row:05:00`：ambiguous-row-text —— 2 个行级元素匹配「05:00」
