<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import { useSubPageNav } from '../../../../composables/useSubPageNav'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import '../../../../styles/layer-transitions.css'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 统一层级导航状态机
const { activeSubView: currentView, isBack, openSubView, closeSubView } = useSubPageNav('main')

// 添加指定号码弹窗
const showAddSheet = ref(false)
const showManualDialog = ref(false)
const showContactPicker = ref(false)
const manualInputNumber = ref('')

function handleBack() {
  if (showContactPicker.value) {
    showContactPicker.value = false
    return
  }
  if (showManualDialog.value) {
    showManualDialog.value = false
    return
  }
  if (showAddSheet.value) {
    showAddSheet.value = false
    return
  }
  if (currentView.value === 'designated') {
    closeSubView()
    return
  }
  emit('back')
}

function openAddSheet() {
  showAddSheet.value = true
}

function openManualAdd() {
  showAddSheet.value = false
  manualInputNumber.value = ''
  showManualDialog.value = true
}

function confirmManualAdd() {
  if (manualInputNumber.value.trim()) {
    phoneStore.addDesignatedNumber(manualInputNumber.value.trim())
    manualInputNumber.value = ''
    showManualDialog.value = false
  }
}

function openContactPicker() {
  showAddSheet.value = false
  showContactPicker.value = true
}

function selectContact(contact) {
  phoneStore.addDesignatedNumber(contact.name ? `${contact.name} (${contact.number})` : contact.number)
  showContactPicker.value = false
}

defineExpose({
  back() {
    if (showContactPicker.value) {
      showContactPicker.value = false
      return true
    }
    if (showManualDialog.value) {
      showManualDialog.value = false
      return true
    }
    if (showAddSheet.value) {
      showAddSheet.value = false
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
      <!-- 主页面：自动录音设置 -->
      <div v-if="currentView === 'main'" key="main" class="subpage-view-pane">
        <GlassNavBar overlay title="自动录音" @back="handleBack" />

        <div class="subpage-body scrollable">
          <!-- 第 1 组卡片：自动录音主开关 -->
          <div class="settings-card">
            <div class="settings-row item-switch no-sep">
              <div class="row-label">自动录音</div>
              <ToggleSwitch v-model="phoneStore.settings.autoRecord" />
            </div>
          </div>

          <template v-if="phoneStore.settings.autoRecord">
            <!-- 自动录音对象 -->
            <div class="section-caption">自动录音对象</div>
            <div class="settings-card">
              <div
                class="settings-row radio-item"
                @click="phoneStore.settings.recordScope = 'all'"
              >
                <div class="row-label">所有通话</div>
                <div class="custom-radio" :class="{ checked: phoneStore.settings.recordScope === 'all' }">
                  <div v-if="phoneStore.settings.recordScope === 'all'" class="radio-inner"></div>
                </div>
              </div>

              <div
                class="settings-row radio-item no-sep"
                @click="phoneStore.settings.recordScope = 'custom'"
              >
                <div class="row-label">自定义</div>
                <div class="custom-radio" :class="{ checked: phoneStore.settings.recordScope === 'custom' }">
                  <div v-if="phoneStore.settings.recordScope === 'custom'" class="radio-inner"></div>
                </div>
              </div>
            </div>

            <!-- 自定义分类分组 -->
            <template v-if="phoneStore.settings.recordScope === 'custom'">
              <div class="section-caption">自定义</div>
              <div class="settings-card">
                <div class="settings-row chevron-item" @click="openSubView('designated')">
                  <div class="row-label">指定号码</div>
                  <div class="right-cluster">
                    <span v-if="phoneStore.settings.designatedNumbers.length > 0" class="badge-count">
                      {{ phoneStore.settings.designatedNumbers.length }}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                      <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div class="settings-row item-switch no-sep">
                  <div class="row-label">陌生号码</div>
                  <ToggleSwitch v-model="phoneStore.settings.recordUnknown" />
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- 四级页面：指定号码 -->
      <div v-else-if="currentView === 'designated'" key="designated" class="subpage-view-pane designated-view">
        <GlassNavBar overlay title="指定号码" @back="handleBack" />

        <div class="subpage-body designated-body scrollable">
          <div v-if="phoneStore.settings.designatedNumbers.length === 0" class="empty-state">
            <div class="empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="1.6">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div class="empty-text">暂无任何指定号码</div>
          </div>

          <div v-else class="settings-card">
            <div
              v-for="(num, idx) in phoneStore.settings.designatedNumbers"
              :key="num"
              class="settings-row"
              :class="{ 'no-sep': idx === phoneStore.settings.designatedNumbers.length - 1 }"
            >
              <div class="row-label">{{ num }}</div>
              <button class="delete-btn" title="移除" @click="phoneStore.removeDesignatedNumber(num)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 底部添加号码主按钮 -->
        <div class="bottom-action-bar">
          <button class="main-add-btn" @click="openAddSheet">添加号码</button>
        </div>
      </div>
    </Transition>

    <!-- 底部动作面板：从联系人中添加 / 手动添加（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="showAddSheet"
      title="添加号码"
      :options="[
        { label: '从联系人中添加', value: 'contact' },
        { label: '手动添加', value: 'manual' }
      ]"
      @pick="val => (val === 'contact' ? openContactPicker() : openManualAdd())"
      @close="showAddSheet = false"
    />

    <!-- 手动添加弹窗（规范 SheetModal） -->
    <SheetModal :visible="showManualDialog" padding="22px 18px 18px" @close="showManualDialog = false">
      <div class="dialog-title">手动添加</div>
      <div class="dialog-body">
        <input
          v-model="manualInputNumber"
          class="dialog-input"
          type="tel"
          placeholder="请输入号码"
          autofocus
          @keyup.enter="confirmManualAdd"
        />
      </div>
      <div class="dialog-actions">
        <button class="dialog-btn cancel" type="button" @click="showManualDialog = false">取消</button>
        <button class="dialog-btn confirm" type="button" :disabled="!manualInputNumber.trim()" @click="confirmManualAdd">确认</button>
      </div>
    </SheetModal>

    <!-- 联系人选择器面板（规范 SheetModal） -->
    <SheetModal :visible="showContactPicker" padding="20px 16px 14px" @close="showContactPicker = false">
      <div class="picker-sheet-title">选择联系人</div>
      <div class="contacts-list scrollable">
        <div
          v-for="c in phoneStore.contacts"
          :key="c.id"
          class="contact-picker-row"
          @click="selectContact(c)"
        >
          <div class="picker-name">{{ c.name }}</div>
          <div class="picker-number">{{ c.number }}</div>
        </div>
      </div>
      <button class="sheet-cancel-btn" type="button" @click="showContactPicker = false">取消</button>
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

.subpage-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.subpage-body {
  flex: 1;
  padding: calc(var(--nav-h) + 10px) 16px 40px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.designated-body {
  padding-bottom: 96px;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 8px 8px;
}

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

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
}

.radio-item {
  cursor: pointer;
}

.radio-item:active {
  background-color: #F8F9FA;
}

.right-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-count {
  font-size: 13px;
  color: #8E8E93;
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.empty-text {
  font-size: 14px;
  color: #8E8E93;
}

.delete-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-action-bar {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(var(--safe-bottom, 20px) + 12px);
}

.main-add-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  background: #00C853;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 200, 83, 0.25);
  transition: transform 0.1s ease, background-color 0.15s ease;
}

.main-add-btn:active {
  transform: scale(0.98);
  background: #00B248;
}

/* 手动添加输入框 */
.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 16px;
}

.dialog-body {
  margin-bottom: 16px;
}

.dialog-input {
  width: 100%;
  height: 46px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 15px;
  color: #1C1C1E;
  outline: none;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: #00C853;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-btn.cancel {
  background: #F2F3F5;
  color: #555555;
}

.dialog-btn.confirm {
  background: #00C853;
  color: #FFFFFF;
}

.dialog-btn.confirm:disabled {
  background: #E0E2E5;
  color: #A0A4A8;
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
