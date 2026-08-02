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
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  ShapeGeometry
} from "three"

/** Tweakpane で操作するパラメータ */
export type PinholeSelectionParams = {
  /** 光を出す点の横位置 */
  pointX: number
  /** 光を出す点の縦位置 */
  pointY: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PinholeSelectionParams
}

/** 被写体の輪郭。光を出す点がどこにあるかの目安になる */
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

/** 穴のある面から被写体までの距離。被写体は z の正の向きに置く */
const SUBJECT_Z = 3

/** 箱の奥行き。穴のある面を z = 0、像ができる面を z = -BOX_DEPTH に置く */
const BOX_DEPTH = 1.6

/** 箱の面の 1 辺の長さ */
const WALL_SIZE = 2.4
const HALF_WALL = WALL_SIZE / 2

/** ピンホールの半径。針の先ほどの小ささにする */
const HOLE_RADIUS = 0.1

/** ピンホールの円を描く分割数 */
const HOLE_SEGMENTS = 32

/** 点から箱へ向かう光線の本数 */
const RAY_COUNT = 14

/** 黄金角。光の当たる位置を面の上に均して散らすために使う */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** 箱の 4 隅。1 辺 2 の正方形の隅 */
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
]

// 背景（暗めのグレー）の上で、穴を通り抜けた光とそれが作る明るい点だけを暖色で前に出す。
// 通れなかった光は数が多いので、箱や被写体より少しだけ明るい程度に抑える
const POINT_COLOR = "#e8e8ee"
const PASS_COLOR = "#ffc857"
const IMAGE_COLOR = "#c99a45"
const RAY_COLOR = "#6b7484"
const SUBJECT_COLOR = "#e8e8ee"
const WALL_COLOR = "#8fa3bf"
const HOLE_COLOR = "#5ec8f2"
const BOX_COLOR = "#4a515c"

/**
 * 点から出た光が、穴のある面のどこに当たるか。
 * 面の上に渦巻き状に散らして、四方八方へ出た光のうち箱に向かうぶんを均して並べる。
 * 最初の 1 本（index が 0）だけは、穴へまっすぐ向かった光になる。
 */
const wallTarget = (index: number, count: number): [number, number] => {
  const radius = HALF_WALL * Math.sqrt(index / (count - 1))
  const angle = GOLDEN_ANGLE * index
  return [radius * Math.cos(angle), radius * Math.sin(angle)]
}

/** 頂点数だけ確保した、中身が空の位置属性 */
const createEmptyPosition = (vertexCount: number) =>
  new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)

export const createPinholeSelectionScene = ({ scene, params }: SceneContext) => {
  // 穴のある面。正方形の面に、半径 HOLE_RADIUS の穴を 1 つ開ける
  const wallShape = new Shape()
  wallShape.moveTo(-HALF_WALL, -HALF_WALL)
  wallShape.lineTo(HALF_WALL, -HALF_WALL)
  wallShape.lineTo(HALF_WALL, HALF_WALL)
  wallShape.lineTo(-HALF_WALL, HALF_WALL)
  const holePath = new Path()
  holePath.absarc(0, 0, HOLE_RADIUS, 0, Math.PI * 2, true)
  wallShape.holes.push(holePath)

  const frontWallGeometry = new ShapeGeometry(wallShape, HOLE_SEGMENTS)
  const wallMaterial = new MeshBasicMaterial({
    color: WALL_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  scene.add(new Mesh(frontWallGeometry, wallMaterial))

  // 像ができる面。穴のある面と向かい合わせに、箱の奥行きだけ離して置く
  const backWallGeometry = new PlaneGeometry(WALL_SIZE, WALL_SIZE)
  const backWall = new Mesh(backWallGeometry, wallMaterial)
  backWall.position.z = -BOX_DEPTH
  scene.add(backWall)

  const borderGeometry = new EdgesGeometry(backWallGeometry)
  const borderMaterial = new LineBasicMaterial({ color: WALL_COLOR })
  scene.add(new LineSegments(borderGeometry, borderMaterial))
  const backBorder = new LineSegments(borderGeometry, borderMaterial)
  backBorder.position.z = -BOX_DEPTH
  scene.add(backBorder)

  // 箱の稜線。2 つの面の隅どうしを結ぶ
  const boxGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      CORNERS.flatMap(([x, y]) => [
        x * HALF_WALL,
        y * HALF_WALL,
        0,
        x * HALF_WALL,
        y * HALF_WALL,
        -BOX_DEPTH
      ]),
      3
    )
  )
  const boxMaterial = new LineBasicMaterial({ color: BOX_COLOR })
  scene.add(new LineSegments(boxGeometry, boxMaterial))

  // ピンホール。穴の縁を円で描く
  const holeGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      Array.from({ length: HOLE_SEGMENTS }, (_, i) => {
        const angle = (i / HOLE_SEGMENTS) * Math.PI * 2
        return [Math.cos(angle) * HOLE_RADIUS, Math.sin(angle) * HOLE_RADIUS, 0]
      }).flat(),
      3
    )
  )
  const holeMaterial = new LineBasicMaterial({ color: HOLE_COLOR })
  scene.add(new LineLoop(holeGeometry, holeMaterial))

  // 被写体。輪郭を閉じた折れ線として、穴のある面から SUBJECT_Z だけ離して置く
  const subjectGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      SUBJECT_OUTLINE.flatMap(([x, y]) => [x, y, SUBJECT_Z]),
      3
    )
  )
  const subjectMaterial = new LineBasicMaterial({ color: SUBJECT_COLOR })
  scene.add(new LineLoop(subjectGeometry, subjectMaterial))

  // 奥の面に浮かび上がる像。被写体のすべての点で同じことが起こった結果にあたる。
  // 穴を通るので、上下も左右も反転する
  const imageGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      SUBJECT_OUTLINE.flatMap(([x, y]) => [
        (-x * BOX_DEPTH) / SUBJECT_Z,
        (-y * BOX_DEPTH) / SUBJECT_Z,
        -BOX_DEPTH
      ]),
      3
    )
  )
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })
  scene.add(new LineLoop(imageGeometry, imageMaterial))

  // 光を出す点。被写体の表面の 1 点
  const pointGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const pointMaterial = new PointsMaterial({ color: POINT_COLOR, size: 0.14 })
  const point = new Points(pointGeometry, pointMaterial)
  scene.add(point)

  // その点の光が奥の面に作る、1 つの明るい点
  const spotGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const spotMaterial = new PointsMaterial({ color: PASS_COLOR, size: 0.14 })
  const spot = new Points(spotGeometry, spotMaterial)
  scene.add(spot)

  // 点から出た光。穴を通り抜けたものと通れなかったものを、色で分けて描く。
  // それぞれの本数は決め打ちにせず、本数ぶん確保しておいて、描く範囲を update() で決める
  const passingPosition = createEmptyPosition(RAY_COUNT * 2)
  const passingGeometry = new BufferGeometry().setAttribute("position", passingPosition)
  const passingMaterial = new LineBasicMaterial({ color: PASS_COLOR })
  scene.add(new LineSegments(passingGeometry, passingMaterial))

  const blockedPosition = createEmptyPosition(RAY_COUNT * 2)
  const blockedGeometry = new BufferGeometry().setAttribute("position", blockedPosition)
  const blockedMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  scene.add(new LineSegments(blockedGeometry, blockedMaterial))

  return {
    update: () => {
      const { pointX, pointY } = params
      point.position.set(pointX, pointY, SUBJECT_Z)

      // 穴を通った光が届く位置。穴を通るので、被写体の点と上下左右が逆になる
      const spotX = (-pointX * BOX_DEPTH) / SUBJECT_Z
      const spotY = (-pointY * BOX_DEPTH) / SUBJECT_Z
      spot.position.set(spotX, spotY, -BOX_DEPTH)

      let passingVertex = 0
      let blockedVertex = 0

      for (let i = 0; i < RAY_COUNT; i++) {
        const [wallX, wallY] = wallTarget(i, RAY_COUNT)

        // 穴を通り抜けられるのは、穴へまっすぐ向かった光だけ。
        // 通った光はそのまま直進して奥の面（z = -BOX_DEPTH）まで届き、
        // 穴を外れた光は黒く塗られた面に当たってそこで止まる
        const passes = Math.hypot(wallX, wallY) <= HOLE_RADIUS
        const distance = passes ? 1 + BOX_DEPTH / SUBJECT_Z : 1
        const endX = pointX + (wallX - pointX) * distance
        const endY = pointY + (wallY - pointY) * distance
        const endZ = SUBJECT_Z * (1 - distance)

        if (passes) {
          passingPosition.setXYZ(passingVertex, pointX, pointY, SUBJECT_Z)
          passingPosition.setXYZ(passingVertex + 1, endX, endY, endZ)
          passingVertex += 2
        } else {
          blockedPosition.setXYZ(blockedVertex, pointX, pointY, SUBJECT_Z)
          blockedPosition.setXYZ(blockedVertex + 1, endX, endY, endZ)
          blockedVertex += 2
        }
      }

      passingPosition.needsUpdate = true
      blockedPosition.needsUpdate = true
      passingGeometry.setDrawRange(0, passingVertex)
      blockedGeometry.setDrawRange(0, blockedVertex)
    },
    dispose: () => {
      const disposables = [
        frontWallGeometry,
        backWallGeometry,
        wallMaterial,
        borderGeometry,
        borderMaterial,
        boxGeometry,
        boxMaterial,
        holeGeometry,
        holeMaterial,
        subjectGeometry,
        subjectMaterial,
        imageGeometry,
        imageMaterial,
        pointGeometry,
        pointMaterial,
        spotGeometry,
        spotMaterial,
        passingGeometry,
        passingMaterial,
        blockedGeometry,
        blockedMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
