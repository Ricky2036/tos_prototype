<template>
  <div class="back-weather-scene" role="img" aria-label="南山区，22度，晴，最高25度，最低16度，体感22度">
    <div class="weather-sun" aria-hidden="true"></div>
    <div class="weather-location"><span class="weather-pin" aria-hidden="true"></span>南山区</div>
    <div class="weather-temperature">22°</div>
    <div class="weather-condition">晴</div>
    <div class="weather-horizon" aria-hidden="true"><span></span><i></i></div>
    <div class="weather-person" aria-hidden="true"><i></i><b></b><span></span><em></em></div>
    <div class="weather-details"><span>↑ 25° / ↓ 16°</span><span>体感温度 22°</span></div>
  </div>
</template>

<style>
.back-weather-scene { position:absolute; inset:0; overflow:hidden; container-type:inline-size; color:#f8fdff; background:linear-gradient(180deg,var(--product-sky-top,#5db9f2) 0%,var(--product-sky-mid,#86cef3) 54%,color-mix(in srgb,var(--product-sky-mid,#86cef3) 80%,var(--product-water,#239ac6)) 75%,var(--product-sky-bottom,#239ac6) 100%); }
.weather-location { position:absolute; z-index:2; top:7%; left:8%; display:flex; align-items:center; gap:8px; font-size:8cqw; font-weight:500; letter-spacing:.02em; text-shadow:0 1px 5px rgba(22,91,135,.12); }
.weather-pin { position:relative; width:5cqw; height:5cqw; border:1.5px solid rgba(255,255,255,.9); border-radius:50% 50% 50% 0; transform:rotate(-45deg); }
.weather-pin::after { content:''; position:absolute; width:1.5cqw; height:1.5cqw; left:50%; top:50%; border:1px solid white; border-radius:50%; transform:translate(-50%,-50%); }
.weather-temperature { position:absolute; z-index:2; top:23%; left:7%; font-size:29cqw; line-height:.92; font-weight:300; letter-spacing:-.065em; text-shadow:0 2px 12px rgba(25,101,154,.08); }
.weather-condition { position:absolute; z-index:2; left:8%; top:60%; font-size:8cqw; font-weight:500; }
.weather-sun { position:absolute; z-index:1; width:27cqw; aspect-ratio:1; top:9%; right:15%; border-radius:50%; background:radial-gradient(circle,#fff 0%,#fff 7%,var(--product-accent,#fff0b5) 12%,color-mix(in srgb,var(--product-accent,#fff0b5) 55%,transparent) 30%,rgba(255,255,255,0) 70%); filter:blur(.4px); }
.weather-sun::after { content:''; position:absolute; inset:-35%; border-radius:50%; background:conic-gradient(from 0deg,transparent,rgba(255,255,255,.16),transparent 12%,rgba(255,255,255,.12),transparent 28%); filter:blur(4px); }
.weather-horizon { position:absolute; left:0; right:0; bottom:0; height:24%; background:linear-gradient(180deg,color-mix(in srgb,var(--product-water,#26a8d0) 70%,transparent),var(--product-water,#26a8d0) 48%,var(--product-sky-bottom,#197ca5) 100%); }
.weather-horizon::before { content:''; position:absolute; left:0; right:0; top:11%; height:18%; background:rgba(74,195,227,.65); clip-path:polygon(0 64%,28% 48%,49% 70%,72% 30%,100% 47%,100% 100%,0 100%); }
.weather-horizon span { position:absolute; left:0; right:0; top:30%; height:2px; background:rgba(220,250,255,.28); box-shadow:0 9px 18px rgba(219,249,255,.2); }
.weather-horizon i { position:absolute; left:0; bottom:0; width:30%; height:11%; background:linear-gradient(90deg,#548b50,#88b657,transparent); clip-path:polygon(0 100%,0 35%,42% 0,100% 70%,100% 100%); }
.weather-details { position:absolute; z-index:2; left:8%; bottom:5%; display:flex; flex-direction:column; gap:1.2cqw; font-size:5.4cqw; font-weight:500; text-shadow:0 1px 4px rgba(22,91,135,.2); }
.weather-person { position:absolute; z-index:2; right:16%; bottom:8%; width:13cqw; height:38%; }
.weather-person i { position:absolute; top:0; left:42%; width:18%; aspect-ratio:1; border-radius:50%; background:#d5b58e; box-shadow:2px -2px 0 #e3c89f; }
.weather-person b { position:absolute; top:13%; left:27%; width:47%; height:39%; border-radius:30% 32% 18% 22%; background:linear-gradient(100deg,#3bbcb4,#13a8a9 70%,#258b9b); transform:rotate(8deg); }
.weather-person b::before { content:''; position:absolute; top:-8%; left:25%; width:64%; height:18%; border-radius:50%; background:#d2b28b; transform:rotate(-30deg); }
.weather-person span,.weather-person em { position:absolute; top:49%; width:18%; height:43%; border-radius:4px; background:#1e7d91; transform-origin:top; }
.weather-person span { left:34%; transform:rotate(7deg); }
.weather-person em { left:53%; transform:rotate(-10deg); background:#246880; }
@media (max-width:220px) { .weather-person { right:12%; height:34%; } .weather-details { bottom:5%; } }
</style>
