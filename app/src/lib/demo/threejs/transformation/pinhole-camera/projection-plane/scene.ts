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
export type ProjectionPlaneParams = {
  /** 投影面を光学中心の前（被写体と同じ側）に置く */
  frontPlane: boolean
  /** 光学中心から投影面までの距離 */
  planeDistance: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: ProjectionPlaneParams
}

/**
 * 被写体の輪郭。上向きの矢印の右下に出っ張りを付けた、上下にも左右にも非対称な形。
 * 像が反転しているかどうかを、向きだけで見て取れるようにしている。
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

/** 投影面の 1 辺の長さ */
const PLANE_SIZE = 2

// 背景（暗めのグレー）の上で、被写体は白に近い色、像はそれと見分けのつく暖色にする。
// 光線と投影面は一段落とした色にして、被写体と像を前に出す
const SUBJECT_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const CENTER_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"

/** 頂点数だけ確保した、中身が空の位置属性 */
const createEmptyPosition = (vertexCount: number) =>
  new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)

export const createProjectionPlaneScene = ({ scene, params }: SceneContext) => {
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

  // 光学中心。大きさをもたない 1 つの点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  scene.add(new Points(centerGeometry, centerMaterial))

  // 投影面。光軸に垂直な正方形の面。光学中心の前後どちらに置くかは update() で決める
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

  // 投影面に結ばれる像。頂点は被写体の輪郭と同じ数だけ確保して、投影の計算結果で埋める
  const imagePosition = createEmptyPosition(SUBJECT_OUTLINE.length)
  const imageGeometry = new BufferGeometry().setAttribute("position", imagePosition)
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })
  scene.add(new LineLoop(imageGeometry, imageMaterial))

  // 被写体の各点から光学中心へ向かう光線。1 本につき 2 頂点
  const rayPosition = createEmptyPosition(SUBJECT_OUTLINE.length * 2)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  scene.add(new LineSegments(rayGeometry, rayMaterial))

  /** 被写体上の点 (x, y, SUBJECT_Z) と光学中心を結ぶ直線が、z = targetZ の面と交わる位置 */
  const intersectAt = (x: number, y: number, targetZ: number): [number, number, number] => [
    (targetZ * x) / SUBJECT_Z,
    (targetZ * y) / SUBJECT_Z,
    targetZ
  ]

  return {
    update: () => {
      // 投影面を光学中心の前（被写体と同じ側）に置くか、後ろに置くか
      const planeZ = params.frontPlane ? params.planeDistance : -params.planeDistance
      plane.position.z = planeZ
      border.position.z = planeZ

      SUBJECT_OUTLINE.forEach(([x, y], i) => {
        // 投影面が後ろ（planeZ < 0）にあるとき、像の位置は被写体と符号が逆になる＝反転する
        const [imageX, imageY] = intersectAt(x, y, planeZ)
        imagePosition.setXYZ(i, imageX, imageY, planeZ)

        // 光線は被写体の点から光学中心へ向かい、投影面が後ろにあるときは
        // 光学中心を通り抜けて投影面まで伸びる
        const rayEnd = intersectAt(x, y, Math.min(planeZ, 0))
        rayPosition.setXYZ(i * 2, x, y, SUBJECT_Z)
        rayPosition.setXYZ(i * 2 + 1, ...rayEnd)
      })
      imagePosition.needsUpdate = true
      rayPosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [
        subjectGeometry,
        subjectMaterial,
        centerGeometry,
        centerMaterial,
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        imageGeometry,
        imageMaterial,
        rayGeometry,
        rayMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
