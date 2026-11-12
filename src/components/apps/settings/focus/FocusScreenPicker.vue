<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import FocusScreenArt from './FocusScreenArt.vue'
import FocusScreenPreview from './FocusScreenPreview.vue'
import { useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

/**
 * 选取锁屏 / 主屏幕页面 / 表盘。
 *
 * 真机形态（Ricky 2026-11-12 提供「选取主屏幕页面」截图 + 录屏 29–33s）：
 * - 导航栏只有左侧关闭与右侧蓝色勾，**没有标题**；标题是内容区里的居中大标题；
 * - 顶部是一张「页面卡片」插图，不是圆形 App 图标；
 * - 锁屏页多一段「创建新的锁屏 / 从图库中挑选锁屏。」，主屏幕页没有；
 * - 分组标题锁屏是「从锁屏中选取」，主屏幕是「从你的页面中选取」；
 * - 缩略图下方只有圆形单选点，**没有文字标签**。
 */
const props = defineProps({ modeId: { type: String, required: true }, type: { type: String, default: 'lock' } })
const emit = defineEmits(['back'])
const focus = useFocusSettingsStore()
const mode = computed(() => focus.getMode(props.modeId))
const selected = ref(mode.value?.screens[props.type] || '')

const noun = computed(() => (props.type === 'lock' ? '锁屏' : props.type === 'home' ? '页面' : '表盘'))
const title = computed(() => (props.type === 'watch' ? '选取 Apple Watch 表盘' : `选取${props.type === 'lock' ? '锁屏' : '主屏幕页面'}`))
const sectionTitle = computed(() => (props.type === 'lock'
  ? '从锁屏中选取'
  : props.type === 'home' ? '从你的页面中选取' : '从表盘中选取'))

const options = computed(() => (props.type === 'watch'
  ? [{ id: 'light', name: '简约浅色' }, { id: 'dark', name: '数字深色' }]
  : [{ id: 'aurora', name: '极光' }, { id: 'default', name: '抽象几何' }, { id: 'ocean', name: '海洋' }]))

function confirm() {
  if (selected.value) focus.setScreen(props.modeId, props.type, selected.value)
  emit('back')
}
</script>

<template>
  <SubPageShell v-if="mode" title="" back-icon="close" @back="emit('back')">
    <template #navRight>
      <button type="button" class="fsp-confirm" aria-label="完成" data-focus-screen-confirm @click="confirm">
        <LIcon name="check" :size="21" :stroke-width="2.6" />
      </button>
    </template>

    <div class="focus-screen-picker" :data-focus-screen-picker="type">
      <div class="fsp-hero"><FocusScreenArt :kind="type" /></div>
      <h1 class="fsp-title">{{ title }}</h1>

      <div v-if="type === 'lock'" class="fsp-create">
        <strong>创建新的锁屏</strong>
        <span>从图库中挑选锁屏。</span>
      </div>

      <div class="fsp-rule"></div>
      <h2 class="fsp-section">{{ sectionTitle }}</h2>

      <div class="fsp-pages">
        <button
          v-for="(option, index) in options"
          :key="option.id"
          type="button"
          :class="{ selected: selected === option.id }"
          :data-focus-screen-option="option.id"
          @click="selected = option.id"
        >
          <span class="fsp-frame" :class="`is-${type}`">
            <FocusScreenPreview :kind="type" :wallpaper="option.id" :widget="index === 0 && type === 'home'" />
          </span>
          <span class="fsp-radio"><LIcon v-if="selected === option.id" name="check" :size="15" :stroke-width="3" /></span>
        </button>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
/* 真机内容比外壳再内缩 12（分组标题左缘 28、缩略图行左缘 31）；
   margin-top 抵消外壳的 10px 顶部留白，插图紧贴导航栏。 */
.focus-screen-picker { margin-top: -10px; padding: 0 12px 44px; text-align: center; }

/* 右上角完成键：真机是实心蓝圆 + 白色勾，不是玻璃圆钮 */
.gn-right .fsp-confirm {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #007AFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  cursor: pointer;
}

.gn-right .fsp-confirm:active { background: #0069DA; }

.fsp-hero { display: flex; justify-content: center; margin: 4px 0 12px; }

.fsp-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -.4px;
  color: #111;
}

/* 锁屏页独有的「创建新的锁屏」段 */
.fsp-create { margin-top: 20px; text-align: left; }
.fsp-create strong { display: block; font-size: 15px; font-weight: 700; }
.fsp-create span { display: block; margin-top: 5px; color: #8E8E93; font-size: 12.5px; }

.fsp-rule { height: .5px; margin-top: 18px; background: #D8D8DD; }

.fsp-section {
  margin: 12px 0 10px;
  text-align: left;
  font-size: 13.5px;
  font-weight: 600;
  color: #1C1C1E;
}

.fsp-pages { display: flex; justify-content: center; gap: 23px; }

.fsp-pages > button {
  width: 84px;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.fsp-frame {
  width: 84px;
  height: 195px;
  border-radius: 12px;
  overflow: hidden;
  background: #E9E9EE;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .12);
}

/* 表盘接近方形：竖长条会让两只表看起来像手机 */
.fsp-frame.is-watch { width: 84px; height: 104px; border-radius: 26px; }

.fsp-pages > button:active .fsp-frame { transform: scale(.985); }

.fsp-radio {
  width: 26px;
  height: 26px;
  margin-top: 12px;
  border: 1.6px solid #C7C7CC;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  box-sizing: border-box;
}

.fsp-pages > button.selected .fsp-radio { border-color: #007AFF; background: #007AFF; }
</style>
