<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  type Cartesian2,
  Cartesian3,
  CesiumTerrainProvider,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme,
  Math,
  Color,
  Entity,
  CustomDataSource
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
  const token = 'bcc62222fc634ec736589c483de933e6'
  // const token = '0cf3d62714dd9f6d3b2a9af13ea80566'
  // 服务域名
  const tdtUrl = 'https://t{s}.tianditu.gov.cn/'
  // 服务负载子域
  const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7']

  // 叠加影像服务
  const tdtImageryProvider = new UrlTemplateImageryProvider({
    url: tdtUrl + 'DataServer?T=img_w&x={x}&y={y}&l={z}&tk=' + token,
    subdomains,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18,
    credit: 'Tianditu-img_w'
  })
  viewerRef.value?.imageryLayers.addImageryProvider(tdtImageryProvider)

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
    console.log('笛卡尔空间直角坐标系', position)
    // WGS84弧度坐标
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position as Cartesian3)
    console.log('WGS84弧度坐标', cartographic)
    // 转换成经纬度
    const longitude = Math.toDegrees(cartographic.longitude)
    const latitude = Math.toDegrees(cartographic.latitude)
    console.log('经度:', longitude, '纬度:', latitude)
  }, ScreenSpaceEventType.LEFT_CLICK)
}
// 添加点
const addPoint = (dataSource: CustomDataSource) => {
  // 添加点：方式1
  // const pointEntity = viewerRef.value?.entities.add()
  const pointEntity = dataSource.entities.add({
    id: 'pointTest',
    position: Cartesian3.fromDegrees(116.391, 39.9163),
    point: {
      pixelSize: 100,
      color: Color.YELLOW,
      outlineColor: Color.RED,
      outlineWidth: 2
    }
  })
  // console.log(pointEntity)
  // 添加点：方式2
  const pointEntity2 = new Entity({
    id: 'pointTest2',
    position: Cartesian3.fromDegrees(116.391, 39.9163),
    point: {
      pixelSize: 80,
      color: Color.GREEN,
      outlineColor: Color.PINK,
      outlineWidth: 4
    }
  })
  // viewerRef.value?.entities.add(pointEntity2)
  dataSource.entities.add(pointEntity2)
}
// 添加面
const addArea = (dataSource: CustomDataSource) => {
  dataSource.entities.add({
    id: 'polygontest',
    name: 'Wyoming',
    polygon: {
      hierarchy: Cartesian3.fromDegreesArray([
        109.080842, 45.002073, 105.91517, 45.002073, 104.058488, 44.996596, 104.053011, 43.002989,
        104.053011, 41.003906, 105.728954, 40.998429, 107.919731, 41.003906, 109.04798, 40.998429,
        111.047063, 40.998429, 111.047063, 42.000709, 111.047063, 44.476286, 111.05254, 45.002073,
        109.080842, 45.002073
      ]),
      height: 100,
      material: Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Color.BLUE,
      outlineWidth: 1,
      fill: true
    }
  })
}
// 添加线
const addLine = (dataSource: CustomDataSource) => {
  dataSource.entities.add({
    id: 'polylinetest',
    name: 'boderLine',
    polyline: {
      positions: Cartesian3.fromDegreesArray([
        109.080842,
        45.002073 - 5,
        105.91517,
        45.002073 - 5,
        104.058488,
        44.996596 - 5,
        104.053011,
        43.002989 - 5,
        104.053011,
        41.003906 - 5,
        105.728954,
        40.998429 - 5,
        107.919731,
        41.003906 - 5,
        109.04798,
        40.998429 - 5,
        111.047063,
        40.998429 - 5,
        111.047063,
        42.000709 - 5,
        111.047063,
        44.476286 - 5,
        111.05254,
        45.002073 - 5,
        109.080842,
        45.002073 - 5
      ]),
      width: 2,
      material: Color.YELLOW
    }
  })
}

const handleEntity = () => {
  // 使用dataSource方便管理
  const dataSource = new CustomDataSource('entitiesData')
  viewerRef.value?.dataSources.add(dataSource)

  // 添加点
  addPoint(dataSource)
  // 添加面
  addArea(dataSource)
  // 添加线
  addLine(dataSource)

  // 👇适用于viewerRef.value?.entities.add()添加的实例
  // 根据id获取实例
  const tempEntity = viewerRef.value?.entities.getById('polylinetest')
  // 调用方法移除
  // 方式一
  // viewerRef.value.entities.remove(tempEntity as Entity)
  // 方式二
  // viewerRef.value?.entities.removeById('polylinetest')

  // 👇适用于dataSource添加的实例
  const dataSourceEntity = dataSource.entities.getById('polylinetest')
  // 调用方法移除
  // 方式一
  // dataSource.entities.remove(dataSourceEntity as Entity)
  // 方式二
  dataSource.entities.removeById('polylinetest')
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
    terrainProvider: await CesiumTerrainProvider.fromIonAssetId(3956, {
      requestWaterMask: true, //请求水体效果所需要的海岸线数据
      requestVertexNormals: true //请求地形照明数据
    })
  })
  // 隐藏版权信息
  hiddenCopyright()
  // setView故宫
  goGuGongPos(116.391, 39.9163, 2500000.0)
  // 加载天地图影像图层
  loadMapFromTianditu()
  // 注册鼠标点击事件
  registerMouseEvent()
  // 获取或者移除添加的实例
  handleEntity()
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
