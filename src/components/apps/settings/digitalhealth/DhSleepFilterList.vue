<script setup>
import { computed } from 'vue'
import DhShell from './DhShell.vue'
import DhCheck from './DhCheck.vue'
import LIcon from '../../../ui/LIcon.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'
import { DH_CONTACTS } from './dhData.js'

/**
 * 睡眠模式的「通知过滤条件」二级页（真机：允许所有通知 / 联系人 → 某些人例外 / 应用）。
 *
 * 一个组件两副面孔：
 *   kind="apps"     → 全部注册应用 + 方形复选（选中 = 例外放行）
 *   kind="contacts" → 收藏联系人 + 方形复选
 * ⚠️ 「允许所有通知」开启时两条清单都不生效，真机里也是灰掉不可点。
 */
const props = defineProps({
  kind: { type: String, default: 'apps' }
})
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const isApps = computed(() => props.kind === 'apps')
const title = computed(() => (isApps.value ? '应用例外' : '联系人例外'))
const apps = getRegisteredApps()
const blocked = computed(() => dh.state.sleep.notify.allowAll)

const selectedCount = computed(() => (isApps.value
  ? dh.state.sleep.notify.appExceptions.length
  : dh.state.sleep.notify.contactExceptions.length))

function toggle(item) {
  const ok = isApps.value ? dh.toggleSleepApp(item.id) : dh.toggleSleepContact(item.name)
  if (!ok) emit('toast', '已开启「允许所有通知」，先关掉它才能设置例外')
}
</script>

<template>
  <DhShell :title="title" @back="emit('back')">
    <p class="dh-note">
      {{ isApps ? '勾选的应用在睡眠模式期间仍会发出提醒。' : '勾选的联系人来电时仍会响铃。' }}{{
        blocked ? '当前已开启「允许所有通知」，所有通知都会被放行。' : `已选择 ${selectedCount} 项。`
      }}
    </p>

    <div class="dh-card" :class="{ 'is-off': blocked }" :data-dh-filter-list="kind">
      <template v-if="isApps">
        <div v-for="app in apps" :key="app.id" class="dh-row dh-frow" :data-dh-filter-app="app.id">
          <RegisteredAppIcon :app="app" :size="30" />
          <span class="dh-row-main"><span class="dh-row-title">{{ app.name }}</span></span>
          <DhCheck
            :checked="dh.state.sleep.notify.appExceptions.includes(app.id)"
            :disabled="blocked"
            @toggle="toggle(app)"
          />
        </div>
      </template>
      <template v-else>
        <div v-for="c in DH_CONTACTS" :key="c.id" class="dh-row dh-frow" :data-dh-filter-contact="c.id">
          <span class="dh-avatar"><LIcon name="users" :size="17" /></span>
          <span class="dh-row-main"><span class="dh-row-title">{{ c.name }}</span></span>
          <DhCheck
            :checked="dh.state.sleep.notify.contactExceptions.includes(c.name)"
            :disabled="blocked"
            @toggle="toggle(c)"
          />
        </div>
      </template>
    </div>
  </DhShell>
</template>

<style scoped>
.dh-frow { padding: 10px 16px; gap: 16px; }
.dh-card.is-off { opacity: 0.55; }

.dh-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #E8EAED;
  color: #5F6368;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
</style>
