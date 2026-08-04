import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Euler,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type PerspectiveProjectionParams = {
  /** 投影中心から投影面までの距離 */
  planeDistance: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PerspectiveProjectionParams
}

/** 投影面の 1 辺の長さ */
const PLANE_SIZE = 2.2

// 背景（暗めのグレー）の上で、形状は白に近い色、像はそれと見分けのつく暖色にする。
// 投射線と投影面は一段落とした色にして、形状と像を前に出す
const SHAPE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const CENTER_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"

export const createPerspectiveProjectionScene = ({ scene, params }: SceneContext) => {
  // 投影中心。投射線が集まる 1 点で、大きさをもたない点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  scene.add(new Points(centerGeometry, centerMaterial))

  // 投影面。投影中心の前（形状と同じ側）に置いた正方形の面。
  // 投影中心からどれだけ離すかは update() で反映する
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  scene.add(plane)

  const borderGeometry = new EdgesGeometry(planeGeometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  const border = new LineSegments(borderGeometry, borderMaterial)
  scene.add(border)

  // 投影する形状。透視投影での歪み方が形ごとに違うので、平らな板・曲面・角のある立体を混ぜる。
  // どれも投影中心の前（z の正の側）に、投影中心からの距離を変えて置く
  const shapeMaterial = new LineBasicMaterial({ color: SHAPE_COLOR })
  const shapes = [
    {
      // 円柱。投影面に正対していない円は、像の上では楕円になる
      geometry: new CylinderGeometry(0.4, 0.4, 1.05, 12),
      position: new Vector3(-0.88, 0.6, 3),
      rotation: new Euler(0.55, 0, 0.45)
    },
    {
      // 立方体。投影面に正対していない面は、像の上では正方形ではなく台形になる
      geometry: new BoxGeometry(0.9, 0.9, 0.9),
      position: new Vector3(0.86, -1, 4.3),
      rotation: new Euler(0.25, -0.5, 0)
    },
    {
      // 奥行きに長い直方体。手前の面ほど大きく写り、奥行き方向の稜線は像の上で狭まっていく
      geometry: new BoxGeometry(0.75, 0.75, 1.5),
      position: new Vector3(1.03, 1.25, 5.5),
      rotation: new Euler(0, 0.25, 0)
    }
  ].map(({ geometry, position, rotation }) => {
    // 稜線だけを線で描く。もとのジオメトリは稜線を取り出したら要らない
    const edgesGeometry = new EdgesGeometry(geometry)
    geometry.dispose()

    const shape = new LineSegments(edgesGeometry, shapeMaterial)
    shape.position.copy(position)
    shape.rotation.copy(rotation)
    // 投影の計算には世界座標での頂点位置が必要なので、行列を作っておく
    shape.updateMatrixWorld()
    scene.add(shape)

    // 稜線の頂点を世界座標に直したもの。投射線と像はこの位置から求める
    const localPosition = edgesGeometry.getAttribute("position")
    const vertices = Array.from({ length: localPosition.count }, (_, i) =>
      new Vector3().fromBufferAttribute(localPosition, i).applyMatrix4(shape.matrixWorld)
    )

    return { edgesGeometry, vertices }
  })

  // 投射線。稜線の頂点 1 つにつき 1 本（2 頂点）、頂点から投影中心へ引く。
  // どの頂点も同じ 1 点へ向かうので、投影面をどこに置いても投射線は変わらない
  const rayVertices = shapes.flatMap(({ vertices }) => vertices)
  const rayPosition = new Float32BufferAttribute(new Float32Array(rayVertices.length * 6), 3)
  rayVertices.forEach(({ x, y, z }, i) => {
    rayPosition.setXYZ(i * 2, x, y, z)
    rayPosition.setXYZ(i * 2 + 1, 0, 0, 0)
  })
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  scene.add(new LineSegments(rayGeometry, rayMaterial))

  // 投影面に写る像。形状 1 つにつき 1 つで、稜線のつなぎ方は形状と同じ
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })
  const images = shapes.map(({ vertices }) => {
    const imagePosition = new Float32BufferAttribute(new Float32Array(vertices.length * 3), 3)
    const imageGeometry = new BufferGeometry().setAttribute("position", imagePosition)
    scene.add(new LineSegments(imageGeometry, imageMaterial))
    return { imagePosition, imageGeometry, vertices }
  })

  return {
    update: () => {
      // 投影面は投影中心の前（形状と同じ側）に置く
      const planeZ = params.planeDistance
      plane.position.z = planeZ
      border.position.z = planeZ

      images.forEach(({ imagePosition, vertices }) => {
        vertices.forEach(({ x, y, z }, i) => {
          // 頂点と投影中心（原点）を結ぶ直線が投影面 z = planeZ と交わる位置は、
          // 投影面に平行な向きの座標を planeZ / z 倍したもの。
          // 投影中心から遠い頂点ほど倍率が小さくなるので、1 つの形状の中でも
          // 手前と奥で縮み方が変わり、像は歪んで写る
          const scale = planeZ / z
          imagePosition.setXYZ(i, x * scale, y * scale, planeZ)
        })
        imagePosition.needsUpdate = true
      })
    },
    dispose: () => {
      const disposables = [
        centerGeometry,
        centerMaterial,
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        shapeMaterial,
        rayGeometry,
        rayMaterial,
        imageMaterial,
        ...shapes.map(({ edgesGeometry }) => edgesGeometry),
        ...images.map(({ imageGeometry }) => imageGeometry)
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
