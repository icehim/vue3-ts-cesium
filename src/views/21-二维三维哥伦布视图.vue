<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  Cartesian2,
  Cartesian3,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
  Math as cesiumMath,
  Ion,
  SceneMode
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
const goSomewhere = (longitude: number, latitude: number, height: number) => {
  // 经/纬/高度转换为笛卡尔坐标系
  const initialPosition = Cartesian3.fromDegrees(longitude, latitude, height)
  // 手动设置初始坐标
  viewerRef.value?.camera.setView({ destination: initialPosition })
}

// 注册鼠标点击事件
const registerMouseEvent = () => {
  const handler = new ScreenSpaceEventHandler(viewerRef.value?.scene.canvas)
  handler.setInputAction((movement: { position: Cartesian2 }) => {
    const ray = viewerRef.value?.camera.getPickRay(movement.position)
    if (!ray) return null
    const position = viewerRef.value?.scene.globe.pick(ray, viewerRef.value?.scene)
    // 平面坐标系（Cartesian2）
    console.log('平面坐标系', movement.position)
    // 笛卡尔空间直角坐标系（Cartesian3）
    if (position) {
      console.log('笛卡尔空间直角坐标系', position)
      // WGS84弧度坐标
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position as Cartesian3)
      console.log('WGS84弧度坐标', cartographic)
      // 转换成经纬度
      const longitude = cesiumMath.toDegrees(cartographic.longitude)
      const latitude = cesiumMath.toDegrees(cartographic.latitude)
      console.log('经度:', longitude, '纬度:', latitude)
    }
  }, ScreenSpaceEventType.LEFT_CLICK)
}

type modeType = '2' | '3' | 'g'

// 二维三维哥伦布视图
const changeSceneMode = (type: modeType) => {
  switch (type) {
    case '2':
      // 直接切换
      // viewerRef.value!.scene.mode = SceneMode.SCENE2D
      // 有一个变化过程
      viewerRef.value?.scene.morphTo2D()
      break
    case '3':
      // viewerRef.value!.scene.mode = SceneMode.SCENE3D
      viewerRef.value?.scene.morphTo3D()
      break
    case 'g':
      // viewerRef.value!.scene.mode = SceneMode.COLUMBUS_VIEW
      viewerRef.value?.scene.morphToColumbusView()
      break
  }
}

onMounted(async () => {
  Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ZTlkNGI5Mi05ZjQ3LTRhZTAtOTJlNy03MjBjNGM4Yzg2NDQiLCJpZCI6MjE1MzQwLCJpYXQiOjE3MTU3NTk4NTZ9.21C4HqowuO5B8n044IYmVR_Mhtjwn_uoIXXyn6Z24G4'
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
    shadows: false
  })
  // 帧率信息
  viewerRef.value.scene.debugShowFramesPerSecond = true
  // 隐藏版权信息
  hiddenCopyright()
  // setView故宫
  goSomewhere(116.391, 39.9163, 2500000.0)
  // 注册鼠标点击事件
  registerMouseEvent()
})
</script>

<template>
  <button @click="changeSceneMode('2')">2d</button>
  <button @click="changeSceneMode('3')">3d</button>
  <button @click="changeSceneMode('g')">哥伦布试图</button>
  <main id="cesium-viewer" ref="viewerDivRef"></main>
</template>

<style scoped lang="scss">
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>
