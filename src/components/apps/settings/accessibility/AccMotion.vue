<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccCarousel from './AccCarousel.vue'
import AccPending from './AccPending.vue'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import ride1 from '../../../../assets/icons/accessibility/illus/illus-motion.png'
import ride2 from '../../../../assets/icons/accessibility/illus/illus-motion2.png'
import ride3 from '../../../../assets/icons/accessibility/illus/illus-motion3.png'
import ride4 from '../../../../assets/icons/accessibility/illus/illus-motion4.png'
import game1 from '../../../../assets/icons/accessibility/illus/illus-motion-game1.png'
import game2 from '../../../../assets/icons/accessibility/illus/illus-motion-game2.png'

/**
 * 晕动舒缓显示（真机 com.transsion.microintelligence AntiDizzySettingActivity）
 *
 * 结构（2026-11-14 补采，两屏逐页滑动核对）：
 *   顶部两段标签「乘车 / 游戏」，选中项蓝字 + 与文字同宽的蓝色下划线（2px）
 *   乘车 4 页插图：加速或减速 / 转弯或变道 / 上下颠簸 / 左右摇晃（顺序按实际滑动读到）
 *   游戏 2 页插图：角色移动 / 视角变化（真实游戏画面，不是线框示意）
 *   乘车：卡 1 晕动舒缓显示（开关，默认关）· 卡 2 自定义外观（chevron）· 卡外脚注
 *   游戏：卡 1 游戏防眩晕（开关，默认关）· 卡外说明（支持的游戏清单）
 *
 * ⚠️ 无障碍树里 ViewPager 的 content-desc 与当前页标签差一页，四页标题以逐页截图的可见文字为准。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const RIDE_PAGES = [
  { src: ride1, title: '加速或减速', desc: '屏幕两侧圆点会向后或向前移动。' },
  { src: ride2, title: '转弯或变道', desc: '屏幕两侧圆点会向左或向右移动。' },
  { src: ride3, title: '上下颠簸', desc: '屏幕两侧圆点会放大或缩小显示。' },
  { src: ride4, title: '左右摇晃', desc: '屏幕两侧圆点会高低变化。' }
]

const GAME_PAGES = [
  { src: game1, title: '角色移动', desc: '屏幕两侧圆点会跟随角色移动。' },
  { src: game2, title: '视角变化', desc: '屏幕两侧圆点会跟随视角变化移动。' }
]

const tabs = [
  { value: 'ride', label: '乘车' },
  { value: 'game', label: '游戏' }
]

const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="自定义外观是独立的取色/形状配置页，2026-11-14 未采集。"
    @back="pending = ''"
  />
  <SubPageShell v-else title="晕动舒缓显示" @back="emit('back')">
    <div class="acc-page motion-page">
      <div class="motion-tabs">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          class="motion-tab"
          :class="{ 'is-active': acc.motionTab === t.value }"
          :data-testid="`motion-tab-${t.value}`"
          @click="acc.setMotionTab(t.value)"
        >
          <span class="motion-tab-label">{{ t.label }}</span>
        </button>
      </div>

      <AccCarousel
        :key="acc.motionTab"
        :pages="acc.motionTab === 'ride' ? RIDE_PAGES : GAME_PAGES"
        :dots="acc.motionTab === 'ride' ? 4 : 2"
      />

      <div class="acc-card" data-testid="motion-card">
        <ListCell :title="acc.motionTab === 'ride' ? '晕动舒缓显示' : '游戏防眩晕'" last>
          <template #right>
            <ToggleSwitch
              :model-value="acc.motionEnabled"
              color="blue"
              @update:model-value="v => acc.setFlag('motionEnabled', v)"
            />
          </template>
        </ListCell>
      </div>

      <template v-if="acc.motionTab === 'ride'">
        <div class="acc-card">
          <ListCell title="自定义外观" chevron last @click="pending = '自定义外观'" />
        </div>
        <p class="motion-note">自定义时，圆点将保持显示以便查看效果。</p>
      </template>
      <p v-else class="motion-note">
        可减轻游戏操控时的晕动症，如头晕、恶心等，目前支持 Freefire、PUBG Mobile、Call of Duty Mobile 等游戏。
      </p>
    </div>
  </SubPageShell>
</template>

<style scoped>
.motion-page {
  padding-top: 0;
}

/* ===== 两段标签：真机每个 146 宽、间隔 20、左右各 24 ===== */
.motion-tabs {
  display: flex;
  gap: 20px;
  padding: 0 24px;
  margin-bottom: 10px;
}

.motion-tab {
  flex: 1;
  height: 56px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
}

.motion-tab-label {
  position: relative;
  padding-top: 8px;
  font-size: 16px;
  line-height: 20px;
  /* 真机：未选中是灰字，选中是黑字加粗 —— 蓝只出现在下划线上 */
  color: #8E8E93;
}

.motion-tab.is-active .motion-tab-label {
  color: #111;
  font-weight: 600;
}

/* 下划线宽度 = 文字宽度（真机 105 物理 px ≈ 31 设计 px），2px 高、圆头 */
.motion-tab.is-active .motion-tab-label::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -12px;
  height: 2px;
  border-radius: 1px;
  background: #3375F6;
}

.motion-note {
  margin: 0;
  padding: 0 16px 4px;
  font-size: 12px;
  line-height: 18px;
  color: #8E8E93;
}
</style>
