<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import { computed } from 'vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useInfinixAiSettingsStore } from '../../../../stores/infinixAiSettingsStore'
import AiHeroArt from './AiHeroArt.vue'

/**
 * Infinix AI 三级页通用外壳。
 *
 * 真机上这一组页面的骨架完全一致，所以用一份配置驱动：
 *   导航栏（圆形返回 + 标题） → 头图插画 + 说明 + 分页点 → 若干设置卡片 → 说明段落 → 可选的底部「去体验」
 *
 * 行的形态：标题 +（可选）副标题 +（可选）右侧值 / 开关 / 箭头。
 */
const props = defineProps({
  title: { type: String, required: true },
  hero: { type: Object, default: null },      // { variant, caption, dots?: number, activeDot?: number }
  cards: { type: Array, default: () => [] },  // [{ rows: [...] }]
  notes: { type: Array, default: () => [] },  // 说明段落（支持编号文本）
  cta: { type: String, default: '' }
})
const emit = defineEmits(['back', 'row-click'])

const aiStore = useInfinixAiSettingsStore()

const dots = computed(() => {
  const n = props.hero?.dots || 0
  if (!n) return []
  const active = props.hero?.activeDot ?? 0
  return Array.from({ length: n }, (_, i) => i === active)
})

function rowToggleValue(row) {
  return aiStore.getSwitch(row.toggle)
}

function handleToggle(row, value) {
  aiStore.setSwitch(row.toggle, value)
}
</script>

<template>
  <div class="ai-sub-page">
    <GlassNavBar title="{{ title }}" @back="emit('back')" />

    <div class="ai-sub-body scrollable">
      <!-- 头图区 -->
      <div v-if="hero" class="ai-hero">
        <slot name="hero">
          <AiHeroArt :variant="hero.variant || 'voice'" />
        </slot>
        <div v-if="hero.captionTitle" class="ai-hero-title">{{ hero.captionTitle }}</div>
        <div v-if="hero.caption" class="ai-hero-caption">{{ hero.caption }}</div>
        <div v-if="dots.length" class="ai-hero-dots">
          <span v-for="(on, i) in dots" :key="i" class="dot" :class="{ on }"></span>
        </div>
      </div>

      <!-- 设置卡片 -->
      <div v-for="(card, ci) in cards" :key="ci" class="settings-card" :class="{ 'card-disabled': card.disabled }">
        <ListCell
          v-for="(row, ri) in card.rows"
          :key="ri"
          :title="row.title"
          :subtitle="row.subtitle || ''"
          :value="row.value || ''"
          :chevron="row.chevron !== false && !row.toggle"
          :clickable="row.chevron !== false || Boolean(row.toggle)"
          :last="ri === card.rows.length - 1"
          @click="row.toggle ? null : emit('row-click', row)"
        >
          <template v-if="row.toggle" #right>
            <span class="toggle-wrap" :class="{ 'is-red': row.toggleColor === 'red' }">
              <ToggleSwitch
                :model-value="rowToggleValue(row)"
                :color="row.toggleColor === 'red' ? 'blue' : (row.toggleColor || 'blue')"
                @update:model-value="v => handleToggle(row, v)"
              />
            </span>
          </template>
          <template v-else-if="row.dot" #right>
            <span class="row-dot"></span>
            <svg class="lc-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path
                d="M1.25 1.25L5.75 6L1.25 10.75"
                stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
              />
            </svg>
          </template>
        </ListCell>
      </div>

      <!-- 说明段落 -->
      <div v-if="notes.length" class="ai-notes">
        <p v-for="(line, i) in notes" :key="i" class="note-line">{{ line }}</p>
      </div>

      <!-- 底部行动按钮 -->
      <div v-if="cta" class="ai-cta-wrap">
        <button class="ai-cta" type="button" @click="emit('row-click', { title: cta, cta: true })">{{ cta }}</button>
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>
  </div>
</template>

<style scoped>
.ai-sub-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.ai-sub-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(var(--safe-top, 0px) + 8px) 16px 8px;
  flex-shrink: 0;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
}

.nav-round-btn:active {
  background: #ECECEF;
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.ai-sub-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 0;
  scrollbar-width: none;
}

.ai-sub-body::-webkit-scrollbar {
  display: none;
}

/* 头图区 */
.ai-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0 20px;
}

.ai-hero-title {
  margin-top: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #111;
  text-align: center;
}

.ai-hero-caption {
  margin-top: 8px;
  font-size: 13px;
  line-height: 19px;
  color: #8E8E93;
  text-align: center;
  max-width: 300px;
}

.ai-hero-dots {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.ai-hero-dots .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #D1D1D6;
}

.ai-hero-dots .dot.on {
  background: #6E6E73;
}

/* 卡片 */
.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.settings-card.card-disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* 说明段落 */
.ai-notes {
  padding: 8px 4px 4px;
}

.note-line {
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 20px;
  color: #8E8E93;
}

/* 底部按钮 */
.ai-cta-wrap {
  padding: 20px 0 8px;
}

.ai-cta {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: #2F6BF6;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.ai-cta:active {
  background: #2559D0;
}

/* 右侧红点（未读/新功能提示） */
.row-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FF3B30;
  margin-right: 2px;
}

/* 红色开关（AI 录音「自动推荐」在真机上就是红色） */
.toggle-wrap.is-red :deep(.toggle-switch.on) {
  background: #FF5A5A;
}

.scroll-bottom-spacer {
  height: 32px;
}
</style>
