<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-float.png'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 应用分屏（真机 com.transsion.ossettingsext SplitSettingsMainActivity）
 * 主页「小窗」与「应用分屏」两个入口落到**同一个 Activity**，标题都是「应用分屏」。
 * 顶部插图真机 2 点，页 1 文案「Smart Panel 中开启分屏 / 拖动应用到屏幕内。」；
 * 页 2 未采 → 沿用同一示意画。行「双指分屏」默认关。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [
  { src: illus, title: 'Smart Panel 中开启分屏', desc: '拖动应用到屏幕内。' }
]
</script>

<template>
  <SubPageShell title="应用分屏" @back="emit('back')">
    <div class="acc-page">
      <AccCarousel :pages="pages" :dots="2" />

      <div class="acc-card" data-testid="split-card">
        <ListCell
          title="双指分屏"
          subtitle="沿屏幕中间区域双指横滑（横屏时双指竖滑）开启分屏。"
          last
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.splitDualFinger"
              color="blue"
              @update:model-value="v => acc.setFlag('splitDualFinger', v)"
            />
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>
