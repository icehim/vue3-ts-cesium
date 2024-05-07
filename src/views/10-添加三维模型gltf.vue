<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  Cartesian3,
  CesiumTerrainProvider,
  FeatureDetection,
  ImageryLayer,
  UrlTemplateImageryProvider,
  Viewer,
  Math,
  WebMercatorTilingScheme,
  HeadingPitchRoll,
  Transforms,
  HeightReference,
  Color,
  ColorBlendMode,
  DistanceDisplayCondition,
  ShadowMode
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
// 加载天地图影像图层
const loadMapFromTianditu = (token: string, tdtUrl: string, subdomains: string[]) => {
  // 叠加文字标注
  const tdtImageryProvider1 = new UrlTemplateImageryProvider({
    url: tdtUrl + 'DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=' + token,
    subdomains,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18,
    credit: 'Tianditu-cia_w'
  })
  viewerRef.value?.imageryLayers.addImageryProvider(tdtImageryProvider1)
}
// 添加三维模型gltf
const loadGltf = () => {
  // 设置模型位置
  const position = Cartesian3.fromDegrees(116.391, 39.9163, 10)
  // 设置模型方向
  const heading = Math.toRadians(180)
  const pitch = Math.toRadians(2)
  const roll = Math.toRadians(-6)
  const hpr = new HeadingPitchRoll(heading, pitch, roll)
  const orientation = Transforms.headingPitchRollQuaternion(position, hpr)
  const model = viewerRef.value!.entities.add({
    id: 'model',
    position,
    orientation,
    model: {
      uri: '/data/car.glb',
      heightReference: HeightReference.CLAMP_TO_GROUND,
      minimumPixelSize: 128,
      maximumScale: 20,
      scale: 8.0,
      runAnimations: true,
      shadows: ShadowMode.ENABLED,
      // 轮廓线
      silhouetteColor: Color.BLUE,
      silhouetteSize: 2,
      // colorBlendMode: ColorBlendMode.HIGHLIGHT
      distanceDisplayCondition: new DistanceDisplayCondition(100, 20000)
    }
  })

  viewerRef.value?.zoomTo(model)
}

onMounted(async () => {
  // const token = 'bcc62222fc634ec736589c483de933e6'
  const token = '0cf3d62714dd9f6d3b2a9af13ea80566'
  // 服务域名
  const tdtUrl = 'https://t{s}.tianditu.gov.cn/'
  // 服务负载子域
  const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7']
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
        url: tdtUrl + 'DataServer?T=img_w&x={x}&y={y}&l={z}&tk=' + token,
        subdomains,
        tilingScheme: new WebMercatorTilingScheme(),
        maximumLevel: 18,
        credit: 'Tianditu-img_w'
      })
    ),
    terrainProvider: await CesiumTerrainProvider.fromIonAssetId(3956, {
      requestWaterMask: true, //请求水体效果所需要的海岸线数据
      requestVertexNormals: true //请求地形照明数据
    })
  })
  // 开启阴影
  viewerRef.value.shadows = true
  viewerRef.value.scene.globe.enableLighting = true
  // 帧率信息
  viewerRef.value.scene.debugShowFramesPerSecond = true
  // 隐藏版权信息
  hiddenCopyright()
  // 加载天地图文字标注图层
  loadMapFromTianditu(token, tdtUrl, subdomains)
  // 添加三维模型gltf
  loadGltf()
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
