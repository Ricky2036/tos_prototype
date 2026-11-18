# 验收判决书 · settings/system/system-reset-phone

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-reset-phone.geometry.json`（sha256 `793d844362b17d1a3e43d380613f829b7e799f3054a9fc6ed469f2fb762c59cf`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:20:42.864Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,51.3,243.8,21.2 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| header:back | header-back | 16.1,39.9,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 20.1 dw -10.1 dh -10.1（worst 15） | ❌ FAIL | role:header-back | — |
| row:定时开机 | row | 16.1,96,327.8,34 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:07:00 | row | 16.1,129.9,327.8,71.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:定时关机 | row | 16.1,205.6,327.8,34 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:20:00 | row | 16.1,239.6,327.8,71.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:定时重启 | row | 16.1,315.3,327.8,34 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:05:00 | row | 16.1,349.3,327.8,71.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

| # | 文本 | 实测(x,y,w,h) | 选择器线索 |
|---|---|---|---|
| 1 | 重置无线设置重置 WLAN、移动数据网络和蓝牙设置。 | 16,126,328,66.7 | `.list-cell（无行级 data-* 属性）` |
| 2 | 彻底清除全部数据 | 16,192.7,328,52 | `.list-cell（无行级 data-* 属性）` |

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `header:title`（header-title，期望 80.2,51.3,243.8,21.2，文本「[object Object]」）
- ⬜ `row:定时开机`（row，期望 16.1,96,327.8,34，文本「[object Object]」）
- ⬜ `row:07:00`（row，期望 16.1,129.9,327.8,71.8，文本「[object Object]」）
- ⬜ `row:定时关机`（row，期望 16.1,205.6,327.8,34，文本「[object Object]」）
- ⬜ `row:20:00`（row，期望 16.1,239.6,327.8,71.8，文本「[object Object]」）
- ⬜ `row:定时重启`（row，期望 16.1,315.3,327.8,34，文本「[object Object]」）
- ⬜ `row:05:00`（row，期望 16.1,349.3,327.8,71.8，文本「[object Object]」）

## 合计

- spec 节点 **8**；命中 **1/8**（matchRate **0.125**）
- pass **0** / fail **1** / missing **7** / extra **2** / skipped **0**
- **结论**：❌ **不通过**：1 个几何超差，7 个漏做，2 个自造（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-reset-phone.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-reset-phone \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-reset-phone
```

## 定位诊断（不影响判定，供人复核）

- `header:title`：text-not-found —— 精确文本「定时开关机与重启」不存在
- `row:定时开机`：text-not-found —— 精确文本「定时开机」不存在
- `row:07:00`：text-not-found —— 精确文本「07:00」不存在
- `row:定时关机`：text-not-found —— 精确文本「定时关机」不存在
- `row:20:00`：text-not-found —— 精确文本「20:00」不存在
- `row:定时重启`：text-not-found —— 精确文本「定时重启」不存在
- `row:05:00`：text-not-found —— 精确文本「05:00」不存在
