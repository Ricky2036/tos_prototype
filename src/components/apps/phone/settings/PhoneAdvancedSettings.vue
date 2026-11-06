<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import flipMuteHeroImg from '../../../../assets/img/phone_settings/flip_mute_hero.png'
import raiseToAnswerHeroImg from '../../../../assets/img/phone_settings/raise_to_answer_hero.png'
import gestureAnswerHeroImg from '../../../../assets/img/phone_settings/gesture_answer_hero.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 当前视图：'main' | 'speedDial' | 'accessibility' | 'flipMute' | 'raiseToAnswer' | 'gestureAnswer'
const currentView = ref('main')

// 模态弹窗
const showTtyModal = ref(false)
const showAssignSpeedDialKey = ref(null) // null | 2..9
const showSpeedDialActionKey = ref(null) // null | 2..9

function handleBack() {
  if (showTtyModal.value) {
    showTtyModal.value = false
    return
  }
  if (showAssignSpeedDialKey.value !== null) {
    showAssignSpeedDialKey.value = null
    return
  }
  if (showSpeedDialActionKey.value !== null) {
    showSpeedDialActionKey.value = null
    return
  }
  if (currentView.value !== 'main') {
    currentView.value = 'main'
    return
  }
  emit('back')
}

function handleSpeedDialSlotClick(key) {
  if (key === 1) return // 语音邮件
  if (phoneStore.settings.speedDial[key]) {
    // 已绑定，打开操作菜单（更换 / 清除）
    showSpeedDialActionKey.value = key
  } else {
    // 未绑定，打开联系人选择
    showAssignSpeedDialKey.value = key
  }
}

function assignContactToSpeedDial(contact) {
  if (showAssignSpeedDialKey.value) {
    phoneStore.setSpeedDial(showAssignSpeedDialKey.value, contact.name || contact.number)
    showAssignSpeedDialKey.value = null
  }
}

function clearSpeedDialSlot() {
  if (showSpeedDialActionKey.value) {
    phoneStore.setSpeedDial(showSpeedDialActionKey.value, null)
    showSpeedDialActionKey.value = null
  }
}

function replaceSpeedDialSlot() {
  const k = showSpeedDialActionKey.value
  showSpeedDialActionKey.value = null
  showAssignSpeedDialKey.value = k
}

defineExpose({
  back() {
    if (showTtyModal.value) {
      showTtyModal.value = false
      return true
    }
    if (showAssignSpeedDialKey.value !== null) {
      showAssignSpeedDialKey.value = null
      return true
    }
    if (showSpeedDialActionKey.value !== null) {
      showSpeedDialActionKey.value = null
      return true
    }
    if (currentView.value !== 'main') {
      currentView.value = 'main'
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <!-- 主界面：高级设置 -->
    <div v-if="currentView === 'main'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">高级设置</div>
      </div>

      <div class="subpage-body scrollable">
        <!-- 第 1 组卡片（4项）：按电源按钮结束通话、接听/挂断电话时振动、快速拨号、无障碍功能 -->
        <div class="settings-card">
          <div class="settings-row item-switch">
            <div class="row-label">按电源按钮结束通话</div>
            <ToggleSwitch v-model="phoneStore.settings.powerButtonEndsCall" />
          </div>

          <div class="settings-row item-switch">
            <div class="row-label">接听/挂断电话时振动</div>
            <ToggleSwitch v-model="phoneStore.settings.vibrateOnCallAction" />
          </div>

          <div class="settings-row chevron-item" @click="currentView = 'speedDial'">
            <div class="row-label">快速拨号</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row chevron-item no-sep" @click="currentView = 'accessibility'">
            <div class="row-label">无障碍功能</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 第 2 组卡片（3项）：智能手势 -->
        <div class="section-caption">智能手势</div>
        <div class="settings-card">
          <div class="settings-row chevron-item" @click="currentView = 'flipMute'">
            <div class="row-label">翻转静音</div>
            <div class="right-summary">
              <span class="summary-text">{{ phoneStore.settings.flipToMute ? '开启' : '关闭' }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <div class="settings-row chevron-item" @click="currentView = 'raiseToAnswer'">
            <div class="row-label">拿起接听</div>
            <div class="right-summary">
              <span class="summary-text">{{ phoneStore.settings.pickupToAnswer ? '开启' : '关闭' }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <div class="settings-row chevron-item no-sep" @click="currentView = 'gestureAnswer'">
            <div class="row-label">手势接听</div>
            <div class="right-summary">
              <span class="summary-text">{{ phoneStore.settings.gestureAnswer ? '开启' : '关闭' }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：快速拨号（100% 对齐真机 3x3 网格 09_sub_speed_dial.png） -->
    <div v-else-if="currentView === 'speedDial'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">快速拨号</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="speed-dial-grid">
          <div
            v-for="key in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="key"
            class="speed-dial-slot"
            :class="{ fixed: key === 1, assigned: phoneStore.settings.speedDial[key] }"
            @click="handleSpeedDialSlotClick(key)"
          >
            <div class="slot-num">{{ key }}</div>
            <div class="slot-content">
              <template v-if="key === 1">
                <div class="slot-avatar voicemail">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2">
                    <circle cx="5.5" cy="12.5" r="3.5" />
                    <circle cx="18.5" cy="12.5" r="3.5" />
                    <line x1="5.5" y1="16" x2="18.5" y2="16" />
                  </svg>
                </div>
                <div class="slot-label">语音邮件</div>
              </template>

              <template v-else-if="phoneStore.settings.speedDial[key]">
                <div class="slot-avatar user-assigned">
                  {{ phoneStore.settings.speedDial[key].slice(0, 1) }}
                </div>
                <div class="slot-label">{{ phoneStore.settings.speedDial[key] }}</div>
              </template>

              <template v-else>
                <div class="slot-avatar empty">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A0A4A8" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div class="slot-label empty">点按添加</div>
              </template>
            </div>
          </div>
        </div>

        <div class="quick-dial-tip">
          添加联系人后，在拨号盘长按数字键即可快速拨打。
        </div>
      </div>
    </div>

    <!-- 四级子页：无障碍功能 -->
    <div v-else-if="currentView === 'accessibility'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">无障碍功能</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="settings-card">
          <div class="settings-row chevron-item" @click="showTtyModal = true">
            <div class="label-col">
              <div class="row-label">TTY 模式</div>
              <div class="row-sub">{{ phoneStore.settings.ttyMode }}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row item-switch with-sub no-sep">
            <div class="label-col">
              <div class="row-label">助听器</div>
              <div class="row-sub">启用助听器兼容模式</div>
            </div>
            <ToggleSwitch v-model="phoneStore.settings.hearingAid" />
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：翻转静音 -->
    <div v-else-if="currentView === 'flipMute'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">翻转静音</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="gesture-hero-card">
          <div class="hero-image-wrap">
            <img :src="flipMuteHeroImg" class="hero-img" alt="翻转静音插画" />
          </div>
          <div class="gesture-desc-text">
            来电时，翻转手机可静音。
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-row item-switch no-sep">
            <div class="row-label">翻转静音</div>
            <ToggleSwitch v-model="phoneStore.settings.flipToMute" />
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：拿起接听 -->
    <div v-else-if="currentView === 'raiseToAnswer'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">拿起接听</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="gesture-hero-card">
          <div class="hero-image-wrap">
            <img :src="raiseToAnswerHeroImg" class="hero-img" alt="拿起接听插画" />
          </div>
          <div class="gesture-desc-text">
            开启此功能，当您收到来电时，拿起手机靠近耳边即可接听电话。
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-row item-switch no-sep">
            <div class="row-label">拿起接听</div>
            <ToggleSwitch v-model="phoneStore.settings.pickupToAnswer" />
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：手势接听 -->
    <div v-else-if="currentView === 'gestureAnswer'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">手势接听</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="gesture-hero-card">
          <div class="hero-image-wrap">
            <img :src="gestureAnswerHeroImg" class="hero-img" alt="手势接听插画" />
          </div>
          <div class="gesture-title-text">接听手势</div>
          <div class="gesture-desc-text">
            在距手机屏幕上方约20cm处，使用上图手势接听来电。手势要领：食指、中指朝前伸出，手心正对前摄像头。
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-row item-switch with-sub no-sep">
            <div class="label-col">
              <div class="row-label">手势接听</div>
              <div class="row-sub">开启后，摄像头自动开启，低电量时本功能不可用。</div>
            </div>
            <ToggleSwitch v-model="phoneStore.settings.gestureAnswer" />
          </div>
        </div>
      </div>
    </div>

    <!-- TTY 模式 ActionSheet -->
    <Transition name="fade">
      <div v-if="showTtyModal" class="modal-overlay" @click.self="showTtyModal = false">
        <div class="action-sheet-card">
          <div class="sheet-title">TTY 模式</div>
          <div class="sheet-options">
            <div
              v-for="opt in ['TTY 关闭', 'TTY 全功能', 'TTY HCO', 'TTY VCO']"
              :key="opt"
              class="sheet-radio-row"
              @click="phoneStore.settings.ttyMode = opt; showTtyModal = false"
            >
              <span class="sheet-label">{{ opt }}</span>
              <div class="custom-radio" :class="{ checked: phoneStore.settings.ttyMode === opt }">
                <div v-if="phoneStore.settings.ttyMode === opt" class="radio-inner"></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="showTtyModal = false">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 快速拨号操作弹窗（更换 / 清除） -->
    <Transition name="fade">
      <div v-if="showSpeedDialActionKey !== null" class="modal-overlay" @click.self="showSpeedDialActionKey = null">
        <div class="action-sheet-card">
          <div class="sheet-title">快速拨号 {{ showSpeedDialActionKey }}</div>
          <div class="sheet-items">
            <div class="sheet-item" @click="replaceSpeedDialSlot">更换联系人</div>
            <div class="sheet-item text-danger" @click="clearSpeedDialSlot">清除绑定</div>
          </div>
          <button class="sheet-cancel-btn" @click="showSpeedDialActionKey = null">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 快速拨号选择联系人 -->
    <Transition name="fade">
      <div v-if="showAssignSpeedDialKey !== null" class="modal-overlay" @click.self="showAssignSpeedDialKey = null">
        <div class="contact-picker-sheet">
          <div class="sheet-title">绑定按键 {{ showAssignSpeedDialKey }}</div>
          <div class="contacts-list scrollable">
            <div
              v-for="c in phoneStore.contacts"
              :key="c.id"
              class="contact-picker-row"
              @click="assignContactToSpeedDial(c)"
            >
              <div class="picker-name">{{ c.name }}</div>
              <div class="picker-number">{{ c.number }}</div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="showAssignSpeedDialKey = null">取消</button>
        </div>
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
  background: #F0F1F3;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: #F0F1F3;
}

.back-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.back-btn:active {
  background-color: #E8E9EB;
  transform: scale(0.96);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-left: 12px;
}

.subpage-body {
  flex: 1;
  padding: 12px 16px 40px;
}

/* 白色卡片分组 */
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

.with-sub,
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
  font-size: 15px;
  color: #8E8E93;
}

/* 快速拨号 3x3 网格 */
.speed-dial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 18px 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.speed-dial-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  background: #F8F9FA;
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.speed-dial-slot:active {
  transform: scale(0.97);
  background: #F0F1F3;
}

.speed-dial-slot.fixed {
  cursor: default;
}

.slot-num {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #8E8E93;
}

.slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.slot-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.slot-avatar.voicemail {
  background: #E8F8EE;
}

.slot-avatar.user-assigned {
  background: #00C853;
  color: #FFFFFF;
}

.slot-avatar.empty {
  background: #FFFFFF;
  border: 1.5px dashed #D1D1D6;
}

.slot-label {
  font-size: 12px;
  font-weight: 500;
  color: #1C1C1E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  text-align: center;
}

.slot-label.empty {
  color: #8E8E93;
}

.quick-dial-tip {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  padding: 0 16px;
}

/* 手势引导卡片 */
.gesture-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 18px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.hero-image-wrap {
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1.2 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gesture-title-text {
  font-size: 15px;
  font-weight: 700;
  color: #1C1C1E;
  margin-top: 14px;
  margin-bottom: 4px;
}

.gesture-desc-text {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  margin-top: 8px;
  padding: 0 8px;
}

/* 弹窗与选择器 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.action-sheet-card {
  width: 100%;
  background: #F8F9FA;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 16px calc(var(--safe-bottom, 20px) + 16px);
  box-sizing: border-box;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 16px;
}

.sheet-options {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.sheet-radio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.sheet-radio-row:last-child {
  border-bottom: none;
}

.sheet-radio-row:active {
  background: #F2F3F5;
}

.sheet-label {
  font-size: 16px;
  color: #1C1C1E;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D1D1D6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-radio.checked {
  border-color: #00C853;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00C853;
}

.sheet-items {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.sheet-item {
  padding: 16px;
  font-size: 16px;
  color: #1C1C1E;
  text-align: center;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.sheet-item:last-child {
  border-bottom: none;
}

.sheet-item.text-danger {
  color: #FF3B30;
}

.sheet-cancel-btn {
  width: 100%;
  height: 50px;
  background: #FFFFFF;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  border: none;
  cursor: pointer;
}

.contact-picker-sheet {
  width: 100%;
  max-height: 75vh;
  background: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 16px calc(var(--safe-bottom, 20px) + 16px);
  display: flex;
  flex-direction: column;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.contact-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 8px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.contact-picker-row:active {
  background: #F8F9FA;
}

.picker-name {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.picker-number {
  font-size: 14px;
  color: #8E8E93;
}
</style>
