<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  type Cartesian2,
  Cartesian3,
  CesiumTerrainProvider,
  Ellipsoid,
  ImageryLayer,
  type Ray,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme
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

const registerEvent = () => {
  // 鼠标左击事件
  const handler = new ScreenSpaceEventHandler(viewerRef.value?.canvas)
  handler.setInputAction((click: { position: Cartesian2 }) => {
    const ray = viewerRef.value?.camera.getPickRay(click.position)
    const position = viewerRef.value?.scene.globe.pick(ray as Ray, viewerRef.value?.scene)
    if (position) {
      console.log('点击了地球，笛卡尔坐标：', position)
      const WGS84Pos = Ellipsoid.WGS84.cartesianToCartographic(position)
      console.log('弧度', WGS84Pos)
    }
  }, ScreenSpaceEventType.LEFT_CLICK)

  // 鼠标移动事件
  const handler1 = new ScreenSpaceEventHandler(viewerRef.value?.canvas)
  handler1.setInputAction((movement: { startPosition: Cartesian2; endPosition: Cartesian2 }) => {
    console.log('鼠标移动', movement)
  }, ScreenSpaceEventType.MOUSE_MOVE)

  // 滚轮事件
  const handler2 = new ScreenSpaceEventHandler(viewerRef.value?.canvas)
  handler2.setInputAction((wheelMent: number) => {
    console.log('滚轮滚动', wheelMent)
  }, ScreenSpaceEventType.WHEEL)
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
  // 隐藏版权信息
  hiddenCopyright()
  // setView故宫
  goGuGongPos(116.391, 39.9163, 1000000)
  // 加载天地图文字标注图层
  loadMapFromTianditu(token, tdtUrl, subdomains)
  // 鼠标事件=》左击，右击，中键，滚轮，鼠标移动
  registerEvent()
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
