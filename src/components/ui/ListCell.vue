<script setup>
import { GLYPHS } from '../../assets/icons/glyphs'
import ChevronRight from '../ui/ChevronRight.vue'

/**
 * iOS 分组列表单元格（设置/信息/电话通用）。
 * 左图标(彩底圆角) + 标题 + 右值/箭头/自定义右槽。
 */
const props = defineProps({
  glyph: { type: String, default: '' },
  iconBg: { type: String, default: '#8E8E93' },
  iconText: { type: String, default: '' },  // 无 glyph 时显示首字符
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  value: { type: String, default: '' },
  chevron: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }, // 置灰且不响应点击（真机「与某档绑定」的行就是这样）
  last: { type: Boolean, default: false }   // 组内最后一条：无分隔线
})
const emit = defineEmits(['click'])
</script>

<template>
  <div
    class="list-cell"
    :class="{ clickable: (chevron || clickable) && !disabled, 'is-disabled': disabled }"
    @click="!disabled && emit('click')"
  >
    <slot name="icon">
      <div v-if="glyph || iconText" class="lc-icon" :style="{ background: iconBg }">
        <svg v-if="glyph" width="17" height="17" viewBox="0 0 24 24">
          <path :d="GLYPHS[glyph]" fill="#fff" />
        </svg>
        <span v-else class="lc-icon-text">{{ iconText }}</span>
      </div>
    </slot>
    <div class="lc-main" :class="{ 'no-sep': last }">
      <div class="lc-title-col">
        <slot name="title">
          <span class="lc-title">{{ title }}</span>
        </slot>
        <slot name="subtitle">
          <span v-if="subtitle" class="lc-subtitle">{{ subtitle }}</span>
        </slot>
      </div>
      <div class="lc-right">
        <slot name="right">
          <slot name="value">
            <span v-if="value" class="lc-value">{{ value }}</span>
          </slot>
          <ChevronRight v-if="chevron" class="lc-chevron" :size="18" color="currentColor" :stroke-width="2.13" />
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-cell.is-disabled {
  opacity: 0.45;
  pointer-events: none;
}

.list-cell {
  display: flex;
  align-items: center;
  background: var(--bg-cell);
  padding-left: 16px;
  min-height: 52px;
  cursor: default;
}
.list-cell.clickable { cursor: pointer; }
.list-cell.clickable:active { background: #E9E9EB; }

.lc-icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
}

/* 说明：icon 槽的 14px 兜底放在下方**非 scoped** 的 `:where()` 规则里。
   原先写在这里的 `:deep(.list-cell > *:not(.lc-main))` 会被编译成
   `[data-v-xxx] .list-cell > ...`，要求 .list-cell 是 scope 根的后代；
   而 .list-cell 自己就是根节点，规则永远匹配不到（自定义图标反复出现 0 间距的根因）。 */

.lc-icon-text {
  color: #fff;
  font: 600 15px/1 var(--font-stack);
}

.lc-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px 13px 0;
  border-bottom: 0.5px solid #F0F1F3;
  min-width: 0;
}
.lc-main.no-sep { border-bottom: none; }

.lc-title-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 2px;
  margin-right: 8px;
}

.lc-title {
  /* 360 画布的行标题：真机 402.7dp 上的 17dp ≈ 画布 15.2px（不是 17px，会太大太细） */
  font: 500 15.5px/1.3 var(--font-stack);
  font-weight: 500;
  color: #111111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.15px;
}
.lc-subtitle {
  font: 400 13px/1.35 var(--font-stack);
  color: var(--label-secondary);
  white-space: normal;
}
.lc-right {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
}
.lc-value {
  font: 400 14.5px/1.25 var(--font-stack);
  color: #8E8E93;
}
.lc-chevron {
  flex: none;
  color: var(--chevron-color, #C5C5C7);
  margin-left: 2px;
  display: block;
}
</style>

<style>
/* icon 槽兜底间距：特异性 0,1,0 —— 高于 reset 的 `*`（0），
   低于页面 scoped 样式（class + [data-v] = 0,2,0），所以页面自己的 12/14/16px 优先；
   没有写间距的自定义图标自动拿到 14px，避免每个页面各记一遍。
   选择器直接以 .list-cell 为根（不再用 :deep），根节点自身可匹配。 */
.list-cell > :where(:not(.lc-main):not(.lc-icon)) {
  flex: none;
  margin-right: 14px;
}
</style>
