<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'
import wallpaperPreview from '../../../../assets/img/wallpaper-lock.jpg'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()
</script>

<template>
  <SubPageShell title="深色主题设置" @back="emit('back')">
    <img class="sub-preview-img dark-preview" :src="wallpaperPreview" alt="壁纸预览" />
    <div class="settings-card">
      <ListCell title="深色主题下壁纸变暗" last>
        <template #right>
          <ToggleSwitch
            :model-value="display.darkWallpaperDim"
            color="blue"
            @update:model-value="v => display.setBool('darkWallpaperDim', v)"
          />
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.dark-preview {
  height: 176px;
}
</style>
