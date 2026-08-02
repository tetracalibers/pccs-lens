import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ProjectionCameraParams = {
  /** 写す側のカメラの種類 */
  projection: "perspective" | "orthographic"
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: ProjectionCameraParams
}

/** 1 辺 1 の立方体の 8 頂点（中心が原点）。前半の 4 つが -z 側、後半の 4 つが +z 側 */
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

/** 直方体（立方体・視錐台）の稜線。結ぶ 2 頂点の番号を並べる */
const BOX_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/** 正規化デバイス座標（-1〜1 の立方体）の 8 隅。頂点の並びは `CUBE_VERTICES` と同じ */
const NDC_CORNERS: [number, number, number][] = CUBE_VERTICES.map(([x, y, z]) => [
  x * 2,
  y * 2,
  z * 2
])

/** 写す側のカメラから近接面までの距離。像はこの面に描く */
const NEAR = 2

/** 写す側のカメラから遠方面までの距離 */
const FAR = 6.4

/** 透視投影の画角（度） */
const FOV = 45

/** 透視投影の、近接面での枠の半分の大きさ。画角と近接面までの距離で決まる */
const PERSPECTIVE_HALF_SIZE = NEAR * Math.tan(((FOV / 2) * Math.PI) / 180)

/** 平行投影の枠の半分の大きさ。画角にあたるものがないので直に決める（奥行きによらず一定） */
const ORTHOGRAPHIC_HALF_SIZE = 1.25

/** 立方体の 1 辺の長さ */
const CUBE_SIZE = 0.6

/**
 * 立方体を置く位置。3 つとも同じ大きさで、カメラからの距離だけが違う。
 * three.js のカメラは自分の -z の向きを見るので、被写体は z の負の側に置く。
 * 少しずつ横にずらしているのは、近接面の上で像どうしが重ならないようにするため。
 */
const CUBE_POSITIONS: [number, number, number][] = [
  [-0.36, 0.2, -2.9],
  [0.38, -0.28, -4.1],
  [-0.1, 0.34, -5.3]
]

// 背景（暗めのグレー）の上で、形状は白に近い色、像はそれと見分けのつく暖色にする
const CUBE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const FRUSTUM_COLOR = "#5ec8f2"
const PLANE_COLOR = "#8fa3bf"

export const createProjectionCameraScene = ({ scene, params }: SceneContext) => {
  // 写す側のカメラ。どちらも原点に置き、three.js の既定の向き（-z）のまま使う。
  // アスペクト比は 1（正方形の枠）にして、2 つのカメラを同じ条件で比べる
  const perspectiveCamera = new PerspectiveCamera(FOV, 1, NEAR, FAR)
  const orthographicCamera = new OrthographicCamera(
    -ORTHOGRAPHIC_HALF_SIZE,
    ORTHOGRAPHIC_HALF_SIZE,
    ORTHOGRAPHIC_HALF_SIZE,
    -ORTHOGRAPHIC_HALF_SIZE,
    NEAR,
    FAR
  )

  // 投影の計算はカメラの位置・向きも使うので、行列を作っておく（どちらも原点から動かさない）
  perspectiveCamera.updateMatrixWorld()
  orthographicCamera.updateMatrixWorld()

  // 近接面。1 辺 1 の正方形を、選んだカメラの枠の大きさに合わせて広げる
  const planeGeometry = new PlaneGeometry(1, 1)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  plane.position.z = -NEAR
  scene.add(plane)

  // 写される立方体。1 つのジオメトリを 3 つで共有する
  const cubeGeometry = new BufferGeometry()
    .setAttribute(
      "position",
      new Float32BufferAttribute(
        CUBE_VERTICES.flatMap(([x, y, z]) => [x * CUBE_SIZE, y * CUBE_SIZE, z * CUBE_SIZE]),
        3
      )
    )
    .setIndex(BOX_EDGES)
  const cubeMaterial = new LineBasicMaterial({ color: CUBE_COLOR })
  CUBE_POSITIONS.forEach((position) => {
    const cube = new LineSegments(cubeGeometry, cubeMaterial)
    cube.position.set(...position)
    scene.add(cube)
  })

  // 視錐台。カメラが写す範囲そのもので、8 隅の位置はカメラを切り替えるたびに求め直す
  const frustumPosition = new Float32BufferAttribute(new Float32Array(NDC_CORNERS.length * 3), 3)
  const frustumGeometry = new BufferGeometry()
    .setAttribute("position", frustumPosition)
    .setIndex(BOX_EDGES)
  const frustumMaterial = new LineBasicMaterial({ color: FRUSTUM_COLOR })
  scene.add(new LineSegments(frustumGeometry, frustumMaterial))

  // 近接面に写る像。稜線のつなぎ方（インデックス）は立方体と同じ
  const imageMaterial = new LineBasicMaterial({ color: IMAGE_COLOR })
  const imagePositions = CUBE_POSITIONS.map(() => {
    const imagePosition = new Float32BufferAttribute(new Float32Array(CUBE_VERTICES.length * 3), 3)
    const imageGeometry = new BufferGeometry()
      .setAttribute("position", imagePosition)
      .setIndex(BOX_EDGES)
    scene.add(new LineSegments(imageGeometry, imageMaterial))
    return { imagePosition, imageGeometry }
  })

  const point = new Vector3()

  return {
    update: () => {
      const isOrthographic = params.projection === "orthographic"
      const camera = isOrthographic ? orthographicCamera : perspectiveCamera
      const half = isOrthographic ? ORTHOGRAPHIC_HALF_SIZE : PERSPECTIVE_HALF_SIZE

      plane.scale.set(half * 2, half * 2, 1)

      // 正規化デバイス座標の 8 隅を逆投影すると、そのカメラの視錐台の 8 隅になる。
      // 透視投影では奥ほど広がる角錐台、平行投影では奥まで太さの変わらない直方体
      NDC_CORNERS.forEach(([x, y, z], i) => {
        point.set(x, y, z).unproject(camera)
        frustumPosition.setXYZ(i, point.x, point.y, point.z)
      })
      frustumPosition.needsUpdate = true

      CUBE_POSITIONS.forEach(([centerX, centerY, centerZ], c) => {
        const { imagePosition } = imagePositions[c]
        CUBE_VERTICES.forEach(([vertexX, vertexY, vertexZ], v) => {
          // 頂点をカメラで投影すると、-1〜1 の正規化デバイス座標が返る。
          // それを近接面の枠に合わせて広げた位置が、この面に写る像になる。
          // 透視投影では奥の頂点ほど中心へ寄り、平行投影では奥行きによらず同じ位置に写る
          point
            .set(
              centerX + vertexX * CUBE_SIZE,
              centerY + vertexY * CUBE_SIZE,
              centerZ + vertexZ * CUBE_SIZE
            )
            .project(camera)
          imagePosition.setXYZ(v, point.x * half, point.y * half, -NEAR)
        })
        imagePosition.needsUpdate = true
      })
    },
    dispose: () => {
      const disposables = [
        planeGeometry,
        planeMaterial,
        cubeGeometry,
        cubeMaterial,
        frustumGeometry,
        frustumMaterial,
        imageMaterial,
        ...imagePositions.map(({ imageGeometry }) => imageGeometry)
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
