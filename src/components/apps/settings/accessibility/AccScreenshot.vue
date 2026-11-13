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
 * 顶部横向插图真机 4 点；页 1/2 的文案已采（截取全屏 / 区域截屏），
 * 页 3/4 画面未采 → 沿用同一示意画、文案取自下方同名行（采集包标 unknown）。
 * 分组「截屏方式」四项默认全开。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [
  { src: illus, title: '截取全屏', desc: '三指下滑快速截取全屏。' },
  { src: illus, title: '区域截屏', desc: '三指长按触发区域截屏。' },
  { src: illus, title: '分享后删除原图', desc: '分享完成后自动删除原图。' },
  { src: illus, title: '编辑后删除原图', desc: '编辑完成后自动删除原图。' }
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
