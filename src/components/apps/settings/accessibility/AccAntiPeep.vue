<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import illus1 from '../../../../assets/icons/accessibility/illus/illus-peep1.png'
import illus2 from '../../../../assets/icons/accessibility/illus/illus-peep2.png'

/**
 * 防偷窥（真机 com.transsion.zahooc / com.transsion.peekproof.PeekProofActivity）
 *
 * 结构（2026-11-14 采集）：插图 2 点、卡片一张、底部 XGuard 水印
 *   页 1「拖拽底部角标，调整遮罩区域的范围。」
 *   页 2「点击透明度按钮，调节遮罩区域的可见度。」
 *   两张都是手绘图（手机 + 手部操作），逐张按真机截图裁切，未做重绘
 *   卡：防偷窥 + 说明 + 开关（默认关）
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [
  { src: illus1, desc: '拖拽底部角标，调整遮罩区域的范围。' },
  { src: illus2, desc: '点击透明度按钮，调节遮罩区域的可见度。' }
]
</script>

<template>
  <SubPageShell title="防偷窥" @back="emit('back')">
    <div class="acc-page peep-page">
      <AccCarousel :pages="pages" :dots="2" />

      <div class="acc-card">
        <ListCell
          title="防偷窥"
          subtitle="使用屏幕遮罩为手机屏幕提供即时遮挡，遮蔽不想被看见的内容。"
          last
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.antiPeep"
              color="blue"
              @update:model-value="v => acc.setFlag('antiPeep', v)"
            />
          </template>
        </ListCell>
      </div>

      <div class="peep-watermark">
        <span class="peep-watermark-badge">✓</span>
        <span>XGuard</span>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.peep-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--nav-h) - 16px);
  box-sizing: border-box;
}

/* 本页卡片行比主页略高：真机标题+两行说明共 285 物理 px ≈ 85 设计 px */
.acc-card :deep(.list-cell) {
  min-height: 85px;
}

.peep-watermark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-bottom: 8px;
  font-size: 11px;
  color: #8E8E93;
}

.peep-watermark-badge {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #21A35B;
  color: #fff;
  font-size: 9px;
  line-height: 13px;
  text-align: center;
}
</style>
