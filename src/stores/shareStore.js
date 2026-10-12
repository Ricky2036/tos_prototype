import { defineStore } from 'pinia'

/**
 * 相册内置真实照片资源清单
 */
export const DEFAULT_ALBUM_PHOTOS = [
  {
    id: 'photo-1',
    title: '海岸落日',
    url: '/photos/photo-01-beach.jpg',
    isVideo: false,
    selected: true,
    time: '2026年10月12日 下午06:06'
  },
  {
    id: 'photo-2',
    title: '街角咖啡',
    url: '/photos/photo-02-cafe.jpg',
    isVideo: false,
    selected: true,
    time: '2026年10月12日 下午04:30'
  },
  {
    id: 'photo-3',
    title: '林间小径',
    url: '/photos/photo-03-forest.jpg',
    isVideo: true,
    duration: '00:15',
    selected: false,
    time: '2026年10月11日 上午10:18'
  },
  {
    id: 'photo-4',
    title: '城市天际线',
    url: '/photos/photo-04-city.jpg',
    isVideo: false,
    selected: false,
    time: '2026年10月10日 晚上08:22'
  },
  {
    id: 'photo-5',
    title: '金毛萌宠',
    url: '/photos/photo-05-dog.jpg',
    isVideo: false,
    selected: false,
    time: '2026年10月09日 下午03:12'
  },
  {
    id: 'photo-6',
    title: '生日聚会',
    url: '/photos/photo-06-birthday.jpg',
    isVideo: false,
    selected: false,
    time: '2026年10月08日 晚上07:45'
  }
]

/**
 * 桌面已安装分享目标应用清单
 */
export const SHARE_APPS = [
  {
    id: 'quickshare',
    name: '快速分享',
    icon: '/icons/drawer/transsioner.png',
    customIcon: 'quickshare'
  },
  {
    id: 'wechat',
    name: '微信',
    icon: '/icons/wechat.png',
    defaultChannel: '发送给朋友',
    channels: [
      { id: 'friend', label: '发送给朋友' },
      { id: 'moments', label: '分享到朋友圈' }
    ]
  },
  {
    id: 'capcut',
    name: '剪映',
    customIcon: 'capcut',
    defaultChannel: '在 CapCut 中进行编辑',
    channels: [
      { id: 'edit', label: '在 CapCut 中进行编辑', icon: 'scissors' },
      { id: 'cloud', label: '上传到 CapCut 云空间', icon: 'cloud' },
      { id: 'beauty', label: '用 CapCut 进行人像美化', icon: 'magic' }
    ]
  },
  {
    id: 'messages',
    name: '信息',
    icon: '/icons/messages.png'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '/icons/facebook.png',
    defaultChannel: '你的小组',
    channels: [
      { id: 'group', label: '你的小组' },
      { id: 'feed', label: '动态' },
      { id: 'story', label: '快拍' }
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '/icons/whatsapp.png',
    defaultChannel: '发送给联系人',
    channels: [
      { id: 'chat', label: '发送给联系人' },
      { id: 'status', label: '更新到状态' }
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '/icons/tiktok.png'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '/icons/instagram.png'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '/icons/gmail.png'
  },
  {
    id: 'notes',
    name: '记事本',
    icon: '/icons/notes.png'
  },
  {
    id: 'bluetooth',
    name: '蓝牙',
    customIcon: 'bluetooth'
  },
  {
    id: 'more',
    name: '更多',
    customIcon: 'more'
  }
]

export const useShareStore = defineStore('share', {
  state: () => ({
    isOpen: false,
    privacyProtected: true,
    privacyModalOpen: false,
    activeMenuAppId: null,
    menuPosition: { left: 0, bottom: 0 },
    photos: JSON.parse(JSON.stringify(DEFAULT_ALBUM_PHOTOS)),
    appChannels: {
      wechat: '发送给朋友',
      capcut: '在 CapCut 中进行编辑',
      facebook: '你的小组',
      whatsapp: '发送给联系人'
    },
    toast: {
      visible: false,
      message: '',
      type: 'success'
    },
    toastTimer: null
  }),

  getters: {
    selectedPhotos: (state) => state.photos.filter((p) => p.selected),
    selectedCount: (state) => state.photos.filter((p) => p.selected).length,
    titleText() {
      return this.selectedCount === 0
        ? '未选择文件'
        : `正在分享 ${this.selectedCount} 个文件`
    }
  },

  actions: {
    openShare(options = {}) {
      if (options.photoIds && Array.isArray(options.photoIds)) {
        this.photos.forEach((p) => {
          p.selected = options.photoIds.includes(p.id)
        })
      } else if (this.selectedCount === 0) {
        // 默认选中前两项，与截图参考保持一致
        this.photos[0].selected = true
        this.photos[1].selected = true
      }
      this.activeMenuAppId = null
      this.isOpen = true
    },

    closeShare() {
      this.isOpen = false
      this.activeMenuAppId = null
      this.privacyModalOpen = false
    },

    togglePhotoSelection(id) {
      const photo = this.photos.find((p) => p.id === id)
      if (photo) {
        photo.selected = !photo.selected
      }
    },

    togglePrivacy() {
      this.privacyProtected = !this.privacyProtected
      this.showToast(
        this.privacyProtected
          ? '已开启隐私保护：已抹除位置与拍摄设备信息'
          : '已关闭隐私保护',
        'shield'
      )
    },

    openPrivacyModal() {
      this.privacyModalOpen = true
    },

    closePrivacyModal() {
      this.privacyModalOpen = false
    },

    toggleAppMenu(appId, coords = null) {
      if (this.activeMenuAppId === appId) {
        this.activeMenuAppId = null
      } else {
        this.activeMenuAppId = appId
        if (coords) {
          this.menuPosition = coords
        }
      }
    },

    closeAllMenus() {
      this.activeMenuAppId = null
    },

    selectAppChannel(appId, channelLabel) {
      this.appChannels[appId] = channelLabel
      this.activeMenuAppId = null
      this.shareToApp(appId, channelLabel)
    },

    shareToApp(appId, channel = null) {
      const app = SHARE_APPS.find((a) => a.id === appId)
      const appName = app ? app.name : appId
      const targetDesc = channel ? `${appName} · ${channel}` : appName
      this.activeMenuAppId = null
      this.showToast(`已成功发起分享至 [${targetDesc}]`, 'send')
    },

    triggerFastTransfer() {
      this.showToast('已开启极速互传，靠近设备即可免流量传输', 'transfer')
    },

    showToast(message, type = 'success') {
      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
      }
      this.toast.message = message
      this.toast.type = type
      this.toast.visible = true

      this.toastTimer = setTimeout(() => {
        this.toast.visible = false
      }, 2200)
    }
  }
})
