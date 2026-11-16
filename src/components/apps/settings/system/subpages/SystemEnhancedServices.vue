<script setup>
/**
 * 增强服务 · 真机实测版（com.transsion.atomiccore）
 * ====================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_enhanced.xml
 * 包含传音 AtomicCore 5 项核心系统能力：
 *   1. 智慧感知服务（场景智能/智慧建议/应用推荐）
 *   2. 智慧文本服务（灵动岛文本解析与意图识别）
 *   3. AI 场景增强服务（场景智能提醒与调度）
 *   4. 推荐增强服务（个性化推荐）
 *   5. 个人知识库服务（本地设备行为建模）
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])

const smartPerception = ref(true)
const smartText = ref(true)
const aiScene = ref(true)
const smartRecommend = ref(true)
const tipMsg = ref('')

function showTip(msg) {
  tipMsg.value = msg
  setTimeout(() => { tipMsg.value = '' }, 2000)
}
</script>

<template>
  <SubPageShell title="增强服务" @back="emit('back')">
    <div class="enhanced-container">
      <div class="settings-card">
        <ListCell
          title="智慧感知服务"
          subtitle="提供感知、识别能力的底层系统能力，支持场景智能、智慧建议和应用推荐等功能。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="smartPerception"
              @update:model-value="smartPerception = $event"
            />
          </template>
        </ListCell>

        <ListCell
          title="智慧文本服务"
          subtitle="为灵动岛提供智慧文本服务（例如翻译、导航、事件创建与智能快拨）。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="smartText"
              @update:model-value="smartText = $event"
            />
          </template>
        </ListCell>

        <ListCell
          title="AI 场景增强服务"
          subtitle="为特定场景提供智能提醒与系统优化服务。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="aiScene"
              @update:model-value="aiScene = $event"
            />
          </template>
        </ListCell>

        <ListCell
          title="推荐增强服务"
          subtitle="基于设备特征与使用行为建模，提供个性化卡片与应用推荐。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="smartRecommend"
              @update:model-value="smartRecommend = $event"
            />
          </template>
        </ListCell>

        <ListCell
          title="个人知识库服务"
          subtitle="在本地记录行为偏好并安全共享至授权应用。"
          last
          chevron
          @click="showTip('个人知识库设置')"
        />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.enhanced-container {
  padding: 12px 0 32px;
}
</style>
