<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import { useSubPageNav } from '../../../../composables/useSubPageNav'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import '../../../../styles/layer-transitions.css'

import flipMuteHeroImg from '../../../../assets/img/phone_settings/flip_mute_hero.png'
import raiseToAnswerHeroImg from '../../../../assets/img/phone_settings/raise_to_answer_hero.png'
import gestureAnswerHeroImg from '../../../../assets/img/phone_settings/gesture_answer_hero.png'

const props = defineProps({
  initialView: {
    type: String,
    default: 'main'
  }
})

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 统一层级导航状态机：'main' | 'speedDial' | 'accessibility' | 'flipMute' | 'raiseToAnswer' | 'gestureAnswer'
const { activeSubView: currentView, isBack, openSubView, closeSubView } = useSubPageNav(props.initialView || 'main')

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
    closeSubView()
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
      return closeSubView()
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- 主界面：高级设置 -->
      <div v-if="currentView === 'main'" key="main" class="subpage-view-pane">
        <GlassNavBar overlay title="高级设置" @back="handleBack" />

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

            <div class="settings-row chevron-item" @click="openSubView('speedDial')">
              <div class="row-label">快速拨号</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="settings-row chevron-item no-sep" @click="openSubView('accessibility')">
              <div class="row-label">无障碍功能</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 第 2 组卡片（3项）：智能手势 -->
          <div class="section-caption">智能手势</div>
          <div class="settings-card">
            <div class="settings-row chevron-item" @click="openSubView('flipMute')">
              <div class="row-label">翻转静音</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.flipToMute ? '开启' : '关闭' }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="settings-row chevron-item" @click="openSubView('raiseToAnswer')">
              <div class="row-label">拿起接听</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.pickupToAnswer ? '开启' : '关闭' }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="settings-row chevron-item no-sep" @click="openSubView('gestureAnswer')">
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

      <!-- 四级子页：快速拨号 -->
      <div v-else-if="currentView === 'speedDial'" key="speedDial" class="subpage-view-pane">
        <GlassNavBar overlay title="快速拨号" @back="handleBack" />

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
      <div v-else-if="currentView === 'accessibility'" key="accessibility" class="subpage-view-pane">
        <GlassNavBar overlay title="无障碍功能" @back="handleBack" />

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
      <div v-else-if="currentView === 'flipMute'" key="flipMute" class="subpage-view-pane">
        <GlassNavBar overlay title="翻转静音" @back="handleBack" />

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
      <div v-else-if="currentView === 'raiseToAnswer'" key="raiseToAnswer" class="subpage-view-pane">
        <GlassNavBar overlay title="拿起接听" @back="handleBack" />

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
      <div v-else-if="currentView === 'gestureAnswer'" key="gestureAnswer" class="subpage-view-pane">
        <GlassNavBar overlay title="手势接听" @back="handleBack" />

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
    </Transition>

    <!-- TTY 模式 ActionSheet（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="showTtyModal"
      title="TTY 模式"
      :options="['TTY 关闭', 'TTY 全功能', 'TTY HCO', 'TTY VCO'].map(opt => ({ label: opt, value: opt }))"
      v-model="phoneStore.settings.ttyMode"
      @close="showTtyModal = false"
    />

    <!-- 快速拨号操作弹窗（更换 / 清除，规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="showSpeedDialActionKey !== null"
      :title="`快速拨号 ${showSpeedDialActionKey}`"
      :options="[
        { label: '更换联系人', value: 'replace' },
        { label: '清除绑定', value: 'clear' }
      ]"
      @pick="val => (val === 'replace' ? replaceSpeedDialSlot() : clearSpeedDialSlot())"
      @close="showSpeedDialActionKey = null"
    />

    <!-- 快速拨号选择联系人（规范 SheetModal） -->
    <SheetModal :visible="showAssignSpeedDialKey !== null" padding="20px 16px 14px" @close="showAssignSpeedDialKey = null">
      <div class="picker-sheet-title">绑定按键 {{ showAssignSpeedDialKey }}</div>
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
      <button class="sheet-cancel-btn" type="button" @click="showAssignSpeedDialKey = null">取消</button>
    </SheetModal>
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

/* 快速拨号 3x3 网格 */
.speed-dial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.speed-dial-slot {
  position: relative;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}

.speed-dial-slot:active {
  transform: scale(0.96);
  background: #F8F9FA;
}

.slot-num {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #8E8E93;
}

.slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 6px;
  width: 100%;
}

.slot-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.slot-avatar.voicemail {
  background: #E8F8EE;
}

.slot-avatar.user-assigned {
  background: #00C853;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
}

.slot-avatar.empty {
  background: #F2F3F5;
}

.slot-label {
  font-size: 13px;
  font-weight: 500;
  color: #1C1C1E;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-label.empty {
  color: #8E8E93;
  font-size: 12px;
}

.quick-dial-tip {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  padding: 0 16px;
}

/* 智能手势插画卡片 */
.gesture-hero-card {
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
  width: 100%;
  max-width: 260px;
  aspect-ratio: 1.25 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gesture-title-text {
  font-size: 16px;
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
}

/* 联系人选择器 */
.picker-sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 14px;
}

.contacts-list {
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.contact-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 8px;
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

.sheet-cancel-btn {
  width: 100%;
  height: 46px;
  background: #F2F2F7;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  border: none;
  cursor: pointer;
}

.sheet-cancel-btn:active {
  background: #E5E5EA;
}
</style>
