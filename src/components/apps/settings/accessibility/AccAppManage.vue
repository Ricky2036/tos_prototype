<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import AccAppToggleList from './AccAppToggleList.vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 软件管理（侧边栏「可用的应用」的落地页，入口文案与落地标题不一致是真机原样）
 * 真机 com.transsion.videomode AppManagementActivity
 *
 * 结构（2026-11-14 采集，两屏拼合）：白卡直接顶到导航栏下沿、无说明、无搜索框，
 * 行高 174 物理 px = 52 设计 px，右侧蓝色/灰色开关；默认只有前三项是开的。
 * 顺序按真机原样（拉丁名 + 中文拼音混排），不重排。
 *
 * Epson Smart Panel / 交管12123 两行在截图里被屏幕边裁掉，只留了半截 —— 名字按无障碍树保留，
 * 图标退回仓库标准网格图标（不臆造品牌图标）。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const APPS = [
  { name: 'Google TV', slug: 'googletv' },
  { name: 'Visha播放器', slug: 'visha' },
  { name: 'YouTube', slug: 'youtube' },
  { name: 'AHA Games', slug: 'ahagames' },
  { name: 'AHA Prime', slug: 'ahaprime' },
  { name: 'AI Mate', slug: 'aimate' },
  { name: '哔哩哔哩', slug: 'bilibili' },
  { name: 'Bubblepop Master Pro', slug: 'bubblepop' },
  { name: 'Carlcare', slug: 'carlcare' },
  { name: 'ChatGPT', slug: 'chatgpt' },
  { name: 'Crush Block', slug: 'crushblock' },
  { name: '大众点评', slug: 'dianping' },
  { name: '蛋仔派对', slug: 'eggy' },
  { name: '叮咚买菜', slug: 'dingdong' },
  { name: 'Epson Smart Panel', slug: '' },
  { name: '发现精彩', slug: 'faxianjingcai' },
  { name: '番茄免费小说', slug: 'fanqie' },
  { name: 'FlClash', slug: 'flclash' },
  { name: '高德地图', slug: 'amap' },
  { name: 'Google One', slug: 'googleone' },
  { name: 'Grok', slug: 'grok' },
  { name: '海尔智家', slug: 'haier' },
  { name: '红果免费短剧', slug: 'hongguo' },
  { name: '红外遥控', slug: 'hongwai' },
  { name: '换机助手', slug: 'huanji' },
  { name: 'Hi Translate', slug: 'hitranslate' },
  { name: 'Hola', slug: 'hola' },
  { name: '即刻通知', slug: 'jike' },
  { name: '计算器', slug: 'calculator' },
  { name: '交管12123', slug: '' }
]
</script>

<template>
  <SubPageShell title="软件管理" @back="emit('back')">
    <div class="acc-page app-manage">
      <AccAppToggleList
        testid="sidebar-apps"
        :apps="APPS"
        :model-value="acc.sidebarApps"
        @update:model-value="list => acc.setAppList('sidebar', list)"
      />
    </div>
  </SubPageShell>
</template>

<style scoped>
/* 真机这张卡顶到导航栏下沿（设计 y=98），外壳默认留了 10，这里收回 10 */
.app-manage {
  margin-top: -10px;
}
</style>
