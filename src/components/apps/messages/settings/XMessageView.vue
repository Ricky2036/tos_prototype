<script setup>
import { computed, ref } from 'vue'
import { useMessagesStore } from '../../../../stores/messagesStore'
import { useI18nStore } from '../../../../stores/i18nStore'
import { msgText } from '../msgData'
import MsgTopBar from '../components/MsgTopBar.vue'
import MsgSwitch from '../components/MsgSwitch.vue'
import MsgPopupMenu from '../components/MsgPopupMenu.vue'

/**
 * XMessage 服务页（真机 NetworkInfoActivity）
 * 上部是插画 + 三行说明 + 分页圆点，下部是总开关与 SIM 卡（已验证）卡片。
 * 右上 ⋮ 只有两项：隐私政策 / 用户协议（真机会打开网页，原型仅提示外部入口）。
 */
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back', 'external'])

const menuOpen = ref(false)
const menu = ref({ x: 0, y: 0 })

const menuItems = computed(() => [
  { id: 'privacy', label: t.value('privacyPolicy') },
  { id: 'agreement', label: t.value('userAgreement') }
])

function openMenu(e) {
  const host = e.currentTarget.getBoundingClientRect()
  const page = e.currentTarget.closest('.msg-app-root')?.getBoundingClientRect()
  if (!page) return
  const scale = page.width / 360 || 1
  menu.value = { x: 180, y: (host.bottom - page.top) / scale + 6 }
  menuOpen.value = true
}
</script>

<template>
  <div class="msg-sub-page" data-msg-page="xmessage">
    <MsgTopBar :title="t('xmessage')" @back="emit('back')">
      <template #right>
        <button class="more-btn" type="button" data-msg-xm-overflow @click="openMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E1E20">
            <circle cx="12" cy="5" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="12" cy="19" r="1.7" />
          </svg>
        </button>
      </template>
    </MsgTopBar>

    <div class="sub-scroll scrollable">
      <div class="hero" data-msg-xm-hero>
        <svg width="196" height="160" viewBox="0 0 196 160" fill="none">
          <!-- 手机轮廓 -->
          <rect x="52" y="8" width="104" height="146" rx="16" stroke="#BFBFC1" stroke-width="1.2" />
          <rect x="60" y="20" width="88" height="14" rx="7" fill="#EFEFF1" />
          <circle cx="66" cy="27" r="3" fill="#C9C9CB" />
          <circle cx="160" cy="27" r="2" fill="#C9C9CB" />
          <!-- 灰气泡 -->
          <rect x="70" y="44" width="66" height="14" rx="7" fill="#EAEAEC" />
          <rect x="70" y="64" width="52" height="14" rx="7" fill="#EAEAEC" />
          <rect x="70" y="86" width="62" height="14" rx="7" fill="#EAEAEC" />
          <rect x="70" y="112" width="44" height="14" rx="7" fill="#EAEAEC" />
          <!-- 白色卡片 -->
          <rect x="6" y="70" width="84" height="52" rx="10" fill="#fff" />
          <circle cx="20" cy="84" r="6" fill="#3E7BF6" />
          <path d="M17.4 84.2l1.9 1.9 3.2-3.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="32" y="80" width="46" height="2.6" rx="1.3" fill="#E4E4E6" />
          <rect x="16" y="96" width="62" height="2.6" rx="1.3" fill="#E4E4E6" />
          <rect x="16" y="104" width="52" height="2.6" rx="1.3" fill="#E4E4E6" />
          <circle cx="76" cy="110" r="9" fill="#7BC98A" />
          <path d="M76 115.4V104.8M76 104.8l-3.6 3.6M76 104.8l3.6 3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <!-- 蓝色箭头 -->
          <path d="M34 62c14-14 30-16 44-10" stroke="#3E7BF6" stroke-width="1.4" stroke-dasharray="3 3" stroke-linecap="round" />
          <path d="M74 48l6 3.4-6.6 2.4z" fill="#3E7BF6" />
        </svg>
      </div>

      <p class="hero-desc">{{ t('xmessageDesc') }}</p>
      <div class="dots">
        <span class="dot on" />
        <span class="dot" />
        <span class="dot" />
      </div>

      <div class="card standalone">
        <div class="row">
          <span class="title">{{ t('xmessage') }}</span>
          <MsgSwitch
            :model-value="!!store.settings.xmessageOn"
            :aria-label="t('xmessage')"
            @update:model-value="store.setSetting('xmessageOn', $event)"
          />
        </div>
      </div>

      <div class="group-title">{{ t('simCardSettings') }}</div>
      <div class="card">
        <div class="row sim-row" data-msg-xm-sim>
          <span class="sim-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.5" stroke-linejoin="round">
              <path d="M6.2 3.4h7.6l4.2 4.2v13c0 .5-.4.9-.9.9H6.2c-.5 0-.9-.4-.9-.9V4.3c0-.5.4-.9.9-.9z" />
              <rect x="8.4" y="10" width="6.6" height="5.4" rx="1.1" />
            </svg>
          </span>
          <div class="texts">
            <div class="title">{{ t('simSmsSub') }}</div>
            <div class="value">+8613200007890</div>
          </div>
          <span class="verified">{{ t('verified') }}</span>
        </div>
      </div>
      <div class="tail" />
    </div>

    <MsgPopupMenu
      v-if="menuOpen"
      :items="menuItems"
      :x="menu.x"
      :y="menu.y"
      :width="164"
      @select="(id) => { menuOpen = false; emit('external', id) }"
      @close="menuOpen = false"
    />
  </div>
</template>

<style scoped>
.msg-sub-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.more-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.sub-scroll { flex: 1; overflow-y: auto; }
.hero {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
}
.hero-desc {
  margin: 6px 40px 0;
  font-size: 14px;
  line-height: 20px;
  color: #3d3d3f;
  text-align: center;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 12px 0 18px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cfcfd1;
}
.dot.on { background: #4a4a4c; }
.card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  margin: 0 16px;
}
.card.standalone { margin-bottom: 18px; }
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  min-height: 60px;
  box-sizing: border-box;
}
.title { font-size: 16px; line-height: 22px; color: #000; }
.sim-row .texts { flex: 1; min-width: 0; }
.value { font-size: 13px; line-height: 18px; color: #8a8a8c; margin-top: 2px; }
.verified { font-size: 14px; color: #a0a0a2; }
.group-title {
  padding: 12px 22px 8px;
  font-size: 15px;
  line-height: 20px;
  color: #545559;
}
.sim-icon { flex: none; display: flex; }
.tail { height: 24px; }
</style>
