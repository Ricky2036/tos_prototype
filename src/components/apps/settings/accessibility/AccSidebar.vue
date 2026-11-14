<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import AccPending from './AccPending.vue'
import illus from '../../../../assets/icons/accessibility/illus/illus-sidebar.png'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

/**
 * 智能侧边栏（真机 com.transsion.smartpanel MainPluginActivity）
 * 插图 3 点，页 1 文案「侧滑呼出侧边栏，快捷开启小窗应用。」；其余页未采。
 * 卡 1：智能侧边栏（开）/ 浮标设置 / 最近文件（关）/ 中转站（值「关闭」）/ 振动开关（关）
 * 分组「场景助手」：场景建议（开）/ 视频助手（开）/ 可用的应用 / 社交助手（开）/ 更多功能
 * unknown：浮标设置、中转站、可用的应用、更多功能 四个深层页未采 → 走取证缺口页。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const pages = [{ src: illus, desc: '侧滑呼出侧边栏，快捷开启小窗应用。' }]

const pending = ref('')
function openPending(title) {
  pending.value = title
}
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="该入口属于侧边栏的服务配置层，涉及浮标/中转站/场景助手的具体能力，需单独采集。"
    @back="pending = ''"
  />
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
          title="浮标设置"
          subtitle="设置浮标大小、透明度和位置。"
          chevron
          @click="openPending('浮标设置')"
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
          title="中转站"
          subtitle="高效的跨应用内容流转工具。"
          :value="acc.sidebarRelay"
          chevron
          @click="openPending('中转站')"
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
          title="可用的应用"
          chevron
          @click="openPending('可用的应用')"
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
        <ListCell title="更多功能" chevron last @click="openPending('更多功能')" />
      </div>
    </div>
  </SubPageShell>
</template>
