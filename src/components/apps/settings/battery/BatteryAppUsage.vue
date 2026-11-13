<script setup>
import { ref, computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import { useBatteryStore, APP_BEHAVIOR_OPTIONS } from '../../../../stores/batteryStore'
import { getApp } from '../../../../config/apps'
import { APP_USAGE } from './batteryData'

/**
 * 应用耗电详情（真机：电池首页排行/其他应用 → 某个应用）
 * 证据：`.local-evidence/SET-BAT-01/18-app-detail.*`
 *
 * unknown：「强行停止应用」真机两次截屏都没有可见确认；这里按系统惯例先确认再执行，
 * 执行后只改原型状态（不会真的停止任何应用）。
 */
const props = defineProps({
  appId: { type: String, default: '' },
  appName: { type: String, default: '' }
})
const emit = defineEmits(['back'])
const store = useBatteryStore()

const showStopConfirm = ref(false)
const stopped = ref(false)
const toastText = ref('')
let toastTimer = null

const name = computed(() => props.appName || getApp(props.appId)?.name || '应用')
const usage = computed(() => APP_USAGE[props.appId] || {
  fgTime: '少于 1 分钟', fgDrain: '少于 1 mAh', bgTime: '少于 1 分钟', bgDrain: '少于 1 mAh'
})
const behavior = computed(() => store.behaviorOf(props.appId))

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastText.value = '' }, 1800)
}

function chooseBehavior(value) {
  store.setAppBehavior(props.appId, value)
}

function forceStop() {
  showStopConfirm.value = false
  stopped.value = true
  showToast('已强行停止')
}
</script>

<template>
  <SubPageShell :title="name" @back="emit('back')">
    <div class="section-header">近 24 小时</div>

    <div class="settings-card">
      <ListCell title="前台运行时长" :value="stopped ? '0 分钟' : usage.fgTime" />
      <ListCell title="前台耗电量" :value="stopped ? '少于 1 mAh' : usage.fgDrain" />
      <ListCell title="后台运行时长" :value="stopped ? '0 分钟' : usage.bgTime" />
      <ListCell title="后台耗电量" :value="stopped ? '少于 1 mAh' : usage.bgDrain" last />
    </div>

    <div class="section-header">耗电行为控制</div>
    <div class="settings-card">
      <ListCell
        v-for="opt in APP_BEHAVIOR_OPTIONS"
        :key="opt.value"
        :title="opt.title"
        :subtitle="opt.subtitle"
        clickable
        :last="opt.value === 'unrestricted'"
        @click="chooseBehavior(opt.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: behavior === opt.value }"></span>
        </template>
      </ListCell>
    </div>

    <div class="settings-card">
      <ListCell clickable last @click="showStopConfirm = true">
        <template #title>
          <span class="danger-title">强行停止应用</span>
        </template>
      </ListCell>
    </div>

    <SheetModal :visible="showStopConfirm" padding="24px 20px 18px" @close="showStopConfirm = false">
      <div class="confirm-title">强行停止 {{ name }}</div>
      <div class="confirm-desc">停止后该应用会退出，可能丢失未保存的数据。</div>
      <div class="confirm-actions">
        <button type="button" class="confirm-btn ghost" @click="showStopConfirm = false">取消</button>
        <button type="button" class="confirm-btn danger" @click="forceStop">强行停止</button>
      </div>
    </SheetModal>

    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </SubPageShell>
</template>

<style scoped>
.danger-title { color: #FF3B30; font-size: 17px; }

.confirm-title { font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 10px; }
.confirm-desc { font-size: 13px; color: #8E8E93; text-align: center; line-height: 19px; margin-bottom: 18px; }
.confirm-actions { display: flex; gap: 12px; }

.confirm-btn {
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 23px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.confirm-btn.ghost { background: #F2F2F7; color: #1C1C1E; }
.confirm-btn.danger { background: #FF3B30; color: #FFFFFF; }

.settings-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.2s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }
</style>
