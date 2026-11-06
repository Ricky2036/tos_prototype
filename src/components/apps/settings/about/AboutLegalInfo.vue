<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import ListCell from '../../../ui/ListCell.vue'

const emit = defineEmits(['back'])

const activeDetail = ref(null)

const legalItems = [
  {
    id: 'oss',
    title: '开源软件许可',
    subtitle: 'Linux 内核与系统开源组件声明',
    content: '本设备系统基于 Linux 内核构建，并集成了遵循 GPL、LGPL、Apache 2.0、MIT、BSD 等开源协议的软件组件。您可在传音官方开源开发者支持中心下载内核源码与对应合规文档。'
  },
  {
    id: 'google',
    title: 'Google 法律信息',
    subtitle: '移动服务与服务条款说明',
    content: 'Google、Android、Google Play 及其他相关标志均为 Google LLC 的商标。系统内置之 Google 移动服务受对应终端用户服务协议与隐私权政策约束。'
  },
  {
    id: 'eula',
    title: '系统最终用户许可协议',
    subtitle: 'XOS 软件许可与服务协议',
    content: '欢迎使用 XOS 操作系统。您在初次激活并使用本设备软件时，即代表您已知晓并同意遵循本协议中约定的所有条款。传音保留在遵循相关法律法规前提下对软件功能的优化与升级权利。'
  },
  {
    id: 'privacy',
    title: '隐私与个人信息保护声明',
    subtitle: '系统数据收集与使用规范',
    content: '我们高度重视您的隐私。设备仅在提供必要服务所必需的前提下处理有限的数据，且绝不会在未取得您明确授权的情况下将个人敏感信息提供给无关第三方。'
  },
  {
    id: 'rf',
    title: '射频能量辐射与认证',
    subtitle: 'SAR 比吸收率合规说明',
    content: '本型号设备经国家指定检测机构严格测试，无线电发射比吸收率（SAR）测试结果完全符合国家强制性标准（GB 21288）及国际非电离辐射防护委员会（ICNIRP）的限值要求，可安心贴身携带与使用。'
  }
]

function handleOpen(item) {
  activeDetail.value = item
}
</script>

<template>
  <div class="legal-info-page">
    <!-- 顶部导航栏 -->
    <GlassNavBar title="法律信息" @back="emit('back')" />

    <!-- 滚动区域 -->
    <div class="sub-scroll-body scrollable">
      <div class="group-header">合规与许可条款</div>
      <div class="settings-card">
        <ListCell
          v-for="(item, idx) in legalItems"
          :key="item.id"
          :title="item.title"
          :subtitle="item.subtitle"
          chevron
          clickable
          :last="idx === legalItems.length - 1"
          @click="handleOpen(item)"
        />
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>

    <!-- 条款详情弹层 -->
    <Transition name="detail-pop">
      <div v-if="activeDetail" class="detail-mask" @click.self="activeDetail = null">
        <div class="detail-card">
          <div class="detail-header">
            <div class="detail-title">{{ activeDetail.title }}</div>
            <button class="detail-close-btn" aria-label="关闭" type="button" @click="activeDetail = null">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="detail-content scrollable">
            {{ activeDetail.content }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.legal-info-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.sub-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  background: #F4F5F7;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #EAECEF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #DFE2E6;
  transform: scale(0.96);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.3px;
  margin-left: 14px;
}

.sub-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
}

.group-header {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 0 8px 12px;
}

.scroll-bottom-spacer {
  height: 48px;
}

/* 详情弹层 */
.detail-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  z-index: 1000;
}

.detail-card {
  width: 100%;
  max-width: 330px;
  background: #FFFFFF;
  border-radius: 22px;
  padding: 22px 20px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.detail-title {
  font-size: 17px;
  font-weight: 600;
  color: #111111;
}

.detail-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #F4F5F7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.detail-content {
  font-size: 14px;
  line-height: 1.6;
  color: #3A3A3C;
  max-height: 280px;
  overflow-y: auto;
}

.detail-pop-enter-active,
.detail-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.25);
}

.detail-pop-enter-from,
.detail-pop-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
