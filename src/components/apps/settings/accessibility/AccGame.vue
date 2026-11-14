<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import AccPending from './AccPending.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-game.png'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 游戏模式（真机 com.transsion.smartpanel ProxyActivityStandard）
 * 插图 2 点，页 1 文案「游戏中可侧滑呼出游戏助手。」；页 2 未采。
 * 卡 1：游戏模式（开）/ 游戏管理；分组「游戏服务」：游戏助手面板（开）/ XArena。
 * unknown：游戏管理、XArena 两个深层页未采 → 取证缺口页。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [{ src: illus, desc: '游戏中可侧滑呼出游戏助手。' }]
const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="该页属于游戏服务的配置层，需单独采集后再复刻。"
    @back="pending = ''"
  />
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
          @click="pending = '游戏管理'"
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
          title="XArena"
          subtitle="更多 XArena 相关设置。"
          chevron
          last
          @click="pending = 'XArena'"
        />
      </div>
    </div>
  </SubPageShell>
</template>
