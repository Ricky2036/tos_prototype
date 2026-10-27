<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import albumCover from '../../../../assets/island/media_extended/album_cover.png'

const store = useOs16IslandStore()

const isPlaying = computed(() => store.mediaExtendedState?.isPlaying ?? true)
const titleText = computed(() => store.mediaExtendedState?.title || 'Eternal Sunshine')
const artistText = computed(() => store.mediaExtendedState?.artist || 'Ariana Grande')
const progressPercent = computed(() => store.mediaExtendedState?.progress ?? 30)

function onTogglePlay() {
  store.toggleMediaPlay()
}

function onPrev() {
  store.prevMediaTrack()
}

function onNext() {
  store.nextMediaTrack()
}
</script>

<template>
  <div class="os16-media-card" role="region" aria-label="大卡音乐播放器实时卡片">
    <!-- 顶部信息行：封面 + 歌曲信息 + 动态音浪可视化 -->
    <div class="card-header-row">
      <div class="album-wrap">
        <img :src="albumCover" alt="专辑封面" class="album-img" />
      </div>

      <div class="text-column">
        <div class="song-title">{{ titleText }}</div>
        <div class="artist-name">{{ artistText }}</div>
      </div>

      <!-- 右上角跳动音浪 -->
      <div class="wave-visualizer" :class="{ 'is-paused': !isPlaying }" title="正在播放">
        <span class="wave-bar bar-1"></span>
        <span class="wave-bar bar-2"></span>
        <span class="wave-bar bar-3"></span>
        <span class="wave-bar bar-4"></span>
      </div>
    </div>

    <!-- 中部进度条与时间行 -->
    <div class="card-progress-col">
      <div class="slider-rail">
        <div class="slider-bg"></div>
        <div class="slider-fill" :style="{ width: progressPercent + '%' }"></div>
        <div class="slider-thumb" :style="{ left: progressPercent + '%' }"></div>
      </div>
      <div class="time-row">
        <span>00:43</span>
        <span>01:59</span>
      </div>
    </div>

    <!-- 底部播放控制按键行：上一首 + 播放/暂停 + 下一首 -->
    <div class="card-controls-row">
      <button class="ctrl-btn" @click.stop="onPrev" title="上一首">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
        </svg>
      </button>

      <button class="ctrl-btn is-play-btn" @click.stop="onTogglePlay" title="播放/暂停">
        <svg v-if="isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
        </svg>
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <button class="ctrl-btn" @click.stop="onNext" title="下一首">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-media-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  user-select: none;
  overflow: hidden;
}

.card-header-row {
  display: flex;
  align-items: center;
  height: 44px;
  position: relative;
}

.album-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1c1c1e;
}

.album-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.text-column {
  margin-left: 14px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.song-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-name {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  letter-spacing: -0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 音浪可视化 */
.wave-visualizer {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 18px;
  margin-left: 12px;
}

.wave-bar {
  width: 3px;
  background-color: #ff5e3a;
  border-radius: 1.5px;
  animation: wave 1.2s ease-in-out infinite alternate;
}

.bar-1 { height: 14px; animation-delay: 0.1s; }
.bar-2 { height: 8px; animation-delay: 0.3s; }
.bar-3 { height: 18px; animation-delay: 0.2s; }
.bar-4 { height: 11px; animation-delay: 0.4s; }

.wave-visualizer.is-paused .wave-bar {
  animation: none;
  height: 4px;
  opacity: 0.4;
}

@keyframes wave {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}

/* 进度条 */
.card-progress-col {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
}

.slider-rail {
  position: relative;
  width: 100%;
  height: 4px;
  display: flex;
  align-items: center;
}

.slider-bg {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #ffffff;
  border-radius: 2px;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ffffff;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.time-row {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.45);
}

/* 底部播放控制行 */
.card-controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36px;
  height: 32px;
}

.ctrl-btn {
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease, opacity 0.15s ease;
}

.ctrl-btn:hover {
  opacity: 0.85;
}

.ctrl-btn:active {
  transform: scale(0.9);
}

.is-play-btn {
  transform: scale(1.15);
}
</style>
