/**
 * 三星模式和日常程序「其他动作」全量动作分类与子项目定义
 * 100% 对齐真机提取的各大分类及几十项子菜单与参数选项
 */

export const ACTION_CATEGORIES = [
  {
    id: 'display',
    name: '显示',
    iconColor: '#84CC16',
    iconPath: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
    items: [
      { id: 'dark_mode', title: '黑暗模式', defaultVal: '开', options: ['开', '关'] },
      { id: 'eye_comfort', title: '护眼模式', defaultVal: '开', options: ['开', '关'] },
      { id: 'screen_timeout', title: '自动息屏', defaultVal: '30 秒', options: ['15 秒', '30 秒', '1 分钟', '2 分钟', '5 分钟', '10 分钟'] },
      { id: 'brightness', title: '亮度', defaultVal: '50%', options: ['25%', '50%', '75%', '100%'] },
      { id: 'refresh_rate', title: '屏幕刷新率', defaultVal: '自适应', options: ['自适应 (120Hz)', '标准 (60Hz)'] },
      { id: 'screen_resolution', title: '屏幕分辨率', defaultVal: 'FHD+', options: ['FHD+', 'WQHD+'] },
      { id: 'screen_orientation', title: '屏幕方向', defaultVal: '自动旋转', options: ['自动旋转', '纵向锁定', '横向'] },
      { id: 'auto_brightness', title: '自动调节亮度', defaultVal: '开', options: ['开', '关'] },
      { id: 'touch_sensitivity', title: '触摸灵敏度', defaultVal: '开', options: ['开', '关'] }
    ]
  },
  {
    id: 'sound',
    name: '声音和振动',
    iconColor: '#6366F1',
    iconPath: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
    items: [
      { id: 'sound_mode', title: '声音模式和音量', defaultVal: '静音', options: ['声音', '振动', '静音'] },
      { id: 'vibrate_intensity', title: '振动强度', defaultVal: '中', options: ['强', '中', '弱', '关闭'] },
      { id: 'dolby_atmos', title: '杜比全景声', defaultVal: '开', options: ['开', '关', '自动'] },
      { id: 'ringtone', title: '铃声', defaultVal: '随心轻快', options: ['随心轻快', '经典铃音', '极光微澜'] }
    ]
  },
  {
    id: 'connectivity',
    name: '连接',
    iconColor: '#0EA5E9',
    iconPath: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
    items: [
      { id: 'wifi', title: 'WLAN', defaultVal: '开', options: ['开', '关'] },
      { id: 'bluetooth', title: '蓝牙', defaultVal: '开', options: ['开', '关'] },
      { id: 'airplane_mode', title: '飞行模式', defaultVal: '关', options: ['开', '关'] },
      { id: 'mobile_data', title: '移动数据', defaultVal: '开', options: ['开', '关'] },
      { id: 'mobile_hotspot', title: '移动热点', defaultVal: '关', options: ['开', '关'] }
    ]
  },
  {
    id: 'notifications',
    name: '通知',
    iconColor: '#F97316',
    iconPath: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    items: [
      { id: 'read_notifications_aloud', title: '朗读通知', defaultVal: '开', options: ['开', '关'] },
      { id: 'notification_sound', title: '通知提示音', defaultVal: '清脆微音', options: ['清脆微音', '水珠跃动', '静音'] }
    ]
  },
  {
    id: 'wallpaper',
    name: '壁纸',
    iconColor: '#EC4899',
    iconPath: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-8 14l-3-4-2 2.5V5h12v12h-7z',
    items: [
      { id: 'lock_wallpaper', title: '锁定屏幕壁纸', defaultVal: '沉静极光', options: ['沉静极光', '温暖日光', '夜幕深空'] },
      { id: 'home_wallpaper', title: '主屏幕壁纸', defaultVal: '简约素白', options: ['简约素白', '深黑极光', '流光渐变'] }
    ]
  },
  {
    id: 'lockscreen_aod',
    name: '锁定屏幕和息屏提醒',
    iconColor: '#3B82F6',
    iconPath: 'M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a7 7 0 0 0-14 0v2',
    items: [
      { id: 'aod_mode', title: '息屏提醒', defaultVal: '点击以显示', options: ['始终显示', '点击以显示', '定时显示', '已关闭'] },
      { id: 'clock_style', title: '时钟样式', defaultVal: '简约数字', options: ['简约数字', '经典表盘', '艺术渐变'] }
    ]
  },
  {
    id: 'battery',
    name: '电池',
    iconColor: '#22C55E',
    iconPath: 'M6 7H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3m10 0h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2M22 11v2M11 7l-2 5h4l-2 5',
    items: [
      { id: 'power_saving', title: '省电模式', defaultVal: '开', options: ['开', '关'] },
      { id: 'protect_battery', title: '保护电池', defaultVal: '上限80%', options: ['最大限制(80%)', '自适应保护', '关'] },
      { id: 'wireless_powershare', title: '无线反向充电', defaultVal: '关', options: ['开', '关'] }
    ]
  },
  {
    id: 'location',
    name: '位置',
    iconColor: '#8B5CF6',
    iconPath: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    items: [
      { id: 'location_switch', title: '位置信息', defaultVal: '开', options: ['开', '关'] },
      { id: 'high_accuracy', title: '高精度定位', defaultVal: '开', options: ['开', '关'] }
    ]
  },
  {
    id: 'account_backup',
    name: '账号与备份',
    iconColor: '#06B6D4',
    iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    items: [
      { id: 'auto_sync', title: '自动同步个人数据', defaultVal: '开', options: ['开', '关'] }
    ]
  },
  {
    id: 'device_care',
    name: '智能管理器',
    iconColor: '#64748B',
    iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    items: [
      { id: 'auto_clean_ram', title: '自动清理内存', defaultVal: '开', options: ['开', '关'] },
      { id: 'deep_sleep_apps', title: '限制后台应用', defaultVal: '开', options: ['开', '关'] }
    ]
  },
  {
    id: 'features',
    name: '功能与日常',
    iconColor: '#D946EF',
    iconPath: 'M12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z',
    items: [
      { id: 'edge_panel', title: '侧屏幕面板', defaultVal: '开', options: ['开', '关'] },
      { id: 'one_hand_mode', title: '单手模式', defaultVal: '关', options: ['开', '关'] }
    ]
  }
]
