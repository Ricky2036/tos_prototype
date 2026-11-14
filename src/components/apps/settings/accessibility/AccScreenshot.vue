<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-screenshot.png'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 截屏（真机 com.transsion.screencapture ScreenshotSettingsActivity）
 * 顶部横向插图真机 4 点；页 1/2 的文案与画面已采（截取全屏 / 区域截屏），
 * 页 3/4 未采 → 只保留圆点数（=4），不再编造成「分享后删除原图/编辑后删除原图」两页。
 * 分组「截屏方式」四项默认全开。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

// 只有页 1/2 的画面与文案取证；页 3/4 未采，圆点数按真机保留 4 个，不编造画面
const pages = [
  { src: illus, title: '截取全屏', desc: '三指下滑快速截取全屏。' },
  { src: illus, title: '区域截屏', desc: '三指长按触发区域截屏。' }
]
</script>

<template>
  <SubPageShell title="截屏" @back="emit('back')">
    <div class="acc-page">
      <AccCarousel :pages="pages" :dots="4" />

      <div class="acc-group-title">截屏方式</div>
      <div class="acc-card" data-testid="shot-card">
        <ListCell title="截取全屏" subtitle="三指下滑快速截取全屏。">
          <template #right>
            <ToggleSwitch
              :model-value="acc.shotFull"
              color="blue"
              @update:model-value="v => acc.setFlag('shotFull', v)"
            />
          </template>
        </ListCell>
        <ListCell title="区域截屏" subtitle="三指长按触发区域截屏。">
          <template #right>
            <ToggleSwitch
              :model-value="acc.shotRegion"
              color="blue"
              @update:model-value="v => acc.setFlag('shotRegion', v)"
            />
          </template>
        </ListCell>
        <ListCell title="分享后删除原图">
          <template #right>
            <ToggleSwitch
              :model-value="acc.shotDelAfterShare"
              color="blue"
              @update:model-value="v => acc.setFlag('shotDelAfterShare', v)"
            />
          </template>
        </ListCell>
        <ListCell title="编辑后删除原图" last>
          <template #right>
            <ToggleSwitch
              :model-value="acc.shotDelAfterEdit"
              color="blue"
              @update:model-value="v => acc.setFlag('shotDelAfterEdit', v)"
            />
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>
