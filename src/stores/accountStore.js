import { defineStore } from 'pinia'
import { ref } from 'vue'

export const DEFAULT_AVATAR = new URL('../assets/img/infinix-id-avatar.png', import.meta.url).href

export const useAccountStore = defineStore('account', () => {
  const isLoggedIn = ref(true)
  const username = ref('Ricky')
  const phone = ref('+86 181****8993')
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

  // 设备列表（顶部 3 个设备）
  const devices = ref([
    {
      id: 'note60',
      name: 'Infinix NOTE 60 Pro',
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

  return {
    isLoggedIn,
    username,
    phone,
    avatar,
    cloudStorage,
    findMyDeviceEnabled,
    electronicWarrantyActive,
    aiCredits,
    version,
    devices,
    logout,
    login
  }
})
