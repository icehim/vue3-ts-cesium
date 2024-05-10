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
  Primitive,
  PolygonGeometry,
  PolygonHierarchy,
  GeometryInstance,
  MaterialAppearance,
  Material,
  Color,
  EllipsoidSurfaceAppearance
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

// primitive polygon
const registerPrimitivePolygon = () => {
  // 创建primitive流程
  // 1.创建Geometry
  const polygon = new PolygonGeometry({
    polygonHierarchy: new PolygonHierarchy(
      Cartesian3.fromDegreesArray([90, 40, 120, 40, 120, 30, 90, 30])
    )
  })
  const geometry = PolygonGeometry.createGeometry(polygon)
  // 2.创建GeometryInstance
  if (!geometry) {
    throw new Error('无法创建geometry')
  }
  const instance = new GeometryInstance({
    geometry: geometry
  })
  // 3.创建material
  const material = new Material({
    fabric: {
      type: 'Water',
      uniforms: {
        baseWaterColor: new Color(64 / 255.0, 157 / 255.0, 253 / 255.0, 0.7),
        normalMap: '/src/assets/images/water.jpg',
        frequency: 20000,
        animationSpeed: 0.1,
        amplitude: 50,
        specularIntensity: 0.5
      }
    }
  })
  // 4.创建appearance
  const appearance = new EllipsoidSurfaceAppearance({
    material
  })
  // 5.创建primitive
  viewerRef.value?.scene.primitives.add(
    new Primitive({
      geometryInstances: instance,
      // asynchronous 该属性用于控制几何体的构建和渲染是否以异步方式进行。
      asynchronous: false,
      appearance
    })
  )
  viewerRef.value?.scene.camera.setView({
    destination: Cartesian3.fromDegrees(107, 35, 5000000)
  })
}

onMounted(async () => {
  // 天地图token
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
  goSomewhere(116.391, 39.9163, 2500000.0)
  // 加载天地图文字标注图层
  loadMapFromTianditu(token, tdtUrl, subdomains)
  // 注册鼠标点击事件
  registerMouseEvent()
  // primitive polygon
  registerPrimitivePolygon()
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
