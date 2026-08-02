import {
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
export type ProjectionCenterParams = {
  /** 投影面から投影中心までの距離 */
  distance: number
  /** 投影中心を無限に遠ざける（＝平行投影にする） */
  atInfinity: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: ProjectionCenterParams
}

/** 1 辺 1 の立方体の 8 頂点（中心が原点） */
const CUBE_VERTICES: [number, number, number][] = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, 0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5]
]

/** 立方体の稜線。結ぶ 2 頂点の番号を並べる */
const CUBE_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/** 立方体の 1 辺の長さ */
const CUBE_SIZE = 1.2

/** 投影面から立方体の中心までの距離 */
const CUBE_DISTANCE = 1.5

/** 投影する形状の頂点。投影面（z = 0）の手前に、光軸をまたぐように立方体を置く */
const VERTICES: [number, number, number][] = CUBE_VERTICES.map(([x, y, z]) => [
  x * CUBE_SIZE,
  y * CUBE_SIZE,
  z * CUBE_SIZE + CUBE_DISTANCE
])

/** 投影面の 1 辺の長さ */
const PLANE_SIZE = 2.4

/** 平行投影のとき、投影線を投影面の向こう側へ伸ばす長さ */
const RAY_TAIL = 1.5

// 背景（暗めのグレー）の上で、形状は白に近い色、像はそれと見分けのつく暖色にする
const SHAPE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const CENTER_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"

export const createProjectionCenterScene = ({ scene, params }: SceneContext) => {
  // 投影面。z = 0 に置いた正方形の面
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  scene.add(new Mesh(planeGeometry, planeMaterial))

  const borderGeometry = new EdgesGeometry(planeGeometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  scene.add(new LineSegments(borderGeometry, borderMaterial))

  // 投影する形状。投影面の手前（z の正の側）に立方体を 1 つ置く
  const shapeGeometry = new BufferGeometry()
    .setAttribute("position", new Float32BufferAttribute(VERTICES.flat(), 3))
    .setIndex(CUBE_EDGES)
  const shapeMaterial = new LineBasicMaterial({ color: SHAPE_COLOR })
  scene.add(new LineSegments(shapeGeometry, shapeMaterial))

  // 投影中心。投影面の向こう側（z の負の側）に、大きさをもたない 1 つの点として置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  const center = new Points(centerGeometry, centerMaterial)
  scene.add(center)

  // 投影面に写る像。稜線のつなぎ方（インデックス）は形状と同じ
  const imagePosition = new Float32BufferAttribute(new Float32Array(VERTICES.length * 3), 3)
  const imageGeometry = new BufferGeometry()
    .setAttribute("position", imagePosition)
    .setIndex(CUBE_EDGES)
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })
  scene.add(new LineSegments(imageGeometry, imageMaterial))

  // 投影線。形状の頂点 1 つにつき 1 本（2 頂点）
  const rayPosition = new Float32BufferAttribute(new Float32Array(VERTICES.length * 6), 3)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  scene.add(new LineSegments(rayGeometry, rayMaterial))

  return {
    update: () => {
      const { distance, atInfinity } = params

      // 無限に遠ざけた投影中心は空間のどこにも置けないので、点としては描かない
      center.position.z = -distance
      center.visible = !atInfinity

      VERTICES.forEach(([x, y, z], i) => {
        // 投影中心 (0, 0, -distance) と頂点を結ぶ直線が投影面 z = 0 と交わる位置は、
        // 投影面に平行な向きの座標を distance / (distance + z) 倍したもの。
        // 投影中心を遠ざけるほどこの倍率は 1 に近づき、無限遠では縮まなくなる
        const scale = atInfinity ? 1 : distance / (distance + z)
        imagePosition.setXYZ(i, x * scale, y * scale, 0)

        // 投影線は頂点から投影中心へ向かう。無限遠では 1 点に集まらず、
        // 投影面に垂直なまま向こう側へ抜けていく
        rayPosition.setXYZ(i * 2, x, y, z)
        if (atInfinity) rayPosition.setXYZ(i * 2 + 1, x, y, -RAY_TAIL)
        else rayPosition.setXYZ(i * 2 + 1, 0, 0, -distance)
      })
      imagePosition.needsUpdate = true
      rayPosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        shapeGeometry,
        shapeMaterial,
        centerGeometry,
        centerMaterial,
        imageGeometry,
        imageMaterial,
        rayGeometry,
        rayMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
