<script setup>
/**
 * 设置类开关：真机实测轨道 43.5 × 24.1 画布（146 × 81 物理），
 * 白色圆钮直径 ≈ 20，开启态轨道为品牌蓝 #3375F6。
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    class="msg-switch"
    :class="{ on: props.modelValue, disabled: props.disabled }"
    type="button"
    role="switch"
    :aria-checked="props.modelValue ? 'true' : 'false'"
    :aria-label="props.ariaLabel || undefined"
    @click.stop="toggle"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
.msg-switch {
  position: relative;
  width: 43.5px;
  height: 24.1px;
  padding: 0;
  border: none;
  border-radius: 12.05px;
  background: #e0e2e5;
  cursor: pointer;
  flex: none;
  transition: background 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  -webkit-tap-highlight-color: transparent;
}
.msg-switch.on {
  background: #3375f6;
}
.msg-switch.disabled {
  opacity: 0.5;
  cursor: default;
}
.knob {
  position: absolute;
  top: 2.05px;
  left: 2.05px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: transform 0.24s cubic-bezier(0.32, 0.72, 0, 1);
}
.msg-switch.on .knob {
  transform: translateX(19.4px);
}
.msg-switch:active .knob {
  width: 22px;
}
.msg-switch.on:active .knob {
  transform: translateX(17.4px);
}
</style>
