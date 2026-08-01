import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Scene,
  Vector3,
  WebGLRenderer
} from "three"

/** Tweakpane で操作するパラメータ */
export type SolidModelParams = {
  /** 切り口を面で塞ぐか（塞ぐ＝ソリッドモデル） */
  model: "surface" | "solid"
  /** 切る高さ */
  cutY: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  params: SolidModelParams
}

/**
 * 一角を欠いた直方体（L字ブロック）の頂点。ワイヤフレームモデルのデモと同じ形。
 * 1 辺 2 の立方体から、1 辺 1 の角（x・y・z がいずれも正の側）を取り除いた形。
 */
const VERTICES: [number, number, number][] = [
  // 立方体の角のうち、取り除いた角 (1, 1, 1) を除いた 7 つ
  [-1, -1, -1], // 0
  [1, -1, -1], // 1
  [1, 1, -1], // 2
  [-1, 1, -1], // 3
  [-1, -1, 1], // 4
  [1, -1, 1], // 5
  [-1, 1, 1], // 6
  // 角を取り除いてできた 7 つ
  [0, 0, 0], // 7（へこみの奥）
  [1, 0, 0], // 8
  [0, 1, 0], // 9
  [0, 0, 1], // 10
  [1, 1, 0], // 11
  [1, 0, 1], // 12
  [0, 1, 1] // 13
]

/**
 * 面。外から見て反時計回りになる順に、面を囲む頂点の番号を並べる。
 * L 字の面は、切り欠きの反対側の角から始める（先頭の頂点から扇状に三角形へ分割するため）。
 */
const FACES: number[][] = [
  [0, 3, 2, 1], // z = -1
  [0, 1, 5, 4], // y = -1
  [0, 4, 6, 3], // x = -1
  [1, 2, 11, 8, 12, 5], // x = 1（L 字）
  [3, 6, 13, 9, 11, 2], // y = 1（L 字）
  [7, 9, 13, 10], // 切り欠きの壁 x = 0
  [7, 10, 12, 8], // 切り欠きの壁 y = 0
  [7, 8, 11, 9], // 切り欠きの壁 z = 0
  [4, 5, 12, 10, 13, 6] // z = 1（L 字）
]

/** 切り欠きの底の高さ。ここを境に、水平に切ったときの断面の輪郭が変わる */
const NOTCH_BOTTOM = 0

/**
 * 殻を切る高さのわずかな下げ幅。
 * 切り口ちょうどに殻の面が残るとちらつくため（上端で切ったときの上面）、殻だけ少し下で切る。
 */
const CLIP_EPSILON = 0.001

/** 切り欠きより下で切ったときの断面の輪郭（x, z）。正方形 */
const SECTION_BELOW_NOTCH: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, 1],
  [1, -1]
]

/** 切り欠きの高さで切ったときの断面の輪郭（x, z）。角が欠けた L 字 */
const SECTION_IN_NOTCH: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [0, 1],
  [0, 0],
  [1, 0],
  [1, -1]
]

// 背景（暗めのグレー）の上で、殻は寒色、切り口は暖色にして見分けられるようにする
const SURFACE_COLOR = "#9db4d0"
const CAP_COLOR = "#e0a061"
const LIGHT_COLOR = "#ffffff"

/** 多角形の面を三角形に分割し、頂点の座標を並べる */
const createFacePositions = (vertices: [number, number, number][], faces: number[][]) => {
  const positions: number[] = []
  for (const face of faces) {
    // 面の先頭の頂点から扇状に分割する
    for (let i = 1; i < face.length - 1; i++) {
      positions.push(...vertices[face[0]], ...vertices[face[i]], ...vertices[face[i + 1]])
    }
  }
  return positions
}

/** 面のデータから、面ごとに独立した頂点を持つジオメトリを作る */
const createSurfaceGeometry = (vertices: [number, number, number][], faces: number[][]) => {
  const positions = createFacePositions(vertices, faces)
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  // 頂点を面ごとに分けているので、法線は面ごとに平らに求まる
  geometry.computeVertexNormals()
  return geometry
}

/** 断面の輪郭から、切り口を塞ぐ 1 枚の面を作る（高さは position で合わせる） */
const createCapGeometry = (outline: [number, number][]) => {
  const vertices = outline.map(([x, z]): [number, number, number] => [x, 0, z])
  return createSurfaceGeometry(vertices, [vertices.map((_, index) => index)])
}

export const createSolidModelScene = ({ scene, renderer, params }: SceneContext) => {
  // クリッピング（面より上を描かない）を有効にする
  renderer.localClippingEnabled = true

  // 水平面で切る。法線が下向きなので、この面より下だけが残る
  const plane = new Plane(new Vector3(0, -1, 0), params.cutY - CLIP_EPSILON)

  // 殻。切り口から内側の面が見えるよう、裏側も描く
  const shellGeometry = createSurfaceGeometry(VERTICES, FACES)
  const shellMaterial = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide,
    clippingPlanes: [plane]
  })
  scene.add(new Mesh(shellGeometry, shellMaterial))

  // 切り口を塞ぐ面。これがあると、中身の詰まった立体として見える
  const belowNotchCap = createCapGeometry(SECTION_BELOW_NOTCH)
  const inNotchCap = createCapGeometry(SECTION_IN_NOTCH)
  const capMaterial = new MeshStandardMaterial({ color: CAP_COLOR, roughness: 0.6 })
  const cap = new Mesh(inNotchCap, capMaterial)
  scene.add(cap)

  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light)
  scene.add(new AmbientLight(LIGHT_COLOR, 0.4))

  return {
    update: () => {
      plane.constant = params.cutY - CLIP_EPSILON
      cap.position.y = params.cutY
      cap.geometry = params.cutY < NOTCH_BOTTOM ? belowNotchCap : inNotchCap
      cap.visible = params.model === "solid"
    },
    dispose: () => {
      shellGeometry.dispose()
      belowNotchCap.dispose()
      inNotchCap.dispose()
      shellMaterial.dispose()
      capMaterial.dispose()
    }
  }
}
