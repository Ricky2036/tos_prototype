<script setup>
import { wideAsset } from '../../config/deviceDesktop.js'
import { computed, ref } from 'vue'
import { useClock } from '../../composables/useClock'
import { useSystemStore } from '../../stores/systemStore'
import { setLaunchRect } from '../../utils/appIconAnchors'
import { rectRelativeToScreen } from '../../utils/dom'

/** 时钟 Widget（2×2）：白底实时指针表盘，表盘放大居中显示，点击打开时钟 App */
const props = defineProps({ wide: Boolean })
const { hourDeg, minuteDeg, secondDeg, now } = useClock()
const wideTime = computed(() => new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',hour12:false}).format(now.value))
const wideDate = computed(() => new Intl.DateTimeFormat('en-US', {weekday:'short',month:'short',day:'numeric'}).format(now.value))
const system = useSystemStore()
const widgetRef = ref(null)

function openClock() {
  const screenEl = document.querySelector('.screen-view')
  const launchRect = (screenEl && widgetRef.value)
    ? rectRelativeToScreen(widgetRef.value, screenEl)
    : null
  if (launchRect) {
    setLaunchRect('clock', { ...launchRect, widgetId: 'clock' })
  }
  system.openApp('clock')
}
</script>

<template>
  <button v-if="props.wide" ref="widgetRef" type="button" class="widget wide-clock-widget" aria-label="打开时钟" @click="openClock">
    <img :src="wideAsset('clock-face')" alt="">
    <span class="wide-clock-date">{{ wideDate }}</span>
    <span class="wide-clock-temp" aria-label="温度 26 度">26°</span>
    <time class="wide-clock-time" :aria-label="wideTime">
      <svg viewBox="0 0 154 154" aria-hidden="true">
        <text x="77" y="97" text-anchor="middle">{{ wideTime }}</text>
      </svg>
    </time>
  </button>
  <div v-else ref="widgetRef" class="widget clock-widget" @click="openClock">
    <svg class="cw-face" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="57" fill="#fff" />
      <!-- 刻度 -->
      <g>
        <line v-for="i in 60" :key="i"
          x1="60" y1="6" :x2="60" :y2="(i - 1) % 5 === 0 ? 12 : 9"
          :stroke="(i - 1) % 5 === 0 ? '#1c1c1e' : '#c7c7cc'"
          :stroke-width="(i - 1) % 5 === 0 ? 2 : 1"
          :transform="`rotate(${(i - 1) * 6} 60 60)`" />
      </g>
      <!-- 数字 12/3/6/9 -->
      <text x="60" y="26" text-anchor="middle" class="cw-num">12</text>
      <text x="98" y="65" text-anchor="middle" class="cw-num">3</text>
      <text x="60" y="106" text-anchor="middle" class="cw-num">6</text>
      <text x="22" y="65" text-anchor="middle" class="cw-num">9</text>
      <!-- 指针 -->
      <line x1="60" y1="60" x2="60" y2="34" stroke="#1c1c1e" stroke-width="5" stroke-linecap="round"
        :transform="`rotate(${hourDeg} 60 60)`" />
      <line x1="60" y1="60" x2="60" y2="20" stroke="#1c1c1e" stroke-width="3.2" stroke-linecap="round"
        :transform="`rotate(${minuteDeg} 60 60)`" />
      <line x1="60" y1="66" x2="60" y2="18" stroke="#FF9500" stroke-width="1.6" stroke-linecap="round"
        :transform="`rotate(${secondDeg} 60 60)`" />
      <circle cx="60" cy="60" r="3" fill="#1c1c1e" />
      <circle cx="60" cy="60" r="1.2" fill="#FF9500" />
    </svg>
  </div>
</template>

<style scoped>
.wide-clock-widget { position:relative; display:block; padding:0; border:0; background:none; box-shadow:none; cursor:pointer; container-type:inline-size; }
.wide-clock-widget img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.wide-clock-date {position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;top:14%;font:600 6.9cqw/1.2 var(--font-stack);color:#0008}
.wide-clock-temp {position:absolute;left:50.5%;top:76.55%;font:600 6.9cqw/1.2 var(--font-stack);color:#0008;white-space:nowrap}
.wide-clock-time,.wide-clock-time svg {position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.wide-clock-time text {
  font-family:"Transsion Tecno pnum",-apple-system,"SF Pro Rounded","Arial Rounded MT Bold","Helvetica Neue",sans-serif;
  font-size:70px;
  font-weight:840;
  font-variation-settings:"wght" 840,"ytde" 235;
  fill:#181818;
}

.widget {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-widget);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  box-sizing: border-box;
}
.just-unlocked .widget {
  animation: icon-enter 0.5s cubic-bezier(0.25, 0.9, 0.3, 1.2) backwards;
}
@keyframes icon-enter {
  from { opacity: 0; transform: scale(1.25); }
  to { opacity: 1; transform: scale(1); }
}
.clock-widget {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
/* 表盘放大至容器可用空间，居中显示 */
.cw-face {
  width: 88%;
  height: 88%;
}
.cw-num {
  font: 600 12px var(--font-stack);
  fill: #1c1c1e;
}
</style>
