<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'all' // 'all' | 'category'
  }
})

const emit = defineEmits(['update:modelValue'])

function select(tab) {
  emit('update:modelValue', tab)
}
</script>

<template>
  <div class="capsule-wrap">
    <div class="capsule-container">
      <!-- 实体滑动药丸滑块（浅灰白真机质感） -->
      <div
        class="capsule-slider"
        :class="{ 'is-right': modelValue === 'category' }"
      ></div>

      <button
        type="button"
        class="capsule-btn"
        :class="{ 'is-active': modelValue === 'all' }"
        @click="select('all')"
      >
        全部
      </button>
      <button
        type="button"
        class="capsule-btn"
        :class="{ 'is-active': modelValue === 'category' }"
        @click="select('category')"
      >
        分类
      </button>
    </div>
  </div>
</template>

<style scoped>
.capsule-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.capsule-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 216px;
  height: 36px;
  background: rgba(55, 59, 70, 0.5);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  padding: 3px;
  box-sizing: border-box;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
}

.capsule-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  background: #D8D8DC;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
  transition: transform 0.28s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
  z-index: 1;
}

.capsule-slider.is-right {
  transform: translateX(100%);
}

.capsule-btn {
  position: relative;
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font: 600 14px/1 var(--font-stack, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  cursor: pointer;
  z-index: 2;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  user-select: none;
  outline: none;
}

.capsule-btn.is-active {
  color: #111111;
  font-weight: 700;
}
</style>
