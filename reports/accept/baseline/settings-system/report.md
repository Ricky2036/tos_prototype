# 验收判决书 · settings/system

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system.geometry.json`（sha256 `6020091affe1c0e163676d9cf85bd4a45af6b16dcbe2427b3ae973d222e093ff`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:28.473Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,33.6,20 | dx -8.2 dy 13.7 dw -210.2 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:系统导航 | row | 16.1,100.1,327.8,52.5 | 16,112,328,52 | dx -0.1 dy 11.9 dw 0.2 dh -0.5（worst 9.9） | ❌ FAIL | row-level:text | ✓ |
| row:日期与时间 | row | 16.1,152.6,327.8,48.6 | 16,164,328,52 | dx -0.1 dy 11.4 dw 0.2 dh 3.4（worst 3.2） | ❌ FAIL | row-level:text | ✓ |
| row:语言与输入法 | row | 16.1,201.2,327.8,52.5 | 16,216,328,52 | dx -0.1 dy 14.8 dw 0.2 dh -0.5（worst 3.2） | ❌ FAIL | row-level:text | ✓ |
| row:按住电源按钮 | row | 16.1,269.7,327.8,55.7 | 16,280,328,52 | dx -0.1 dy 10.3 dw 0.2 dh -3.7（worst 3） | ❌ FAIL | row-level:text | ✓ |
| row:定时开关机与重启 | row | 16.1,325.5,327.8,52.5 | 16,332,328,52 | dx -0.1 dy 6.5 dw 0.2 dh -0.5（worst 3.2） | ❌ FAIL | row-level:text | ✓ |
| row:备份到Google云端硬盘 | row | 16.1,424.1,327.8,52.5 | 16,436,328,52 | dx -0.1 dy 11.9 dw 0.2 dh -0.5（worst 0.1） | ✅ PASS | row-level:text | ✓ |
| row:USB 备份和恢复 | row | 16.1,476.6,327.8,48.6 | 16,488,328,52 | dx -0.1 dy 11.4 dw 0.2 dh 3.4（worst 3.2） | ❌ FAIL | row-level:text | ✓ |
| row:重置手机 | row | 16.1,525.1,327.8,52.5 | 16,540,328,52 | dx -0.1 dy 14.9 dw 0.2 dh -0.5（worst 3.2） | ❌ FAIL | row-level:text | ✓ |
| row:开发者选项 | row | 16.1,593.7,327.8,52.5 | 16,604,328,52 | dx -0.1 dy 10.3 dw 0.2 dh -0.5（worst 1.5） | ✅ PASS | row-level:text | ✓ |
| row:增强服务 | row | 16.1,646.1,327.8,52.5 | 16,656,328,52 | dx -0.1 dy 9.9 dw 0.2 dh -0.5（worst 3.2） | ❌ FAIL | row-level:text | ✓ |
| group:备份、重置与恢复 | group | 31.9,394,112.1,30.1 | 32,405,104,16 | dx 0.1 dy 11 dw -8.1 dh -14.1（worst 4） | ❌ FAIL | text | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

无。

## 合计

- spec 节点 **13**；命中 **13/13**（matchRate **1**）
- pass **2** / fail **11** / missing **0** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：11 个几何超差（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system
```
