<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import AccFloatMark from './AccFloatMark.vue'
import AccRelay from './AccRelay.vue'
import AccAppManage from './AccAppManage.vue'
import AccMoreFeatures from './AccMoreFeatures.vue'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import illus from '../../../../assets/icons/accessibility/illus/illus-sidebar.png'

/**
 * 智能侧边栏（真机 com.transsion.smartpanel MainPluginActivity）
 *
 * 结构（2026-11-14 采集）：插图 3 点，页 1 只有一行灰字说明「侧滑呼出侧边栏，快捷开启小窗应用。」
 *   卡 1：智能侧边栏（开）/ 浮标设置 / 最近文件（关）/ 中转站（值「关闭」）/ 振动开关（关）
 *   分组「场景助手」：场景建议 / 视频助手 / 可用的应用 / 社交助手 / 更多功能
 *
 * 四个深层入口 2026-11-14 全部采到，直接进本地真页，不再走缺口页。
 * 「可用的应用」的落地页标题是真机的「软件管理」，入口文案与落地标题不一致是真机原样。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [{ src: illus, desc: '侧滑呼出侧边栏，快捷开启小窗应用。' }]

const sub = ref('')
</script>

<template>
  <AccFloatMark v-if="sub === 'floatmark'" @back="sub = ''" />
  <AccRelay v-else-if="sub === 'relay'" @back="sub = ''" />
  <AccAppManage v-else-if="sub === 'apps'" @back="sub = ''" />
  <AccMoreFeatures v-else-if="sub === 'more'" @back="sub = ''" />
  <SubPageShell v-else title="智能侧边栏" @back="emit('back')">
    <div class="acc-page">
      <AccCarousel :pages="pages" :dots="3" />

      <div class="acc-card" data-testid="sidebar-card">
        <ListCell title="智能侧边栏">
          <template #right>
            <ToggleSwitch
              :model-value="acc.sidebarEnabled"
              color="blue"
              @update:model-value="v => acc.setFlag('sidebarEnabled', v)"
            />
          </template>
        </ListCell>
        <ListCell
          data-testid="sidebar-floatmark"
          title="浮标设置"
          subtitle="设置浮标大小、透明度和位置。"
          chevron
          @click="sub = 'floatmark'"
        />
        <ListCell
          title="最近文件"
          subtitle="快速查看或分享最近的文件。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.sidebarRecent"
              color="blue"
              @update:model-value="v => acc.setFlag('sidebarRecent', v)"
            />
          </template>
        </ListCell>
        <ListCell
          data-testid="sidebar-relay"
          title="中转站"
          subtitle="高效的跨应用内容流转工具。"
          :value="acc.sidebarRelay"
          chevron
          @click="sub = 'relay'"
        />
        <ListCell title="振动开关" last>
          <template #right>
            <ToggleSwitch
              :model-value="acc.sidebarVibrate"
              color="blue"
              @update:model-value="v => acc.setFlag('sidebarVibrate', v)"
            />
          </template>
        </ListCell>
      </div>

      <div class="acc-group-title">场景助手</div>
      <div class="acc-card">
        <ListCell
          title="场景建议"
          subtitle="根据当前使用场景，动态提供功能建议。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.sceneSuggest"
              color="blue"
              @update:model-value="v => acc.setFlag('sceneSuggest', v)"
            />
          </template>
        </ListCell>
        <ListCell
          title="视频助手"
          subtitle="播放视频时，提供后台播放、消息免打扰等场景功能。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.videoAssistant"
              color="blue"
              @update:model-value="v => acc.setFlag('videoAssistant', v)"
            />
          </template>
        </ListCell>
        <ListCell
          data-testid="sidebar-apps"
          title="可用的应用"
          chevron
          @click="sub = 'apps'"
        />
        <ListCell
          title="社交助手"
          subtitle="音视频通话时，提供通话录音、美颜等场景功能"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.socialAssistant"
              color="blue"
              @update:model-value="v => acc.setFlag('socialAssistant', v)"
            />
          </template>
        </ListCell>
        <ListCell
          data-testid="sidebar-more"
          title="更多功能"
          chevron
          last
          @click="sub = 'more'"
        />
      </div>
    </div>
  </SubPageShell>
</template>
