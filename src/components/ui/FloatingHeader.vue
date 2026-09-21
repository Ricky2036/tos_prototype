<script setup>
/**
 * 悬浮顶部导航条通用控件 (FloatingHeader)
 * 提供安全区适配、左侧圆形磨砂返回按钮、居中/左侧标题与右侧扩展插槽。
 */
defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  transparent: { type: Boolean, default: false }
})

const emit = defineEmits(['back'])
</script>

<template>
  <header
    class="floating-header"
    :class="{ 'is-transparent': transparent }"
  >
    <button
      v-if="showBack"
      class="round-back-btn"
      type="button"
      aria-label="返回"
      @click="emit('back')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 12H5m6-7-7 7 7 7" />
      </svg>
    </button>
    <div v-else class="header-spacer"></div>

    <h1 v-if="title || $slots.title" class="header-title">
      <slot name="title">{{ title }}</slot>
    </h1>

    <div class="header-right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.floating-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--safe-top) + 54px);
  padding: var(--safe-top) 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.35) 65%, transparent 100%);
  pointer-events: auto;
  z-index: 50;
  user-select: none;
}

.floating-header.is-transparent {
  background: transparent;
}

.round-back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0.5px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  color: #ffffff;
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  transition: transform 0.12s ease, background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.round-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.2);
}

.round-back-btn svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.header-spacer {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
