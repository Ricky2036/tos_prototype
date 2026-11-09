<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['openAddContact', 'openMergeDuplicates', 'scroll', 'openContactDetail'])

// 弹窗状态
const showProfileModal = ref(false)
const showGroupsModal = ref(false)
const swipedContactId = ref(null)

// 滑动手势检测
let touchStartX = 0
let touchStartY = 0

function handleTouchStart(e, contact) {
  if (e.touches?.length) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }
}

function handleTouchMove(e, contact) {
  if (!e.touches?.length) return
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY

  if (Math.abs(dy) > Math.abs(dx)) return

  if (Math.abs(dx) > 15) {
    if (dx < -45) {
      swipedContactId.value = contact.id
    } else if (dx > 45 && swipedContactId.value === contact.id) {
      swipedContactId.value = null
    }
  }
}

function handleContactClick(contact) {
  if (swipedContactId.value) {
    swipedContactId.value = null
    return
  }
  phoneStore.selectedContact = contact
}

function handleQuickCall(e, contact) {
  e.stopPropagation()
  phoneStore.startCall(contact)
  swipedContactId.value = null
}

function handleDeleteContact(e, contact) {
  e.stopPropagation()
  phoneStore.removeContact(contact.id)
  swipedContactId.value = null
}
</script>

<template>
  <div class="phone-contacts-tab">
    <!-- 重复联系人提醒卡片 -->
    <div v-if="phoneStore.duplicateBannerVisible" class="duplicate-alert-banner">
      <div class="banner-content">
        <div class="banner-title">发现存在重复联系人，建议您合并去重。</div>
        <button class="banner-action-btn" @click="emit('openMergeDuplicates')">去合并</button>
      </div>
      <button class="banner-close-btn" title="忽略" @click="phoneStore.dismissDuplicateBanner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- 联系人主滚动列表 -->
    <div class="contacts-list">
      <!-- 顶层常驻条目：我的资料 / 我的群组 -->
      <div class="contact-fixed-item" @click="showProfileModal = true">
        <div class="avatar-circle bg-profile">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div class="fixed-info-col">
          <span class="fixed-item-label">我的资料</span>
          <span class="fixed-item-sub">本机号码：138 0000 0000</span>
        </div>
      </div>

      <div class="contact-fixed-item" @click="showGroupsModal = true">
        <div class="avatar-circle bg-groups">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
        <div class="fixed-info-col">
          <span class="fixed-item-label">我的群组</span>
          <span class="fixed-item-sub">3 个分组</span>
        </div>
      </div>

      <!-- 分字母列表 -->
      <div
        v-for="group in phoneStore.groupedContacts"
        :id="`section-${group.letter}`"
        :key="group.letter"
        class="alphabet-group"
      >
        <div class="group-letter-header">{{ group.letter }}</div>
        
        <div
          v-for="c in group.list"
          :key="c.id"
          class="contact-swipe-cell"
          :class="{ 'is-swiped': swipedContactId === c.id }"
          @touchstart.passive="handleTouchStart($event, c)"
          @touchmove.passive="handleTouchMove($event, c)"
        >
          <!-- 侧滑操作底板 -->
          <div class="contact-swipe-actions">
            <button class="swipe-btn btn-call" title="呼叫" @click="handleQuickCall($event, c)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
              </svg>
            </button>
            <button class="swipe-btn btn-del" title="删除" @click="handleDeleteContact($event, c)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>

          <!-- 前景联系人条目 -->
          <div class="contact-row-content" @click="handleContactClick(c)">
            <div class="contact-avatar" :style="{ backgroundColor: c.color || '#8B5CF6' }">
              <span class="avatar-char">{{ c.name?.slice(0, 1) || '联' }}</span>
            </div>
            <div class="contact-name-col">
              <div class="contact-name">{{ c.name }}</div>
              <div v-if="c.number" class="contact-number">{{ c.number }}</div>
            </div>
            <button class="quick-dial-btn" title="拨打" @click.stop="phoneStore.startCall(c)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#00C853">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 底部安全留白，避免被悬浮胶囊底栏遮挡 -->
      <div class="bottom-safe-space"></div>
    </div>

    <!-- 我的资料弹窗 -->
    <Transition name="fade">
      <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
        <div class="profile-card">
          <div class="profile-avatar bg-profile">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div class="profile-name">我的电子名片</div>
          <div class="profile-number">138 0000 0000</div>
          <div class="profile-meta">本机 SIM 卡 1 · 中国电信</div>
          <button class="profile-close-btn" @click="showProfileModal = false">关闭</button>
        </div>
      </div>
    </Transition>

    <!-- 我的群组弹窗 -->
    <Transition name="fade">
      <div v-if="showGroupsModal" class="modal-overlay" @click.self="showGroupsModal = false">
        <div class="groups-card">
          <div class="groups-title">我的群组</div>
          <div class="groups-list">
            <div class="group-row">
              <span class="g-name">家人</span>
              <span class="g-count">2 人</span>
            </div>
            <div class="group-row">
              <span class="g-name">同事</span>
              <span class="g-count">4 人</span>
            </div>
            <div class="group-row no-sep">
              <span class="g-name">常用客户</span>
              <span class="g-count">3 人</span>
            </div>
          </div>
          <button class="profile-close-btn" @click="showGroupsModal = false">完成</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-contacts-tab {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  background: #FFFFFF;
  margin-top: calc(var(--title-progress, 0) * 38px);
}

/* 重复联系人提醒 */
.duplicate-alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 20px 4px;
  padding: 12px 16px;
  background-color: #F7F8FA;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 13px;
  color: #3A3A3C;
  line-height: 1.4;
  margin-bottom: 4px;
}

.banner-action-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #00C853;
  cursor: pointer;
}

.banner-close-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
}

/* 列表容器 */
.contacts-list {
  width: 100%;
  padding: 4px 0 0;
}

/* 资料与群组项 */
.contact-fixed-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.15s ease;
}

.contact-fixed-item:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bg-profile {
  background: linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%);
}

.bg-groups {
  background: linear-gradient(135deg, #A5B4FC 0%, #818CF8 100%);
}

.fixed-info-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fixed-item-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.fixed-item-sub {
  font-size: 12px;
  color: #8E8E93;
}

/* 字母分组 */
.alphabet-group {
  margin-top: 6px;
}

.group-letter-header {
  padding: 8px 20px 4px;
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
}

.contact-swipe-cell {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #FFFFFF;
}

.contact-swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  width: 120px;
  z-index: 1;
}

.swipe-btn {
  flex: 1;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.swipe-btn.btn-call {
  background: #00C853;
}

.swipe-btn.btn-del {
  background: #FF3B30;
}

.contact-row-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: #FFFFFF;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s ease;
  z-index: 2;
  will-change: transform;
}

.contact-swipe-cell.is-swiped .contact-row-content {
  transform: translateX(-120px);
}

.contact-row-content:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.contact-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.avatar-char {
  font-size: 17px;
  font-weight: 600;
  color: #FFFFFF;
}

.contact-name-col {
  flex: 1;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  padding-bottom: 8px;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.contact-number {
  font-size: 12.5px;
  color: #8E8E93;
  margin-top: 1px;
}

.quick-dial-btn {
  background: none;
  border: none;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
}

.bottom-safe-space {
  height: 140px;
}

/* 模态弹窗 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.profile-card,
.groups-card {
  width: 100%;
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 4px;
}

.profile-number {
  font-size: 16px;
  font-weight: 500;
  color: #00C853;
  margin-bottom: 6px;
}

.profile-meta {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 20px;
}

.groups-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 16px;
  width: 100%;
  text-align: center;
}

.groups-list {
  width: 100%;
  background: #F8F9FA;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.group-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 0.5px solid #E5E7EB;
}

.group-row.no-sep {
  border-bottom: none;
}

.g-name {
  font-size: 15px;
  font-weight: 500;
  color: #1C1C1E;
}

.g-count {
  font-size: 13px;
  color: #8E8E93;
}

.profile-close-btn {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: #F2F3F5;
  color: #1C1C1E;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.profile-close-btn:active {
  background: #E8E9EB;
}
</style>
