<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import { APPS as APPS_REGISTRY } from '../../../../config/apps'

const emit = defineEmits(['back'])

/**
 * 应用清单：直接用**桌面已注册的应用**（`src/config/apps.js`）和它们的真实图标，
 * 不再自造首字母色块。真机这一页按应用列「自动 / 展示相机孔 / 隐藏相机孔」，默认「自动」。
 */
const APP_IDS = ['camera', 'messages', 'safari', 'weather', 'notes', 'files', 'voicememos', 'calculator', 'settings', 'aimate']
const APPS = APP_IDS
  .map((id) => APPS_REGISTRY.find((a) => a.id === id))
  .filter(Boolean)
  .map((a) => ({ id: a.id, name: a.name, image: a.image }))
</script>

<template>
  <SubPageShell title="应用全屏显示" @back="emit('back')">
    <div class="hole-previews">
      <div class="hole-col">
        <div class="hole-phone"><span class="hole-dot"></span></div>
        <div class="hole-label">展示相机孔</div>
      </div>
      <div class="hole-col">
        <div class="hole-phone"><span class="hole-bar"></span></div>
        <div class="hole-label">隐藏相机孔</div>
      </div>
    </div>

    <div class="card-note">
      应用显示修改为“展示相机孔”，可将应用背景强制延伸到相机孔全屏显示。
    </div>

    <div class="settings-card">
      <div
        v-for="(app, i) in APPS"
        :key="app.name"
        class="app-row"
        :class="{ last: i === APPS.length - 1 }"
      >
        <img class="app-icon-img" :src="app.image" :alt="app.name" />
        <span class="app-main">
          <span class="app-name">{{ app.name }}</span>
          <span class="app-mode">自动</span>
        </span>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.hole-previews {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 0 14px;
}

.hole-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.hole-phone {
  position: relative;
  width: 92px;
  height: 202px;
  border-radius: 16px;
  border: 2px solid #C9C9CE;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.hole-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9A9AA0;
  margin-top: 9px;
}

.hole-bar {
  width: 100%;
  height: 12px;
  background: #9A9AA0;
  border-radius: 12px 12px 0 0;
}

.hole-label {
  font-size: 13px;
  color: #3C3C43;
}

.app-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.app-row.last {
  padding-bottom: 14px;
}

.app-icon-img {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  object-fit: cover;
  flex: none;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  padding-bottom: 10px;
  min-width: 0;
}

.app-row.last .app-main {
  border-bottom: none;
  padding-bottom: 0;
}

.app-name {
  font-size: 16px;
  color: #111;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-mode {
  font-size: 13px;
  color: #2F6BF6;
}
</style>
