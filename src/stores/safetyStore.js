import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY_PREFIX = 'tos_safety_'

function getStorage(key, fallback) {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (val !== null) {
      return JSON.parse(val)
    }
  } catch {
    // 回退到内存默认值
  }
  return fallback
}

function setStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value))
  } catch {
    // 忽略存储异常
  }
}

export const useSafetyStore = defineStore('safety', () => {
  // 顶部个人安全状态
  const personalSafetyReady = ref(getStorage('personal_ready', true))

  // 紧急联络：医疗信息
  const medicalInfo = ref(getStorage('medical_info', {
    name: 'Jingzhan',
    bloodType: 'O型 RH阳性',
    allergies: '青霉素过敏',
    medications: '无特殊用药',
    address: '广东省深圳市南山区',
    organDonor: true,
  }))

  // 紧急联络：紧急联系人
  const emergencyContacts = ref(getStorage('contacts', [
    { id: 1, name: '陈先生', phone: '13800138000', relationship: '父亲' },
    { id: 2, name: '林女士', phone: '13900139000', relationship: '母亲' },
  ]))

  // 紧急求救（SOS）配置 · 仅模拟展示，严禁触发真报警/真实拨号
  const emergencySos = ref({
    enabled: true,
    triggerMethod: '快速连按电源键 5 次',
    countdownSeconds: 5,
    playAlertSound: true,
    isSimulationOnly: true, // 明确标注为原型模拟
  })

  // 无线紧急警报
  // 真机标定：地震警报默认「已开启」
  const earthquakeAlert = ref(getStorage('earthquake_alert', true))
  // 真机标定：灾害警报
  const disasterAlert = ref(getStorage('disaster_alert', true))
  // 真机标定：驾车时将通知设为静音默认「已关闭」
  const silenceWhileDriving = ref(getStorage('silence_driving', false))

  // 更多服务
  // 真机标定：紧急位置信息服务默认「已开启」
  const emergencyLocationService = ref(getStorage('location_service', true))
  // 不明追踪器提醒
  const unknownTrackerAlert = ref(getStorage('tracker_alert', true))

  // 状态切换方法
  function toggleEarthquakeAlert() {
    earthquakeAlert.value = !earthquakeAlert.value
    setStorage('earthquake_alert', earthquakeAlert.value)
  }

  function toggleDisasterAlert() {
    disasterAlert.value = !disasterAlert.value
    setStorage('disaster_alert', disasterAlert.value)
  }

  function toggleSilenceWhileDriving() {
    silenceWhileDriving.value = !silenceWhileDriving.value
    setStorage('silence_driving', silenceWhileDriving.value)
  }

  function toggleEmergencyLocationService() {
    emergencyLocationService.value = !emergencyLocationService.value
    setStorage('location_service', emergencyLocationService.value)
  }

  function toggleUnknownTrackerAlert() {
    unknownTrackerAlert.value = !unknownTrackerAlert.value
    setStorage('tracker_alert', unknownTrackerAlert.value)
  }

  function updateMedicalInfo(newInfo) {
    medicalInfo.value = { ...medicalInfo.value, ...newInfo }
    setStorage('medical_info', medicalInfo.value)
  }

  function addEmergencyContact(contact) {
    const newContact = {
      id: Date.now(),
      name: contact.name || '未命名联系人',
      phone: contact.phone || '',
      relationship: contact.relationship || '其他',
    }
    emergencyContacts.value.push(newContact)
    setStorage('contacts', emergencyContacts.value)
  }

  function removeEmergencyContact(id) {
    emergencyContacts.value = emergencyContacts.value.filter(c => c.id !== id)
    setStorage('contacts', emergencyContacts.value)
  }

  // 重置为真机默认态
  function resetToDefault() {
    earthquakeAlert.value = true
    disasterAlert.value = true
    silenceWhileDriving.value = false
    emergencyLocationService.value = true
    unknownTrackerAlert.value = true
    setStorage('earthquake_alert', true)
    setStorage('disaster_alert', true)
    setStorage('silence_driving', false)
    setStorage('location_service', true)
    setStorage('tracker_alert', true)
  }

  return {
    personalSafetyReady,
    medicalInfo,
    emergencyContacts,
    emergencySos,
    earthquakeAlert,
    disasterAlert,
    silenceWhileDriving,
    emergencyLocationService,
    unknownTrackerAlert,
    toggleEarthquakeAlert,
    toggleDisasterAlert,
    toggleSilenceWhileDriving,
    toggleEmergencyLocationService,
    toggleUnknownTrackerAlert,
    updateMedicalInfo,
    addEmergencyContact,
    removeEmergencyContact,
    resetToDefault,
  }
})
