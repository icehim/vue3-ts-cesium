<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import {
  type Cartesian2,
  Cartesian3,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme,
  Math as cesiumMath,
  ImageryLayer,
  createElevationBandMaterial,
  Color,
  CesiumTerrainProvider
} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import { GUI } from 'dat.gui'

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

const elevationBand = () => {
  const controls = {
    height: 100,
    interal: 10,
    color1: '#ff0000',
    color2: '#00ff00'
  }
  const gui = new GUI()

  const guiElement = document.querySelector('.dg') as HTMLElement
  if (guiElement) {
    guiElement.style.position = 'absolute'
    guiElement.style.top = '10px'
    guiElement.style.right = '10px'
  }

  const folder = gui.addFolder('菜单')

  const heightParam = folder.add(controls, 'height', 100, 1000)

  heightParam.onChange((param) => {
    console.log('heightParam', param)
    createMaterial()
  })
  const intervalParam = folder.add(controls, 'interal', 1, 500)
  intervalParam.onChange((param) => {
    console.log('intervalParam', param)
    createMaterial()
  })

  const color1Param = folder.addColor(controls, 'color1')
  color1Param.onChange((param) => {
    console.log('color1Param', param)
    createMaterial()
  })

  const color2Param = folder.addColor(controls, 'color2')
  color2Param.onChange((param) => {
    console.log('color2Param', param)
    createMaterial()
  })

  folder.open()
  createMaterial()

  function createMaterial() {
    const material = createElevationBandMaterial({
      scene: viewerRef.value!.scene,
      layers: [
        {
          entries: [
            { height: controls.height, color: Color.fromCssColorString(controls.color1) },
            {
              height: controls.height + controls.interal,
              color: Color.fromCssColorString(controls.color2)
            }
          ]
        }
      ]
    })
    viewerRef.value!.scene.globe.material = material
  }
  const material = createElevationBandMaterial({
    scene: viewerRef.value!.scene,
    layers: [
      {
        entries: [
          { height: 300, color: Color.RED },
          { height: 500, color: Color.BLUE }
        ]
      }
    ]
  })
  viewerRef.value!.scene.globe.material = material
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
    ),
    // 获取地形数据
    terrainProvider: await CesiumTerrainProvider.fromIonAssetId(3956, {
      requestWaterMask: true, //请求水体效果所需要的海岸线数据
      requestVertexNormals: true //请求地形照明数据
    })
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
  // 地形高程自由设色，elevationBand，界面工具datGUI
  elevationBand()
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
