# 验收判决书 · settings/dateTime

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/dateTime.geometry.json`（sha256 `25de020bda0a9f30adcd797966672c298836bb5a527625573e2bb8a0aff0a5fe`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:12.958Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,84,20 | dx -8.2 dy 13.7 dw -159.8 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:自动设置时间 | row | 16.1,100.4,327.8,67.7 | 16,112,328,66.7 | dx -0.1 dy 11.6 dw 0.2 dh -1（worst 11.6） | ❌ FAIL | row-level:text | ✓ |
| row:日期 | row | 16.1,168.1,327.8,63.8 | 16,178.7,328,66.7 | dx -0.1 dy 10.6 dw 0.2 dh 2.9（worst 10.6） | ❌ FAIL | row-level:text | ✓ |
| row:时间 | row | 16.1,231.9,327.8,67.7 | 16,245.4,328,65.7 | dx -0.1 dy 13.5 dw 0.2 dh -2（worst 13.5） | ❌ FAIL | row-level:text | ✓ |
| row:使用 24 小时制 | row | 16.1,315.6,327.8,72.4 | 16,323.1,328,65.7 | dx -0.1 dy 7.5 dw 0.2 dh -6.7（worst 7.5） | ❌ FAIL | row-level:text | ✓ |
| row:自动设置时区 | row | 16.1,404.1,327.8,68.5 | 16,400.8,328,66.7 | dx -0.1 dy -3.3 dw 0.2 dh -1.8（worst 3.3） | ❌ FAIL | row-level:text | ✓ |
| row:选择时区 | row | 16.1,472.7,327.8,67.7 | 16,467.4,328,65.7 | dx -0.1 dy -5.3 dw 0.2 dh -2（worst 5.3） | ❌ FAIL | row-level:text | ✓ |
| row:系统双时钟 | row | 16.1,556.4,327.8,84.3 | 16,545.1,328,84.2 | dx -0.1 dy -11.3 dw 0.2 dh -0.1（worst 11.3） | ❌ FAIL | row-level:text | ✓ |
| row:常驻地 | row | 16.1,640.8,327.8,64.7 | 16,629.4,328,66.7 | dx -0.1 dy -11.4 dw 0.2 dh 2（worst 11.4） | ❌ FAIL | row-level:text | ✓ |
| row:双时钟显示位置 | row | 16.1,705.4,327.8,68.5 | 16,696,328,65.7 | dx -0.1 dy -9.4 dw 0.2 dh -2.8（worst 9.4） | ❌ FAIL | row-level:text | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

无。

## 合计

- spec 节点 **11**；命中 **11/11**（matchRate **1**）
- pass **0** / fail **11** / missing **0** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：11 个几何超差（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/dateTime.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/dateTime \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-dateTime
```
