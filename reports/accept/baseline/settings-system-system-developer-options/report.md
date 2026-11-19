# 验收判决书 · settings/system/system-developer-options

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-developer-options.geometry.json`（sha256 `fefc7117a4c8eb64b7f1fc04b554510a9c31d2ea4196afd7d3b939324aeb0d8f`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:33.492Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,84,20 | dx -8.2 dy 13.7 dw -159.8 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:使用“开发者选项” | row | 0,104,360,68 | 16,122,328,65.7 | dx 16 dy 18 dw -32 dh -2.3（worst 32） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:内存 | row | 16.1,188.1,327.8,68.5 | 16,251.7,328,66.7 | dx -0.1 dy 63.6 dw 0.2 dh -1.8（worst 63.6） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:错误报告 | row | 16.1,256.6,327.8,48.6 | 16,318.4,328,52 | dx -0.1 dy 61.8 dw 0.2 dh 3.4（worst 61.8） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:错误报告处理程序 | row | 16.1,305.2,327.8,64.7 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:桌面备份密码 | row | 16.1,369.9,327.8,64.7 | 16,370.4,328,66.7 | dx -0.1 dy 0.5 dw 0.2 dh 2（worst 2） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:不锁定屏幕 | row | 16.1,434.5,327.8,63.8 | 16,437.1,328,66.7 | dx -0.1 dy 2.6 dw 0.2 dh 2.9（worst 2.9） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:OEM 解锁 | row | 16.1,498.3,327.8,63.8 | 16,503.8,328,66.7 | dx -0.1 dy 5.5 dw 0.2 dh 2.9（worst 5.5） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:正在运行的服务 | row | 16.1,562.1,327.8,64.7 | 16,570.4,328,66.7 | dx -0.1 dy 8.3 dw 0.2 dh 2（worst 8.3） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:WebView 实现 | row | 16.1,626.8,327.8,64.7 | 16,637.1,328,66.7 | dx -0.1 dy 10.3 dw 0.2 dh 2（worst 10.3） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:WebView 开发者工具 | row | 16.1,691.4,327.8,48.6 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:自动系统更新 | row | 16.1,740,327.8,48 | 16,703.8,328,66.7 | dx -0.1 dy -36.2 dw 0.2 dh 18.7（worst 36.2） | ❌ FAIL | row-level:text(ambiguous) | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

| # | 文本 | 实测(x,y,w,h) | 选择器线索 |
|---|---|---|---|
| 1 | USB 调试连接 USB 时启用调试模式 | 16,770.5,328,65.7 | `.list-cell（无行级 data-* 属性）` |

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `row:错误报告处理程序`（row，期望 16.1,305.2,327.8,64.7，文本「[object Object]」）
- ⬜ `row:WebView 开发者工具`（row，期望 16.1,691.4,327.8,48.6，文本「[object Object]」）

## 合计

- spec 节点 **13**；命中 **11/13**（matchRate **0.846**）
- pass **0** / fail **11** / missing **2** / extra **1** / skipped **0**
- **结论**：❌ **不通过**：11 个几何超差，2 个漏做，1 个自造（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-developer-options.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-developer-options \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-developer-options
```

## 定位诊断（不影响判定，供人复核）

- `row:使用“开发者选项”`：ambiguous-row-text —— 3 个行级元素匹配「使用“开发者选项”」
- `row:内存`：ambiguous-row-text —— 2 个行级元素匹配「内存」
- `row:错误报告`：ambiguous-row-text —— 2 个行级元素匹配「错误报告」
- `row:错误报告处理程序`：text-not-found —— 精确文本「错误报告处理程序」不存在
- `row:桌面备份密码`：ambiguous-row-text —— 2 个行级元素匹配「桌面备份密码」
- `row:不锁定屏幕`：ambiguous-row-text —— 2 个行级元素匹配「不锁定屏幕」
- `row:OEM 解锁`：ambiguous-row-text —— 2 个行级元素匹配「OEM 解锁」
- `row:正在运行的服务`：ambiguous-row-text —— 2 个行级元素匹配「正在运行的服务」
- `row:WebView 实现`：ambiguous-row-text —— 2 个行级元素匹配「WebView 实现」
- `row:WebView 开发者工具`：text-not-found —— 精确文本「WebView 开发者工具」不存在
- `row:自动系统更新`：ambiguous-row-text —— 2 个行级元素匹配「自动系统更新」
