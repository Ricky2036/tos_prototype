<script setup>
import { useDisplaySettingsStore, AUTO_SLEEP_OPTIONS } from '../../../../stores/displaySettingsStore'

/**
 * 「自动息屏时间」在真机上不是整页，而是底部弹层：标题 + 单选列表 + 取消。
 */
const emit = defineEmits(['close'])
const display = useDisplaySettingsStore()

function pick(option) {
  display.setAutoSleep(option)
  emit('close')
}
</script>

<template>
  <div class="sheet-mask" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-title">自动息屏时间</div>
      <div class="sheet-options scrollable">
        <button
          v-for="opt in AUTO_SLEEP_OPTIONS"
          :key="opt"
          type="button"
          class="sheet-option"
          @click="pick(opt)"
        >
          <span class="opt-label">{{ opt }}</span>
          <span class="opt-radio" :class="{ checked: display.autoSleep === opt }"></span>
        </button>
      </div>
      <button class="sheet-cancel" type="button" @click="emit('close')">取消</button>
    </div>
  </div>
</template>

<style scoped>
.sheet-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  z-index: 30;
}

.sheet {
  width: 100%;
  background: #F2F2F7;
  border-radius: 22px 22px 0 0;
  padding: 18px 12px calc(12px + var(--safe-bottom, 0px));
  box-sizing: border-box;
}

.sheet-title {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #111;
  padding-bottom: 8px;
}

.sheet-options {
  max-height: 340px;
  overflow-y: auto;
}

.sheet-option {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 17px;
  color: #111;
  cursor: pointer;
}

.opt-label {
  font-size: 17px;
}

.opt-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opt-radio.checked {
  border-color: #2F6BF6;
  border-width: 2px;
}

.opt-radio.checked::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2F6BF6;
}

.sheet-cancel {
  width: 100%;
  height: 50px;
  margin-top: 10px;
  border: none;
  border-radius: 25px;
  background: #E4E4E9;
  color: #111;
  font-size: 17px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
</style>
