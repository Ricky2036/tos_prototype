import { defineStore } from 'pinia'

/**
 * 最近任务上限（第二十六轮：5 → 20）。
 *
 * Ricky 原话：「另外帮我解除那个多任务最多 5 个的限制，改为 20 个。」
 *
 * 旧的 5 不是 bug，是一条【有意设计】（`touchRecent` 里的 `.slice(0, 5)`）——
 * 但它同时是「后台最多留几张卡」与「切换器最多能翻多远」这两个量的唯一来源，
 * 所以放宽上限只需要改这一处（AppSwitcher 的 `deckClampFocus(lay, apps.length)`、
 * `settleFocus` 的 `last`、`labelIndex` 全部从 `recentApps.length` 派生）。
 *
 * ⚠️ 为什么不是「越大越好」：可回溯历史变长，但**逐帧渲染成本不变** ——
 *    切换器真正挂到 DOM 的卡片由 `renderedCards` 按层深（≤ 3）裁剪，
 *    与 `recentApps.length` 无关。20 是「够用且一眼能数完」的档位（iOS 也不设硬上限）。
 * ⚠️ 别再把字面量写回任何地方：写死数字必然与这里脱钩。
 */
export const RECENT_MAX = 20

/**
 * 系统状态机：基础层（互斥）+ 正交叠层（各自独立进度）。
 * 所有状态转移收敛在 action 中，组件不直接改 state。
 */
export const useSystemStore = defineStore('system', {
  state: () => ({
    baseLayer: 'lock',            // 'lock' | 'home' | 'app'
    activeAppId: null,
    unlockProgress: 0,            // 解锁手势进度 0..1（桌面入场动效联动用）
    homeGestureProgress: 0,       // 应用内底部上滑返回手势进度（AppWindow 缩放预览）
    screenOn: true,               // 亮/灭屏（控制台控制；灭屏=黑屏，亮屏回锁屏）
    navigationMode: 'gesture',    // 'gesture' (手势导航) | 'threeButton' (三键导航)
    chromeStyleOverride: null,    // 状态栏与导航条动态显式反色覆盖：'light' | 'dark' | null (null 为跟随系统/应用默认)
    overlays: {
      notificationCenter: { status: 'closed', progress: 0 },
      controlCenter: { status: 'closed', progress: 0 },
      appLibrary: { status: 'closed', progress: 0 }
    },
    /* ---- 最近任务（App Switcher / Recent） ----
     * recentApps：最近使用的 appId 列表，LIFO 去重，最多 RECENT_MAX（20）个。
     *   注意它**包含**当前 activeAppId（列表第 0 项），渲染切换器时按此排列。
     *   openApp 时自动 touchRecent，无需应用自己维护。
     * appSwitcherOpen：切换器是否展开（手势驱动时由 HomeIndicator 直写）。
     * switcherProgress：进入切换器的跟手进度 0..1（HomeIndicator 上滑时实时写），
     *   AppSwitcher 用它做「前台应用从全屏连续缩放到卡位」的跟手动画。 */
    recentApps: [],
    appSwitcherOpen: false,
    switcherProgress: 0,
    switcherDwell: false, // 手势悬停已达成（5%+ 停 0.2s），邻居可以进场
    /* ---- 第八轮（Ricky 2026-09-13）----
     * switcherDragX / switcherDragY：应用内上滑手势的【原始位移】（px，右/下为正）。
     *   需求⑥「只有 Y 轴跟手，需要 X、Y 轴共同跟手位移」—— 旧实现只把纵向位移
     *   折算成 switcherProgress，横向位移被丢弃（cx 恒等于屏中心），所以卡片横向纹丝不动。
     *   参考视频 4c4231b0…mp4 实测：手指上滑期间窗口中心 x 从 225 走到 326（+101px）。
     * switcherDragV：手指瞬时速度（px/s，取绝对值）—— 弹性挤压拉伸（scaleX/scaleY 反向）
     *   由「越过满量程 + 瞬时速度」共同驱动（实测起手一瞬宽高比 −6%）。
     * switcherClosing：点空白退出的动画窗口（需求④）。置真期间卡片组滑出左侧、
     *   遮罩淡出，动画播完才真正 exitSwitcherToHome()。 */
    switcherDragX: 0,
    switcherDragY: 0,
    switcherDragV: 0,
    switcherClosing: false
  }),

  getters: {
    overlay: (s) => (name) => s.overlays[name],
    isOverlayActive: (s) => (name) => s.overlays[name].status !== 'closed',
    /**
     * 电源/锁屏按钮当前对应的下一个动作：
     * - 'powerOn' (亮屏)：当前为灭屏黑幕状态 (!screenOn)
     * - 'powerOff' (灭屏)：当前为亮屏且处于锁屏界面 (screenOn && baseLayer === 'lock')
     * - 'lock' (锁屏)：当前为亮屏且处于桌面或应用内 (screenOn && baseLayer !== 'lock')
     */
    powerButtonAction: (s) => {
      if (!s.screenOn) return 'powerOn'
      if (s.baseLayer === 'lock') return 'powerOff'
      return 'lock'
    },
    /**
     * 电源/锁屏按钮显示的动作文案：'亮屏' | '灭屏' | '锁屏'
     */
    powerButtonText: (s) => {
      if (!s.screenOn) return '亮屏'
      if (s.baseLayer === 'lock') return '灭屏'
      return '锁屏'
    }
  },

  actions: {
    setUnlockProgress(p) {
      this.unlockProgress = p
    },

    setHomeGestureProgress(p) {
      this.homeGestureProgress = p
    },

    setNavigationMode(mode) {
      if (mode === 'gesture' || mode === 'threeButton') {
        this.navigationMode = mode
      }
    },

    /** 动态设置状态栏与导航条反色风格：'light' | 'dark' | null */
    setChromeStyle(style) {
      if (style === 'light' || style === 'dark' || style === null) {
        this.chromeStyleOverride = style
      } else {
        this.chromeStyleOverride = null
      }
    },

    /** 解锁完成：lock → home */
    unlock() {
      if (this.baseLayer !== 'lock') return
      this.baseLayer = 'home'
      this.unlockProgress = 0
      this.chromeStyleOverride = null
    },

    /** 重新锁定（电源键 / 演示用 / 亮屏） */
    lock() {
      this.baseLayer = 'lock'
      this.activeAppId = null
      this.appSwitcherOpen = false
      this.unlockProgress = 0
      this.homeGestureProgress = 0
      this.chromeStyleOverride = null
      for (const key of Object.keys(this.overlays)) {
        this.overlays[key] = { status: 'closed', progress: 0 }
      }
    },

    /** 灭屏：全黑覆盖（屏幕事件全部失效） */
    powerOff() {
      this.screenOn = false
    },

    /** 亮屏：回到锁屏界面 */
    powerOn() {
      this.screenOn = true
      this.lock()
    },

    /**
     * 电源/锁屏按钮动作处理（三态流转）：
     * 1. 灭屏状态 (!screenOn) -> 点击亮屏，回到锁屏界面
     * 2. 锁屏界面 (screenOn && baseLayer === 'lock') -> 点击灭屏 (黑屏遮盖)
     * 3. 桌面/应用中 (screenOn && baseLayer !== 'lock') -> 点击锁屏 (锁定回锁屏)
     */
    togglePower() {
      if (!this.screenOn) {
        this.powerOn()
      } else if (this.baseLayer === 'lock') {
        this.powerOff()
      } else {
        this.lock()
      }
    },

    /** 任一叠层是否打开（Home 手势 / 侧滑返回判断用） */
    anyOverlayOpen() {
      return Object.values(this.overlays).some((o) => o.status !== 'closed')
    },

    /** 打开应用：home → app */
    openApp(appId) {
      if (this.baseLayer === 'lock') return
      this.baseLayer = 'app'
      this.activeAppId = appId
      this.chromeStyleOverride = null
      this.touchRecent(appId)
      // 打开应用时收起所有叠层与切换器
      this.appSwitcherOpen = false
      for (const key of Object.keys(this.overlays)) {
        if (this.overlays[key].status !== 'closed') {
          this.overlays[key] = { status: 'closed', progress: 0 }
        }
      }
    },

    /* ---- 最近任务 ---- */

    /** 把 appId 提到最近列表最前（LIFO 去重，上限 RECENT_MAX = 20） */
    touchRecent(appId) {
      if (!appId) return
      this.recentApps = [appId, ...this.recentApps.filter((id) => id !== appId)].slice(0, RECENT_MAX)
    },

    /** 打开切换器（无最近任务时不打开）。
     *  手势路径：进度由 HomeIndicator 在松手时铺到 ~0.5，
     *  AppSwitcher 接手弹簧推到 1（前台应用连续缩进卡位，无跳变）；
     *  直开路径（桌面/调试）：AppSwitcher 检测到无 activeAppId 会把进度直接置 1。 */
    openSwitcher() {
      if (this.recentApps.length === 0) return
      this.appSwitcherOpen = true
      /* 第八轮：清掉上一次「点空白退出」遗留的动画窗口。
         注意【不能】在这里 resetSwitcherDrag() —— 应用内上滑那条路径松手后，
         跟手卡还要靠 switcherDragX/Y 做「偏移平滑归零」（followFree 弹簧），
         一清就变成硬跳。位移的去重由 HomeIndicator 的 onStart 与 closeSwitcher 负责。 */
      this.switcherClosing = false
    },

    /** 关闭切换器，回到 baseLayer（home 或 app） */
    closeSwitcher() {
      this.appSwitcherOpen = false
      this.switcherProgress = 0
      this.switcherDwell = false
      /* 第八轮：退出动画窗口与跟手位移一并复位（两者都只服务于「上一次打开」） */
      this.switcherClosing = false
      this.resetSwitcherDrag()
    },

    /** 手势跟手进度：0 = 未进入，1 = 完全进入。
     *  上限放开到 1.6：手指越过满量程后位移继续有效（带橡皮筋，实际约到 1.35），
     *  卡片据此继续无极缩小 —— 但永不淡出/消失（Ricky 2026-09-12）。
     *  松手后弹簧回到 1（固定终点）。 */
    setSwitcherProgress(p) {
      this.switcherProgress = Math.max(0, Math.min(1.6, p))
    },

    /** 应用内上滑手势的原始位移与瞬时速度（需求⑥）。
     *  x/y = 手指相对按下点的位移（px，右/下为正）；v = 瞬时速度绝对值（px/s）。
     *  只由 HomeIndicator 在跟手期写；松手时把 v 清零（速度项不再参与形变），
     *  x/y 保留到卡片落位（AppSwitcher 的 followFree 弹簧负责把偏移平滑归零）。 */
    setSwitcherDrag(x, y, v) {
      this.switcherDragX = x || 0
      this.switcherDragY = y || 0
      this.switcherDragV = v || 0
    },

    /** 清空跟手位移（手势开始 / 切换器关闭时） */
    resetSwitcherDrag() {
      this.switcherDragX = 0
      this.switcherDragY = 0
      this.switcherDragV = 0
    },

    /** 点空白退出的动画窗口（需求④）：置真 → 播滑出动画；播完由组件调 exitSwitcherToHome() */
    beginSwitcherClose() {
      if (this.switcherClosing) return false
      this.switcherClosing = true
      return true
    },

    /** 切换器里上滑移除某个应用卡片 */
    dismissApp(appId) {
      this.recentApps = this.recentApps.filter((id) => id !== appId)
      // 移除的是当前应用：若列表还有剩余就回到桌面，桌面兜底
      if (this.activeAppId === appId) {
        this.activeAppId = null
        this.baseLayer = 'home'
      }
      if (this.recentApps.length === 0) this.closeSwitcher()
    },

    /** 底部垃圾桶：清空全部最近任务，回桌面 */
    dismissAll() {
      this.recentApps = []
      this.activeAppId = null
      this.baseLayer = 'home'
      this.closeSwitcher()
    },

    /** 切换器里点空白：关掉切换器并【回桌面】（需求⑪）。
     *  与 dismissAll 的关键区别：**不清空 recentApps**（点空白不是「清理后台」）。
     *  也与 closeSwitcher 不同：closeSwitcher 只回到 baseLayer，从应用内进来时会退回那个应用。 */
    exitSwitcherToHome() {
      this.activeAppId = null
      this.baseLayer = 'home'
      this.closeSwitcher()
    },

    /** 切换器里点卡片恢复某个应用 */
    resumeApp(appId) {
      if (!this.recentApps.includes(appId)) return
      this.activeAppId = appId
      this.baseLayer = 'app'
      this.touchRecent(appId)
      this.appSwitcherOpen = false
    },

    /** 返回桌面：app → home（hero 收缩完成后由 AppWindow 调用 finishGoHome） */
    goHome() {
      if (this.baseLayer !== 'app') return
      this.baseLayer = 'home'
      this.chromeStyleOverride = null
    },
    finishGoHome() {
      this.activeAppId = null
      this.chromeStyleOverride = null
    },

    /* ---- 叠层 ---- */

    setOverlayProgress(name, progress) {
      const o = this.overlays[name]
      o.status = 'dragging'
      o.progress = progress
    },

    /** 手势松手后由 spring 推进，到位后调用 settle 落定终态 */
    beginSettle(name, progress) {
      const o = this.overlays[name]
      o.status = 'settling'
      o.progress = progress
    },

    /** spring 推进中：只更新进度，保持 settling 状态 */
    updateSettleProgress(name, progress) {
      this.overlays[name].progress = progress
    },

    settleOverlay(name, open) {
      const o = this.overlays[name]
      if (open) {
        // 互斥：开 NC 时关 CC，反之亦然
        if (name === 'notificationCenter') this.closeOverlay('controlCenter')
        if (name === 'controlCenter') this.closeOverlay('notificationCenter')
        // 打开叠层时收起切换器（层级语义：叠层更高）
        this.appSwitcherOpen = false
        o.status = 'open'
        o.progress = 1
      } else {
        o.status = 'closed'
        o.progress = 0
      }
    },

    closeOverlay(name) {
      const o = this.overlays[name]
      if (o.status === 'closed') return
      o.status = 'closed'
      o.progress = 0
    },

    /** 请求关闭（动画路径）：置 closing，由 ScreenView 的 spring 播完收起动画后 settle */
    requestCloseOverlay(name) {
      const o = this.overlays[name]
      if (o.status === 'open' || o.status === 'settling') o.status = 'closing'
    }
  }
})
