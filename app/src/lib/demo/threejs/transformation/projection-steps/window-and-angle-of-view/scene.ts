import {
  BufferGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene
} from "three"

/** Tweakpane で操作するパラメータ */
export type WindowAndAngleOfViewParams = {
  /** ウィンドウの 1 辺の長さ */
  windowSize: number
  /** 視点（投影中心）から投影面までの距離 */
  planeDistance: number
  /** 画角（度）。ウィンドウの大きさと投影面までの距離から計算して書き戻し、読み取り専用で表示する */
  angleOfView: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: WindowAndAngleOfViewParams
}

/** ウィンドウの 4 隅。1 辺 2 の正方形の隅を、四角形を閉じられる順に並べる */
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
]

/** 投影面として描く正方形の 1 辺。ウィンドウより大きくとり、その外側にも面が続いていることを示す */
const PLANE_SIZE = 5

/** 四角錐を描く奥行きの上限 */
const MAX_DEPTH = 6

/** 四角錐を描く広がりの上限。画角が広いときは奥行きより先にこちらが上限に達する */
const MAX_HALF_SIZE = 3

/** 画角を示す扇形の半径の上限。投影面に近いときは、そこまで届かない長さに詰める */
const ARC_RADIUS = 0.8

/** 扇形の外周（円弧）を折れ線で描く分割数 */
const ARC_SEGMENTS = 48

/** 扇形の三角形。視点（0 番）と、円弧を分割した隣り合う 2 点で 1 枚ずつ作る */
const SECTOR_FACES = Array.from({ length: ARC_SEGMENTS }, (_, i) => [0, i + 1, i + 2]).flat()

// 背景（暗めのグレー）の上で、主題である四角錐を暖色で前に出す。
// ウィンドウは視点と見分けがつくよう、どちらの寒色とも違う緑にする。
// 画角は稜線のオレンジと混ざらない薄紫にし、線だけでなく扇形に塗って区別する
const PYRAMID_COLOR = "#ffc857"
const WINDOW_COLOR = "#7fd88f"
const CENTER_COLOR = "#5ec8f2"
const ANGLE_COLOR = "#c9a4ff"
const PLANE_COLOR = "#8fa3bf"
const AXIS_COLOR = "#5a6472"

export const createWindowAndAngleOfViewScene = ({ scene, params }: SceneContext) => {
  // 1 辺 1 の正方形。投影面とウィンドウで共有し、大きさは scale で決める
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

  // 視点（投影中心）。大きさをもたない 1 つの点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  scene.add(new Points(centerGeometry, centerMaterial))

  // 視線。視点から投影面に垂直な向き（z の正の向き）へ伸びる
  const axisPosition = new Float32BufferAttribute(new Float32Array(2 * 3), 3)
  const axisGeometry = new BufferGeometry().setAttribute("position", axisPosition)
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  // ウィンドウを通して見える空間。視点を頂点とし、ウィンドウの枠を断面とする四角錐で、
  // その稜線は視点からウィンドウの 4 隅を通ってまっすぐ奥へ伸びる
  const edgePosition = new Float32BufferAttribute(new Float32Array(CORNERS.length * 6), 3)
  const edgeGeometry = new BufferGeometry().setAttribute("position", edgePosition)
  const pyramidMaterial = new LineBasicMaterial({ color: PYRAMID_COLOR })
  scene.add(new LineSegments(edgeGeometry, pyramidMaterial))

  // 画角をつくる 2 本の線。視点からウィンドウの左端・右端へ引く
  const anglePosition = new Float32BufferAttribute(new Float32Array(4 * 3), 3)
  const angleGeometry = new BufferGeometry().setAttribute("position", anglePosition)
  const angleMaterial = new LineBasicMaterial({ color: ANGLE_COLOR })
  scene.add(new LineSegments(angleGeometry, angleMaterial))

  // 画角の開き。視点を中心とする扇形として塗る。頂点は 0 番が視点で、1 番以降が円弧を
  // 分割した点。四角錐の稜線を隠さないよう、薄く塗って深度は書き込まない
  const sectorPosition = new Float32BufferAttribute(new Float32Array((ARC_SEGMENTS + 2) * 3), 3)
  const sectorGeometry = new BufferGeometry()
    .setAttribute("position", sectorPosition)
    .setIndex(SECTOR_FACES)
  const sectorMaterial = new MeshBasicMaterial({
    color: ANGLE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  })
  scene.add(new Mesh(sectorGeometry, sectorMaterial))

  // 扇形の外周の円弧。同じ頂点をたどるので、視点（0 番）だけ描画から外す
  const arcGeometry = new BufferGeometry().setAttribute("position", sectorPosition)
  arcGeometry.setDrawRange(1, ARC_SEGMENTS + 1)
  scene.add(new Line(arcGeometry, angleMaterial))

  return {
    update: () => {
      const { windowSize, planeDistance } = params
      const halfWindow = windowSize / 2

      // 画角は、視点からウィンドウの端を見込む角の 2 倍。ウィンドウの大きさと投影面までの
      // 距離の比だけで決まるので、比が同じなら見える空間も同じ
      const spread = halfWindow / planeDistance // 奥行き 1 あたりの広がり
      const halfAngle = Math.atan(spread)
      params.angleOfView = (2 * halfAngle * 180) / Math.PI

      // ウィンドウは投影面の上にあるので、位置は投影面までの距離で決まる
      projectionPlane.position.z = planeDistance
      windowFrame.position.z = planeDistance
      windowFrame.scale.set(windowSize, windowSize, 1)

      // 四角錐は、奥行きか広がりのどちらかが上限に届くところまで描く。
      // 奥の端は閉じない（クリッピング面はまだ無いので、この空間は途切れずに続く）
      const depth = Math.min(MAX_DEPTH, MAX_HALF_SIZE / spread)
      const half = spread * depth

      axisPosition.setXYZ(0, 0, 0, 0)
      axisPosition.setXYZ(1, 0, 0, depth)
      axisPosition.needsUpdate = true

      CORNERS.forEach(([cornerX, cornerY], i) => {
        edgePosition.setXYZ(i * 2, 0, 0, 0)
        edgePosition.setXYZ(i * 2 + 1, cornerX * half, cornerY * half, depth)
      })
      edgePosition.needsUpdate = true

      // 2 本の線は、視点からウィンドウの左右の辺の中央へ向かう
      anglePosition.setXYZ(0, 0, 0, 0)
      anglePosition.setXYZ(1, -halfWindow, 0, planeDistance)
      anglePosition.setXYZ(2, 0, 0, 0)
      anglePosition.setXYZ(3, halfWindow, 0, planeDistance)
      anglePosition.needsUpdate = true

      // 扇形は 2 本の線の間を埋めるので、半径は投影面までの距離より短くとる
      const radius = Math.min(ARC_RADIUS, planeDistance * 0.6)
      sectorPosition.setXYZ(0, 0, 0, 0)
      for (let i = 0; i <= ARC_SEGMENTS; i += 1) {
        const angle = -halfAngle + (2 * halfAngle * i) / ARC_SEGMENTS
        sectorPosition.setXYZ(i + 1, radius * Math.sin(angle), 0, radius * Math.cos(angle))
      }
      sectorPosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [
        squareGeometry,
        planeMaterial,
        windowGeometry,
        windowMaterial,
        centerGeometry,
        centerMaterial,
        axisGeometry,
        axisMaterial,
        edgeGeometry,
        pyramidMaterial,
        angleGeometry,
        angleMaterial,
        sectorGeometry,
        sectorMaterial,
        arcGeometry
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
