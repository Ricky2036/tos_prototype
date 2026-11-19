<script setup>
defineProps({
  date: { type: String, default: '' },
  time: { type: String, default: '' }
})
</script>

<template>
  <div class="back-clock-wallpaper" aria-label="动态地球时钟壁纸">
    <div class="clock-space-glow"></div>
    <div class="clock-earth" aria-hidden="true">
      <div class="clock-earth-map-strip">
        <svg viewBox="0 0 360 180" aria-hidden="true">
          <path d="M18 54 31 39 49 36 59 25 80 28 90 39 108 39 117 52 108 63 99 71 94 86 78 90 69 108 58 101 53 86 41 78 34 65 24 64Z"/>
          <path d="m89 94 13 5 12 17-4 18-9 21-11-9-2-17-9-14Z"/>
          <path d="m152 44 12-12 22 2 10 10 18-3 18 9 10 15-12 8-18-5-9 10-16-5-9-14-14 1-8-8Z"/>
          <path d="m176 83 18-8 22 7 14 14-4 24-13 25-18 10-11-13-1-23-13-14Z"/>
          <path d="m231 43 17-12 29 6 19 14 22 3 11 16-17 9-18-6-10 13-19-3-15-14-16 2-11-13Z"/>
          <path d="m291 103 18-7 22 10-5 17-20 7-14-11Z"/>
        </svg>
        <svg viewBox="0 0 360 180" aria-hidden="true">
          <path d="M18 54 31 39 49 36 59 25 80 28 90 39 108 39 117 52 108 63 99 71 94 86 78 90 69 108 58 101 53 86 41 78 34 65 24 64Z"/>
          <path d="m89 94 13 5 12 17-4 18-9 21-11-9-2-17-9-14Z"/>
          <path d="m152 44 12-12 22 2 10 10 18-3 18 9 10 15-12 8-18-5-9 10-16-5-9-14-14 1-8-8Z"/>
          <path d="m176 83 18-8 22 7 14 14-4 24-13 25-18 10-11-13-1-23-13-14Z"/>
          <path d="m231 43 17-12 29 6 19 14 22 3 11 16-17 9-18-6-10 13-19-3-15-14-16 2-11-13Z"/>
          <path d="m291 103 18-7 22 10-5 17-20 7-14-11Z"/>
        </svg>
      </div>
      <div class="clock-earth-clouds"></div>
      <i class="clock-earth-pin"></i>
      <div class="clock-earth-shine"></div>
    </div>
    <div class="clock-wallpaper-time">
      <span class="clock-wallpaper-date">{{ date }}</span>
      <strong>{{ time }}</strong>
      <span class="clock-wallpaper-weather">24°</span>
    </div>
    <span class="clock-wallpaper-caption">WORLD CLOCK</span>
  </div>
</template>

<style scoped>
.back-clock-wallpaper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
  color: #f7fbff;
  background:
    radial-gradient(ellipse at 75% 46%, color-mix(in srgb, var(--product-glow, #0871bd) 40%, transparent), transparent 46%),
    radial-gradient(ellipse at 36% 45%, #091626 0%, #050b14 72%);
}
.clock-space-glow {
  position: absolute;
  inset: 0;
  opacity: .55;
  background-image: radial-gradient(rgba(188,224,255,.75) .45px, transparent .8px);
  background-size: 22px 19px;
  mask-image: linear-gradient(90deg, #000 5%, transparent 72%);
  animation: clock-stars 5s ease-in-out infinite alternate;
}
.clock-earth {
  position: absolute;
  top: 50%;
  right: -7%;
  width: min(78cqh, 58cqw);
  aspect-ratio: 1;
  overflow: hidden;
  transform: translateY(-50%);
  border: 1px solid rgba(103,203,255,.74);
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 32% 30%, rgba(115,216,255,.76), transparent 24%),
    radial-gradient(circle at 38% 38%, #087ec1 0%, #075596 46%, #062449 74%, #020a17 100%);
  box-shadow: 0 0 9px rgba(0,170,255,.7), 0 0 32px rgba(0,111,210,.45), inset -18px -5px 23px rgba(0,0,0,.83), inset 7px 2px 16px rgba(97,211,255,.31);
  animation: earth-float 5s ease-in-out infinite alternate;
}
.clock-earth-map-strip {
  position: absolute;
  inset: 8% -2%;
  display: flex;
  width: 204%;
  opacity: .75;
  filter: drop-shadow(0 0 4px rgba(65,206,255,.62));
  animation: earth-rotate 18s linear infinite;
}
.clock-earth-map-strip svg {
  width: 50%;
  height: 100%;
  flex: 0 0 50%;
  fill: #3aa8b6;
  opacity: .78;
}
.clock-earth-clouds {
  position: absolute;
  inset: -14% -20%;
  border-radius: 50%;
  background: repeating-linear-gradient(168deg, transparent 0 12%, rgba(177,232,255,.13) 13% 15%, transparent 17% 28%);
  filter: blur(5px);
  animation: cloud-drift 9s linear infinite alternate;
}
.clock-earth-pin {
  position: absolute;
  top: 42%;
  right: 18%;
  width: max(3px, 3.5cqh);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #ff647f;
  box-shadow: 0 0 0 3px rgba(255,100,127,.18), 0 0 11px #ff6178;
  animation: pin-pulse 1.6s ease-in-out infinite;
}
.clock-earth-shine {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(108deg, transparent 34%, rgba(209,245,255,.16) 48%, transparent 61%);
  animation: earth-shine 5.5s ease-in-out infinite;
}
.clock-wallpaper-time {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 7%;
  display: flex;
  width: 57%;
  flex-direction: column;
  align-items: flex-start;
  transform: translateY(-50%);
  text-shadow: 0 2px 12px rgba(0,0,0,.38);
}
.clock-wallpaper-time strong {
  font-size: clamp(22px, 27cqh, 52px);
  font-weight: 250;
  line-height: .98;
  letter-spacing: -.065em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.clock-wallpaper-date,.clock-wallpaper-weather {
  color: rgba(240,247,255,.89);
  font-size: clamp(6px, 7cqh, 11px);
  font-weight: 600;
  line-height: 1.2;
}
.clock-wallpaper-weather { margin-top: 3px; }
.clock-wallpaper-caption {
  position: absolute;
  z-index: 2;
  left: 7%;
  bottom: 8%;
  color: rgba(196,216,235,.44);
  font-size: clamp(5px, 4cqh, 7px);
  letter-spacing: .16em;
}
@keyframes earth-rotate { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes earth-float { from { margin-top: 2px; } to { margin-top: -7px; } }
@keyframes cloud-drift { from { transform: translateX(-8%) rotate(-8deg); } to { transform: translateX(8%) rotate(8deg); } }
@keyframes earth-shine { 0%,25% { transform: translateX(-90%); opacity:0; } 55% { opacity:.9; } 100% { transform: translateX(90%); opacity:0; } }
@keyframes pin-pulse { 50% { box-shadow:0 0 0 6px rgba(255,100,127,.1),0 0 15px #ff6178; } }
@keyframes clock-stars { to { opacity:.25; transform:translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .clock-earth-map-strip,.clock-earth-clouds,.clock-earth-shine,.clock-earth,.clock-earth-pin,.clock-space-glow { animation-duration:40s; } }
</style>
