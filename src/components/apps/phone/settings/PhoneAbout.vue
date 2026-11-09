<script setup>
import { ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetModal from '../../../ui/SheetModal.vue'

const emit = defineEmits(['back'])

const showLicenseModal = ref(false)

function handleBack() {
  if (showLicenseModal.value) {
    showLicenseModal.value = false
    return
  }
  emit('back')
}

defineExpose({
  back() {
    if (showLicenseModal.value) {
      showLicenseModal.value = false
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <GlassNavBar overlay title="关于" @back="handleBack" />

    <div class="subpage-body scrollable">
      <!-- 统一分组卡片 -->
      <div class="settings-card">
        <div class="settings-row with-sub">
          <div class="label-col">
            <div class="row-label">版本号</div>
            <div class="row-sub">V17.0.0.087</div>
          </div>
        </div>

        <div class="settings-row chevron-item with-sub no-sep" @click="showLicenseModal = true">
          <div class="label-col">
            <div class="row-label">开放源代码许可</div>
            <div class="row-sub">开放源代码软件的许可详情</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 许可详情弹窗（规范 SheetModal） -->
    <SheetModal :visible="showLicenseModal" padding="22px 18px 18px" @close="showLicenseModal = false">
      <div class="dialog-title">开放源代码许可</div>
      <div class="dialog-body scrollable">
        <p class="license-text">
          SmartCaller 电话使用以下开源项目并遵循对应协议：<br /><br />
          <strong>Android Open Source Project</strong><br />
          Copyright (C) 2006-2024 The Android Open Source Project<br />
          Licensed under Apache License 2.0.<br /><br />
          <strong>WebRTC Native Code</strong><br />
          Copyright (c) 2011, The WebRTC project authors.<br />
          All rights reserved. BSD 3-Clause License.<br /><br />
          <strong>Lottie-Android</strong><br />
          Copyright 2018 Airbnb, Inc.<br />
          Licensed under Apache License 2.0.
        </p>
      </div>
      <button class="dialog-close-btn" type="button" @click="showLicenseModal = false">确定</button>
    </SheetModal>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F2;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-body {
  flex: 1;
  padding: calc(var(--nav-h) + 10px) 16px 40px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  min-height: 52px;
  border-bottom: 0.5px solid #F0F1F3;
  box-sizing: border-box;
}

.settings-row.no-sep {
  border-bottom: none;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.with-sub {
  align-items: flex-start;
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
}

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
}

/* 许可弹窗 */
.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 14px;
}

.dialog-body {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding-right: 4px;
}

.license-text {
  font-size: 13px;
  color: #666666;
  line-height: 1.6;
}

.dialog-close-btn {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  background: #00C853;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-close-btn:active {
  background: #00B248;
}
</style>
