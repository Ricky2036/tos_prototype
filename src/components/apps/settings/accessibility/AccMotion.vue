<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-motion.png'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 晕动舒缓显示（真机 com.transsion.microintelligence AntiDizzySettingActivity）
 * 插图真机 4 点，页 1 文案「加速或减速 / 屏幕两侧圆点会向后或向前移动。」；
 * 行内开关默认关。其余 3 页画面未采 → 沿用同一示意画。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [
  { src: illus, title: '加速或减速', desc: '屏幕两侧圆点会向后或向前移动。' }
]
</script>

<template>
  <SubPageShell title="晕动舒缓显示" @back="emit('back')">
    <div class="acc-page">
      <AccCarousel :pages="pages" :dots="4" />

      <div class="acc-card" data-testid="motion-card">
        <ListCell title="晕动舒缓显示" last>
          <template #right>
            <ToggleSwitch
              :model-value="acc.motionEnabled"
              color="blue"
              @update:model-value="v => acc.setFlag('motionEnabled', v)"
            />
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>
