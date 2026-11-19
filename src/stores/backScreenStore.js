import { defineStore } from 'pinia'

export const BACK_SCREEN_TRACKS = [
  { title: 'Bloom', artist: 'The Paper Kites' },
  { title: 'Sunset Lover', artist: 'Petit Biscuit' },
  { title: 'Golden Hour', artist: 'JVKE' }
]

export const BACK_SCREEN_PRODUCT_LINES = [
  { id: 'camon', label: 'Camon', theme: { '--product-sky-top': '#56b6ef', '--product-sky-mid': '#96dcff', '--product-sky-bottom': '#228fbf', '--product-water': '#2099c4', '--product-accent': '#f7db8d', '--product-panel-a': '#244568', '--product-panel-b': '#0c1b2c', '--product-glow': 'rgba(68, 150, 220, .55)' } },
  { id: 'pova', label: 'POVA', theme: { '--product-sky-top': '#57b7cd', '--product-sky-mid': '#9be2d0', '--product-sky-bottom': '#16859a', '--product-water': '#15a0a8', '--product-accent': '#b5ff61', '--product-panel-a': '#1e4450', '--product-panel-b': '#0b202a', '--product-glow': 'rgba(54, 198, 175, .48)' } },
  { id: 'spark', label: 'Spark', theme: { '--product-sky-top': '#e98ac7', '--product-sky-mid': '#fac4e8', '--product-sky-bottom': '#a65cce', '--product-water': '#8741aa', '--product-accent': '#ffb5dd', '--product-panel-a': '#56244f', '--product-panel-b': '#22152f', '--product-glow': 'rgba(244, 123, 209, .48)' } },
  { id: 'note', label: 'NOTE', theme: { '--product-sky-top': '#8ecdf6', '--product-sky-mid': '#c8edff', '--product-sky-bottom': '#4b91c2', '--product-water': '#2385b5', '--product-accent': '#e1f5ff', '--product-panel-a': '#294d70', '--product-panel-b': '#101e35', '--product-glow': 'rgba(147, 208, 252, .58)' } },
  { id: 'gt', label: 'GT', theme: { '--product-sky-top': '#28c7ef', '--product-sky-mid': '#a1f4ff', '--product-sky-bottom': '#005e94', '--product-water': '#007da4', '--product-accent': '#74fcff', '--product-panel-a': '#112a53', '--product-panel-b': '#070f25', '--product-glow': 'rgba(0, 207, 255, .55)' } },
  { id: 'hot', label: 'HOT', theme: { '--product-sky-top': '#ffb568', '--product-sky-mid': '#ffdea0', '--product-sky-bottom': '#ec704b', '--product-water': '#c95545', '--product-accent': '#ffde70', '--product-panel-a': '#60352a', '--product-panel-b': '#24171a', '--product-glow': 'rgba(255, 139, 67, .48)' } },
  { id: 'smart', label: 'Smart', theme: { '--product-sky-top': '#c4e88b', '--product-sky-mid': '#eef9be', '--product-sky-bottom': '#6fa96e', '--product-water': '#3e8d74', '--product-accent': '#e5ff9a', '--product-panel-a': '#314c33', '--product-panel-b': '#14251d', '--product-glow': 'rgba(159, 225, 112, .48)' } },
  { id: 'itel', label: 'iTel', theme: { '--product-sky-top': '#5db9f2', '--product-sky-mid': '#86cef3', '--product-sky-bottom': '#239ac6', '--product-water': '#197ca5', '--product-accent': '#fff0b5', '--product-panel-a': '#263c66', '--product-panel-b': '#0c111c', '--product-glow': 'rgba(116, 167, 255, .52)' } }
]

export const useBackScreenStore = defineStore('backScreen', {
  state: () => ({
    isScreenOn: true,
    isDisplayAwake: true,
    activeGroup: 'active',
    activePage: 'clock',
    calendarView: 'month',
    cameraMode: 'photo',
    passivePage: 'call',
    notificationIndex: 0,
    callStatus: 'ringing',
    startupRun: 0,
    productLine: 'itel',
    clockFeature: 'clock',
    stopwatchSeconds: 0,
    countdownSeconds: 300,
    isStopwatchRunning: false,
    isCountdownRunning: false,
    musicTrackIndex: 0,
    isMusicPlaying: false,
    settings: {
      dialStyle: '动态表盘',
      screenTimeout: '15 秒',
      backlightLevel: '等级 5',
      returnHomeTime: '15 秒',
      followMainDisplay: false,
      flipToWake: true,
      doubleTapToWake: true,
      callHintEnabled: true,
      notificationHintEnabled: true,
      notificationAppIds: ['whatsapp', 'infinix', 'facebook', 'gmail', 'messages', 'instagram', 'spotify'],
      musicEnabled: true,
      musicApp: 'Boomplay Lite',
      cameraShutterSound: true,
      photoSize: '3264×2448'
    }
  })
})
