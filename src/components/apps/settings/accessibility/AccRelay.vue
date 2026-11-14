<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import AccPending from './AccPending.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-relay.png'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 中转站（真机 com.transsion.smartpanel TransferSettingsPluginActivity，本页走 ProxyActivityStandard）
 *
 * 插图 3 点，页 1 =「拖入中转站 / 拖拽文本、图片、文件至悬浮面板，即可打开中转站暂存。」
 * 卡：中转站（开关，默认关）/ 功能介绍（chevron）
 * 「功能介绍」是另一层说明页，2026-11-14 未采集 → 缺口页。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

/**
 * 只有页 1 有真机画面。页 2、3 的画面与文案都没采到 ⇒ 只放实测的页 1，
 * 圆点数照实测 3（与其余子页同一处理方式，不做臆造画面）。
 */
const pages = [
  { src: illus, title: '拖入中转站', desc: '拖拽文本、图片、文件至悬浮面板，即可打开中转站暂存。' }
]

const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="「功能介绍」是独立一层说明页，2026-11-14 未采到画面与文案。"
    @back="pending = ''"
  />
  <SubPageShell v-else title="中转站" @back="emit('back')">
    <div class="acc-page">
      <AccCarousel :pages="pages" :dots="3" />

      <div class="acc-card" data-testid="relay-card">
        <ListCell title="中转站" data-testid="relay-switch">
          <template #right>
            <ToggleSwitch
              :model-value="acc.relayEnabled"
              color="blue"
              @update:model-value="v => acc.setFlag('relayEnabled', v)"
            />
          </template>
        </ListCell>
        <ListCell title="功能介绍" chevron last @click="pending = '功能介绍'" />
      </div>
    </div>
  </SubPageShell>
</template>
