<script setup>
import { computed } from 'vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import LIcon from '../../../ui/LIcon.vue'
import './acc.css'

/**
 * 应用勾选列表（游戏管理 / 软件管理 共用）
 *
 * 真机形态（2026-11-14 采集，两张截图逐行对齐）：
 *   白卡、无分组标题、行高 174 物理 px = 52 设计 px
 *   左 24×24 应用图标（原图从真机截图裁切）+ 应用名 + 右蓝色/灰色开关
 *   列表本身不带搜索框，也不带「已选 N 个」汇总
 *
 * 图标来源：`assets/icons/accessibility/apps/*.png`（真机截图按行裁切）。
 * 缺资源的应用（Epson Smart Panel / 交管12123）退回仓库标准 `LIcon` 网格图标，
 * ⛔ 不用「首字 + 彩色底块」冒充应用图标。
 */
const props = defineProps({
  apps: { type: Array, required: true }, // [{ name, slug }]
  modelValue: { type: Array, default: () => [] },
  testid: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const ICONS = import.meta.glob('../../../../assets/icons/accessibility/apps/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
})

function iconOf(slug) {
  if (!slug) return ''
  const key = Object.keys(ICONS).find(k => k.endsWith(`/${slug}.png`))
  return key ? ICONS[key] : ''
}

const enabled = computed(() => new Set(props.modelValue))

function toggle(name) {
  const next = new Set(enabled.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  emit('update:modelValue', [...next])
}
</script>

<template>
  <div class="acc-card acc-applist" :data-testid="testid || undefined">
    <div
      v-for="(app, i) in apps"
      :key="app.name"
      class="acc-approw"
      :class="{ 'is-last': i === apps.length - 1 }"
      :data-testid="app.slug ? `acc-approw-${app.slug}` : undefined"
      @click="toggle(app.name)"
    >
      <img v-if="iconOf(app.slug)" :src="iconOf(app.slug)" class="acc-appicon" alt="" draggable="false" />
      <span v-else class="acc-appicon is-fallback"><LIcon name="grid2x2" :size="16" :stroke-width="1.8" /></span>
      <span class="acc-appname">{{ app.name }}</span>
      <span class="acc-appswitch" @click.stop>
        <ToggleSwitch
          :model-value="enabled.has(app.name)"
          color="blue"
          @update:model-value="toggle(app.name)"
        />
      </span>
    </div>
  </div>
</template>

<style scoped>
.acc-approw {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 52px;
  padding: 0 16px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
}

.acc-approw + .acc-approw::before {
  content: '';
  position: absolute;
  left: 54px;
  right: 0;
  top: 0;
  height: 0.5px;
  background: #F0F1F3;
}

.acc-appicon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex: none;
  display: block;
  object-fit: contain;
  user-select: none;
}

.acc-appicon.is-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E9EAEC;
  color: #8E8E93;
}

.acc-appname {
  flex: 1;
  min-width: 0;
  font-size: 15.5px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.15px;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
