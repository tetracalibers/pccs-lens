import {
  BufferGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineLoop,
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
export type FocalLengthParams = {
  /** 焦点距離。光学中心から投影面までの、光軸に沿った距離 */
  focalLength: number
  /** 被写体の各点から光学中心へ向かう光線を表示する */
  showRays: boolean
  /** 像の倍率。焦点距離から計算して書き戻し、パネルに読み取り専用で表示する */
  magnification: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: FocalLengthParams
}

/**
 * 被写体の輪郭。上向きの矢印の右下に出っ張りを付けた、上下にも左右にも非対称な形。
 * 光軸をまたぐ位置に置くので、像が画像中心を中心に拡大縮小することを向きごと見て取れる。
 */
const SUBJECT_OUTLINE: [number, number][] = [
  [-0.35, -1],
  [-0.35, 0.2],
  [-0.75, 0.2],
  [0, 1],
  [0.75, 0.2],
  [0.35, 0.2],
  [0.35, -0.4],
  [0.85, -0.4],
  [0.85, -0.7],
  [0.35, -0.7],
  [0.35, -1]
]

/** 光学中心から被写体までの距離。被写体は z の正の向きに置く */
const SUBJECT_Z = 3

/** 投影面の 1 辺の長さ。焦点距離を変えても大きさは変わらない */
const PLANE_SIZE = 2

/** 光軸を描く奥行きの上限。被写体より先まで伸ばして、カメラが向いている方向であることを示す */
const AXIS_END = 4.2

// 背景（暗めのグレー）の上で、被写体は白に近い色、像はそれと見分けのつく暖色にする。
// 光学中心・焦点距離・画像中心は光軸まわりの一組なので同じ寒色でそろえ、
// 投影面と光線、投影面より先の光軸は一段落とした色にする
const SUBJECT_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const CENTER_COLOR = "#5ec8f2"
const FOCAL_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"
const AXIS_COLOR = "#5a6472"

/** 頂点数だけ確保した、中身が空の位置属性 */
const createEmptyPosition = (vertexCount: number) =>
  new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)

export const createFocalLengthScene = ({ scene, params }: SceneContext) => {
  // 光学中心。大きさをもたない 1 つの点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  scene.add(new Points(centerGeometry, centerMaterial))

  // 光軸。光学中心を通り、投影面に垂直な向き（z の正の向き）へ伸びる直線。
  // 光学中心から画像中心までの区間が焦点距離にあたるので、そこだけ色を分けて描く
  const focalPosition = createEmptyPosition(2)
  const focalGeometry = new BufferGeometry().setAttribute("position", focalPosition)
  const focalMaterial = new LineBasicMaterial({ color: FOCAL_COLOR })
  scene.add(new LineSegments(focalGeometry, focalMaterial))

  const axisPosition = createEmptyPosition(2)
  const axisGeometry = new BufferGeometry().setAttribute("position", axisPosition)
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  // 投影面。光軸に垂直な正方形の面。光軸に沿って動かすので、位置は update() で決める
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

  // 画像中心。光軸が投影面と交わる点なので、投影面と一緒に光軸上を動く
  const imageCenterGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const imageCenterMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  const imageCenter = new Points(imageCenterGeometry, imageCenterMaterial)
  scene.add(imageCenter)

  // 被写体。輪郭を閉じた折れ線として、光学中心から SUBJECT_Z だけ離して置く
  const subjectGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      SUBJECT_OUTLINE.flatMap(([x, y]) => [x, y, SUBJECT_Z]),
      3
    )
  )
  const subjectMaterial = new LineBasicMaterial({ color: SUBJECT_COLOR })
  scene.add(new LineLoop(subjectGeometry, subjectMaterial))

  // 被写体の各点から光学中心へ向かう光線。1 本につき 2 頂点。
  // 焦点距離を変えてもこの光線の束は変わらないので、位置は最初に決めたまま動かさない
  const rayGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      SUBJECT_OUTLINE.flatMap(([x, y]) => [x, y, SUBJECT_Z, 0, 0, 0]),
      3
    )
  )
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  const rays = new LineSegments(rayGeometry, rayMaterial)
  scene.add(rays)

  // 投影面に結ばれる像。頂点は被写体の輪郭と同じ数だけ確保して、投影の計算結果で埋める
  const imagePosition = createEmptyPosition(SUBJECT_OUTLINE.length)
  const imageGeometry = new BufferGeometry().setAttribute("position", imagePosition)
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })
  scene.add(new LineLoop(imageGeometry, imageMaterial))

  return {
    update: () => {
      const { focalLength } = params

      // 投影面は光軸に垂直なまま、焦点距離だけ光学中心から離れた位置に置く。
      // 画像中心は光軸と投影面の交点なので、投影面と同じ位置に移る
      plane.position.z = focalLength
      border.position.z = focalLength
      imageCenter.position.z = focalLength

      // 光軸のうち、光学中心から画像中心までが焦点距離。その先は投影面より奥へ抜ける
      focalPosition.setXYZ(0, 0, 0, 0)
      focalPosition.setXYZ(1, 0, 0, focalLength)
      focalPosition.needsUpdate = true
      axisPosition.setXYZ(0, 0, 0, focalLength)
      axisPosition.setXYZ(1, 0, 0, AXIS_END)
      axisPosition.needsUpdate = true

      // 光線が投影面と交わる位置が像。被写体までの距離が同じなら、
      // 像は焦点距離に比例して、画像中心を中心に相似に拡大縮小する
      const magnification = focalLength / SUBJECT_Z
      params.magnification = magnification
      SUBJECT_OUTLINE.forEach(([x, y], i) => {
        imagePosition.setXYZ(i, x * magnification, y * magnification, focalLength)
      })
      imagePosition.needsUpdate = true

      rays.visible = params.showRays
    },
    dispose: () => {
      const disposables = [
        centerGeometry,
        centerMaterial,
        focalGeometry,
        focalMaterial,
        axisGeometry,
        axisMaterial,
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        imageCenterGeometry,
        imageCenterMaterial,
        subjectGeometry,
        subjectMaterial,
        rayGeometry,
        rayMaterial,
        imageGeometry,
        imageMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
