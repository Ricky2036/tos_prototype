<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import unknownHeroImg from '../../../../assets/img/phone_settings/unknown_id_hero.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const isUpdating = ref(false)
const toastMessage = ref('')
let toastTimer = null

const showAutoUpdateModal = ref(false)

const autoUpdateText = computed(() => {
  if (phoneStore.settings.autoUpdateData === 'wlan_only') return '仅在 WLAN 下备份恢复数据'
  if (phoneStore.settings.autoUpdateData === 'always') return '在任何网络下备份恢复数据'
  return '关闭'
})

function showToast(msg) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

function handleUpdateNow() {
  if (isUpdating.value) return
  isUpdating.value = true
  showToast('正在检查更新...')
  setTimeout(() => {
    isUpdating.value = false
    showToast('已是最新号码识别库')
  }, 1000)
}

defineExpose({
  back() {
    if (showAutoUpdateModal.value) {
      showAutoUpdateModal.value = false
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <GlassNavBar overlay title="陌生号码识别" @back="emit('back')" />

    <div class="subpage-body scrollable">
      <!-- 顶部插画卡片（对齐真机手机真机比例与四边细边框） -->
      <div class="id-hero-card">
        <div class="hero-image-wrap">
          <img :src="unknownHeroImg" class="hero-img" alt="陌生号码识别插画" />
        </div>
      </div>

      <!-- 第 1 组卡片：识别开关与各个通信渠道 -->
      <div class="settings-card">
        <div class="settings-row item-switch with-sub">
          <div class="label-col">
            <div class="row-label">智能识别陌生号码</div>
            <div class="row-sub">识别通话、短信中的陌生号码。</div>
          </div>
          <ToggleSwitch v-model="phoneStore.settings.unknownId" />
        </div>

        <template v-if="phoneStore.settings.unknownId">
          <div class="settings-row item-switch">
            <div class="row-label">电话与短信</div>
            <ToggleSwitch v-model="phoneStore.settings.unknownPhoneSms" />
          </div>

          <div class="settings-row item-switch">
            <div class="row-label">WhatsApp 通话</div>
            <ToggleSwitch v-model="phoneStore.settings.unknownWhatsApp" />
          </div>

          <div class="settings-row item-switch with-sub no-sep">
            <div class="label-col">
              <div class="row-label">弹窗提醒</div>
              <div class="row-sub">接听陌生号码后，自动弹出弹窗。</div>
            </div>
            <ToggleSwitch v-model="phoneStore.settings.unknownPopup" />
          </div>
        </template>
      </div>

      <!-- 第 2 组卡片：更新设置 -->
      <div class="settings-card">
        <div class="settings-row chevron-item" @click="showAutoUpdateModal = true">
          <div class="row-label">自动更新数据</div>
          <div class="right-summary">
            <span class="summary-text">{{ autoUpdateText }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <div class="settings-row chevron-item no-sep" @click="handleUpdateNow">
          <div class="row-label">立即更新</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 自动更新数据选择弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="showAutoUpdateModal"
      title="自动更新数据"
      :options="[
        { label: '仅在 WLAN 下备份恢复数据', value: 'wlan_only' },
        { label: '在任何网络下备份恢复数据', value: 'always' },
        { label: '关闭', value: 'never' }
      ]"
      v-model="phoneStore.settings.autoUpdateData"
      @close="showAutoUpdateModal = false"
    />

    <!-- 轻量提示条 -->
    <Transition name="fade">
      <div v-if="toastMessage" class="toast-tip">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F2;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-body {
  flex: 1;
  padding: calc(var(--nav-h) + 10px) 16px 40px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部卡片 */
.id-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.hero-image-wrap {
  width: 140px;
  aspect-ratio: 1 / 1.99;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 白色卡片分组 */
.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  min-height: 52px;
  border-bottom: 0.5px solid #F0F1F3;
  box-sizing: border-box;
}

.settings-row.no-sep {
  border-bottom: none;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.with-sub {
  align-items: flex-start;
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 240px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.4;
}

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
}

.right-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-text {
  font-size: 14px;
  color: #8E8E93;
}

.toast-tip {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #FFFFFF;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 20px;
  z-index: 120;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
