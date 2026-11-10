<script setup>
import { computed, ref } from 'vue'
import '../../../../styles/layer-transitions.css'
import DhShell from './DhShell.vue'
import DhAppDetail from './DhAppDetail.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'
import { dhLimitLabel } from './dhData.js'

/**
 * 应用定时器（真机 dh_60_apptimer，AppLimitsActivity）。
 *
 * 真机结构：蓝色小标「您的应用」+ 全部应用行，行右侧是**沙漏图标**（左侧带一条细竖线），
 * 已设定时器的应用沙漏为实心蓝。点任一行进应用详情（屏幕使用时间 / 设置段）。
 */
const emit = defineEmits(['back', 'open-activity'])
const dh = useDigitalHealthStore()

const apps = getRegisteredApps()
const detailAppId = ref('')
const isBack = ref(false)
const detailApp = computed(() => apps.find(a => a.id === detailAppId.value) || null)

function openDetail(app) {
  isBack.value = false
  detailAppId.value = app.id
}
function closeDetail() {
  isBack.value = true
  detailAppId.value = ''
}

const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 1800)
}
</script>

<template>
  <Transition :name="isBack ? 'slide-back' : 'slide'">
    <DhShell v-if="!detailApp" key="list" title="应用定时器" @back="emit('back')">
      <template #right>
        <DhOverflowMenu @pick="showToast" />
      </template>

      <div class="dh-label" data-dh-limits-label>您的应用</div>

      <div class="dh-card" data-dh-limits-list>
        <button
          v-for="app in apps"
          :key="app.id"
          type="button"
          class="dh-row dh-app-row"
          :data-dh-app="app.id"
          @click="openDetail(app)"
        >
          <RegisteredAppIcon :app="app" :size="30" />
          <span class="dh-app-name">{{ app.name }}</span>
          <span class="dh-hourglass" :class="{ on: dh.limitFor(app.id) > 0 }">
            <span class="dh-hourglass-line" aria-hidden="true"></span>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 3.4h10M7 20.6h10M8 3.4v3.1c0 1 .5 1.9 1.3 2.6L12 11.5l2.7-2.4c.8-.7 1.3-1.6 1.3-2.6V3.4M8 20.6v-3.1c0-1 .5-1.9 1.3-2.6L12 12.5l2.7 2.4c.8.7 1.3 1.6 1.3 2.6v3.1"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span v-if="dh.limitFor(app.id) > 0" class="dh-hourglass-badge">{{ dhLimitLabel(dh.limitFor(app.id)) }}</span>
          </span>
        </button>
      </div>

    </DhShell>

    <DhAppDetail
      v-else
      key="detail"
      :app="detailApp"
      @back="closeDetail"
      @toast="showToast"
      @open-activity="emit('open-activity')"
    />
  </Transition>

  <!-- toast 必须挂在根级：列表分支被 v-if 卸载时，写在列表里的 toast 会一起消失 -->
  <div v-if="toast" class="dh-toast" data-dh-toast>{{ toast }}</div>
</template>

<style scoped>
.dh-app-row { padding: 13px 16px; gap: 16px; }
.dh-app-name { flex: 1; font-size: 16px; color: #1F1F1F; }

/* 沙漏：左侧一条细竖线（真机每个应用行都有），有定时器时图标与文字变蓝 */
.dh-hourglass {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #5F6368;
  flex: none;
  position: relative;
  padding-left: 18px;
}

.dh-hourglass-line {
  position: absolute;
  left: 0;
  top: -13px;
  bottom: -13px;
  width: 0.5px;
  background: rgba(60, 64, 67, 0.18);
}

.dh-hourglass.on { color: #1A73E8; }

.dh-hourglass-badge {
  font-size: 12px;
  color: #1A73E8;
  white-space: nowrap;
}

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
