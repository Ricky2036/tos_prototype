<script setup>
import { computed, ref, watch } from 'vue'
import { useBackScreenStore } from '../../../stores/backScreenStore'
import GlassNavBar from '../../ui/GlassNavBar.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])

const backScreen = useBackScreenStore()
const page = ref('main')
watch(() => backScreen.settings.musicEnabled, (enabled) => {
  if (!enabled && backScreen.activeGroup === 'active' && backScreen.activePage === 'music') backScreen.activePage = 'clock'
}, { immediate: true })
watch(() => backScreen.settings.callHintEnabled, (enabled) => {
  if (!enabled && backScreen.activeGroup === 'passive' && backScreen.passivePage === 'call') backScreen.activeGroup = 'active'
}, { immediate: true })
watch(() => backScreen.settings.notificationHintEnabled, (enabled) => {
  if (!enabled && backScreen.activeGroup === 'passive' && backScreen.passivePage === 'notification') backScreen.activeGroup = 'active'
}, { immediate: true })
const pageTitles = {
  dial: '表盘',
  notificationApps: '应用选择',
  musicApp: '选择音乐应用',
  photoSize: '后摄像头照片大小'
}
const title = computed(() => pageTitles[page.value] || '灵动背屏')
const notificationApps = [
  { id: 'whatsapp', name: 'WhatsApp', icon: 'W' },
  { id: 'infinix', name: 'Infinix ID', icon: 'i' },
  { id: 'facebook', name: 'Facebook', icon: 'f' },
  { id: 'gmail', name: 'Gmail', icon: 'M' },
  { id: 'messages', name: '信息', icon: '•••' },
  { id: 'spotify', name: 'Spotify', icon: '◖' },
  { id: 'instagram', name: 'Instagram', icon: '◎' }
]
const optionPages = {
  dial: { key: 'dialStyle', options: ['动态表盘', '简约表盘', '数字表盘'] },
  timeout: { key: 'screenTimeout', options: ['5 秒', '10 秒', '15 秒', '30 秒', '60 秒'] },
  brightness: { key: 'backlightLevel', options: ['等级 1', '等级 2', '等级 3', '等级 4', '等级 5', '等级 6', '等级 7', '等级 8', '等级 9', '等级 10'] },
  returnTime: { key: 'returnHomeTime', options: ['5 秒', '10 秒', '15 秒', '30 秒', '60 秒'] },
  musicApp: { key: 'musicApp', options: ['Boomplay Lite', 'Spotify', 'YouTube Music'] },
  photoSize: { key: 'photoSize', options: ['3264×2448', '2560×1920', '1920×1080'] }
}
const currentOptions = computed(() => optionPages[page.value]?.options || [])
const currentOptionValue = computed(() => {
  const key = optionPages[page.value]?.key
  return key ? backScreen.settings[key] : ''
})

function chooseOption(value) {
  const key = optionPages[page.value]?.key
  if (key) backScreen.settings[key] = value
  page.value = 'main'
}

function toggleNotificationApp(id) {
  const selected = backScreen.settings.notificationAppIds
  backScreen.settings.notificationAppIds = selected.includes(id)
    ? selected.filter((appId) => appId !== id)
    : [...selected, id]
}

function handleBack() {
  if (page.value === 'main') emit('back')
  else page.value = 'main'
}
</script>

<template>
  <div class="back-screen-settings-page">
    <GlassNavBar overlay :title="title" @back="handleBack" />

    <div v-if="page === 'main'" class="back-screen-settings-scroll scrollable">
      <div class="back-screen-master settings-card">
        <span>灵动背屏</span>
        <ToggleSwitch v-model="backScreen.isScreenOn" color="blue" aria-label="灵动背屏开关" />
      </div>

      <section class="back-screen-settings-section">
        <h3>显示设置</h3>
        <div class="settings-card">
          <button class="back-screen-setting-row" type="button" @click="page = 'dial'">
            <span>表盘</span><span class="setting-value">{{ backScreen.settings.dialStyle }}<i class="chevron"></i></span>
          </button>
          <button class="back-screen-setting-row has-subtitle" type="button" @click="page = 'timeout'">
            <span>屏幕超时<small>{{ backScreen.settings.screenTimeout }}</small></span><i class="chevron"></i>
          </button>
          <button class="back-screen-setting-row has-subtitle" type="button" @click="page = 'brightness'">
            <span>背光等级<small>{{ backScreen.settings.backlightLevel }}</small></span><i class="chevron"></i>
          </button>
          <button class="back-screen-setting-row has-subtitle last" type="button" @click="page = 'returnTime'">
            <span>返回首页时间<small>{{ backScreen.settings.returnHomeTime }}</small></span><i class="chevron"></i>
          </button>
        </div>
      </section>

      <section class="back-screen-settings-section">
        <h3>亮屏设置</h3>
        <div class="settings-card">
          <div class="back-screen-toggle-row">
            <span>随主屏<small>副屏随主屏亮灭</small></span>
            <ToggleSwitch v-model="backScreen.settings.followMainDisplay" color="blue" aria-label="随主屏" />
          </div>
          <div class="back-screen-toggle-row has-divider">
            <span>翻转亮屏<small>翻转手机时点亮背屏</small></span>
            <ToggleSwitch v-model="backScreen.settings.flipToWake" color="blue" aria-label="翻转亮屏" />
          </div>
          <div class="back-screen-toggle-row has-divider last">
            <span>双击亮屏<small>灭屏状态下双击背屏唤醒</small></span>
            <ToggleSwitch v-model="backScreen.settings.doubleTapToWake" color="blue" aria-label="双击亮屏" />
          </div>
        </div>
      </section>

      <section class="back-screen-settings-section">
        <h3>通话设置</h3>
        <div class="settings-card">
          <div class="back-screen-toggle-row last">
            <span>通话提示<small>来电时背屏自动亮起并显示通话信息。</small></span>
            <ToggleSwitch v-model="backScreen.settings.callHintEnabled" color="blue" aria-label="通话提示" />
          </div>
        </div>
      </section>

      <section class="back-screen-settings-section">
        <h3>通知设置</h3>
        <div class="settings-card">
          <div class="back-screen-toggle-row has-divider">
            <span>通知提示<small>表盘上显示小红点，表示有通知</small></span>
            <ToggleSwitch v-model="backScreen.settings.notificationHintEnabled" color="blue" aria-label="通知提示" />
          </div>
          <button class="back-screen-setting-row has-subtitle last" type="button" @click="page = 'notificationApps'">
            <span>应用选择<small>选择可将通知显示在背屏的应用</small></span><i class="chevron"></i>
          </button>
        </div>
      </section>

      <section class="back-screen-settings-section">
        <h3>音乐设置</h3>
        <div class="settings-card">
          <div class="back-screen-toggle-row has-divider">
            <span>打开音乐应用<small>允许从背屏打开音乐控制</small></span>
            <ToggleSwitch v-model="backScreen.settings.musicEnabled" color="blue" aria-label="打开音乐应用" />
          </div>
          <button class="back-screen-setting-row has-subtitle last" type="button" @click="page = 'musicApp'">
            <span>选择音乐应用<small>{{ backScreen.settings.musicApp }}</small></span><i class="chevron"></i>
          </button>
        </div>
      </section>

      <section class="back-screen-settings-section">
        <h3>相机设置</h3>
        <div class="settings-card">
          <div class="back-screen-toggle-row has-divider">
            <span>拍照声音<small>拍照时是否播放提示音</small></span>
            <ToggleSwitch v-model="backScreen.settings.cameraShutterSound" color="blue" aria-label="拍照声音" />
          </div>
          <button class="back-screen-setting-row has-subtitle last" type="button" @click="page = 'photoSize'">
            <span>后摄像头照片大小<small>{{ backScreen.settings.photoSize }}</small></span><i class="chevron"></i>
          </button>
        </div>
      </section>
      <div class="back-screen-settings-bottom-space"></div>
    </div>

    <div v-else-if="page === 'notificationApps'" class="back-screen-settings-scroll scrollable sub-settings-scroll">
      <p class="back-screen-settings-hint">选择允许显示在灵动背屏上的应用通知</p>
      <div class="settings-card">
        <button v-for="app in notificationApps" :key="app.id" class="back-screen-setting-row app-choice-row" type="button" @click="toggleNotificationApp(app.id)">
          <span class="app-choice-icon" :class="`app-${app.id}`">{{ app.icon }}</span>
          <span class="app-choice-name">{{ app.name }}</span>
          <span class="app-check" :class="{ selected: backScreen.settings.notificationAppIds.includes(app.id) }">✓</span>
        </button>
      </div>
    </div>

    <div v-else class="back-screen-settings-scroll scrollable sub-settings-scroll">
      <p class="back-screen-settings-hint">选择背屏使用的{{ page === 'dial' ? '表盘样式' : page === 'musicApp' ? '音乐应用' : page === 'photoSize' ? '照片尺寸' : '时间' }}</p>
      <div class="settings-card option-card">
        <button v-for="option in currentOptions" :key="option" class="back-screen-setting-row option-row" type="button" @click="chooseOption(option)">
          <span>{{ option }}</span>
          <span class="option-check" :class="{ selected: currentOptionValue === option }">✓</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-screen-settings-page { position:relative; display:flex; flex-direction:column; height:100%; overflow:hidden; background:#f0f1f2; color:#111; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC",sans-serif; }
.back-screen-settings-scroll { flex:1; min-height:0; padding:calc(var(--nav-h) + 8px) 16px 0; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
.back-screen-settings-page :deep(.glass-nav-bar) { z-index:5; }
.settings-card { overflow:hidden; margin:0 0 22px; border-radius:16px; background:#fff; }
.back-screen-master { display:flex; align-items:center; justify-content:space-between; min-height:76px; margin-top:4px; padding:0 17px; font-size:18px; font-weight:550; }
.back-screen-settings-section h3 { margin:27px 0 12px 16px; color:#8e8e93; font-size:15px; line-height:1.2; font-weight:450; }
.back-screen-setting-row,.back-screen-toggle-row { position:relative; display:flex; width:100%; min-height:62px; align-items:center; justify-content:space-between; gap:14px; padding:13px 17px; border:0; color:#111; background:#fff; text-align:left; font:inherit; }
.back-screen-setting-row { cursor:pointer; }
.back-screen-setting-row:active { background:#f6f6f8; }
.back-screen-setting-row.has-subtitle,.back-screen-toggle-row { min-height:78px; }
.back-screen-setting-row span:first-child,.back-screen-toggle-row span:first-child { min-width:0; display:flex; flex-direction:column; gap:5px; font-size:17px; line-height:1.22; font-weight:520; }
.back-screen-setting-row small,.back-screen-toggle-row small { color:#99999e; font-size:13px; line-height:1.35; font-weight:400; }
.back-screen-setting-row.has-subtitle .chevron { align-self:center; }
.setting-value { display:flex; align-items:center; gap:16px; color:#94949a; font-size:14px; }
.chevron { width:9px; height:9px; flex:none; border-top:2px solid #b5b5b8; border-right:2px solid #b5b5b8; transform:rotate(45deg); }
.has-divider::after,.back-screen-setting-row:not(.last)::after { position:absolute; right:17px; bottom:0; left:17px; height:1px; content:''; background:#e7e7e9; }
.back-screen-toggle-row :deep(.toggle-switch) { width:46px; height:26px; background:#dedee0; }
.back-screen-toggle-row :deep(.toggle-switch.on) { background:#0878f9; }
.back-screen-settings-bottom-space { height:24px; flex:none; }
.sub-settings-scroll { padding-top:calc(var(--nav-h) + 12px); }
.back-screen-settings-hint { margin:4px 16px 14px; color:#8e8e93; font-size:14px; }
.app-choice-row { justify-content:flex-start; min-height:68px; }
.app-choice-row::after,.option-row:not(:last-child)::after { position:absolute; right:17px; bottom:0; left:17px; height:1px; content:''; background:#e7e7e9; }
.app-choice-icon { display:grid; width:36px; height:36px; flex:none; place-items:center; border-radius:11px; color:white; background:#18b66a; font-size:18px; font-weight:700; }
.app-choice-icon.app-facebook { background:#1877f2; }
.app-choice-icon.app-gmail { background:#ea4335; }
.app-choice-icon.app-messages { background:#3fcb77; }
.app-choice-icon.app-instagram { background:linear-gradient(135deg,#8143cb,#e8427b,#f5a746); }
.app-choice-name { flex:1; font-size:16px; }
.app-check,.option-check { display:grid; width:21px; height:21px; flex:none; place-items:center; border:1.5px solid #c7c7cc; border-radius:50%; color:transparent; font-size:13px; }
.app-check.selected,.option-check.selected { border-color:#0878f9; color:#fff; background:#0878f9; }
.option-card { margin-top:4px; }
.option-row { min-height:58px; font-size:16px; }
</style>
