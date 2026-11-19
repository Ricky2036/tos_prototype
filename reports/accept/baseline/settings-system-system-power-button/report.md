# 验收判决书 · settings/system/system-power-button

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-power-button.geometry.json`（sha256 `f83a5e1dab43e1265098ffec7ac8fb65a9769f74a71382994d63f063b3d9315b`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:53.629Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,100.8,20 | dx -8.2 dy 13.7 dw -143 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:电源菜单 | row | 16.1,472.7,327.8,54.8 | 16,154,328,52 | dx -0.1 dy -318.7 dw 0.2 dh -2.8（worst 318.7） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:数字助理 | row | 16.1,527.5,327.8,54.8 | 16,206,328,52 | dx -0.1 dy -321.5 dw 0.2 dh -2.8（worst 321.5） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| group:按住电源按钮即可访问 | group | 31.9,442.6,140.1,30.1 | 32,131,130,16 | dx 0.1 dy -311.6 dw -10.1 dh -14.1（worst 311.6） | ❌ FAIL | text | ✓ |
| group:电源菜单： 
长按电源键 3 秒。 | group | 31.9,598.5,296.2,30.1 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

| # | 文本 | 实测(x,y,w,h) | 选择器线索 |
|---|---|---|---|
| 1 | 电源菜单：长按电源键 3 秒。 | 16,270,328,63 | `.footer-note（无行级 data-* 属性）` |

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `group:电源菜单： 
长按电源键 3 秒。`（group，期望 31.9,598.5,296.2,30.1，文本「[object Object]」）

## 合计

- spec 节点 **6**；命中 **5/6**（matchRate **0.833**）
- pass **0** / fail **5** / missing **1** / extra **1** / skipped **0**
- **结论**：❌ **不通过**：5 个几何超差，1 个漏做，1 个自造（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-power-button.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-power-button \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-power-button
```

## 定位诊断（不影响判定，供人复核）

- `row:电源菜单`：ambiguous-row-text —— 2 个行级元素匹配「电源菜单」
- `row:数字助理`：ambiguous-row-text —— 2 个行级元素匹配「数字助理」
- `group:电源菜单： 
长按电源键 3 秒。`：text-not-found —— 精确文本「电源菜单： 
长按电源键 3 秒。」不存在
