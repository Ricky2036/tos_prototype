<script setup>
/**
 * AI Mate · 添加智能设备（归档首页 banner：扫描发现附近蓝牙设备 → 连接）
 * 归档实测三步引导文案写在本组件的「配对步骤」里，逐条对应 store 的扫描 → 配对链路。
 */
import { computed, ref } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import { useAiMateStore } from '../../../stores/aiMateStore'
import LIcon from '../../ui/LIcon.vue'

const emit = defineEmits(['close'])

const i18n = useI18nStore()
const mate = useAiMateStore()
const am = (p) => i18n.am(p)

/** null 表示尚未开始连接；否则是被连接设备的 id */
const connecting = ref(null)
/** 连接失败的候选 id（归档三态里的「失败」分支，重试一次即成功） */
const failed = ref(null)
/** 已失败过一次的候选：第二次尝试放行 */
const retried = new Set()

const found = computed(() => mate.discovered)

const typeMetaOf = (typeId) => mate.typeOf(typeId)
const typeLabelOf = (typeId) => am(`type.${typeId}`)

function rescan() {
  connecting.value = null
  failed.value = null
  mate.startScan()
}

function connect(c) {
  if (connecting.value) return
  connecting.value = c.id
  failed.value = null
  // 连接是一个短暂的真实过程，给一点回执时间再入库
  setTimeout(() => {
    connecting.value = null
    // 首次尝试失败：留在面板内提示重试
    if (c.willFail && !retried.has(c.id)) {
      retried.add(c.id)
      failed.value = c.id
      return
    }
    mate.pairDevice(c.id)
    // 连接成功即收起面板（与系统「添加设备」一致：确认结果后回到列表）
    emit('close')
  }, 900)
}

const steps = computed(() => [am('scan.step1'), am('scan.step2'), am('scan.step3')])
</script>

<template>
  <div class="am-sheet-mask" @click.self="emit('close')">
    <div class="am-sheet">
      <header class="am-sheet-head">
        <h2>{{ am('scan.title') }}</h2>
        <button class="am-sheet-close" aria-label="close" @click="emit('close')">
          <LIcon name="x" :size="17" />
        </button>
      </header>

      <div class="am-sheet-body">
        <!-- 扫描中 -->
        <div v-if="mate.scanning && !found.length" class="am-scanning">
          <span class="am-radar">
            <i class="r1" /><i class="r2" /><i class="r3" />
            <LIcon name="router" :size="22" class="am-radar-icon" />
          </span>
          <p>{{ am('scan.scanning') }}</p>
        </div>

        <!-- 结果 -->
        <template v-else-if="found.length">
          <p class="am-found-label">{{ am('scan.found') }}</p>
          <div class="am-list">
            <button
              v-for="c in found"
              :key="c.id"
              class="am-result"
              :disabled="!!connecting"
              @click="connect(c)"
            >
              <span
                class="am-result-icon"
                :style="{ background: typeMetaOf(c.type)?.bg, color: typeMetaOf(c.type)?.color }"
              >
                <LIcon :name="typeMetaOf(c.type)?.icon" :size="19" />
              </span>
              <span class="am-result-main">
                <span class="am-result-name">{{ c.name }}</span>
                <span class="am-result-sub">{{ typeLabelOf(c.type) }} · {{ c.subtitle }}</span>
              </span>
              <span v-if="connecting === c.id" class="am-result-state connecting">
                <LIcon name="loaderCircle" :size="15" class="am-spin" />
                {{ am('scan.connecting') }}
              </span>
              <span v-else-if="failed === c.id" class="am-result-state failed">
                <LIcon name="alertCircle" :size="15" />
                {{ am('scan.failed') }}
              </span>
              <span v-else class="am-result-state">{{ am('scan.connect') }}</span>
            </button>
          </div>
          <button class="am-rescan" @click="rescan">
            <LIcon name="rotateCcw" :size="15" />
            {{ am('scan.retry') }}
          </button>
        </template>

        <!-- 什么都没扫到 -->
        <div v-else class="am-scanning">
          <LIcon name="cloudOff" :size="26" class="am-empty-icon" />
          <p>{{ am('scan.empty') }}</p>
          <button class="am-rescan" @click="rescan">
            <LIcon name="rotateCcw" :size="15" />
            {{ am('scan.retry') }}
          </button>
        </div>

        <!-- 配对步骤 -->
        <section class="am-steps">
          <h3>{{ am('scan.steps') }}</h3>
          <ol>
            <li v-for="(s, i) in steps" :key="i">
              <span class="am-step-no">{{ i + 1 }}</span>
              <span>{{ s }}</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.am-sheet-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: flex-end;
  z-index: 70;
}
.am-sheet {
  width: 100%;
  max-height: 82%;
  background: #F2F2F7;
  border-radius: 22px 22px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: am-sheet-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes am-sheet-in {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.am-sheet-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 10px;
}
.am-sheet-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1C1C1E;
}
.am-sheet-close {
  width: 30px; height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(120, 120, 128, 0.14);
  color: #6C6C70;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.am-sheet-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px calc(var(--safe-bottom) + 18px);
}

/* ---------- 扫描态 ---------- */
.am-scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 26px 0 20px;
}
.am-scanning p {
  margin: 0;
  font-size: 12.5px;
  color: #8E8E93;
}
.am-empty-icon { color: #C7C7CC; }
.am-radar {
  position: relative;
  width: 74px;
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.am-radar-icon { color: #7C5CFF; position: relative; z-index: 2; }
.am-radar i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(124, 92, 255, 0.5);
  animation: am-pulse 1.9s ease-out infinite;
}
.am-radar i.r2 { animation-delay: 0.63s; }
.am-radar i.r3 { animation-delay: 1.26s; }
@keyframes am-pulse {
  0% { transform: scale(0.42); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0; }
}

/* ---------- 结果列表 ---------- */
.am-found-label {
  margin: 4px 0 8px 4px;
  font-size: 11.5px;
  color: #8E8E93;
}
.am-list {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}
.am-result {
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  text-align: left;
  position: relative;
}
.am-result + .am-result::before {
  content: '';
  position: absolute;
  top: 0; left: 49px; right: 0;
  height: 0.5px;
  background: rgba(60, 60, 67, 0.12);
}
.am-result:disabled { opacity: 0.65; cursor: default; }
.am-result-icon {
  width: 38px; height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.am-result-main { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.am-result-name {
  font-size: 14px;
  font-weight: 550;
  color: #1C1C1E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.am-result-sub {
  font-size: 11px;
  color: #8E8E93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.am-result-state {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: #7C5CFF;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.am-result-state.connecting { color: #8E8E93; font-weight: 500; }
.am-result-state.failed {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #FF3B30;
  font-weight: 550;
}
.am-spin { animation: am-rot 0.9s linear infinite; }
@keyframes am-rot { to { transform: rotate(360deg); } }

.am-rescan {
  width: 100%;
  margin-top: 10px;
  border: none;
  border-radius: 12px;
  background: rgba(120, 120, 128, 0.12);
  color: #3A3A3C;
  font-size: 13px;
  font-weight: 550;
  padding: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

/* ---------- 配对步骤 ---------- */
.am-steps { margin-top: 20px; }
.am-steps h3 {
  margin: 0 0 9px 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: #8E8E93;
  text-transform: uppercase;
}
.am-steps ol {
  margin: 0;
  padding: 12px 14px;
  list-style: none;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.am-steps li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 12.5px;
  color: #3A3A3C;
  line-height: 1.45;
}
.am-step-no {
  flex: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(124, 92, 255, 0.12);
  color: #5B34E8;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
</style>
