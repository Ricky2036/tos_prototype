<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import { computed, ref } from 'vue'
import {
  useAccessibilitySettingsStore,
  RECORDING_RESOLUTIONS,
  RECORDING_FRAME_RATES
} from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 录屏（真机 com.transsion.screenrecorder RecorderSettingsActivity）
 *
 * 分组「声音」：录制系统声音（开）/ 录制麦克风声音（关）
 * 无标题卡组：清晰度（超清 1080P）/ 帧率（低帧率 24FPS）/ 显示点按效果（开）/ 录屏勿扰（关）
 *
 * 清晰度 / 帧率 的弹层形态与档位 2026-11-14 补采到位：
 *   两个都是**底部单选弹层**（标题居中 + 若干选项 + 取消胶囊），选项圈是空心圆环、选中变蓝。
 *   清晰度 = 超高清 (2K) / 超清 (1080P) / 高清 (720P)
 *   帧率   = 高帧率 (60 FPS) / 低帧率 (24 FPS)     ← 真机没有 30FPS
 * 复用了仓里既有的 `SheetOptionPicker`（同一个形状），没有另造弹层。
 *
 * 值的排版：真机值列只有 ~78 设计 px 宽，「低帧率 (24 FPS)」会折成两行 —— 这里照原样折。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const sheet = ref('') // '' | 'resolution' | 'frameRate'

const resolutionOptions = computed(() => RECORDING_RESOLUTIONS.map(v => ({ value: v, label: v })))
const frameRateOptions = computed(() => RECORDING_FRAME_RATES.map(v => ({ value: v, label: v })))

function pickResolution(v) {
  acc.setRecResolution(v)
}
function pickFrameRate(v) {
  acc.setRecFrameRate(v)
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
          data-testid="rec-resolution"
          title="清晰度"
          chevron
          @click="sheet = 'resolution'"
        >
          <template #value>
            <span class="rec-value">{{ acc.recResolution }}</span>
          </template>
        </ListCell>
        <ListCell
          data-testid="rec-frame-rate"
          title="帧率"
          subtitle="帧率越高画面越流畅，可能增加耗电。"
          chevron
          @click="sheet = 'frameRate'"
        >
          <template #value>
            <span class="rec-value">{{ acc.recFrameRate }}</span>
          </template>
        </ListCell>
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
      :visible="sheet === 'resolution'"
      title="清晰度"
      :options="resolutionOptions"
      :model-value="acc.recResolution"
      @pick="pickResolution"
      @close="sheet = ''"
    />
    <SheetOptionPicker
      :visible="sheet === 'frameRate'"
      title="帧率"
      :options="frameRateOptions"
      :model-value="acc.recFrameRate"
      @pick="pickFrameRate"
      @close="sheet = ''"
    />
  </SubPageShell>
</template>

<style scoped>
/* 真机值列 ~78 设计 px 宽，长值会折两行（「低帧率 (24」/「FPS)」） */
.rec-value {
  display: block;
  max-width: 80px;
  text-align: right;
  /* 真机值列：71 物理宽的单行「超清 (1080P)」→ 字号约 13（14.5 会提前折行） */
  font-size: 13px;
  line-height: 16px;
  color: #8E8E93;
  white-space: normal;
}
</style>
