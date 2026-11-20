<script setup>
import { ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ActionSheetModal from '../../../ui/ActionSheetModal.vue'
import TmAppList from './TmAppList.vue'
import TmIndex from './TmIndex.vue'
import { TM_LETTERS, tmAppSections, tmScrollToLetter } from './appIndex.js'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_UNRESTRICTED } from './trafficData.js'
import './traffic.css'

/**
 * 不受限制的应用（省流量模式 → 该行）
 * 真机：顶部一行灰字组标题「不受限制的应用」，其下就是白底应用清单 + 右侧 A-Z 导轨，无搜索框。
 */
const emit = defineEmits(['back'])

const traffic = useTrafficStore()
const menuOpen = ref(false)
const menuOptions = [
  { key: 'allow', label: '全部允许' },
  { key: 'deny', label: '全部禁止' }
]

function onMenuSelect(option) {
  traffic.setAllApps('unrestricted', option.key === 'allow')
}

const sections = tmAppSections()
const available = sections.map(s => s.letter)
const body = ref(null)

function jump(letter) {
  tmScrollToLetter(body.value, letter)
}
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_UNRESTRICTED.title" @back="emit('back')" />

    <!-- 真机这一页导航右侧有 ⋮（全部允许 / 全部禁止） -->
    <button
      type="button"
      class="tm-nav-more"
      data-testid="tm-unrestricted-menu"
      aria-label="更多"
      @click="menuOpen = true"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5.2" r="1.6" fill="#1C1C1E" />
        <circle cx="12" cy="12" r="1.6" fill="#1C1C1E" />
        <circle cx="12" cy="18.8" r="1.6" fill="#1C1C1E" />
      </svg>
    </button>

    <div ref="body" class="tm-body scrollable" data-testid="tm-unrestricted">
      <div class="tm-group is-first">{{ TM_UNRESTRICTED.groupLabel }}</div>
      <TmAppList :sections="sections" list="unrestricted" testid="tm-unrestricted-list" />
      <div class="tm-bottom-space"></div>
    </div>

    <TmIndex :letters="TM_LETTERS" :available="available" @select="jump" />

    <ActionSheetModal
      v-model:visible="menuOpen"
      title="不受限制的应用"
      :options="menuOptions"
      @select="onMenuSelect"
    />
  </div>
</template>

<style scoped>
.tm-nav-more {
  position: absolute;
  right: 12px;
  top: calc(var(--safe-top, 0px) + 6px);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  z-index: 16;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  pointer-events: auto;
}
</style>
