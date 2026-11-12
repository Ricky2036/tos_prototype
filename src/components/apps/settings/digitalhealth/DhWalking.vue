<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * 看路提醒（真机 dh_65_headsup 引导页 + dh_90_walking_next 权限页，WalkingDetectionSettingsActivity）。
 *
 * 真机结构：
 *   ① 顶部粉底警告条：该功能 2027 年停止服务
 *   ② 居中：蓝色步行小人 → 大标题「"看路提醒"会提醒您留意脚下」→ 两段说明
 *   ③ 插画（边走边看手机的人 + 橙色箭头提示气泡）
 *   ④ 右下角浅蓝胶囊「继续」→ 权限页（身体活动 / 通知 / 位置信息（可选））
 */
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const step = ref('intro')
const w = computed(() => dh.state.walking)

const PERMS = [
  { key: 'activity', title: '身体活动', sub: '用于判断您是否正在走路', optional: false },
  { key: 'notify', title: '通知', sub: '用于在您走路时发出提醒', optional: false },
  { key: 'location', title: '位置信息', sub: '仅用于提高判断准确性', optional: true }
]

function next() {
  step.value = 'perm'
}

function grant(key) {
  dh.grantWalking(key)
  if (dh.state.walking.activity && dh.state.walking.notify && dh.state.walking.location) {
    dh.setWalkingEnabled(true)
    step.value = 'done'
    emit('toast', '看路提醒已开启')
  }
}
</script>

<template>
  <DhShell title="看路提醒" @back="emit('back')">
    <!-- ① 停止服务警告 -->
    <section class="dh-warn" data-dh-walking-warn>
      <span class="dh-warn-icon">
        <LIcon name="circleAlert" :size="17" :stroke-width="2.4" />
      </span>
      <p class="dh-warn-text">
        “看路提醒”功能将于 2027 年停止服务。请探索我们的其他数字健康工具，了解它们如何帮助您专注于当下，实现手机使用与日常生活的健康平衡。
      </p>
    </section>

    <!-- ② 引导 -->
    <template v-if="step === 'intro'">
      <div class="dh-walk-hero">
        <LIcon name="footprints" :size="26" :stroke-width="1.9" />
      </div>

      <h2 class="dh-walk-title">“看路提醒”会提醒您留意脚下</h2>
      <p class="dh-note-center">如果您边走边使用设备，系统就会提醒您留意周围环境。</p>
      <p class="dh-note-center">使用时要多加注意。即使开启了看路提醒功能，走路时也要留意四周。</p>

      <!-- ③ 插画：边走边看手机的人 + 橙色箭头气泡 -->
      <div class="dh-walk-art">
        <svg width="200" height="216" viewBox="0 0 200 216" fill="none" aria-hidden="true">
          <ellipse cx="100" cy="206" rx="52" ry="7" fill="#E4E6EA" />
          <!-- 橙色提示气泡 -->
          <circle cx="140" cy="52" r="25" fill="#FBE0C8" />
          <path d="M140 40l9 11h-18z" fill="#E8710A" />
          <path d="M140 60v-8" stroke="#E8710A" stroke-width="3.4" stroke-linecap="round" />
          <path d="M116 70l-8 6" stroke="#FBE0C8" stroke-width="5" stroke-linecap="round" />
          <!-- 裙摆 -->
          <path d="M74 116c-8 22-16 52-18 76h56c-6-26-14-56-20-76z" fill="#8FA9C9" />
          <path d="M78 192h34v8H76z" fill="#5F6368" />
          <!-- 上衣 -->
          <path d="M70 78c0-8 7-14 16-14s16 6 16 14v42H70z" fill="#B08968" />
          <!-- 手臂 + 手机 -->
          <path d="M86 96l-16 18" stroke="#B08968" stroke-width="7" stroke-linecap="round" />
          <rect x="52" y="104" width="16" height="24" rx="3" fill="#3C4043" />
          <!-- 脖子 + 头 -->
          <rect x="82" y="58" width="8" height="10" fill="#946A4C" />
          <circle cx="86" cy="48" r="13" fill="#946A4C" />
          <path d="M73 46c0-9 6-15 13-15s13 6 13 15c0 3-2 4-4 3-3-2-5-4-9-4s-6 2-9 4c-2 1-4 0-4-3z" fill="#2B2420" />
          <!-- 另一个胳膊 -->
          <path d="M100 92l14 14" stroke="#B08968" stroke-width="7" stroke-linecap="round" />
        </svg>
      </div>
    </template>

    <!-- ④ 权限页 -->
    <template v-else-if="step === 'perm'">
      <div class="dh-label">需要以下权限</div>
      <div class="dh-card" data-dh-walking-perms>
        <div v-for="(p, i) in PERMS" :key="p.key">
          <div class="dh-row">
            <span class="dh-row-main">
              <span class="dh-row-title">{{ p.title }}<template v-if="p.optional">（可选）</template></span>
              <span class="dh-row-sub">{{ p.sub }}</span>
            </span>
            <button
              v-if="!w[p.key]"
              type="button"
              class="dh-pill is-soft dh-perm-btn"
              :data-dh-perm="p.key"
              @click="grant(p.key)"
            >允许</button>
            <span v-else class="dh-perm-ok" :data-dh-perm-ok="p.key">已允许</span>
          </div>
          <div v-if="i < PERMS.length - 1" class="dh-divider"></div>
        </div>
      </div>
      <p class="dh-note">开启后，当系统检测到您一边走路一边看屏幕时，会弹出一次轻提示。</p>
    </template>

    <!-- 已开启 -->
    <div v-else class="dh-walk-done" data-dh-walking-done>
      <span class="dh-done-icon"><LIcon name="circleCheck" :size="42" :stroke-width="1.8" /></span>
      <strong class="dh-walk-done-title">看路提醒已开启</strong>
      <span class="dh-walk-done-sub">走动时看屏幕，会收到一次轻提示</span>
    </div>

    <template #bottom>
      <div v-if="step === 'intro'" class="dh-walk-action">
        <button type="button" class="dh-pill is-soft" data-dh-walking-next @click="next">继续</button>
      </div>
    </template>
  </DhShell>
</template>

<style scoped>
.dh-warn {
  display: flex;
  gap: 14px;
  background: #FBE4E4;
  border-radius: 14px 14px 16px 16px;
  padding: 14px 16px;
  margin-bottom: 8px;
}

.dh-warn-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #3C2828;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-top: 1px;
}

.dh-warn-text {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: #8C4A46;
}

.dh-walk-hero { display: flex; justify-content: center; padding: 22px 0 10px; }

.dh-walk-title {
  margin: 0;
  padding: 0 8px 12px;
  font-size: 21px;
  font-weight: 500;
  line-height: 28px;
  color: #1F1F1F;
  text-align: center;
}

.dh-walk-art { display: flex; justify-content: center; padding: 14px 0 8px; }

.dh-walk-action {
  position: absolute;
  right: 20px;
  bottom: 26px;
  z-index: 6;
}

.dh-perm-btn { height: 32px; padding: 0 16px; font-size: 13px; }

.dh-perm-ok { font-size: 13px; color: #5F6368; flex: none; }

.dh-walk-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 44px 0 12px;
}

.dh-done-icon { color: #1E8E3E; display: flex; }

.dh-walk-done-title { font-size: 18px; font-weight: 600; color: #1F1F1F; }
.dh-walk-done-sub { font-size: 13px; color: #5F6368; }
</style>
