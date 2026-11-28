<script setup>
import { computed, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import TmChart from './TmChart.vue'
import TmSaveMode from './TmSaveMode.vue'
import TmUnrestricted from './TmUnrestricted.vue'
import TmWifiApps from './TmWifiApps.vue'
import TmLimit from './TmLimit.vue'
import TmScreenOff from './TmScreenOff.vue'
import TmSettings from './TmSettings.vue'
import TmAlerts from './TmAlerts.vue'
import TmWeekly from './TmWeekly.vue'
import TmAppUsage from './TmAppUsage.vue'
import TmPlans from './TmPlans.vue'
import { TM_FOOTNOTE, TM_GROUPS, TM_TODAY, TM_WEEK, tmAppUsage, tmFormatValue } from './trafficData.js'
import './traffic.css'
import ChevronRight from '../../../ui/ChevronRight.vue'

/**
 * 流量管理（SIM 卡与网络设置 → 流量管理）
 *
 * 真机依据：录屏 444×960 / 55s（2026-11-20）。录屏实际走过的路径：
 *   主页面 → 省流量模式（后台流量限制）→ 不受限制的应用 → 返回
 *        → 流量限额（含数字键盘与限额编辑）→ 熄屏监控
 *        → 应用 Wi-Fi 权限管理 → 流量周报 → 设置 → 流量提醒
 * 录屏未进入「应用流量使用管理 / 全部套餐」，这两页按同源数据补成真实页面，
 * 不做成点了没反应的死条目。
 */
const emit = defineEmits(['back'])

const stack = ref(['main'])
const isBack = ref(false)
const view = computed(() => stack.value[stack.value.length - 1])

const SUB = {
  saveMode: TmSaveMode,
  unrestricted: TmUnrestricted,
  wifiApps: TmWifiApps,
  limit: TmLimit,
  screenOff: TmScreenOff,
  settings: TmSettings,
  alerts: TmAlerts,
  weekly: TmWeekly,
  appUsage: TmAppUsage,
  plans: TmPlans
}

const subComponent = computed(() => SUB[view.value] || null)

function open(target) {
  if (stack.value[stack.value.length - 1] === target) return
  isBack.value = false
  stack.value.push(target)
}

/** 退一层：子页 → 上一级；栈底就是主页面，返回 false 让上层接着处理 */
function close() {
  if (stack.value.length <= 1) return false
  isBack.value = true
  stack.value.pop()
  return true
}

/**
 * 逐层消费返回：子页 → 主页面。
 * 主页面返回 false，由 SettingsSim 继续走它自己的层级栈（回到 SIM 卡与网络设置）。
 */
function back() {
  return close()
}

defineExpose({ back })

/* ---------------- 主页面数据 ---------------- */
const tab = ref('today')

const usage = computed(() => {
  const src = tab.value === 'today' ? TM_TODAY : TM_WEEK
  const total = tab.value === 'today' ? TM_TODAY.totalBytes : TM_WEEK.totalBytes
  const [, num, unit] = tmFormatValue(total).match(/^([\d.,]+)\s*(.*)$/) || [null, tmFormatValue(total), '']
  return {
    bars: src.bars,
    xLabels: src.xLabels,
    num,
    unit,
    testid: tab.value === 'today' ? 'tm-chart-today' : 'tm-chart-week'
  }
})

const iconApps = computed(() => tmAppUsage().slice(0, 5))
const restCount = computed(() => Math.max(0, tmAppUsage().length - 5))

function openRow(key) {
  open(key)
}
</script>

<template>
  <div class="tm-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 子页面 ================= -->
      <component
        :is="subComponent"
        v-if="subComponent"
        :key="view"
        @back="close"
        @open="open"
      />

      <!-- ================= 主页面 ================= -->
      <div v-else key="main" class="tm-page" data-testid="tm-main">
        <GlassNavBar overlay title="流量管理" @back="emit('back')" />

        <div class="tm-body scrollable">
          <div class="tm-group is-first">当前使用的套餐</div>

          <div class="tm-plan-card" data-testid="tm-plan-card">
            <svg class="tm-plan-glyph" width="34" height="46" viewBox="0 0 34 46" fill="none" aria-hidden="true">
              <!-- 后面那张只露一条窄边 -->
              <rect x="0" y="13" width="13" height="28" rx="4.5" fill="rgba(255,255,255,0.22)" />
              <!-- 前面一张：右上切角大一些，白杠压在左下 -->
              <path
                d="M10 2h12l10 10v29a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Z"
                fill="rgba(255,255,255,0.44)"
              />
              <rect x="11.2" y="30.5" width="3.2" height="8.6" rx="1.6" fill="#fff" />
              <rect x="16.4" y="30.5" width="3.2" height="8.6" rx="1.6" fill="#fff" />
              <rect x="21.6" y="30.5" width="3.2" height="8.6" rx="1.6" fill="#fff" />
            </svg>
            <div class="tm-plan-title">无使用中的套餐</div>
            <div class="tm-plan-divider"></div>
            <button type="button" class="tm-plan-all" data-testid="tm-all-plans" @click="open('plans')">
              全部套餐
              <ChevronRight :size="15" color="#FFFFFF" :stroke-width="2.56" />
            </button>
          </div>

          <div class="tm-group">流量使用情况</div>

          <div class="tm-card tm-card-chart">
            <div class="tm-segment" :class="{ 'is-week': tab === 'week' }" data-testid="tm-segment">
              <span class="tm-segment-pill" aria-hidden="true"></span>
              <button
                type="button"
                class="tm-tab"
                :class="{ 'is-active': tab === 'today' }"
                data-testid="tm-tab-today"
                @click="tab = 'today'"
              >今天</button>
              <button
                type="button"
                class="tm-tab"
                :class="{ 'is-active': tab === 'week' }"
                data-testid="tm-tab-week"
                @click="tab = 'week'"
              >过去 7 天</button>
            </div>

            <div class="tm-usage">
              <div class="tm-usage-label">已用流量</div>
              <div class="tm-usage-value" data-testid="tm-usage-value">
                {{ usage.num }} <small>{{ usage.unit }}</small>
              </div>
            </div>

            <TmChart
              :key="usage.testid"
              :bars="usage.bars"
              :x-labels="usage.xLabels"
              :height="173"
              :testid="usage.testid"
            />

            <div class="tm-footnote">{{ TM_FOOTNOTE }}</div>

            <div class="tm-approw" data-testid="tm-row-appUsage" @click="open('appUsage')">
              <div class="tm-approw-main">
                <div class="tm-approw-title">应用流量使用管理</div>
                <div class="tm-icon-stack" data-testid="tm-icon-stack">
                  <RegisteredAppIcon v-for="row in iconApps" :key="row.app.id" :app="row.app" :size="42" />
                  <span v-if="restCount" class="tm-icon-more">+{{ restCount }}</span>
                </div>
              </div>
              <ChevronRight class="tm-chevron" :size="18" color="currentColor" :stroke-width="2.13" />
            </div>
          </div>

          <template v-for="group in TM_GROUPS" :key="group.label">
            <div class="tm-group">{{ group.label }}</div>
            <div class="tm-card">
              <div
                v-for="row in group.rows"
                :key="row.key"
                class="tm-row is-tap"
                :data-testid="`tm-row-${row.key}`"
                @click="openRow(row.key)"
              >
                <div class="tm-row-text">
                  <div class="tm-row-title">{{ row.title }}</div>
                </div>
                <ChevronRight class="tm-chevron" :size="18" color="currentColor" :stroke-width="2.13" />
              </div>
            </div>
          </template>

          <div class="tm-bottom-space"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>
