# 验收判决书 · settings/system/system-navigation

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-navigation.geometry.json`（sha256 `7cdc0721d4e61647397b5e39f810eedca32cc0f739b39df1835195a4e247f3c9`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:48.590Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,51.3,243.8,21.2 | 72,67,67.2,20 | dx -8.2 dy 15.7 dw -176.6 dh -1.2（worst 15.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,39.9,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 20.1 dw -10.1 dh -10.1（worst 15） | ❌ FAIL | role:header-back | — |
| row:学习手势 | row | 16.1,442.6,327.8,345.4 | 16,463,328,52 | dx -0.1 dy 20.4 dw 0.2 dh -293.4（worst 293.4） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:学习手势#2 | row | 16.1,442.6,327.8,61.4 | 16,463,328,52 | dx -0.1 dy 20.4 dw 0.2 dh -9.4（worst 20.4） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:隐藏手势导航条 | row | 16.1,520.1,327.8,51.9 | 16,539,328,53 | dx -0.1 dy 18.9 dw 0.2 dh 1.1（worst 18.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:圈定即搜 | row | 16.1,571.9,327.8,80.2 | 16,592,328,84.2 | dx -0.1 dy 20.1 dw 0.2 dh 4（worst 20.1） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:语音助手 | row | 16.1,652.1,327.8,84 | 16,676.2,328,83.2 | dx -0.1 dy 24.1 dw 0.2 dh -0.8（worst 24.1） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| group:手势导航 | group | 32.2,338.3,147.8,16.1 | 32,146,140,273 | dx -0.2 dy -192.3 dw -7.8 dh 256.9（worst 192.3） | ❌ FAIL | text | ✓ |
| group:三键导航 | group | 180,338.3,147.8,16.1 | 188,146,140,273 | dx 8 dy -192.3 dw -7.8 dh 256.9（worst 192.3） | ❌ FAIL | text | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

无。

## 合计

- spec 节点 **9**；命中 **9/9**（matchRate **1**）
- pass **0** / fail **9** / missing **0** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：9 个几何超差（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-navigation.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-navigation \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-navigation
```

## 定位诊断（不影响判定，供人复核）

- `row:学习手势`：ambiguous-row-text —— 3 个行级元素匹配「学习手势」
- `row:学习手势#2`：ambiguous-row-text —— 3 个行级元素匹配「学习手势」
- `row:隐藏手势导航条`：ambiguous-row-text —— 2 个行级元素匹配「隐藏手势导航条」
- `row:圈定即搜`：ambiguous-row-text —— 2 个行级元素匹配「圈定即搜」
- `row:语音助手`：ambiguous-row-text —— 2 个行级元素匹配「语音助手」
