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
export type PerspectiveParams = {
  /** 光学中心から、いちばん手前の立方体までの距離 */
  distance: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PerspectiveParams
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

/**
 * 立方体を置く位置の、光軸からのずれ。奥のものほど光軸から離しているのは、
 * 投影面上で像どうしが重ならないようにするため（大きさの違いだけを見比べられる）。
 */
const CUBE_OFFSETS: [number, number][] = [
  [-0.8, -0.5],
  [0.9, -1],
  [-1.25, 1.4],
  [1.65, 1.2]
]

/** 立方体の 1 辺の長さ。4 つとも同じ大きさで、光学中心からの距離だけが違う */
const CUBE_SIZE = 0.7

/** 立方体どうしの奥行きの間隔 */
const CUBE_SPACING = 1

/** 光学中心から投影面までの距離 */
const FOCAL_LENGTH = 2

/** 投影面の 1 辺の長さ */
const PLANE_SIZE = 2.4

// 背景（暗めのグレー）の上で、立方体は白に近い色、像はそれと見分けのつく暖色にする
const CUBE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const CENTER_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"

/** 頂点数だけ確保した、中身が空の位置属性 */
const createEmptyPosition = (vertexCount: number) =>
  new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)

export const createPerspectiveScene = ({ scene, params }: SceneContext) => {
  // 光学中心。大きさをもたない 1 つの点として原点に置く
  const centerGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const centerMaterial = new PointsMaterial({ color: CENTER_COLOR, size: 0.14 })
  scene.add(new Points(centerGeometry, centerMaterial))

  // 投影面。光学中心の前（被写体と同じ側）に、焦点距離だけ離して置く
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  plane.position.z = FOCAL_LENGTH
  scene.add(plane)

  const borderGeometry = new EdgesGeometry(planeGeometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  const border = new LineSegments(borderGeometry, borderMaterial)
  border.position.z = FOCAL_LENGTH
  scene.add(border)

  // 同じ大きさの立方体。1 つのジオメトリを 4 つで共有する
  const cubeGeometry = new BufferGeometry()
    .setAttribute(
      "position",
      new Float32BufferAttribute(
        CUBE_VERTICES.flatMap(([x, y, z]) => [x * CUBE_SIZE, y * CUBE_SIZE, z * CUBE_SIZE]),
        3
      )
    )
    .setIndex(CUBE_EDGES)
  const cubeMaterial = new LineBasicMaterial({ color: CUBE_COLOR })
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })

  // 立方体と、その像。像は稜線のつなぎ方（インデックス）を立方体と共有する
  const objects = CUBE_OFFSETS.map((offset) => {
    const cube = new LineSegments(cubeGeometry, cubeMaterial)
    scene.add(cube)

    const imagePosition = createEmptyPosition(CUBE_VERTICES.length)
    const imageGeometry = new BufferGeometry()
      .setAttribute("position", imagePosition)
      .setIndex(CUBE_EDGES)
    scene.add(new LineSegments(imageGeometry, imageMaterial))

    return { cube, offset, imagePosition, imageGeometry }
  })

  // 立方体の中心から光学中心へ向かう光線。1 本につき 2 頂点
  const rayPosition = createEmptyPosition(objects.length * 2)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  scene.add(new LineSegments(rayGeometry, rayMaterial))

  return {
    update: () => {
      objects.forEach(({ cube, offset, imagePosition }, i) => {
        const [offsetX, offsetY] = offset
        // 奥へ行くほど光学中心から遠ざかる。大きさは 4 つとも同じまま
        const centerZ = params.distance + i * CUBE_SPACING
        cube.position.set(offsetX, offsetY, centerZ)

        CUBE_VERTICES.forEach(([vertexX, vertexY, vertexZ], v) => {
          const x = offsetX + vertexX * CUBE_SIZE
          const y = offsetY + vertexY * CUBE_SIZE
          const z = centerZ + vertexZ * CUBE_SIZE
          // 光学中心（原点）とこの頂点を結ぶ直線が、投影面と交わる位置。
          // 焦点距離が同じでも、遠い頂点ほど FOCAL_LENGTH / z が小さくなり、像は小さくなる
          imagePosition.setXYZ(v, (FOCAL_LENGTH * x) / z, (FOCAL_LENGTH * y) / z, FOCAL_LENGTH)
        })
        imagePosition.needsUpdate = true

        // 光線は立方体の中心から光学中心へ向かい、その途中で投影面を通る
        rayPosition.setXYZ(i * 2, offsetX, offsetY, centerZ)
        rayPosition.setXYZ(i * 2 + 1, 0, 0, 0)
      })
      rayPosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [
        centerGeometry,
        centerMaterial,
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        cubeGeometry,
        cubeMaterial,
        imageMaterial,
        rayGeometry,
        rayMaterial,
        ...objects.map(({ imageGeometry }) => imageGeometry)
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
