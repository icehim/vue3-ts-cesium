<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  Cartesian3,
  ImageryLayer,
  Math,
  Rectangle,
  UrlTemplateImageryProvider,
  Viewer
} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
// cesium静态资源处理
// 开发环境
window.CESIUM_BASE_URL = 'node_modules/cesium/Build/CesiumUnminified/'
// 生产环境
// 需要将 node_modules/cesium/Build/CesiumUnminified 下所有的静态资源文件放到public/libs/cesium 文件夹下 不然打包后无法运行cesium
// window.CESIUM_BASE_URL = 'libs/cesium/'

// cesium挂载的dom节点
const viewerDivRef = ref<HTMLDivElement>()
const viewerRef = shallowRef<Viewer>()

// 隐藏版权信息
const hiddenCopyright = () => {
  const copyRightEl = viewerRef.value?.cesiumWidget.creditContainer as HTMLDivElement
  copyRightEl.style.display = 'none'
}

// 去故宫位置
const goGuGongPos = (longitude: number, latitude: number, height: number) => {
  // 故宫经纬度转换
  const initialPosition = Cartesian3.fromDegrees(longitude, latitude, height)
  // 手动设置初始坐标
  viewerRef.value?.camera.setView({ destination: initialPosition })
}

// 加载天地图影像图层
const loadMapFromTianditu = () => {
  // 叠加文字标注
  const tdtImageryProvider1 = new UrlTemplateImageryProvider({
    url: '/data/offLineMapMark/{z}/{x}/{y}/tile.png',
    maximumLevel: 9,
    // 限制请求范围
    /*rectangle: new Rectangle(
      Math.toRadians(114.32),
      Math.toRadians(36.927),
      Math.toRadians(114.524),
      Math.toRadians(37.22)
    ),*/
    credit: 'Tianditu-cia_w'
  })
  viewerRef.value?.imageryLayers.addImageryProvider(tdtImageryProvider1)
}

onMounted(async () => {
  // 初始化地球，并且隐藏原始的cesium配置项
  viewerRef.value = new Viewer(viewerDivRef.value as HTMLElement, {
    animation: false, //动画小部件
    baseLayerPicker: false, //地图图层组件
    fullscreenButton: false, //全屏组件
    geocoder: false, //地理编码搜索组件
    homeButton: false, //首页组件
    infoBox: false, //信息框
    sceneModePicker: false, //场景模式
    selectionIndicator: false, //选取指示器组件
    timeline: false, //时间轴
    navigationHelpButton: false, //帮助按钮
    navigationInstructionsInitiallyVisible: false,
    shouldAnimate: true, //是否允许动画
    showRenderLoopErrors: false,
    shadows: false,
    baseLayer: new ImageryLayer( // 叠加天地图影像服务
      new UrlTemplateImageryProvider({
        url: '/data/offLineMap/{z}/{x}/{y}/tile.png',
        maximumLevel: 9
      })
    )
  })
  // 帧率信息
  viewerRef.value.scene.debugShowFramesPerSecond = true
  // 隐藏版权信息
  hiddenCopyright()
  goGuGongPos(114.32, 36.927, 100000.0)
  // 加载离线标注层
  loadMapFromTianditu()
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
