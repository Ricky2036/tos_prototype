<script setup>
import { ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['back', 'save'])

const callsOption = ref(props.initialData?.calls || '不允许任何权限')
const appsOption = ref(props.initialData?.apps || '不允许任何权限')

const CALL_OPTIONS = ['不允许任何权限', '仅限常用联系人', '仅限联系人', '所有人']
const APP_OPTIONS = ['不允许任何权限', '允许选定的应用程序']

function cycleCalls() {
  const idx = CALL_OPTIONS.indexOf(callsOption.value)
  callsOption.value = CALL_OPTIONS[(idx + 1) % CALL_OPTIONS.length]
}

function cycleApps() {
  const idx = APP_OPTIONS.indexOf(appsOption.value)
  appsOption.value = APP_OPTIONS[(idx + 1) % APP_OPTIONS.length]
}

function handleDone() {
  emit('save', {
    enabled: true,
    calls: callsOption.value,
    apps: appsOption.value,
    summary: callsOption.value === '不允许任何权限' && appsOption.value === '不允许任何权限'
      ? '不允许任何权限'
      : `${callsOption.value}，${appsOption.value}`
  })
}
</script>

<template>
  <div class="mode-fullscreen-subpage">
    <GlassNavBar overlay title="免打扰" @back="emit('back')" />

    <div class="subpage-scrollable">
      <div class="large-title-block">
        <h1 class="page-large-title">免打扰</h1>
        <p class="page-desc-text">
          【免打扰】会将所有来电、通知和其他提醒静音，但您选择允许的设置除外。
        </p>
      </div>

      <div class="section-group-label">在【免打扰】期间允许</div>

      <div class="settings-card-group">
        <div class="card-action-row" @click="cycleCalls">
          <div class="row-text-group">
            <div class="row-main-title">来电和信息</div>
            <div class="row-sub-blue">{{ callsOption }}</div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>

        <div class="card-action-row" @click="cycleApps">
          <div class="row-text-group">
            <div class="row-main-title">应用程序通知</div>
            <div class="row-sub-blue">{{ appsOption }}</div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 底部悬浮双态胶囊栏 -->
    <div class="bottom-capsule-bar">
      <button class="capsule-btn btn-cancel" @click="emit('back')">取消</button>
      <div class="capsule-divider"></div>
      <button class="capsule-btn btn-confirm" @click="handleDone">完成</button>
    </div>
  </div>
</template>

<style scoped>
.mode-fullscreen-subpage {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.subpage-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 64px) 20px calc(var(--home-indicator-inset, 14px) + 90px);
}

.large-title-block {
  margin-bottom: 24px;
}

.page-large-title {
  font-size: 28px;
  font-weight: 700;
  color: #18181B;
  margin: 0 0 8px;
}

.page-desc-text {
  font-size: 14px;
  color: #71717A;
  line-height: 1.5;
  margin: 0;
}

.section-group-label {
  font-size: 13.5px;
  font-weight: 600;
  color: #71717A;
  margin: 0 4px 10px;
}

.settings-card-group {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 24px;
}

.card-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.card-action-row:last-child {
  border-bottom: none;
}

.card-action-row:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.row-text-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.row-main-title {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.row-sub-blue {
  font-size: 13.5px;
  color: #2563EB;
}

.chevron-icon {
  color: #A1A1AA;
}

/* 底部悬浮双态胶囊栏 */
.bottom-capsule-bar {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 30px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 4px;
  z-index: 65;
}

.capsule-btn {
  background: none;
  border: none;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 24px;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-cancel {
  color: #71717A;
}

.btn-confirm {
  color: #1B64DA;
  font-weight: 600;
}

.capsule-btn:active {
  background-color: rgba(0, 0, 0, 0.06);
}

.capsule-divider {
  width: 1px;
  height: 18px;
  background: rgba(0, 0, 0, 0.08);
}
</style>
