<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  Cartesian2,
  Cartesian3,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme,
  Math as cesiumMath,
  ImageryLayer,
  GeoJsonDataSource,
  Color
} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import {
  along,
  bearing,
  center,
  centerOfMass,
  centroid,
  type Feature,
  featureCollection,
  type Geometry,
  lineString,
  point,
  points,
  polygon
} from '@turf/turf'

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

const createTurf = () => {
  // 沿线根据距离取点 along
  // 创建折线
  const lineFeatures = lineString([
    [108, 34],
    [108, 34.2],
    [108.2, 34.1]
  ])
  const alongFeatures: Feature<Geometry> = along(lineFeatures, 3500, { units: 'meters' })
  // 方位角 bearing
  const bearingFeatures = bearing(point([108, 34]), point([108.2, 34.1]))
  console.log('bearingFeatures', bearingFeatures)
  // 绝对中心点 center 选址
  const features = points([
    [108, 34],
    [108, 34.2],
    [108.2, 34.1]
  ])
  const centerPoint = center(features)
  console.log('centerPoint', centerPoint)
  // 质心
  const polygonFeatures: Feature<Geometry> = polygon([
    [
      [108, 34],
      [108, 34.2],
      [108.2, 34.1],
      [108, 34]
    ]
  ])
  const center1 = centerOfMass(polygonFeatures)
  console.log('centerOfMass', center1)
  // 多面质心
  const polygon1: Feature<Geometry> = polygon([
    [
      [108, 34],
      [108, 34.2],
      [108.2, 34.1],
      [108, 34]
    ],
    [
      [108.5, 34],
      [108.5, 34.2],
      [108.7, 34.1],
      [108.5, 34]
    ]
  ])
  const centroid1 = centroid(polygon1)
  console.log('centroid', centroid1)

  const collection = featureCollection([polygon1, centroid1])

  const dataSource = GeoJsonDataSource.load(collection, {
    stroke: Color.BLUE,
    fill: Color.RED,
    strokeWidth: 3,
    markerSymbol: '?'
  })
  dataSource.then((data) => {
    viewerRef.value?.dataSources.add(data)
  })
}

onMounted(async () => {
  // 天地图token
  const token = 'bcc62222fc634ec736589c483de933e6'
  // const token = '0cf3d62714dd9f6d3b2a9af13ea80566'
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
    )
    // 获取地形数据
    /*terrainProvider: await CesiumTerrainProvider.fromIonAssetId(3956, {
      requestWaterMask: true, //请求水体效果所需要的海岸线数据
      requestVertexNormals: true //请求地形照明数据
    })*/
  })
  // 帧率信息
  viewerRef.value.scene.debugShowFramesPerSecond = true
  // 隐藏版权信息
  hiddenCopyright()
  // setView故宫
  goSomewhere(108.05, 34.09, 100000.0)
  // 加载天地图文字标注图层
  loadMapFromTianditu(token, tdtUrl, subdomains)
  // 注册鼠标点击事件
  registerMouseEvent()
  // 前端地理空间分析库turfjs
  createTurf()
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
