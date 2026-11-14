<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import '../../../styles/layer-transitions.css'
import { ref, inject, computed } from 'vue'
import { useBackHandler } from '../../../composables/backRegistry'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import AccA11yServices from './accessibility/AccA11yServices.vue'
import AccScreenRecord from './accessibility/AccScreenRecord.vue'
import AccScreenshot from './accessibility/AccScreenshot.vue'
import AccSmartGrip from './accessibility/AccSmartGrip.vue'
import AccSplitScreen from './accessibility/AccSplitScreen.vue'
import AccSidebar from './accessibility/AccSidebar.vue'
import AccOutdoor from './accessibility/AccOutdoor.vue'
import AccMotion from './accessibility/AccMotion.vue'
import AccGame from './accessibility/AccGame.vue'
import AccPending from './accessibility/AccPending.vue'
import { useAccessibilitySettingsStore } from '../../../stores/accessibilitySettingsStore.js'

import heroIcon from '../../../assets/icons/accessibility/hero.webp'
import accessibilityIcon from '../../../assets/icons/accessibility/accessibility.webp'
import recordIcon from '../../../assets/icons/accessibility/record.webp'
import screenshotIcon from '../../../assets/icons/accessibility/screenshot.webp'
import gestureIcon from '../../../assets/icons/accessibility/gesture.webp'
import gripIcon from '../../../assets/icons/accessibility/grip.webp'
import floatWindowIcon from '../../../assets/icons/accessibility/float_window.webp'
import splitIcon from '../../../assets/icons/accessibility/split.webp'
import sidebarIcon from '../../../assets/icons/accessibility/sidebar.webp'
import outdoorIcon from '../../../assets/icons/accessibility/outdoor.webp'
import motionIcon from '../../../assets/icons/accessibility/motion.webp'
import gameIcon from '../../../assets/icons/accessibility/game.webp'
import mistouchIcon from '../../../assets/icons/accessibility/mistouch.webp'

/**
 * 辅助功能（SET-ACC-01）
 *
 * 真机依据：`spec/captures/SET-ACC-01-accessibility.md`
 * （Infinix X6878 / Android 17，2026-11-13 采集；落地 Activity `Settings$IntelligentAssistActivity`）
 *
 * 入口 → 落地页的对应关系有两条**两入口一落地**，按真机原样接：
 *   动作与手势 / 智感握姿 → 同一个「智感握姿」页（SmartGripSettingActivity）
 *   小窗 / 应用分屏 → 同一个「应用分屏」页（SplitSettingsMainActivity）
 *
 * 防误触模式是主页唯一的行内开关（真机默认开、蓝色）。
 * 未采到的深层入口统一走 AccPending 明示缺口，不用 toast 冒充已实现。
 */
const emit = defineEmits(['back', 'navigate'])
const acc = useAccessibilitySettingsStore()

const subPage = ref(null)
const isBack = ref(false)

const SUB_TITLES = {
  a11y: '无障碍',
  record: '录屏',
  screenshot: '截屏',
  grip: '智感握姿',
  split: '应用分屏',
  sidebar: '智能侧边栏',
  outdoor: '户外增强',
  motion: '晕动舒缓显示',
  game: '游戏模式',
  'link-appClone': '应用双开',
  'link-antiPeep': '防偷窥'
}

function openSub(key) {
  isBack.value = false
  subPage.value = key
}
function closeSub() {
  isBack.value = true
  subPage.value = null
}

const pendingTitle = computed(() =>
  subPage.value && subPage.value.startsWith('link-') ? SUB_TITLES[subPage.value] : ''
)

function back() {
  if (subPage.value) { closeSub(); return true }
  emit('back')
  return true
}

const settingsNav = inject('settingsNav', null)
useBackHandler(() => back())

/* 「你可能想找」：数字健康已有独立模块，走主壳路由；应用双开/防偷窥未采 → 缺口页 */
function openRelative(target) {
  if (target === 'digitalHealth') {
    if (settingsNav) { settingsNav.push('digitalHealth'); return }
    emit('navigate', 'digitalHealth')
    return
  }
  openSub(target === 'appClone' ? 'link-appClone' : 'link-antiPeep')
}

defineExpose({ back })
</script>

<template>
  <div class="settings-accessibility-page">
    <!-- 子页：统一进退转场 -->
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <AccA11yServices v-if="subPage === 'a11y'" key="a11y" @back="closeSub" />
      <AccScreenRecord v-else-if="subPage === 'record'" key="record" @back="closeSub" />
      <AccScreenshot v-else-if="subPage === 'screenshot'" key="screenshot" @back="closeSub" />
      <AccSmartGrip v-else-if="subPage === 'grip'" key="grip" @back="closeSub" />
      <AccSplitScreen v-else-if="subPage === 'split'" key="split" @back="closeSub" />
      <AccSidebar v-else-if="subPage === 'sidebar'" key="sidebar" @back="closeSub" />
      <AccOutdoor v-else-if="subPage === 'outdoor'" key="outdoor" @back="closeSub" />
      <AccMotion v-else-if="subPage === 'motion'" key="motion" @back="closeSub" />
      <AccGame v-else-if="subPage === 'game'" key="game" @back="closeSub" />
      <AccPending
        v-else-if="pendingTitle"
        :key="subPage"
        :title="pendingTitle"
        reason="该入口指向本模块之外的页面，本轮未采集、未复刻。"
        @back="closeSub"
      />
    </Transition>

    <template v-if="!subPage">
      <GlassNavBar overlay title="辅助功能" @back="emit('back')" />

      <div style="padding-top: var(--nav-h)" class="accessibility-scroll-body scrollable">
        <!-- 顶部特性大卡片 -->
        <div class="accessibility-hero-card">
          <div class="hero-icon-wrap">
            <img :src="heroIcon" class="hero-icon-img" alt="辅助功能" draggable="false" />
          </div>
          <div class="hero-title">辅助功能</div>
          <div class="hero-desc">
            通过视力、肢体活动能力、听力、语音和认知方面的辅助功能，使手机更贴合你的需求。
          </div>
        </div>

        <!-- 无障碍 -->
        <div class="settings-card is-single">
          <ListCell title="无障碍" data-testid="acc-row-a11y" chevron last @click="openSub('a11y')">
            <template #icon>
              <img :src="accessibilityIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
        </div>

        <!-- 交互控制 -->
        <div class="settings-card">
          <ListCell title="录屏" data-testid="acc-row-record" chevron @click="openSub('record')">
            <template #icon>
              <img :src="recordIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell title="截屏" data-testid="acc-row-screenshot" chevron @click="openSub('screenshot')">
            <template #icon>
              <img :src="screenshotIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell title="动作与手势" data-testid="acc-row-gesture" chevron @click="openSub('grip')">
            <template #icon>
              <img :src="gestureIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell title="智感握姿" data-testid="acc-row-grip" chevron last @click="openSub('grip')">
            <template #icon>
              <img :src="gripIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
        </div>

        <!-- 快捷多任务 -->
        <div class="settings-card">
          <ListCell title="小窗" data-testid="acc-row-float" subtitle="便捷高效的全局应用浮窗。" chevron @click="openSub('split')">
            <template #icon>
              <img :src="floatWindowIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell title="应用分屏" data-testid="acc-row-split" subtitle="屏幕内同时显示两个应用界面。" chevron @click="openSub('split')">
            <template #icon>
              <img :src="splitIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell
            data-testid="acc-row-sidebar"
            title="智能侧边栏"
            subtitle="访问多任务窗口与智能场景助手。"
            chevron
            last
            @click="openSub('sidebar')"
          >
            <template #icon>
              <img :src="sidebarIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
        </div>

        <!-- 场景与性能增强 -->
        <div class="settings-card">
          <ListCell
            data-testid="acc-row-outdoor"
            title="户外增强"
            subtitle="户外使用时增强屏幕亮度、网络质量等。"
            chevron
            @click="openSub('outdoor')"
          >
            <template #icon>
              <img :src="outdoorIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell
            data-testid="acc-row-motion"
            title="晕动舒缓显示"
            subtitle="有助于缓解乘坐交通工具引起的晕动症，但可能会增加耗电与发热。"
            chevron
            @click="openSub('motion')"
          >
            <template #icon>
              <img :src="motionIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
          <ListCell title="游戏模式" data-testid="acc-row-game" subtitle="提升游戏体验。" chevron last @click="openSub('game')">
            <template #icon>
              <img :src="gameIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
          </ListCell>
        </div>

        <!-- 防误触：主页唯一行内开关 -->
        <div class="settings-card is-single">
          <ListCell title="防误触模式" data-testid="acc-row-mistouch" subtitle="手机在口袋中时防止误触。" last>
            <template #icon>
              <img :src="mistouchIcon" class="cell-entry-icon" alt="" draggable="false" />
            </template>
            <template #right>
              <ToggleSwitch
                :model-value="acc.antiMistouch"
                color="blue"
                data-testid="anti-mistouch"
                @update:model-value="v => acc.setFlag('antiMistouch', v)"
              />
            </template>
          </ListCell>
        </div>

        <!-- 你可能想找 -->
        <div class="relative-links-box">
          <div class="relative-title">你可能想找</div>
          <div class="relative-links">
            <button class="relative-link-btn" @click="openRelative('appClone')">应用双开</button>
            <button class="relative-link-btn" @click="openRelative('antiPeep')">防偷窥</button>
            <button class="relative-link-btn" @click="openRelative('digitalHealth')">数字健康</button>
          </div>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.settings-accessibility-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-subtle, #F2F2F7);
  color: #1C1C1E;
  overflow: hidden;
  user-select: none;
}

/* 滚动区域 */
.accessibility-scroll-body {
  flex: 1;
  padding: 8px 16px 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部大卡片
   真机（52_sidebar2 同批 22_acc_main 截图，卡片中线 x=1000 处量）：
   卡高 600 物理 px = 178.8 设计 px；图标 47.7×47.7；图标距卡顶 28；
   标题距卡顶 86.4；说明两行、行距 15.8；卡底余量 28。 */
.accessibility-hero-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 28px 20px 28px 20px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.hero-icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.hero-icon-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  display: block;
  user-select: none;
  pointer-events: none;
}

.hero-title {
  font-size: 18px;
  line-height: 22px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 11px;
}

.hero-desc {
  /* 真机首行 22 字（通过视力…认知方面），13px 会只剩 22 字边界不稳，按真机 12.5px 标定 */
  font-size: 12.5px;
  line-height: 16px;
  color: #8E8E93;
  max-width: 280px;
}

/* 设置卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  /* 真机卡片间底色带 16 设计 px */
  margin-bottom: 16px;
}

/* 真机「单行卡」比分组内的行高：无障碍 56.3、防误触（带副标题）72.1。
   只在主页这两张卡上生效，不动共享 ListCell。 */
.settings-card.is-single :deep(.list-cell) {
  min-height: 56px;
}

.settings-card.is-single :deep(.list-cell:has(.lc-subtitle)) {
  min-height: 72px;
}

/* 分组内的无副标题行：真机 50.4（交互控制 4 行合计 201.6；侧边栏页同一指标 50） */
.settings-card:not(.is-single) :deep(.list-cell:not(:has(.lc-subtitle))) {
  min-height: 50px;
}

.cell-entry-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: block;
  flex: none;
  margin-right: 14px;
  user-select: none;
  pointer-events: none;
}

/* 你可能想找
   真机：灰底块 596.0–743.5（高 147.5），距上一张卡底 32.5；标题 12.5px 灰，
   三条蓝链 14px、行距 32.1、左内边距 16。 */
.relative-links-box {
  background: #EAEAEF;
  border-radius: 16px;
  padding: 17px 16px;
  /* 卡片 margin-bottom(16) 与这里的外边距会合并取最大值，所以直接写 32 才是真机的 32.5 */
  margin-top: 32px;
  margin-bottom: 16px;
}

.relative-title {
  font-size: 12.5px;
  color: #8E8E93;
  font-weight: 500;
  margin-bottom: 14px;
}

.relative-links {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.relative-link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  line-height: 19px;
  font-weight: 500;
  color: #007AFF;
  text-align: left;
  cursor: pointer;
}

.relative-link-btn:active {
  opacity: 0.6;
}

.bottom-spacer {
  height: 24px;
}
</style>
