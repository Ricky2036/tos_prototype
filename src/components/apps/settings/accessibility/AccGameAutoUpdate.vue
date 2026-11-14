<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import './acc.css'

/**
 * 游戏自动更新（真机 com.transsion.smartpanel ProxyActivityStandard4）
 *
 * 本机没装任何被 XArena 纳管的游戏 ⇒ 真机就是一张空白页，内容区正中一行灰字「无游戏」。
 * 截图里「无游戏」上方还有两个小圆点，是空态插图未加载出来的残影，不是界面元素，不复刻。
 */
const emit = defineEmits(['back'])
</script>

<template>
  <SubPageShell title="游戏自动更新" @back="emit('back')">
    <div class="auto-update-empty" data-testid="auto-update-empty">无游戏</div>
  </SubPageShell>
</template>

<style scoped>
/* 真机：文字中心落在内容区正中（1590 物理 px ≈ 474 设计 px） */
.auto-update-empty {
  position: absolute;
  inset: var(--nav-h) 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #8E8E93;
  pointer-events: none;
}
</style>
