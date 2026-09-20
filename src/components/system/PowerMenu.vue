<script setup>
/**
 * 电源菜单：控制中心的「关机」磁贴唤起。
 * 关机 / 重启 / SOS 三个动作 + 两段过渡态（powering-off、restarting）。
 *
 * 相对原型的适配：
 *   1. 图标从 name="refreshCw" 改为 name="restart"——本仓库的 refreshCw 是 cast 的别名，
 *      直接沿用会连带改掉所有快速分享调用点的外观；
 *   2. 文案走 locales/volume.js（zh/en/bn）；
 *   3. z-index 走 --z-power-menu（在原设计里它压在控制中心下层，供 CC 收起时连续露出）。
 */
import { computed, ref, watch } from 'vue'
import { useControlStore } from '../../stores/controlStore'
import { useSystemStore } from '../../stores/systemStore'
import { useI18nStore } from '../../stores/i18nStore'
import { VOLUME_LABELS } from '../../locales/volume.js'
import LIcon from '../ui/LIcon.vue'

const control = useControlStore()
const system = useSystemStore()
const i18n = useI18nStore()
const vLabel = (k) => VOLUME_LABELS[i18n.locale]?.[k] ?? VOLUME_LABELS.zh[k] ?? k

const phase = ref('idle')
const menuAria = computed(() => vLabel('powerMenuAria'))

function closeMenu() {
  if (phase.value === 'idle') control.closePowerMenu()
}

/* 这一层挂在整个屏幕之上（--z-power-menu 93 > 锁屏 70），是全屏模态。
   锁屏路径必须自己收干净：一旦 baseLayer 落到 'lock'，锁屏(z70)会出现在菜单**下面**，
   而收起菜单唯一的手段是点它自己的背板 —— 锁屏下那条路径不可达，菜单会永久糊在最上层。
   （灭屏路径不用管：ScreenView 的 .screen-off(z 120) 配
     `> *:not(.screen-off){visibility:hidden!important}` 已把同层兄弟一并藏掉。
     「CC 被重新拉开」那条对称情形写在 ControlCenter 的 status watch 里。）
   ⚠️ 应用初始就在锁屏，所以「锁屏 → 锁屏」是同一个值、watch 不会触发；
   本守卫只拦「桌面/应用中 → 锁屏」这一次真实跃迁。 */
watch(() => system.baseLayer, (layer) => {
  if (layer === 'lock') closeMenu()
})

function powerOff() {
  phase.value = 'powering-off'
  window.setTimeout(() => {
    control.closePowerMenu()
    system.powerOff()
    phase.value = 'idle'
  }, 650)
}

function restart() {
  phase.value = 'restarting'
  window.setTimeout(() => {
    system.powerOff()
    control.closePowerMenu()
  }, 520)
  window.setTimeout(() => {
    system.powerOn()
    phase.value = 'idle'
  }, 1550)
}

function triggerSos() {
  phase.value = 'sos'
  window.setTimeout(() => { phase.value = 'idle' }, 1700)
}
</script>

<template>
  <div
    v-if="control.powerMenuOpen"
    class="power-menu"
    :class="{ 'is-leaving': phase === 'powering-off' || phase === 'restarting' }"
    role="dialog"
    :aria-label="menuAria"
    @click.self="closeMenu"
  >
    <div class="power-actions">
      <button class="power-action" :aria-label="vLabel('powerOff')" @click="powerOff">
        <span class="action-circle"><LIcon name="power" :size="29" :stroke-width="1.8" /></span>
        <span class="action-label">{{ vLabel('powerOff') }}</span>
      </button>
      <button class="power-action" :aria-label="vLabel('restart')" @click="restart">
        <span class="action-circle"><LIcon name="restart" :size="29" :stroke-width="1.8" /></span>
        <span class="action-label">{{ vLabel('restart') }}</span>
      </button>
    </div>

    <button class="sos-button" :aria-label="vLabel('sos')" @click="triggerSos">SOS</button>
    <div v-if="phase === 'sos'" class="sos-toast">{{ vLabel('sosActivated') }}</div>
    <div v-if="phase === 'restarting'" class="restart-state">
      <span class="restart-spinner"></span>
      <span>{{ vLabel('restarting') }}</span>
    </div>
  </div>
</template>

<style scoped>
.power-menu {
  position: absolute;
  inset: 0;
  z-index: var(--z-power-menu);
  color: #fff;
  background: rgba(10, 15, 35, .28);
  backdrop-filter: blur(32px) saturate(115%) brightness(.7);
  -webkit-backdrop-filter: blur(32px) saturate(115%) brightness(.7);
  opacity: 1;
  will-change: opacity;
  animation: menu-in .42s cubic-bezier(.22, .7, .24, 1) both;
}
.power-menu.is-leaving { opacity: 0; transition: opacity .58s ease-in; }
.power-actions {
  position: absolute;
  top: 336px;
  left: 72px;
  right: 72px;
  display: flex;
  justify-content: space-between;
}
.power-action {
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #fff;
  cursor: pointer;
}
.action-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.3);
  box-shadow: inset 0 1px 8px rgba(255,255,255,.08), 0 8px 24px rgba(13,9,39,.14);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  transition: transform .16s ease, background .16s ease;
}
.power-action:active .action-circle { transform: scale(.92); background: rgba(255,255,255,.3); }
.action-label {
  font: 400 13px/16px var(--font-stack);
  color: rgba(255,255,255,.82);
  white-space: nowrap;
}
.sos-button {
  position: absolute;
  left: 50%;
  bottom: 84px;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ff4b42;
  color: #fff;
  font: 600 17px/1 var(--font-stack);
  box-shadow: 0 8px 22px rgba(78, 13, 19, .24), inset 0 1px 0 rgba(255,255,255,.25);
  cursor: pointer;
  transition: transform .16s ease, filter .16s ease;
}
.sos-button:active { transform: translateX(-50%) scale(.91); filter: brightness(.9); }
.sos-toast {
  position: absolute;
  left: 50%;
  bottom: 148px;
  transform: translateX(-50%);
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(0,0,0,.34);
  backdrop-filter: blur(14px);
  white-space: nowrap;
  font: 500 12px/1 var(--font-stack);
  animation: toast-in .2s ease-out both;
}
.restart-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: #000;
  font: 400 13px/1 var(--font-stack);
  color: rgba(255,255,255,.68);
}
.restart-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255,255,255,.22);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes menu-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes toast-in { from { opacity: 0; transform: translate(-50%, 6px) } to { opacity: 1; transform: translate(-50%, 0) } }
@keyframes spin { to { transform: rotate(360deg) } }
</style>
