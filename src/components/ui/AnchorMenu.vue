<script setup>
/**
 * 行内下拉菜单（AnchorMenu）
 *
 * 真机上「通知分组」「网络通话降噪」这类行点开后是**贴着该行的小浮层**，不是底部弹层。
 * 用法：父元素设 `position: relative`，把本组件放在同一容器里，它会出现在元素下方右对齐。
 *
 * options: [{ value, label }]
 */
defineProps({
  visible: { type: Boolean, default: false },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' }
})
const emit = defineEmits(['update:modelValue', 'close'])

function pick(value) {
  emit('update:modelValue', value)
  emit('close')
}
</script>

<template>
  <Transition name="anchor-pop">
    <div v-if="visible" class="anchor-backdrop" @click="emit('close')">
      <div class="anchor-menu" @click.stop>
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="anchor-item"
          :class="{ on: opt.value === modelValue }"
          @click="pick(opt.value)"
        >
          <span class="anchor-label">{{ opt.label }}</span>
          <svg v-if="opt.value === modelValue" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F6BF5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 透明遮罩只负责点外面关闭，不改变视觉 */
.anchor-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
}

.anchor-menu {
  position: absolute;
  top: 100%;
  right: 12px;
  margin-top: -6px;
  min-width: 148px;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.18);
  padding: 6px;
  display: flex;
  flex-direction: column;
}

.anchor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  height: 44px;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 9px;
  font-family: inherit;
  font-size: 16px;
  color: #111;
  cursor: pointer;
}

.anchor-item.on {
  color: #2F6BF5;
  font-weight: 600;
}

.anchor-item:active {
  background: #F2F2F7;
}

/* 出现动效：轻微下移 + 淡入（与底部弹层同一套缓动语言） */
.anchor-pop-enter-active {
  transition: opacity 0.16s ease;
}

.anchor-pop-leave-active {
  transition: opacity 0.12s ease;
}

.anchor-pop-enter-active .anchor-menu {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.anchor-pop-enter-from,
.anchor-pop-leave-to {
  opacity: 0;
}

.anchor-pop-enter-from .anchor-menu {
  transform: translateY(-6px) scale(0.97);
}
</style>
