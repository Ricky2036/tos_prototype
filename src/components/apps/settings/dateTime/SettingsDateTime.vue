<script setup>
/**
 * 日期与时间（SET-WB-01 第一 + 第二条链路）
 * ==========================================
 * 真机依据：spec/captures/SET-DSH-01-A-B.md 包 A / B / C / D / E
 * （Infinix X6878 / Android 17，2026-11-13）。
 *
 * 包 B1 九行分四组；包 C1 两态依赖矩阵；包 D 返回链与 store 持久化；
 * 包 E1 取色（底色 #F0F2F3 / 分隔线 #E0E0E0 / 禁用行实色 #999999 / 副标题 #595959）；
 * 包 E2 明确两页开关是同一控件 → 复用 ui/ToggleSwitch，不在本页另写一份。
 * 包 C2 时区列表只采到「进入浏览后返回」，未采选中 → 本页不实现选中写回。
 *
 * 仍未验证：日期/时间选择器形态、常驻地/双时钟位置点击去向、切应用回来是否保持。
 * 这些行只 emit('open-picker') 上报意图，不臆造 UI。
 */
import { computed, inject, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import DateTimeTimezonePicker from './DateTimeTimezonePicker.vue'
import { useDateTimeStore } from '../../../../stores/dateTimeStore.js'
import { useBackHandler } from '../../../../composables/backRegistry.js'
import '../../../../styles/layer-transitions.css'

const emit = defineEmits(['back', 'open-picker'])
const store = useDateTimeStore()
const nav = inject('settingsNav', null)

const subPage = ref(null)
const isBack = ref(false)

const hourExample = computed(() => (store.use24Hour ? '13:00' : '下午1:00'))

function openTimezone() {
  isBack.value = false
  subPage.value = 'timezone'
}
function closeSubPage() {
  isBack.value = true
  subPage.value = null
}
function back() {
  if (subPage.value) {
    closeSubPage()
    return true
  }
  emit('back')
  return true
}
defineExpose({ back })

/** 包 D：子页一次返回回主页，主页一次返回回系统页；状态由 store 持久化 */
if (nav) {
  useBackHandler(() => {
    if (subPage.value) {
      closeSubPage()
      return true
    }
    nav.pop()
    return true
  })
}

function openPicker(key) {
  emit('open-picker', key)
}
</script>

<template>
  <div class="settings-datetime-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <DateTimeTimezonePicker v-if="subPage === 'timezone'" key="timezone" @back="closeSubPage" />
      <div v-else key="main" class="dt-main">
        <GlassNavBar overlay title="日期与时间" @back="back" />

        <div class="dt-scroll-body scrollable">
          <div class="dt-body">
            <!-- 组 1：自动设置时间 及其联动的日期 / 时间 -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="autoTime"
                title="自动设置时间"
                subtitle="使用您的网络和无线信号自动设定"
              >
                <template #right>
                  <ToggleSwitch :model-value="store.autoTime" @update:model-value="store.setAutoTime" />
                </template>
              </ListCell>
              <ListCell
                data-dt-row="date"
                title="日期"
                :subtitle="store.date"
                chevron
                :disabled="!store.canEditDate()"
                @click="openPicker('date')"
              />
              <ListCell
                data-dt-row="time"
                title="时间"
                :subtitle="store.time"
                chevron
                last
                :disabled="!store.canEditTime()"
                @click="openPicker('time')"
              />
            </div>

            <!-- 组 2：24 小时制（不受总开关影响） -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="use24Hour"
                title="使用 24 小时制"
                :subtitle="hourExample"
                last
              >
                <template #right>
                  <ToggleSwitch :model-value="store.use24Hour" @update:model-value="store.setUse24Hour" />
                </template>
              </ListCell>
            </div>

            <!-- 组 3：自动设置时区 及其联动的选择时区（关态可进城市列表） -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="autoTimezone"
                title="自动设置时区"
                subtitle="使用网络提供的时区。"
              >
                <template #right>
                  <ToggleSwitch :model-value="store.autoTimezone" @update:model-value="store.setAutoTimezone" />
                </template>
              </ListCell>
              <ListCell
                data-dt-row="timezone"
                title="选择时区"
                :subtitle="store.timezone"
                chevron
                last
                :disabled="!store.canSelectTimezone()"
                @click="openTimezone"
              />
            </div>

            <!-- 组 4：系统双时钟 -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="dualClock"
                title="系统双时钟"
                subtitle="系统时区与常驻地时区不一致时，显示双时钟。"
              >
                <template #right>
                  <ToggleSwitch :model-value="store.dualClock" @update:model-value="store.setDualClock" />
                </template>
              </ListCell>
              <ListCell
                data-dt-row="residence"
                title="常驻地"
                :subtitle="store.residence"
                chevron
                @click="openPicker('residence')"
              />
              <ListCell
                data-dt-row="dualClockPosition"
                title="双时钟显示位置"
                :subtitle="store.dualClockPosition"
                chevron
                last
                @click="openPicker('dualClockPosition')"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-datetime-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #F0F2F3; /* 包 E1 实测 */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", sans-serif;
}

.dt-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dt-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-top: var(--nav-h);
}

.dt-body {
  padding: 0 16px 24px;
}

/* 包 E2：复用仓库既有卡片规范与 ToggleSwitch，不各页另写一份 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
}

.dt-card + .dt-card {
  margin-top: 18px;
}

/* 包 E1 取色：只在「日期与时间」页覆盖，不改 ui/** 共享控件 */
.dt-card :deep(.list-cell .lc-main) {
  border-bottom-color: #E0E0E0;
}
.dt-card :deep(.lc-title) {
  color: #000000;
}
.dt-card :deep(.lc-subtitle) {
  color: #595959;
}
/* 真机禁用态是实色 #999999，不是 opacity 调低 */
.dt-card :deep(.list-cell.is-disabled) {
  opacity: 1;
}
.dt-card :deep(.list-cell.is-disabled .lc-title),
.dt-card :deep(.list-cell.is-disabled .lc-subtitle) {
  color: #999999;
}
</style>
