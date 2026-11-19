<script setup>
import { computed } from 'vue'

const props = defineProps({ view: { type: String, default: 'month' } })
const emit = defineEmits(['update:view'])
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth()
const todayDate = today.getDate()
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const monthTitle = `${year}年${month + 1}月`

const dates = computed(() => {
  if (props.view === 'week') {
    const start = new Date(year, month, todayDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return { day: date.getDate(), weekday: weekdays[date.getDay()], currentMonth: date.getMonth() === month, isToday: date.getMonth() === month && date.getDate() === todayDate }
    })
  }

  const first = new Date(year, month, 1)
  const firstCell = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell)
    date.setDate(firstCell.getDate() + index)
    return { day: date.getDate(), weekday: weekdays[date.getDay()], currentMonth: date.getMonth() === month, isToday: date.getMonth() === month && date.getDate() === todayDate }
  })
})
</script>

<template>
  <div class="back-calendar" :class="`is-${view}`" aria-label="背屏日历">
    <header class="calendar-header">
      <strong>{{ monthTitle }}</strong>
      <div class="calendar-view-switch" role="group" aria-label="日历视图">
        <button type="button" :class="{ active: view === 'month' }" @click="emit('update:view', 'month')">月</button>
        <button type="button" :class="{ active: view === 'week' }" @click="emit('update:view', 'week')">周</button>
      </div>
    </header>
    <div class="calendar-grid" :class="{ 'week-grid': view === 'week' }" role="grid">
      <span v-for="(date, index) in dates" :key="`${date.day}-${index}`" class="calendar-day" :class="{ muted: !date.currentMonth, today: date.isToday }" role="gridcell">
        <small v-if="view === 'week'">{{ date.weekday }}</small>
        <b>{{ date.day }}</b>
      </span>
    </div>
  </div>
</template>

<style scoped>
.back-calendar { position:absolute; inset:23px 9px 7px; display:flex; flex-direction:column; gap:6px; min-width:0; color:#f4f7ff; container-type:size; }
.calendar-header { display:flex; align-items:center; justify-content:space-between; min-height:20px; }
.calendar-header strong { font-size:9cqh; font-weight:650; letter-spacing:.02em; }
.calendar-view-switch { display:flex; gap:2px; padding:2px; border:1px solid rgba(197,215,245,.16); border-radius:999px; background:rgba(5,10,20,.48); }
.calendar-view-switch button { min-width:24px; height:17px; border:0; border-radius:999px; color:rgba(224,234,249,.68); background:transparent; font:600 7cqh/1 var(--font-stack); cursor:pointer; }
.calendar-view-switch button.active { color:#fff; background:rgba(93,142,232,.54); box-shadow:inset 0 .5px 0 rgba(255,255,255,.18); }
.calendar-grid { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); grid-template-rows:repeat(6,minmax(0,1fr)); flex:1; min-height:0; gap:1px; }
.calendar-day { display:flex; align-items:center; justify-content:center; min-width:0; color:rgba(234,241,253,.94); font-size:7cqh; font-variant-numeric:tabular-nums; }
.calendar-day b { display:grid; width:18px; aspect-ratio:1; place-items:center; border-radius:50%; font-weight:500; }
.calendar-day.muted { color:rgba(202,216,239,.32); }
.calendar-day.today b { color:#fff; background:#4285f4; box-shadow:0 0 10px rgba(72,143,255,.5); font-weight:700; }
.week-grid { grid-template-rows:minmax(0,1fr); }
.week-grid .calendar-day { flex-direction:column; gap:4px; font-size:8cqh; }
.week-grid .calendar-day small { color:rgba(216,228,247,.58); font-size:6.5cqh; }
.week-grid .calendar-day b { width:21px; }
</style>
