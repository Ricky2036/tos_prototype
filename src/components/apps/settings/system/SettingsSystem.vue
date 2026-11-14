<script setup>
import { computed, inject, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useBackHandler } from '../../../../composables/backRegistry.js'
import { useSystemSettingsStore } from '../../../../stores/systemSettingsStore.js'
import '../../../../styles/layer-transitions.css'

import SystemNavigation from './subpages/SystemNavigation.vue'
import SystemLanguage from './subpages/SystemLanguage.vue'
import SystemPowerButton from './subpages/SystemPowerButton.vue'
import SystemSchedulePower from './subpages/SystemSchedulePower.vue'
import SystemGoogleBackup from './subpages/SystemGoogleBackup.vue'
import SystemUsbBackup from './subpages/SystemUsbBackup.vue'
import SystemResetPhone from './subpages/SystemResetPhone.vue'
import SystemDeveloperOptions from './subpages/SystemDeveloperOptions.vue'
import SystemEnhancedServices from './subpages/SystemEnhancedServices.vue'
import SettingsDateTime from '../dateTime/SettingsDateTime.vue'

const emit = defineEmits(['back', 'navigate'])
const settingsNav = inject('settingsNav', null)
const store = useSystemSettingsStore()

const subPage = ref(null)
const isBack = ref(false)

const powerSummary = computed(() => {
  return store.longPressPower === 'assistant' ? '访问数字助理' : '电源菜单'
})

function openSub(key) {
  isBack.value = false
  subPage.value = key
}

function closeSub() {
  isBack.value = true
  subPage.value = null
}

function openDateTime() {
  if (settingsNav) {
    settingsNav.push('dateTime')
  } else {
    openSub('dateTime')
  }
}

function back() {
  if (subPage.value) {
    closeSub()
    return true
  }
  emit('back')
  if (settingsNav) {
    settingsNav.pop()
  }
  return true
}

defineExpose({ back })
useBackHandler(() => back())
</script>

<template>
  <div class="settings-system-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <SystemNavigation v-if="subPage === 'nav'" key="nav" @back="closeSub" />
      <SystemLanguage v-else-if="subPage === 'language'" key="language" @back="closeSub" />
      <SystemPowerButton v-else-if="subPage === 'powerButton'" key="powerButton" @back="closeSub" />
      <SystemSchedulePower v-else-if="subPage === 'schedulePower'" key="schedulePower" @back="closeSub" />
      <SystemGoogleBackup v-else-if="subPage === 'googleBackup'" key="googleBackup" @back="closeSub" />
      <SystemUsbBackup v-else-if="subPage === 'usbBackup'" key="usbBackup" @back="closeSub" />
      <SystemResetPhone v-else-if="subPage === 'resetPhone'" key="resetPhone" @back="closeSub" />
      <SystemDeveloperOptions v-else-if="subPage === 'devOptions'" key="devOptions" @back="closeSub" />
      <SystemEnhancedServices v-else-if="subPage === 'enhancedServices'" key="enhancedServices" @back="closeSub" />
      <SettingsDateTime v-else-if="subPage === 'dateTime'" key="dateTime" @back="closeSub" />

      <!-- 主页 4 卡 10 行 1 组头 -->
      <div v-else key="main" class="system-main">
        <GlassNavBar overlay title="系统" @back="back" />

        <div class="system-scroll-body scrollable">
          <div class="system-body">
            <!-- 卡片 1（3 行）：系统导航、日期与时间、语言与输入法 -->
            <div class="settings-card system-card" data-test="system-card-1">
              <ListCell
                data-system-row="systemNavigation"
                title="系统导航"
                chevron
                @click="openSub('nav')"
              />
              <ListCell
                data-system-row="dateTime"
                title="日期与时间"
                chevron
                @click="openDateTime"
              />
              <ListCell
                data-system-row="languageInput"
                title="语言与输入法"
                chevron
                last
                @click="openSub('language')"
              />
            </div>

            <!-- 卡片 2（2 行）：按住电源按钮、定时开关机与重启 -->
            <div class="settings-card system-card" data-test="system-card-2">
              <ListCell
                data-system-row="powerButton"
                title="按住电源按钮"
                :value="powerSummary"
                chevron
                @click="openSub('powerButton')"
              />
              <ListCell
                data-system-row="schedulePower"
                title="定时开关机与重启"
                chevron
                last
                @click="openSub('schedulePower')"
              />
            </div>

            <!-- 独立分组标题：备份、重置与恢复 -->
            <div class="group-header" data-test="system-group-header">备份、重置与恢复</div>

            <!-- 卡片 3（3 行）：备份到Google云端硬盘、USB 备份和恢复、重置手机 -->
            <div class="settings-card system-card" data-test="system-card-3">
              <ListCell
                data-system-row="googleBackup"
                title="备份到Google云端硬盘"
                chevron
                @click="openSub('googleBackup')"
              />
              <ListCell
                data-system-row="usbBackup"
                title="USB 备份和恢复"
                chevron
                @click="openSub('usbBackup')"
              />
              <ListCell
                data-system-row="resetPhone"
                title="重置手机"
                chevron
                last
                @click="openSub('resetPhone')"
              />
            </div>

            <!-- 卡片 4（2 行）：开发者选项、增强服务 -->
            <div class="settings-card system-card" data-test="system-card-4">
              <ListCell
                data-system-row="developerOptions"
                title="开发者选项"
                chevron
                @click="openSub('devOptions')"
              />
              <ListCell
                data-system-row="enhancedServices"
                title="增强服务"
                chevron
                last
                @click="openSub('enhancedServices')"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-system-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #F0F2F3;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", sans-serif;
}

.system-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.system-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-top: var(--nav-h);
}

.system-body {
  padding: 12px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.system-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: none;
  border: none;
}

.group-header {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}
</style>
