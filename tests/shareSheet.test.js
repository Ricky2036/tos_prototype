import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_ALBUM_PHOTOS,
  SHARE_APPS,
  useShareStore
} from '../src/stores/shareStore.js'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('ShareSheet component matches design specification from latest screenshot & requirement', () => {
  const shareSheetPath = path.resolve(__dirname, '../src/components/system/ShareSheet.vue')
  const content = fs.readFileSync(shareSheetPath, 'utf8')

  // 1. 顶部把手与头部规范
  assert.ok(content.includes('class="share-drag-handle"'), 'Must have drag handle bar')
  assert.ok(content.includes('store.titleText'), 'Must have dynamic file count title')
  assert.ok(content.includes('share-privacy-link'), 'Must have privacy protect entry link')
  assert.ok(content.includes('隐私保护已开启'), 'Must have privacy protect enabled text')

  // 2. 相册图片缩略图横滑区
  assert.ok(content.includes('class="share-carousel"'), 'Must have horizontal thumbnail carousel')
  assert.ok(content.includes('class="share-thumb-card"'), 'Must have thumbnail cards')
  assert.ok(content.includes('share-video-badge'), 'Must support video play overlay badge')
  assert.ok(content.includes('share-select-badge'), 'Must support photo selection checkmark badge')

  // 3. 极速互传横幅
  assert.ok(content.includes('极速互传'), 'Must have 极速互传 title')
  assert.ok(
    content.includes('即刻碰一碰 iPhone、Infinix 等可免流量互传。'),
    'Must have accurate 极速互传 subtitle from screenshot'
  )
  assert.ok(content.includes('share-transfer-graphic'), 'Must have dual-phone illustration graphic')

  // 4. 分享应用图标区（桌面真实应用）
  assert.ok(content.includes('支持分享的应用'), 'Must have 支持分享的应用 header')
  assert.ok(content.includes('点击图标或下拉可选择渠道'), 'Must have channel selection tip')
  assert.ok(content.includes('class="share-apps-scroll"'), 'Must have scrollable app icons list')
  assert.ok(content.includes('class="share-channel-chip"'), 'Must have channel dropdown chips')

  // 5. 渠道浮动菜单
  assert.ok(content.includes('class="share-popover"'), 'Must have floating channel popover menu')
  assert.ok(content.includes('share-popover-item'), 'Must have channel option items')
})

test('PhotosApp gallery component matches photo browsing and share flow specification', () => {
  const photosAppPath = path.resolve(__dirname, '../src/components/apps/photos/PhotosApp.vue')
  const content = fs.readFileSync(photosAppPath, 'utf8')

  // 1. 顶部大标题折叠与照片网格
  assert.ok(content.includes('LargeTitleHeader'), 'Must mount LargeTitleHeader component')
  assert.ok(content.includes('data-photos-grid'), 'Must have photo grid')
  assert.ok(content.includes('store.openViewer'), 'Must open fullscreen viewer when photo is clicked')

  // 2. 全屏照片查看器与分享入口
  assert.ok(content.includes('data-photos-viewer'), 'Must have full screen photo viewer')
  assert.ok(content.includes('data-photos-viewer-bar'), 'Must have bottom viewer action bar')
  assert.ok(content.includes("key === 'share'"), 'Must handle share action in viewer')
  assert.ok(content.includes('shareStore.openShare'), 'Must trigger share sheet on share action')
})

test('shareStore manages photos selection, channels, and share actions correctly', () => {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  setActivePinia(pinia)

  const store = useShareStore()

  // 1. 默认状态（2 项选中，与参考截图完全一致）
  assert.strictEqual(store.isOpen, false)
  assert.strictEqual(store.selectedCount, 2)
  assert.strictEqual(store.titleText, '正在分享 2 个文件')
  assert.strictEqual(store.privacyProtected, true)

  // 2. 打开与关闭
  store.openShare()
  assert.strictEqual(store.isOpen, true)
  store.closeShare()
  assert.strictEqual(store.isOpen, false)

  // 3. 勾选切换与动态标题
  const photo1 = store.photos[0]
  store.togglePhotoSelection(photo1.id) // 取消第 1 张，只剩 1 张
  assert.strictEqual(store.selectedCount, 1)
  assert.strictEqual(store.titleText, '正在分享 1 个文件')

  const photo2 = store.photos[1]
  store.togglePhotoSelection(photo2.id) // 取消第 2 张，剩 0 张
  assert.strictEqual(store.selectedCount, 0)
  assert.strictEqual(store.titleText, '未选择文件')

  // 4. 隐私保护切换
  store.togglePrivacy()
  assert.strictEqual(store.privacyProtected, false)
  store.togglePrivacy()
  assert.strictEqual(store.privacyProtected, true)

  // 5. 渠道切换
  assert.strictEqual(store.appChannels.wechat, '发送给朋友')
  store.selectAppChannel('wechat', '分享到朋友圈')
  assert.strictEqual(store.appChannels.wechat, '分享到朋友圈')

  assert.strictEqual(store.appChannels.capcut, '在 CapCut 中进行编辑')
  store.selectAppChannel('capcut', '上传到 CapCut 云空间')
  assert.strictEqual(store.appChannels.capcut, '上传到 CapCut 云空间')

  // 6. 极速互传触发
  store.triggerFastTransfer()
  assert.strictEqual(store.toast.visible, true)
  assert.ok(store.toast.message.includes('极速互传'))
})

test('Desktop share applications list includes core desktop apps and required channels', () => {
  const wechat = SHARE_APPS.find((a) => a.id === 'wechat')
  assert.ok(wechat, 'WeChat must be present')
  assert.strictEqual(wechat.channels.length, 2)

  const capcut = SHARE_APPS.find((a) => a.id === 'capcut')
  assert.ok(capcut, 'CapCut must be present')
  assert.strictEqual(capcut.channels.length, 3)

  const messages = SHARE_APPS.find((a) => a.id === 'messages')
  assert.ok(messages, 'Messages must be present')

  const facebook = SHARE_APPS.find((a) => a.id === 'facebook')
  assert.ok(facebook, 'Facebook must be present')
  assert.ok(facebook.channels.some((c) => c.label === '你的小组'))
  assert.ok(facebook.channels.some((c) => c.label === '动态'))

  const whatsapp = SHARE_APPS.find((a) => a.id === 'whatsapp')
  assert.ok(whatsapp, 'WhatsApp must be present')

  const quickshare = SHARE_APPS.find((a) => a.id === 'quickshare')
  assert.ok(quickshare, 'Quick Share must be present')

  const bluetooth = SHARE_APPS.find((a) => a.id === 'bluetooth')
  assert.ok(bluetooth, 'Bluetooth must be present')
})

test('ShareSheet relies on global system navigation bar instead of local home indicator', () => {
  const shareSheetPath = path.resolve(__dirname, '../src/components/system/ShareSheet.vue')
  const content = fs.readFileSync(shareSheetPath, 'utf8')

  assert.ok(!content.includes('share-home-bar'), 'Must not define or render local share-home-bar')
  assert.ok(content.includes('z-index: 95'), 'ShareSheet layer root must have z-index 95 (below global navigation bar 96)')
  assert.ok(content.includes('useBackHandler'), 'ShareSheet must register back handler for dismissing')

  const screenViewPath = path.resolve(__dirname, '../src/components/phone/ScreenView.vue')
  const screenContent = fs.readFileSync(screenViewPath, 'utf8')
  assert.ok(screenContent.includes('navDark'), 'ScreenView must compute navDark for adaptive navigation bar on white share sheet')
  assert.ok(screenContent.includes(':dark="navDark"'), 'HomeIndicator and ThreeButtonNav must receive navDark')
})

test('Lucide heart icon is a clean heart without ECG heart-rate line', () => {
  const lucidePath = path.resolve(__dirname, '../src/assets/icons/lucide.js')
  const content = fs.readFileSync(lucidePath, 'utf8')

  assert.ok(content.includes("import heart from 'lucide-static/icons/heart.svg?raw'"), 'heart must be imported from standard lucide-static icons')
  assert.ok(content.includes('health,'), 'health icon must be exported separately for control center')
})
