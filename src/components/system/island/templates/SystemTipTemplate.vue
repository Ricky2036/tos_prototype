<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import phonePreview from '../../../../assets/island/system_tip/phone_preview.png'

const store = useOs16IslandStore()

const isLearned = computed(() => store.systemTipState?.isLearned ?? false)

function onToggleLearned() {
  store.toggleTipLearned()
}
</script>

<template>
  <div class="os16-tip-card" role="region" aria-label="系统引导实时卡片">
    <!-- 左侧手势预览卡片图层 (108x148 暖黄柔和底色 + 手机真机截屏插画) -->
    <div class="preview-card-wrap">
      <img :src="phonePreview" alt="三指截屏演示" class="preview-img" />
    </div>

    <!-- 右侧内容排版与操作图层 -->
    <div class="right-content-col">
      <div class="text-group">
        <div class="tip-title">three finger screenshot</div>
        <div class="tip-desc">
          You can open the app through the smart panel and handle multiple tasks at the same time.You can open
        </div>
      </div>

      <!-- 操作胶囊按键：支持「Details」与「✓ 已掌握」状态流转 -->
      <button
        class="tip-action-btn"
        :class="{ 'is-learned': isLearned }"
        @click.stop="onToggleLearned"
        title="查看详情或标记掌握"
      >
        <span v-if="isLearned" class="btn-learned-text">✓ 已掌握</span>
        <span v-else>Details</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-tip-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  align-items: center;
  user-select: none;
  overflow: hidden;
}

.preview-card-wrap {
  width: 108px;
  height: 148px;
  border-radius: 16px;
  background: #ffeed2;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  display: block;
}

.right-content-col {
  margin-left: 14px;
  flex: 1;
  height: 148px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.text-group {
  display: flex;
  flex-direction: column;
}

.tip-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.tip-desc {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6px;
  letter-spacing: -0.1px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tip-action-btn {
  width: 100%;
  height: 34px;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.16);
  border: none;
  outline: none;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease;
}

.tip-action-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}

.tip-action-btn:active {
  transform: scale(0.97);
}

.tip-action-btn.is-learned {
  background: #31c65a;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(49, 198, 90, 0.35);
}

.btn-learned-text {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
