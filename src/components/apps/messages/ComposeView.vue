<script setup>
import { computed, ref } from 'vue'
import { useMessagesStore } from '../../../stores/messagesStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { msgText } from './msgData'
import MsgTopBar from './components/MsgTopBar.vue'

/**
 * 新建短信（真机 ConversationActivity 空会话态）
 * 收件人行：标签 15px + 已选联系人芯片（浅蓝底蓝字）+ 1px 下划线；
 * 右侧人形+图标打开联系人选择；底部输入栏与对话页同款。
 */
const props = defineProps({
  recipient: { type: Object, default: null } // { id, name, line }
})
const emit = defineEmits(['back', 'pick', 'send'])
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))

const draft = ref('')
const inputEl = ref(null)
const scratchId = '__compose__'

function focusInput() {
  inputEl.value?.focus()
}

const counter = computed(() => `159 / ${draft.value.length}`)

function onInput(e) {
  draft.value = e.target.value
  store.setDraft(scratchId, draft.value)
}

function sendNow() {
  const text = draft.value.trim()
  if (!text) return
  emit('send', text)
  draft.value = ''
  store.setDraft(scratchId, '')
}
</script>

<template>
  <div class="msg-compose-page" data-msg-page="compose">
    <MsgTopBar :title="t('newMessage')" @back="emit('back')">
      <template #right>
        <button class="pick-btn" type="button" data-msg-pick-contact @click="emit('pick')">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.6" stroke-linecap="round">
            <circle cx="10" cy="8.4" r="3.1" />
            <path d="M4.2 19.2c.4-3.1 2.9-5 5.8-5s5.4 1.9 5.8 5" />
            <path d="M17.6 8.4h4M19.6 6.4v4" />
          </svg>
        </button>
      </template>
    </MsgTopBar>

    <div class="recipient-row">
      <span class="recipient-label">{{ t('recipientLabel') }}</span>
      <span v-if="props.recipient" class="chip" data-msg-recipient>{{ props.recipient.name }}</span>
      <div class="recipient-line" />
    </div>

    <div class="compose-body" @click="focusInput" />

    <div class="compose-bar">
      <div class="compose-pill" :class="{ focused: draft.length > 0 }">
        <button class="attach-btn" type="button" data-msg-attach>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.7" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <input
          ref="inputEl"
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
            <path d="M6.6 3.6h7.6l4.4 4.4v12.2c0 .9-.7 1.6-1.6 1.6H6.6c-.9 0-1.6-.7-1.6-1.6V5.2c0-.9.7-1.6 1.6-1.6z" />
            <rect x="8.5" y="9.7" width="3.2" height="3.2" rx="0.7" />
            <rect x="12.3" y="9.7" width="3.2" height="3.2" rx="0.7" />
            <rect x="8.5" y="13.5" width="3.2" height="3.2" rx="0.7" />
            <rect x="12.3" y="13.5" width="3.2" height="3.2" rx="0.7" />
          </svg>
        </button>
      </div>
      <div class="send-slot">
        <span v-if="draft.length" class="counter">{{ counter }}</span>
        <button v-if="!draft.length" class="voice-btn" type="button" data-msg-voice>
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
  </div>
</template>

<style scoped>
.msg-compose-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pick-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}
.pick-btn:active { background: rgba(0, 0, 0, 0.04); }
.recipient-row {
  flex: none;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 49px;
  padding: 0 21.5px 0 22px;
  box-sizing: border-box;
}
.recipient-label {
  font-size: 15px;
  line-height: 20px;
  color: #3d3d3f;
}
.chip {
  height: 24px;
  padding: 0 9px;
  border-radius: 12px;
  background: #dfe6fa;
  color: #3375f6;
  font-size: 15px;
  line-height: 24px;
}
.recipient-line {
  position: absolute;
  left: 22px;
  right: 21.5px;
  bottom: 0;
  height: 1px;
  background: #c9c9cb;
}
.compose-body { flex: 1; }
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
  color: #000;
  padding: 0 6px;
}
.compose-input::placeholder { color: #9a9a9c; }
.send-slot {
  width: 44px;
  height: 44px;
  flex: none;
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
</style>
