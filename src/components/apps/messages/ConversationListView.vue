<script setup>
import { computed, ref } from 'vue'
import { useMessagesStore } from '../../../stores/messagesStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { useLargeTitle } from '../../../composables/useLargeTitle'
import LargeTitleHeader from '../../ui/LargeTitleHeader.vue'
import { msgText } from './msgData'
import MsgAvatar from './components/MsgAvatar.vue'
import MsgTrashIcon from './components/MsgTrashIcon.vue'
import MsgPopupMenu from './components/MsgPopupMenu.vue'

/**
 * 会话列表（真机 ConversationListActivity）
 *
 * 大标题走全仓通用件 `LargeTitleHeader` + `useLargeTitle`（与设置页同一份折叠契约：
 * 36→22px / distance 72 / sticky + 底幕），页面不自行计算折叠量。
 * 云同步提示卡放进滚动容器，随列表一起滚走（不悬浮）。
 *
 * 行：名称 17px（与设置列表同级）、摘要 13px、行高 62 / 74，
 * 分割线 1px rgba(60,60,67,.12)，左起 76（头像右侧）、右至 16。
 */
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))

// ⚠️ 必须解构出 ref（通用件铁律：把整对象传给 :progress 会恒为 0）
const { progress: titleProgress, onScroll: onTitleScroll } = useLargeTitle()

const emit = defineEmits(['open', 'open-enterprise', 'search', 'settings', 'compose', 'spam'])

const scroller = ref(null)
const menuOpen = ref(false)
const menu = ref({ x: 0, y: 0 })
const cloudVisible = ref(true)
const selectMode = ref(false)
const selected = ref(new Set())

const swipe = ref({ id: '', dx: 0, openId: '' })
const list = computed(() => store.list)

const menuItems = computed(() => [
  { id: 'clearUnread', label: t.value('clearUnread') },
  { id: 'spam', label: t.value('spamBlock') },
  { id: 'settings', label: t.value('settings') }
])

function openMenu(e) {
  const page = e.currentTarget.closest('.msg-app-root')?.getBoundingClientRect()
  if (!page) return
  const scale = page.width / 360 || 1
  const host = e.currentTarget.getBoundingClientRect()
  menu.value = { x: 180, y: (host.bottom - page.top) / scale + 6 }
  menuOpen.value = true
}

function onMenuSelect(id) {
  menuOpen.value = false
  if (id === 'settings') emit('settings')
  if (id === 'clearUnread') {
    store.clearAllUnread()
    selected.value = new Set()
  }
  if (id === 'spam') emit('spam')
}

function openRow(card) {
  if (longPressed) {
    longPressed = false
    return
  }
  if (swiped) {
    swiped = false
    return
  }
  if (selectMode.value) {
    toggleSelect(card.id)
    return
  }
  if (swipe.value.openId === card.id) {
    swipe.value = { id: '', dx: 0, openId: '' }
    return
  }
  if (card.kind === 'enterprise') emit('open-enterprise')
  else emit('open', card.id)
}

function toggleSelect(id) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
  if (!next.size) selectMode.value = false
}

function enterSelect(id) {
  selectMode.value = true
  selected.value = new Set([id])
}

function selectAll() {
  if (selected.value.size === list.value.length) {
    selected.value = new Set()
    selectMode.value = false
    return
  }
  selected.value = new Set(list.value.map(c => c.id))
}

function exitSelect() {
  selectMode.value = false
  selected.value = new Set()
}

function deleteSelected() {
  store.deleteConversations([...selected.value])
  exitSelect()
}

/* ---------- 左滑手势 + 长按多选 ---------- */
let startX = 0
let startY = 0
let dragging = false
const ACTIONS_W = 142
let pressTimer = null
let longPressed = false
let swiped = false

function clearPress() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function onRowDown(e, card) {
  if (selectMode.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  startX = e.clientX
  startY = e.clientY
  dragging = false
  longPressed = false
  swiped = false
  swipe.value = { id: card.id, dx: swipe.value.openId === card.id ? -ACTIONS_W : 0, openId: swipe.value.openId }
  clearPress()
  pressTimer = setTimeout(() => {
    longPressed = true
    dragging = false
    enterSelect(card.id)
  }, 520)
}

function onRowMove(e, card) {
  if (swipe.value.id !== card.id || selectMode.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) clearPress()
  if (!dragging && Math.abs(dx) < 8) return
  if (!dragging && Math.abs(dy) > Math.abs(dx)) return
  dragging = true
  swiped = true
  const base = swipe.value.openId === card.id ? -ACTIONS_W : 0
  swipe.value = { id: card.id, dx: Math.min(0, Math.max(-ACTIONS_W, base + dx)), openId: swipe.value.openId }
}

function onRowUp(e, card) {
  clearPress()
  try { e.currentTarget?.releasePointerCapture?.(e.pointerId) } catch { /* 忽略不支持的环境 */ }
  if (swipe.value.id !== card.id) return
  const open = swipe.value.dx < -ACTIONS_W / 2
  if (dragging) {
    swipe.value = { id: '', dx: 0, openId: open ? card.id : '' }
  }
  dragging = false
}

function rowStyle(card) {
  if (swipe.value.id === card.id) return { transform: `translateX(${swipe.value.dx}px)` }
  if (swipe.value.openId === card.id) return { transform: `translateX(${-ACTIONS_W}px)` }
  return {}
}

function isOpen(card) {
  return swipe.value.id === card.id || swipe.value.openId === card.id
}

function pinRow(card) {
  store.togglePin(card.id)
  swipe.value = { id: '', dx: 0, openId: '' }
}

function deleteRow(card) {
  store.deleteConversations([card.id])
  swipe.value = { id: '', dx: 0, openId: '' }
}

function dismissCloud() {
  cloudVisible.value = false
}
</script>

<template>
  <div class="msg-list-page" data-msg-page="list">
    <div ref="scroller" class="list-scroll scrollable" @scroll.passive="onTitleScroll">
      <!-- 大标题：通用件（sticky + 折叠 + 底幕），与设置页同一份契约 -->
      <LargeTitleHeader
        :title="selectMode ? '' : t('appTitle')"
        :progress="titleProgress"
        scrim="240,241,242"
      >
        <template v-if="!selectMode" #accessory>
          <div class="action-pill">
            <button class="pill-btn" type="button" data-msg-search @click="emit('search')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="7.2" />
                <path d="M16.4 16.4L21 21" />
              </svg>
            </button>
            <button class="pill-btn" type="button" data-msg-overflow @click="openMenu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E1E20">
                <circle cx="12" cy="5" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="12" cy="19" r="1.7" />
              </svg>
            </button>
          </div>
        </template>
      </LargeTitleHeader>

      <!-- 多选态顶部（覆盖在大标题位置上） -->
      <div v-if="selectMode" class="select-head">
        <button class="close-btn" type="button" data-msg-exit-select @click="exitSelect">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="2.2" stroke-linecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
        <span class="select-count">{{ t('selected', { n: selected.size }) }}</span>
        <button class="select-all" type="button" data-msg-select-all @click="selectAll">
          <svg v-if="selected.size !== list.length" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C3C3C5" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="5" />
          </svg>
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="#3375F6" />
            <path d="M7.4 12.2l3.1 3.1 6-6.6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- 云同步提示卡：跟着列表滚，不悬浮 -->
      <transition name="cloud">
        <div v-if="cloudVisible" class="cloud-card" data-msg-cloud>
          <div class="cloud-main">
            <div class="cloud-text">{{ t('cloudTip') }}</div>
            <button class="cloud-action" type="button" @click.stop>{{ t('cloudAction') }}</button>
          </div>
          <button class="cloud-close" type="button" aria-label="close" data-msg-cloud-close @click.stop="dismissCloud">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9B9BB" stroke-width="2" stroke-linecap="round">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
      </transition>

      <div class="rows">
        <div
          v-for="card in list"
          :key="card.id"
          class="row-wrap"
          :class="{ opened: isOpen(card) }"
          :data-msg-row="card.id"
        >
          <div class="row-actions">
            <button class="row-action pin" type="button" :data-msg-pin="card.id" @click.stop="pinRow(card)">
              <!-- 真机：向上箭头 + 顶部一条横线（arrow-up-to-line） -->
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5A5A5C" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6.6 5.2h10.8" />
                <path d="M12 20.2V9.4" />
                <path d="M7.6 13.6L12 9.2l4.4 4.4" />
              </svg>
            </button>
            <button class="row-action del" type="button" :data-msg-delete-row="card.id" @click.stop="deleteRow(card)">
              <!-- 与通知中心底部「清空全部」圆钮同一份垃圾桶 -->
              <MsgTrashIcon :size="21" color="#FFFFFF" />
            </button>
          </div>
          <div
            class="row"
            :class="{ 'has-snippet': !!card.snippet, enterprise: card.kind === 'enterprise', selected: selected.has(card.id) }"
            :style="rowStyle(card)"
            @pointerdown="onRowDown($event, card)"
            @pointermove="onRowMove($event, card)"
            @pointerup="onRowUp($event, card)"
            @pointercancel="onRowUp($event, card)"
            @click="openRow(card)"
            @contextmenu.prevent="!selectMode && enterSelect(card.id)"
          >
            <MsgAvatar
              :name="card.name"
              :icon="card.avatarIcon || ''"
              :size="40"
              :unread="card.unread"
            />
            <div class="row-main">
              <div class="row-top">
                <span class="row-name">{{ card.name }}</span>
                <span class="row-time">{{ card.time }}</span>
                <!-- 真机：置顶标记在日期右侧 -->
                <span v-if="card.pinned" class="pin-mark" data-msg-pin-mark>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9.2 3.4h5.6l-.6 5.2 3 2.3v1.3h-5v8.4h-1.4v-8.4h-5V10.9l3-2.3z" fill="#F5A623" />
                  </svg>
                </span>
              </div>
              <div v-if="card.snippet" class="row-snippet">{{ card.snippet }}</div>
            </div>
            <svg v-if="card.kind === 'enterprise' && !selectMode" class="row-chevron" width="9" height="16" viewBox="0 0 9 16" fill="none">
              <path d="M1.4 1.6L7.4 8l-6 6.4" stroke="#C3C3C5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span v-if="selectMode" class="check" :class="{ on: selected.has(card.id) }">
              <svg v-if="selected.has(card.id)" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5.5 12.4l4.2 4.2 8.8-9.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <div class="list-tail" />
    </div>

    <!-- 新建会话 -->
    <button v-if="!selectMode" class="fab" type="button" data-msg-fab @click="emit('compose')">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="2" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <!-- 多选删除栏 -->
    <div v-if="selectMode" class="select-bar">
      <button class="select-del" type="button" data-msg-delete-selected @click="deleteSelected">
        <MsgTrashIcon :size="22" color="#1E1E20" />
        <span>{{ t('delete') }}</span>
      </button>
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
  </div>
</template>

<style scoped>
.msg-list-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  overflow: hidden;
}
.list-scroll {
  height: 100%;
  overflow-y: auto;
  position: relative;
}
.action-pill {
  width: 100px;
  height: 44px;
  border-radius: 22px;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 真机胶囊内：左 3.9 · 钮 44.1 · 间距 4.5 · 钮 44.1 · 右 3.6 */
  padding: 0 3.6px 0 3.9px;
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
  -webkit-tap-highlight-color: transparent;
  border-radius: 50%;
}
.pill-btn:active { background: rgba(0, 0, 0, 0.04); }

.select-head {
  position: absolute;
  left: 16px;
  right: 16px;
  top: var(--safe-top);
  height: 105px;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 14;
  background: #f0f1f2;
}
.close-btn {
  width: 44px;
  height: 44px;
  flex: none;
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
  font-size: 26px;
  font-weight: 700;
  color: #000;
  letter-spacing: 0.2px;
}
.select-all {
  width: 44px;
  height: 44px;
  flex: none;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cloud-card {
  display: flex;
  align-items: center;
  height: 64px;
  margin: 4px 22px 10px;
  border-radius: 15px;
  background: #e8e8e8;
  padding: 0 8px 0 16px;
  box-sizing: border-box;
}
.cloud-main { flex: 1; min-width: 0; }
.cloud-text {
  font-size: 14px;
  line-height: 18px;
  color: #3d3d3f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cloud-action {
  margin-top: 2px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: #3375f6;
  cursor: pointer;
}
.cloud-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
}
.cloud-enter-active, .cloud-leave-active { transition: opacity 0.18s ease, transform 0.2s ease; }
.cloud-leave-to { opacity: 0; transform: translateY(-6px); }

.row-wrap {
  position: relative;
  overflow: hidden;
  background: #f0f1f2;
}
.row-actions {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  z-index: 1;
  pointer-events: none;
}
.row-wrap.opened .row-actions { pointer-events: auto; }
.row-action {
  width: 71px;
  height: 100%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.row-action.pin { background: #fdfdfd; }
.row-action.del { background: #e7433b; }
.row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8.5px 21.5px 8.5px 22px;
  min-height: 62px;
  box-sizing: border-box;
  background: #f0f1f2;
  transition: transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
  touch-action: pan-y;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
/* 分割线：头像右侧起、右内边距止（与设置列表一致） */
.row::after {
  content: '';
  position: absolute;
  left: 76px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background: rgba(60, 60, 67, 0.055);
}
.row-wrap:last-child .row::after { display: none; }
.row.enterprise { min-height: 59.9px; }
.row.selected .row-main { opacity: 0.55; }
.row-main { flex: 1; min-width: 0; }
.row-top { display: flex; align-items: center; gap: 5px; }
.row-name {
  flex: 1;
  min-width: 0;
  font-size: 17px;
  line-height: 22px;
  font-weight: 500;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pin-mark { display: inline-flex; align-self: center; margin-left: 1px; }
.row-time {
  flex: none;
  font-size: 13px;
  line-height: 16px;
  color: #909191;
}
.row-snippet {
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
.row-chevron { flex: none; margin-right: 2px; }
.check {
  flex: none;
  width: 16.1px;
  height: 16.1px;
  border-radius: 50%;
  border: 1.5px solid #c9c9cb;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.check.on { border-color: #3375f6; background: #3375f6; }
.list-tail { height: 96px; }

.fab {
  position: absolute;
  z-index: 5;
  right: 24px;
  bottom: 42px;
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), 0 10px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.32, 0.72, 0, 1);
}
.fab:active { transform: scale(0.92); }

.select-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
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
</style>
