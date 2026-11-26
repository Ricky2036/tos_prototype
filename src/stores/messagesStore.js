import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { readJson, writeRaw } from '../utils/localPrefs.js'
import {
  CONVERSATIONS,
  ENTERPRISE_THREADS,
  SETTINGS_GROUPS,
  THREADS
} from '../components/apps/messages/msgData.js'

const KEY = 'tos.messages.v1'

/** 设置项默认值：只保留开关类（链接类的右侧值来自数据表） */
export function defaultSettings() {
  const out = {}
  for (const group of SETTINGS_GROUPS) {
    for (const row of group.rows) {
      if (row.type === 'switch') out[row.id] = row.def
    }
  }
  out.dbUpdatePref = 'wlan'
  out.xmessageOn = true
  return out
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function load() {
  return readJson(KEY, {})
}

/**
 * 「短信」应用状态（MSG-01）
 *
 * 会话列表的可见顺序 = 置顶优先 + 原始采集顺序；未读、置顶、删除、新发消息、
 * 设置开关全部持久化，退出应用再进保持（真机行为，见规格 D 节）。
 */
export const useMessagesStore = defineStore('messages', () => {
  const saved = load()

  const conversations = ref(clone(CONVERSATIONS))
  const threads = ref(clone(THREADS))
  const enterprise = ref(clone(ENTERPRISE_THREADS))
  const settings = ref({ ...defaultSettings(), ...(saved.settings || {}) })
  const drafts = ref({ ...(saved.drafts || {}) })

  /** 已删除的会话 id（真机删除后从列表消失，重启仍不在） */
  const deleted = ref(new Set(saved.deleted || []))
  /** 置顶 id（真机置顶后行内出现图钉标记，且排在最前） */
  const pinned = ref(new Set(saved.pinned || []))
  /** 已读覆盖：openConversation 后未读数归零 */
  const readState = ref({ ...(saved.readState || {}) })
  /** 新发消息（按会话 id 追加） */
  const extraMessages = ref({ ...(saved.extraMessages || {}) })

  function persist() {
    writeRaw(KEY, JSON.stringify({
      settings: settings.value,
      drafts: drafts.value,
      deleted: [...deleted.value],
      pinned: [...pinned.value],
      readState: readState.value,
      extraMessages: extraMessages.value
    }))
  }

  const list = computed(() => conversations.value
    .filter(c => !deleted.value.has(c.id))
    .map(c => ({
      ...c,
      unread: c.id in readState.value ? readState.value[c.id] : c.unread,
      pinned: pinned.value.has(c.id)
    }))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return 0
    }))

  const totalUnread = computed(() => list.value.reduce((sum, c) => {
    if (c.kind === 'enterprise') return sum + enterpriseUnread.value
    return sum + (c.unread || 0)
  }, 0))

  const enterpriseUnread = computed(() => enterprise.value.reduce((sum, t) => sum + (t.unread || 0), 0))

  function byId(id) {
    return list.value.find(c => c.id === id) || null
  }

  function enterpriseById(id) {
    return enterprise.value.find(t => t.id === id) || null
  }

  /** 打开会话：清未读（真机点进会话后角标消失） */
  function openConversation(id) {
    if (id === 'notice') {
      return
    }
    readState.value = { ...readState.value, [id]: 0 }
    persist()
  }

  function openEnterprise(id) {
    const target = enterprise.value.find(t => t.id === id)
    if (target) target.unread = 0
    persist()
  }

  function messagesOf(id) {
    return [...(threads.value[id] || []), ...(extraMessages.value[id] || [])]
  }

  function enterpriseMessagesOf(id) {
    return enterpriseById(id)?.messages || []
  }

  function sendMessage(id, text, stamp) {
    const body = String(text || '').trim()
    if (!body) return false
    const next = [...(extraMessages.value[id] || []), { from: 'me', text: body, time: stamp, status: 'sent' }]
    extraMessages.value = { ...extraMessages.value, [id]: next }
    persist()
    return true
  }

  function deleteConversations(ids) {
    const next = new Set(deleted.value)
    for (const id of ids) next.add(id)
    deleted.value = next
    persist()
  }

  function togglePin(id) {
    const next = new Set(pinned.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    pinned.value = next
    persist()
  }

  function isPinned(id) {
    return pinned.value.has(id)
  }

  function clearAllUnread() {
    const next = { ...readState.value }
    for (const c of conversations.value) next[c.id] = 0
    readState.value = next
    for (const t of enterprise.value) t.unread = 0
    persist()
  }

  function setSetting(id, value) {
    settings.value = { ...settings.value, [id]: value }
    persist()
  }

  function setDraft(id, text) {
    drafts.value = { ...drafts.value, [id]: text }
    persist()
  }

  function draftOf(id) {
    return drafts.value[id] || ''
  }

  function resetAll() {
    conversations.value = clone(CONVERSATIONS)
    threads.value = clone(THREADS)
    enterprise.value = clone(ENTERPRISE_THREADS)
    settings.value = defaultSettings()
    drafts.value = {}
    deleted.value = new Set()
    pinned.value = new Set()
    readState.value = {}
    extraMessages.value = {}
    persist()
  }

  return {
    conversations,
    threads,
    enterprise,
    settings,
    drafts,
    list,
    totalUnread,
    enterpriseUnread,
    byId,
    enterpriseById,
    openConversation,
    openEnterprise,
    messagesOf,
    enterpriseMessagesOf,
    sendMessage,
    deleteConversations,
    togglePin,
    isPinned,
    clearAllUnread,
    setSetting,
    setDraft,
    draftOf,
    resetAll
  }
})
