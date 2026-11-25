<script setup>
import { GLYPHS } from '../../assets/icons/glyphs'
import { useI18nStore } from '../../stores/i18nStore'

/** iOS 16 风格分页指示：圆点 + 搜索胶囊 */
const props = defineProps({
  wide: { type: Boolean, default: false },
  count: { type: Number, default: 1 },
  current: { type: Number, default: 0 },
  showPages: { type: Boolean, default: false }
})
const emit = defineEmits(['search','go'])
const i18n = useI18nStore()
</script>

<template>
  <div class="page-indicator">
    <nav v-if="wide" class="wide-page-dots" aria-label="桌面页面" @pointerdown.stop>
      <button type="button" class="wide-drawer-indicator" aria-label="打开应用抽屉" @click="emit('search')">=</button>
      <button v-for="i in count" :key="i" type="button" class="wide-page-dot"
        :aria-label="'第 ' + i + ' 页'" :aria-current="i - 1 === current ? 'page' : undefined" @click="emit('go', i - 1)"></button>
    </nav>
    <Transition v-else name="indicator-swap" mode="out-in">
      <div v-if="showPages" key="pages" class="page-dots" aria-label="桌面页面">
        <span v-for="i in count" :key="i" class="dot" :class="{ active: i - 1 === current }"></span>
      </div>
      <button v-else key="search" class="search-pill" @click="emit('search')">
        <svg width="12" height="12" viewBox="0 0 24 24"><path :d="GLYPHS.search" fill="#fff" /></svg>
        <span>{{ i18n.t('search') }}</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.wide-page-dots{display:flex;align-items:center;gap:4px}
.wide-page-dots button{width:12px;height:20px;display:grid;place-items:center;background:none;border:0;padding:0;cursor:pointer;color:#fff6}
.wide-page-dot::before{content:'';display:block;width:6px;height:6px;border-radius:50%;background:#ffffff55}
.wide-page-dot[aria-current]::before{background:#ffffffe0}
.wide-drawer-indicator {font:600 9px/1 var(--font-stack);}

.page-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 26px;
}
.page-dots { display:flex; align-items:center; justify-content:center; gap:8px; min-height:26px; }
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}
.dot.active { background: #fff; }
.search-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 12px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(20px) saturate(120%) brightness(105%);
  -webkit-backdrop-filter: blur(20px) saturate(120%) brightness(105%);
  border: 0.5px solid rgba(255, 255, 255, 0.35);
  box-shadow: inset 0 0.5px 0.5px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #fff;
  font: 500 12px/1 var(--font-stack);
  transition: transform 0.15s ease;
}
.search-pill:active { transform: scale(0.94); }
.indicator-swap-enter-active,.indicator-swap-leave-active { transition:opacity 150ms ease,transform 150ms ease; }
.indicator-swap-enter-from,.indicator-swap-leave-to { opacity:0;transform:scale(.86); }
</style>
