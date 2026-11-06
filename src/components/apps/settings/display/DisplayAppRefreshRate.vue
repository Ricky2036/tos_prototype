<script setup>
import { ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import NotificationIcon from '../../../ui/NotificationIcon.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'

/**
 * 自定义应用刷新率（显示与亮度 → 屏幕刷新率 → 自定义应用刷新率）
 *
 * ⚠️ 这一页**只在刷新率选了「高」时可进**（真机规则：与「高」绑定），
 *    由上一层的行禁用态拦截；这里再兜一层，从别处进来也不生效。
 * ⚠️ 页面版式尚未有真机截图（当时该行在「智能切换」下是灰的），
 *    当前按「应用列表 + 右侧当前档位 + 单选弹层」实现，等取证后校准。
 */
const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

// 只用仓里已有且互不重复的应用图标，避免两个应用共用同一个图标
const APPS = [
  { id: 'douyin', label: '抖音', iconType: 'tiktok' },
  { id: 'honorOfKings', label: '王者荣耀', iconType: 'games' },
  { id: 'youtube', label: 'YouTube', iconType: 'youtube' },
  { id: 'wechat', label: '微信', iconType: 'wechat' },
  { id: 'spotify', label: 'Spotify', iconType: 'spotify' },
  { id: 'instagram', label: 'Instagram', iconType: 'instagram' }
]

const MODES = [
  { value: 'auto', label: '智能切换' },
  { value: 'standard', label: '标准（最高 60 Hz）' },
  { value: 'high', label: '高（最高 144 Hz）' }
]

const LABEL = { auto: '智能切换', standard: '标准', high: '高' }
const picking = ref(null)

function valueLabel(appId) {
  return LABEL[display.perAppRefreshOf(appId)] || '智能切换'
}

function pick(value) {
  if (!picking.value) return
  display.setPerAppRefresh(picking.value, value)
  picking.value = null
}
</script>

<template>
  <SubPageShell title="自定义应用刷新率" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        v-for="(app, i) in APPS"
        :key="app.id"
        :title="app.label"
        :value="valueLabel(app.id)"
        :last="i === APPS.length - 1"
        chevron
        clickable
        @click="picking = app.id"
      >
        <template #icon>
          <div class="app-icon-wrap">
            <NotificationIcon :type="app.iconType" :size="34" />
          </div>
        </template>
      </ListCell>
    </div>

    <div class="card-note">
      仅对支持高刷新率的应用生效；未指定的应用跟随系统刷新率设置。
    </div>

    <SheetOptionPicker
      :visible="Boolean(picking)"
      title="刷新率"
      :options="MODES"
      :model-value="picking ? display.perAppRefreshOf(picking) : 'auto'"
      @update:model-value="pick"
      @close="picking = null"
    />
  </SubPageShell>
</template>

<style scoped>
.app-icon-wrap {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 12px;
}
</style>
