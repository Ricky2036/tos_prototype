# 验收判决书 · settings/dateTime/date-time-timezone-picker

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/dateTime/date-time-timezone-picker.geometry.json`（sha256 `533da20336d17aa64f64cff8121074c72bd116dc043a5005bffa8d431970f6c0`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:19.877Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,199.7,21.2 | 72,67,67.2,20 | dx -8.2 dy 13.7 dw -132.5 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:吉隆坡 | row | 16.1,0,327.8,36.4 | 16,110,328,52 | dx -0.1 dy 110 dw 0.2 dh 15.6（worst 110） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:马尼拉 | row | 16.1,36.4,327.8,67.7 | 16,162,328,52 | dx -0.1 dy 125.6 dw 0.2 dh -15.7（worst 125.6） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:北京 | row | 16.1,104,327.8,67.7 | 16,214,328,52 | dx -0.1 dy 110 dw 0.2 dh -15.7（worst 110） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:香港 | row | 16.1,171.7,327.8,67.7 | 16,266,328,52 | dx -0.1 dy 94.3 dw 0.2 dh -15.7（worst 94.3） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:新加坡 | row | 16.1,239.3,327.8,67.7 | 16,318,328,52 | dx -0.1 dy 78.7 dw 0.2 dh -15.7（worst 78.7） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:斯里巴加湾 | row | 16.1,307,327.8,67.7 | 16,370,328,52 | dx -0.1 dy 63 dw 0.2 dh -15.7（worst 63） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:望加锡 | row | 16.1,374.6,327.8,67.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:首尔 | row | 16.1,442.3,327.8,67.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:东京、大阪 | row | 16.1,509.9,327.8,67.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:雅库茨克 | row | 16.1,577.6,327.8,67.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:赤塔 | row | 16.1,645.2,327.8,67.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:帝力 | row | 16.1,712.9,327.8,67.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `row:望加锡`（row，期望 16.1,374.6,327.8,67.7，文本「[object Object]」）
- ⬜ `row:首尔`（row，期望 16.1,442.3,327.8,67.7，文本「[object Object]」）
- ⬜ `row:东京、大阪`（row，期望 16.1,509.9,327.8,67.7，文本「[object Object]」）
- ⬜ `row:雅库茨克`（row，期望 16.1,577.6,327.8,67.7，文本「[object Object]」）
- ⬜ `row:赤塔`（row，期望 16.1,645.2,327.8,67.7，文本「[object Object]」）
- ⬜ `row:帝力`（row，期望 16.1,712.9,327.8,67.7，文本「[object Object]」）

## 合计

- spec 节点 **14**；命中 **8/14**（matchRate **0.571**）
- pass **0** / fail **8** / missing **6** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：8 个几何超差，6 个漏做（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/dateTime/date-time-timezone-picker.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/dateTime/date-time-timezone-picker \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-dateTime-date-time-timezone-picker
```

## 定位诊断（不影响判定，供人复核）

- `row:吉隆坡`：ambiguous-row-text —— 2 个行级元素匹配「吉隆坡」
- `row:马尼拉`：ambiguous-row-text —— 2 个行级元素匹配「马尼拉」
- `row:北京`：ambiguous-row-text —— 2 个行级元素匹配「北京」
- `row:香港`：ambiguous-row-text —— 2 个行级元素匹配「香港」
- `row:新加坡`：ambiguous-row-text —— 2 个行级元素匹配「新加坡」
- `row:斯里巴加湾`：ambiguous-row-text —— 2 个行级元素匹配「斯里巴加湾」
- `row:望加锡`：text-not-found —— 精确文本「望加锡」不存在
- `row:首尔`：text-not-found —— 精确文本「首尔」不存在
- `row:东京、大阪`：text-not-found —— 精确文本「东京、大阪」不存在
- `row:雅库茨克`：text-not-found —— 精确文本「雅库茨克」不存在
- `row:赤塔`：text-not-found —— 精确文本「赤塔」不存在
- `row:帝力`：text-not-found —— 精确文本「帝力」不存在
