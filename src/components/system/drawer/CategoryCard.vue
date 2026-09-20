<script setup>
import { computed, ref } from 'vue'
import { getDrawerAppById } from '../../../config/drawerApps'
import { useHomeStore } from '../../../stores/homeStore'
import { rectRelativeToScreen } from '../../../utils/dom'
import AppIcon from '../../ui/AppIcon.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  isFolderOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-app', 'open-folder', 'open-xhide'])

const home = useHomeStore()
const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

const cardRef = ref(null)
const nameRef = ref(null)
const clusterRef = ref(null)
const iconRefs = new Map()

function setIconRef(id, el) {
  if (el) iconRefs.set(id, el)
  else iconRefs.delete(id)
}

const largeApps = computed(() => {
  if (props.category.type === '4-large') {
    return (props.category.apps || [])
      .filter(isInstalled)
      .map((id) => getDrawerAppById(id))
      .filter(Boolean)
  }
  if (props.category.type === '3-large-1-cluster') {
    return (props.category.largeApps || [])
      .filter(isInstalled)
      .map((id) => getDrawerAppById(id))
      .filter(Boolean)
  }
  return []
})

const clusterApps = computed(() => {
  if (props.category.type === '3-large-1-cluster') {
    return (props.category.clusterApps || [])
      .filter(isInstalled)
      .map((id) => getDrawerAppById(id))
      .filter(Boolean)
  }
  return []
})

function getOriginData() {
  if (!cardRef.value) return null
  const screen = cardRef.value.closest('.screen-view') || document.querySelector('.screen-view')
  const cardRect = screen ? rectRelativeToScreen(cardRef.value, screen) : cardRef.value.getBoundingClientRect()
  const titleRect = nameRef.value ? (screen ? rectRelativeToScreen(nameRef.value, screen) : nameRef.value.getBoundingClientRect()) : null
  const clusterRect = clusterRef.value ? (screen ? rectRelativeToScreen(clusterRef.value, screen) : clusterRef.value.getBoundingClientRect()) : null
  const iconRects = {}
  for (const [id, el] of iconRefs) {
    if (el) {
      const anchor = el.querySelector?.('.app-icon-anchor') || el
      iconRects[id] = screen ? rectRelativeToScreen(anchor, screen) : anchor.getBoundingClientRect()
    }
  }
  return {
    cardRect,
    titleRect,
    clusterRect,
    iconRects
  }
}

function handleExpandFolder() {
  if (props.category.type === 'xhide') {
    emit('open-xhide')
    return
  }
  emit('open-folder', {
    category: props.category,
    origin: getOriginData()
  })
}

function handleAppClick(appId, e) {
  e?.stopPropagation()
  emit('select-app', appId)
}
</script>

<template>
  <div class="category-folder-wrapper" :class="{ 'is-folder-open': isFolderOpen }">
    <!-- 桌面大文件夹 1:1 正方形白色半透毛玻璃卡片（参考 media_1789896055622.jpg） -->
    <div
      ref="cardRef"
      class="folder-card"
      :class="{ 'is-xhide': category.type === 'xhide' }"
      @click="handleExpandFolder"
    >
      <!-- XHide 专属占位骨架卡片（大小与圆角与实际有图标时完全一致，复用网格与 squircle-mask） -->
      <div v-if="category.type === 'xhide'" class="grid-2x2">
        <div v-for="i in 3" :key="'xhide-large-' + i" class="folder-app-item">
          <div class="xhide-placeholder-tile squircle-mask"></div>
        </div>
        <div class="folder-app-item">
          <div class="mini-cluster-grid">
            <div v-for="i in 4" :key="'xhide-mini-' + i" class="mini-app-item">
              <div class="xhide-mini-placeholder-tile squircle-mask"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 大图标布局：复用原生 AppIcon -->
      <div v-else-if="category.type === '4-large'" class="grid-2x2">
        <div
          v-for="app in largeApps"
          :key="app.id"
          :ref="el => setIconRef(app.id, el)"
          class="folder-app-item"
          @click.stop="handleAppClick(app.id, $event)"
        >
          <AppIcon
            :app="app"
            :size="52"
            :show-label="false"
            :launch-on-click="false"
          />
        </div>
      </div>

      <!-- 3 大图标 + 1 迷你微簇布局 -->
      <div v-else-if="category.type === '3-large-1-cluster'" class="grid-2x2">
        <!-- 3 个大图标 -->
        <div
          v-for="app in largeApps"
          :key="app.id"
          :ref="el => setIconRef(app.id, el)"
          class="folder-app-item"
          @click.stop="handleAppClick(app.id, $event)"
        >
          <AppIcon
            :app="app"
            :size="52"
            :show-label="false"
            :launch-on-click="false"
          />
        </div>

        <!-- 第 4 格：2x2 迷你微簇（整体尺寸 52px 严格等于大图标，支持点击四合一缩略图展开） -->
        <div class="folder-app-item" @click.stop="handleExpandFolder">
          <div ref="clusterRef" class="mini-cluster-grid">
            <div
              v-for="cApp in clusterApps"
              :key="cApp.id"
              :ref="el => setIconRef(cApp.id, el)"
              class="mini-app-item"
            >
              <AppIcon
                :app="cApp"
                :size="24"
                :show-label="false"
                :launch-on-click="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类文件夹名称（位于卡片外正下方居中，点击亦可触发展开） -->
    <div ref="nameRef" class="folder-name" @click="handleExpandFolder">{{ category.name }}</div>
  </div>
</template>

<style scoped>
.category-folder-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  width: 100%;
}

.category-folder-wrapper.is-folder-open {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: none !important;
}

/* 1:1 正方形白色半透毛玻璃文件夹卡片（对齐 media_1789896055622.jpg） */
.folder-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.24);
  border-radius: 26px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease;
  overflow: hidden;
  cursor: pointer;
}

.folder-card:active {
  transform: scale(0.965);
}

.folder-card.is-xhide {
  cursor: pointer;
}

/* 2x2 网格，卡内 0 文字 */
.grid-2x2 {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  box-sizing: border-box;
  align-items: center;
  justify-items: center;
}

.folder-app-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 15px;
  transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.folder-app-item:active {
  transform: scale(0.88);
}

/* 2x2 迷你微簇容器（尺寸 52px x 52px，与单个大图标完全一致，无额外背板） */
.mini-cluster-grid {
  width: 52px;
  height: 52px;
  display: grid;
  grid-template-columns: repeat(2, 24px);
  grid-template-rows: repeat(2, 24px);
  gap: 4px;
  box-sizing: border-box;
  background: transparent;
  align-items: center;
  justify-items: center;
  cursor: pointer;
  transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mini-cluster-grid:active {
  transform: scale(0.92);
}

.mini-app-item {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* 卡片正下方标题 */
.folder-name {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  cursor: pointer;
}

/* Squircle 统一蒙版（与系统 AppIcon 100% 相同圆角曲率） */
.squircle-mask {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 0 L 72 0 C 86 0 100 14 100 28 L 100 72 C 100 86 86 100 72 100 L 28 100 C 14 100 0 86 0 72 L 0 28 C 0 14 14 0 28 0 Z' fill='black'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
  mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 0 L 72 0 C 86 0 100 14 100 28 L 100 72 C 100 86 86 100 72 100 L 28 100 C 14 100 0 86 0 72 L 0 28 C 0 14 14 0 28 0 Z' fill='black'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
}

/* XHide 专属占位骨架色块：与实际大图标 52px、小图标 24px 大小与圆角完全一模一样 */
.xhide-placeholder-tile {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
  pointer-events: none;
}

.xhide-mini-placeholder-tile {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
  pointer-events: none;
}
</style>
