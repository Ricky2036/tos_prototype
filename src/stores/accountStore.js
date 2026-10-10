import { defineStore } from 'pinia'
import { ref } from 'vue'

export const DEFAULT_AVATAR = new URL('../assets/img/account-avatar.jpg', import.meta.url).href

export const useAccountStore = defineStore('account', () => {
  const isLoggedIn = ref(true)
  const username = ref('Ricky')
  const phone = ref('+86 181****8993')
  const email = ref('ric***@infinixmobility.com')
  const avatar = ref(DEFAULT_AVATAR)

  // 云存储
  const cloudStorage = ref({
    used: '23.37 MB',
    total: '40 GB'
  })

  // 功能状态
  const findMyDeviceEnabled = ref(true)
  const electronicWarrantyActive = ref(true)
  const aiCredits = ref(5000)
  const version = ref('20.0.0.178')

  // 账号安全状态
  const fingerprintLogin = ref(false)
  const emergencyContacts = ref([
    { id: '1', name: '紧急联系人 (家属)', phone: '+86 138****0021' }
  ])
  const thirdPartyAccounts = ref([
    { id: 'google', name: 'Google', bound: true, identifier: 'ricky.infinix@gmail.com' },
    { id: 'facebook', name: 'Facebook', bound: false, identifier: '' },
    { id: 'x', name: 'X', bound: false, identifier: '' }
  ])
  const accountLogs = ref([
    { id: '1', device: 'Infinix NOTE 50S 5G', action: '本机登录', location: '中国 · 深圳', time: '刚刚', isCurrent: true },
    { id: '2', device: 'Infinix GT 50 Pro', action: '账号登录', location: '中国 · 深圳', time: '昨天 15:42', isCurrent: false },
    { id: '3', device: 'TECNO POVA 7 5G', action: '云端同步', location: '中国 · 广州', time: '3天前', isCurrent: false }
  ])
  const passwordLastChanged = ref('2026-09-08')

  // 设备列表（顶部 3 个设备）
  const devices = ref([
    {
      id: 'note50s',
      name: 'Infinix NOTE 50S 5G',
      subtitle: '本设备',
      isCurrent: true,
      color: 'cyan'
    },
    {
      id: 'gt50',
      name: 'Infinix GT 50 Pro',
      subtitle: '',
      isCurrent: false,
      color: 'silver'
    },
    {
      id: 'pova7',
      name: 'TECNO POVA 7 5G',
      subtitle: '',
      isCurrent: false,
      color: 'silver'
    }
  ])

  function logout() {
    isLoggedIn.value = false
  }

  function login(name = 'Ricky') {
    isLoggedIn.value = true
    username.value = name
  }

  function setFingerprintLogin(val) {
    fingerprintLogin.value = Boolean(val)
  }

  function resetPassword(newPass) {
    passwordLastChanged.value = new Date().toISOString().slice(0, 10)
    // 记录重置密码日志
    accountLogs.value.unshift({
      id: String(Date.now()),
      device: 'Infinix NOTE 50S 5G',
      action: '密码重置成功',
      location: '中国 · 深圳',
      time: '刚刚',
      isCurrent: true
    })
  }

  function addEmergencyContact(contact) {
    emergencyContacts.value.push(contact)
  }

  return {
    isLoggedIn,
    username,
    phone,
    email,
    avatar,
    cloudStorage,
    findMyDeviceEnabled,
    electronicWarrantyActive,
    aiCredits,
    version,
    fingerprintLogin,
    emergencyContacts,
    thirdPartyAccounts,
    accountLogs,
    passwordLastChanged,
    devices,
    logout,
    login,
    setFingerprintLogin,
    resetPassword,
    addEmergencyContact
  }
})
