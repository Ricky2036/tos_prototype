export const APP_PERMISSION_ROWS = [
  { key: 'microphone', label: '麦克风' },
  { key: 'notifications', label: '通知' },
  { key: 'location', label: '位置信息' },
  { key: 'camera', label: '相机' }
]

// Screenshot reference data for the 24-hour privacy dashboard.
export const PRIVACY_DASHBOARD_ROWS = [
  { key: 'location', label: '位置信息', count: 9 },
  { key: 'camera', label: '相机', count: 2 },
  { key: 'microphone', label: '麦克风', count: 3 },
  { key: 'health', label: '健康、健身和身心状态', count: 0 },
  { key: 'files', label: '文件', count: 0 },
  { key: 'calendar', label: '日历', count: 1 },
  { key: 'photos', label: '照片和视频', count: 0 },
  { key: 'phone', label: '电话', count: 3 },
  { key: 'sms', label: '短信', count: 1 },
  { key: 'contacts', label: '联系人和账号', count: 1 },
  { key: 'activity', label: '身体活动', count: 0 },
  { key: 'calls', label: '通话记录', count: 0 },
  { key: 'nearby', label: '附近的设备', count: 8 },
  { key: 'audio', label: '音乐和音频', count: 0 }
]

export function appPermissionRows(app) {
  return APP_PERMISSION_ROWS.filter(row => app !== 'recorder' || row.key !== 'camera')
}

export const REFERENCE_APPS = {
  folax:{name:'Folax',icon:'folax'},weather:{name:'天气',icon:'weather'},phone:{name:'电话',icon:'phone'},
  sms:{name:'短信',icon:'sms'},amap:{name:'高德地图',icon:'amap'},recorder:{name:'录音机',icon:'recorder'},
  live:{name:'实时转写和声音通知',icon:'live'},wechat:{name:'微信',icon:'wechat'},
  camera:{name:'相机',icon:'camera'},maps:{name:'地图',icon:'maps'},google:{name:'Google',icon:'google'}
}
export const LOCATION_TIMELINE = [
  {day:'今天',time:'11:21',app:'folax'}, {day:'今天',time:'10:53',app:'camera'},
  {day:'今天',time:'10:02',app:'folax'}, {day:'今天',time:'10:02',app:'weather'},
  {day:'今天',time:'09:58',app:'folax'}, {day:'今天',time:'09:49',app:'folax',duration:'2 分钟'},
  {day:'今天',time:'09:19',app:'folax',duration:'2 分钟'}, {day:'今天',time:'04:13',app:'folax'},
  {day:'昨天',time:'19:18',app:'folax'}, {day:'昨天',time:'18:26',app:'folax'},
  {day:'昨天',time:'18:06',app:'folax'}, {day:'昨天',time:'17:55',app:'folax'},
  {day:'昨天',time:'17:53',app:'folax'}, {day:'昨天',time:'14:42',app:'weather'},
  {day:'昨天',time:'14:20',app:'folax'}, {day:'昨天',time:'13:55',app:'folax',duration:'2 分钟'}
]
export const PERMISSION_DESCRIPTIONS = {
 microphone:'具有此权限的应用可以录制音频',camera:'具有此权限的应用可以拍摄照片和录制视频',
 location:'具有此权限的应用可以获取此设备的位置信息',notifications:'具有此权限的应用可以发送通知',
 nearby:'具有此权限的应用可以查找并连接附近的设备'
}
export const REFERENCE_PERMISSION_APPS = {
 microphone:[{app:'phone'},{app:'sms'},{app:'amap',lastAccess:'2026/10/17，22:21'},{app:'recorder',lastAccess:'2026/10/16，16:26'},{app:'live'},{app:'wechat'}],
 camera:[{app:'camera'},{app:'maps'}],
 location:[{app:'folax'},{app:'camera'},{app:'weather'},{app:'maps'},{app:'amap'},{app:'phone'},{app:'wechat'},{app:'google'},{app:'live'}]
}

export function permissionAppGroups(permission, access = {}, extraApps = []) {
 const rows=[...(REFERENCE_PERMISSION_APPS[permission] || [])]
 for(const app of extraApps) if(!rows.some(row=>row.app===app)) rows.push({app})
 const groups=[{key:'always',label:'始终允许',rows:[]},{key:'allow',label:'仅在使用时允许',rows:[]},{key:'ask',label:'每次都询问',rows:[]},{key:'deny',label:'不允许',rows:[]}]
 for(const row of rows){const value=access[`${row.app}:${permission}`] || 'allow';const group=groups.find(group=>group.key===value) || groups[1];group.rows.push(row)}
 return groups.filter(group=>group.key==='always'||group.key==='allow'||group.rows.length)
}
