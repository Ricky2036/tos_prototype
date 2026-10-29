import { defineStore } from 'pinia'
import { useControlStore } from './controlStore.js'

export const useNetworkStore = defineStore('network', {
  state: () => ({
    // SIM 卡与网络设置状态
    simCards: [
      {
        id: 'sim1',
        name: '中国电信',
        number: '+86 181 3884 8993',
        enabled: true,
        slot: 1,
        carrier: '中国电信',
        networkType: '2G/3G/4G/5G 自动选择',
        selectNetwork: '中国电信',
        apn: 'ctnet',
        dataUsage: '14.28 GB',
        period: '10月2日至11月1日',
        roaming: false,
        volte: true,
        videoCalling: true
      },
      {
        id: 'sim2',
        name: 'SIM 卡 2',
        number: '',
        enabled: false,
        slot: 2,
        carrier: '',
        isEmpty: true
      }
    ],
    esimEnabled: false,
    defaultDataCard: '中国电信',
    defaultCallCard: '中国电信',
    mobileData: true,
    network5g: true,

    // WLAN 状态
    wifiEnabled: true,
    connectedWifi: {
      ssid: 'Transsion_Mobile',
      status: '已连接',
      signal: 3,
      secure: true,
      frequency: '5 GHz',
      linkSpeed: '866 Mbps',
      securityType: 'WPA/WPA2/WPA3 个人级',
      ipAddress: '192.168.1.135',
      macAddress: '78:02:B7:6E:9A:C2',
      gateway: '192.168.1.1',
      subnetMask: '255.255.255.0'
    },
    savedWifiList: [
      { ssid: 'Transsion_Holdings', status: '已保存', signal: 3, secure: true }
    ],
    availableWifiList: [
      { ssid: 'HelloWifi', signal: 4, secure: true, frequency: '5 GHz' },
      { ssid: 'Transsion', signal: 3, secure: true, frequency: '2.4 GHz' },
      { ssid: 'Transsion_Guest', signal: 3, secure: true, frequency: '2.4 GHz' },
      { ssid: 'MAXHUB-434', signal: 2, secure: true, frequency: '5 GHz' }
    ],
    wifiScanning: false,

    // 蓝牙状态
    bluetoothEnabled: true,
    deviceName: 'Infinix NOTE 60 Pro',
    bluetoothAddress: '78:02:B7:6E:9A:C1',
    pairedDevices: [
      { id: 'earcase', name: 'EarCase', type: 'headphone', connected: true, battery: '85%' },
      { id: 'matepad', name: 'MatePad Air', type: 'tablet', connected: false },
      { id: 'pova', name: "Ian's TECNO POVA 8 Pro 5", type: 'phone', connected: false },
      { id: 'tcl', name: 'TCL 55D8-C4CF', type: 'tv', connected: false },
      { id: 'custom-bt', name: 'MPCmIvVbe+SpuUp8LOb/0k5ZU', type: 'bluetooth', connected: false }
    ],
    availableBtDevices: [
      { id: 'soundbar', name: 'Living Room Soundbar', type: 'speaker' },
      { id: 'zerobook', name: 'Infinix ZERO Book', type: 'laptop' }
    ],
    btScanning: false,

    // 星链卫星网络
    satelliteServiceEnabled: false,
    satelliteSimInserted: false,

    // 个人热点与网络共享
    hotspotEnabled: false,
    hotspotName: 'Ricky',
    hotspotPassword: 'ricky_hxj',
    hotspotAutoOff: 'AI 智能关闭',
    hotspotWlan6: true,
    usbSharing: false,
    bluetoothSharing: false,
    connectedClients: [],

    // NFC 状态
    nfcEnabled: true,
    nfcReadPrompt: '无限制',

    // 专用 DNS 与其他连接
    privateDnsMode: 'auto', // 'off' | 'auto' | 'hostname'
    privateDnsHostname: '',
    usbConnectionMode: '文件传输 / Android Auto',
    castEnabled: false,
    castDevices: []
  }),

  actions: {
    // 飞行模式联动
    setAirplaneMode(enabled) {
      const control = useControlStore()
      control.airplane = enabled
      if (enabled) {
        // 开启飞行模式时，断开蜂窝数据、热点与卫星服务
        this.hotspotEnabled = false
        control.hotspot = false
        this.satelliteServiceEnabled = false
      }
    },

    // 切换移动数据
    setMobileData(enabled) {
      this.mobileData = enabled
      const control = useControlStore()
      control.cellular = enabled
    },

    // 切换 5G 开关
    setNetwork5g(enabled) {
      this.network5g = enabled
    },

    // 切换 eSIM
    setEsim(enabled) {
      this.esimEnabled = enabled
      // 开启 eSIM 时，实体卡 2 停用
      if (this.simCards[1]) {
        this.simCards[1].enabled = !enabled
      }
    },

    // 切换 WLAN
    setWifi(enabled) {
      this.wifiEnabled = enabled
      const control = useControlStore()
      control.wifi = enabled
    },

    // 连接指定 Wi-Fi
    connectWifi(ssid, password = '') {
      if (this.connectedWifi && this.connectedWifi.ssid === ssid) return
      
      // 将原连接项挪入已保存列表
      if (this.connectedWifi) {
        const prev = this.connectedWifi
        if (!this.savedWifiList.some(item => item.ssid === prev.ssid)) {
          this.savedWifiList.push({
            ssid: prev.ssid,
            status: '已保存',
            signal: prev.signal,
            secure: prev.secure
          })
        }
      }

      // 提取目标网络
      const foundIdx = this.availableWifiList.findIndex(item => item.ssid === ssid)
      const foundSavedIdx = this.savedWifiList.findIndex(item => item.ssid === ssid)
      let target = null
      if (foundIdx !== -1) {
        target = this.availableWifiList.splice(foundIdx, 1)[0]
      } else if (foundSavedIdx !== -1) {
        target = this.savedWifiList.splice(foundSavedIdx, 1)[0]
      }

      this.connectedWifi = {
        ssid,
        status: '已连接',
        signal: target?.signal || 3,
        secure: target?.secure ?? true,
        frequency: target?.frequency || '5 GHz',
        linkSpeed: '866 Mbps',
        securityType: 'WPA/WPA2/WPA3 个人级',
        ipAddress: '192.168.1.135',
        macAddress: '78:02:B7:6E:9A:C2',
        gateway: '192.168.1.1',
        subnetMask: '255.255.255.0'
      }
    },

    // 忽略/断开当前 Wi-Fi
    forgetWifi(ssid) {
      if (this.connectedWifi && this.connectedWifi.ssid === ssid) {
        const item = this.connectedWifi
        this.availableWifiList.unshift({
          ssid: item.ssid,
          signal: item.signal,
          secure: item.secure,
          frequency: item.frequency
        })
        this.connectedWifi = null
      }
      this.savedWifiList = this.savedWifiList.filter(item => item.ssid !== ssid)
    },

    // 添加自定义网络
    addWifiNetwork({ ssid, security = 'WPA3', password = '' }) {
      if (!ssid) return
      this.savedWifiList.push({
        ssid,
        status: '已保存',
        signal: 3,
        secure: security !== '无'
      })
    },

    // 切换蓝牙
    setBluetooth(enabled) {
      this.bluetoothEnabled = enabled
      const control = useControlStore()
      control.bluetooth = enabled
    },

    // 连接已配对蓝牙设备
    connectBluetoothDevice(id) {
      this.pairedDevices = this.pairedDevices.map(d => {
        if (d.id === id) {
          return { ...d, connected: true, battery: d.battery || '90%' }
        }
        // 如果是音频设备，单连接
        if (d.type === 'headphone' && d.id !== id) {
          return { ...d, connected: false }
        }
        return d
      })
    },

    // 断开蓝牙设备
    disconnectBluetoothDevice(id) {
      this.pairedDevices = this.pairedDevices.map(d => {
        if (d.id === id) {
          return { ...d, connected: false }
        }
        return d
      })
    },

    // 取消配对蓝牙设备
    unpairBluetoothDevice(id) {
      const dev = this.pairedDevices.find(d => d.id === id)
      if (dev) {
        this.pairedDevices = this.pairedDevices.filter(d => d.id !== id)
        this.availableBtDevices.push({
          id: dev.id,
          name: dev.name,
          type: dev.type
        })
      }
    },

    // 重命名本机设备
    setDeviceName(name) {
      if (name?.trim()) {
        this.deviceName = name.trim()
      }
    },

    // 切换个人热点
    setHotspot(enabled) {
      this.hotspotEnabled = enabled
      const control = useControlStore()
      control.hotspot = enabled
    },

    // 更新热点配置
    updateHotspotConfig({ name, password, wlan6, autoOff }) {
      if (name) this.hotspotName = name
      if (password) this.hotspotPassword = password
      if (wlan6 !== undefined) this.hotspotWlan6 = wlan6
      if (autoOff) this.hotspotAutoOff = autoOff
    },

    // 切换 NFC
    setNfc(enabled) {
      this.nfcEnabled = enabled
      const control = useControlStore()
      control.nfc = enabled
    },

    // 设置专用 DNS
    setPrivateDns(mode, hostname = '') {
      this.privateDnsMode = mode
      this.privateDnsHostname = hostname
    },

    // 设置星链卫星服务
    setSatelliteService(enabled) {
      this.satelliteServiceEnabled = enabled
    }
  }
})
