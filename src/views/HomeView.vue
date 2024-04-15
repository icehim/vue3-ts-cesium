<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Viewer } from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'

const viewerDivRef = ref<HTMLDivElement>()
window.CESIUM_BASE_URL = 'node_modules/cesium/Build/CesiumUnminified/'

onMounted(() => {
  new Viewer(viewerDivRef.value as HTMLElement)
})
</script>

<template>
  <main id="cesium-viewer" ref="viewerDivRef"></main>
</template>

<style scoped lang="scss">
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>
