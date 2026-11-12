<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhSwitch from './DhSwitch.vue'
import DhDialog from './DhDialog.vue'
import LIcon from '../../../ui/LIcon.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * ⋮ 菜单落地的真实页面（真机 dh_80_overflow 这五条在真机上分别跳
 * 反馈表单 / 数据管理 / 三份法律文档，**不是** 一句提示）。
 *
 * 一个组件按 `page` 分发：
 *   feedback → 反馈表单（文本域 + 附加诊断信息开关 + 发送）
 *   data     → 管理数据（导出 / 删除 / 已收集的数据类型）
 *   privacy / terms / licenses → 长文档页
 */
const props = defineProps({
  page: { type: String, required: true }
})
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const PAGES = {
  feedback: { title: '发送反馈', kind: 'form' },
  data: { title: '管理数据', kind: 'data' },
  privacy: { title: '隐私权政策', kind: 'doc', updated: '2026年8月1日' },
  terms: { title: '服务条款', kind: 'doc', updated: '2026年8月1日' },
  licenses: { title: '开源许可', kind: 'doc', updated: '2026年8月1日' }
}

const meta = computed(() => PAGES[props.page] || PAGES.privacy)

/* ---------- 文档正文 ---------- */
const DOCS = {
  privacy: [
    ['我们收集的信息', '数字健康会记录设备上的应用使用时长、解锁次数与通知条数。这些统计只保存在本机，用于生成使用报告与提醒，不会上传到服务器。'],
    ['信息的使用方式', '使用数据用于计算每日与每周报告、判断是否触发屏幕使用时间提醒，以及在您设置应用定时器后按时结束应用。'],
    ['信息的共享', '我们不会向第三方出售或共享您的使用数据。只有在您主动导出时，数据才会按您选择的位置保存。'],
    ['数据保留与删除', '使用记录默认保留 13 个月。您可以在「管理数据」中随时清除全部记录，清除后不可恢复。'],
    ['权限说明', '「使用情况访问」用于读取应用使用时长；「身体活动」用于判断您是否正在走路；「通知」用于在您看路时发出提醒。']
  ],
  terms: [
    ['服务范围', '数字健康提供使用统计、应用定时器、睡眠模式、专注模式与看路提醒等功能，帮助您管理设备使用时间。'],
    ['使用限制', '本功能依赖系统权限与设备使用情况数据。关闭相关权限后，部分统计与提醒将无法生效。'],
    ['提醒的定位', '看路提醒只是一次轻提示，不能替代您对周围环境的观察。走路时请始终留意路面情况。'],
    ['功能调整', '看路提醒功能将于 2027 年停止服务，届时相关入口与历史设置将被移除。'],
    ['免责声明', '统计结果由系统采样推算，可能与实际使用情况存在偏差，仅供参考。']
  ],
  licenses: [
    ['开源组件', '本功能使用了若干开源组件，包括图标集 Lucide（ISC 许可）与 Material 组件规范相关实现（Apache 2.0 许可）。'],
    ['Lucide', 'Copyright (c) Lucide Contributors。基于 ISC 许可发布，允许在保留版权声明的前提下自由使用、修改与分发。'],
    ['Material Design', 'Copyright (c) Google LLC。基于 Apache License 2.0 发布。'],
    ['字体', '界面使用系统默认无衬线字体，未内嵌第三方字体文件。'],
    ['完整许可文本', '完整的许可原文随系统镜像一同提供，可在系统设置的「关于手机 → 法律信息」中查看。']
  ]
}

/* ---------- 反馈表单 ---------- */
const text = ref('')
const attachLog = ref(true)
const sent = ref(false)
const canSend = computed(() => text.value.trim().length >= 4)

function send() {
  if (!canSend.value) return
  dh.pushFeedback(text.value)
  sent.value = true
  text.value = ''
  emit('toast', '反馈已发送，感谢您的帮助')
}

/* ---------- 管理数据 ---------- */
const confirmDelete = ref(false)
const exported = ref('')

function exportData() {
  const d = dh.state
  exported.value = [
    `应用定时器：${Object.keys(d.limits).length} 个`,
    `专注时间表：${d.focusSchedules.length} 条`,
    `睡眠时间表：${d.sleep.schedule.start}–${d.sleep.schedule.end}`,
    `反馈记录：${d.feedback.length} 条`
  ].join('；')
  emit('toast', '使用数据已导出到本机')
}

function doDelete() {
  dh.reset()
  confirmDelete.value = false
  exported.value = ''
  emit('toast', '已删除全部使用数据')
}
</script>

<template>
  <DhShell :title="meta.title" @back="emit('back')">
    <!-- ============ 反馈表单 ============ -->
    <template v-if="meta.kind === 'form'">
      <p class="dh-note">告诉我们哪里不对、哪里可以更好。反馈会附带当前的系统版本与设备型号，不包含您的使用记录。</p>

      <div class="dh-card dh-form-card">
        <textarea
          v-model="text"
          class="dh-textarea"
          data-dh-feedback-input
          rows="6"
          maxlength="500"
          placeholder="描述您遇到的问题或建议…"
        ></textarea>
        <div class="dh-counter">{{ text.length }}/500</div>
      </div>

      <div class="dh-card">
        <div class="dh-row">
          <span class="dh-row-main">
            <span class="dh-row-title">附加诊断信息</span>
            <span class="dh-row-sub">系统版本、设备型号、日志片段</span>
          </span>
          <DhSwitch :model-value="attachLog" data-dh-feedback-log @update:model-value="attachLog = $event" />
        </div>
      </div>

      <div class="dh-form-actions">
        <button type="button" class="dh-pill" :disabled="!canSend" data-dh-feedback-send @click="send">发送</button>
      </div>
      <p v-if="sent" class="dh-note dh-sent" data-dh-feedback-sent>
        <LIcon name="circleCheck" :size="15" :stroke-width="2" />
        已收到您的反馈
      </p>
    </template>

    <!-- ============ 管理数据 ============ -->
    <template v-else-if="meta.kind === 'data'">
      <p class="dh-note">使用数据只保存在本机。您可以随时导出或删除，删除后不可恢复。</p>

      <div class="dh-card">
        <button type="button" class="dh-row" data-dh-data-export @click="exportData">
          <LIcon name="fileText" :size="20" />
          <span class="dh-row-main">
            <span class="dh-row-title">导出使用数据</span>
            <span class="dh-row-sub">保存为可读文本，方便带走或备份</span>
          </span>
        </button>
        <div class="dh-divider"></div>
        <button type="button" class="dh-row" data-dh-data-delete @click="confirmDelete = true">
          <LIcon name="trash2" :size="20" />
          <span class="dh-row-main">
            <span class="dh-row-title">删除使用数据</span>
            <span class="dh-row-sub">清除全部统计、定时器与时间表</span>
          </span>
        </button>
      </div>

      <div class="dh-label">已收集的数据类型</div>
      <div class="dh-card">
        <div v-for="(t, i) in ['应用使用时长', '解锁次数与通知条数', '应用定时器与专注时间表', '睡眠时间表与通知例外', '您提交的反馈']" :key="t">
          <div class="dh-row dh-plain-row">
            <LIcon name="database" :size="18" />
            <span class="dh-row-main"><span class="dh-row-title">{{ t }}</span></span>
          </div>
          <div v-if="i < 4" class="dh-divider"></div>
        </div>
      </div>

      <p v-if="exported" class="dh-note" data-dh-data-exported>{{ exported }}</p>

      <DhDialog
        :visible="confirmDelete"
        title="删除使用数据？"
        note="删除后，使用统计、应用定时器、专注与睡眠时间表都会清空，且无法恢复。"
        confirm-text="删除"
        @close="confirmDelete = false"
        @confirm="doDelete"
      >
        <div class="dh-del-body" data-dh-data-confirm>此操作不影响系统其他设置。</div>
      </DhDialog>
    </template>

    <!-- ============ 长文档 ============ -->
    <template v-else>
      <p class="dh-doc-meta">最后更新：{{ meta.updated }}</p>
      <section v-for="sec in DOCS[page]" :key="sec[0]" class="dh-card dh-doc-card">
        <h3 class="dh-doc-h">{{ sec[0] }}</h3>
        <p class="dh-doc-p">{{ sec[1] }}</p>
      </section>
      <div class="dh-doc-foot">
        <LIcon name="shield" :size="15" />
        <span>本页为原型演示文本，不构成正式法律文件</span>
      </div>
    </template>
  </DhShell>
</template>

<style scoped>
.dh-form-card { padding: 14px 16px 10px; }

.dh-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 15px;
  line-height: 22px;
  color: #1F1F1F;
  background: transparent;
  box-sizing: border-box;
}
.dh-textarea::placeholder { color: #9AA0A6; }

.dh-counter { text-align: right; font-size: 11.5px; color: #9AA0A6; }

.dh-form-actions { display: flex; justify-content: flex-end; padding: 4px 4px 0; }

.dh-sent {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  color: #1E8E3E;
  padding-top: 12px;
}

.dh-plain-row { padding: 14px 16px; }

.dh-doc-meta {
  margin: 0;
  padding: 4px 6px 12px;
  font-size: 12.5px;
  color: #5F6368;
}

.dh-doc-card { padding: 16px 18px; }

.dh-doc-h {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1F1F1F;
}

.dh-doc-p {
  margin: 0;
  font-size: 13.5px;
  line-height: 21px;
  color: #3C4043;
}

.dh-del-body {
  font-size: 13.5px;
  line-height: 20px;
  color: #5F6368;
  padding: 6px 0 2px;
}

.dh-doc-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 6px 0;
  font-size: 12px;
  color: #9AA0A6;
}
</style>
