<script setup>
import { computed, ref } from 'vue'
import TmChart from './TmChart.vue'
import ActionSheetModal from '../../../ui/ActionSheetModal.vue'
import { TM_WEEK, TM_WEEKLY, tmFormat } from './trafficData.js'
import './traffic.css'

/**
 * 流量周报
 * 真机是整页蓝色渐变（导航按钮浮在渐变上，没有白色玻璃条），
 * 下方白色卡片圆角盖住渐变，「已用流量 + 七日柱 + 个性化推荐」都在卡片里。
 *
 * ⚠️ 柱与「已用流量」同源（都取 TM_WEEK）：录屏里周报用的是另一周的数据，
 *    与主页七日图对不上，这里统一成本周，避免两个页面互相打脸。
 */
const emit = defineEmits(['back', 'open'])

const menuOpen = ref(false)
const toast = ref('')
let timer = null

const menuOptions = [
  { key: 'share', label: '分享周报' },
  { key: 'feedback', label: '反馈问题' }
]

const usedText = computed(() => {
  const [num, unit] = tmFormat(TM_WEEK.totalBytes).split(' ')
  return { num, unit }
})

// 周报的「节省」即便为 0 也按 MB 显示（真机是 0.0 MB，不是 0.0 B）
const savedText = computed(() => ({
  num: (TM_WEEKLY.savedBytes / (1024 * 1024)).toFixed(1),
  unit: 'MB'
}))

function showToast(msg) {
  toast.value = msg
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { toast.value = '' }, 1800)
}

function onMenuSelect(option) {
  menuOpen.value = false
  showToast(option.key === 'share' ? '周报已生成分享图' : '已记录你的反馈')
}
</script>

<template>
  <div class="tm-weekly" data-testid="tm-weekly">
    <div class="tm-weekly-hero">
      <span class="tm-weekly-arc" aria-hidden="true"></span>
      <span class="tm-weekly-arc is-two" aria-hidden="true"></span>

      <div class="tm-weekly-nav">
        <button type="button" class="tm-weekly-btn" data-nav-back aria-label="返回" @click="emit('back')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 12H4.6M4.6 12L11.2 5.4M4.6 12L11.2 18.6" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button type="button" class="tm-weekly-btn" data-testid="tm-weekly-menu" aria-label="更多" @click="menuOpen = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5.4" r="1.5" fill="#FFFFFF" />
            <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
            <circle cx="12" cy="18.6" r="1.5" fill="#FFFFFF" />
          </svg>
        </button>
      </div>

      <div class="tm-weekly-head">
        <div class="tm-weekly-kicker">{{ TM_WEEKLY.title }}</div>
        <div class="tm-weekly-range">{{ TM_WEEKLY.rangeText }} 周报</div>
        <div class="tm-weekly-big" data-testid="tm-weekly-saved">
          <b>{{ savedText.num }}</b><span>{{ savedText.unit }}</span>
        </div>
        <div class="tm-weekly-saved">{{ TM_WEEKLY.savedLabel }}</div>
      </div>
    </div>

    <div class="tm-weekly-sheet scrollable">
      <div class="tm-weekly-used">{{ TM_WEEKLY.usedLabel }}</div>
      <div class="tm-weekly-used-value" data-testid="tm-weekly-used">{{ usedText.num }} {{ usedText.unit }}</div>

      <TmChart
        :bars="TM_WEEK.bars"
        :x-labels="TM_WEEK.xLabels"
        :height="176"
        testid="tm-weekly-chart"
      />

      <div class="tm-rec" data-testid="tm-weekly-rec">
        <div class="tm-rec-title">{{ TM_WEEKLY.recTitle }}</div>
        <div class="tm-rec-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M10.4 3.6l1.5 4.1 4.1 1.5-4.1 1.5-1.5 4.1-1.5-4.1L4.8 9.2l4.1-1.5 1.5-4.1Z" fill="#FFFFFF" />
            <path d="M16.6 13.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" fill="#FFFFFF" opacity="0.9" />
          </svg>
        </div>
        <div class="tm-rec-head">{{ TM_WEEKLY.recHead }}</div>
        <div class="tm-rec-body">{{ TM_WEEKLY.recBody }}</div>
      </div>
    </div>

    <ActionSheetModal
      v-model:visible="menuOpen"
      title="流量周报"
      :options="menuOptions"
      @select="onMenuSelect"
    />

    <Transition name="tm-toast">
      <div v-if="toast" class="tm-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.tm-toast {
  position: absolute;
  left: 50%;
  bottom: 64px;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.86);
  color: #fff;
  font-size: 13px;
  line-height: 18px;
  padding: 8px 16px;
  border-radius: 18px;
  white-space: nowrap;
  z-index: 90;
}

.tm-toast-enter-active,
.tm-toast-leave-active {
  transition: opacity 0.18s ease;
}

.tm-toast-enter-from,
.tm-toast-leave-to {
  opacity: 0;
}
</style>
