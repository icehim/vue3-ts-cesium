<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import { Cartesian3, UrlTemplateImageryProvider, Viewer } from 'cesium'
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
  /**
   * 这里创建了一个UrlTemplateImageryProvider对象，并设置其中的url属性，将其指定为从天地图服务器加载瓦片的URL模板。
   * 其中{s}是天地图的多个子域之一，{x}、{y}和{z}分别表示瓦片的行列号和级别。tk为天地图开放平台申请的密钥。
   * 这里需要设置subdomains数组以用于轮询不同的服务器。此外，还可以设置瓦片的最大和最小级别。
   */
  const tdtImageryProvider = new UrlTemplateImageryProvider({
    url: 'http://{s}.tianditu.com/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=0cf3d62714dd9f6d3b2a9af13ea80566',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 18,
    minimumLevel: 1,
    credit: 'Tianditu'
  })
  viewerRef.value?.imageryLayers.addImageryProvider(tdtImageryProvider)
}

onMounted(() => {
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
    navigationInstructionsInitiallyVisible: false
  })
  hiddenCopyright()
  goGuGongPos(116.391, 39.9163, 2000.0)
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
