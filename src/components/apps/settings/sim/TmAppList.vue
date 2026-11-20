<script setup>
/**
 * 应用开关列表（不受限制的应用 / 应用 Wi-Fi 权限管理 共用）
 *
 * 真机形态（1208×2644 截图）：按分组各一张白卡，行高 62；
 * 左侧 40 图标 + 16 间距 + 应用名 16.5 + 右侧 Material 开关；
 * 行间是浅灰细分隔线，从应用名左缘（x=72）起画到右缘。
 */
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'

const props = defineProps({
  sections: { type: Array, required: true }, // [{ label, letter, apps }]
  list: { type: String, default: 'wifiAllowed' },
  testid: { type: String, default: 'tm-applist' }
})

const traffic = useTrafficStore()

function toggle(id) {
  traffic.toggleApp(props.list, id)
}
</script>

<template>
  <div class="tm-applist" :data-testid="testid">
    <template v-for="section in sections" :key="section.label + section.letter">
      <div v-if="section.label" class="tm-section-label">{{ section.label }}</div>
      <div class="tm-card">
        <div
          v-for="app in section.apps"
          :key="app.id"
          class="tm-appitem"
          :data-letter="app.initial"
          :data-app-id="app.id"
          @click="toggle(app.id)"
        >
          <RegisteredAppIcon :app="app" :size="40" />
          <span class="tm-appname">{{ app.name }}</span>
          <span @click.stop>
            <TmSwitch
              :model-value="traffic.isAppOn(list, app.id)"
              :testid="`tm-switch-${app.id}`"
              @update:model-value="() => toggle(app.id)"
            />
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
