<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import AccGameManage from './AccGameManage.vue'
import AccXArena from './AccXArena.vue'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import illus1 from '../../../../assets/icons/accessibility/illus/illus-game.png'
import illus2 from '../../../../assets/icons/accessibility/illus/illus-game2.png'

/**
 * 游戏模式（真机 com.transsion.smartpanel ProxyActivityStandard）
 *
 * 结构（2026-11-14 采集）：插图 2 点，两页都只有一行灰字说明、没有加粗标题
 *   页 1「游戏中可侧滑呼出游戏助手。」
 *   页 2「可在XArena启动或管理游戏，享受更好的游戏体验。」
 * 卡 1：游戏模式（开）/ 游戏管理
 * 分组「游戏服务」：游戏助手面板（开）/ XArena
 *
 * 游戏管理、XArena 两层 2026-11-14 已采到，直接进本地真页，不再走缺口页。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [
  { src: illus1, desc: '游戏中可侧滑呼出游戏助手。' },
  { src: illus2, desc: '可在XArena启动或管理游戏，享受更好的游戏体验。' }
]

/** 两个深层入口就地进栈，避免把 4 层页面都塞进主壳的 switch */
const sub = ref('')
</script>

<template>
  <AccGameManage v-if="sub === 'manage'" @back="sub = ''" />
  <AccXArena v-else-if="sub === 'xarena'" @back="sub = ''" />
  <SubPageShell v-else title="游戏模式" @back="emit('back')">
    <div class="acc-page">
      <AccCarousel :pages="pages" :dots="2" />

      <div class="acc-card" data-testid="game-card">
        <ListCell
          title="游戏模式"
          subtitle="提供多种辅助能力，提升游戏体验。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.gameEnabled"
              color="blue"
              @update:model-value="v => acc.setFlag('gameEnabled', v)"
            />
          </template>
        </ListCell>
        <ListCell
          data-testid="game-manage"
          title="游戏管理"
          subtitle="设置开启游戏模式的应用。"
          chevron
          last
          @click="sub = 'manage'"
        />
      </div>

      <div class="acc-group-title">游戏服务</div>
      <div class="acc-card">
        <ListCell
          title="游戏助手面板"
          subtitle="游戏中可侧滑呼出，便捷使用各类游戏工具。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.gamePanel"
              color="blue"
              @update:model-value="v => acc.setFlag('gamePanel', v)"
            />
          </template>
        </ListCell>
        <ListCell
          data-testid="game-xarena"
          title="XArena"
          subtitle="更多 XArena 相关设置。"
          chevron
          last
          @click="sub = 'xarena'"
        />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
/* 真机本页行高 215 物理 px = 64 设计 px */
.acc-card :deep(.list-cell:has(.lc-subtitle)) {
  min-height: 64px;
}
</style>
