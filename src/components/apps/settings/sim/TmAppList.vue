<script setup>
/**
 * 应用开关列表（不受限制的应用 / 应用 Wi-Fi 权限管理 共用）
 *
 * 真机形态：白底、无卡片边框、无分隔线，行高 64；
 * 左侧 38 图标 + 16 间距 + 应用名（16px）+ 右侧 Material 开关。
 */
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'

const props = defineProps({
  sections: { type: Array, required: true }, // [{ letter, apps }]
  list: { type: String, default: 'wifiAllowed' }, // 'wifiAllowed' | 'unrestricted'
  testid: { type: String, default: 'tm-applist' }
})

const traffic = useTrafficStore()

function toggle(id) {
  traffic.toggleApp(props.list, id)
}
</script>

<template>
  <div class="tm-applist" :data-testid="testid">
    <template v-for="section in sections" :key="section.letter">
      <div
        v-for="app in section.apps"
        :key="app.id"
        class="tm-appitem"
        :data-letter="section.letter"
        :data-app-id="app.id"
        @click="toggle(app.id)"
      >
        <RegisteredAppIcon :app="app" :size="38" />
        <span class="tm-appname">{{ app.name }}</span>
        <span @click.stop>
          <TmSwitch
            :model-value="traffic.isAppOn(list, app.id)"
            :testid="`tm-switch-${app.id}`"
            @update:model-value="() => toggle(app.id)"
          />
        </span>
      </div>
    </template>
  </div>
</template>
