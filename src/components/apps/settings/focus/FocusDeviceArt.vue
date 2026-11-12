<script setup>
/**
 * 专注模式「自定义屏幕」设备示意图（纯 CSS 绘制，不引入手绘 SVG）。
 *
 * 三种形态：锁屏手机 / 主屏幕手机 / Apple Watch。尺寸随 scale 等比缩放，
 * 三者都是「底边对齐」的等高占位块，便于并排时下方标签共线。
 * wallpaper 为空即灰色示意；传入选中的壁纸 id 则铺对应渐变，表示该项已选取。
 */
defineProps({
  kind: { type: String, default: 'lock' }, // 'lock' | 'home' | 'watch'
  scale: { type: Number, default: 1 },
  wallpaper: { type: String, default: '' }, // '' | aurora | default | ocean | dark | light
  time: { type: String, default: '20:45' }
})
</script>

<template>
  <span class="fda" :class="[`is-${kind}`, wallpaper ? `wall-${wallpaper}` : '']" :style="{ '--s': scale }">
    <span v-if="kind === 'lock'" class="fda-lock">
      <strong class="fda-time">{{ time }}</strong>
      <span class="fda-dots"><i></i><i></i><i></i></span>
      <span class="fda-homebar"></span>
    </span>

    <span v-else-if="kind === 'home'" class="fda-home">
      <span class="fda-tiles"><i></i><i></i></span>
      <span class="fda-panel"></span>
      <span class="fda-grid"><i v-for="n in 4" :key="`a${n}`"></i></span>
      <span class="fda-grid"><i v-for="n in 4" :key="`b${n}`"></i></span>
      <span class="fda-dock"><i v-for="n in 4" :key="`d${n}`"></i></span>
    </span>

    <span v-else class="fda-watch">
      <i class="fda-hand is-hour"></i>
      <i class="fda-hand is-minute"></i>
      <i class="fda-pivot"></i>
    </span>

    <i v-if="kind === 'watch'" class="fda-crown"></i>
  </span>
</template>

<style scoped>
.fda {
  /* --s：整体缩放（1 = 详情页卡片里的尺寸） */
  --s: 1;
  position: relative;
  display: block;
  flex: none;
  box-sizing: border-box;
}

/* ===== 手机（锁屏 / 主屏共用外壳） ===== */
.fda.is-lock,
.fda.is-home {
  width: calc(72px * var(--s));
  height: calc(157px * var(--s));
  border-radius: calc(9px * var(--s));
  overflow: hidden;
  background-color: var(--face-color, #F4F4F5);
  background-image: var(--face-img, none);
}

/* ===== Apple Watch：白壳 + 灰圈 + 浅色表面 ===== */
.fda.is-watch {
  width: calc(62px * var(--s));
  height: calc(71px * var(--s));
  border-radius: calc(15px * var(--s));
  background: #fff;
  box-shadow: inset 0 0 0 calc(2.6px * var(--s)) #C7C7CB;
}

.fda-crown {
  position: absolute;
  top: calc(21px * var(--s));
  right: calc(-2.6px * var(--s));
  width: calc(2.6px * var(--s));
  height: calc(9px * var(--s));
  border-radius: 0 calc(1.5px * var(--s)) calc(1.5px * var(--s)) 0;
  background: #C7C7CB;
}

/* ===== 锁屏 ===== */
.fda-lock {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(25px * var(--s));
}

.fda-time {
  font-size: calc(18px * var(--s));
  line-height: 1;
  font-weight: 500;
  letter-spacing: calc(-.4px * var(--s));
  color: var(--ink, #C7C7CB);
}

.fda-dots {
  display: flex;
  gap: calc(3px * var(--s));
  margin-top: calc(6px * var(--s));
}

.fda-dots i {
  width: calc(10px * var(--s));
  height: calc(10px * var(--s));
  border-radius: 50%;
  background: var(--ink, #C7C7CB);
}

.fda-homebar {
  position: absolute;
  left: 50%;
  bottom: calc(5px * var(--s));
  width: calc(23px * var(--s));
  height: calc(2px * var(--s));
  border-radius: calc(1px * var(--s));
  background: var(--ink, #C7C7CB);
  transform: translateX(-50%);
}

/* ===== 主屏幕 ===== */
.fda-home {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: calc(15px * var(--s)) calc(8px * var(--s)) 0;
}

.fda-tiles {
  display: flex;
  gap: calc(5px * var(--s));
}

.fda-tiles i {
  flex: 1;
  height: calc(23px * var(--s));
  border-radius: calc(6px * var(--s));
  background: var(--blk, #C7C7CB);
}

.fda-panel {
  margin-top: calc(8px * var(--s));
  height: calc(23px * var(--s));
  border-radius: calc(6px * var(--s));
  background: var(--blk, #C7C7CB);
}

.fda-grid {
  margin-top: calc(6px * var(--s));
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(4px * var(--s));
}

.fda-grid + .fda-grid {
  margin-top: calc(5px * var(--s));
}

.fda-grid i {
  height: calc(10px * var(--s));
  border-radius: calc(3px * var(--s));
  background: var(--blk, #C7C7CB);
}

.fda-dock {
  margin-top: auto;
  margin-bottom: calc(6px * var(--s));
  height: calc(14px * var(--s));
  padding: 0 calc(4px * var(--s));
  border-radius: calc(5px * var(--s));
  background: var(--dock, #C7C7CB);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fda-dock i {
  width: calc(6px * var(--s));
  height: calc(6px * var(--s));
  border-radius: calc(2px * var(--s));
  background: var(--dockblk, #F4F4F5);
}

/* ===== 表盘 ===== */
.fda-watch {
  position: absolute;
  inset: calc(4px * var(--s));
  overflow: hidden;
  border-radius: calc(11px * var(--s));
  background-color: var(--face-color, #F4F4F5);
  background-image: var(--face-img, none);
}

.fda-hand {
  position: absolute;
  left: 50%;
  bottom: 50%;
  width: calc(1.6px * var(--s));
  border-radius: calc(1px * var(--s));
  background: var(--ink, #C7C7CB);
  transform-origin: 50% 100%;
}

.fda-hand.is-hour {
  height: calc(12px * var(--s));
  transform: translateX(-50%) rotate(-95deg);
}

.fda-hand.is-minute {
  height: calc(19px * var(--s));
  transform: translateX(-50%) rotate(-146deg);
}

.fda-pivot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(3.4px * var(--s));
  height: calc(3.4px * var(--s));
  border-radius: 50%;
  background: var(--ink, #C7C7CB);
  transform: translate(-50%, -50%);
}

/* ===== 已选取：壁纸填充 =====
   墨色走变量：--ink 锁屏文字与指针，--blk 主屏图标色块，--dock 程序坞。 */
.fda.wall-aurora {
  --face-img: linear-gradient(155deg, #13106c, #4338ca 58%, #14213d);
  --face-color: #14213d;
  --ink: rgba(255, 255, 255, .88);
  --blk: rgba(255, 255, 255, .5);
  --dock: rgba(255, 255, 255, .26);
  --dockblk: rgba(255, 255, 255, .75);
}

.fda.wall-default {
  --face-img: linear-gradient(150deg, #b7f4d8, #38bdf8 50%, #312e81);
  --face-color: #312e81;
  --ink: rgba(255, 255, 255, .9);
  --blk: rgba(255, 255, 255, .5);
  --dock: rgba(255, 255, 255, .26);
  --dockblk: rgba(255, 255, 255, .75);
}

.fda.wall-ocean {
  --face-img: linear-gradient(160deg, #06b6d4, #1e3a8a);
  --face-color: #1e3a8a;
  --ink: rgba(255, 255, 255, .9);
  --blk: rgba(255, 255, 255, .5);
  --dock: rgba(255, 255, 255, .26);
  --dockblk: rgba(255, 255, 255, .75);
}

.fda.wall-dark {
  --face-img: none;
  --face-color: #1C1C1E;
  --ink: rgba(255, 255, 255, .85);
  --blk: rgba(255, 255, 255, .22);
  --dock: rgba(255, 255, 255, .14);
  --dockblk: rgba(255, 255, 255, .6);
}

.fda.wall-light {
  --face-img: none;
  --face-color: #E9E9EE;
  --ink: #6E6E73;
  --blk: rgba(255, 255, 255, .92);
  --dock: rgba(255, 255, 255, .7);
  --dockblk: #F4F4F5;
}
</style>
