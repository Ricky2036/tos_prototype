<script setup>
import { computed, ref } from 'vue'
import { getDrawerAppById } from '../../../config/drawerApps'
import { useHomeStore } from '../../../stores/homeStore'
import AppIcon from '../../ui/AppIcon.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select-app', 'open-folder', 'open-xhide'])

const home = useHomeStore()
const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

const cardRef = ref(null)
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
  const cardRect = cardRef.value.getBoundingClientRect()
  const iconRects = {}
  for (const [id, el] of iconRefs) {
    if (el) {
      const anchor = el.querySelector?.('.app-icon-anchor') || el
      iconRects[id] = anchor.getBoundingClientRect()
    }
  }
  return {
    cardRect,
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
  <div class="category-folder-wrapper">
    <!-- 桌面大文件夹 1:1 正方形白色半透毛玻璃卡片（参考 media_1789896055622.jpg） -->
    <div
      ref="cardRef"
      class="folder-card"
      :class="{ 'is-xhide': category.type === 'xhide' }"
      @click="handleExpandFolder"
    >
      <!-- XHide 专属占位骨架卡片（100% 像素级对齐 media_1789896055622.jpg） -->
      <div v-if="category.type === 'xhide'" class="grid-2x2 xhide-grid">
        <div class="xhide-placeholder-item"></div>
        <div class="xhide-placeholder-item"></div>
        <div class="xhide-placeholder-item"></div>
        <div class="xhide-mini-cluster-placeholder">
          <div v-for="i in 4" :key="i" class="xhide-mini-item"></div>
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

        <!-- 第 4 格：2x2 迷你微簇（支持点击四合一缩略图展开） -->
        <div
          class="mini-cluster-grid"
          @click.stop="handleExpandFolder"
        >
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

    <!-- 分类文件夹名称（位于卡片外正下方居中，点击亦可触发展开） -->
    <div class="folder-name" @click="handleExpandFolder">{{ category.name }}</div>
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

/* 2x2 迷你微簇容器 */
.mini-cluster-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  align-items: center;
  justify-items: center;
  cursor: pointer;
  transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mini-cluster-grid:active {
  transform: scale(0.92);
}

.mini-app-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
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

/* XHide 专属占位骨架卡片（100% 像素级还原 media_1789896055622.jpg） */
.xhide-grid {
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

.xhide-placeholder-item {
  width: 100%;
  height: 100%;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.1);
}

.xhide-mini-cluster-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  align-items: center;
  justify-items: center;
}

.xhide-mini-item {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.12);
}
</style>
