<script setup>
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'
import LIcon from '../../../ui/LIcon.vue'

/**
 * 通知提醒方式（状态栏 → 通知提醒方式）
 * 真机是底部弹层：4 个带图标的单选（通知图标 / 应用图标 / 数字 / 无）+ 取消。
 */
const emit = defineEmits(['close'])
const notifSettings = useNotificationSettingsStore()

// 真机形态（/tmp/ref/g7/00.png）：都是 ~26px 的小方章——深灰底三点、蓝底对话气泡、
// 深灰圆形「3」、无底色只有禁止符。颜色取自真机截图。
const OPTIONS = [
  { value: '通知图标', shape: 'dots', bg: '#3A3A3C' },
  { value: '应用图标', shape: 'bubble', bg: '#2F6BF6' },
  { value: '数字', shape: 'badge', bg: '#3A3A3C', round: true },
  { value: '无', shape: 'none', bg: 'transparent' }
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
          <span v-if="opt.shape !== 'none'" class="rs-chip" :class="{ round: opt.round }" :style="{ background: opt.bg }">
            <!-- 通知图标：三点 -->
            <svg v-if="opt.shape === 'dots'" width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
              <circle cx="6" cy="12" r="2.1" /><circle cx="12" cy="12" r="2.1" /><circle cx="18" cy="12" r="2.1" />
            </svg>
            <!-- 应用图标：对话气泡（复用 lucide） -->
            <LIcon v-else-if="opt.shape === 'bubble'" name="messageCircle" :size="16" :stroke-width="2.2" style="color: #FFFFFF" />
            <!-- 数字 -->
            <span v-else class="rs-badge">3</span>
          </span>
          <!-- 无：只有禁止符 -->
          <LIcon v-else name="ban" :size="24" :stroke-width="2" style="color: #1C1C1E" />
        </span>
        <span class="rs-label">{{ opt.value }}</span>
        <span class="rs-radio" :class="{ checked: notifSettings.remindStyle === opt.value }"></span>
      </button>
      <button class="rs-cancel" type="button" @click="emit('close')">取消</button>
    </div>
  </div>
</template>

<style scoped>
/* 真机是「悬浮卡片」：左右和底部都留边、四个角都是圆的，
   不能全宽贴底 —— 那样白色方角会顶出屏幕的圆角。 */
.rs-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  padding: 0 16px 26px;
  box-sizing: border-box;
  z-index: 30;
}

.rs-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 26px;
  padding: 20px 16px 14px;
  box-sizing: border-box;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.rs-chip {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rs-chip.round {
  border-radius: 50%;
}

.rs-badge {
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1;
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
