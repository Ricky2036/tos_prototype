<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import { ref } from 'vue'
import {
  RECORDING_FRAME_RATES, RECORDING_RESOLUTIONS, useAccessibilitySettingsStore
} from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 录屏（真机 SET-ACC-01 采集：com.transsion.screenrecorder RecorderSettingsActivity）
 * 分组「声音」：录制系统声音（开）/ 录制麦克风声音（关）
 * 无标题卡组：清晰度（超清 1080P）/ 帧率（低帧率 24FPS）/ 显示点按效果（开）/ 录屏勿扰（关）
 * unknown：清晰度、帧率点开后的控件形态未采，这里按「底部单选弹层」实现，选项为同族候选值。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const picker = ref(null) // 'resolution' | 'frameRate' | null

const resolutionOptions = RECORDING_RESOLUTIONS.map(v => ({ value: v, label: v }))
const frameRateOptions = RECORDING_FRAME_RATES.map(v => ({ value: v, label: v }))

function onPick(value) {
  if (picker.value === 'resolution') acc.setRecResolution(value)
  if (picker.value === 'frameRate') acc.setRecFrameRate(value)
  picker.value = null
}
</script>

<template>
  <SubPageShell title="录屏" @back="emit('back')">
    <div class="acc-page">
      <div class="acc-group-title">声音</div>
      <div class="acc-card" data-testid="rec-sound-card">
        <ListCell
          title="录制系统声音"
          subtitle="系统声音包含媒体、游戏等声音。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.recSystemSound"
              color="blue"
              @update:model-value="v => acc.setFlag('recSystemSound', v)"
            />
          </template>
        </ListCell>
        <ListCell title="录制麦克风声音" last>
          <template #right>
            <ToggleSwitch
              :model-value="acc.recMicSound"
              color="blue"
              @update:model-value="v => acc.setFlag('recMicSound', v)"
            />
          </template>
        </ListCell>
      </div>

      <div class="acc-card">
        <ListCell
          title="清晰度"
          :value="acc.recResolution"
          chevron
          @click="picker = 'resolution'"
        />
        <ListCell
          title="帧率"
          subtitle="帧率越高画面越流畅，可能增加耗电。"
          :value="acc.recFrameRate"
          chevron
          @click="picker = 'frameRate'"
        />
        <ListCell title="显示点按效果">
          <template #right>
            <ToggleSwitch
              :model-value="acc.recTapEffect"
              color="blue"
              @update:model-value="v => acc.setFlag('recTapEffect', v)"
            />
          </template>
        </ListCell>
        <ListCell
          title="录屏勿扰"
          subtitle="录制屏幕时屏蔽悬浮通知。"
          last
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.recDnd"
              color="blue"
              @update:model-value="v => acc.setFlag('recDnd', v)"
            />
          </template>
        </ListCell>
      </div>
    </div>

    <SheetOptionPicker
      :visible="Boolean(picker)"
      :title="picker === 'frameRate' ? '帧率' : '清晰度'"
      :options="picker === 'frameRate' ? frameRateOptions : resolutionOptions"
      :model-value="picker === 'frameRate' ? acc.recFrameRate : acc.recResolution"
      @pick="onPick"
      @close="picker = null"
    />
  </SubPageShell>
</template>
