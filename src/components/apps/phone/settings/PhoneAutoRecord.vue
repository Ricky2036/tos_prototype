<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 当前层级：'main' | 'designated'
const currentView = ref('main')

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
    currentView.value = 'main'
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
    if (currentView.value === 'designated') {
      currentView.value = 'main'
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <!-- 主页面：自动录音设置 -->
    <div v-if="currentView === 'main'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">自动录音</div>
      </div>

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
              <div class="settings-row chevron-item" @click="currentView = 'designated'">
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
    <div v-else-if="currentView === 'designated'" class="subpage-pane designated-view">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">指定号码</div>
      </div>

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

      <!-- 底部添加号码主按钮（100% 对齐真机底栏绿色圆角大按钮） -->
      <div class="bottom-action-bar">
        <button class="main-add-btn" @click="openAddSheet">添加号码</button>
      </div>
    </div>

    <!-- 底部动作面板：从联系人中添加 / 手动添加 -->
    <Transition name="fade">
      <div v-if="showAddSheet" class="modal-overlay" @click.self="showAddSheet = false">
        <div class="action-sheet-card">
          <div class="sheet-title">添加号码</div>
          <div class="sheet-items">
            <div class="sheet-item" @click="openContactPicker">从联系人中添加</div>
            <div class="sheet-item" @click="openManualAdd">手动添加</div>
          </div>
          <button class="sheet-cancel-btn" @click="showAddSheet = false">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 手动添加弹窗（真机 AlertDialog 样式） -->
    <Transition name="fade">
      <div v-if="showManualDialog" class="modal-overlay" @click.self="showManualDialog = false">
        <div class="alert-dialog-card">
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
            <button class="dialog-btn cancel" @click="showManualDialog = false">取消</button>
            <button class="dialog-btn confirm" :disabled="!manualInputNumber.trim()" @click="confirmManualAdd">确认</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 联系人选择器面板 -->
    <Transition name="fade">
      <div v-if="showContactPicker" class="modal-overlay" @click.self="showContactPicker = false">
        <div class="contact-picker-sheet">
          <div class="sheet-title">选择联系人</div>
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
          <button class="sheet-cancel-btn" @click="showContactPicker = false">取消</button>
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

/* 规范白色圆角卡片 */
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

.radio-item,
.chevron-item {
  cursor: pointer;
}

.radio-item:active,
.chevron-item:active {
  background-color: #F8F9FA;
}

.right-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
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

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 指定号码视图 */
.designated-body {
  padding-bottom: 90px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 40px;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #E8EAED;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  color: #8E8E93;
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

/* 弹窗遮罩 */
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

/* 动作面板 */
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

.sheet-item:active {
  background: #F2F3F5;
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

.sheet-cancel-btn:active {
  background: #F2F3F5;
}

/* 对话框 */
.alert-dialog-card {
  width: calc(100% - 48px);
  max-width: 340px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px 16px;
  margin-bottom: auto;
  margin-top: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 18px;
}

.dialog-body {
  margin-bottom: 20px;
}

.dialog-input {
  width: 100%;
  height: 44px;
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
