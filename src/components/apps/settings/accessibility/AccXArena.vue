<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccGameAutoUpdate from './AccGameAutoUpdate.vue'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import banner from '../../../../assets/icons/accessibility/illus/xarena-banner.png'

/**
 * XArena（真机 com.transsion.smartpanel ProxyActivityStandard3）
 *
 * 结构（2026-11-14 采集）：
 *   顶部横幅图 328×143 设计 px（真机截图裁切，圆角 12）
 *   居中说明「XArena 可检测设备性能状态，调整相关设置并管理游戏。」
 *   蓝色胶囊按钮「进入 XArena」：296×44，左右再内缩 16
 *   卡：音效（开）/ 游戏自动更新（chevron）/ 游戏状态检测（开）/ 内存管控（关）
 *
 * 「进入 XArena」是**跨应用启动**（拉起 XArena 游戏空间 app），原型里没有这个 app，
 * 所以只还原按钮，不做假跳转 —— 已在采集包记为 known-gap。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

/** 「游戏自动更新」是本站内的一层（真机标题就是「游戏自动更新」），就地进栈 */
const sub = ref(false)
</script>

<template>
  <AccGameAutoUpdate v-if="sub" @back="sub = false" />
  <SubPageShell v-else title="XArena" @back="emit('back')">
    <div class="acc-page xarena-page">
      <img :src="banner" class="xarena-banner" alt="" draggable="false" />

      <p class="xarena-desc">XArena 可检测设备性能状态，调整相关设置并管理游戏。</p>

      <button type="button" class="xarena-enter" data-testid="xarena-enter">进入 XArena</button>

      <div class="acc-card xarena-card">
        <ListCell title="音效" subtitle="XArena 音效控制。">
          <template #right>
            <ToggleSwitch
              :model-value="acc.xarenaSound"
              color="blue"
              @update:model-value="v => acc.setFlag('xarenaSound', v)"
            />
          </template>
        </ListCell>
        <ListCell
          title="游戏自动更新"
          subtitle="息屏充电且连接 WLAN 时，自动更新所选游戏。"
          chevron
          @click="sub = true"
        />
        <ListCell title="游戏状态检测" subtitle="检查游戏前整机情况。">
          <template #right>
            <ToggleSwitch
              :model-value="acc.xarenaStatusCheck"
              color="blue"
              @update:model-value="v => acc.setFlag('xarenaStatusCheck', v)"
            />
          </template>
        </ListCell>
        <ListCell
          title="内存管控"
          subtitle="通过XArena打开游戏，全部后台应用将被清除，不会在游戏中启动。"
          last
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.xarenaMemory"
              color="blue"
              @update:model-value="v => acc.setFlag('xarenaMemory', v)"
            />
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.xarena-page {
  padding-top: 0;
}

.xarena-banner {
  display: block;
  width: 100%;
  height: 143px;
  object-fit: contain;
  border-radius: 12px;
  user-select: none;
  pointer-events: none;
}

/* 说明：真机两行居中，距图底 36.7 设计 px（826→949 物理） */
.xarena-desc {
  margin: 26px 16px 0;
  font-size: 12.5px;
  line-height: 16px;
  color: #8E8E93;
  text-align: center;
}

/* 按钮：真机 296×44、距说明 31（1048→1156 物理），左右各再缩 16 */
.xarena-enter {
  display: block;
  width: calc(100% - 32px);
  height: 44px;
  /* 真机按钮底 388 → 卡顶 436，间距 48 */
  margin: 31px 16px 48px;
  border: none;
  border-radius: 22px;
  background: #3375F6;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.xarena-enter:active {
  background: #2A64D8;
}

/* 真机副标题 12.5/16（13px 会让「息屏充电且连接 WLAN 时…」多折一行） */
.xarena-card :deep(.lc-subtitle) {
  font-size: 12.5px;
  line-height: 16px;
}

/* 本页行高：真机 215 物理 px = 64 设计 px（比主页略矮） */
.xarena-card :deep(.list-cell:has(.lc-subtitle)) {
  min-height: 64px;
}
</style>
