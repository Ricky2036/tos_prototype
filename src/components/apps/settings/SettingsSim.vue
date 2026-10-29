<script setup>
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

const emit = defineEmits(['back'])

const network = useNetworkStore()

// 提示反馈
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

// 二级页面视图切换：SIM 1 (中国电信) 详情
const activeSubView = ref('main') // 'main' | 'sim1Detail' | 'trafficManage'

// 实体卡 1 字段
const sim1 = network.simCards[0]

// 首选网络类型弹窗
const showNetworkTypeModal = ref(false)
const networkTypes = ['2G/3G/4G/5G 自动选择', '2G/3G/4G 自动选择', '仅 3G/2G', '仅 2G']

function selectNetworkType(t) {
  sim1.networkType = t
  showNetworkTypeModal.value = false
  showToast(`首选网络已设为：${t}`)
}

// 流量管理弹窗
const showTrafficModal = ref(false)

function toggleDataCard() {
  showToast('当前仅插入一张实体 SIM 卡（中国电信）')
}

function toggleCallCard() {
  showToast('当前仅插入一张实体 SIM 卡（中国电信）')
}

function back() {
  if (showNetworkTypeModal.value) {
    showNetworkTypeModal.value = false
    return true
  }
  if (showTrafficModal.value) {
    showTrafficModal.value = false
    return true
  }
  if (activeSubView.value !== 'main') {
    activeSubView.value = 'main'
    return true
  }
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-sim-page">
    <!-- 1. SIM 1 详情二级页 -->
    <template v-if="activeSubView === 'sim1Detail'">
      <div class="sim-nav-bar">
        <button class="nav-round-btn" aria-label="返回" data-nav-back @click="activeSubView = 'main'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="nav-title">{{ sim1.name }}</div>
      </div>

      <div class="sim-scroll-body scrollable">
        <div class="settings-card">
          <ListCell title="启用卡1">
            <template #right>
              <ToggleSwitch v-model="sim1.enabled" @change="showToast(sim1.enabled ? '已启用 SIM 卡 1' : '已停用 SIM 卡 1')" />
            </template>
          </ListCell>
          <ListCell
            title="SIM卡名称"
            :value="sim1.name"
            chevron
            last
            clickable
            @click="showToast(`SIM 卡 1：${sim1.name}`)"
          />
        </div>

        <div class="group-label">网络设置</div>
        <div class="settings-card">
          <ListCell
            title="首选网络类型"
            :value="sim1.networkType"
            chevron
            clickable
            @click="showNetworkTypeModal = true"
          />
          <ListCell
            title="选择网络"
            :value="sim1.selectNetwork"
            chevron
            clickable
            @click="showToast('已自动注册中国电信 5G 独立组网 (SA)')"
          />
          <ListCell
            title="接入点名称"
            value="ctnet"
            chevron
            clickable
            @click="showToast('接入点名称 (APN)：ctnet / 默认 / 已激活')"
          />
          <ListCell
            title="移动数据用量"
            :subtitle="`${sim1.period}期间已使用 ${sim1.dataUsage}`"
            chevron
            clickable
            @click="showTrafficModal = true"
          />
          <ListCell
            title="漫游"
            subtitle="漫游时连接到移动数据网络服务"
            last
          >
            <template #right>
              <ToggleSwitch v-model="sim1.roaming" @change="showToast(sim1.roaming ? '已开启数据漫游' : '已关闭数据漫游')" />
            </template>
          </ListCell>
        </div>

        <div class="group-label">通话设置</div>
        <div class="settings-card">
          <ListCell
            title="VoLTE"
            subtitle="使用 LTE 服务提升语音通话质量（推荐）"
          >
            <template #right>
              <ToggleSwitch v-model="sim1.volte" @change="showToast(sim1.volte ? '已启用高清语音 VoLTE' : '已停用 VoLTE')" />
            </template>
          </ListCell>
          <ListCell
            title="运营商视频通话"
            last
          >
            <template #right>
              <ToggleSwitch v-model="sim1.videoCalling" @change="showToast(sim1.videoCalling ? '已启用运营商高清视频通话' : '已停用视频通话')" />
            </template>
          </ListCell>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </template>

    <!-- 2. SIM 卡与网络设置主页 -->
    <template v-else>
      <div class="sim-nav-bar">
        <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="nav-title">SIM 卡与网络设置</div>
      </div>

      <div class="sim-scroll-body scrollable">
        <!-- 头部特性大卡片 -->
        <div class="sim-feature-card">
          <div class="sim-feature-icon-wrap">
            <SettingsSystemIcon name="sim" :size="32" />
          </div>
          <div class="sim-feature-title">SIM 卡与网络设置</div>
          <div class="sim-feature-desc">了解数据用量，设定数据限制，并管理运营商设置。</div>
        </div>

        <!-- 分组 1: SIM 卡 -->
        <div class="group-label">SIM 卡</div>
        <div class="settings-card">
          <ListCell
            title="中国电信"
            value="+86 181 3884 8993"
            chevron
            clickable
            @click="activeSubView = 'sim1Detail'"
          />
          <ListCell
            title="SIM 卡 2"
            value="无 SIM 卡"
            chevron
            last
            clickable
            @click="showToast('SIM 卡槽 2 未检测到 SIM 卡')"
          />
        </div>

        <!-- 分组 2: 启用 eSIM -->
        <div class="group-label">启用eSIM</div>
        <div class="settings-card">
          <ListCell
            title="启用eSIM"
            subtitle="开启 eSIM 后，实体 SIM 卡 2 将暂不可用。"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="network.esimEnabled"
                @update:model-value="v => network.setEsim(v)"
                @change="showToast(network.esimEnabled ? '正在搜索可用 eSIM 配置文件' : '已停用 eSIM')"
              />
            </template>
          </ListCell>
        </div>

        <!-- 卡槽选择（上网卡与拨号卡） -->
        <div class="settings-card">
          <ListCell
            title="上网卡"
            clickable
            @click="toggleDataCard"
          >
            <template #right>
              <div class="selector-value-wrap">
                <span class="selector-value-text">{{ network.defaultDataCard }}</span>
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <path d="M3 5l3-3 3 3M3 9l3 3 3-3" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </template>
          </ListCell>
          <ListCell
            title="拨号卡"
            last
            clickable
            @click="toggleCallCard"
          >
            <template #right>
              <div class="selector-value-wrap">
                <span class="selector-value-text">{{ network.defaultCallCard }}</span>
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <path d="M3 5l3-3 3 3M3 9l3 3 3-3" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </template>
          </ListCell>
        </div>

        <!-- 数据与 5G 常用开关 -->
        <div class="settings-card">
          <ListCell
            title="移动数据"
            subtitle="通过移动网络访问数据。"
          >
            <template #right>
              <ToggleSwitch
                :model-value="network.mobileData"
                @update:model-value="v => network.setMobileData(v)"
                @change="showToast(network.mobileData ? '已开启移动网络数据' : '已关闭移动数据')"
              />
            </template>
          </ListCell>
          <ListCell
            title="5G 网络"
            subtitle="允许默认上网卡使用 5G 网络。"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="network.network5g"
                @update:model-value="v => network.setNetwork5g(v)"
                @change="showToast(network.network5g ? '已启用 5G 双模极速网络' : '已切换为 4G/3G 节能网络')"
              />
            </template>
          </ListCell>
        </div>

        <!-- 通讯辅助与网络管理 -->
        <div class="settings-card">
          <ListCell
            title="无网通讯"
            chevron
            clickable
            @click="showToast('无网通讯：支持短距离自组网与应急直连')"
          />
          <ListCell
            title="流量管理"
            chevron
            clickable
            @click="showTrafficModal = true"
          />
          <ListCell
            title="网络优化"
            chevron
            clickable
            @click="showToast('双通道加速已开启，智能无感切网已就绪')"
          />
          <ListCell
            title="国际上网"
            subtitle="无需实体 SIM 卡，购买国际流量套餐即可境外上网。"
            chevron
            clickable
            @click="showToast('国际上网漫游商城')"
          />
          <ListCell
            title="更多设置"
            chevron
            last
            clickable
            @click="showToast('APN 与网络运营商手动选择')"
          />
        </div>

        <!-- 底部卡片：你可能想找 -->
        <div class="settings-card help-search-card">
          <div class="help-search-title">你可能想找</div>
          <div class="help-links-list">
            <div class="help-link-item" @click="showToast('跳转通话设置')">通话设置</div>
            <div class="help-link-item" @click="showToast('跳转短信设置')">短信设置</div>
          </div>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </template>

    <!-- 首选网络选择弹窗 -->
    <div v-if="showNetworkTypeModal" class="modal-backdrop" @click.self="showNetworkTypeModal = false">
      <div class="modal-sheet">
        <div class="sheet-title">首选网络类型</div>
        <div class="options-list">
          <div
            v-for="t in networkTypes"
            :key="t"
            class="option-item"
            :class="{ active: sim1.networkType === t }"
            @click="selectNetworkType(t)"
          >
            <span class="option-name">{{ t }}</span>
            <svg v-if="sim1.networkType === t" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <button class="sheet-cancel-btn" @click="showNetworkTypeModal = false">取消</button>
      </div>
    </div>

    <!-- 流量管理弹窗 -->
    <div v-if="showTrafficModal" class="modal-backdrop" @click.self="showTrafficModal = false">
      <div class="modal-sheet">
        <div class="sheet-title">流量管理</div>
        <div class="traffic-overview-box">
          <div class="traffic-circle">
            <span class="traffic-num">14.28</span>
            <span class="traffic-unit">GB</span>
          </div>
          <div class="traffic-desc">本计费周期已用流量（剩余 35.72 GB）</div>
        </div>
        <button class="sheet-cancel-btn" @click="showTrafficModal = false">关闭</button>
      </div>
    </div>

    <!-- 轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-sim-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.sim-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F4F5F7;
  flex-shrink: 0;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1A1A1A;
  transition: background 0.15s;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.08);
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.2px;
}

.sim-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.sim-scroll-body::-webkit-scrollbar {
  display: none;
}

.sim-feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 12px;
}

.sim-feature-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #34C759;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.22);
}

.sim-feature-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}

.sim-feature-desc {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.45;
  max-width: 290px;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  padding-left: 8px;
  margin-top: 4px;
}

.selector-value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.selector-value-text {
  font-size: 14px;
  color: #8E8E93;
}

.help-search-card {
  padding: 16px;
}

.help-search-title {
  font-size: 14px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 12px;
}

.help-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-link-item {
  font-size: 15px;
  color: #007AFF;
  cursor: pointer;
  padding: 6px 0;
}

.bottom-spacer {
  height: 24px;
}

/* 弹窗样式 */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.modal-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px 24px 0 0;
  padding: 20px 16px 36px;
  box-sizing: border-box;
  animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 16px;
}

.options-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.option-item:active {
  background: #F4F5F7;
}

.option-name {
  font-size: 15px;
  color: #111;
}

.option-item.active .option-name {
  color: #007AFF;
  font-weight: 600;
}

.sheet-cancel-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: #F4F5F7;
  color: #111;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.traffic-overview-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
}

.traffic-circle {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 10px;
}

.traffic-num {
  font-size: 44px;
  font-weight: 800;
  color: #007AFF;
  letter-spacing: -1px;
}

.traffic-unit {
  font-size: 18px;
  font-weight: 600;
  color: #8E8E93;
}

.traffic-desc {
  font-size: 13px;
  color: #8E8E93;
}

.settings-toast {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  backdrop-filter: blur(12px);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
