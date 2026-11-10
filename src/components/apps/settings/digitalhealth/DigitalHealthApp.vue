<script setup>
import { computed, ref } from 'vue'
import '../../../../styles/layer-transitions.css'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import DhSwitch from './DhSwitch.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import LIcon from '../../../ui/LIcon.vue'
import DhInfoPage from './DhInfoPage.vue'
import DhSleepSchedule from './DhSleepSchedule.vue'
import DhSleepFilterList from './DhSleepFilterList.vue'
import DhFocusSchedule from './DhFocusSchedule.vue'
import DhAppLimits from './DhAppLimits.vue'
import DhAppActivity from './DhAppActivity.vue'
import DhSleepMode from './DhSleepMode.vue'
import DhSleepSettings from './DhSleepSettings.vue'
import DhFocusMode from './DhFocusMode.vue'
import DhScreenReminder from './DhScreenReminder.vue'
import DhWalking from './DhWalking.vue'
import DhParental from './DhParental.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'
import {
  DH_TOTAL_MINUTES, DH_UNLOCKS, DH_NOTIFICATIONS, DH_SEG_COLORS,
  formatDuration, dhDonutSegments, dhUsageRows
} from './dhData.js'

/**
 * 数字健康（真机 Infinix X6878 / XOS 17，2026-11-10 逐页取证 /tmp/ref/gI/dh_*）。
 *
 * 真机主页结构（自上而下）：
 *   ① 环形图卡：今天总时长 + 四段图例，卡片底部「查看应用活动详情」文字按钮
 *   ② 两个统计块：N 次解锁设备 / N 条通知
 *   ③ 蓝色小节「暂时放下手机」：应用定时器 / 睡眠模式 / 专注模式 / 屏幕使用时间提醒（全部两行，无箭头）
 *   ④ 蓝色小节「减少打扰」：管理通知 / 看路提醒 / 在应用列表中显示图标（开关）
 *   ⑤ 底部灰色「想使用"家长控制"功能?」卡片
 * 右上角 ⋮（发送反馈 / 管理数据 / 隐私权政策 / 服务条款 / 开源许可）。
 *
 * ⚠️ 开关是真机同款的 Material 开关（DhSwitch），不是 iOS 拨杆；
 *    行没有 chevron —— 真机 Google 偏好页这两排都没有箭头。
 */
const emit = defineEmits(['back', 'open-notifications'])
const dh = useDigitalHealthStore()

/* ---------- 子页栈 ---------- */
const stack = ref([])
const isBack = ref(false)
const current = computed(() => stack.value[stack.value.length - 1] || null)

function openSub(key) {
  if (!key) return
  isBack.value = false
  stack.value = [...stack.value, key]
}
/** ⋮ 菜单五项落到真实页面（DhInfoPage 按 key 分发） */
function openInfo(key) {
  openSub(`info:${key}`)
}
function openFilter(kind) {
  openSub(`filter:${kind}`)
}
const infoKey = computed(() => (current.value?.startsWith('info:') ? current.value.slice(5) : ''))
const filterKind = computed(() => (current.value?.startsWith('filter:') ? current.value.slice(7) : ''))
function closeSub() {
  isBack.value = true
  stack.value = stack.value.slice(0, -1)
}
function back() {
  if (stack.value.length) { closeSub(); return true }
  emit('back')
  return true
}
defineExpose({ back })

/* ---------- 主页展示值 ---------- */
const donut = computed(() => dhDonutSegments())
const usageRows = computed(() => dhUsageRows(3))
const totalLabel = computed(() => formatDuration(DH_TOTAL_MINUTES))
const SIZE = 176
const R = 68
const STROKE = 26
const CENTER = SIZE / 2
const CIRC = 2 * Math.PI * R

const arcs = computed(() => {
  let acc = 0
  return donut.value.map((s, i) => {
    const len = (s.deg / 360) * CIRC
    const arc = { ...s, len, offset: -acc, color: DH_SEG_COLORS[i % DH_SEG_COLORS.length] }
    acc += len
    return arc
  })
})
/** 图例文字围绕圆环摆放：按每段中角算位置 */
const labels = computed(() => {
  let acc = 0
  return donut.value.map((s, i) => {
    const mid = (acc + s.deg / 2) - 90
    acc += s.deg
    const rad = (mid * Math.PI) / 180
    const dist = R + STROKE / 2 + 12
    return {
      key: s.key,
      text: s.label,
      x: CENTER + Math.cos(rad) * dist,
      y: CENTER + Math.sin(rad) * dist
    }
  })
})

const limitsSubtitle = computed(() => {
  const n = dh.limitCount()
  return n ? `${n} 个应用已设置定时器` : '未设置定时器'
})
const sleepSubtitle = computed(() => (dh.state.sleep.enabled ? '已开启' : '已关闭'))
const focusSubtitle = computed(() => {
  if (dh.state.focusRunning) return '专注中'
  const n = dh.state.focusApps.length
  return n ? `已选择 ${n} 个应用` : '点按即可设置'
})
const reminderSubtitle = computed(() => (dh.state.reminderEnabled ? '已开启' : '已关闭'))
const walkingSubtitle = computed(() => (dh.state.walking.enabled ? '已开启' : '点按即可设置'))

/* ---------- toast（⋮ 菜单的五条都不会真跳） ---------- */
const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 1800)
}
</script>

<template>
  <div class="dh-app">
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <DhAppLimits
        v-if="current === 'limits'" key="limits"
        @back="closeSub" @toast="showToast" @overflow="openInfo" @open-activity="openSub('activity')"
      />
      <DhAppActivity
        v-else-if="current === 'activity'" key="activity"
        @back="closeSub" @toast="showToast" @overflow="openInfo"
      />
      <DhSleepMode
        v-else-if="current === 'sleep'" key="sleep"
        @back="closeSub" @toast="showToast" @overflow="openInfo"
        @open-settings="openSub('sleepSettings')" @open-schedule="openSub('sleepSchedule')"
      />
      <DhSleepSettings
        v-else-if="current === 'sleepSettings'" key="sleepSettings"
        @back="closeSub" @toast="showToast" @overflow="openInfo"
        @open-schedule="openSub('sleepSchedule')" @open-filter="openFilter"
      />
      <DhSleepSchedule
        v-else-if="current === 'sleepSchedule'" key="sleepSchedule"
        @back="closeSub" @toast="showToast"
      />
      <DhSleepFilterList
        v-else-if="filterKind" :key="`filter-${filterKind}`" :kind="filterKind"
        @back="closeSub" @toast="showToast"
      />
      <DhFocusMode
        v-else-if="current === 'focus'" key="focus"
        @back="closeSub" @toast="showToast" @overflow="openInfo" @open-schedule="openSub('focusSchedule')"
      />
      <DhFocusSchedule
        v-else-if="current === 'focusSchedule'" key="focusSchedule"
        @back="closeSub" @toast="showToast" @saved="closeSub"
      />
      <DhScreenReminder
        v-else-if="current === 'reminder'" key="reminder"
        @back="closeSub" @toast="showToast" @overflow="openInfo"
      />
      <DhWalking
        v-else-if="current === 'walking'" key="walking"
        @back="closeSub" @toast="showToast"
      />
      <DhParental
        v-else-if="current === 'parental'" key="parental"
        @back="closeSub" @toast="showToast"
      />
      <DhInfoPage
        v-else-if="infoKey" :key="`info-${infoKey}`" :page="infoKey"
        @back="closeSub" @toast="showToast"
      />
    </Transition>

    <template v-if="!current">
      <GlassNavBar overlay title="数字健康" @back="emit('back')">
        <template #right>
          <DhOverflowMenu @pick="openInfo" />
        </template>
      </GlassNavBar>

      <div class="dh-body scrollable" data-dh-home>
        <!-- ① 环形图 -->
        <section class="dh-card dh-chart-card">
          <div class="dh-donut" data-dh-donut>
            <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" aria-hidden="true">
              <circle :cx="CENTER" :cy="CENTER" :r="R" fill="none" stroke="#3C4043" :stroke-width="STROKE" />
              <circle
                v-for="a in arcs"
                :key="a.key"
                :cx="CENTER"
                :cy="CENTER"
                :r="R"
                fill="none"
                :stroke="a.color"
                :stroke-width="STROKE"
                :stroke-dasharray="`${a.len} ${CIRC - a.len}`"
                :stroke-dashoffset="a.offset"
                :transform="`rotate(-90 ${CENTER} ${CENTER})`"
              />
            </svg>
            <div class="dh-donut-labels">
              <span
                v-for="l in labels"
                :key="l.key"
                class="dh-donut-label"
                :style="{ left: l.x + 'px', top: l.y + 'px' }"
              >{{ l.text }}</span>
            </div>
            <div class="dh-donut-center">
              <span class="dh-donut-today">今天</span>
              <strong class="dh-donut-total">{{ totalLabel }}</strong>
            </div>
          </div>
          <button type="button" class="dh-chart-btn" data-dh-open-activity @click="openSub('activity')">
            查看应用活动详情
          </button>
        </section>

        <!-- ② 统计块 -->
        <div class="dh-stats">
          <div class="dh-stat">
            <strong>{{ DH_UNLOCKS }}</strong>
            <span>次解锁设备</span>
          </div>
          <div class="dh-stat">
            <strong>{{ DH_NOTIFICATIONS }}</strong>
            <span>条通知</span>
          </div>
        </div>

        <!-- ③ 暂时放下手机 -->
        <div class="dh-section-label">暂时放下手机</div>
        <section class="dh-card">
          <button type="button" class="dh-row" data-dh-row="limits" @click="openSub('limits')">
            <span class="dh-row-main">
              <span class="dh-row-title">应用定时器</span>
              <span class="dh-row-sub">{{ limitsSubtitle }}</span>
            </span>
          </button>
          <button type="button" class="dh-row" data-dh-row="sleep" @click="openSub('sleep')">
            <span class="dh-row-main">
              <span class="dh-row-title">睡眠模式</span>
              <span class="dh-row-sub">{{ sleepSubtitle }}</span>
            </span>
          </button>
          <button type="button" class="dh-row" data-dh-row="focus" @click="openSub('focus')">
            <span class="dh-row-main">
              <span class="dh-row-title">专注模式</span>
              <span class="dh-row-sub">{{ focusSubtitle }}</span>
            </span>
          </button>
          <button type="button" class="dh-row is-last" data-dh-row="reminder" @click="openSub('reminder')">
            <span class="dh-row-main">
              <span class="dh-row-title">屏幕使用时间提醒</span>
              <span class="dh-row-sub">{{ reminderSubtitle }}</span>
            </span>
          </button>
        </section>

        <!-- ④ 减少打扰 -->
        <div class="dh-section-label">减少打扰</div>
        <section class="dh-card">
          <button type="button" class="dh-row" data-dh-row="notifications" @click="emit('open-notifications')">
            <span class="dh-row-main">
              <span class="dh-row-title">管理通知</span>
            </span>
          </button>
          <button type="button" class="dh-row" data-dh-row="walking" @click="openSub('walking')">
            <span class="dh-row-main">
              <span class="dh-row-title">看路提醒</span>
              <span class="dh-row-sub">{{ walkingSubtitle }}</span>
            </span>
          </button>
          <div class="dh-row is-last" data-dh-row="icon">
            <span class="dh-row-main">
              <span class="dh-row-title">在应用列表中显示图标</span>
            </span>
            <DhSwitch
              :model-value="dh.state.showIconInAppList"
              data-dh-icon-switch
              @update:model-value="dh.setShowIconInAppList($event)"
            />
          </div>
        </section>

        <!-- ⑤ 家长控制入口 -->
        <button type="button" class="dh-parental" data-dh-row="parental" @click="openSub('parental')">
          <span class="dh-parental-icon">
            <LIcon name="users" :size="19" :stroke-width="2" />
          </span>
          <span class="dh-parental-main">
            <span class="dh-parental-title">想使用“家长控制”功能?</span>
            <span class="dh-parental-sub">您可为此设备设置数字设备基本使用规则和屏幕使用时间限制</span>
          </span>
          <LIcon class="dh-parental-chev" name="chevronRight" :size="16" />
        </button>

        <div class="dh-bottom-space"></div>
      </div>
    </template>

    <div v-if="toast" class="dh-toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.dh-app {
  position: absolute;
  inset: 0;
  background: #F1F2F4;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #1F1F1F;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.dh-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: calc(var(--nav-h) + 6px) 16px 0;
  scrollbar-width: none;
}
.dh-body::-webkit-scrollbar { display: none; }

.dh-card {
  background: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}

/* ---------- 环形图 ---------- */
.dh-chart-card {
  padding: 14px 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dh-donut {
  position: relative;
  width: 176px;
  height: 176px;
  margin-top: 4px;
}

.dh-donut-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dh-donut-label {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 12.5px;
  color: #3C4043;
  white-space: nowrap;
}

.dh-donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.dh-donut-today { font-size: 12.5px; color: #5F6368; }
.dh-donut-total { font-size: 19px; font-weight: 600; color: #202124; letter-spacing: -0.2px; }

.dh-chart-btn {
  width: 100%;
  margin-top: 10px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #1A73E8;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.dh-chart-btn:active { background: rgba(26, 115, 232, 0.08); }

/* ---------- 统计块 ---------- */
.dh-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.dh-stat {
  flex: 1;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dh-stat strong { font-size: 24px; font-weight: 600; color: #202124; letter-spacing: -0.4px; }
.dh-stat span { font-size: 13px; color: #5F6368; }

/* ---------- 小节标题 ---------- */
.dh-section-label {
  font-size: 13px;
  font-weight: 500;
  color: #1A73E8;
  padding: 14px 6px 8px;
}

/* ---------- 行 ---------- */
.dh-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  padding: 14px 16px;
  border-bottom: 0.5px solid rgba(60, 64, 67, 0.12);
  cursor: pointer;
  color: inherit;
}
.dh-row.is-last { border-bottom: none; }
.dh-row:active { background: rgba(60, 64, 67, 0.05); }

.dh-row-main { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.dh-row-title { font-size: 15.5px; font-weight: 400; color: #202124; }
.dh-row-sub { font-size: 13px; color: #5F6368; }

/* ---------- 家长控制入口 ---------- */
.dh-parental {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: #E9EAEE;
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 12px;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}
.dh-parental:active { background: #E1E3E8; }

.dh-parental-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #5F6368;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.dh-parental-main { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.dh-parental-title { font-size: 14px; font-weight: 600; color: #202124; }
.dh-parental-sub { font-size: 12px; line-height: 16px; color: #5F6368; }
.dh-parental-chev { flex: none; }

.dh-bottom-space { height: 28px; }

.dh-toast {
  position: absolute;
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  background: #303134;
  color: #FFFFFF;
  font-size: 13px;
  padding: 11px 16px;
  border-radius: 10px;
  max-width: 300px;
  text-align: center;
  z-index: 60;
}
</style>
