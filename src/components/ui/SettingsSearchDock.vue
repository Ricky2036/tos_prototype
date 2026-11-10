<script setup>
import { ref, watch, nextTick } from 'vue'
import SettingsSearchBar from './SettingsSearchBar.vue'
import SearchClearButton from './SearchClearButton.vue'

/**
 * 【全仓标准控件】设置类页面的底部搜索栏（两个状态）。
 *
 * 真机取证（2026-11-10，/tmp/ref/gI/srch_02_active.png / srch_04_committed.png）：
 * · 未点击：悬浮胶囊，左右 27 / 离底 25 / 高 44，右侧**麦克风**；
 * · 点击后：左侧 **44×44 圆形返回按钮** + 右侧胶囊输入框（**麦克风消失**），
 *   左右 16 / 间距 12 / 离底 25，输入文字后右侧出现深灰实心圆白叉清除按钮。
 *
 * 设置首页、设置搜索页、勿扰应用提醒、设置应用列表共用这一个控件，
 * 避免各处自己拼一套「搜索态」导致样式漂移。
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  active: { type: Boolean, default: false },
  placeholder: { type: String, default: '搜索' },
  /** 激活态渐隐遮罩的底色：设置搜索页 #F8F9FA，三级页 #F0F1F2 */
  fadeColor: { type: String, default: '#F8F9FA' }
})
const emit = defineEmits(['update:modelValue', 'activate', 'back', 'clear'])

const inputRef = ref(null)
watch(() => props.active, (v) => {
  if (v) nextTick(() => inputRef.value?.focus())
}, { immediate: true })

function onInput(e) {
  emit('update:modelValue', e.target.value)
}
function clear() {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}
function back() {
  emit('update:modelValue', '')
  emit('back')
}
</script>

<template>
  <div
    class="sfd"
    :class="active ? 'is-active' : 'is-idle'"
    :style="{ '--sfd-fade': fadeColor }"
    data-search-dock
  >
    <!-- 未激活：沿用首页同款胶囊（含麦克风） -->
    <div v-if="!active" class="sfd-idle" data-sfd-idle @click="emit('activate')">
      <SettingsSearchBar :model-value="modelValue" :placeholder="placeholder" @clear="emit('clear')" />
    </div>

    <!-- 激活：圆形返回 + 无麦克风的胶囊输入 -->
    <template v-else>
      <button type="button" class="sfd-back" data-sfd-back aria-label="返回" @click="back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" />
        </svg>
      </button>
      <div class="sfd-capsule">
        <svg class="sfd-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref="inputRef"
          class="sfd-input"
          :value="modelValue"
          :placeholder="placeholder"
          @input="onInput"
        />
        <SearchClearButton v-if="modelValue" data-sfd-clear @click="clear" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.sfd {
  position: absolute;
  z-index: 10;
  pointer-events: auto;
}

/* 未激活：真机左右 27 / 离屏底 25，底部渐隐 */
.sfd.is-idle {
  left: 27px;
  right: 27px;
  bottom: 25px;
}
.sfd.is-idle::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -27px;
  right: -27px;
  top: -34px;
  bottom: -25px;
  background: linear-gradient(
    to bottom,
    rgba(240, 241, 242, 0) 0%,
    rgba(240, 241, 242, 0.88) 38%,
    #F0F1F2 68%,
    #F0F1F2 100%
  );
  pointer-events: none;
}

/* 激活：真机左右 16 / 间距 12 / 离屏底 25，整条渐隐 */
.sfd.is-active {
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 25px 16px;
  box-sizing: border-box;
  background: linear-gradient(180deg, transparent 0%, var(--sfd-fade) 24%, var(--sfd-fade) 100%);
}

.sfd-back {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  cursor: pointer;
  padding: 0;
}
.sfd-back:active { transform: scale(0.92); background: #F2F2F7; }

.sfd-capsule {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  background: #FFFFFF;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.sfd-capsule:focus-within {
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}
.sfd-search-icon { flex: none; }
.sfd-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1C1C1E;
  font-family: inherit;
  padding: 0;
}
.sfd-input::placeholder { color: #8E8E93; }
</style>
