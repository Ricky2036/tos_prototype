<script setup>
import { computed, ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['close', 'edit', 'openFlashCall'])

const contact = computed(() => phoneStore.selectedContact)
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 1800)
}

function handleClose() {
  phoneStore.selectedContact = null
  emit('close')
}

function handleCall() {
  if (contact.value) {
    phoneStore.startCall(contact.value)
    handleClose()
  }
}

function handleVideoCall() {
  if (contact.value) {
    phoneStore.startCall(contact.value, true)
    handleClose()
  }
}

function handleSendSms() {
  showToast('已进入短信编辑')
}

function handleOpenFlash() {
  if (contact.value) {
    phoneStore.flashCallTarget = contact.value
    handleClose()
  }
}

function handleCopyNumber() {
  const num = contact.value?.number || ''
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(num).catch(() => {})
  }
  showToast('号码已复制到剪贴板')
}

function handleToggleBlacklist() {
  const num = contact.value?.number
  if (!num) return
  if (phoneStore.settings.blackList.includes(num)) {
    phoneStore.removeBlackListNumber(num)
    showToast('已从黑名单中移出')
  } else {
    phoneStore.addBlackListNumber(num)
    showToast('已加入黑名单')
  }
}

function handleDeleteContact() {
  if (contact.value) {
    phoneStore.removeContact(contact.value.id)
    showToast('联系人已删除')
    handleClose()
  }
}

const isBlacklisted = computed(() => {
  return contact.value && phoneStore.settings.blackList.includes(contact.value.number)
})
</script>

<template>
  <div v-if="contact" class="contact-detail-overlay" @click.self="handleClose">
    <div class="contact-detail-sheet">
      <!-- 顶部拖拽手柄与关闭按键 -->
      <div class="sheet-top-bar">
        <div class="drag-handle-pill"></div>
        <button class="sheet-close-btn" title="关闭" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 联系人基本信息卡片 -->
      <div class="contact-header-card">
        <div class="contact-avatar-circle" :style="{ backgroundColor: contact.color || '#8B5CF6' }">
          <span class="avatar-letter">{{ contact.name?.slice(0, 1) || '联' }}</span>
        </div>
        <div class="contact-name-title">{{ contact.name }}</div>
        <div class="contact-number-subtitle">{{ contact.number }}</div>
        <div v-if="contact.company" class="contact-company-tag">{{ contact.company }}</div>
      </div>

      <!-- 四个快捷圆形功能圆钮 -->
      <div class="quick-actions-bar">
        <button class="quick-action-col" @click="handleCall">
          <div class="action-circle-icon bg-call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
            </svg>
          </div>
          <span class="action-label">呼叫</span>
        </button>

        <button class="quick-action-col" @click="handleSendSms">
          <div class="action-circle-icon bg-sms">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <span class="action-label">发信息</span>
        </button>

        <button class="quick-action-col" @click="handleVideoCall">
          <div class="action-circle-icon bg-video">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="13" height="12" rx="2.5" fill="#FFFFFF" />
              <path d="M15 10.2L20.2 6.8C20.7 6.4 21.5 6.8 21.5 7.5V16.5C21.5 17.2 20.7 17.6 20.2 17.2L15 13.8" fill="#FFFFFF" />
            </svg>
          </div>
          <span class="action-label">视频通话</span>
        </button>

        <button class="quick-action-col" @click="handleOpenFlash">
          <div class="action-circle-icon bg-flash">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span class="action-label">Flash Call</span>
        </button>
      </div>

      <!-- 联系人核心资料卡片 -->
      <div class="section-title">电话与标签</div>
      <div class="detail-card">
        <div class="detail-info-row" @click="handleCall">
          <div class="info-left">
            <div class="info-val">{{ contact.number }}</div>
            <div class="info-tag">{{ contact.tag || '手机' }}</div>
          </div>
          <button class="info-action-icon" title="呼叫" @click.stop="handleCall">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#00C853">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 更多操作卡片 -->
      <div class="section-title">选项与设置</div>
      <div class="detail-card">
        <div class="menu-action-row" @click="emit('edit', contact); handleClose()">
          <span class="menu-text">编辑联系人</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="menu-action-row" @click="handleCopyNumber">
          <span class="menu-text">复制号码</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="menu-action-row" @click="handleToggleBlacklist">
          <span class="menu-text" :class="{ 'text-danger': !isBlacklisted }">
            {{ isBlacklisted ? '移出黑名单' : '加入黑名单' }}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="menu-action-row no-sep" @click="handleDeleteContact">
          <span class="menu-text text-danger">删除联系人</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 轻量提示条 -->
    <Transition name="fade">
      <div v-if="toastText" class="toast-tip">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.contact-detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 85;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.contact-detail-sheet {
  width: 100%;
  max-height: 85vh;
  background: #F8F9FA;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  padding: 12px 18px calc(var(--safe-bottom, 20px) + 20px);
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-sizing: border-box;
}

.sheet-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  height: 24px;
  margin-bottom: 8px;
}

.drag-handle-pill {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #D1D5DB;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 4px;
}

.sheet-close-btn {
  position: absolute;
  right: -4px;
  top: -2px;
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 联系人头像与姓名 */
.contact-header-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 16px;
}

.contact-avatar-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.avatar-letter {
  font-size: 28px;
  font-weight: 600;
  color: #FFFFFF;
}

.contact-name-title {
  font-size: 21px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 4px;
}

.contact-number-subtitle {
  font-size: 15px;
  color: #8E8E93;
}

.contact-company-tag {
  font-size: 13px;
  color: #3B82F6;
  background: #EFF6FF;
  padding: 2px 10px;
  border-radius: 6px;
  margin-top: 6px;
}

/* 4 个快捷操作按钮 */
.quick-actions-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px 6px 18px;
}

.quick-action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
}

.action-circle-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.12s ease;
}

.quick-action-col:active .action-circle-icon {
  transform: scale(0.92);
}

.bg-call { background: #00C853; }
.bg-sms { background: #3B82F6; }
.bg-video { background: #10B981; }
.bg-flash { background: #F59E0B; }

.action-label {
  font-size: 12px;
  font-weight: 500;
  color: #1C1C1E;
}

/* 卡片 */
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  margin: 12px 6px 8px;
}

.detail-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.detail-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
}

.detail-info-row:active {
  background-color: #F8F9FA;
}

.info-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-val {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.info-tag {
  font-size: 13px;
  color: #8E8E93;
}

.info-action-icon {
  background: none;
  border: none;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.menu-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.menu-action-row.no-sep {
  border-bottom: none;
}

.menu-action-row:active {
  background-color: #F8F9FA;
}

.menu-text {
  font-size: 15px;
  font-weight: 500;
  color: #1C1C1E;
}

.menu-text.text-danger {
  color: #FF3B30;
}

.toast-tip {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  font-size: 14px;
  padding: 9px 18px;
  border-radius: 20px;
  z-index: 100;
  pointer-events: none;
  white-space: nowrap;
}
</style>
