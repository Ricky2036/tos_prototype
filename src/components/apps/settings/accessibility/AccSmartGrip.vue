<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-grip.png'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 智感握姿（真机 com.transsion.microintelligence SmartGripSettingActivity）
 * 主页「动作与手势」与「智感握姿」两个入口落到**同一个 Activity**，标题都是「智感握姿」。
 * 无分页圆点；行内开关默认开；底部两条脚注为真机原文。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()
</script>

<template>
  <SubPageShell title="智感握姿" @back="emit('back')">
    <div class="acc-page">
      <div class="acc-illus">
        <img :src="illus" class="acc-illus-img" alt="" draggable="false" />
        <div class="acc-illus-title">操作跟随握姿</div>
        <div class="acc-illus-desc">通话场景下，根据你的握持方向在侧边显示通话快捷操作，方便单手使用。</div>
      </div>

      <div class="acc-card" data-testid="grip-card">
        <ListCell title="智感握姿" last>
          <template #right>
            <ToggleSwitch
              :model-value="acc.smartGrip"
              color="blue"
              @update:model-value="v => acc.setFlag('smartGrip', v)"
            />
          </template>
        </ListCell>
      </div>

      <div class="acc-footnote acc-footnote-outside">
        <div class="acc-footnote-line">1. 支持电话、Google Dialer、WhatsApp、Telegram、Messenger、Line。</div>
        <div class="acc-footnote-line">2. 电话需前往「电话 &gt; 设置 &gt; 来电显示，将提醒方式设置为弹窗显示，体验智感握姿。</div>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
/* 真机单行卡实测 61 设计 px（同一页的分组行只有 52）：本包局部标定，不动共享 ListCell */
.acc-card :deep(.list-cell) {
  min-height: 61px;
}

/* 脚注距卡片底 11.7 设计 px（比卡片间距 16 还小），抵掉 6px */
.acc-footnote-outside {
  padding-top: 0;
  margin-top: -6px;
}

/* 本页标题真机距插图带底 30.5（截屏页是 22.9，两个系统应用不同），局部标注 */
.acc-illus-title {
  margin-top: 30px;
}
</style>
