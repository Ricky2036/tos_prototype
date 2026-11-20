<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmAppList from './TmAppList.vue'
import TmIndex from './TmIndex.vue'
import { tmApps, tmLettersOf, tmSplitSections, tmScrollTo, tmLetterAtTop } from './appIndex.js'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_UNRESTRICTED } from './trafficData.js'
import './traffic.css'

/**
 * 不受限制的应用（省流量模式 → 该行）
 *
 * 真机（1208×2644 截图）：
 *   · 两段：「不受限制的应用」= 当前放行（开关蓝）的应用；「其他应用」= 其余
 *   · 行高 62、行间细分隔线、右侧 Material 开关；关掉一个应用它会落回「其他应用」
 *   · 导航右上 ⋮ → 贴着按钮的小弹层「显示系统应用」（默认不显示系统自带应用）
 *   · 右缘 A-Z 导轨：★ 回顶部 + 只出现有应用的首字母 + 当前分组字母变蓝
 */
const emit = defineEmits(['back'])

const traffic = useTrafficStore()
const body = ref(null)
const menuOpen = ref(false)
const activeLetter = ref('')

const apps = computed(() => tmApps({ showSystemApps: traffic.showSystemApps }))
const sections = computed(() => tmSplitSections(apps.value, id => traffic.isAppOn('unrestricted', id)))
const letters = computed(() => tmLettersOf(apps.value))

function jump(letter) {
  tmScrollTo(body.value, letter)
}

function syncActive() {
  activeLetter.value = tmLetterAtTop(body.value)
}

function toggleSystemApps() {
  menuOpen.value = false
  traffic.setFlag('showSystemApps', !traffic.showSystemApps)
}

onMounted(() => {
  syncActive()
  body.value?.addEventListener('scroll', syncActive, { passive: true })
})

onBeforeUnmount(() => {
  body.value?.removeEventListener('scroll', syncActive)
})
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_UNRESTRICTED.title" @back="emit('back')" />

    <!-- 真机：导航右上角是圆形「更多」按钮（和返回键同款），点开贴着它的小弹层 -->
    <button
      type="button"
      class="tm-nav-more"
      data-testid="tm-unrestricted-menu"
      aria-label="更多"
      @click="menuOpen = !menuOpen"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5.2" r="1.6" fill="#1C1C1E" />
        <circle cx="12" cy="12" r="1.6" fill="#1C1C1E" />
        <circle cx="12" cy="18.8" r="1.6" fill="#1C1C1E" />
      </svg>
    </button>

    <Transition name="tm-pop">
      <div
        v-if="menuOpen"
        class="tm-popover"
        data-testid="tm-unrestricted-popover"
        @click="toggleSystemApps"
      >
        <span class="tm-popover-item" :class="{ 'is-on': traffic.showSystemApps }" data-testid="tm-show-system">
          显示系统应用
        </span>
      </div>
    </Transition>

    <div ref="body" class="tm-body scrollable" data-testid="tm-unrestricted">
      <TmAppList :sections="sections" list="unrestricted" testid="tm-unrestricted-list" />
      <div class="tm-bottom-space"></div>
    </div>

    <TmIndex :letters="letters" :active-letter="activeLetter" @select="jump" />
  </div>
</template>
