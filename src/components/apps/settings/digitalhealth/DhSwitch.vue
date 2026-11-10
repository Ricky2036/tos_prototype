<script setup>
/**
 * 数字健康专用的 Material 开关（真机 Google Digital Wellbeing 用的是 Material 3 开关）。
 *
 * 真机量测（480 缩略图 → 360 画布 CSS px，×0.75）：
 *   轨道 61×37 → **46×28**；开启态轨道 #1A73E8、旋钮白色且带蓝色对勾；关闭态轨道 #E6E6E9、旋钮灰边。
 * ⚠️ 不要换成 `ui/ToggleSwitch.vue`：那是 iOS 51×31 绿色拨杆，形态与真机不是一个体系。
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

function onClick() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="dh-switch"
    :class="{ on: modelValue, disabled }"
    role="switch"
    :aria-checked="modelValue"
    @click.stop="onClick"
  >
    <span class="dh-switch-knob">
      <svg v-if="modelValue" width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M5 12.6L9.6 17.2L19 7.8" stroke="#1A73E8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.dh-switch {
  position: relative;
  width: 46px;
  height: 28px;
  border: none;
  padding: 0;
  border-radius: 14px;
  background: #E6E6E9;
  flex: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.dh-switch.on { background: #1A73E8; }
.dh-switch.disabled { opacity: 0.5; cursor: default; }

.dh-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.dh-switch.on .dh-switch-knob { transform: translateX(18px); }
</style>
