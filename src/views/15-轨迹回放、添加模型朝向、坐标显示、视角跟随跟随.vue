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
  CustomDataSource,
  Color,
  SampledPositionProperty,
  JulianDate,
  LagrangePolynomialApproximation,
  TimeIntervalCollection,
  TimeInterval,
  PolylineGlowMaterialProperty,
  ClockRange,
  VelocityOrientationProperty,
  CallbackProperty
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

// 添加线
const addEntity = () => {
  // 使用dataSource方便管理
  const dataSource = new CustomDataSource('entitiesData')
  viewerRef.value?.dataSources.add(dataSource)
  const lujingdata: number[][] = [
    [117.4603186710001, 31.14388249900003, 11.147400900001653],
    [117.45946237800001, 31.143739847000063, 11.108399999997346],
    [117.45859906800001, 31.143571198000075, 10.89079999999376],
    [117.45789337300005, 31.143422075000046, 11.12170000000333],
    [117.4571119630001, 31.143350937000037, 11.545700000002398],
    [117.45620292500007, 31.143325030000028, 11.529899999994086],
    [117.45545284400009, 31.143363754000063, 11.038100000005215],
    [117.45473256600008, 31.143448056000068, 10.863800000006457],
    [117.45399052200003, 31.143623321000064, 11.345600000000559],
    [117.45347615200001, 31.14381135600007, 11.687300000005052],
    [117.45292459000007, 31.144031608000034, 12.106100000004517],
    [117.45192097000006, 31.144426226000064, 12.842399999994086],
    [117.45065835500009, 31.144954275000032, 12.712299999999232],
    [117.44980033200011, 31.145266268000057, 12.504899999999907],
    [117.44943370300007, 31.145413392000023, 12.731599999999162],
    [117.44920128900003, 31.145382554000037, 12.967699999937837],
    [117.44897692800009, 31.144980649000047, 14.909599999999045],
    [117.44872415000009, 31.14449598400006, 14.55899999999383],
    [117.44851592000009, 31.144125416000065, 14.410999999992782],
    [117.44848024700002, 31.14392828000007, 14.475800000000163],
    [117.44948683700011, 31.14350793500006, 14.507400000002235],
    [117.45089297600009, 31.142959855000072, 14.290399999998044],
    [117.45149371900004, 31.142693826000027, 14.127099999997881],
    [117.45166848000008, 31.142571364000048, 15.52610000000277],
    [117.4516358520001, 31.142433625000024, 14.0341000000044],
    [117.45082070700005, 31.140899211000033, 13.289099999994505],
    [117.45082070700005, 31.140899211000033, 13.289099999994505]
  ]

  dataSource.entities.add({
    name: 'line',
    polyline: {
      positions: Cartesian3.fromDegreesArrayHeights(lujingdata.flat(2)),
      width: 2,
      material: Color.RED
    }
  })
  const property = new SampledPositionProperty()
  // 标准时间
  const startTime = new Date()
  let stopTIme = new Date()
  // 时间戳
  const timeTamp = startTime.getTime()
  lujingdata.forEach((pos, index) => {
    const time = new Date(timeTamp + index * 2000)
    stopTIme = time
    const position = Cartesian3.fromDegrees(pos[0], pos[1], pos[2])
    property.addSample(JulianDate.fromDate(time), position)
  })
  property.setInterpolationOptions({
    interpolationDegree: 0.001,
    interpolationAlgorithm: LagrangePolynomialApproximation
  })

  const entity = viewerRef.value?.entities.add({
    availability: new TimeIntervalCollection([
      new TimeInterval({
        start: JulianDate.fromDate(startTime),
        stop: JulianDate.fromDate(new Date(stopTIme))
      })
    ]),
    position: property,
    // 模型朝向 根据路线计算
    orientation: new VelocityOrientationProperty(property),
    // 添加汽车模型
    model: {
      uri: '/data/car.glb',
      scale: 1,
      minimumPixelSize: 128,
      maximumScale: 20,
      runAnimations: true
    },
    // 添加label
    label: {
      text: '',
      fillColor: Color.RED,
      font: '20px',
      // 设置label偏移量
      pixelOffset: new Cartesian2(0, -100)
    },
    // 添加轨迹
    path: {
      leadTime: 0,
      resolution: 1,
      material: new PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Color.GREEN
      }),
      width: 50
    }
  })

  // 设置是视角跟随
  viewerRef.value!.trackedEntity = entity
  viewerRef.value?.clock.onTick.addEventListener((tick) => {
    // 转为经纬度
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
      entity?.position?.getValue(tick.currentTime) as Cartesian3
    )
    cartographic.longitude = cesiumMath.toDegrees(cartographic.longitude)
    cartographic.latitude = cesiumMath.toDegrees(cartographic.latitude)
    // 给label赋值
    entity!.label!.text = new CallbackProperty(
      () =>
        Number(cartographic.longitude.toFixed(4)) + ',' + Number(cartographic.latitude.toFixed(4)),
      false
    )
  })
  // 设置地球的时间
  viewerRef.value!.clock.currentTime = JulianDate.fromDate(startTime) // 修改时间轴的当前时间
  viewerRef.value!.clock.stopTime = JulianDate.fromDate(new Date(stopTIme))
  viewerRef.value!.clock.clockRange = ClockRange.LOOP_STOP
  viewerRef.value!.clock.shouldAnimate = true // 开始播放
  // viewerRef.value?.zoomTo(dataSource)
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
  goSomewhere(116.391, 39.9163, 2500000.0)
  // 加载天地图文字标注图层
  loadMapFromTianditu(token, tdtUrl, subdomains)
  // 注册鼠标点击事件
  registerMouseEvent()
  // 轨迹回放
  addEntity()
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
