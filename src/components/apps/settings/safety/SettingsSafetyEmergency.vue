<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useSafetyStore } from '../../../../stores/safetyStore'

const emit = defineEmits(['back'])
const safety = useSafetyStore()

// 弹层控制
const showMedicalModal = ref(false)
const showContactsModal = ref(false)
const showSosModal = ref(false)
const showPersonalSafetyToast = ref(false)

function handleBack() {
  emit('back')
}

function handleOpenPersonalSafety() {
  showPersonalSafetyToast.value = true
  setTimeout(() => {
    showPersonalSafetyToast.value = false
  }, 2000)
}
</script>

<template>
  <div class="safety-emergency-page">
    <GlassNavBar title="安全和紧急情况" overlay @back="handleBack" />

    <div class="scrollable safety-body">
      <!-- 顶部主操作条：打开个人安全 -->
      <div class="settings-card action-card" @click="handleOpenPersonalSafety">
        <div class="personal-safety-row">
          <div class="personal-safety-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="personal-safety-text">
            <div class="personal-safety-title">打开个人安全</div>
            <div class="personal-safety-sub">快速查看安全检查与紧急共享状态</div>
          </div>
          <div class="personal-safety-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 分组 1: 紧急联络 -->
      <div class="group-header">紧急联络</div>
      <div class="settings-card">
        <ListCell
          data-safety-row="medical"
          title="医疗信息"
          subtitle="姓名、血型及其他信息"
          chevron
          clickable
          @click="showMedicalModal = true"
        />
        <ListCell
          data-safety-row="contacts"
          title="紧急联系人"
          :subtitle="safety.emergencyContacts.length ? `${safety.emergencyContacts.length} 位联系人` : '添加紧急联系人'"
          chevron
          last
          clickable
          @click="showContactsModal = true"
        />
      </div>

      <!-- 分组 2: 紧急求救 -->
      <div class="group-header">紧急求救</div>
      <div class="settings-card">
        <ListCell
          data-safety-row="sos"
          title="紧急求救（SOS）"
          subtitle="快速连按 5 次电源键启动"
          chevron
          last
          clickable
          @click="showSosModal = true"
        />
      </div>

      <!-- 分组 3: 无线紧急警报 -->
      <div class="group-header">无线紧急警报</div>
      <div class="settings-card">
        <ListCell
          data-safety-row="earthquake"
          title="地震警报"
          :value="safety.earthquakeAlert ? '已开启' : '已关闭'"
          clickable
          @click="safety.toggleEarthquakeAlert"
        />
        <ListCell
          data-safety-row="disaster"
          title="灾害警报"
          chevron
          clickable
          @click="safety.toggleDisasterAlert"
        />
        <ListCell
          data-safety-row="silenceDriving"
          title="驾车时将通知设为静音"
          :value="safety.silenceWhileDriving ? '已开启' : '已关闭'"
          last
          clickable
          @click="safety.toggleSilenceWhileDriving"
        />
      </div>

      <!-- 分组 4: 更多服务 -->
      <div class="group-header">更多安全服务</div>
      <div class="settings-card">
        <ListCell
          data-safety-row="location"
          title="紧急位置信息服务"
          :value="safety.emergencyLocationService ? '已开启' : '已关闭'"
          clickable
          @click="safety.toggleEmergencyLocationService"
        />
        <ListCell
          data-safety-row="tracker"
          title="不明追踪器提醒"
          chevron
          last
          clickable
          @click="safety.toggleUnknownTrackerAlert"
        />
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>

    <!-- 医疗信息弹层 -->
    <div v-if="showMedicalModal" class="modal-backdrop" @click="showMedicalModal = false">
      <div class="modal-sheet" @click.stop>
        <div class="modal-header">
          <div class="modal-title">医疗信息</div>
          <button class="modal-close" @click="showMedicalModal = false">完成</button>
        </div>
        <div class="modal-content">
          <div class="info-row"><span class="info-label">姓名</span><span class="info-val">{{ safety.medicalInfo.name }}</span></div>
          <div class="info-row"><span class="info-label">血型</span><span class="info-val">{{ safety.medicalInfo.bloodType }}</span></div>
          <div class="info-row"><span class="info-label">过敏史</span><span class="info-val">{{ safety.medicalInfo.allergies }}</span></div>
          <div class="info-row"><span class="info-label">器官捐献</span><span class="info-val">{{ safety.medicalInfo.organDonor ? '已同意' : '未登记' }}</span></div>
        </div>
      </div>
    </div>

    <!-- 紧急联系人弹层 -->
    <div v-if="showContactsModal" class="modal-backdrop" @click="showContactsModal = false">
      <div class="modal-sheet" @click.stop>
        <div class="modal-header">
          <div class="modal-title">紧急联系人</div>
          <button class="modal-close" @click="showContactsModal = false">完成</button>
        </div>
        <div class="modal-content">
          <div v-for="c in safety.emergencyContacts" :key="c.id" class="contact-item">
            <div class="contact-name">{{ c.name }}（{{ c.relationship }}）</div>
            <div class="contact-phone">{{ c.phone }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 紧急求救（SOS）模拟说明弹层 · 严禁触发真求救 -->
    <div v-if="showSosModal" class="modal-backdrop" @click="showSosModal = false">
      <div class="modal-sheet" @click.stop>
        <div class="modal-header">
          <div class="modal-title">紧急求救（SOS）模拟说明</div>
          <button class="modal-close" @click="showSosModal = false">知道了</button>
        </div>
        <div class="modal-content">
          <div class="simulation-banner">原型环境 · 仅供功能演示（严禁触发真实呼救）</div>
          <div class="sos-desc">
            <p>1. 快速连按电源键 5 次即可进入倒计时求救状态。</p>
            <p>2. 倒计时期间将伴随高分贝警报声提示。</p>
            <p>3. 倒计时结束后将向所有紧急联系人发送包含当前位置的紧急求救信息。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 轻提示 -->
    <div v-if="showPersonalSafetyToast" class="toast-bubble">
      已打开个人安全中心（演示环境已就绪）
    </div>
  </div>
</template>

<style scoped>
.safety-emergency-page {
  position: absolute;
  inset: 0;
  background-color: #F0F2F3;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.safety-body {
  flex: 1;
  padding: calc(var(--nav-h) + 12px) 16px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 18px;
}

.action-card {
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.action-card:active {
  background-color: #EAEBED;
}

.personal-safety-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.personal-safety-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.personal-safety-text {
  flex: 1;
}

.personal-safety-title {
  font-size: 15px;
  font-weight: 600;
  color: #000000;
}

.personal-safety-sub {
  font-size: 12px;
  color: #595959;
  margin-top: 2px;
}

.group-header {
  font-size: 13px;
  font-weight: 500;
  color: #595959;
  padding: 0 4px 8px;
}

.scroll-bottom-spacer {
  height: 48px;
}

/* 弹层样式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.modal-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 16px 20px 32px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.modal-close {
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #2563EB;
  cursor: pointer;
}

.modal-content {
  font-size: 14px;
  color: #000000;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #E0E0E0;
}

.info-label {
  color: #595959;
}

.info-val {
  font-weight: 500;
}

.contact-item {
  padding: 10px 0;
  border-bottom: 1px solid #E0E0E0;
}

.contact-name {
  font-weight: 500;
}

.contact-phone {
  font-size: 13px;
  color: #595959;
  margin-top: 2px;
}

.simulation-banner {
  padding: 8px 12px;
  background-color: rgba(234, 88, 12, 0.1);
  color: #EA580C;
  border-radius: 8px;
  font-size: 12px;
  margin-bottom: 12px;
  font-weight: 500;
}

.sos-desc p {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #595959;
}

.toast-bubble {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 150;
  white-space: nowrap;
}
</style>
