<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import AccAppToggleList from './AccAppToggleList.vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 游戏管理（真机 com.transsion.smartpanel ProxyActivityStandard2）
 *
 * 结构（2026-11-14 采集）：顶部一行说明「请选择以游戏模式运行的应用。」+ 一张应用卡
 * 应用清单按真机顺序（拼音序）原样排，全部为关；行高 174 物理 px = 52 设计 px，无搜索框。
 * 名单只截到「海尔智家」，再往下没采 → 不复刻没见过的行。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const APPS = [
  { name: '哔哩哔哩', slug: 'bilibili' },
  { name: '大众点评', slug: 'dianping' },
  { name: '蛋仔派对', slug: 'eggy' },
  { name: '叮咚买菜', slug: 'dingdong' },
  { name: '钉钉', slug: 'dingtalk' },
  { name: '动卡空间', slug: 'dongka' },
  { name: '抖音极速版', slug: 'douyinlite' },
  { name: '抖音商城', slug: 'douyinshop' },
  { name: '豆包', slug: 'doubao' },
  { name: '发现精彩', slug: 'faxianjingcai' },
  { name: '番茄免费小说', slug: 'fanqie' },
  { name: '高德地图', slug: 'amap' },
  { name: '海尔智家', slug: 'haier' }
]
</script>

<template>
  <SubPageShell title="游戏管理" @back="emit('back')">
    <div class="acc-page game-manage">
      <p class="manage-hint">请选择以游戏模式运行的应用。</p>
      <AccAppToggleList
        testid="game-apps"
        :apps="APPS"
        :model-value="acc.gameApps"
        @update:model-value="list => acc.setAppList('game', list)"
      />
    </div>
  </SubPageShell>
</template>

<style scoped>
/* 说明行：真机文字左缘 0（比对卡片再左 0）、距导航栏底 8、字号 14 */
.manage-hint {
  margin: 0 0 12px 4px;
  font-size: 14px;
  line-height: 20px;
  color: #111;
}
</style>
