<script setup>
/**
 * 设置内通用的「玻璃悬浮导航栏」（二级 / 三级 / 四级共用）
 *
 * 真机形态（Ricky 2026-11-06 指出）：
 * - 不是实心白条 + 左对齐标题，而是**两个悬浮圆形玻璃按钮（左返回 / 右更多）+ 居中标题**；
 * - 按钮是半透明白 + 背景模糊 + 轻投影，能透出下面的内容；
 * - 导航条本身是一条**半透明白 + 背景模糊**的悬浮层，底部用渐变淡出，
 *   内容滚上来时被它「遮挡并虚化」，而不是被一条硬边切掉。
 *
 * 用法：
 *   <GlassNavBar title="通知与状态栏" @back="..." > <template #right>…</template> </GlassNavBar>
 * 组件自身是 **overlay**（`position: absolute`），页面内容要在它下面滚动，
 * 所以调用方需要给内容区留出 `--nav-h` 的顶部内边距。
 */
defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  /** 右上角是否留出按钮位（无内容时不占位） */
  right: { type: Boolean, default: false },
  /**
   * 是否作为浮层压在内容上（内容从玻璃下穿过、被虚化）。
   * - false（默认）：占位模式，直接替换页面里自绘的导航条，布局不变；
   * - true：浮层模式，调用方要给内容区留出 `--nav-h` 的顶部内边距。
   */
  overlay: { type: Boolean, default: false },
  /**
   * 深色底页面（如主题与个性化）用 dark：
   * 玻璃改成深色半透明、按钮改成浅色半透明、标题白字；
   * **尺寸/位置/圆角仍与浅色一致**（真机两种肤色共用一套几何）。
   */
  tone: { type: String, default: 'light' }
})
const emit = defineEmits(['back'])
</script>

<template>
  <div class="glass-nav" :class="{ 'is-overlay': overlay, 'is-dark': tone === 'dark' }">
    <!-- 玻璃层：半透明白 + 背景模糊，底部渐隐（内容滚过时被虚化，而不是硬切） -->
    <div class="gn-glass" aria-hidden="true"></div>

    <button
      v-if="showBack"
      class="gn-btn gn-back nav-round-btn"
      type="button"
      aria-label="返回"
      data-nav-back
      @click="emit('back')"
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 12H4.6M4.6 12L11.2 5.4M4.6 12L11.2 18.6"
          stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="gn-title">
      <slot name="title">{{ title }}</slot>
    </div>

    <div v-if="right || $slots.right" class="gn-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style scoped>
.glass-nav {
  position: relative;
  width: 100%;
  height: var(--nav-h);
  flex-shrink: 0;
  z-index: 12;
  pointer-events: none; /* 只有按钮和插槽接管事件 */
}

/* ===== 深色变体：只换肤色，几何尺寸与浅色完全一致 ===== */
.glass-nav.is-dark .gn-glass {
  background: rgba(0, 0, 0, 0.42);
}

.glass-nav.is-dark .gn-btn {
  background: rgba(255, 255, 255, 0.16);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.35),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.28);
}

.glass-nav.is-dark .gn-btn :deep(svg path) {
  stroke: #FFFFFF;
}

.glass-nav.is-dark .gn-title {
  color: #FFFFFF;
}

/* 浮层模式：压在内容上，内容滚过时被虚化（调用方负责给内容留白） */
.glass-nav.is-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

/* 玻璃底：半透明白 + 模糊 + 底部渐隐 */
.gn-glass {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-mask-image: linear-gradient(180deg, #000 0, #000 calc(100% - 22px), transparent 100%);
  mask-image: linear-gradient(180deg, #000 0, #000 calc(100% - 22px), transparent 100%);
}

.gn-btn {
  position: absolute;
  top: calc(var(--safe-top, 0px) + 6px);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  /* 玻璃质感：半透明白 + 模糊 + 轻投影 + 1px 内高光 */
  background: rgba(255, 255, 255, 0.66);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.10),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.85);
  transition: background 0.15s ease;
}

.gn-btn:active {
  background: rgba(255, 255, 255, 0.9);
}

.gn-back {
  left: 16px;
}

.gn-title {
  position: absolute;
  top: calc(var(--safe-top, 0px) + 6px);
  /* 真机是**左对齐**（紧跟返回按钮），不是居中 —— Ricky 2026-11-06 专门提醒过 */
  left: 72px;
  right: 16px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 17px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.2px;
  pointer-events: none;
  white-space: nowrap;
}

.gn-title :deep(*) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gn-right {
  position: absolute;
  top: calc(var(--safe-top, 0px) + 6px);
  right: 16px;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}

/* 右上角的默认玻璃圆按钮，插槽里直接放图标即可 */
.gn-right :deep(> *) {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.66);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.10),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
