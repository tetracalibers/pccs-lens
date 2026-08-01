import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene
} from "three"

/** Tweakpane で操作するパラメータ */
export type SurfaceModelParams = {
  /** 上の面を 1 枚外す */
  openFace: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: SurfaceModelParams
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
  [4, 5, 12, 10, 13, 6], // z = 1（L 字）
  [7, 9, 13, 10], // 切り欠きの壁 x = 0
  [7, 10, 12, 8], // 切り欠きの壁 y = 0
  [7, 8, 11, 9], // 切り欠きの壁 z = 0
  [3, 6, 13, 9, 11, 2] // y = 1（L 字）。「面を 1 枚外す」で取り除く上の面
]

// 背景（暗めのグレー）の上で、陰影の濃淡が分かる明るさの色にする
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

export const createSurfaceModelScene = ({ scene, params }: SceneContext) => {
  const closedGeometry = createSurfaceGeometry(VERTICES, FACES)
  // 上の面を 1 枚外したもの。面と面のあいだに隙間が空いた状態
  const openedGeometry = createSurfaceGeometry(VERTICES, FACES.slice(0, -1))

  // 面を外したときに内側が見えるよう、裏側も描く
  const material = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide
  })
  const mesh = new Mesh(closedGeometry, material)
  scene.add(mesh)

  // 面があるので、光の当たり方から陰影が決まる。向きは固定（切り欠きの 3 枚の壁に差がつく向き）
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light)
  scene.add(new AmbientLight(LIGHT_COLOR, 0.4))

  return {
    update: () => {
      mesh.geometry = params.openFace ? openedGeometry : closedGeometry
    },
    dispose: () => {
      closedGeometry.dispose()
      openedGeometry.dispose()
      material.dispose()
    }
  }
}
