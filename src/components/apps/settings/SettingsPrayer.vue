<script setup>
import { computed, ref, watch } from 'vue'
import { usePrayerStore } from '../../../stores/prayerStore'
import { useClockStore } from '../../../stores/clockStore'
import { useSystemStore } from '../../../stores/systemStore'
import { useI18nStore } from '../../../stores/i18nStore'
import AppNavBar from '../../ui/AppNavBar.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import TimePickerModal from '../../ui/TimePickerModal.vue'
import ListCell from '../../ui/ListCell.vue'
import ActionModal from '../../ui/ActionModal.vue'
import { GLYPHS } from '../../../assets/icons/glyphs'

const emit = defineEmits(['back-to-dnd', 'back'])
const prayerStore = usePrayerStore()
const clockStore = useClockStore()
const systemStore = useSystemStore()
const i18n = useI18nStore()

/* 安全的多语言翻译辅助函数：缺失或未编译时自动降级兜底，绝不显示生硬英文 key */
function tr(key, zhFallback, enFallback, bnFallback) {
  const val = i18n?.t ? i18n.t(key) : null
  if (val && val !== key) return val
  if (i18n?.locale === 'en') return enFallback || zhFallback
  if (i18n?.locale === 'bn') return bnFallback || enFallback || zhFallback
  return zhFallback
}

/* 提醒时间二级页面选项定义与状态计算 */
const reminderOptions = [
  { value: -1, labelKey: 'noReminder', zh: '不提醒', en: 'None', bn: 'কোনোটি নয়' },
  { value: 5, labelKey: 'advance5Min', zh: '提前 5 分钟', en: '5 minutes before', bn: '৫ মিনিট আগে' },
  { value: 10, labelKey: 'advance10Min', zh: '提前 10 分钟', en: '10 minutes before', bn: '১০ মিনিট আগে' },
  { value: 15, labelKey: 'advance15Min', zh: '提前 15 分钟', en: '15 minutes before', bn: '১৫ মিনিট আগে' }
]

const currentReminderValue = computed(() => {
  if (prayerStore?.alarmLinkageEnabled === false || prayerStore?.alarmAdvanceMinutes === -1) {
    return -1
  }
  const mins = prayerStore?.alarmAdvanceMinutes
  if (mins === 5 || mins === 10 || mins === 15) return mins
  if (prayerStore?.alarmLinkageEnabled) return 15
  return -1
})

const currentReminderLabel = computed(() => {
  const val = currentReminderValue.value
  const opt = reminderOptions.find((o) => o.value === val)
  if (opt) return tr(opt.labelKey, opt.zh, opt.en, opt.bn)
  return tr('noReminder', '不提醒', 'None', 'কোনোটি নয়')
})

function openReminderSubpage() {
  isBack.value = false
  currentView.value = 'reminder'
}

function handleReminderBack() {
  isBack.value = true
  currentView.value = 'list'
}

watch(
  () => prayerStore?.adhanReminderEnabled,
  (enabled) => {
    if (!enabled && currentView.value === 'reminder') {
      currentView.value = 'list'
    }
  }
)

/* 启用穆斯林闹钟弹窗状态与选择拦截 */
const showEnableMuslimAlarmModal = ref(false)
const pendingReminderVal = ref(null)

function selectReminderOption(val) {
  // 如果穆斯林闹钟未开启或当前处于未联动状态，点击选择提前 5-15 分钟，弹窗提示用户授权开启
  if (val > 0 && (!clockStore?.settings?.muslimAlarmEnabled || !prayerStore?.alarmLinkageEnabled)) {
    pendingReminderVal.value = val
    showEnableMuslimAlarmModal.value = true
    return
  }
  applyReminderOption(val)
}

function applyReminderOption(val) {
  if (val === -1) {
    if (prayerStore) {
      prayerStore.alarmLinkageEnabled = false
      prayerStore.alarmAdvanceMinutes = -1
      if (typeof prayerStore.setAlarmReminder === 'function') {
        prayerStore.setAlarmReminder(-1)
      } else {
        if (typeof prayerStore.setAlarmLinkage === 'function') prayerStore.setAlarmLinkage(false)
        if (typeof prayerStore.setAlarmAdvanceMinutes === 'function') prayerStore.setAlarmAdvanceMinutes(-1)
      }
    }
    if (clockStore?.settings) {
      clockStore.settings.muslimAlarmEnabled = false
    }
    if (typeof clockStore?.setMuslimAlarmEnabled === 'function') {
      clockStore.setMuslimAlarmEnabled(false)
    }
  } else {
    if (prayerStore) {
      prayerStore.alarmLinkageEnabled = true
      prayerStore.alarmAdvanceMinutes = val
      if (typeof prayerStore.setAlarmReminder === 'function') {
        prayerStore.setAlarmReminder(val)
      } else {
        if (typeof prayerStore.setAlarmLinkage === 'function') prayerStore.setAlarmLinkage(true)
        if (typeof prayerStore.setAlarmAdvanceMinutes === 'function') prayerStore.setAlarmAdvanceMinutes(val)
      }
    }
    if (clockStore?.settings) {
      clockStore.settings.muslimAlarmEnabled = true
      clockStore.settings.calcMethod = '自定义'
      clockStore.settings.prayerTimeMethod = '自定义'
    }
    if (typeof clockStore?.setMuslimAlarmEnabled === 'function') {
      clockStore.setMuslimAlarmEnabled(true)
    }
    // 开启后穆斯林闹钟的时间按设定的时间进行同步修改，且计算方法与哺礼时间法切换到自定义
    if (typeof clockStore?.setMuslimTimeMode === 'function') {
      clockStore.setMuslimTimeMode('custom')
    }
  }
}

function confirmEnableMuslimAlarm() {
  if (clockStore?.settings) {
    clockStore.settings.muslimAlarmEnabled = true
    clockStore.settings.calcMethod = '自定义'
    clockStore.settings.prayerTimeMethod = '自定义'
  }
  if (typeof clockStore?.setMuslimAlarmEnabled === 'function') {
    clockStore.setMuslimAlarmEnabled(true)
  }
  if (typeof clockStore?.setMuslimTimeMode === 'function') {
    clockStore.setMuslimTimeMode('custom')
  }
  if (pendingReminderVal.value !== null) {
    applyReminderOption(pendingReminderVal.value)
  }
  pendingReminderVal.value = null
  showEnableMuslimAlarmModal.value = false
}

function cancelEnableMuslimAlarm() {
  pendingReminderVal.value = null
  showEnableMuslimAlarmModal.value = false
}

/* 兼容性保留字段与方法 */
const alarmLinkageEnabled = computed({
  get: () => currentReminderValue.value !== -1,
  set: (val) => selectReminderOption(val ? 15 : -1)
})
function jumpToClockMuslim() {
  clockStore?.setActiveTab?.('muslim')
  systemStore?.openApp?.('clock')
}

/* 页面视图层级：'list'（礼拜勿扰列表） | 'edit'（单项全屏设置页） */
const currentView = ref('list')
const isBack = ref(false)
const editingPrayer = ref(null)
const editForm = ref({
  startTime: '05:15',
  endTime: '05:45',
  repeatType: 'everyday',
  repeatDays: [0, 1, 2, 3, 4, 5, 6]
})

function formatTime(prayer) {
  return `${prayer.startTime} - ${prayer.endTime}`
}

function formatRepeat(prayer) {
  if (prayer.repeatType === 'everyday') return i18n.t('repeatEveryday')
  if (prayer.repeatType === 'weekday') return i18n.t('repeatWeekday')
  if (prayer.repeatType === 'weekend') return i18n.t('repeatWeekend')
  return i18n.t('repeatCustom')
}

/* 时间滚轮弹窗状态（统一标准化控件） */
const showTimePicker = ref(false)
const timePickerType = ref('start') // 'start' | 'end'
const currentTimePickerVal = ref('05:15')

/* 重复选择底部弹窗状态（周一至周日复选框样式） */
const MONDAY_TO_SUNDAY = [1, 2, 3, 4, 5, 6, 0]
const showRepeatModal = ref(false)
const tempRepeatDays = ref([1, 2, 3, 4, 5, 6, 0])

/* 底部弹窗星期列表（严格按星期一至星期日排序） */
const modalWeekDays = computed(() => {
  const longDays = i18n.longWeekDays || ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return MONDAY_TO_SUNDAY.map((day) => ({
    day,
    label: longDays[day]
  }))
})

/* 格式化重复星期摘要（例如：每天 / 周一, 周二, 周四, 周五, 周日） */
function formatRepeatDaysSummary(days) {
  if (!Array.isArray(days) || days.length === 0) return i18n.t('repeatEveryday')
  if (days.length === 7) return i18n.t('repeatEveryday')
  const calDays = i18n.calWeekDays || ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const ordered = MONDAY_TO_SUNDAY.filter((d) => days.includes(d))
  return ordered.map((d) => calDays[d]).join(', ')
}

function getShortRepeatTag(prayer) {
  if (prayer.repeatDays?.length === 7 || prayer.repeatType === 'everyday') return i18n.t('repeatEveryday')
  if (prayer.repeatDays?.length === 1 && prayer.repeatDays[0] === 5) return tr('repeatFriday', '每周五', 'Fridays', 'প্রতি শুক্রবার')
  return formatRepeatDaysSummary(prayer.repeatDays)
}

/* 判断重复标签是否过长需要启用跑马灯滚动（仅在激活未置灰且超过 3 个自定义星期时滚动） */
function isRepeatMarquee(prayer) {
  if (!prayerStore.masterEnabled || !prayer.enabled) return false
  const tag = getShortRepeatTag(prayer)
  return typeof tag === 'string' && tag.length > 10
}

function isDaysMarquee(days) {
  const tag = formatRepeatDaysSummary(days)
  return typeof tag === 'string' && tag.length > 12
}

/* AI 接听二级设置页状态 */
const aiVoiceMale = ref(true)
const aiDndAutoAnswer = ref(false)
const selectedHarassTypes = ref(['fraud'])
const harassTypeOptions = [
  { id: 'fraud', zh: '疑似诈骗', en: 'Suspected Fraud', bn: 'সন্দেহজনক প্রতারণা' },
  { id: 'ads', zh: '广告推销', en: 'Telemarketing', bn: 'বিজ্ঞাপন প্রচার' },
  { id: 'harass', zh: '骚扰电话', en: 'Harassment Calls', bn: 'হয়রানিমূলক কল' },
  { id: 'agent', zh: '房产中介', en: 'Real Estate', bn: 'রিয়েল এস্টেট' },
  { id: 'delivery', zh: '快递外卖', en: 'Delivery', bn: 'ডেলিভারি' }
]

function openAiAnswerSubpage() {
  isBack.value = false
  currentView.value = 'aiAnswer'
}

function handleAiAnswerBack() {
  isBack.value = true
  currentView.value = 'list'
}

function toggleAiVoice() {
  if (!prayerStore.aiAutoAnswer) return
  aiVoiceMale.value = !aiVoiceMale.value
}

function toggleHarassType(id) {
  if (!prayerStore.aiAutoAnswer) return
  const idx = selectedHarassTypes.value.indexOf(id)
  if (idx > -1) {
    selectedHarassTypes.value.splice(idx, 1)
  } else {
    selectedHarassTypes.value.push(id)
  }
}

/* 进入全屏设置页面（总开关或当前时段关闭时禁止点击进入） */
function openEdit(prayer) {
  if (!prayerStore.masterEnabled || !prayer.enabled) return
  isBack.value = false
  editingPrayer.value = prayer
  editForm.value = {
    startTime: prayer.startTime,
    endTime: prayer.endTime,
    repeatType: prayer.repeatType,
    repeatDays: [...prayer.repeatDays]
  }
  currentView.value = 'edit'
}

watch(
  () => prayerStore?.masterEnabled,
  (enabled) => {
    if (!enabled && currentView.value === 'edit') {
      showRepeatModal.value = false
      showTimePicker.value = false
      currentView.value = 'list'
    }
  }
)

function handleEditBack() {
  isBack.value = true
  saveEdit()
  currentView.value = 'list'
}

function back() {
  if (showEnableMuslimAlarmModal.value) {
    cancelEnableMuslimAlarm()
    return true
  }
  if (showRepeatModal.value) {
    closeRepeatModal()
    return true
  }
  if (showTimePicker.value) {
    closeTimePicker()
    return true
  }
  if (currentView.value === 'aiAnswer') {
    handleAiAnswerBack()
    return true
  }
  if (currentView.value === 'reminder') {
    handleReminderBack()
    return true
  }
  if (currentView.value === 'edit') {
    handleEditBack()
    return true
  }
  return false
}

defineExpose({ back })

/* 时间滚轮弹窗控制（使用标准化 TimePickerModal 控件） */
function openTimePicker(type) {
  timePickerType.value = type
  currentTimePickerVal.value = type === 'start' ? editForm.value.startTime : editForm.value.endTime
  showTimePicker.value = true
}

function closeTimePicker() {
  showTimePicker.value = false
}

function handleTimePickerConfirm(val) {
  if (timePickerType.value === 'start') {
    editForm.value.startTime = val
  } else {
    editForm.value.endTime = val
  }
  showTimePicker.value = false
  saveEdit()
}

/* 重复底部弹窗控制（星期一至星期日多选） */
function openRepeatModal() {
  tempRepeatDays.value = [...(editForm.value.repeatDays || MONDAY_TO_SUNDAY)]
  showRepeatModal.value = true
}

function closeRepeatModal() {
  showRepeatModal.value = false
}

function toggleTempWeekDay(day) {
  const idx = tempRepeatDays.value.indexOf(day)
  if (idx > -1) {
    if (tempRepeatDays.value.length > 1) {
      tempRepeatDays.value.splice(idx, 1)
    }
  } else {
    tempRepeatDays.value.push(day)
  }
}

function confirmRepeatModal() {
  const ordered = MONDAY_TO_SUNDAY.filter((d) => tempRepeatDays.value.includes(d))
  editForm.value.repeatDays = ordered
  if (ordered.length === 7) {
    editForm.value.repeatType = 'everyday'
  } else if (ordered.length === 5 && !ordered.includes(5) && !ordered.includes(6)) {
    editForm.value.repeatType = 'weekday'
  } else if (ordered.length === 2 && ordered.includes(5) && ordered.includes(6)) {
    editForm.value.repeatType = 'weekend'
  } else {
    editForm.value.repeatType = 'custom'
  }
  saveEdit()
  showRepeatModal.value = false
}

function saveEdit() {
  if (!editingPrayer.value) return
  const label = formatRepeatDaysSummary(editForm.value.repeatDays)

  prayerStore.updatePrayer(editingPrayer.value.id, {
    startTime: editForm.value.startTime,
    endTime: editForm.value.endTime,
    repeatType: editForm.value.repeatType,
    repeatDays: editForm.value.repeatDays,
    repeatLabel: label
  })
}
</script>

<template>
  <div class="settings-prayer">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 1. 礼拜模式主列表页 ================= -->
      <div v-if="currentView === 'list'" key="list" class="prayer-subpage">
        <!-- 顶部导航：当前菜单名称「礼拜模式」左对齐 -->
        <AppNavBar :title="i18n.t('prayerDnd')" @back="emit('back')" />

        <div class="scrollable detail-body">
          <!-- 总开关 -->
          <div class="cell-group">
            <div class="list-cell">
              <div class="lc-icon" style="background: #34C759;">
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path :d="GLYPHS.moon" fill="#fff" />
                </svg>
              </div>
              <div class="lc-main no-sep">
                <div class="lc-title-col">
                  <span class="lc-title">{{ i18n.t('prayerDnd') }}</span>
                  <span class="lc-sub-desc">{{ i18n.t('prayerDndDesc') }}</span>
                </div>
                <div class="lc-right">
                  <ToggleSwitch v-model="prayerStore.masterEnabled" />
                </div>
              </div>
            </div>
          </div>

          <!-- 五大时段列表 -->
          <div class="group-header">{{ i18n.t('prayerSlots') }}</div>
          <div class="cell-group">
            <div
              v-for="(prayer, index) in prayerStore.prayers"
              :key="prayer.id"
              class="prayer-item-cell"
              :class="{ 'is-disabled': !prayer.enabled || !prayerStore.masterEnabled }"
              @click="openEdit(prayer)"
            >
              <!-- 左侧时段信息：本地化礼拜名称 + 时间与重复标签 -->
              <div class="pic-left">
                <div class="pic-name-row">
                  <span class="pic-name">{{ i18n.prayerFull(prayer.id) }}</span>
                </div>
                <div class="pic-window-row">
                  <span class="pic-window-time">{{ prayer.startTime }} - {{ prayer.endTime }}</span>
                  <div v-if="isRepeatMarquee(prayer)" class="pic-repeat-marquee-mask">
                    <div class="pic-repeat-marquee-track">
                      <span class="pic-repeat-badge">{{ getShortRepeatTag(prayer) }}</span>
                      <span class="pic-repeat-badge" aria-hidden="true">{{ getShortRepeatTag(prayer) }}</span>
                    </div>
                  </div>
                  <span v-else class="pic-repeat-badge">{{ getShortRepeatTag(prayer) }}</span>
                </div>
              </div>

              <!-- 右侧开关 -->
              <div class="pic-right" @click.stop>
                <ToggleSwitch
                  :model-value="prayer.enabled"
                  :disabled="!prayerStore.masterEnabled"
                  @update:model-value="prayerStore.togglePrayer(prayer.id)"
                />
              </div>
            </div>
          </div>

          <!-- 闹钟提醒入口（小标题为唤礼提醒，标题为闹钟提醒，由控制台唤礼提醒开关控制显示） -->
          <template v-if="prayerStore.adhanReminderEnabled">
            <div class="group-header">{{ tr('prayerAlarmHeader', '唤礼提醒', 'ADHAN REMINDER', 'আযান স্মারক') }}</div>
            <div class="cell-group">
              <ListCell
                glyph="bell"
                icon-bg="#FF9500"
                :title="tr('prayerAlarmLinkage', '闹钟提醒', 'Alarm Reminder', 'অ্যালার্ম স্মারক')"
                :subtitle="tr('prayerAlarmLinkageDesc', '礼拜开始前，使用穆斯林闹钟进行提醒', 'Use Muslim alarm for reminders before prayer begins', 'নামাজ শুরুর পূর্বে মুসলিম অ্যালার্ম দিয়ে স্মারক পান')"
                :value="currentReminderLabel"
                chevron
                last
                @click="openReminderSubpage"
              />
            </div>
          </template>

          <!-- 功能：AI 自动接听（右侧改为跳转箭头，点击进入 AI 接听设置页） -->
          <div class="group-header">{{ i18n.t('aiAnswerHeader') }}</div>
          <div class="cell-group">
            <div class="list-cell clickable" @click="openAiAnswerSubpage">
              <div class="lc-icon" style="background: #5856D6;">
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path :d="GLYPHS.sparklesPhone" fill="#fff" />
                </svg>
              </div>
              <div class="lc-main no-sep">
                <div class="lc-title-col">
                  <span class="lc-title">{{ i18n.t('aiAutoAnswerTitle') }}</span>
                  <span class="lc-sub-desc">{{ i18n.t('aiAutoAnswerDesc') }}</span>
                </div>
                <div class="lc-right">
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= 2. 单项礼拜全屏设置页（标题为 x礼，如“晨礼”） ================= -->
      <div v-else-if="currentView === 'edit' && editingPrayer" key="edit" class="prayer-subpage">
        <!-- 顶部导航：标题为对应语言名称，左侧返回按钮「< 礼拜勿扰」 -->
        <AppNavBar :title="i18n.prayerName(editingPrayer.id)" :back-label="i18n.t('prayerDnd')" @back="handleEditBack" />

        <div class="scrollable detail-body">
          <!-- 时间与重复设置卡片（开始时间、结束时间、重复三行合一） -->
          <div class="group-header">{{ i18n.t('prayerTimeSettings') }}</div>
          <div class="cell-group">
            <div class="list-cell clickable" @click="openTimePicker('start')">
              <div class="lc-main">
                <span class="lc-title">{{ i18n.t('startTime') }}</span>
                <div class="lc-right">
                  <span class="ms-time-val">{{ editForm.startTime }}</span>
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="list-cell clickable" @click="openTimePicker('end')">
              <div class="lc-main">
                <span class="lc-title">{{ i18n.t('endTime') }}</span>
                <div class="lc-right">
                  <span class="ms-time-val">{{ editForm.endTime }}</span>
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="list-cell clickable" @click="openRepeatModal">
              <div class="lc-main no-sep">
                <span class="lc-title">{{ i18n.t('repeat') }}</span>
                <div class="lc-right repeat-val-right">
                  <div v-if="isDaysMarquee(editForm.repeatDays)" class="repeat-edit-marquee-mask">
                    <div class="pic-repeat-marquee-track">
                      <span class="ms-time-val">{{ formatRepeatDaysSummary(editForm.repeatDays) }}</span>
                      <span class="ms-time-val" aria-hidden="true">{{ formatRepeatDaysSummary(editForm.repeatDays) }}</span>
                    </div>
                  </div>
                  <span v-else class="ms-time-val repeat-summary-val">{{ formatRepeatDaysSummary(editForm.repeatDays) }}</span>
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= 3. 提醒时间全屏二级页 ================= -->
      <div v-else-if="currentView === 'reminder'" key="reminder" class="prayer-subpage">
        <!-- 顶部导航：当前菜单名称「闹钟提醒」，左侧返回按钮「< 礼拜模式」 -->
        <AppNavBar :title="tr('prayerAlarmLinkage', '闹钟提醒', 'Alarm Reminder', 'অ্যালার্ম স্মারক')" :back-label="tr('prayerDnd', '礼拜模式', 'Prayer Mode', 'নামাজ মোড')" @back="handleReminderBack" />

        <div class="scrollable detail-body">
          <div class="cell-group">
            <div
              v-for="(opt, idx) in reminderOptions"
              :key="opt.value"
              class="list-cell clickable"
              @click="selectReminderOption(opt.value)"
            >
              <div class="lc-main" :class="{ 'no-sep': idx === reminderOptions.length - 1 }">
                <span class="lc-title">{{ tr(opt.labelKey, opt.zh, opt.en, opt.bn) }}</span>
                <div class="lc-right">
                  <svg v-if="currentReminderValue === opt.value" width="18" height="18" viewBox="0 0 24 24">
                    <path :d="GLYPHS.check" fill="#007AFF" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="group-footer">
            {{ tr('reminderDesc', '开启后将在设定的每个礼拜开始时间前启用穆斯林闹钟进行唤礼提醒。', 'Once enabled, Muslim alarm will be activated for adhan reminder before each scheduled prayer starts.', 'চালু করার পর প্রতিটি নির্ধারিত নামাজের সময় শুরু হওয়ার পূর্বে আযান স্মারকের জন্য মুসলিম অ্যালার্ম সক্রিয় হবে।') }}
          </div>
        </div>
      </div>

      <!-- ================= 4. AI 接听全屏设置页（对应图 2、图 3） ================= -->
      <div v-else-if="currentView === 'aiAnswer'" key="aiAnswer" class="prayer-subpage">
        <AppNavBar
          :title="tr('aiAnswerNavTitle', 'AI接听', 'AI Answer', 'AI কল রিসিভ')"
          :back-label="tr('prayerDnd', '礼拜模式', 'Prayer Mode', 'নামাজ মোড')"
          @back="handleAiAnswerBack"
        />

        <div class="scrollable detail-body ai-answer-body">
          <!-- 顶部手机示意图与说明文案 -->
          <div class="ai-hero-banner">
            <div class="ai-phone-illustration">
              <div class="ai-phone-header-mock">
                <div class="ai-mock-row">
                  <span class="ai-mock-bar wide"></span>
                  <span class="ai-mock-bar short"></span>
                </div>
                <div class="ai-mock-row">
                  <span class="ai-mock-dot"></span>
                  <span class="ai-mock-bar mid"></span>
                  <span class="ai-mock-bar mid"></span>
                </div>
              </div>
              <div class="ai-phone-bubble-mock">
                <span class="ai-bubble-line l1"></span>
                <span class="ai-bubble-line l2"></span>
              </div>
            </div>
            <p class="ai-hero-desc">
              {{ tr('aiHeroDesc', '当你不方便接电话时，AI会帮你接听并与对方进行对话，让你不错过任何重要来点。', 'When it is inconvenient to answer calls, AI will answer and converse with the caller so you never miss any important calls.', 'যখন আপনার ফোন রিসিভ করা অসুবিধাজনক হয়, তখন AI আপনার হয়ে কল রিসিভ করবে এবং কথা বলবে।') }}
            </p>
          </div>

          <!-- 核心设置卡片 -->
          <div class="cell-group">
            <!-- 1. AI接听总开关 -->
            <div class="list-cell">
              <div class="lc-main">
                <span class="lc-title ai-bold-title">{{ tr('aiAnswerNavTitle', 'AI接听', 'AI Answer', 'AI কল রিসিভ') }}</span>
                <div class="lc-right">
                  <ToggleSwitch v-model="prayerStore.aiAutoAnswer" />
                </div>
              </div>
            </div>

            <!-- 2. 选择声音 -->
            <div
              class="list-cell clickable"
              :class="{ 'is-row-disabled': !prayerStore.aiAutoAnswer }"
              @click="toggleAiVoice"
            >
              <div class="lc-main">
                <span class="lc-title">{{ tr('aiSelectVoice', '选择声音', 'Select Voice', 'ভয়েস নির্বাচন করুন') }}</span>
                <div class="lc-right">
                  <span class="ms-time-val">{{ aiVoiceMale ? tr('voiceMale', '男', 'Male', 'পুরুষ') : tr('voiceFemale', '女', 'Female', 'মহিলা') }}</span>
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 3. 自定义设置 -->
            <div
              class="list-cell clickable"
              :class="{ 'is-row-disabled': !prayerStore.aiAutoAnswer }"
            >
              <div class="lc-main">
                <span class="lc-title">{{ tr('aiCustomSettings', '自定义设置', 'Custom Settings', 'কাস্টম সেটিংস') }}</span>
                <div class="lc-right">
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 4. 防漏接 -->
            <div
              class="list-cell clickable"
              :class="{ 'is-row-disabled': !prayerStore.aiAutoAnswer }"
            >
              <div class="lc-main">
                <div class="lc-title-col">
                  <span class="lc-title">{{ tr('aiAntiMiss', '防漏接', 'Anti-Missed Call', 'মিসড কল প্রতিরোধ') }}</span>
                  <span class="lc-sub-desc">{{ tr('aiAntiMissDesc', '防止电话遗漏，响铃一定时间后自动接听。', 'Prevent missed calls by answering automatically after ringing.', 'নির্দিষ্ট সময় রিং হওয়ার পর স্বয়ংক্রিয়ভাবে কল রিসিভ করুন।') }}</span>
                </div>
                <div class="lc-right">
                  <span class="ms-time-val">{{ tr('aiAfter5s', '响铃5 s后', 'After 5 s', '৫ সেকেন্ড পর') }}</span>
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 5. 免打扰 -->
            <div
              class="list-cell"
              :class="{ 'is-row-disabled': !prayerStore.aiAutoAnswer }"
            >
              <div class="lc-main">
                <div class="lc-title-col">
                  <span class="lc-title">{{ tr('aiDndTitle', '免打扰', 'Do Not Disturb', 'ডু নট ডিস্টার্ব') }}</span>
                  <span class="lc-sub-desc">{{ tr('aiDndDesc', '在勿扰模式下，AI助手帮你自动接听', 'AI assistant answers calls automatically during DND', 'ডিএনডি মোডে AI সহকারী স্বয়ংক্রিয়ভাবে কল রিসিভ করবে') }}</span>
                </div>
                <div class="lc-right">
                  <ToggleSwitch v-model="aiDndAutoAnswer" :disabled="!prayerStore.aiAutoAnswer" />
                </div>
              </div>
            </div>

            <!-- 6. 防骚扰 -->
            <div
              class="list-cell clickable"
              :class="{ 'is-row-disabled': !prayerStore.aiAutoAnswer }"
            >
              <div class="lc-main no-sep">
                <div class="lc-title-col">
                  <span class="lc-title">{{ tr('aiAntiHarass', '防骚扰', 'Anti-Harassment', 'হয়রানি প্রতিরোধ') }}</span>
                  <span class="lc-sub-desc">{{ tr('aiAntiHarassDesc', '骚扰电话，响铃一定时间后开启自动接听。', 'Auto-answer harassment calls after ringing for a period.', 'হয়রানিমূলক কল নির্দিষ্ট সময় রিং হওয়ার পর স্বয়ংক্রিয়ভাবে রিসিভ করুন।') }}</span>
                </div>
                <div class="lc-right">
                  <span class="ms-time-val">{{ tr('off', '关闭', 'Off', 'বন্ধ') }}</span>
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 选择防骚扰自动接听类型 -->
          <div class="group-header ai-section-header">{{ tr('aiHarassTypeHeader', '选择防骚扰自动接听类型', 'Select Anti-Harassment Auto-Answer Types', 'হয়রানি প্রতিরোধের ধরন নির্বাচন করুন') }}</div>
          <div class="cell-group ai-harass-card" :class="{ 'is-row-disabled': !prayerStore.aiAutoAnswer }">
            <div class="ai-harass-grid">
              <button
                v-for="item in harassTypeOptions"
                :key="item.id"
                type="button"
                class="ai-harass-pill"
                :class="{ 'is-active': selectedHarassTypes.includes(item.id) }"
                @click="toggleHarassType(item.id)"
              >
                {{ tr(item.id, item.zh, item.en, item.bn) }}
              </button>
            </div>
          </div>

          <!-- 隐私政策与用户协议 -->
          <div class="cell-group">
            <div class="list-cell clickable">
              <div class="lc-main">
                <span class="lc-title">{{ tr('privacyPolicy', '隐私政策', 'Privacy Policy', 'গোপনীয়তা নীতি') }}</span>
                <div class="lc-right">
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="list-cell clickable">
              <div class="lc-main no-sep">
                <span class="lc-title">{{ tr('userAgreement', '用户协议', 'User Agreement', 'ব্যবহারকারীর চুক্তি') }}</span>
                <div class="lc-right">
                  <svg class="cell-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1L6 6L1 11" stroke="#B8B8BE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= 重复星期多选底部弹窗（星期一至星期日复选框样式） ================= -->
    <Transition name="picker-bottom">
      <div v-if="showRepeatModal" class="picker-backdrop repeat-modal-backdrop" @click.self="closeRepeatModal">
        <div class="repeat-bottom-sheet" @click.stop>
          <div class="repeat-sheet-title">{{ i18n.t('repeat') }}</div>
          <div class="repeat-weekday-list">
            <div
              v-for="item in modalWeekDays"
              :key="item.day"
              class="repeat-weekday-row"
              @click="toggleTempWeekDay(item.day)"
            >
              <span class="repeat-weekday-label">{{ item.label }}</span>
              <span
                class="repeat-checkbox"
                :class="{ 'is-checked': tempRepeatDays.includes(item.day) }"
              >
                <svg
                  v-if="tempRepeatDays.includes(item.day)"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="#FFFFFF"
                    stroke-width="2.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div class="repeat-sheet-actions">
            <button type="button" class="repeat-sheet-btn is-cancel" @click="closeRepeatModal">
              {{ i18n.t('cancel') }}
            </button>
            <button type="button" class="repeat-sheet-btn is-confirm" @click="confirmRepeatModal">
              {{ i18n.t('confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= 时间选择滚轮弹窗（统一标准化控件） ================= -->
    <TimePickerModal
      v-if="showTimePicker"
      :title="timePickerType === 'start' ? i18n.t('startTime') : i18n.t('endTime')"
      :model-value="currentTimePickerVal"
      :confirm-text="i18n.t('confirm')"
      @confirm="handleTimePickerConfirm"
      @cancel="closeTimePicker"
    />

    <!-- ================= 启用穆斯林闹钟确认弹窗 ================= -->
    <ActionModal
      :visible="showEnableMuslimAlarmModal"
      :title="tr('enableMuslimAlarmTitle', '启用穆斯林闹钟？', 'Enable Muslim Alarm?', 'মুসলিম অ্যালার্ম চালু করবেন?')"
      :desc="tr('enableMuslimAlarmDesc', '使用该功能需先启用穆斯林闹钟！', 'You need to enable Muslim Alarm first to use this feature!', 'এই বৈশিষ্ট্যটি ব্যবহার করতে প্রথমে মুসলিম অ্যালার্ম চালু করতে হবে!')"
      :cancel-text="tr('cancel', '取消', 'Cancel', 'বাতিল')"
      :confirm-text="tr('enableNow', '立即开启', 'Turn On Now', 'এখনই চালু করুন')"
      :confirm-danger="false"
      align-title="center"
      align-desc="center"
      @confirm="confirmEnableMuslimAlarm"
      @cancel="cancelEnableMuslimAlarm"
      @backdrop="cancelEnableMuslimAlarm"
    />

  </div>
</template>

<style scoped>
.settings-prayer {
  height: 100%;
  background: var(--bg-grouped);
  overflow: hidden;
  position: relative;
}

.prayer-subpage {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-body {
  flex: 1;
  padding: 14px 0 34px;
}

/* ================= 极速丝滑进退动画 (160ms 极速响应，无停滞) ================= */
.slide-enter-active,
.slide-back-enter-active {
  transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.16s ease;
}
.slide-leave-active,
.slide-back-leave-active {
  transition: transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease;
}

/* 进入：新页从右滑入 */
.slide-enter-from {
  transform: translateX(36px);
  opacity: 0;
}
.slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}
/* 离开：旧页向左微移退出 */
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

/* 返回进入：旧页从左侧滑回 */
.slide-back-enter-from {
  transform: translateX(-24px);
  opacity: 0;
}
.slide-back-enter-to {
  transform: translateX(0);
  opacity: 1;
}
/* 返回离开：顶页向右滑出 */
.slide-back-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-back-leave-to {
  transform: translateX(36px);
  opacity: 0;
}

/* 单元格与分组 */
.cell-group {
  margin: 0 16px 18px;
  background: var(--bg-cell);
  border-radius: var(--radius-cell-group);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.group-header {
  font: var(--text-footnote);
  color: var(--label-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 20px 20px 7px;
}

.group-footer {
  font: var(--text-caption);
  color: var(--label-tertiary);
  margin: 4px 20px 18px;
  line-height: 1.4;
}

.list-cell {
  display: flex;
  align-items: center;
  background: var(--bg-cell);
  padding-left: 16px;
  min-height: 48px;
  cursor: default;
}
.list-cell.clickable { cursor: pointer; }
.list-cell.clickable:active { background: #E9E9EB; }

.lc-icon {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 13px;
}

.lc-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 12px 0;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  min-width: 0;
}
.lc-main.no-sep { border-bottom: none; }

.lc-title {
  font: 400 15.5px/1.25 var(--font-stack);
  color: var(--label);
}

.lc-title-col {
  display: flex;
  flex-direction: column;
  gap: 2.5px;
  min-width: 0;
  padding-right: 8px;
}

.lc-sub-desc {
  font: 400 12px/1.35 var(--font-stack);
  color: var(--label-secondary);
}

.lc-sub-val {
  font: 400 14px/1.2 var(--font-stack);
  color: var(--label-secondary);
}

.lc-sub-val.dark-text {
  color: #3C3C43;
  font-weight: 400;
}

.lc-right {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
}

/* 礼拜时段专属卡片项 */
.prayer-item-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  background: var(--bg-cell);
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.2s ease;
}

.prayer-item-cell:last-child {
  border-bottom: none;
}

.prayer-item-cell:active {
  background: #EAEAEA;
}

.prayer-item-cell {
  transform: translateZ(0);
  backface-visibility: hidden;
}

.prayer-item-cell.is-disabled {
  opacity: 0.45;
  cursor: default;
}

.prayer-item-cell :deep(.toggle-switch.disabled) {
  opacity: 1;
}

.prayer-item-cell.is-disabled:active {
  background: var(--bg-cell);
}

.pic-left {
  flex: 1;
  min-width: 0;
}

.pic-name-row {
  display: flex;
  align-items: center;
  height: 20px;
  line-height: 20px;
}

.pic-name {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--label);
}

.pic-window-row {
  margin-top: 4px;
  height: 18px;
  line-height: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
}

.pic-window-time {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 13.5px;
  font-weight: 500;
  color: #636366; /* 深灰色 */
  letter-spacing: 0.2px;
  white-space: nowrap;
  flex-shrink: 0;
  height: 18px;
  line-height: 18px;
  display: inline-flex;
  align-items: center;
}

.pic-repeat-badge {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 12px;
  font-weight: 450;
  color: #8e8e93;
  white-space: nowrap;
  flex-shrink: 0;
  height: 18px;
  line-height: 18px;
  display: inline-flex;
  align-items: center;
}

.pic-window-row > .pic-repeat-badge {
  flex: 1;
  min-width: 0;
  display: block;
  height: 18px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pic-repeat-marquee-mask {
  flex: 1;
  min-width: 0;
  height: 18px;
  line-height: 18px;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  mask-image: linear-gradient(90deg, #000 0%, #000 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 92%, transparent 100%);
}

.repeat-edit-marquee-mask {
  max-width: 185px;
  height: 18px;
  line-height: 18px;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  mask-image: linear-gradient(90deg, #000 0%, #000 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 92%, transparent 100%);
}

.pic-repeat-marquee-track {
  display: inline-flex;
  align-items: center;
  height: 18px;
  line-height: 18px;
  gap: 24px;
  width: max-content;
  animation: prayerRepeatMarquee 4.5s ease-in-out 0.35s 1 forwards;
}

@keyframes prayerRepeatMarquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-50% - 12px));
  }
}

.pic-right {
  display: flex;
  align-items: center;
  flex: none;
  margin-left: 12px;
}

/* 无背板深灰字体时间 */
.ms-time-val {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 14.5px;
  font-weight: 400;
  color: #8E8E93;
  letter-spacing: 0.1px;
  white-space: nowrap;
}

.repeat-val-right {
  max-width: 74%;
  min-width: 0;
  overflow: hidden;
}

.repeat-summary-val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-chevron {
  flex: none;
  margin-left: 2px;
}

/* ================= 重复选择底部弹窗样式（全宽修复） ================= */
.picker-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 12px 24px;
}

.repeat-modal-backdrop {
  z-index: 400;
  background: rgba(0, 0, 0, 0.36);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  padding: 0 12px 14px;
}

.repeat-bottom-sheet {
  width: 100%;
  max-width: 360px;
  background: #FFFFFF;
  border-radius: 26px;
  padding: 18px 20px 18px;
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.repeat-sheet-title {
  width: 100%;
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 10px;
  letter-spacing: -0.2px;
}

.repeat-weekday-list {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.repeat-weekday-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 2px;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
}

.repeat-weekday-row:active {
  opacity: 0.75;
}

.repeat-weekday-label {
  font-size: 15.5px;
  font-weight: 500;
  color: #1C1C1E;
}

.repeat-checkbox {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.5px solid #D1D1D6;
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: background 0.14s ease, border-color 0.14s ease, transform 0.1s ease;
}

.repeat-checkbox.is-checked {
  background: #007AFF;
  border-color: #007AFF;
}

.repeat-sheet-actions {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.repeat-sheet-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 15.5px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.repeat-sheet-btn:active {
  transform: scale(0.98);
  opacity: 0.88;
}

.repeat-sheet-btn.is-cancel {
  background: #EAECEF;
  color: #1C1C1E;
}

.repeat-sheet-btn.is-confirm {
  background: #007AFF;
  color: #FFFFFF;
}

/* ================= AI 接听设置页面样式（对应图 2、图 3） ================= */
.ai-answer-body {
  padding-top: 8px;
}

.ai-hero-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 24px 20px;
}

.ai-phone-illustration {
  width: 112px;
  height: 186px;
  border-radius: 16px;
  border: 2px solid #7C7C80;
  background: #F9F9FB;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.ai-phone-header-mock {
  background: #E5E5EA;
  padding: 10px 9px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ai-mock-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-mock-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #D1D1D6;
  flex: none;
}

.ai-mock-bar {
  height: 8px;
  border-radius: 4px;
  background: #D1D1D6;
}

.ai-mock-bar.wide {
  width: 64px;
}

.ai-mock-bar.short {
  width: 18px;
  margin-left: auto;
}

.ai-mock-bar.mid {
  flex: 1;
  height: 9px;
}

.ai-phone-bubble-mock {
  margin: 12px 10px 0 auto;
  width: 76px;
  padding: 7px 8px;
  border-radius: 8px 8px 3px 8px;
  background: linear-gradient(135deg, #BBE7F6 0%, #FAD0C4 100%);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-bubble-line {
  height: 3px;
  border-radius: 1.5px;
  background: rgba(255, 255, 255, 0.72);
}

.ai-bubble-line.l1 {
  width: 92%;
}

.ai-bubble-line.l2 {
  width: 70%;
}

.ai-hero-desc {
  margin: 18px 0 0;
  font-size: 12.5px;
  line-height: 1.48;
  color: #8E8E93;
  text-align: center;
}

.ai-bold-title {
  font-weight: 600;
}

.is-row-disabled {
  opacity: 0.42;
  pointer-events: none;
}

.ai-section-header {
  text-transform: none;
  font-size: 12.5px;
  color: #8E8E93;
  margin: 16px 20px 8px;
}

.ai-harass-card {
  padding: 16px 14px;
}

.ai-harass-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.ai-harass-pill {
  height: 36px;
  border-radius: 18px;
  border: none;
  background: #F2F2F7;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.ai-harass-pill.is-active {
  background: rgba(52, 199, 89, 0.14);
  color: #34C759;
  font-weight: 600;
}

/* 弹窗底部滑入过渡 */
.picker-bottom-enter-active,
.picker-bottom-leave-active {
  transition: opacity 0.25s ease;
}

.picker-bottom-enter-from,
.picker-bottom-leave-to {
  opacity: 0;
}

.picker-bottom-enter-active .repeat-bottom-sheet {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.picker-bottom-leave-active .repeat-bottom-sheet {
  transition: transform 0.22s cubic-bezier(0.8, 0, 0.8, 0.2);
}

.picker-bottom-enter-from .repeat-bottom-sheet,
.picker-bottom-leave-to .repeat-bottom-sheet {
  transform: translateY(100%);
}
</style>
