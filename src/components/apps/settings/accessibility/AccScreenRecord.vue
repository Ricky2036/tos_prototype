<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccPending from './AccPending.vue'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 录屏（真机 com.transsion.screenrecorder RecorderSettingsActivity）
 * 分组「声音」：录制系统声音（开）/ 录制麦克风声音（关）
 * 无标题卡组：清晰度（超清 1080P）/ 帧率（低帧率 24FPS）/ 显示点按效果（开）/ 录屏勿扰（关）
 *
 * 清晰度、帧率两行的**选择器形态与完整档位未取证**（2026-11-14 设备离线，采集阻塞）。
 * 之前这里按同族猜了 720P/480P、30/60FPS 的底部单选弹层，已撤掉：点进去是明确的缺口页，
 * 采集补齐后再换成真机控件。显示值仍是真机实测值，不做改动。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="该行的选择器形态与完整候选档位尚未真机取证（2026-11-14 设备离线阻塞）；此前按同族猜的档位已撤销。"
    @back="pending = ''"
  />
  <SubPageShell v-else title="录屏" @back="emit('back')">
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
          :value="acc.recResolution"
          chevron
          @click="pending = '清晰度'"
        />
        <ListCell
          data-testid="rec-frame-rate"
          title="帧率"
          subtitle="帧率越高画面越流畅，可能增加耗电。"
          :value="acc.recFrameRate"
          chevron
          @click="pending = '帧率'"
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
  </SubPageShell>
</template>
