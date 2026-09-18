import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationsStore } from '../src/stores/notificationsStore.js'

function store() {
  setActivePinia(createPinia())
  return useNotificationsStore()
}

test('new notifications preserve content and default or explicit brand icons', () => {
  const notifications = store()
  notifications.push({ appId: 'wechat', title: 'Alice', body: 'Hello' })
  assert.equal(notifications.list[0].title, 'Alice')
  assert.equal(notifications.list[0].body, 'Hello')
  assert.equal(notifications.list[0].iconType, 'wechat')
  notifications.push({ appId: 'custom', iconType: 'system', title: '', body: '' })
  assert.equal(notifications.list[0].iconType, 'system')
  assert.equal(notifications.list[0].body, '')
  assert.equal(new Set(notifications.list.map(n => n.id)).size, notifications.list.length)
})

test('removal and clear keep unread counts and app badges consistent', () => {
  const notifications = store()
  notifications.clearAll()
  notifications.push({ appId: 'wechat' })
  notifications.push({ appId: 'wechat' })
  assert.equal(notifications.unreadCount, 2)
  assert.equal(notifications.countByApp.wechat, 2)
  notifications.remove(notifications.list[0].id)
  notifications.remove('missing')
  assert.equal(notifications.countByApp.wechat, 1)
  notifications.clearAll()
  assert.equal(notifications.unreadCount, 0)
  assert.deepEqual(notifications.countByApp, {})
})

test('persistent notifications remain after clearDismissible, while clearAll removes everything', () => {
  const notifications = store()
  notifications.clearAll()
  notifications.push({ appId: 'wechat', title: 'WeChat 1', persistent: false })
  notifications.push({ appId: 'tiktok', title: 'TikTok 1', persistent: false })
  notifications.push({ appId: 'system', title: '日志抓取中...', persistent: true })

  assert.equal(notifications.unreadCount, 3)
  assert.equal(notifications.hasClearable, true)
  assert.equal(notifications.clearableCount, 2)

  // 一键清理：仅清除普通可移除通知
  notifications.clearDismissible()

  assert.equal(notifications.unreadCount, 1)
  assert.equal(notifications.list[0].title, '日志抓取中...')
  assert.equal(notifications.list[0].persistent, true)
  assert.equal(notifications.hasClearable, false)
  assert.equal(notifications.clearableCount, 0)

  // clearAll: 彻底清空全部
  notifications.clearAll()
  assert.equal(notifications.unreadCount, 0)
  assert.equal(notifications.list.length, 0)
})

