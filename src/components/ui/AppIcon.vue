<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { GLYPHS } from '../../assets/icons/glyphs'
import { useClock } from '../../composables/useClock'
import { useHomeStore } from '../../stores/homeStore'
import { useNotificationsStore } from '../../stores/notificationsStore'
import { useSystemStore } from '../../stores/systemStore'
import { useI18nStore } from '../../stores/i18nStore'
import { rectRelativeToScreen } from '../../utils/dom'
import { getAnchorRect, registerAnchor, setLaunchRect, unregisterAnchor } from '../../utils/appIconAnchors'

/**
 * 通用应用图标：渐变底 + glyph，或自绘特殊图标（日历/照片/时钟）。
 * 点击时上报自身 rect（hero 动画起点）并触发打开。
 */
const props = defineProps({
  app: { type: Object, required: true },
  showLabel: { type: Boolean, default: true },
  enterDelay: { type: Number, default: 0 },  // 解锁入场 stagger (ms)
  size: { type: Number, default: 60 },  // tile 边长（默认桌面 60；通知设置内 40）
  ignoreHidden: { type: Boolean, default: false }, // 是否忽略全局隐藏状态（用于过渡动画中的镜像）
  homeAnchor: { type: Boolean, default: false },
  launchOnClick: { type: Boolean, default: true },
  showBadge: { type: Boolean, default: true }
})
const emit = defineEmits(['activate'])

const home = useHomeStore()
const notifications = useNotificationsStore()
const system = useSystemStore()
const i18n = useI18nStore()

const anchorRef = ref(null)
const { today, hourDeg, minuteDeg, secondDeg } = useClock()

const appDisplayName = computed(() => i18n.appName(props.app.id) || props.app.name)
/* 用 today 的星期而非 new Date()：后者在 setup 时求值一次，跨零点不会更新。
   today 是日期粒度的 shallowRef，只在跨天时变化，不会每秒重算。 */
const weekday = computed(() => {
  const t = today.value
  return i18n.calWeekDays[new Date(t.year, t.month, t.date).getDay()] || i18n.calWeekDays[0]
})

const badge = computed(() => notifications.countByApp[props.app.id] || 0)

/** hero 动画期间隐藏图标本体防重影。
 *
 * ⚠️ 第十五轮（Ricky 2026-09-14：「点击打开应用后，进入多任务，上滑删除任务回到桌面后，
 *    桌面图标消失了」）—— 截图特征：**文字还在、只有那一格的图形是空的**。
 *
 * 根因：`home.hiddenIconId` 是【单槽】。AppWindow 在开场时写它（hideIcon），
 * 只靠【hero 收回的收尾钩子】清它（AppWindow 的 `onHandoff: () => home.showIcon()`）。
 * 而切换器里上滑删卡走的是 `systemStore.dismissApp()`：那条路径**硬切**
 * `activeAppId = null` + `baseLayer = 'home'`，AppWindow 被直接卸载
 * ⇒ beginClose 从未执行 ⇒ onHandoff 从不触发 ⇒ `hiddenIconId` 永久停在那个 appId。
 * `.is-hidden` 只藏 `.icon-tile`（和角标）、不藏 `.icon-label`，
 * 所以肉眼看到的就是「名字还在、图标没了」。
 * 探针实测（/tmp/vwork/r15/probe-icon.mjs）：
 *   · store 直连 openApp→dismissApp：删卡后 hiddenIconId 仍是 'files'；
 *   · 真实 UI（点桌面图标 → 上滑进多任务 → 卡上滑删卡）：同样停在 'files'、图标 tile=hidden；
 *   · 对照（应用内上滑回桌面，即 hero 收尾那条正常路径）：tile=visible —— 唯独删卡路径漏了。
 *
 * 修法：判据补上「该应用此刻真的是前台」—— 图标只允许在它自己的窗口存在期间被隐藏。
 * 这是一个**只会让图标更可见、绝不会让它更隐蔽**的收敛条件：
 *   · 隐藏态照旧生效 —— 开场入场与 hero 收回途中 `activeAppId` 都还是这个 app；
 *   · 任何「窗口已经没了、却漏清隐藏态」的路径都会被这一条自动治愈
 *     （删卡 / 垃圾桶一键清理 / 点空白回桌面 / 锁屏 等所有硬切路径）。
 * 它不引入新的隐藏条件，所以不存在「本该显示的图标反而被藏起来」的反向风险。
 *
 * ⚠️ 别删这个判据、也别把它改回只看 hiddenIconId：
 *   所有过渡用的镜像都靠 `ignore-hidden` 显式豁免（AppWindow 的 hero 图标、
 *   AppSwitcher 的卡片标签图标），不依赖这里的语义。
 *
 * 🔀 合并说明（workbuddy/lane ← origin/main，2026-09-16）：
 *   main 上有一条独立修法，判据写作「仅当存在活跃应用时生效」
 *   （`if (props.ignoreHidden) return false; if (!system.activeAppId) return false; ...`）。
 *   它确实挡住了「窗口已经没了却漏清隐藏态」这一大类，但粒度不够：
 *   只要有**任何一个**前台应用在跑，单槽的 `hiddenIconId` 若指向别的 app，
 *   那一格仍会被误藏。本条把判据收紧成「activeAppId 必须就是自己」，
 *   **严格包含** main 那版的全部生效场景（`activeAppId === app.id` ⇒ `activeAppId` 非空）
 *   ⇒ 采用本条，main 的语义被吸收，行为只会更可见、不会更隐蔽。
 *   ⚠️ 反向不成立：不要再退回「只判 !activeAppId」。 */
const hidden = computed(
  () =>
    !props.ignoreHidden &&
    home.hiddenIconId === props.app.id &&
    system.activeAppId === props.app.id
)

const entering = computed(() => system.unlockProgress === 0 && system.baseLayer === 'lock')

const resolvedImage = computed(() => {
  if (!props.app.image) return null
  if (props.app.image.startsWith('http') || props.app.image.startsWith('data:')) return props.app.image
  const clean = props.app.image.replace(/^\/+/, '')
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'
  return `${base}${clean}`
})

function open() {
  if (!anchorRef.value) return
  emit('activate', anchorRef.value)
  if (!props.launchOnClick) return
  const screenEl = document.querySelector('.screen-view')
  if (!screenEl) return
  // 无论入口位于桌面、Dock 或资源库，Hero 都优先使用注册的桌面稳定锚点。
  const launchRect = getAnchorRect(props.app.id, screenEl)
    || rectRelativeToScreen(anchorRef.value, screenEl)
  setLaunchRect(props.app.id, launchRect)
  system.openApp(props.app.id)
}

onMounted(() => {
  if (props.homeAnchor) registerAnchor(props.app.id, anchorRef.value)
})

onBeforeUnmount(() => {
  if (props.homeAnchor) unregisterAnchor(props.app.id, anchorRef.value)
})
</script>

<template>
  <button
    class="app-icon"
    :class="{ 'is-hidden': hidden }"
    :data-app-id="app.id"
    :style="{ '--enter-delay': enterDelay + 'ms', width: size + 'px', '--scale': size / 60 }"
    @click="open"
  >
    <span ref="anchorRef" class="app-icon-anchor" :style="{ width: size + 'px', height: size + 'px' }">
      <span class="icon-tile squircle-mask" :class="app.special ? 'tile-' + app.special : ''" :style="{ ...(app.special ? {} : { background: app.gradient || '#fff' }), width: size + 'px', height: size + 'px' }">
        <!-- 图片图标：略微放大以切除原图可能自带的不完美圆角和毛刺 -->
        <img v-if="app.image" :src="resolvedImage" alt="" draggable="false" :style="{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.02)' }" />

        <!-- 标准：glyph -->
        <svg v-else-if="app.glyph" width="32" height="32" viewBox="0 0 24 24" :style="{ transform: `scale(${size / 60})` }">
          <path :d="GLYPHS[app.glyph]" :fill="app.glyphColor" />
        </svg>

        <!-- 日历：星期 + 日期 -->
        <svg v-else-if="app.special === 'calendar'" class="calendar-face" width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet">
          <text class="calendar-weekday" x="30" y="13" text-anchor="middle" dominant-baseline="middle">{{ weekday }}</text>
          <text class="calendar-date" x="30" y="37" text-anchor="middle" dominant-baseline="middle">{{ today.date }}</text>
        </svg>

        <!-- 照片：彩色风车 -->
        <svg v-else-if="app.special === 'photos'" width="40" height="40" viewBox="0 0 40 40" :style="{ transform: `scale(${size / 60})` }">
          <g transform="translate(20,20)">
            <ellipse v-for="(c, i) in ['#FF3B30','#FF9500','#FFCC00','#34C759','#5AC8FA','#007AFF','#AF52DE','#FF2D55']"
              :key="c" rx="4.6" ry="13" :fill="c" opacity="0.75"
              :transform="`rotate(${i * 45}) translate(0,-7.5)`" />
          </g>
        </svg>

        <!-- 时钟：实时指针 -->
        <svg v-else-if="app.special === 'clock'" class="clock-face" width="100%" height="100%" viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet">
          <circle cx="30" cy="30" r="21" fill="#fff"/>
          <g stroke="#3a3a3c" stroke-width="1.4">
            <line v-for="i in 12" :key="i" x1="30" y1="10" x2="30" y2="13"
              :transform="`rotate(${(i - 1) * 30} 30 30)`" />
          </g>
          <line x1="30" y1="30" x2="30" y2="20" stroke="#1c1c1e" stroke-width="3" stroke-linecap="round"
            :transform="`rotate(${hourDeg} 30 30)`" />
          <line x1="30" y1="30" x2="30" y2="15" stroke="#1c1c1e" stroke-width="2" stroke-linecap="round"
            :transform="`rotate(${minuteDeg} 30 30)`" />
          <line x1="30" y1="32" x2="30" y2="14" stroke="#FF9500" stroke-width="1" stroke-linecap="round"
            :transform="`rotate(${secondDeg} 30 30)`" />
          <circle cx="30" cy="30" r="1.6" fill="#1c1c1e"/>
        </svg>
      </span>

      <!-- 应用数字红角标：绝对锚定于图标瓦片右上角，自适应任意图标尺寸，防止尺寸变化引起飘移 -->
      <span v-if="showBadge && badge && size >= 36" class="icon-badge">{{ badge }}</span>
    </span>

    <span v-if="showLabel" class="icon-label">{{ appDisplayName }}</span>
  </button>
</template>

<style scoped>
.app-icon {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 64px;
}
.app-icon-anchor {
  position: relative;
  display: block;
  flex: none;
}
/* 解锁完成后由 HomeScreen 加 .just-unlocked 触发入场动画 */
.just-unlocked .app-icon {
  animation: icon-enter 0.5s cubic-bezier(0.25, 0.9, 0.3, 1.2) backwards;
  animation-delay: var(--enter-delay, 0ms);
}
@keyframes icon-enter {
  from { opacity: 0; transform: scale(1.35); }
  to { opacity: 1; transform: scale(1); }
}
.app-icon.is-hidden .icon-tile { visibility: hidden; }
.app-icon.is-hidden .icon-badge { visibility: hidden; }

.icon-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.16s cubic-bezier(0.3, 0.8, 0.4, 1), filter 0.16s ease;
}
.squircle-mask {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 0 L 72 0 C 86 0 100 14 100 28 L 100 72 C 100 86 86 100 72 100 L 28 100 C 14 100 0 86 0 72 L 0 28 C 0 14 14 0 28 0 Z' fill='black'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
  mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 0 L 72 0 C 86 0 100 14 100 28 L 100 72 C 100 86 86 100 72 100 L 28 100 C 14 100 0 86 0 72 L 0 28 C 0 14 14 0 28 0 Z' fill='black'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
}
.app-icon:active .icon-tile {
  transform: scale(0.88);
  filter: brightness(0.85);
}

.icon-label {
  font: var(--text-caption);
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  max-width: 68px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  padding: 0.8px 5.5px 0 5.5px;
  border-radius: 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ios-red);
  color: #fff;
  font: 600 12px/1 var(--font-stack);
  letter-spacing: -0.3px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 2;
}

/* 日历图标 */
.tile-calendar { background: linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%); }
.calendar-face,.clock-face{display:block;width:100%;height:100%;transform:none}
.calendar-weekday{fill:var(--ios-red);font:600 9px var(--font-stack);letter-spacing:.35px}
.calendar-date{fill:#1c1c1e;font:300 30px var(--font-stack);font-variant-numeric:tabular-nums}

/* 照片图标：iOS 风格白底彩色风车 */
.tile-photos { background: linear-gradient(180deg, #ffffff 0%, #f2f2f7 100%); }

/* 时钟图标：黑底白表盘（SVG 自带圆，背景铺满圆角） */
.tile-clock { background: #1c1c1e; }
</style>
