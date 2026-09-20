<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useControlStore } from '../../stores/controlStore'
import { useSystemStore } from '../../stores/systemStore'

const control = useControlStore()
const system = useSystemStore()

const powerTitle = computed(() => `电源键 (${system.powerButtonText})`)

/* ================= 实体音量键（2026-09-20 接上） =================
 * 此前 .volume-up / .volume-down 是**纯装饰 div**：继承 .side-btn 的
 * pointer-events:none，且没有任何事件绑定。于是 volume-plus-mode 快照移植过来的
 * 侧栏音量浮层（SideVolumeOverlay）、音量 Plus、全屏音量面板**全都没有触发源** ——
 * 「集成了但点不开」。以下把这套硬件键链路补齐，逻辑与快照 PhoneFrame.vue 等价。
 *
 * 链路：单击 = 一步；按住 350ms 后每 90ms 连发一步。
 *   按下去 → stepSelectedPanelChannel（侧栏已在 channel 面板时优先调该通道）
 *          → maybeShowCurrentAppMuteGuide（当前 app 被静音时引导一次）
 *          → volumeUp/volumeDown 或 stepVolumeTowardBoundary
 *          → showHardwareVolumeFeedback（把侧栏浮层叫出来）
 *          → maybeBounceAtBoundary（顶到边界时回弹一下）
 */

/**
 * Plus 档只在「音量 UI 已经出现在屏幕上」时才可达。
 * 否则从 0 一路按到 100% 之后会继续无声地爬进 200/300/500 档，
 * 而屏幕上没有任何东西能提示用户这件事 —— 那是纯粹的迷惑行为。
 */
function plusModeAvailable() {
  return system.overlays.controlCenter.status === 'open'
    || control.volumePanelOpen
    || ['expanded', 'compact', 'panel', 'media'].includes(control.sideVolumeMode)
}

/** 实体键的反馈 = 侧栏音量浮层。
 *  全屏音量面板开着时它自己就是反馈，不再叠一层；CC 开着时也不显示
 * （CC 自带音量条，而且 SideVolumeOverlay 有个「CC 一展开就收侧栏」的 watch）。 */
function showHardwareVolumeFeedback() {
  if (system.overlays.controlCenter.status === 'closed' && !control.volumePanelOpen) control.showSideVolume()
}

/** 侧栏已经从 expanded 点进 panel 时，音量键改调「当前选中的通道」而不是媒体主音量。 */
function stepSelectedPanelChannel(direction) {
  if (control.sideVolumeMode !== 'panel' || control.sideVolumeChannel === 'media') return false
  control.stepAuxiliaryVolume(control.sideVolumeChannel, direction)
  showHardwareVolumeFeedback()
  return true
}

/** 已经顶到边界（volume 与 plusLevel 前后完全相同）时给一次回弹提示。
 *  只在 compact 态弹：expanded 态按完马上会被收成 compact，弹了也看不见。 */
function maybeBounceAtBoundary(direction, before) {
  const after = `${control.volume}:${control.volumePlusLevel}`
  if (before === after && control.sideVolumeMode === 'compact') control.triggerSideVolumeBounce(direction)
}

function maybeShowCurrentAppMuteGuide() {
  if (system.baseLayer === 'app' && system.activeAppId === 'youtube' && control.mediaVolumes.play === 0) {
    control.showCurrentAppMuteGuide()
  }
}

function pressVolumeUp() {
  if (stepSelectedPanelChannel('up')) return
  maybeShowCurrentAppMuteGuide()
  const before = `${control.volume}:${control.volumePlusLevel}`
  control.volumeUp(plusModeAvailable())
  showHardwareVolumeFeedback()
  maybeBounceAtBoundary('up', before)
}

function pressVolumeDown() {
  if (stepSelectedPanelChannel('down')) return
  const before = `${control.volume}:${control.volumePlusLevel}`
  control.volumeDown()
  showHardwareVolumeFeedback()
  maybeBounceAtBoundary('down', before)
}

/* ---- 长按连发 ---- */
const VOLUME_HOLD_DELAY = 350      // 按住多久进入连发
const VOLUME_HOLD_REPEAT = 90      // 连发间隔
const VOLUME_CLICK_SUPPRESS = 450  // 连发结束后吞掉尾随 click 的时长

let holdTimer = null
let repeatTimer = null
let holdTriggered = false
let suppressClickUntil = 0

function continuousVolumeStep(direction) {
  if (stepSelectedPanelChannel(direction)) return
  if (direction === 'up') maybeShowCurrentAppMuteGuide()
  const before = `${control.volume}:${control.volumePlusLevel}`
  control.stepVolumeTowardBoundary(direction, plusModeAvailable())
  showHardwareVolumeFeedback()
  maybeBounceAtBoundary(direction, before)
}

function detachHoldListeners() {
  window.removeEventListener('pointerup', endVolumeHold)
  window.removeEventListener('pointercancel', endVolumeHold)
}

/** 松手 / 手势被系统抢走：停连发；只有「确实连发过」才吞掉尾随的那个 click。
 *
 *  ⛔ 这个函数只能由真实抬起（window pointerup/cancel）触发，startVolumeHold 里
 *  **不能**调它。快照是在 startVolumeHold 里调 stopVolumeHold 的，副作用是：
 *  上一次长按留下的 holdTriggered=true 会在按下瞬间把 suppressClickUntil 又续到
 *  now+450，于是「长按结束 450ms 内的轻按」被静默吃掉 —— 表现就是「按了没反应」。 */
function endVolumeHold() {
  clearTimeout(holdTimer)
  clearInterval(repeatTimer)
  holdTimer = null
  repeatTimer = null
  detachHoldListeners()
  if (holdTriggered) suppressClickUntil = Date.now() + VOLUME_CLICK_SUPPRESS
}

function startVolumeHold(direction, e) {
  if (e.button !== 0) return   // 只响应主键，右键/中键不参与
  clearTimeout(holdTimer)
  clearInterval(repeatTimer)
  detachHoldListeners()
  holdTriggered = false
  /* 新一轮按压开始 ⇒ 上一轮长按留下的「吞 click」窗口必须作废。
     ⛔ 少了这一行就会踩快照的坑：长按结束 450ms 内的**新**轻按会被静默吃掉
     （click 里的 suppress 判据看到的是上一轮的时间戳），表现是「按了没反应」。 */
  suppressClickUntil = 0
  holdTimer = window.setTimeout(() => {
    holdTriggered = true
    continuousVolumeStep(direction)
    repeatTimer = window.setInterval(() => continuousVolumeStep(direction), VOLUME_HOLD_REPEAT)
  }, VOLUME_HOLD_DELAY)
  window.addEventListener('pointerup', endVolumeHold)
  window.addEventListener('pointercancel', endVolumeHold)
}

function onVolumeClick(direction) {
  if (Date.now() < suppressClickUntil) return
  if (direction === 'up') pressVolumeUp()
  else pressVolumeDown()
}

/* ================= 实体电源键：单击 = 锁屏/灭屏，长按 = 电源菜单 ================= */

const POWER_HOLD_DELAY = 500

let powerHoldTimer = null
let powerHoldTriggered = false

function stopPowerHold() {
  clearTimeout(powerHoldTimer)
  powerHoldTimer = null
  window.removeEventListener('pointerup', stopPowerHold)
  window.removeEventListener('pointercancel', stopPowerHold)
}

/**
 * 长按电源键 = 电源菜单。这是 Android 的常规映射，也是 2026-09-20 撤掉
 * Control Center 里那个「关机」磁贴之后电源菜单**唯一**的入口
 *（全仓库 openPowerMenu() 的调用点只有这里）—— 不给它入口就会重演
 * 「集成了但点不开」的老问题。
 *
 * 两个必须的守卫：
 *  ① 锁屏不弹 —— 菜单 z93 高于锁屏 z70，弹出来会浮在锁屏之上且点不到背板。
 *    （PowerMenu.vue 里另有一个反向守卫「开着菜单时进入锁屏就收起」，两处都要有。）
 *  ② 灭屏不弹 —— .screen-off 是 z120，菜单会开在它底下：看不见，却一直挂着。
 */
function startPowerHold(e) {
  if (e.button !== 0) return
  stopPowerHold()
  powerHoldTriggered = false
  powerHoldTimer = window.setTimeout(() => {
    if (!system.screenOn || system.baseLayer === 'lock') return
    powerHoldTriggered = true
    control.openPowerMenu()
    /* 菜单压在 CC 下层（--z-power-menu 93 < --z-control-center 94），所以必须让
       CC 走**动画**收起（requestCloseOverlay → status 'closing'），只有渐变收起的
       progress 才能把下面的菜单一帧帧露出来；closeOverlay 那种 progress 立刻归零
       的瞬跳是不行的。CC 本来就是关的时候 requestCloseOverlay 是空操作。 */
    system.requestCloseOverlay('controlCenter')
  }, POWER_HOLD_DELAY)
  window.addEventListener('pointerup', stopPowerHold)
  window.addEventListener('pointercancel', stopPowerHold)
}

const handlePowerClick = () => {
  // 长按已经弹过菜单了：松手时那个尾随 click 不能再切一次屏
  if (powerHoldTriggered) {
    powerHoldTriggered = false
    return
  }
  system.togglePower()
}

onBeforeUnmount(() => {
  detachHoldListeners()
  stopPowerHold()
})

/**
 * 旗舰原色/白钛金属机身外框（Natural / Silver Titanium）：
 * - 像素级白钛金属拉丝外框、CNC 微弧双倒角高光与细腻金属质感
 * - 4 处微细注塑天线隔断条（Antenna Bands）
 * - 5 颗金属侧键：左侧动作键（Action Button）、音量+、音量-；右侧侧边电源键（交互式触发锁屏/灭屏/亮屏）、相机控制键（Camera Control）
 * - 4px 超窄等宽黑边（BM 区）+ 50px 大圆角精准同心几何
 * - 顶部微缝听筒孔（Speaker Slit）
 * - 居中打孔摄像头（保持 .punch-hole 节点兼容避让测试）
 * 屏幕内容通过默认 slot 注入 ScreenView。
 */
</script>

<template>
  <div class="phone-frame">
    <!-- 4 处天线绝缘隔断条 -->
    <div class="antenna-band antenna-tl"></div>
    <div class="antenna-band antenna-tr"></div>
    <div class="antenna-band antenna-bl"></div>
    <div class="antenna-band antenna-br"></div>

    <!-- 左侧按键：动作键、音量+、音量-（音量两键是交互控件，见 script 区注释） -->
    <div class="side-btn action-btn"></div>
    <button
      type="button"
      class="side-btn volume-up"
      data-testid="volume-up"
      aria-label="音量加键"
      @pointerdown="startVolumeHold('up', $event)"
      @click="onVolumeClick('up')"
    ></button>
    <button
      type="button"
      class="side-btn volume-down"
      data-testid="volume-down"
      aria-label="音量减键"
      @pointerdown="startVolumeHold('down', $event)"
      @click="onVolumeClick('down')"
    ></button>

    <!-- 右侧按键：侧边电源键、相机控制键 -->
    <div
      class="side-btn power"
      @click="handlePowerClick"
      @pointerdown="startPowerHold"
      :title="powerTitle"
      role="button"
      tabindex="0"
      :aria-label="powerTitle"
    ></div>
    <div class="side-btn camera-control"></div>

    <div class="frame-inner">
      <!-- 顶部超窄微缝听筒孔 -->
      <div class="speaker-slit"></div>

      <div class="screen">
        <!-- 居中打孔摄像头 -->
        <div class="punch-hole"></div>
        <!-- 屏幕表面超细微玻璃微光 -->
        <div class="glass-sheen"></div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-frame {
  position: relative;
  /* 5px 深黑钛金属立体弧面外框 + 5px 内侧深邃纯黑边，单边 10px，两侧合计 20px；与参考图 1:1 等宽黄金比例像素级匹配 */
  width: calc(var(--screen-w) + 20px);
  height: calc(var(--screen-h) + 20px);
  border-radius: calc(var(--screen-radius) + 10px);
  /* 深空黑钛金属（Space Black Titanium）底色 */
  background: #1e2025;
  box-shadow:
    /* 外边缘极细深空金属轮廓切线 */
    0 0 0 0.5px rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.75),
    /* 3D 圆柱形金属 bead 弧面（深黑钛漫反射，环绕全机身外沿） */
    inset 0 0 0.5px 0.5px #121317,
    inset 0 0 1px 1.5px #262930,
    inset 0 0 1.5px 2.5px #4a4f5c,
    inset 0 0 1px 3.2px #606775,
    inset 0 0 1.5px 4.2px #22242a,
    inset 0 0 0.5px 5px #07080a,
    /* 顶部与左侧微妙环境入射高光（深色金属冷光微光） */
    inset 0 1px 1px rgba(255, 255, 255, 0.22),
    inset 1px 0 1px rgba(255, 255, 255, 0.15),
    /* 底部与右侧深邃背阴 */
    inset 0 -1px 1px rgba(0, 0, 0, 0.7),
    /* 摄影级多层自然深色工作台投影 */
    0 32px 80px -15px rgba(0, 0, 0, 0.65),
    0 14px 32px -8px rgba(0, 0, 0, 0.45),
    0 4px 12px -2px rgba(0, 0, 0, 0.3);
  padding: 5px;
}

/* 4 处天线绝缘隔断条（深空黑微细哑光条） */
.antenna-band {
  position: absolute;
  width: 5px;
  height: 2px;
  background: #282a30;
  box-shadow: 0 0.5px 0.5px rgba(0, 0, 0, 0.6);
  z-index: 2;
  pointer-events: none;
  opacity: 0.95;
}
.antenna-tl { left: 0; top: 100px; }
.antenna-tr { right: 0; top: 100px; }
.antenna-bl { left: 0; bottom: 100px; }
.antenna-br { right: 0; bottom: 100px; }

/* 屏幕超窄等宽纯黑边框（BM区 + 保护圈） */
.frame-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: calc(var(--screen-radius) + 5px);
  background: #000000;
  padding: 5px;
  box-shadow:
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.04),
    0 0 0 0.5px rgba(0, 0, 0, 0.95);
}

/* 旗舰级 BM 压边黑圈遮罩（置于屏幕最顶层，彻底杜绝四角圆角抗锯齿和叠层硬件加速透底） */
.frame-inner::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 100;
  box-shadow: inset 0 0 0 6px #000000;
}

/* 顶部超窄微缝听筒 */
.speaker-slit {
  position: absolute;
  top: 1.2px;
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 1.6px;
  border-radius: 1px;
  background: #050507;
  box-shadow:
    inset 0 0.5px 0.5px rgba(0, 0, 0, 0.95),
    0 0.5px 0.5px rgba(255, 255, 255, 0.05);
  z-index: 10;
  pointer-events: none;
}

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--screen-radius);
  overflow: hidden;
  background: #000000;
  /* 屏幕内容锚点：hero 动画/坐标换算以此为基准 */
  container-type: size;
}

/* 屏幕玻璃超浅微光 */
.glass-sheen {
  position: absolute;
  inset: 0;
  border-radius: var(--screen-radius);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.035) 0%,
    rgba(255, 255, 255, 0.01) 22%,
    transparent 45%
  );
  pointer-events: none;
  z-index: 95;
}

/* 居中打孔摄像头（保留类名与居中锚点兼容状态栏避让检测） */
.punch-hole {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: radial-gradient(circle at 36% 36%, #1e2433 0%, #0e1118 45%, #050608 80%);
  box-shadow:
    inset 0 0 2px 1px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(35, 40, 50, 0.6),
    inset 1px 1px 1.5px rgba(70, 110, 180, 0.35);
  z-index: 96;
  pointer-events: none;
}

/* ================= 侧边高质感深空黑钛金属按键 ================= */
.side-btn {
  position: absolute;
  pointer-events: none;
}

/* 左侧按键：动作键、音量+、音量- */
.action-btn,
.volume-up,
.volume-down {
  left: -2.5px;
  width: 3px;
  border-radius: 2px 0 0 2px;
  background: linear-gradient(90deg, #1b1d22 0%, #3e434f 50%, #22252c 100%);
  box-shadow:
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.3),
    inset 0 -0.5px 0.5px rgba(0, 0, 0, 0.8),
    -1px 1.5px 3px rgba(0, 0, 0, 0.6);
}

.action-btn {
  top: 124px;
  height: 28px;
}

.volume-up {
  top: 168px;
  height: 52px;
}

.volume-down {
  top: 230px;
  height: 52px;
}

/* 右侧按键：电源键与相机控制键 */
.power {
  right: -2.5px;
  top: 180px;
  width: 3px;
  height: 72px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(270deg, #1b1d22 0%, #3e434f 50%, #22252c 100%);
  box-shadow:
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.3),
    inset 0 -0.5px 0.5px rgba(0, 0, 0, 0.8),
    1px 1.5px 3px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.08s ease, filter 0.08s ease;
}

.power:hover {
  filter: brightness(1.35);
}

.power:active {
  transform: translateX(-1px);
}

/* 扩展电源键鼠标点击热区，方便在真机外框侧边轻松触发 */
.power::before {
  content: '';
  position: absolute;
  top: -8px;
  bottom: -8px;
  left: -12px;
  right: -16px;
}

/* ================= 实体音量键（交互式） =================
   2026-09-20：这两个键此前是纯装饰 div，所以侧栏音量浮层一直没有触发源。 */
.volume-up,
.volume-down {
  /* .side-btn 统一 pointer-events:none，这里必须显式解绑 */
  pointer-events: auto;
  cursor: pointer;
  /* <button> 的 UA 默认样式清零（原生外观 / 默认边框 / 内边距） */
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  padding: 0;
  transition: transform 0.08s ease, filter 0.08s ease;
}

.volume-up:hover,
.volume-down:hover {
  filter: brightness(1.35);
}

.volume-up:active,
.volume-down:active {
  /* 左侧键受力方向朝内（+x），与右侧电源键的 -1px 相反 */
  transform: translateX(1px);
}

/* 音量键热区：视觉只有 3px 宽，必须外扩才点得着。
   ⚠️ 上下各只扩 4px —— 两键间距只有 10px，各扩 8px 会让两个热区重叠 6px，
   而 volume-down 在 DOM 里靠后、重叠区会被它抢走 ⇒ 点「音量+」反而减音量。 */
.volume-up::before,
.volume-down::before {
  content: '';
  position: absolute;
  top: -4px;
  bottom: -4px;
  left: -16px;
  right: -12px;
}

/* 相机控制键（Camera Control）：深色蓝宝石触感与微凹深黑切角 */
.camera-control {
  right: -1.5px;
  top: 540px;
  width: 2px;
  height: 52px;
  border-radius: 0 1px 1px 0;
  background: linear-gradient(270deg, #16171b 0%, #2c3038 50%, #18191d 100%);
  box-shadow:
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2),
    inset 0 -0.5px 0.5px rgba(0, 0, 0, 0.9),
    0.5px 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
