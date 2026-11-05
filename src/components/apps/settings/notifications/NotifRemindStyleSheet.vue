<script setup>
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'

/**
 * 通知提醒方式（状态栏 → 通知提醒方式）
 * 真机是底部弹层：4 个带图标的单选（通知图标 / 应用图标 / 数字 / 无）+ 取消。
 */
const emit = defineEmits(['close'])
const notifSettings = useNotificationSettingsStore()

const OPTIONS = [
  { value: '通知图标', icon: 'dots' },
  { value: '应用图标', icon: 'app' },
  { value: '数字', icon: 'badge' },
  { value: '无', icon: 'none' }
]

function pick(value) {
  notifSettings.setRemindStyle(value)
  emit('close')
}
</script>

<template>
  <div class="rs-mask" @click.self="emit('close')">
    <div class="rs-sheet">
      <div class="rs-title">通知提醒方式</div>
      <button
        v-for="opt in OPTIONS"
        :key="opt.value"
        type="button"
        class="rs-option"
        @click="pick(opt.value)"
      >
        <span class="rs-icon">
          <!-- 通知图标：三点 -->
          <svg v-if="opt.icon === 'dots'" width="20" height="20" viewBox="0 0 24 24" fill="#3C3C43">
            <circle cx="7" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="17" cy="12" r="2.2" />
          </svg>
          <!-- 应用图标 -->
          <svg v-else-if="opt.icon === 'app'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F6BF6" stroke-width="1.8" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="4" />
            <path d="M7 10h6M7 14h4" stroke-linecap="round" />
          </svg>
          <!-- 数字 -->
          <svg v-else-if="opt.icon === 'badge'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" fill="#3C3C43" />
            <text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF" font-family="-apple-system, sans-serif">3</text>
          </svg>
          <!-- 无 -->
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="1.9">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M6.2 6.2l11.6 11.6" stroke-linecap="round" />
          </svg>
        </span>
        <span class="rs-label">{{ opt.value }}</span>
        <span class="rs-radio" :class="{ checked: notifSettings.remindStyle === opt.value }"></span>
      </button>
      <button class="rs-cancel" type="button" @click="emit('close')">取消</button>
    </div>
  </div>
</template>

<style scoped>
.rs-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  z-index: 30;
}

.rs-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 22px 22px 0 0;
  padding: 20px 16px calc(14px + var(--safe-bottom, 0px));
  box-sizing: border-box;
}

.rs-title {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #111;
  padding-bottom: 12px;
}

.rs-option {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: 0 4px;
}

.rs-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.rs-label {
  flex: 1;
  text-align: left;
  font-size: 16px;
  color: #111;
}

.rs-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.rs-radio.checked {
  border-color: #2F6BF6;
  border-width: 2px;
}

.rs-radio.checked::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2F6BF6;
}

.rs-cancel {
  width: 100%;
  height: 50px;
  margin-top: 10px;
  border: none;
  border-radius: 25px;
  background: #F2F2F7;
  color: #111;
  font-size: 17px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
</style>
