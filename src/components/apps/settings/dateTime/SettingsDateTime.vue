<script setup>
/**
 * 日期与时间（SET-WB-01 第一条链路）
 * ===================================
 * 逐行文本、顺序、右侧控件与 enabled 联动全部来自真机采集包
 * `spec/captures/SET-DSH-01-A-B.md`（Infinix X6878 / Android 17）。
 *
 * 已验证：9 行分 4 组；自动设置时间=开 锁「日期/时间」；
 * 自动设置时区=开 锁「选择时区」；24 小时制/双时钟/常驻地/显示位置不受影响。
 *
 * 未验证（不猜，等包 C/D）：关态下点击三个被放行行落到哪个选择器、
 * 开关几何与 toast/联网校验、两个未标注开关的真机初值、跨应用持久化策略。
 * 因此本条链路只交「入口 → 主页 → 总开关联动 → 返回」，选择器留到下一条小单。
 */
import { computed, inject } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useDateTimeStore } from '../../../../stores/dateTimeStore.js'
import { useBackHandler } from '../../../../composables/backRegistry.js'

const emit = defineEmits(['back', 'open-picker'])
const store = useDateTimeStore()
const nav = inject('settingsNav', null)

/** 12/24 小时制的示例时间；关态示例值待包 C 核实，这里只做格式响应 */
const hourExample = computed(() => (store.use24Hour ? '13:00' : '下午1:00'))

function back() {
  emit('back')
  return true
}
defineExpose({ back })

/** 返回栈下沉：本页无三级页，侧滑直接回上一页；不注册时会污染全局返回栈 */
if (nav) {
  useBackHandler(() => {
    nav.pop()
    return true
  })
}

/** 被放行行的点击只上报意图，不臆造选择器 UI（属下一条小单） */
function openPicker(key) {
  emit('open-picker', key)
}
</script>

<template>
  <div class="settings-datetime-page">
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

        <!-- 组 3：自动设置时区 及其联动的选择时区 -->
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
            @click="openPicker('timezone')"
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
</template>

<style scoped>
.settings-datetime-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #F0F1F2;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", sans-serif;
}

.dt-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-top: var(--nav-h);
}

.dt-body {
  padding: 0 16px 24px;
}

/* 与设置其它页同一套卡片规范（cardSpec.test.js 会逐个量 computed 样式） */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
}

/* 真机四组之间有留白，包 B 未采到分组标题，故只留间距不加标题 */
.dt-card + .dt-card {
  margin-top: 18px;
}
</style>
