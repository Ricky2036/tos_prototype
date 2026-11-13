<script setup>
import { computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useBatteryStore } from '../../../../stores/batteryStore'

/**
 * 省电管理（真机：设置 → 电池与省电 → 省电管理）
 * 证据：`.local-evidence/SET-BAT-01/05b-power-management.*`
 */
const emit = defineEmits(['back', 'open-intro'])
const store = useBatteryStore()

const autoSaver = computed({
  get: () => store.autoSaverEnabled,
  set: (v) => store.patch({ autoSaverEnabled: v })
})
const autoExit = computed({
  get: () => store.autoExitSaver,
  set: (v) => store.patch({ autoExitSaver: v })
})
const refresh60 = computed({
  get: () => store.refresh60,
  set: (v) => store.patch({ refresh60: v })
})
const darkTheme = computed({
  get: () => store.darkTheme,
  set: (v) => store.patch({ darkTheme: v })
})
const autoSleep15 = computed({
  get: () => store.autoSleep15,
  set: (v) => store.patch({ autoSleep15: v })
})
const sleepStandby = computed({
  get: () => store.sleepStandby,
  set: (v) => store.patch({ sleepStandby: v })
})

function setThreshold(e) {
  store.patch({ autoSaverThreshold: Number(e.target.value) })
}
</script>

<template>
  <SubPageShell title="省电管理" @back="emit('back')">
    <div class="section-header">省电模式设置</div>

    <div class="settings-card">
      <ListCell title="自动开启省电模式">
        <template #right><ToggleSwitch v-model="autoSaver" color="blue" /></template>
      </ListCell>

      <div class="threshold-row" :class="{ 'is-disabled': !store.autoSaverEnabled }">
        <div class="threshold-head">
          <span class="threshold-title">自动开启电量</span>
          <span class="threshold-value">{{ store.autoSaverThreshold }}%</span>
        </div>
        <input
          class="threshold-slider"
          type="range"
          min="5"
          max="50"
          step="5"
          :value="store.autoSaverThreshold"
          :disabled="!store.autoSaverEnabled"
          aria-label="自动开启电量"
          @input="setThreshold"
        />
      </div>

      <ListCell
        title="自动退出省电模式"
        subtitle="电量高于 50% 时自动退出省电模式；如进入省电模式时电量已高于50%，则充电至 100% 时自动退出。"
      >
        <template #right><ToggleSwitch v-model="autoExit" color="blue" /></template>
      </ListCell>

      <ListCell title="切换屏幕刷新率至 60Hz">
        <template #right><ToggleSwitch v-model="refresh60" color="blue" /></template>
      </ListCell>

      <ListCell title="启用深色主题">
        <template #right><ToggleSwitch v-model="darkTheme" color="blue" /></template>
      </ListCell>

      <ListCell title="15秒自动息屏" last>
        <template #right><ToggleSwitch v-model="autoSleep15" color="blue" /></template>
      </ListCell>
    </div>

    <div class="intro-line">
      省电模式开启将优化系统设置，部分功能将会限制。
      <button type="button" class="link-btn" @click="emit('open-intro')">了解详情</button>
    </div>

    <div class="section-header">系统优化设置</div>
    <div class="settings-card">
      <ListCell
        title="睡眠待机优化"
        subtitle="为延长续航时间，在您睡眠待机期间智能断开网络连接，可能存在消息延迟但不影响来电和短信。"
        last
      >
        <template #right><ToggleSwitch v-model="sleepStandby" color="blue" /></template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.threshold-row { padding: 12px 16px 16px; }

.threshold-head { display: flex; align-items: center; justify-content: space-between; }

.threshold-title { font-size: 17px; color: #1C1C1E; }

.threshold-value { font-size: 15px; color: #8E8E93; }

.threshold-row.is-disabled .threshold-title,
.threshold-row.is-disabled .threshold-value { color: #C7C7CC; }

.threshold-slider {
  width: 100%;
  margin-top: 14px;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #E5E5EA;
  outline: none;
}

.threshold-slider::-webkit-slider-thumb {
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1.5px solid #C7C7CC;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.threshold-row.is-disabled .threshold-slider::-webkit-slider-thumb {
  background: #F2F2F7;
  border-color: #E5E5EA;
  box-shadow: none;
}

.intro-line {
  font-size: 12px;
  line-height: 18px;
  color: #8E8E93;
  padding: 0 4px 6px;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  color: #0A84FF;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
</style>
