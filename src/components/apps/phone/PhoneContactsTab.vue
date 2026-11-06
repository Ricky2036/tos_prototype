<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const alphabetList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']

const emit = defineEmits(['openAddContact', 'openMergeDuplicates', 'scroll'])

function scrollToSection(letter) {
  const el = document.getElementById(`section-${letter}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function handleContactClick(contact) {
  phoneStore.startCall(contact)
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
      <button class="banner-close-btn" @click="phoneStore.dismissDuplicateBanner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- 联系人主滚动列表 -->
    <div class="contacts-list">
      <!-- 顶层常驻条目：我的资料 / 我的群组 -->
      <div class="contact-fixed-item" @click="phoneStore.startCall({ name: '我的资料', number: '138 0000 0000' })">
        <div class="avatar-circle bg-profile">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <span class="fixed-item-label">我的资料</span>
      </div>

      <div class="contact-fixed-item">
        <div class="avatar-circle bg-groups">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
        <span class="fixed-item-label">我的群组</span>
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
          class="contact-row"
          @click="handleContactClick(c)"
        >
          <div class="contact-avatar" :style="{ backgroundColor: c.color || '#8B5CF6' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div class="contact-name-col">
            <div class="contact-name">{{ c.name }}</div>
          </div>
        </div>
      </div>

      <!-- 底部安全留白，避免被悬浮胶囊底栏遮挡 -->
      <div class="bottom-safe-space"></div>
    </div>
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
  border-radius: 12px;
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
  padding: 6px 0 0;
}

/* 资料与群组项 */
.contact-fixed-item {
  display: flex;
  align-items: center;
  padding: 11px 20px;
  cursor: pointer;
}

.contact-fixed-item:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.bg-profile {
  background: linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%);
}

.bg-groups {
  background: linear-gradient(135deg, #A5B4FC 0%, #818CF8 100%);
}

.fixed-item-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
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

.contact-row {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.contact-row:active {
  background-color: rgba(0, 0, 0, 0.03);
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
}

.contact-name-col {
  flex: 1;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  padding-bottom: 10px;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

/* 右侧字母快速滚动条 */
.alphabet-scrubber {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5px;
  user-select: none;
}

.scrubber-letter {
  font-size: 9.5px;
  font-weight: 600;
  color: #8E8E93;
  padding: 1px 4px;
  cursor: pointer;
}
.scrubber-letter:hover {
  color: #00C853;
}

.bottom-safe-space {
  height: 140px;
}
</style>
