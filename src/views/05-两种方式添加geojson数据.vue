<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  Cartesian3,
  CesiumTerrainProvider,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme,
  ImageryLayer,
  GeoJsonDataSource,
  Color,
  ConstantProperty,
  ColorMaterialProperty
} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
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
const loadGeoJsonFn1 = () => {
  const promise = GeoJsonDataSource.load('/data/beijing.json')
  promise.then((dataSource) => {
    viewerRef.value?.dataSources.add(dataSource)

    //outlineColor实际上是使用 Property 类型来处理的 可能需要使用特定的 Property 类型来设置它们。如果直接赋值不起作用，可以尝试使用 Color 的属性包装器 ConstantProperty：
    dataSource.entities.values.forEach((entity) => {
      if (entity.polygon) {
        entity.polygon.outlineColor = new ConstantProperty(Color.RED)
        entity.polygon.material = new ColorMaterialProperty(Color.BLUE)
        entity.polygon.height = new ConstantProperty(100)
        entity.polygon.extrudedHeight = new ConstantProperty(2000)
      }
    })
  })
}

const loadGeoJsonFn2 = () => {
  // 申明一个XMLHttpRequest
  const request = new XMLHttpRequest()
  // 设置请求方法与路径
  request.open('get', '/data/beijing.json')
  // 不发送数据到服务器
  request.send(null)
  // xhr对象获取到返回信息后执行
  request.onload = function () {
    // 解析获取到的数据
    const data: FeatureCollection<MultiPolygon> = JSON.parse(request.responseText)
    data.features.forEach((feature) => {
      // 假设特征是多边形
      feature.geometry.coordinates.forEach((coordinate) => {
        viewerRef.value?.entities.add({
          name: 'beijing',
          polygon: {
            hierarchy: Cartesian3.fromDegreesArray(coordinate.flat(2)), // 数组碾平
            height: 10000,
            extrudedHeight: 20000,
            material: Color.RED,
            outline: true,
            outlineColor: Color.PINK
          }
        })
      })
    })
  }
}

onMounted(async () => {
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
  // 加载修改geoJson数据方式一
  loadGeoJsonFn1()
  // 加载修改geoJson数据方式二
  loadGeoJsonFn2()
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
