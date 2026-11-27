<script setup>
import { computed, ref } from 'vue'
import { useMessagesStore } from '../../../stores/messagesStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { msgText } from './msgData'
import MsgTopBar from './components/MsgTopBar.vue'
import MsgPopupMenu from './components/MsgPopupMenu.vue'
import MsgAvatar from './components/MsgAvatar.vue'

/**
 * 通知信息列表（真机 EnterpriseConversationListActivity）
 * 与主列表同一套行结构，差异：无云提示卡与大标题（顶栏直接 56），
 * 名称右侧有 16×16 绿色认证盾牌，无右侧箭头。
 */
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back', 'open'])

const menuOpen = ref(false)
const menu = ref({ x: 0, y: 0 })

function openMenu(e) {
  const host = e.currentTarget.getBoundingClientRect()
  const page = e.currentTarget.closest('.msg-app-root')?.getBoundingClientRect()
  if (!page) return
  const scale = page.width / 360 || 1
  menu.value = { x: 180, y: (host.bottom - page.top) / scale + 6 }
  menuOpen.value = true
}

const items = computed(() => [
  { id: 'clearUnread', label: t.value('clearUnread') },
  { id: 'spam', label: t.value('spamBlock') }
])

function onSelect() {
  menuOpen.value = false
}
</script>

<template>
  <div class="msg-ent-page" data-msg-page="enterprise-list">
    <MsgTopBar :title="t('notificationInfo')" @back="emit('back')">
      <template #right>
        <button class="more-btn" type="button" data-msg-ent-overflow @click="openMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E1E20">
            <circle cx="12" cy="5" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="12" cy="19" r="1.7" />
          </svg>
        </button>
      </template>
    </MsgTopBar>

    <div class="ent-scroll scrollable">
      <div
        v-for="item in store.enterprise"
        :key="item.id"
        class="ent-row"
        :data-msg-ent-row="item.id"
        @click="emit('open', item.id)"
      >
        <MsgAvatar :name="item.number" icon="person" :size="40" :unread="item.unread" />
        <div class="ent-main">
          <div class="ent-top">
            <span class="ent-name">{{ item.number }}</span>
            <span v-if="item.verified" class="verified" data-msg-verified>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M12 1.8l2.5 1.9 3.1-.3 1 3 2.6 1.7-1 3 1 3-2.6 1.7-1 3-3.1-.3L12 22.2l-2.5-1.9-3.1.3-1-3-2.6-1.7 1-3-1-3 2.6-1.7 1-3 3.1.3z" fill="#2FBE6E" />
                <path d="M8.2 12.3l2.5 2.5 5-5.4" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="ent-time">{{ item.time }}</span>
          </div>
          <div class="ent-snippet">{{ item.snippet }}</div>
        </div>
      </div>
    </div>

    <MsgPopupMenu
      v-if="menuOpen"
      :items="items"
      :x="menu.x"
      :y="menu.y"
      :width="164"
      @select="onSelect"
      @close="menuOpen = false"
    />
  </div>
</template>

<style scoped>
.msg-ent-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.more-btn {
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
.ent-scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: 10.7px;
}
.ent-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8.5px 21.5px 8.5px 22px;
  min-height: 62px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ent-row:active { background: #e9eaec; }
.ent-main { flex: 1; min-width: 0; }
.ent-top { display: flex; align-items: center; gap: 6px; }
.ent-name {
  font-size: 17px;
  line-height: 22px;
  font-weight: 500;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.verified { display: inline-flex; flex: none; }
.ent-time {
  margin-left: auto;
  flex: none;
  font-size: 13px;
  line-height: 16px;
  color: #909191;
}
.ent-snippet {
  margin-top: 1px;
  font-size: 13px;
  line-height: 17px;
  color: #545454;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}
</style>
