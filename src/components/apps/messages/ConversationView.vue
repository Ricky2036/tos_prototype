<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useMessagesStore } from '../../../stores/messagesStore'
import { useI18nStore } from '../../../stores/i18nStore'
import LIcon from '../../ui/LIcon.vue'
import { msgText } from './msgData'
import MsgTopBar from './components/MsgTopBar.vue'
import MsgPopupMenu from './components/MsgPopupMenu.vue'
import MsgDialog from './components/MsgDialog.vue'

/**
 * 对话页（真机 ConversationActivity）
 *
 * 几何（物理 ÷ 3.3556）：
 *   顶栏 56 @ safe-top·32 · 返回圆钮 44 @ x16 · 标题 x76 20px / 副标题 13px
 *   右侧胶囊 100×44（电话 + ⋮）
 *   气泡左右各 22、内 padding 12/10、圆角 8、正文 16 / 行高 1.3
 *   己方气泡 #D9E0F1、对方 #E7E8E9；meta 13px #909191 贴气泡底、同侧对齐
 *   输入栏高 69：胶囊 271×44 @ x16 + 右侧 44 圆钮（有文字时变 54 蓝色发送）
 */
const props = defineProps({
  conversationId: { type: String, required: true },
  enterprise: { type: Boolean, default: false }
})
const emit = defineEmits(['back', 'open-settings'])
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))

const flow = ref(null)
const draft = ref('')
const menuOpen = ref(false)
const menu = ref({ x: 0, y: 0 })
const msgMenu = ref(null) // { index, x, y }
const detail = ref(null) // 消息对象
const selectMode = ref(false)
const selected = ref(new Set())

const card = computed(() => {
  if (props.enterprise) return store.enterpriseById(props.conversationId)
  return store.byId(props.conversationId)
})

const messages = computed(() => {
  if (!card.value) return []
  if (props.enterprise) return store.enterpriseMessagesOf(props.conversationId)
  return store.messagesOf(props.conversationId)
})

const title = computed(() => card.value?.name || card.value?.number || '')
const subtitle = computed(() => (props.enterprise ? '' : card.value?.number || ''))
const showCall = computed(() => !props.enterprise && !!card.value?.number)

const menuItems = computed(() => (props.enterprise
  ? [
      { id: 'block', label: t.value('block') },
      { id: 'moveToNotification', label: t.value('moveToNotification') },
      { id: 'delete', label: t.value('delete') }
    ]
  : [
      { id: 'viewContact', label: t.value('viewContact') },
      { id: 'pin', label: store.isPinned(props.conversationId) ? t.value('unpin') : t.value('pin') },
      { id: 'block', label: t.value('block') },
      { id: 'moveToNotification', label: t.value('moveToNotification') },
      { id: 'delete', label: t.value('delete') }
    ]))

const msgMenuItems = computed(() => [
  { id: 'copy', label: t.value('copyText') },
  { id: 'translate', label: t.value('translate') },
  { id: 'share', label: t.value('share') },
  { id: 'forward', label: t.value('forward') },
  { id: 'delete', label: t.value('delete') },
  { id: 'select', label: t.value('multiSelect') },
  { id: 'detail', label: t.value('detail') }
])

const MAX_LEN = 159
const counter = computed(() => `${MAX_LEN} / ${draft.value.length}`)

function scrollToBottom() {
  nextTick(() => {
    const el = flow.value
    if (!el) return
    el.scrollTop = el.scrollHeight
    // 气泡换行后高度会二次变化，再补一帧
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
  })
}

watch(() => props.conversationId, () => {
  draft.value = store.draftOf(props.conversationId)
  selectMode.value = false
  selected.value = new Set()
  scrollToBottom()
}, { immediate: true })

function openMenu(e) {
  const host = e.currentTarget.getBoundingClientRect()
  const page = e.currentTarget.closest('.msg-app-root')?.getBoundingClientRect()
  if (!page) return
  const scale = page.width / 360 || 1
  menu.value = { x: 180, y: (host.bottom - page.top) / scale + 6 }
  menuOpen.value = true
}

function onMenuSelect(id) {
  menuOpen.value = false
  if (id === 'pin') store.togglePin(props.conversationId)
  if (id === 'delete') {
    store.deleteConversations([props.conversationId])
    emit('back')
  }
}

function openMsgMenu(e, index) {
  if (selectMode.value) return
  const host = e.currentTarget.getBoundingClientRect()
  const page = e.currentTarget.closest('.msg-app-root')?.getBoundingClientRect()
  if (!page) return
  const scale = page.width / 360 || 1
  msgMenu.value = {
    index,
    x: Math.max(12, Math.min((host.left - page.left) / scale, 180)),
    y: Math.min((host.bottom - page.top) / scale + 6, 320)
  }
}

function onMsgMenuSelect(id) {
  const index = msgMenu.value?.index ?? -1
  const msg = messages.value[index]
  msgMenu.value = null
  if (!msg) return
  if (id === 'detail') detail.value = msg
  if (id === 'select') {
    selectMode.value = true
    selected.value = new Set([index])
  }
}

function toggleSelect(index) {
  const next = new Set(selected.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  selected.value = next
  if (!next.size) selectMode.value = false
}

function exitSelect() {
  selectMode.value = false
  selected.value = new Set()
}

function segmentsOf(msg) {
  const links = msg.links || []
  if (!links.length) return [{ text: msg.text, link: false }]
  const pattern = new RegExp(`(${links.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return msg.text.split(pattern).filter(Boolean).map(part => ({ text: part, link: links.includes(part) }))
}

function onInput(e) {
  draft.value = e.target.value
  store.setDraft(props.conversationId, draft.value)
}

function send() {
  const text = draft.value.trim()
  if (!text) return
  store.sendMessage(props.conversationId, text, '刚刚')
  draft.value = ''
  store.setDraft(props.conversationId, '')
  scrollToBottom()
}

const nowStamp = () => {
  const d = new Date()
  return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function sendNow() {
  const text = draft.value.trim()
  if (!text) return
  store.sendMessage(props.conversationId, text, nowStamp())
  draft.value = ''
  store.setDraft(props.conversationId, '')
  scrollToBottom()
}

function detailFields(msg) {
  return [
    { label: t.value('fieldType'), value: t.value('typeSms') },
    { label: t.value('fieldSender'), value: msg.from === 'me' ? '+8613200007890' : (props.enterprise ? card.value.number : card.value.number) },
    { label: t.value('fieldSentTime'), value: msg.time },
    { label: t.value('fieldRecipient'), value: msg.from === 'me' ? `+86${(card.value.number || '').replace(/^\+?86/, '')}` : '+8613200007890' },
    { label: t.value('fieldSim'), value: '' }
  ]
}
</script>

<template>
  <div class="msg-chat-page" data-msg-page="chat">
    <MsgTopBar :title="title" :subtitle="subtitle" @back="emit('back')">
      <template v-if="enterprise" #default>
        <div class="tb-title-row">
          <span class="tb-title-text">{{ title }}</span>
          <span class="verified">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M12 1.8l2.5 1.9 3.1-.3 1 3 2.6 1.7-1 3 1 3-2.6 1.7-1 3-3.1-.3L12 22.2l-2.5-1.9-3.1.3-1-3-2.6-1.7 1-3-1-3 2.6-1.7 1-3 3.1.3z" fill="#2FBE6E" />
              <path d="M8.2 12.3l2.5 2.5 5-5.4" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>
      </template>
      <template #right>
        <div class="action-pill">
          <button v-if="showCall" class="pill-btn" type="button" data-msg-call>
            <!-- 项目已有描边听筒（lucide phone），与真机同款细线 -->
            <LIcon name="phone" :size="21" :stroke-width="1.35" />
          </button>
          <button class="pill-btn" type="button" data-msg-chat-overflow @click="openMenu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E1E20">
              <circle cx="12" cy="4" r="2.1" />
              <circle cx="12" cy="12" r="2.1" />
              <circle cx="12" cy="20" r="2.1" />
            </svg>
          </button>
        </div>
      </template>
    </MsgTopBar>

    <div v-if="selectMode" class="select-head">
      <button class="close-btn" type="button" data-msg-exit-select @click="exitSelect">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="2.2" stroke-linecap="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
      <span class="select-count">{{ t('selected', { n: selected.size }) }}</span>
      <button class="select-all" type="button" @click="selected.size === messages.length ? exitSelect() : (selected = new Set(messages.map((_, i) => i)))">
        <svg v-if="selected.size !== messages.length" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C3C3C5" stroke-width="1.8">
          <rect x="3" y="3" width="18" height="18" rx="5" />
        </svg>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="#3375F6" />
          <path d="M7.4 12.2l3.1 3.1 6-6.6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <div ref="flow" class="msg-flow scrollable">
      <div class="flow-pad" />
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="msg-block"
        :class="msg.from === 'me' ? 'mine' : 'theirs'"
        :data-msg-index="index"
      >
        <div
          class="bubble"
          :class="[msg.from === 'me' ? 'mine' : 'theirs', { emoji: msg.emoji }]"
          :data-msg-bubble="index"
          @click="selectMode && toggleSelect(index)"
          @contextmenu.prevent="openMsgMenu($event, index)"
        >
          <span v-if="msg.emoji" class="emoji-text">{{ msg.text }}</span>
          <span v-else class="bubble-text">
            <template v-for="(seg, si) in segmentsOf(msg)" :key="si">
              <span :class="{ link: seg.link }">{{ seg.text }}</span>
            </template>
          </span>
        </div>
        <div class="msg-meta">
          <span v-if="msg.status" class="meta-status">{{ t('sent') }} </span>{{ msg.time }}
        </div>
        <span v-if="selectMode" class="check" :class="{ on: selected.has(index) }" @click="toggleSelect(index)">
          <svg v-if="selected.has(index)" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5.5 12.4l4.2 4.2 8.8-9.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
      <div class="flow-tail" />
    </div>

    <div v-if="selectMode" class="select-bar">
      <button class="select-del" type="button" data-msg-delete-selected @click="exitSelect">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 7h16M9 7V5.2A1.2 1.2 0 0110.2 4h3.6A1.2 1.2 0 0115 5.2V7M6.4 7l.9 12.1c0 .5.4.9.9.9h7.6c.5 0 .9-.4.9-.9L17.6 7" />
        </svg>
        <span>{{ t('delete') }}</span>
      </button>
    </div>

    <div v-else class="compose-bar">
      <div class="compose-pill" :class="{ focused: draft.length > 0 }">
        <button class="attach-btn" type="button" data-msg-attach>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.7" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <input
          class="compose-input"
          type="text"
          :value="draft"
          :placeholder="t('composePlaceholder')"
          data-msg-input
          @input="onInput"
          @keyup.enter="sendNow"
        />
        <button class="sim-btn" type="button" data-msg-sim aria-label="SIM">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.6" stroke-linejoin="round">
            <path d="M9.6 3.8h7.8c1 0 1.8.8 1.8 1.8v12.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8V8.2l4.8-4.4z" />
            <rect x="8.4" y="10.6" width="7.2" height="6.2" rx="1" />
            <path d="M8.4 13.7h7.2M12 10.6v6.2" stroke-width="1.1" />
          </svg>
        </button>
      </div>
      <div class="send-slot">
        <span v-if="draft.length" class="counter">{{ counter }}</span>
        <button
          v-if="!draft.length"
          class="voice-btn"
          type="button"
          data-msg-voice
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.8" stroke-linecap="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.6 11.2a6.4 6.4 0 0012.8 0M12 17.6V21" />
          </svg>
        </button>
        <button v-else class="send-btn" type="button" data-msg-send @click="sendNow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20V4.6M12 4.6L5.6 11M12 4.6L18.4 11" />
          </svg>
        </button>
      </div>
    </div>

    <MsgPopupMenu
      v-if="menuOpen"
      :items="menuItems"
      :x="menu.x"
      :y="menu.y"
      :width="164"
      @select="onMenuSelect"
      @close="menuOpen = false"
    />
    <MsgPopupMenu
      v-if="msgMenu"
      :items="msgMenuItems"
      :x="msgMenu.x"
      :y="msgMenu.y"
      :width="137"
      @select="onMsgMenuSelect"
      @close="msgMenu = null"
    />

    <MsgDialog
      v-if="detail"
      :title="t('detail')"
      :action="t('gotIt')"
      data-msg-detail
      @action="detail = null"
      @close="detail = null"
    >
      <div class="detail-list">
        <div v-for="f in detailFields(detail)" :key="f.label" class="detail-row">
          <span class="detail-label">{{ f.label }}：</span><span class="detail-value">{{ f.value }}</span>
        </div>
      </div>
    </MsgDialog>
  </div>
</template>

<style scoped>
.msg-chat-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 14.3px;
  box-sizing: border-box;
}
.tb-title-row { display: flex; align-items: center; gap: 7px; }
.tb-title-text {
  font-size: 19px;
  font-weight: 600;
  line-height: 24px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.verified { display: inline-flex; flex: none; }
.action-pill {
  width: 100px;
  height: 44px;
  border-radius: 22px;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  /* 真机胶囊内：左 3.9 · 电话 44.1 · 间距 8 · ⋮ 44.1 · 右 0（⋮ 钮贴胶囊右缘） */
  justify-content: flex-start;
  gap: 8px;
  padding-left: 3.9px;
  box-sizing: border-box;
}
.pill-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}
.pill-btn { color: #3a3a3c; }
.pill-btn:active { background: rgba(0, 0, 0, 0.04); }

.select-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  height: 56px;
  background: #f0f1f2;
}
.close-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.select-count {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: #000;
}
.select-all {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.msg-flow {
  flex: 1;
  overflow-y: auto;
  padding: 0 22px;
  box-sizing: border-box;
}
.flow-pad { height: 18px; }
.flow-tail { height: 12px; }
.msg-block {
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}
.msg-block.theirs { align-items: flex-start; }
.msg-block.mine { align-items: flex-end; }
.bubble {
  max-width: 290px;
  padding: 10px 12px;
  border-radius: 16px;
  box-sizing: border-box;
  font-size: 16px;
  line-height: 19.7px;
  color: #000;
  word-break: break-word;
}
.bubble.theirs { background: #e7e8e9; }
.bubble.mine { background: #d9e0f1; }
.bubble.emoji {
  background: transparent;
  padding: 4px 2px;
}
.emoji-text { font-size: 40px; line-height: 1.1; }
.link { color: #3375f6; text-decoration: underline; text-underline-offset: 2px; }
.msg-meta {
  margin-top: 1px;
  font-size: 13px;
  line-height: 14px;
  color: #909191;
  padding: 0 2px;
}
.meta-status { color: #909191; }
.check {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16.1px;
  height: 16.1px;
  border-radius: 50%;
  border: 1.5px solid #c9c9cb;
  background: #fff;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.theirs .check { right: -18px; }
.mine .check { left: -18px; }
.check.on { border-color: #3375f6; background: #3375f6; }

.compose-bar {
  flex: none;
  height: 69.4px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10.8px;
  box-sizing: border-box;
}
.compose-pill {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  background: #fdfdfd;
  display: flex;
  align-items: center;
  padding: 0 4px 0 2px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.compose-pill.focused { box-shadow: 0 0 0 1.5px rgba(51, 117, 246, 0.45); }
.attach-btn,
.sim-btn {
  width: 40px;
  height: 40px;
  flex: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}
.compose-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  line-height: 20px;
  color: #000;
  padding: 0 6px;
}
.compose-input::placeholder { color: #9a9a9c; }
.send-slot {
  width: 44px;
  flex: none;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.voice-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.send-btn {
  position: absolute;
  right: 0;
  width: 54px;
  height: 54px;
  border: none;
  border-radius: 50%;
  background: #3375f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: send-in 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes send-in {
  from { transform: scale(0.7); opacity: 0.4; }
  to { transform: scale(1); opacity: 1; }
}
.counter {
  position: absolute;
  top: -14px;
  right: 2px;
  font-size: 11px;
  line-height: 12px;
  color: #3375f6;
  white-space: nowrap;
}
.select-bar {
  flex: none;
  height: calc(var(--safe-bottom) + 68px);
  padding-bottom: var(--safe-bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.select-del {
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: #1e1e20;
}
.select-del span { font-size: 12px; line-height: 14px; }
.detail-list { display: flex; flex-direction: column; gap: 6px; }
.detail-row { font-size: 15px; line-height: 22px; color: #1e1e20; }
.detail-label { color: #1e1e20; }
.detail-value { color: #1e1e20; }
</style>
