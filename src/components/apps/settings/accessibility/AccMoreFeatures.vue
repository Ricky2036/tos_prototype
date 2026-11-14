<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccPending from './AccPending.vue'
import { ref } from 'vue'
import './acc.css'

/**
 * 更多功能（真机 com.transsion.smartpanel ProxyActivityStandard，社交助手的子功能列表）
 *
 * 结构（2026-11-14 采集）：一张白卡、5 行、每行 64 设计 px（215 物理 px）
 *   闪光灯提醒 + 说明 + 开关 —— **整行置灰**：本机未装 WhatsApp，依赖缺失时真机就是这个状态
 *   通话摘要 / 双向翻译 / 通话录音 / 无痕浏览 —— 各带一行说明 + 右箭头
 *
 * 未复刻：进入本页时真机会弹一个「提醒 · 安装 WhatsApp」的依赖弹窗（按钮会跳应用商店）。
 * 那是第三方依赖的安装引导，不是这页本身的设置项，本轮不做，已在采集包记为 known-gap。
 */
const emit = defineEmits(['back'])

const ROWS = [
  { title: '通话摘要', subtitle: '智能分析通话内容，生成重点信息摘要。' },
  { title: '双向翻译', subtitle: '双向语音翻译通话，并提供实时字幕。' },
  { title: '通话录音', subtitle: '通过社交助手保存的社交软件通话录音。' },
  { title: '无痕浏览', subtitle: '私密阅读WhatsApp消息。' }
]

const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="社交助手的下一层配置页，2026-11-14 未采集；且其行为依赖本机已安装 WhatsApp。"
    @back="pending = ''"
  />
  <SubPageShell v-else title="更多功能" @back="emit('back')">
    <div class="acc-page more-page">
      <div class="acc-card" data-testid="more-features-card">
        <ListCell
          title="闪光灯提醒"
          subtitle="WhatsApp 来电时，设备闪光提醒。"
          disabled
          data-testid="more-flash"
        >
          <template #right>
            <ToggleSwitch :model-value="false" color="blue" />
          </template>
        </ListCell>
        <ListCell
          v-for="(row, i) in ROWS"
          :key="row.title"
          :title="row.title"
          :subtitle="row.subtitle"
          chevron
          :last="i === ROWS.length - 1"
          @click="pending = row.title"
        />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
/* 真机本页每行 215 物理 px = 64 设计 px（比主页的 67 略矮），只在本页收紧 */
.acc-card :deep(.list-cell:has(.lc-subtitle)) {
  min-height: 64px;
}

/* 真机卡顶在设计 y=98，外壳默认从 110 开始，收回 12 */
.more-page {
  margin-top: -12px;
}
</style>
