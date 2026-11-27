<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import LIcon from '../../ui/LIcon.vue'
import { useBackHandler } from '../../../composables/backRegistry'
import { useAiCompanionStore } from '../../../stores/aiCompanionStore'
import { useNotificationsStore } from '../../../stores/notificationsStore'

defineProps({
  app: { type: Object, default: null }
})

const aiCompanion = useAiCompanionStore()
const notifications = useNotificationsStore()

const chats = ref([
  {
    id: 'rahul',
    name: 'Rahul Sharma',
    initials: 'RS',
    avatarBg: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    status: 'online +91 98765 43210',
    shortStatus: 'online +…',
    time: '12:03',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'Hi! We finalized the regional distribution plan for Q4.', time: '12:00' },
      { id: 2, from: 'them', text: 'Please save my direct mobile number +91 98765 43210 (Rahul Sharma) for urgent shipment updates.', time: '12:00' },
      { id: 3, from: 'me', text: 'Got it Rahul, thanks for sharing!\nWhen works best to review the final terms?', time: '12:02', read: true },
      { id: 4, from: 'them', text: "Let's meet tomorrow (Thursday) at 3:00 PM at CyberHub Gurugram to sign off.", time: '12:03' },
      { id: 5, from: 'them', text: 'Also, kindly send the revised Q4 quotation PDF before tonight so finance can approve it.', time: '12:03' }
    ]
  },
  {
    id: 'ananya',
    name: 'Ananya Patel',
    initials: 'AP',
    avatarBg: 'linear-gradient(135deg, #34B7F1 0%, #0A78F0 100%)',
    status: 'last seen today at 11:45',
    shortStatus: 'today 11:45',
    time: '11:45',
    unread: 2,
    messages: [
      { id: 1, from: 'them', text: 'Are we still on for the product sync after lunch?', time: '11:42' },
      { id: 2, from: 'them', text: 'I uploaded the updated deck to Drive.', time: '11:45' }
    ]
  },
  {
    id: 'ops-team',
    name: 'Global Ops Team',
    initials: 'GO',
    avatarBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    status: 'Rahul, Maya, You',
    shortStatus: '3 participants',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'Batch #402 cleared customs in Mumbai.', time: '18:20' },
      { id: 2, from: 'me', text: 'Great, keep me posted on the warehouse ETA.', time: '18:24', read: true }
    ]
  }
])

const view = ref('chat') // 默认直接进入 Rahul Sharma 对话页以配合 AI 伴随演示
const activeChatId = ref('rahul')
const searchQuery = ref('')
const draft = ref('')
const chatBodyRef = ref(null)

const activeChat = computed(() => chats.value.find((c) => c.id === activeChatId.value) || chats.value[0])
const filteredChats = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return chats.value
  return chats.value.filter((c) => c.name.toLowerCase().includes(q))
})
const isNarrow = computed(() => aiCompanion.isOpen)
const isSlimCompanion = computed(() => aiCompanion.isOpen && aiCompanion.layoutStyle === 'narrow')

function openChat(chat) {
  activeChatId.value = chat.id
  chat.unread = 0
  notifications.list = notifications.list.filter((n) => n.appId !== 'whatsapp')
  view.value = 'chat'
  nextTick(() => scrollToBottom())
}

function goBackToList() {
  if (view.value === 'chat') {
    view.value = 'list'
    return true
  }
  return false
}

useBackHandler(() => goBackToList())

function scrollToBottom() {
  const el = chatBodyRef.value
  if (el) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }
}

function nowTime() {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function sendMessage() {
  const text = draft.value.trim()
  if (!text || !activeChat.value) return
  activeChat.value.messages.push({
    id: Date.now(),
    from: 'me',
    text,
    time: nowTime(),
    read: true
  })
  activeChat.value.time = nowTime()
  draft.value = ''
  nextTick(() => scrollToBottom())
}

watch(
  () => aiCompanion.isOpen,
  (open) => {
    if (view.value === 'chat' && chatBodyRef.value) {
      nextTick(() => {
        if (open) {
          chatBodyRef.value.scrollTo({ top: chatBodyRef.value.scrollHeight, behavior: 'smooth' })
        }
      })
    }
  }
)
</script>

<template>
  <div class="wa-root" :class="{ 'is-narrow': isNarrow, 'is-slim-companion': isSlimCompanion }">
    <!-- 会话列表页 -->
    <template v-if="view === 'list'">
      <header class="wa-list-header">
        <div class="wa-list-title">WhatsApp</div>
        <div class="wa-list-actions">
          <button type="button" class="wa-icon-btn" aria-label="相机">
            <LIcon name="camera" :size="20" />
          </button>
          <button type="button" class="wa-icon-btn" aria-label="更多">
            <LIcon name="moreVertical" :size="20" />
          </button>
        </div>
      </header>

      <div class="wa-search-wrap">
        <div class="wa-search-box">
          <LIcon name="search" :size="16" class="wa-search-icon" />
          <input v-model="searchQuery" type="text" placeholder="Search..." aria-label="搜索聊天" />
        </div>
      </div>

      <div class="wa-list-scroll">
        <button
          v-for="chat in filteredChats"
          :key="chat.id"
          type="button"
          class="wa-chat-row"
          @click="openChat(chat)"
        >
          <div class="wa-avatar" :style="{ background: chat.avatarBg }">{{ chat.initials }}</div>
          <div class="wa-chat-meta">
            <div class="wa-chat-top">
              <span class="wa-chat-name">{{ chat.name }}</span>
              <span class="wa-chat-time">{{ chat.time }}</span>
            </div>
            <div class="wa-chat-bottom">
              <span class="wa-chat-preview">{{ chat.messages[chat.messages.length - 1]?.text }}</span>
              <span v-if="chat.unread > 0" class="wa-unread-badge">{{ chat.unread }}</span>
            </div>
          </div>
        </button>
      </div>
    </template>

    <!-- 聊天对话页 -->
    <template v-else>
      <header class="wa-chat-header">
        <button type="button" class="wa-back-btn" aria-label="返回会话列表" @click="goBackToList">
          <LIcon name="chevronLeft" :size="22" />
        </button>
        <div class="wa-avatar wa-avatar-sm" :style="{ background: activeChat.avatarBg }">
          {{ activeChat.initials }}
        </div>
        <div class="wa-contact-info">
          <div class="wa-contact-name">{{ activeChat.name }}</div>
          <div class="wa-contact-status">{{ isNarrow ? activeChat.shortStatus : activeChat.status }}</div>
        </div>
        <div class="wa-header-tools">
          <button type="button" class="wa-tool-btn" aria-label="视频通话">
            <LIcon name="video" :size="19" />
          </button>
          <button type="button" class="wa-tool-btn" aria-label="语音通话">
            <LIcon name="phone" :size="18" />
          </button>
          <button type="button" class="wa-tool-btn" aria-label="更多选项">
            <LIcon name="moreVertical" :size="19" />
          </button>
        </div>
      </header>

      <div ref="chatBodyRef" class="wa-chat-body">
        <div class="wa-messages">
          <article
            v-for="msg in activeChat.messages"
            :key="msg.id"
            class="wa-bubble"
            :class="{ 'is-sent': msg.from === 'me' }"
          >
            <p class="wa-bubble-text">{{ msg.text }}</p>
            <div class="wa-bubble-time">
              <span>{{ msg.time }}</span>
              <LIcon v-if="msg.from === 'me' && msg.read" name="check" :size="13" class="wa-read-check" />
            </div>
          </article>
        </div>
      </div>

      <form class="wa-composer" @submit.prevent="sendMessage">
        <div class="wa-input-pill">
          <button type="button" class="wa-composer-icon" aria-label="表情">
            <LIcon name="smile" :size="20" />
          </button>
          <input
            v-model="draft"
            type="text"
            placeholder="Message"
            aria-label="输入 WhatsApp 消息"
          />
          <button v-if="!isNarrow" type="button" class="wa-composer-icon" aria-label="附件">
            <LIcon name="plus" :size="20" />
          </button>
          <button type="button" class="wa-composer-icon" aria-label="相机">
            <LIcon name="camera" :size="19" />
          </button>
        </div>
        <button
          type="submit"
          class="wa-send-btn"
          :aria-label="draft.trim() ? '发送消息' : '语音消息'"
        >
          <LIcon :name="draft.trim() ? 'send' : 'mic'" :size="19" />
        </button>
      </form>
    </template>
  </div>
</template>

<style scoped>
.wa-root {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f1f2;
  color: #101214;
  font-family: var(--font-stack);
  overflow: hidden;
}

/* ---- 会话列表头部 ---- */
.wa-list-header {
  flex: none;
  padding: calc(var(--safe-top, 44px) + 6px) 16px 10px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: padding-right 0.58s cubic-bezier(0.22, 0.88, 0.28, 1);
}
.is-narrow .wa-list-header {
  padding-right: calc(35.5% + 16px);
}
.is-slim-companion .wa-list-header {
  padding-right: calc(21.48% + 14px);
}
.wa-list-title {
  font-size: 22px;
  font-weight: 700;
  color: #16a363;
  letter-spacing: -0.3px;
}
.wa-list-actions {
  display: flex;
  gap: 6px;
}
.wa-icon-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #1c1e21;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.wa-icon-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.wa-search-wrap {
  flex: none;
  padding: 0 16px 10px;
  background: #ffffff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
}
.wa-search-box {
  height: 36px;
  border-radius: 18px;
  background: #f0f2f5;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.wa-search-icon {
  color: #6b7280;
}
.wa-search-box input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 14px;
  color: #101214;
}

.wa-list-scroll {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  padding-bottom: calc(var(--safe-bottom, 34px) + 12px);
}
.wa-chat-row {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  cursor: pointer;
}
.wa-chat-row:active {
  background: rgba(0, 0, 0, 0.04);
}
.wa-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  display: grid;
  place-items: center;
  flex: none;
}
.wa-avatar-sm {
  width: 38px;
  height: 38px;
  font-size: 13px;
}
.wa-chat-meta {
  flex: 1;
  min-width: 0;
}
.wa-chat-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.wa-chat-name {
  font-size: 16px;
  font-weight: 600;
  color: #101214;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wa-chat-time {
  font-size: 12px;
  color: #6b7280;
  flex: none;
}
.wa-chat-bottom {
  margin-top: 3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.wa-chat-preview {
  font-size: 13px;
  color: #5c666b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wa-unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #16a363;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  display: grid;
  place-items: center;
  flex: none;
}

/* ---- 对话页头部 ---- */
.wa-chat-header {
  flex: none;
  padding: calc(var(--safe-top, 44px) + 2px) 10px 10px 8px;
  background: #ffffff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;
  transition: padding-right 0.58s cubic-bezier(0.22, 0.88, 0.28, 1);
}
.is-narrow .wa-chat-header {
  padding-left: 4px;
  padding-right: calc(35.5% + 6px);
  gap: 5px;
}
.is-slim-companion .wa-chat-header {
  padding-left: 6px;
  padding-right: calc(21.48% + 6px);
  gap: 6px;
}
.wa-back-btn {
  width: 30px;
  height: 34px;
  border: 0;
  background: transparent;
  color: #101214;
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  flex: none;
}
.wa-contact-info {
  flex: 1;
  min-width: 0;
}
.wa-contact-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: #101214;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wa-contact-status {
  font-size: 12px;
  line-height: 16px;
  color: #5c666b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wa-header-tools {
  display: flex;
  align-items: center;
  flex: none;
}
.wa-tool-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #101214;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.is-narrow .wa-tool-btn {
  width: 26px;
  height: 28px;
}
.wa-tool-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

/* ---- 对话消息流 ---- */
.wa-chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  overscroll-behavior: contain;
  background: #eceae4;
  background-image: radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 0);
  background-size: 18px 18px;
}
.wa-chat-body::-webkit-scrollbar {
  display: none;
}
.wa-messages {
  padding: 16px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: padding-right 0.58s cubic-bezier(0.22, 0.88, 0.28, 1);
}
.is-narrow .wa-messages {
  padding: 12px calc(35.5% + 10px) 12px 10px;
}
.is-slim-companion .wa-messages {
  padding: 12px calc(21.48% + 10px) 12px 12px;
}
.wa-bubble {
  max-width: 78%;
  align-self: flex-start;
  background: #ffffff;
  border-radius: 14px 14px 14px 4px;
  padding: 8px 10px 6px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  transition: max-width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.is-narrow .wa-bubble {
  max-width: 86%;
}
.wa-bubble.is-sent {
  align-self: flex-end;
  background: #d8fdd2;
  border-radius: 14px 14px 4px 14px;
}
.wa-bubble-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 19.5px;
  color: #101214;
  white-space: pre-line;
  overflow-wrap: break-word;
}
.wa-bubble-time {
  margin-top: 3px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  font-size: 11px;
  color: #5c666b;
}
.wa-read-check {
  color: #258fff;
}

/* ---- 底部输入栏 ---- */
.wa-composer {
  flex: none;
  padding: 8px 12px calc(var(--safe-bottom, 24px) + 6px);
  background: #eceae4;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: padding-right 0.58s cubic-bezier(0.22, 0.88, 0.28, 1);
}
.is-narrow .wa-composer {
  padding-left: 8px;
  padding-right: calc(35.5% + 8px);
  gap: 6px;
}
.is-slim-companion .wa-composer {
  padding-left: 10px;
  padding-right: calc(21.48% + 8px);
  gap: 6px;
}
.wa-input-pill {
  flex: 1;
  min-width: 0;
  height: 42px;
  border-radius: 21px;
  background: #ffffff;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.wa-input-pill input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 15px;
  color: #101214;
  caret-color: #16a363;
}
.wa-composer-icon {
  width: 26px;
  height: 26px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #5c666b;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: none;
}
.wa-send-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: #16a363;
  color: #ffffff;
  display: grid;
  place-items: center;
  flex: none;
  cursor: pointer;
  transition: transform 0.14s ease;
}
.wa-send-btn:active {
  transform: scale(0.92);
}
</style>
