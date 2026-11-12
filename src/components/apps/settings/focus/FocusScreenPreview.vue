<script setup>
/**
 * 屏幕选取页的页面缩略图（纯 CSS）。
 *
 * 真机形态：一张缩小版的手机页面——锁屏是「时间 + 日期 + 下方快捷圆点」，
 * 主屏幕是「组件块 + 4 列图标阵列 + 程序坞」，手表是圆形表盘。
 * 只负责画内容，不画外框阴影；壁纸由 wall-* 变量组提供。
 */
defineProps({
  kind: { type: String, default: 'home' },       // 'home' | 'lock' | 'watch'
  wallpaper: { type: String, default: 'aurora' }, // aurora | default | ocean | dark | light
  widget: { type: Boolean, default: false }       // 主屏幕首页带组件块
})
</script>

<template>
  <span class="fsp-thumb" :class="[`is-${kind}`, `wall-${wallpaper}`]">
    <template v-if="kind === 'lock'">
      <span class="th-lockinfo">
        <strong>09:41</strong>
        <em>11月12日 星期三</em>
      </span>
      <span class="th-quick"><i /><i /></span>
      <span class="th-homebar" />
    </template>

    <template v-else-if="kind === 'watch'">
      <span class="th-dial"><i class="is-hour" /><i class="is-minute" /><i class="is-pivot" /></span>
    </template>

    <template v-else>
      <span v-if="widget" class="th-widget"><i /><i /></span>
      <span class="th-icons"><i v-for="n in 20" :key="n" /></span>
      <span class="th-dock"><i v-for="n in 4" :key="n" /></span>
    </template>
  </span>
</template>

<style scoped>
.fsp-thumb {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--face-color, #0F1B45);
  background-image: var(--face-img, none);
}

/* ===== 锁屏 ===== */
.th-lockinfo {
  position: absolute;
  left: 0;
  right: 0;
  top: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--ink, rgba(255, 255, 255, .92));
}

.th-lockinfo strong {
  font-size: 27px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -.6px;
}

.th-lockinfo em {
  margin-top: 4px;
  font-size: 7px;
  font-style: normal;
  opacity: .9;
}

.th-quick {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.th-quick i {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .24);
}

.th-homebar {
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 38px;
  height: 2.5px;
  margin-left: -19px;
  border-radius: 2px;
  background: rgba(255, 255, 255, .85);
}

/* ===== 主屏幕 ===== */
.th-widget {
  position: absolute;
  left: 7px;
  right: 7px;
  top: 7px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.th-widget i {
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, .82);
}

.th-icons {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 6px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px 5px;
}

.th-widget + .th-icons { top: 36px; }

.th-icons i {
  aspect-ratio: 1;
  border-radius: 4px;
  background: rgba(255, 255, 255, .58);
}

.th-dock {
  position: absolute;
  left: 7px;
  right: 7px;
  bottom: 7px;
  height: 22px;
  border-radius: 7px;
  background: rgba(255, 255, 255, .26);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 6px;
  box-sizing: border-box;
}

.th-dock i {
  width: 15px;
  height: 15px;
  border-radius: 4px;
  background: rgba(255, 255, 255, .72);
}

/* ===== 手表 ===== */
.fsp-thumb.is-watch {
  border-radius: 14px;
}

.th-dial {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  border: 1.6px solid var(--ink, rgba(255, 255, 255, .85));
}

.th-dial i {
  position: absolute;
  left: 50%;
  bottom: 50%;
  width: 1.5px;
  border-radius: 1px;
  background: var(--ink, rgba(255, 255, 255, .85));
  transform-origin: 50% 100%;
}

.th-dial .is-hour { height: 10px; transform: translateX(-50%) rotate(-95deg); }
.th-dial .is-minute { height: 15px; transform: translateX(-50%) rotate(-150deg); }

.th-dial .is-pivot {
  left: 50%;
  top: 50%;
  bottom: auto;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* ===== 壁纸调色板（与 FocusDeviceArt 同一套） ===== */
.wall-aurora {
  --face-img: linear-gradient(155deg, #13106c, #4338ca 58%, #14213d);
  --face-color: #14213d;
}

.wall-default {
  --face-img: linear-gradient(150deg, #b7f4d8, #38bdf8 50%, #312e81);
  --face-color: #312e81;
}

.wall-ocean {
  --face-img: linear-gradient(160deg, #06b6d4, #1e3a8a);
  --face-color: #1e3a8a;
}

.wall-dark {
  --face-img: none;
  --face-color: #1C1C1E;
}

.wall-light {
  --face-img: none;
  --face-color: #E9E9EE;
  --ink: #6E6E73;
}
</style>
