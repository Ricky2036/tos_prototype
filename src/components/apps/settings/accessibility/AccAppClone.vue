<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccPending from './AccPending.vue'
import { ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import fbIcon from '../../../../assets/icons/accessibility/apps/facebook.png'
import igIcon from '../../../../assets/icons/accessibility/apps/instagram.png'
import tgIcon from '../../../../assets/icons/accessibility/apps/telegram.png'
import wxIcon from '../../../../assets/icons/accessibility/apps/wechat.png'

/**
 * 应用双开（真机 com.transsion.dualapp MainActivity）
 *
 * 结构（2026-11-14 采集）：
 *   导航栏右上角 ⋮（点开是单条菜单「清理双开空间」）
 *   分组「推荐应用」：Facebook / Instagram / Telegram / 微信，每行 56 设计 px、31px 图标 + 开关（默认全关）
 *   独立卡「体验更多应用」+ 右箭头
 *   页面底部有 XGuard 水印
 *
 * 「体验更多应用」跳到应用商店的双开推荐页，原型里没有 → 缺口页。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const APPS = [
  { name: 'Facebook', img: fbIcon },
  { name: 'Instagram', img: igIcon },
  { name: 'Telegram', img: tgIcon },
  { name: '微信', img: wxIcon }
]

const menuOpen = ref(false)
const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="跳转到应用商店的双开推荐页，属于第三方应用，原型内不存在该页面。"
    @back="pending = ''"
  />
  <SubPageShell v-else title="应用双开" @back="emit('back')">
    <template #navRight>
      <button
        type="button"
        class="clone-more"
        aria-label="更多"
        data-testid="clone-more"
        @click="menuOpen = !menuOpen"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1C1C1E">
          <circle cx="12" cy="5" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>
    </template>

    <div class="acc-page clone-page">
      <div class="acc-group-title">推荐应用</div>
      <div class="acc-card">
        <div
          v-for="(app, i) in APPS"
          :key="app.name"
          class="clone-row"
          :class="{ 'is-last': i === APPS.length - 1 }"
          @click="acc.toggleCloneApp(app.name)"
        >
          <img :src="app.img" class="clone-icon" alt="" draggable="false" />
          <span class="clone-name">{{ app.name }}</span>
          <span class="clone-switch" @click.stop>
            <ToggleSwitch
              :model-value="acc.cloneApps.includes(app.name)"
              color="blue"
              @update:model-value="acc.toggleCloneApp(app.name)"
            />
          </span>
        </div>
      </div>

      <div class="acc-card">
        <div class="clone-row is-link" data-testid="clone-more-apps" @click="pending = '体验更多应用'">
          <span class="clone-name">体验更多应用</span>
          <svg class="clone-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <div class="clone-watermark">
        <span class="clone-watermark-badge">✓</span>
        <span>XGuard</span>
      </div>
    </div>

    <template #bottom>
      <div v-if="menuOpen" class="clone-menu-mask" @click="menuOpen = false">
        <div class="clone-menu" data-testid="clone-menu" @click.stop>
          <button type="button" class="clone-menu-item" @click="menuOpen = false">清理双开空间</button>
        </div>
      </div>
    </template>
  </SubPageShell>
</template>

<style scoped>
/* 让水印贴到页面底部：内容不足一屏时也沉底 */
.clone-page {
  padding-top: 0;
  /* 真机组标题行盒 92~110、卡顶 122，外壳默认从 110 起算，收回 12 */
  margin-top: -12px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--nav-h) - 16px);
  box-sizing: border-box;
}

/* 行：真机 187 物理 px = 56 设计 px，图标 31px、行内左缩进 16 */
.clone-row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 56px;
  padding: 0 16px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
}

.clone-row + .clone-row::before {
  content: '';
  position: absolute;
  left: 61px;
  right: 0;
  top: 0;
  height: 0.5px;
  background: #F0F1F3;
}

.clone-icon {
  width: 31px;
  height: 31px;
  border-radius: 8px;
  flex: none;
  display: block;
  user-select: none;
}

.clone-name {
  flex: 1;
  min-width: 0;
  font-size: 15.5px;
  font-weight: 500;
  letter-spacing: -0.15px;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clone-switch {
  flex: none;
}

.clone-row.is-link {
  min-height: 52px;
}

.clone-chevron {
  flex: none;
  color: #C5C5C7;
}

/* XGuard 水印：真机在页面最底部居中，绿底勾 + 灰字 */
.clone-watermark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-bottom: 8px;
  font-size: 11px;
  color: #8E8E93;
}

.clone-watermark-badge {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #21A35B;
  color: #fff;
  font-size: 9px;
  line-height: 13px;
  text-align: center;
}

/* ===== 右上角 ⋮ ===== */
.clone-more {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.clone-menu-mask {
  position: absolute;
  inset: 0;
  /* 真机的菜单是 PopupWindow：点外面任意位置收起，导航栏那两个圆钮仍可点。
     导航栏 z-index 12，这里压到 11 就能盖住内容但压不住导航。 */
  z-index: 11;
}

.clone-menu {
  position: absolute;
  top: calc(var(--safe-top, 0px) + 54px);
  right: 16px;
  min-width: 132px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.clone-menu-item {
  display: block;
  width: 100%;
  padding: 13px 18px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 15px;
  color: #111;
  text-align: center;
  cursor: pointer;
}

.clone-menu-item:active {
  background: #F2F2F7;
}
</style>
