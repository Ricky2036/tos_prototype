<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useMessagesStore } from '../../../stores/messagesStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { useBackHandler } from '../../../composables/backRegistry'
import { msgText } from './msgData'
import ConversationListView from './ConversationListView.vue'
import ConversationView from './ConversationView.vue'
import EnterpriseListView from './EnterpriseListView.vue'
import SearchView from './SearchView.vue'
import ComposeView from './ComposeView.vue'
import ContactPickerView from './ContactPickerView.vue'
import SettingsView from './SettingsView.vue'
import MoreSettingsView from './settings/MoreSettingsView.vue'
import AboutView from './settings/AboutView.vue'
import SimSmsView from './settings/SimSmsView.vue'
import XMessageView from './settings/XMessageView.vue'
import SpamBlockView from './SpamBlockView.vue'

/**
 * 「短信」应用外壳（MSG-01）
 *
 * 页面栈：list → chat / ent-list → ent-chat / search / compose / picker /
 *          settings → more / about / simSms / xmessage
 * 转场：真机为整页横滑（进入从右入、返回从左回），沿用项目既有 0.32s 曲线。
 */
defineProps({ app: Object })
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))

const stack = ref([{ name: 'list' }])
const direction = ref('forward')
const view = computed(() => stack.value[stack.value.length - 1])
const toast = ref('')
let toastTimer = null

function showToast(text) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2000)
}

function push(name, params = {}) {
  direction.value = 'forward'
  stack.value.push({ name, ...params })
}

function pop() {
  if (stack.value.length < 2) return false
  direction.value = 'back'
  stack.value.pop()
  return true
}

function reset(name = 'list', params = {}) {
  direction.value = 'back'
  stack.value = [{ name, ...params }]
}

/* 返回：交给全局侧滑/返回键（应用内逐级，最外层交还系统） */
useBackHandler(() => {
  if (stack.value.length > 1) {
    pop()
    return true
  }
  return false
})

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

/* ---------- 列表页事件 ---------- */
function openChat(id) {
  store.openConversation(id)
  push('chat', { conversationId: id, enterprise: false })
}

function openEnterpriseChat(id) {
  store.openEnterprise(id)
  push('ent-chat', { conversationId: id, enterprise: true })
}

function openSettings() {
  push('settings')
}

function openCompose() {
  push('compose', { recipient: null })
}

function onComposeSend(text) {
  // 新建会话的落地页未采集（真机会新建线程），原型只反馈发送成功
  showToast(t.value('sent'))
  reset('list')
}

function onPickerConfirm(list) {
  const picked = list[0] || null
  const idx = stack.value.map(s => s.name).lastIndexOf('compose')
  if (idx >= 0) {
    const next = stack.value.slice(0, idx + 1)
    next[idx] = { ...next[idx], recipient: picked }
    direction.value = 'back'
    stack.value = next
  } else {
    reset('list')
  }
}

const EXTERNAL_TEXT = {
  cloud: 'Infinix Cloud 由系统云服务提供',
  smart: '智能识别由系统服务提供',
  smsc: '短信中心号码由系统提供',
  cellBroadcast: '无线紧急警报由系统应用提供',
  privacy: '隐私政策将在浏览器打开',
  agreement: '用户协议将在浏览器打开'
}

function onExternal(id) {
  showToast(EXTERNAL_TEXT[id] || t.value('disclaimer'))
}

// 层级转场走全仓规范（styles/layer-transitions.css，与设置页同一套 0.22s / 0.14s）
const transitionName = computed(() => (direction.value === 'back' ? 'slide-back' : 'slide'))
</script>

<template>
  <div class="msg-app-root messages-app">
    <Transition :name="transitionName" mode="out-in">
      <ConversationListView
        v-if="view.name === 'list'"
        key="list"
        @open="openChat"
        @open-enterprise="push('ent-list')"
        @search="push('search')"
        @settings="openSettings"
        @compose="openCompose"
        @spam="push('spam')"
      />
      <ConversationView
        v-else-if="view.name === 'chat'"
        :key="`chat-${view.conversationId}`"
        :conversation-id="view.conversationId"
        @back="pop"
      />
      <EnterpriseListView
        v-else-if="view.name === 'ent-list'"
        key="ent-list"
        @back="pop"
        @open="openEnterpriseChat"
      />
      <ConversationView
        v-else-if="view.name === 'ent-chat'"
        :key="`ent-${view.conversationId}`"
        :conversation-id="view.conversationId"
        enterprise
        @back="pop"
      />
      <SearchView v-else-if="view.name === 'search'" key="search" @back="reset('list')" />
      <ComposeView
        v-else-if="view.name === 'compose'"
        key="compose"
        :recipient="view.recipient"
        @back="pop"
        @pick="push('picker')"
        @send="onComposeSend"
      />
      <ContactPickerView
        v-else-if="view.name === 'picker'"
        key="picker"
        @close="pop"
        @confirm="onPickerConfirm"
      />
      <SettingsView
        v-else-if="view.name === 'settings'"
        key="settings"
        @back="pop"
        @open="(route) => push(route)"
        @external="onExternal"
      />
      <MoreSettingsView
        v-else-if="view.name === 'more'"
        key="more"
        @back="pop"
        @open="(route) => push(route)"
        @external="onExternal"
      />
      <AboutView v-else-if="view.name === 'about'" key="about" @back="pop" />
      <SimSmsView v-else-if="view.name === 'simSms'" key="simSms" @back="pop" />
      <XMessageView
        v-else-if="view.name === 'xmessage'"
        key="xmessage"
        @back="pop"
        @external="onExternal"
      />
      <SpamBlockView v-else-if="view.name === 'spam'" key="spam" @back="pop" />
    </Transition>

    <Transition name="toast-fade">
      <div v-if="toast" class="feedback-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.msg-app-root {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  overflow: hidden;
  color: #000;
  font-family: var(--font-stack, -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif);
}
.feedback-toast {
  position: absolute;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.92);
  color: #fff;
  padding: 10px 20px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  z-index: 100;
  white-space: nowrap;
  pointer-events: none;
}
.toast-fade-enter-active,
.toast-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-fade-enter-from,
.toast-fade-leave-to { opacity: 0; transform: translate(-50%, 8px); }
</style>
