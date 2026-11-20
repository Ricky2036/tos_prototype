<template>
  <div class="back-weather-scene" role="img" aria-label="南山区，22度，晴，最高25度，最低16度，体感22度">
    <div class="weather-sun" aria-hidden="true"></div>
    <div class="weather-horizon" aria-hidden="true"><span></span><i></i></div>
    <div class="weather-person" aria-hidden="true"><i></i><b></b><span></span><em></em></div>

    <div class="weather-content">
      <div class="weather-location">
        <span class="weather-pin" aria-hidden="true"></span>
        <span class="weather-city">南山区</span>
        <span class="weather-condition-tag">晴</span>
      </div>
      <div class="weather-temperature">22°</div>
      <div class="weather-details">
        <span>↑ 25° / ↓ 16°</span>
        <span class="weather-feel">体感 22°</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-weather-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
  color: #f8fdff;
  background: linear-gradient(180deg, var(--product-sky-top, #5db9f2) 0%, var(--product-sky-mid, #86cef3) 54%, color-mix(in srgb, var(--product-sky-mid, #86cef3) 80%, var(--product-water, #239ac6)) 75%, var(--product-sky-bottom, #239ac6) 100%);
}

.weather-content {
  position: absolute;
  z-index: 2;
  top: 10%;
  left: 7%;
  bottom: 8%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  text-shadow: 0 1px 4px rgba(22, 91, 135, 0.22);
}

.weather-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: clamp(9px, 8cqh, 12px);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.weather-pin {
  position: relative;
  width: 9px;
  height: 9px;
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.weather-pin::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 3px;
  left: 50%;
  top: 50%;
  border: 1px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.weather-city {
  font-weight: 600;
}

.weather-condition-tag {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  font-size: clamp(8px, 6.8cqh, 10px);
  font-weight: 500;
}

.weather-temperature {
  font-size: clamp(28px, 28cqh, 44px);
  line-height: 1;
  font-weight: 300;
  letter-spacing: -0.06em;
  font-variant-numeric: tabular-nums;
  margin: 1px 0;
  text-shadow: 0 2px 10px rgba(25, 101, 154, 0.15);
}

.weather-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(7.5px, 6.8cqh, 10px);
  font-weight: 500;
  white-space: nowrap;
}

.weather-feel {
  opacity: 0.82;
}

.weather-sun {
  position: absolute;
  z-index: 1;
  width: 30cqh;
  aspect-ratio: 1;
  top: 8%;
  right: 15%;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #fff 7%, var(--product-accent, #fff0b5) 12%, color-mix(in srgb, var(--product-accent, #fff0b5) 55%, transparent) 30%, rgba(255, 255, 255, 0) 70%);
  filter: blur(0.4px);
}

.weather-sun::after {
  content: '';
  position: absolute;
  inset: -35%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.16), transparent 12%, rgba(255, 255, 255, 0.12), transparent 28%);
  filter: blur(4px);
}

.weather-horizon {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--product-water, #26a8d0) 70%, transparent), var(--product-water, #26a8d0) 48%, var(--product-sky-bottom, #197ca5) 100%);
}

.weather-horizon::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 11%;
  height: 18%;
  background: rgba(74, 195, 227, 0.65);
  clip-path: polygon(0 64%, 28% 48%, 49% 70%, 72% 30%, 100% 47%, 100% 100%, 0 100%);
}

.weather-horizon span {
  position: absolute;
  left: 0;
  right: 0;
  top: 30%;
  height: 2px;
  background: rgba(220, 250, 255, 0.28);
  box-shadow: 0 9px 18px rgba(219, 249, 255, 0.2);
}

.weather-horizon i {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 30%;
  height: 11%;
  background: linear-gradient(90deg, #548b50, #88b657, transparent);
  clip-path: polygon(0 100%, 0 35%, 42% 0, 100% 70%, 100% 100%);
}

.weather-person {
  position: absolute;
  z-index: 2;
  right: 15%;
  bottom: 8%;
  width: 14cqh;
  height: 38%;
}

.weather-person i {
  position: absolute;
  top: 0;
  left: 42%;
  width: 18%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #d5b58e;
  box-shadow: 2px -2px 0 #e3c89f;
}

.weather-person b {
  position: absolute;
  top: 13%;
  left: 27%;
  width: 47%;
  height: 39%;
  border-radius: 30% 32% 18% 22%;
  background: linear-gradient(100deg, #3bbcb4, #13a8a9 70%, #258b9b);
  transform: rotate(8deg);
}

.weather-person b::before {
  content: '';
  position: absolute;
  top: -8%;
  left: 25%;
  width: 64%;
  height: 18%;
  border-radius: 50%;
  background: #d2b28b;
  transform: rotate(-30deg);
}

.weather-person span,
.weather-person em {
  position: absolute;
  top: 49%;
  width: 18%;
  height: 43%;
  border-radius: 4px;
  background: #1e7d91;
  transform-origin: top;
}

.weather-person span {
  left: 34%;
  transform: rotate(7deg);
}

.weather-person em {
  left: 53%;
  transform: rotate(-10deg);
  background: #246880;
}
</style>
