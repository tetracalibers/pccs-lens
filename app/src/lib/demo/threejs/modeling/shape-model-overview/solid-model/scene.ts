import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
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
  /** 手前下の角を切り落とすか。オフなら切る前の立体になる */
  cut: boolean
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

/**
 * 切り口の三角形。手前下の角 (1, -1, 1) に集まる 3 本の稜線を、それぞれ少し戻った点を通る。
 * どの面とも平行でない斜めの面になるため、立体がもともと持つ切り欠きと見分けがつく。
 * y 方向に 1 まで戻すと切り欠き（y > 0）に届いて断面が複雑になるので、その手前で止める。
 */
const SECTION: [number, number, number][] = [
  [0.5, -1, 1],
  [1, -0.25, 1],
  [1, -1, 0.5]
]

/** 切ったときに、欠片を切り口から離す距離 */
const SEPARATION = 0.7

// 背景（暗めのグレー）の上で、陰影の濃淡が分かる明るさの色にする。
// 断面も同じ色にして、中身の詰まった 1 つの立体として見えるようにする
const SURFACE_COLOR = "#9db4d0"
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

/** 切り口の輪郭から、断面を塞ぐ 1 枚の面を作る */
const createCapGeometry = (outline: [number, number, number][]) =>
  createSurfaceGeometry(outline, [outline.map((_, index) => index)])

export const createSolidModelScene = ({ scene, renderer, params }: SceneContext) => {
  // クリッピング（切り口の面の向こう側を描かない）を有効にする
  renderer.localClippingEnabled = true

  const geometry = createSurfaceGeometry(VERTICES, FACES)

  // 切り口の面。奥側だけを残すと本体、手前側だけを残すと切り取った欠片になる
  const [p0, p1, p2] = SECTION.map((point) => new Vector3(...point))
  const bodyClip = new Plane().setFromCoplanarPoints(p0, p1, p2)
  const baseFragmentClip = bodyClip.clone().negate()
  const fragmentClip = baseFragmentClip.clone()

  // 欠片を離す向き。切り口に垂直な向きだと、本体の切り口をちょうど隠してしまうので下へ逃がす
  const separationDirection = baseFragmentClip.normal.clone().add(new Vector3(0, -1, 0)).normalize()

  // 本体の殻。切り口から内側の面が見えるよう、裏側も描く
  const bodyMaterial = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide,
    clippingPlanes: [bodyClip]
  })
  scene.add(new Mesh(geometry, bodyMaterial))

  // 欠片の殻。同じ形状データを、逆向きの面で切り分ける
  const fragmentMaterial = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide,
    clippingPlanes: [fragmentClip]
  })
  const fragment = new Group()
  fragment.add(new Mesh(geometry, fragmentMaterial))
  scene.add(fragment)

  // 切り口を塞ぐ断面。本体側と欠片側で向きが逆になるので、同じ 1 枚を裏表とも描く
  const capGeometry = createCapGeometry(SECTION)
  const capMaterial = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide
  })
  const bodyCap = new Mesh(capGeometry, capMaterial)
  scene.add(bodyCap)
  const fragmentCap = new Mesh(capGeometry, capMaterial)
  fragment.add(fragmentCap)

  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light)
  scene.add(new AmbientLight(LIGHT_COLOR, 0.4))

  return {
    update: () => {
      // 欠片を、断面ごと切り口から離れる向きへずらす
      fragment.position.copy(separationDirection).multiplyScalar(params.cut ? SEPARATION : 0)
      // クリッピング面はワールド座標で効くので、欠片の移動に合わせて動かす
      fragment.updateMatrixWorld()
      fragmentClip.copy(baseFragmentClip).applyMatrix4(fragment.matrixWorld)

      // 切っていないときは、断面が立体の内部にあるので描かない
      bodyCap.visible = params.cut
      fragmentCap.visible = params.cut
    },
    dispose: () => {
      geometry.dispose()
      capGeometry.dispose()
      bodyMaterial.dispose()
      fragmentMaterial.dispose()
      capMaterial.dispose()
    }
  }
}
