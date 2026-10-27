<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

const store = useOs16IslandStore()

const batteryPercent = computed(() => store.baseTemplateState?.batteryPercent ?? 87)
const batteryWatt = computed(() => store.baseTemplateState?.batteryWatt ?? 25)
const chargingMode = computed(() => store.baseTemplateState?.chargingMode ?? 'hyper')

const isModeCold = computed(() => chargingMode.value === 'cold' || chargingMode.value === 'normal')
const isModeAi = computed(() => chargingMode.value === 'ai' || chargingMode.value === 'turbo')
const isModeHyper = computed(() => chargingMode.value === 'hyper' || chargingMode.value === 'super')

function onSetMode(mode, watt) {
  if (store.baseTemplateState) {
    store.baseTemplateState.chargingMode = mode
    store.baseTemplateState.batteryWatt = watt
  }
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="超级快充实时卡片">
    <!-- 左侧电池图标与充电百分比/功率 (严格对应 Figma 298:18670 原厂图层) -->
    <div class="battery-info-left">
      <div class="battery-shell-wrap">
        <svg width="35" height="20" viewBox="207 564 36 20" fill="none">
          <defs>
            <linearGradient id="figma_battery_grad" x1="208" y1="574" x2="232" y2="574" gradientUnits="userSpaceOnUse">
              <stop stop-color="#94FF84"/>
              <stop offset="1" stop-color="#09D535"/>
            </linearGradient>
            <clipPath id="figma_battery_level_clip">
              <!-- 随电量动态变化的裁切区域 -->
              <rect x="208" y="564" :width="23.8 * (batteryPercent / 100)" height="20" />
            </clipPath>
          </defs>
          <!-- 电池外壳底层 (半透浅灰) -->
          <path d="M231.813 564.786C234.193 564.786 235.384 564.786 236.293 565.249C237.092 565.657 237.742 566.307 238.15 567.107C238.613 568.016 238.613 569.206 238.613 571.586V576.32C238.613 578.7 238.613 579.89 238.15 580.799C237.742 581.599 237.092 582.249 236.293 582.656C235.384 583.12 234.193 583.12 231.813 583.12H214.8C212.42 583.12 211.23 583.12 210.321 582.656C209.521 582.249 208.871 581.599 208.463 580.799C208 579.89 208 578.7 208 576.32V571.586C208 569.206 208 568.016 208.463 567.107C208.871 566.307 209.521 565.657 210.321 565.249C211.23 564.786 212.42 564.786 214.8 564.786H231.813Z" fill="#ADADAD" fill-opacity="0.35"/>
          <!-- 电池正极帽 -->
          <path d="M241.989 572.278C241.995 571.654 241.491 571.145 240.867 571.145H240.014V576.77H240.834C241.45 576.77 241.951 576.273 241.957 575.658L241.989 572.278Z" fill="#ADADAD" fill-opacity="0.35"/>
          <!-- 动态电量填充层 (带双色平滑渐变，受电量百分比裁切) -->
          <g clip-path="url(#figma_battery_level_clip)">
            <path d="M231.813 564.786C234.193 564.786 235.384 564.786 236.293 565.249C237.092 565.657 237.742 566.307 238.15 567.107C238.613 568.016 238.613 569.206 238.613 571.586V576.32C238.613 578.7 238.613 579.89 238.15 580.799C237.742 581.599 237.092 582.249 236.293 582.656C235.384 583.12 234.193 583.12 231.813 583.12H214.8C212.42 583.12 211.23 583.12 210.321 582.656C209.521 582.249 208.871 581.599 208.463 580.799C208 579.89 208 578.7 208 576.32V571.586C208 569.206 208 568.016 208.463 567.107C208.871 566.307 209.521 565.657 210.321 565.249C211.23 564.786 212.42 564.786 214.8 564.786H231.813Z" fill="url(#figma_battery_grad)"/>
          </g>
        </svg>
      </div>

      <div class="text-col">
        <div class="percent-title">{{ batteryPercent }}%</div>
        <div class="watt-sub">{{ batteryWatt }}W</div>
      </div>
    </div>

    <!-- 右侧三种充电模式切换按键 (严格使用 Figma 298:18670 原厂独立图层导出矢量) -->
    <div class="card-actions">
      <!-- 模式 1: 低温慢充 (Figma 298:18670 图层：闪电 + 雪花) -->
      <button
        class="mode-btn btn-cold"
        :class="{ active: isModeCold }"
        @click.stop="onSetMode('cold', 18)"
        title="低温慢充 18W"
      >
        <svg width="42" height="42" viewBox="358 553 42 42" fill="none">
          <!-- 闪电 -->
          <path d="M380.146 565.222C380.213 564.891 379.792 564.691 379.578 564.952L371.777 574.444C371.604 574.655 371.754 574.973 372.028 574.973H375.595C375.799 574.973 375.953 575.16 375.913 575.36L374.847 580.808C374.782 581.14 375.205 581.337 375.417 581.073L383.232 571.366C383.403 571.154 383.252 570.838 382.98 570.838H379.406C379.201 570.838 379.048 570.651 379.088 570.45L380.146 565.222Z" fill="currentColor"/>
          <!-- 雪花 -->
          <path d="M383.32 576.416C383.039 576.416 382.811 576.644 382.811 576.925V579.184L381.045 578.165C380.801 578.024 380.49 578.108 380.349 578.351C380.209 578.595 380.292 578.906 380.536 579.047L382.271 580.049L380.536 581.051C380.292 581.191 380.209 581.503 380.349 581.746C380.49 581.99 380.801 582.073 381.045 581.933L382.811 580.913V582.697C382.811 582.978 383.039 583.206 383.32 583.206C383.601 583.206 383.829 582.978 383.829 582.697V580.948L385.534 581.933C385.778 582.073 386.089 581.99 386.23 581.746C386.37 581.503 386.287 581.191 386.043 581.051L384.308 580.049L386.043 579.047C386.287 578.906 386.37 578.595 386.23 578.351C386.089 578.108 385.778 578.024 385.534 578.165L383.829 579.149V576.925C383.829 576.644 383.601 576.416 383.32 576.416Z" fill="currentColor"/>
        </svg>
      </button>

      <!-- 模式 2: 智能AI充 (Figma 298:18670 图层：闪电 + Ai) -->
      <button
        class="mode-btn btn-ai"
        :class="{ active: isModeAi }"
        @click.stop="onSetMode('ai', 25)"
        title="智能AI快充 25W"
      >
        <svg width="42" height="42" viewBox="414 553 42 42" fill="none">
          <!-- 闪电 -->
          <path d="M435.892 566.058C435.959 565.727 435.538 565.527 435.324 565.788L427.524 575.28C427.35 575.491 427.5 575.809 427.774 575.809H431.342C431.546 575.809 431.699 575.996 431.66 576.196L430.593 581.644C430.528 581.976 430.951 582.173 431.164 581.909L438.978 572.202C439.149 571.99 438.998 571.674 438.726 571.674H435.152C434.947 571.674 434.794 571.487 434.834 571.286L435.892 566.058Z" fill="currentColor"/>
          <!-- A 字母 -->
          <path d="M437.543 577.526L440.009 582.502C440.114 582.713 440.016 582.965 439.792 583.063C439.568 583.162 439.3 583.07 439.196 582.859L438.527 581.51C438.512 581.512 438.497 581.512 438.481 581.512H435.788C435.774 581.512 435.761 581.512 435.748 581.511L435.073 582.872C434.969 583.083 434.701 583.175 434.477 583.077C434.253 582.978 434.155 582.726 434.26 582.515L436.711 577.571C436.749 577.465 436.831 577.373 436.946 577.322C437.17 577.224 437.438 577.316 437.543 577.526ZM437.138 578.708L436.166 580.668H438.109L437.138 578.708Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
          <!-- i 竖线 -->
          <path d="M440.885 579.366C440.885 579.136 441.071 578.949 441.301 578.949C441.531 578.949 441.718 579.136 441.718 579.366V582.699C441.718 582.929 441.531 583.116 441.301 583.116C441.071 583.116 440.885 582.929 440.885 582.699V579.366Z" fill="currentColor"/>
          <!-- i 点 -->
          <path d="M441.301 578.116C441.531 578.116 441.718 577.929 441.718 577.699C441.718 577.469 441.531 577.283 441.301 577.283C441.071 577.283 440.885 577.469 440.885 577.699C440.885 577.929 441.071 578.116 441.301 578.116Z" fill="currentColor"/>
        </svg>
      </button>

      <!-- 模式 3: 超级闪充 (Figma 298:18670 图层：双平行闪电) -->
      <button
        class="mode-btn btn-hyper"
        :class="{ active: isModeHyper }"
        @click.stop="onSetMode('hyper', 120)"
        title="超级闪充 120W"
      >
        <svg width="42" height="42" viewBox="470 553 42 42" fill="none">
          <!-- 右侧/上层闪电 (Figma 原厂路径) -->
          <path d="M498.976 571.674C499.248 571.674 499.399 571.989 499.229 572.201L491.413 581.909C491.201 582.172 490.778 581.975 490.843 581.644L491.695 577.285L496.214 571.674H498.976ZM489.092 574.643C489.296 574.643 489.448 574.829 489.409 575.029L489.257 575.81H488.023C487.75 575.809 487.6 575.491 487.773 575.279L488.297 574.643H489.092ZM495.574 565.787C495.789 565.527 496.209 565.727 496.142 566.058L495.241 570.508H491.694L495.574 565.787Z" fill="currentColor"/>
          <!-- 左侧/下层闪电 (Figma 原厂路径) -->
          <path d="M491.142 566.058C491.209 565.727 490.788 565.527 490.574 565.788L482.774 575.28C482.6 575.491 482.75 575.809 483.024 575.809H486.592C486.796 575.809 486.949 575.996 486.91 576.196L485.843 581.644C485.778 581.976 486.201 582.173 486.414 581.909L494.228 572.202C494.399 571.99 494.248 571.674 493.976 571.674H490.402C490.197 571.674 490.044 571.487 490.084 571.286L491.142 566.058Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-base-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  overflow: hidden;
}

.battery-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.battery-shell-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text-col {
  display: flex;
  flex-direction: column;
}

.percent-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.15;
  color: #8CFD80;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}

.watt-sub {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  letter-spacing: -0.1px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-btn {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  max-width: 42px;
  max-height: 42px;
  border-radius: 50%;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mode-btn:active {
  transform: scale(0.92);
}

/* 模式 1: 低温慢充 (Figma 原厂色标：未选中深底浅青，选中亮蓝渐变) */
.btn-cold {
  color: #39CFF8;
}
.btn-cold.active {
  background: linear-gradient(135deg, #7BFF66 5.6%, #39CFF8 46.2%, #3183FF 89.4%, #22A2FF 100%);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(57, 207, 248, 0.4);
}

/* 模式 2: 智能AI充 (Figma 原厂色标：未选中深底荧光青，选中鲜绿青渐变) */
.btn-ai {
  color: #36FF92;
}
.btn-ai.active {
  background: linear-gradient(135deg, #9DFFCA 0%, #36FF92 23.8%, #3AB9FE 86.5%, #69FFD2 99.5%);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(54, 255, 146, 0.4);
}

/* 模式 3: 超级闪充 (Figma 原厂渐变：paint7_linear_298_18670 #224AFF -> #DC4DFF -> #D899FF) */
.btn-hyper {
  color: #DC4DFF;
}
.btn-hyper.active {
  background: linear-gradient(135deg, #224AFF 0%, #DC4DFF 58.7%, #D899FF 95.1%);
  color: #ffffff;
  box-shadow: 0 0 24px rgba(220, 77, 255, 0.45);
}
</style>
