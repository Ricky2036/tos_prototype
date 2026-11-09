<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import { useSubPageNav } from '../../../../composables/useSubPageNav'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import '../../../../styles/layer-transitions.css'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 统一层级导航状态机：'main' | 'simDetail'
const { activeSubView: currentView, isBack, openSubView, closeSubView } = useSubPageNav('main')
const showAccountModal = ref(false)

function handleBack() {
  if (showAccountModal.value) {
    showAccountModal.value = false
    return
  }
  if (currentView.value !== 'main') {
    closeSubView()
    return
  }
  emit('back')
}

defineExpose({
  back() {
    if (showAccountModal.value) {
      showAccountModal.value = false
      return true
    }
    if (currentView.value !== 'main') {
      return closeSubView()
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- 主界面：通话账号 -->
      <div v-if="currentView === 'main'" key="main" class="subpage-view-pane">
        <GlassNavBar overlay title="通话账号" @back="handleBack" />

        <div class="subpage-body scrollable">
          <!-- 分组 1：设置 -->
          <div class="section-caption">设置</div>
          <div class="settings-card">
            <div class="settings-row chevron-item no-sep" @click="openSubView('simDetail')">
              <div class="sim-left">
                <span class="sim-badge">SIM 1</span>
                <span class="row-label">中国电信</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 分组 2：拨打和接听电话 -->
          <div class="section-caption">拨打和接听电话</div>
          <div class="settings-card">
            <div class="settings-row chevron-item no-sep" @click="showAccountModal = true">
              <div class="label-col">
                <div class="row-label">选择通话账号</div>
                <div class="row-sub">{{ phoneStore.settings.carrierAccount }}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 四级子页：设置（中国电信） -->
      <div v-else-if="currentView === 'simDetail'" key="simDetail" class="subpage-view-pane">
        <GlassNavBar overlay title="中国电信" @back="handleBack" />

        <div class="subpage-body scrollable">
          <!-- 分组 1：基本功能 -->
          <div class="settings-card">
            <div class="settings-row item-switch">
              <div class="row-label">VoLTE 高清通话</div>
              <ToggleSwitch v-model="phoneStore.settings.carrierVolte" />
            </div>

            <div class="settings-row item-switch no-sep">
              <div class="row-label">视频通话</div>
              <ToggleSwitch v-model="phoneStore.settings.carrierVideoCall" />
            </div>
          </div>

          <!-- 分组 2：通话管理 -->
          <div class="settings-card">
            <div class="settings-row item-switch">
              <div class="row-label">通话等待</div>
              <ToggleSwitch v-model="phoneStore.settings.carrierCallWaiting" />
            </div>

            <div class="settings-row chevron-item">
              <div class="row-label">呼叫转移</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="settings-row chevron-item">
              <div class="row-label">呼叫限制</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="settings-row chevron-item no-sep">
              <div class="row-label">固定拨号 (FDN)</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 选择通话账号弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="showAccountModal"
      title="选择通话账号"
      :options="['中国电信', '每次都询问'].map(opt => ({ label: opt, value: opt }))"
      v-model="phoneStore.settings.carrierAccount"
      @close="showAccountModal = false"
    />
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

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 8px 8px;
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

.sim-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sim-badge {
  font-size: 11px;
  font-weight: 600;
  color: #00C853;
  background: #E8F8EE;
  padding: 3px 8px;
  border-radius: 6px;
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
}

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
}
</style>
