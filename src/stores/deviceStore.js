import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEYS = {
  DEVICE_NAME: 'tos_settings_device_name',
  MEM_FUSION_ENABLED: 'tos_settings_memfusion_enabled',
  MEM_FUSION_SIZE: 'tos_settings_memfusion_size'
}

export const useDeviceStore = defineStore('device', () => {
  // 设备名称
  const deviceName = ref(localStorage.getItem(STORAGE_KEYS.DEVICE_NAME) || 'Infinix NOTE 60 Pro')

  function setDeviceName(name) {
    const trimmed = (name || '').trim()
    if (!trimmed) return false
    deviceName.value = trimmed.slice(0, 32)
    localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, deviceName.value)
    return true
  }

  // 融合内存设置
  const savedFusionEnabled = localStorage.getItem(STORAGE_KEYS.MEM_FUSION_ENABLED)
  const memFusionEnabled = ref(savedFusionEnabled !== null ? savedFusionEnabled === 'true' : true)

  const savedFusionSize = localStorage.getItem(STORAGE_KEYS.MEM_FUSION_SIZE)
  const memFusionSize = ref(savedFusionSize ? parseInt(savedFusionSize, 10) : 6)

  const physicalRam = 12

  const totalRamText = computed(() => {
    if (!memFusionEnabled.value) {
      return `${physicalRam}.00 GB`
    }
    return `${physicalRam}.00 GB+${memFusionSize.value}.00 GB`
  })

  function setMemFusionEnabled(enabled) {
    memFusionEnabled.value = !!enabled
    localStorage.setItem(STORAGE_KEYS.MEM_FUSION_ENABLED, String(memFusionEnabled.value))
  }

  function setMemFusionSize(size) {
    if ([3, 6, 12].includes(size)) {
      memFusionSize.value = size
      localStorage.setItem(STORAGE_KEYS.MEM_FUSION_SIZE, String(size))
    }
  }

  // 硬件与系统信息
  const model = 'Infinix X6878'
  const cpu = 'Snapdragon 7s Gen 4'
  const rearCamera = '50M OIS+8M'
  const frontCamera = '13M'
  const batteryCapacity = '6000mAh'
  const screenResolution = '1208x2644'
  const performanceEngine = 'XGlide 引擎'
  const xosVersion = '17.0.0'
  const androidVersion = '17'
  const securityPatchDate = '2026年10月1日'
  const googlePlayUpdateDate = '2026年9月1日'
  const basebandVersion = 'MPSS.DE.1.0.c1-00085'
  const kernelVersion = '6.6.48-android17-ge0f31a29'
  const buildNumber = '17.0.0.038SP01(OP003PF001AZ)FANS'
  const hardwareVersion = 'V1.0'
  const serialNumber = '159467059A001123'
  const imei1 = '863920061234567'
  const imei2 = '863920061234568'
  const imeiSv = '01'
  const ipAddress = '10.240.71.206'
  const wlanMac = '7C:D9:54:12:34:56'
  const bluetoothAddress = '7C:D9:54:12:34:57'
  const warrantyActive = true
  const warrantyStartDate = '2026-08-15'
  const warrantyEndDate = '2027-08-14'

  return {
    deviceName,
    setDeviceName,
    physicalRam,
    memFusionEnabled,
    memFusionSize,
    totalRamText,
    setMemFusionEnabled,
    setMemFusionSize,
    model,
    cpu,
    rearCamera,
    frontCamera,
    batteryCapacity,
    screenResolution,
    performanceEngine,
    xosVersion,
    androidVersion,
    securityPatchDate,
    googlePlayUpdateDate,
    basebandVersion,
    kernelVersion,
    buildNumber,
    hardwareVersion,
    serialNumber,
    imei1,
    imei2,
    imeiSv,
    ipAddress,
    wlanMac,
    bluetoothAddress,
    warrantyActive,
    warrantyStartDate,
    warrantyEndDate
  }
})
