import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer
} from "three"

/** Tweakpane で操作するパラメータ */
export type ViewVolumeParams = {
  /** 投影の種類 */
  projection: "perspective" | "orthographic"
  /** ウィンドウの 1 辺の長さ */
  windowSize: number
  /** 投影中心から投影面までの距離 */
  planeDistance: number
  /** 前方クリッピング面の奥行き */
  near: number
  /** 後方クリッピング面の奥行き */
  far: number
  /** 視野角の表示。scene.ts が計算して書き戻す（平行投影にはないので初期値は使われない） */
  fieldOfView: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  params: ViewVolumeParams
}

/** 1 辺 2 の正方形の 4 隅。四角形を閉じられる順に並べる */
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
]

/**
 * ビューボリュームの稜線。結ぶ 2 隅の番号を並べる。
 * 前半の 4 つが前方クリッピング面、後半の 4 つが後方クリッピング面の隅
 */
const VOLUME_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/** ビューボリュームを囲む 6 面。面を決めるのに要る 3 隅ずつを選ぶ */
const VOLUME_FACES: [number, number, number][] = [
  [0, 1, 2], // 前方クリッピング面
  [4, 5, 6], // 後方クリッピング面
  [0, 3, 7], // 左
  [1, 5, 6], // 右
  [0, 4, 5], // 下
  [2, 3, 7] // 上
]

/** 投影面として描く正方形の 1 辺。ウィンドウより大きくとり、その外側にも面が続いていることを示す */
const PLANE_SIZE = 5

/** 投影線と視線を描く奥行きの上限。後方クリッピング面より先まで伸ばす */
const MAX_DEPTH = 9

/** 平行投影で、投影線を投影面の手前側へ伸ばす長さ */
const RAY_TAIL = 1.5

/** 空間に置く立方体の 1 辺の長さ */
const CUBE_SIZE = 0.5

/**
 * 立方体の中心。初期状態で、内側にあるもの・クリッピング面や側面をまたぐもの・
 * 外側にあるものがそろうように置く
 */
const CUBE_POSITIONS: [number, number, number][] = [
  [0, 0.1, 2.2],
  [-0.1, -0.05, 1.3],
  [1.5, 0.35, 4.2],
  [-0.6, -0.5, 6.2],
  [-2.4, 0.6, 3.4]
]

// 背景（暗めのグレー）の上で、主題であるビューボリュームを暖色で前に出す。
// ウィンドウは投影中心と見分けがつくよう、どちらの寒色とも違う緑にする
const VOLUME_COLOR = "#ffc857"
const WINDOW_COLOR = "#7fd88f"
const CENTER_COLOR = "#5ec8f2"
const KEPT_COLOR = "#e8e8ee"
const REMOVED_COLOR = "#565b66"
const RAY_COLOR = "#7d8794"
const PLANE_COLOR = "#8fa3bf"
const AXIS_COLOR = "#5a6472"

export const createViewVolumeScene = ({ scene, renderer, params }: SceneContext) => {
  // マテリアルごとのクリッピング（ビューボリュームの外を描かない）を有効にする
  renderer.localClippingEnabled = true

  // 1 辺 1 の正方形。投影面・ウィンドウ・2 枚のクリッピング面で共有し、大きさは scale で決める
  const squareGeometry = new PlaneGeometry(1, 1)

  // 投影面。視線に垂直な平面で、本来はどこまでも広がっている
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.1
  })
  const projectionPlane = new Mesh(squareGeometry, planeMaterial)
  projectionPlane.scale.set(PLANE_SIZE, PLANE_SIZE, 1)
  scene.add(projectionPlane)

  // ウィンドウ。投影面の上に置いた長方形の枠で、この内側に写ったものだけを画像にする
  const windowGeometry = new EdgesGeometry(squareGeometry)
  const windowMaterial = new LineBasicMaterial({ color: WINDOW_COLOR })
  const windowFrame = new LineSegments(windowGeometry, windowMaterial)
  scene.add(windowFrame)

  // 視線。投影座標系の z 軸で、投影中心から奥へ伸びる
  const axisGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, -RAY_TAIL, 0, 0, MAX_DEPTH], 3)
  )
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  // 投影中心。大きさをもたない 1 つの点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  const center = new Points(centerGeometry, centerMaterial)
  scene.add(center)

  // ウィンドウの 4 隅を通る投影線のうち、切り取られる部分。
  // 隅 1 つにつき、前方クリッピング面より手前と後方クリッピング面より奥の 2 本を描く
  const rayPosition = new Float32BufferAttribute(new Float32Array(CORNERS.length * 12), 3)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  scene.add(new LineSegments(rayGeometry, rayMaterial))

  // ビューボリューム。8 隅の位置はパラメータが動くたびに求め直す
  const volumePosition = new Float32BufferAttribute(new Float32Array(8 * 3), 3)
  const volumeGeometry = new BufferGeometry()
    .setAttribute("position", volumePosition)
    .setIndex(VOLUME_EDGES)
  const volumeMaterial = new LineBasicMaterial({ color: VOLUME_COLOR })
  scene.add(new LineSegments(volumeGeometry, volumeMaterial))

  // 前方・後方クリッピング面。ビューボリュームを奥行き方向で区切る 2 枚
  const capMaterial = new MeshBasicMaterial({
    color: VOLUME_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.1
  })
  const nearCap = new Mesh(squareGeometry, capMaterial)
  const farCap = new Mesh(squareGeometry, capMaterial)
  scene.add(nearCap, farCap)

  // ビューボリュームを囲む 6 面。形状を切り取るのに使う
  const clippingPlanes = VOLUME_FACES.map(() => new Plane())

  // 空間に置く立方体。同じ位置に 2 つ重ね、クリッピングで残る部分と取り除かれる部分を描き分ける
  const boxGeometry = new BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
  const cubeGeometry = new EdgesGeometry(boxGeometry)
  const removedMaterial = new LineBasicMaterial({ color: REMOVED_COLOR })
  const keptMaterial = new LineBasicMaterial({ color: KEPT_COLOR, clippingPlanes })
  CUBE_POSITIONS.forEach((position) => {
    const removed = new LineSegments(cubeGeometry, removedMaterial)
    removed.position.set(...position)
    scene.add(removed)

    const kept = new LineSegments(cubeGeometry, keptMaterial)
    kept.position.set(...position)
    // 取り除かれる部分と線が重なるので、そのあとに描いて上書きする
    kept.renderOrder = 1
    scene.add(kept)
  })

  const corners = Array.from({ length: 8 }, () => new Vector3())
  const centroid = new Vector3()

  return {
    update: () => {
      const { windowSize, planeDistance, near, far } = params
      const isOrthographic = params.projection === "orthographic"
      const halfWindow = windowSize / 2

      // 視野角は、ウィンドウの端を投影中心から見込む角の 2 倍。
      // 平行投影では投影中心が無限遠にあるので、見込む角としての視野角はない
      params.fieldOfView = isOrthographic
        ? "—"
        : `${((2 * Math.atan(halfWindow / planeDistance) * 180) / Math.PI).toFixed(1)}°`

      // 奥行き depth での断面の半分の大きさ。透視投影では投影線が投影中心から放射状に
      // 広がるので奥行きに比例し、平行投影では投影線が平行なのでどこでも変わらない
      const halfAt = (depth: number) =>
        isOrthographic ? halfWindow : (halfWindow * depth) / planeDistance

      // ウィンドウは投影面の上にあるので、位置は投影面までの距離で決まる
      projectionPlane.position.z = planeDistance
      windowFrame.position.z = planeDistance
      windowFrame.scale.set(windowSize, windowSize, 1)

      // 無限に遠ざけた投影中心は空間のどこにも置けないので、平行投影では描かない
      center.visible = !isOrthographic

      // ビューボリュームの 8 隅は、2 枚のクリッピング面それぞれの奥行きでの断面の 4 隅
      const nearHalf = halfAt(near)
      const farHalf = halfAt(far)
      CORNERS.forEach(([cornerX, cornerY], i) => {
        corners[i].set(cornerX * nearHalf, cornerY * nearHalf, near)
        corners[i + 4].set(cornerX * farHalf, cornerY * farHalf, far)
      })
      corners.forEach(({ x, y, z }, i) => volumePosition.setXYZ(i, x, y, z))
      volumePosition.needsUpdate = true

      // 投影線のうち、2 枚のクリッピング面の外側に出る部分。
      // 内側に残る部分はビューボリュームの稜線そのものなので、ここでは描かない
      const tailHalf = halfAt(MAX_DEPTH)
      CORNERS.forEach(([cornerX, cornerY], i) => {
        // 手前側。透視投影では投影中心から、平行投影では視線に平行に伸びてくる
        if (isOrthographic) {
          rayPosition.setXYZ(i * 4, cornerX * halfWindow, cornerY * halfWindow, -RAY_TAIL)
        } else {
          rayPosition.setXYZ(i * 4, 0, 0, 0)
        }
        rayPosition.setXYZ(i * 4 + 1, cornerX * nearHalf, cornerY * nearHalf, near)

        // 奥側。切り取られなければどこまでも伸びていく
        rayPosition.setXYZ(i * 4 + 2, cornerX * farHalf, cornerY * farHalf, far)
        rayPosition.setXYZ(i * 4 + 3, cornerX * tailHalf, cornerY * tailHalf, MAX_DEPTH)
      })
      rayPosition.needsUpdate = true

      nearCap.position.z = near
      nearCap.scale.set(nearHalf * 2, nearHalf * 2, 1)
      farCap.position.z = far
      farCap.scale.set(farHalf * 2, farHalf * 2, 1)

      // 形状を切り取る 6 面を 8 隅から作る。3 隅から作った面は表裏が定まらないので、
      // ビューボリュームの重心が正の側（残す側）に来るように向きをそろえる
      centroid.set(0, 0, 0)
      corners.forEach((corner) => centroid.add(corner))
      centroid.multiplyScalar(1 / corners.length)
      VOLUME_FACES.forEach(([a, b, c], i) => {
        const plane = clippingPlanes[i]
        plane.setFromCoplanarPoints(corners[a], corners[b], corners[c])
        if (plane.distanceToPoint(centroid) < 0) plane.negate()
      })
    },
    dispose: () => {
      const disposables = [
        squareGeometry,
        planeMaterial,
        windowGeometry,
        windowMaterial,
        axisGeometry,
        axisMaterial,
        centerGeometry,
        centerMaterial,
        rayGeometry,
        rayMaterial,
        volumeGeometry,
        volumeMaterial,
        capMaterial,
        boxGeometry,
        cubeGeometry,
        removedMaterial,
        keptMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
