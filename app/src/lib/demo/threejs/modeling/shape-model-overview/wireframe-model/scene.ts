import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene
} from "three"

/** Tweakpane で操作するパラメータ */
export type WireframeModelParams = { showVertices: boolean }

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: WireframeModelParams
}

/**
 * 一角を欠いた直方体（L字ブロック）の頂点。
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

/** 稜線。結ぶ 2 頂点の番号を並べる */
const EDGES = [
  0, 1, 1, 2, 2, 3, 3, 0, 0, 4, 1, 5, 3, 6, 2, 11, 4, 5, 4, 6, 5, 12, 6, 13, 7, 8, 7, 9, 7, 10, 8,
  11, 9, 11, 8, 12, 10, 12, 9, 13, 10, 13
]

// 背景（暗めのグレー）の上で、稜線は白に近い色、頂点はそれと見分けのつく暖色にする
const EDGE_COLOR = "#e8e8ee"
const VERTEX_COLOR = "#ffc857"

/** 頂点と稜線だけを持つジオメトリ。面のデータは持たない */
const createWireframeGeometry = (vertices: [number, number, number][], edges: number[]) => {
  // 頂点は 1 つの配列にまとめ、稜線はその頂点番号の対として持つ
  const position = new Float32BufferAttribute(vertices.flat(), 3)
  return {
    edgeGeometry: new BufferGeometry().setAttribute("position", position).setIndex(edges),
    vertexGeometry: new BufferGeometry().setAttribute("position", position)
  }
}

/** 稜線を線分として、頂点を点としてシーンに置く */
const addWireframe = (scene: Scene, vertices: [number, number, number][], edges: number[]) => {
  const { edgeGeometry, vertexGeometry } = createWireframeGeometry(vertices, edges)

  const edgeMaterial = new LineBasicMaterial({ color: EDGE_COLOR })
  scene.add(new LineSegments(edgeGeometry, edgeMaterial))

  const vertexMaterial = new PointsMaterial({ color: VERTEX_COLOR, size: 0.08 })
  const vertexPoints = new Points(vertexGeometry, vertexMaterial)
  scene.add(vertexPoints)

  return {
    vertexPoints,
    disposables: [edgeGeometry, vertexGeometry, edgeMaterial, vertexMaterial]
  }
}

export const createWireframeModelScene = ({ scene, params }: SceneContext) => {
  const { vertexPoints, disposables } = addWireframe(scene, VERTICES, EDGES)

  return {
    update: () => {
      vertexPoints.visible = params.showVertices
    },
    dispose: () => {
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
