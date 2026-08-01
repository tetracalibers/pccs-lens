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
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene
} from "three"

/** Tweakpane で操作するパラメータ */
export type AngleOfViewParams = {
  /** 光学中心から投影面までの距離 */
  focalLength: number
  /** 投影面の 1 辺の長さ */
  planeSize: number
  /** 画角（度）。焦点距離と投影面の大きさから計算して書き戻し、パネルに読み取り専用で表示する */
  angleOfView: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: AngleOfViewParams
}

/** 投影面の 4 隅。1 辺 2 の正方形の隅を、四角形を閉じられる順に並べる */
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
]

/** 空間に置く立方体の中心。すべて同じ大きさで、光軸から離れているものほど画角から外れやすい */
const CUBE_POSITIONS: [number, number, number][] = [
  [0, 0, 2.8],
  [0.7, 0.3, 3.4],
  [-1, 0.45, 3],
  [1.9, -0.6, 3.6],
  [-2.6, 0.9, 3.6]
]

/** 立方体の 1 辺の長さ */
const CUBE_SIZE = 0.5

/** 視錐台を描く奥行きの上限 */
const MAX_DEPTH = 5

/** 視錐台を描く広がりの上限。広角では奥行きより先にこちらが上限に達する */
const MAX_HALF_SIZE = 2.8

// 背景（暗めのグレー）の上で、主題である視錐台を暖色で前に出す。
// 立体は写るものを白に近い色、写らないものを背景寄りの暗い色にして明暗で分ける
const FRUSTUM_COLOR = "#ffc857"
const INSIDE_COLOR = "#e8e8ee"
const OUTSIDE_COLOR = "#565b66"
const CENTER_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"
const AXIS_COLOR = "#5a6472"

/** 光学中心から見た点が画角の内側にあるか。spread は奥行き 1 あたりの広がり */
const isInsideAngleOfView = ([x, y, z]: [number, number, number], spread: number) =>
  Math.abs(x) <= spread * z && Math.abs(y) <= spread * z

export const createAngleOfViewScene = ({ scene, params }: SceneContext) => {
  // 光学中心。大きさをもたない 1 つの点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  scene.add(new Points(centerGeometry, centerMaterial))

  // 光軸。光学中心から投影面に垂直な向き（z の正の向き）へ伸びる直線
  const axisGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0, 0, 0, MAX_DEPTH], 3)
  )
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  // 投影面。1 辺 1 の正方形として作り、大きさと位置は update() で決める
  const planeGeometry = new PlaneGeometry(1, 1)
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

  // 視錐台。光学中心から投影面の 4 隅を通って奥へ伸びる 4 本の稜線と、その先を閉じる四角形
  const frustumPosition = new Float32BufferAttribute(new Float32Array(16 * 3), 3)
  const frustumGeometry = new BufferGeometry().setAttribute("position", frustumPosition)
  const frustumMaterial = new LineBasicMaterial({ color: FRUSTUM_COLOR })
  scene.add(new LineSegments(frustumGeometry, frustumMaterial))

  // 空間に置く立方体。写るものと写らないものはマテリアルの色で分ける
  const boxGeometry = new BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
  const cubeGeometry = new EdgesGeometry(boxGeometry)
  const insideMaterial = new LineBasicMaterial({ color: INSIDE_COLOR })
  const outsideMaterial = new LineBasicMaterial({ color: OUTSIDE_COLOR })
  const cubes = CUBE_POSITIONS.map((position) => {
    const cube = new LineSegments(cubeGeometry, insideMaterial)
    cube.position.set(...position)
    scene.add(cube)
    return { cube, position }
  })

  return {
    update: () => {
      const { focalLength, planeSize } = params

      // 画角は、光学中心から投影面の端を見込む角の 2 倍。投影面の大きさと焦点距離だけで決まる
      const spread = planeSize / 2 / focalLength // 奥行き 1 あたりの広がり
      params.angleOfView = (2 * Math.atan(spread) * 180) / Math.PI

      // 投影面は光軸に垂直なまま、焦点距離だけ光学中心から離れた位置に置く
      plane.scale.set(planeSize, planeSize, 1)
      plane.position.z = focalLength
      border.scale.copy(plane.scale)
      border.position.z = focalLength

      // 視錐台は、奥行きか広がりのどちらかが上限に届くところまで描く
      const depth = Math.min(MAX_DEPTH, MAX_HALF_SIZE / spread)
      const half = spread * depth
      CORNERS.forEach(([cornerX, cornerY], i) => {
        // 稜線は光学中心から投影面の隅を通り、まっすぐ奥へ伸びる
        frustumPosition.setXYZ(i * 2, 0, 0, 0)
        frustumPosition.setXYZ(i * 2 + 1, cornerX * half, cornerY * half, depth)

        // 奥の端を四角形で閉じる
        const [nextX, nextY] = CORNERS[(i + 1) % CORNERS.length]
        frustumPosition.setXYZ(8 + i * 2, cornerX * half, cornerY * half, depth)
        frustumPosition.setXYZ(8 + i * 2 + 1, nextX * half, nextY * half, depth)
      })
      frustumPosition.needsUpdate = true

      // 画角の内側に入っている立体だけが投影面に写る
      cubes.forEach(({ cube, position }) => {
        cube.material = isInsideAngleOfView(position, spread) ? insideMaterial : outsideMaterial
      })
    },
    dispose: () => {
      const disposables = [
        centerGeometry,
        centerMaterial,
        axisGeometry,
        axisMaterial,
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        frustumGeometry,
        frustumMaterial,
        boxGeometry,
        cubeGeometry,
        insideMaterial,
        outsideMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
