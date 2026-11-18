# 验收判决书 · settings/system/system-enhanced-services

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-enhanced-services.geometry.json`（sha256 `715b0cfb39cb454f2dfdbd990ae95f9ee892910afe1da5403ac7f0aebe86a1b8`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:22:38.573Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,53.3,243.8,21.2 | 72,67,67.2,20 | dx -8.2 dy 13.7 dw -176.6 dh -1.2（worst 13.1） | ❌ FAIL | text | ✓ |
| header:back | header-back | 16.1,42,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 18 dw -10.1 dh -10.1（worst 13） | ❌ FAIL | role:header-back | — |
| row:智慧感知服务 | row | 16.1,108.2,327.8,116.2 | 16,122,328,101.8 | dx -0.1 dy 13.8 dw 0.2 dh -14.4（worst 14.4） | ❌ FAIL | row-level:text | ✓ |
| row:智慧文本服务 | row | 16.1,224.4,327.8,160.6 | 16,223.8,328,84.2 | dx -0.1 dy -0.6 dw 0.2 dh -76.4（worst 76.4） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:AI 场景增强服务 | row | 16.1,385.1,327.8,96.3 | 16,308,328,84.2 | dx -0.1 dy -77.1 dw 0.2 dh -12.1（worst 77.1） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:推荐增强服务 | row | 16.1,481.3,327.8,112.4 | 16,392.3,328,84.2 | dx -0.1 dy -89 dw 0.2 dh -28.2（worst 89） | ❌ FAIL | row-level:text(ambiguous) | ✓ |
| row:个人知识库服务 | row | 16.1,593.7,327.8,100.1 | 16,476.5,328,65.7 | dx -0.1 dy -117.2 dw 0.2 dh -34.4（worst 117.2） | ❌ FAIL | row-level:text(ambiguous) | ✓ |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

无。DOM 中的行级元素全部能对上 spec 节点。

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

无。

## 合计

- spec 节点 **7**；命中 **7/7**（matchRate **1**）
- pass **0** / fail **7** / missing **0** / extra **0** / skipped **0**
- **结论**：❌ **不通过**：7 个几何超差（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-enhanced-services.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-enhanced-services \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-enhanced-services
```

## 定位诊断（不影响判定，供人复核）

- `row:智慧文本服务`：ambiguous-row-text —— 2 个行级元素匹配「智慧文本服务」
- `row:AI 场景增强服务`：ambiguous-row-text —— 2 个行级元素匹配「AI 场景增强服务」
- `row:推荐增强服务`：ambiguous-row-text —— 2 个行级元素匹配「推荐增强服务」
- `row:个人知识库服务`：ambiguous-row-text —— 2 个行级元素匹配「个人知识库服务」
