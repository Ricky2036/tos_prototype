/**
 * 相册（Photos）词条。三语对象树，键集必须完全一致
 * （tests/photosStore.test.js 有一条「跨语言键集 + 占位符集合一致」守卫）。
 *
 * ⚠️ 本仓 i18n 没有插值机制 —— 组件统一走 `fill(ph('a.b'), { n })` 手工替换。
 *    凡带 `{x}` 的模板，三语都必须含同一个占位符（zh 写死数值是最经典的翻车点）。
 */
export const PHOTOS = {
  zh: {
    title: '照片',
    today: '今天',
    yesterday: '昨天',
    search: '搜索',
    empty: '没有照片',
    count: '{n} 张照片',
    tab: {
      photos: '照片',
      albums: '相册',
      discover: '发现',
      aria: '相册导航'
    },
    head: {
      list: '列表视图',
      select: '选择',
      settings: '相册设置'
    },
    viewer: {
      back: '返回',
      scan: '识别画面',
      share: '分享',
      favorite: '收藏',
      edit: '编辑',
      delete: '删除',
      more: '更多',
      info: '照片信息'
    },
    sheet: {
      deleteTitle: '删除这张照片？',
      deleteNote: '此操作不可撤销（原型演示）',
      cancel: '取消',
      confirm: '删除',
      moreTitle: '更多操作'
    },
    more: {
      save: '存储到文件',
      copy: '拷贝',
      hide: '隐藏',
      info: '照片信息'
    },
    notice: {
      favorited: '已加入收藏',
      unfavorited: '已取消收藏',
      deleted: '照片已删除',
      shared: '分享面板已打开',
      edit: '编辑功能开发中',
      scan: '识别画面开发中',
      search: '搜索开发中',
      listView: '列表视图开发中',
      selectMode: '已进入多选',
      settings: '相册设置开发中',
      albums: '相册分组开发中',
      discover: '发现页开发中',
      saved: '已存储到文件',
      copied: '已拷贝',
      hidden: '已隐藏',
      lastPhoto: '已经是第一张 / 最后一张了'
    }
  },

  en: {
    title: 'Photos',
    today: 'Today',
    yesterday: 'Yesterday',
    search: 'Search',
    empty: 'No photos',
    count: '{n} photos',
    tab: {
      photos: 'Photos',
      albums: 'Albums',
      discover: 'Discover',
      aria: 'Photos navigation'
    },
    head: {
      list: 'List view',
      select: 'Select',
      settings: 'Album settings'
    },
    viewer: {
      back: 'Back',
      scan: 'Detect subject',
      share: 'Share',
      favorite: 'Favorite',
      edit: 'Edit',
      delete: 'Delete',
      more: 'More',
      info: 'Photo info'
    },
    sheet: {
      deleteTitle: 'Delete this photo?',
      deleteNote: "This can't be undone (prototype)",
      cancel: 'Cancel',
      confirm: 'Delete',
      moreTitle: 'More options'
    },
    more: {
      save: 'Save to Files',
      copy: 'Copy',
      hide: 'Hide',
      info: 'Photo info'
    },
    notice: {
      favorited: 'Added to favorites',
      unfavorited: 'Removed from favorites',
      deleted: 'Photo deleted',
      shared: 'Share sheet opened',
      edit: 'Editing is coming soon',
      scan: 'Detect subject coming soon',
      search: 'Search coming soon',
      listView: 'List view coming soon',
      selectMode: 'Multi-select on',
      settings: 'Album settings coming soon',
      albums: 'Albums coming soon',
      discover: 'Discover coming soon',
      saved: 'Saved to Files',
      copied: 'Copied',
      hidden: 'Hidden',
      lastPhoto: 'Already at the first / last photo'
    }
  },

  bn: {
    title: 'ছবি',
    today: 'আজ',
    yesterday: 'গতকাল',
    search: 'খুঁজুন',
    empty: 'কোনো ছবি নেই',
    count: '{n} টি ছবি',
    tab: {
      photos: 'ছবি',
      albums: 'অ্যালবাম',
      discover: 'আবিষ্কার',
      aria: 'ছবি নেভিগেশন'
    },
    head: {
      list: 'তালিকা ভিউ',
      select: 'নির্বাচন',
      settings: 'অ্যালবাম সেটিংস'
    },
    viewer: {
      back: 'ফিরুন',
      scan: 'দৃশ্য শনাক্ত করুন',
      share: 'শেয়ার',
      favorite: 'পছন্দ',
      edit: 'সম্পাদনা',
      delete: 'মুছুন',
      more: 'আরও',
      info: 'ছবির তথ্য'
    },
    sheet: {
      deleteTitle: 'এই ছবিটি মুছবেন?',
      deleteNote: 'এটি ফেরানো যাবে না (প্রোটোটাইপ)',
      cancel: 'বাতিল',
      confirm: 'মুছুন',
      moreTitle: 'আরও অপশন'
    },
    more: {
      save: 'ফাইলে সংরক্ষণ',
      copy: 'কপি',
      hide: 'লুকান',
      info: 'ছবির তথ্য'
    },
    notice: {
      favorited: 'পছন্দে যোগ হয়েছে',
      unfavorited: 'পছন্দ থেকে সরানো হয়েছে',
      deleted: 'ছবি মুছে ফেলা হয়েছে',
      shared: 'শেয়ার প্যানেল খোলা হয়েছে',
      edit: 'সম্পাদনা শীঘ্রই আসছে',
      scan: 'দৃশ্য শনাক্তকরণ শীঘ্রই আসছে',
      search: 'সার্চ শীঘ্রই আসছে',
      listView: 'তালিকা ভিউ শীঘ্রই আসছে',
      selectMode: 'একাধিক নির্বাচন চালু',
      settings: 'অ্যালবাম সেটিংস শীঘ্রই আসছে',
      albums: 'অ্যালবাম শীঘ্রই আসছে',
      discover: 'আবিষ্কার শীঘ্রই আসছে',
      saved: 'ফাইলে সংরক্ষিত',
      copied: 'কপি করা হয়েছে',
      hidden: 'লুকানো হয়েছে',
      lastPhoto: 'এটি প্রথম / শেষ ছবি'
    }
  }
}
