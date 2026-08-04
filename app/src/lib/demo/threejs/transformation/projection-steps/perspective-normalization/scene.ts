import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type PerspectiveNormalizationParams = {
  /** 正規化ビューボリュームへの変換の進み具合。0 が変換前の四角錐台、1 が変換後の直方体 */
  progress: number
  /** 奥行きを落とす割合。1 でビューボリュームの前面へ潰れ、投影面上の像になる */
  flatten: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PerspectiveNormalizationParams
}

/** 直方体の 8 隅の符号。0〜3 が手前の面、4〜7 が奥の面で、それぞれ四角形を閉じられる順に並べる */
const BOX_CORNERS: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1]
]

/** 直方体の 12 稜線。結ぶ 2 隅の番号を並べる */
const BOX_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/** 投影中心から投影面までの距離 */
const PLANE_DISTANCE = 2

/** ウィンドウの 1 辺の長さ */
const WINDOW_SIZE = 2

/** 前方クリッピング面の奥行き */
const NEAR = 1

/** 後方クリッピング面の奥行き */
const FAR = 4

/** 空間に置く立方体の 1 辺の長さ */
const CUBE_SIZE = 0.5

/**
 * 立方体の中心。奥行きの違いだけを見られるように視線上へ 3 つ並べ、
 * 視線から離れた位置での寄り方も見えるように手前と奥へ 1 つずつ足す
 */
const CUBE_POSITIONS: [number, number, number][] = [
  [0, 0, 1.4],
  [0, 0, 2.6],
  [0, 0, 3.6],
  [-0.45, -0.2, 2],
  [1.1, 0.45, 3.2]
]

// 背景（暗めのグレー）の上で、主題であるビューボリュームを暖色で前に出す。
// 変換前の位置に残す線は、変換後の形より一段暗い灰色にして下がらせる
const VOLUME_COLOR = "#ffc857"
const CUBE_COLOR = "#e8e8ee"
const BEFORE_COLOR = "#565b66"
const AXIS_COLOR = "#5a6472"

/** 頂点の位置を並べた属性を作る */
const positionAttribute = (corners: Vector3[]) =>
  new Float32BufferAttribute(
    corners.flatMap(({ x, y, z }) => [x, y, z]),
    3
  )

/** 頂点と稜線から線分のジオメトリを作る */
const wireframe = (corners: Vector3[], edges: number[]) =>
  new BufferGeometry().setAttribute("position", positionAttribute(corners)).setIndex(edges)

/** 変換前の位置と変換後の位置を、変換の進み具合で混ぜる */
const morph = (before: Vector3[], after: Vector3[], progress: number) =>
  before.map((corner, i) => corner.clone().lerp(after[i], progress))

/** 求めた頂点の位置を、すでにシーンへ置いたジオメトリへ書き戻す */
const writeCorners = (attribute: Float32BufferAttribute, corners: Vector3[]) => {
  corners.forEach(({ x, y, z }, i) => attribute.setXYZ(i, x, y, z))
  attribute.needsUpdate = true
}

export const createPerspectiveNormalizationScene = ({ scene, params }: SceneContext) => {
  const halfWindow = WINDOW_SIZE / 2

  // 奥行き depth での四角錐台の断面の半分の大きさ。投射線が投影中心から放射状に広がるので、
  // 奥行きに比例して大きくなる
  const halfAt = (depth: number) => (halfWindow * depth) / PLANE_DISTANCE

  // 四角錐台を -1 ≤ x ≤ 1, -1 ≤ y ≤ 1, 0 ≤ z ≤ 1 の直方体へ移す変換。
  // x と y は、その奥行きでの断面の大きさ halfWindow × z / PLANE_DISTANCE で割れば ±1 に収まる。
  // 奥行きで割る操作は最下行に z を置き、同次座標の正規化に任せる（この割り算が像の縮み）。
  // z は前方クリッピング面が 0、後方クリッピング面が 1 になるように写す
  // prettier-ignore
  const normalization = new Matrix4().set(
    PLANE_DISTANCE / halfWindow, 0, 0, 0,
    0, PLANE_DISTANCE / halfWindow, 0, 0,
    0, 0, FAR / (FAR - NEAR), (-FAR * NEAR) / (FAR - NEAR),
    0, 0, 1, 0
  )

  // 変換前のビューボリューム（四角錐台）の 8 隅。
  // 前方・後方クリッピング面それぞれの奥行きでの断面の 4 隅
  const volumeBefore = BOX_CORNERS.map(([signX, signY, signZ]) => {
    const depth = signZ < 0 ? NEAR : FAR
    const half = halfAt(depth)
    return new Vector3(signX * half, signY * half, depth)
  })

  // 変換後の 8 隅。四角錐台の 8 隅が、そのまま直方体の 8 隅へ移る
  const volumeAfter = volumeBefore.map((corner) => corner.clone().applyMatrix4(normalization))

  // 空間に置いた同じ大きさの立方体。8 隅それぞれの変換前後の位置を求める。
  // 奥行きで割る変換なので、奥にある隅ほど強く中心へ寄せられる
  const cubesBefore = CUBE_POSITIONS.flatMap(([centerX, centerY, centerZ]) =>
    BOX_CORNERS.map(
      ([signX, signY, signZ]) =>
        new Vector3(
          centerX + (signX * CUBE_SIZE) / 2,
          centerY + (signY * CUBE_SIZE) / 2,
          centerZ + (signZ * CUBE_SIZE) / 2
        )
    )
  )
  const cubesAfter = cubesBefore.map((corner) => corner.clone().applyMatrix4(normalization))

  // 立方体の稜線。1 つのジオメトリにまとめて描くので、隅の番号を立方体ごとに 8 ずつずらす
  const cubeEdges = CUBE_POSITIONS.flatMap((_, i) => BOX_EDGES.map((corner) => corner + i * 8))

  // 変換前の位置に残す線。変換後と見比べられるように動かさない
  const beforeMaterial = new LineBasicMaterial({ color: BEFORE_COLOR })
  const beforeVolumeGeometry = wireframe(volumeBefore, BOX_EDGES)
  const beforeCubesGeometry = wireframe(cubesBefore, cubeEdges)
  scene.add(new LineSegments(beforeVolumeGeometry, beforeMaterial))
  scene.add(new LineSegments(beforeCubesGeometry, beforeMaterial))

  // 変換の途中のビューボリューム。8 隅の位置は変換の進み具合が動くたびに求め直す
  const volumePosition = positionAttribute(volumeBefore)
  const volumeGeometry = new BufferGeometry()
    .setAttribute("position", volumePosition)
    .setIndex(BOX_EDGES)
  const volumeMaterial = new LineBasicMaterial({ color: VOLUME_COLOR })
  const volume = new LineSegments(volumeGeometry, volumeMaterial)
  // 変換前（進み具合 0）では変換前の線と重なるので、そのあとに描いて上書きする
  volume.renderOrder = 1
  scene.add(volume)

  // 変換の途中の立方体
  const cubePosition = positionAttribute(cubesBefore)
  const cubeGeometry = new BufferGeometry()
    .setAttribute("position", cubePosition)
    .setIndex(cubeEdges)
  const cubeMaterial = new LineBasicMaterial({ color: CUBE_COLOR })
  const cubes = new LineSegments(cubeGeometry, cubeMaterial)
  cubes.renderOrder = 1
  scene.add(cubes)

  // ビューボリュームの前面。奥行きを落とすと、この面の上に像ができる
  const frontGeometry = new PlaneGeometry(1, 1)
  const frontMaterial = new MeshBasicMaterial({
    color: VOLUME_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.1
  })
  const frontFace = new Mesh(frontGeometry, frontMaterial)
  scene.add(frontFace)

  // 視線（投影座標系の z 軸）。立方体が寄っていく先を示す
  const axisGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0, 0, 0, FAR], 3)
  )
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  return {
    update: () => {
      const { progress, flatten } = params

      // ビューボリュームの前面は、変換が進むにつれて手前へ寄り、±1 の大きさへ広がる
      const frontZ = MathUtils.lerp(NEAR, 0, progress)
      const frontHalf = MathUtils.lerp(halfAt(NEAR), 1, progress)
      frontFace.position.z = frontZ
      frontFace.scale.set(frontHalf * 2, frontHalf * 2, 1)

      writeCorners(volumePosition, morph(volumeBefore, volumeAfter, progress))

      // 奥行きを落とすと、x と y をそのままに前面へ潰れて、投影面上の像になる
      const cubeCorners = morph(cubesBefore, cubesAfter, progress).map(
        (corner) => new Vector3(corner.x, corner.y, MathUtils.lerp(corner.z, frontZ, flatten))
      )
      writeCorners(cubePosition, cubeCorners)
    },
    dispose: () => {
      const disposables = [
        beforeVolumeGeometry,
        beforeCubesGeometry,
        beforeMaterial,
        volumeGeometry,
        volumeMaterial,
        cubeGeometry,
        cubeMaterial,
        frontGeometry,
        frontMaterial,
        axisGeometry,
        axisMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
