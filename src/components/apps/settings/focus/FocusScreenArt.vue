<script setup>
/**
 * 屏幕选取页的顶部插图（纯 CSS，不用位图也不用 SVG）。
 *
 * 真机形态（Ricky 2026-11-12 提供「选取主屏幕页面」截图）：
 * 一张浅灰主屏底板上叠一张高亮的「当前页面」竖卡，竖卡左上角压一枚白色圆形徽标。
 * 三种形态只换竖卡里的内容：主屏幕是图标阵列，锁屏是时间，手表是圆形表盘。
 */
import LIcon from '../../../ui/LIcon.vue'

defineProps({
  kind: { type: String, default: 'home' } // 'home' | 'lock' | 'watch'
})
</script>

<template>
  <span class="fsa" :class="`is-${kind}`" aria-hidden="true">
    <span class="fsa-board"><i v-for="n in 12" :key="n" /></span>

    <span class="fsa-card">
      <i class="fsa-cap"></i>
      <span v-if="kind === 'lock'" class="fsa-clock">09:41</span>
      <span v-else-if="kind === 'watch'" class="fsa-dial"><i class="is-hour" /><i class="is-minute" /></span>
      <span v-else class="fsa-blocks"><i v-for="n in 6" :key="n" /></span>
    </span>

    <span class="fsa-badge"><LIcon :name="kind === 'lock' ? 'lock' : 'layoutGrid'" :size="11" :stroke-width="2.4" /></span>
  </span>
</template>

<style scoped>
.fsa {
  position: relative;
  display: block;
  width: 104px;
  height: 80px;
  flex: none;
}

/* 底板：4 列 × 3 行的灰色应用块，中间一列被竖卡压住 */
.fsa-board {
  position: absolute;
  left: 0;
  right: 0;
  top: 9px;
  bottom: 9px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 3px;
}

.fsa-board i {
  border-radius: 4px;
  background: #E5E5EB;
}

/* 高亮的页面竖卡 */
.fsa-card {
  position: absolute;
  left: 50%;
  top: 0;
  width: 30px;
  height: 80px;
  margin-left: -15px;
  border-radius: 7px;
  background: linear-gradient(180deg, #6C7CF5, #4B49DA);
  box-shadow: 0 2px 6px rgba(75, 73, 218, .28);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  box-sizing: border-box;
}

.fsa-cap {
  width: 22px;
  height: 7px;
  border-radius: 3.5px;
  background: #F5E27A;
}

.fsa-blocks {
  margin-top: 4px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  width: 100%;
}

.fsa-blocks i {
  height: 8px;
  border-radius: 2px;
  background: rgba(255, 255, 255, .92);
}

.fsa-blocks i:first-child,
.fsa-blocks i:nth-child(2) { height: 9px; }
.fsa-blocks i:nth-child(3) { grid-column: span 2; }

.fsa-clock {
  margin-top: 10px;
  color: #fff;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: -.2px;
}

.fsa-dial {
  position: relative;
  margin-top: 12px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1.4px solid rgba(255, 255, 255, .9);
}

.fsa-dial i {
  position: absolute;
  left: 50%;
  bottom: 50%;
  width: 1.2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, .92);
  transform-origin: 50% 100%;
}

.fsa-dial .is-hour { height: 4px; transform: translateX(-50%) rotate(-95deg); }
.fsa-dial .is-minute { height: 6px; transform: translateX(-50%) rotate(-150deg); }

/* 白色圆形徽标：压在竖卡左下角 */
.fsa-badge {
  position: absolute;
  left: 30px;
  top: 54px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  color: #5E5CE6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .12);
}
</style>
