# 验收判决书 · settings/safetyEmergency

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/safetyEmergency.geometry.json`（sha256 `9bfc7c0fa92d3376ee924845cb23cfaf1b989d8f2374aac91337b85c5d9993d9`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:24.211Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,117.6,20 | dx -8.2 dy 13.7 dw -126.2 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:打开个人安全 | row | 16.1,100.4,327.8,56.3 | 16,112,328,68 | dx -0.1 dy 11.6 dw 0.2 dh 11.7（worst 11.7） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:紧急联络 | row | 16.1,172.9,327.8,55.7 | 16,198,328,26 | dx -0.1 dy 25.1 dw 0.2 dh -29.7（worst 29.7） | ❌ FAIL | text | ✓ |
| row:医疗信息 | row | 16.1,228.6,327.8,64.7 | 16,224,328,66.7 | dx -0.1 dy -4.6 dw 0.2 dh 2（worst 4.6） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:紧急联系人 | row | 16.1,293.3,327.8,64.7 | 16,290.7,328,65.7 | dx -0.1 dy -2.6 dw 0.2 dh 1（worst 2.6） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:紧急求救 | row | 16.1,357.9,327.8,55.7 | 16,400.4,328,65.7 | dx -0.1 dy 42.5 dw 0.2 dh 10（worst 42.5） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:无线紧急警报 | row | 16.1,429.8,327.8,55.7 | 16,484.1,328,26 | dx -0.1 dy 54.3 dw 0.2 dh -29.7（worst 54.3） | ❌ FAIL | text | ✓ |
| row:地震警报 | row | 16.1,485.5,327.8,51.9 | 16,510.1,328,52 | dx -0.1 dy 24.6 dw 0.2 dh 0.1（worst 24.6） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:灾害警报 | row | 16.1,537.4,327.8,48.6 | 16,562.1,328,52 | dx -0.1 dy 24.7 dw 0.2 dh 3.4（worst 24.7） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:驾车时将通知设为静音 | row | 16.1,585.9,327.8,55.7 | 16,614.1,328,52 | dx -0.1 dy 28.2 dw 0.2 dh -3.7（worst 28.2） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:紧急位置信息服务 | row | 16.1,657.8,327.8,55.7 | 16,710.1,328,52 | dx -0.1 dy 52.3 dw 0.2 dh -3.7（worst 52.3） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:不明追踪器提醒 | row | 16.1,713.5,327.8,52.5 | 16,762.1,328,52 | dx -0.1 dy 48.6 dw 0.2 dh -0.5（worst 48.6） | ❌ FAIL | row-level:text(ambiguous) | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

无。

## 合计

- spec 节点 **13**；命中 **13/13**（matchRate **1**）
- pass **0** / fail **13** / missing **0** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：13 个几何超差（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/safetyEmergency.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/safetyEmergency \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-safetyEmergency
```

## 定位诊断（不影响判定，供人复核）

- `row:打开个人安全`：ambiguous-row-text —— 2 个行级元素匹配「打开个人安全」
- `row:医疗信息`：ambiguous-row-text —— 2 个行级元素匹配「医疗信息」
- `row:紧急联系人`：ambiguous-row-text —— 2 个行级元素匹配「紧急联系人」
- `row:紧急求救`：ambiguous-row-text —— 3 个行级元素匹配「紧急求救」
- `row:地震警报`：ambiguous-row-text —— 2 个行级元素匹配「地震警报」
- `row:灾害警报`：ambiguous-row-text —— 2 个行级元素匹配「灾害警报」
- `row:驾车时将通知设为静音`：ambiguous-row-text —— 2 个行级元素匹配「驾车时将通知设为静音」
- `row:紧急位置信息服务`：ambiguous-row-text —— 2 个行级元素匹配「紧急位置信息服务」
- `row:不明追踪器提醒`：ambiguous-row-text —— 2 个行级元素匹配「不明追踪器提醒」
