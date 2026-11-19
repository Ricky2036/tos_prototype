# 验收判决书 · settings/system/system-language

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-language.geometry.json`（sha256 `48338be6998015792704760189e1bdad45e4ce1e99719fde2047d23c45642674`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:43.528Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,100.8,20 | dx -8.2 dy 13.7 dw -143 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:语言与地区 | row | 16.1,100.1,327.8,68.5 | 16,122,328,66.7 | dx -0.1 dy 21.9 dw 0.2 dh -1.8（worst 21.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:应用语言 | row | 16.1,168.7,327.8,68.5 | 16,188.7,328,65.7 | dx -0.1 dy 20 dw 0.2 dh -2.8（worst 20） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:当前键盘 | row | 16.1,283.4,327.8,55.7 | 16,300.4,328,66.7 | dx -0.1 dy 17 dw 0.2 dh 11（worst 17） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:键盘应用 | row | 16.1,339.2,327.8,80.5 | 16,367.1,328,84.2 | dx -0.1 dy 27.9 dw 0.2 dh 3.7（worst 27.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:安全键盘 | row | 16.1,419.6,327.8,52.5 | 16,451.3,328,65.7 | dx -0.1 dy 31.7 dw 0.2 dh 13.2（worst 31.7） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:拼写检查工具 | row | 16.1,518.3,327.8,68.5 | 16,563,328,66.7 | dx -0.1 dy 44.7 dw 0.2 dh -1.8（worst 44.7） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:个人字典 | row | 16.1,586.8,327.8,64.7 | 16,629.7,328,66.7 | dx -0.1 dy 42.9 dw 0.2 dh 2（worst 42.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:语音 | row | 16.1,651.5,327.8,68.5 | 16,696.4,328,65.7 | dx -0.1 dy 44.9 dw 0.2 dh -2.8（worst 44.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:温度 | row | 16.1,766.2,327.8,21.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| group:键盘 | group | 31.9,253.3,28,30.1 | 32,279.4,26,16 | dx 0.1 dy 26.1 dw -2 dh -14.1（worst 26.1） | ❌ FAIL | text | ✓ |
| group:工具 | group | 31.9,488.2,28,30.1 | 32,542,26,16 | dx 0.1 dy 53.8 dw -2 dh -14.1（worst 53.8） | ❌ FAIL | text | ✓ |
| group:地区偏好设置 | group | 31.9,736.1,84,30.1 | 32,787,78,16 | dx 0.1 dy 50.9 dw -6 dh -14.1（worst 50.9） | ❌ FAIL | text | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `row:温度`（row，期望 16.1,766.2,327.8,21.8，文本「[object Object]」）

## 合计

- spec 节点 **14**；命中 **13/14**（matchRate **0.929**）
- pass **0** / fail **13** / missing **1** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：13 个几何超差，1 个漏做（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-language.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-language \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-language
```

## 定位诊断（不影响判定，供人复核）

- `row:语言与地区`：ambiguous-row-text —— 2 个行级元素匹配「语言与地区」
- `row:应用语言`：ambiguous-row-text —— 2 个行级元素匹配「应用语言」
- `row:当前键盘`：ambiguous-row-text —— 2 个行级元素匹配「当前键盘」
- `row:键盘应用`：ambiguous-row-text —— 2 个行级元素匹配「键盘应用」
- `row:安全键盘`：ambiguous-row-text —— 2 个行级元素匹配「安全键盘」
- `row:拼写检查工具`：ambiguous-row-text —— 2 个行级元素匹配「拼写检查工具」
- `row:个人字典`：ambiguous-row-text —— 2 个行级元素匹配「个人字典」
- `row:语音`：ambiguous-row-text —— 2 个行级元素匹配「语音」
- `row:温度`：text-not-found —— 精确文本「温度」不存在
