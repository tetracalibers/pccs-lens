import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace
} from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"

/** Tweakpane で操作するパラメータ */
export type HiddenLineAndVisibleSurfaceParams = {
  /** 陰線消去で取り除かれた稜線を、薄い線として残す */
  showHiddenEdges: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: HiddenLineAndVisibleSurfaceParams
}

/**
 * 立体の断面（xy 平面）の輪郭。外（+z）から見て反時計回りに並べる。
 * 1 辺 2 の立方体を、幅・高さとも 2/3 の段で 3 段に切り下げた階段の形。
 * この記事の他のデモと同じ形。
 */
const PROFILE: [number, number][] = [
  [-1, -1], // 0
  [1, -1], // 1
  [1, 1], // 2（最上段の上端）
  [1 / 3, 1], // 3
  [1 / 3, 1 / 3], // 4
  [-1 / 3, 1 / 3], // 5
  [-1 / 3, -1 / 3], // 6
  [-1, -1 / 3] // 7
]

/** 断面を押し出す奥行き。断面を z = ±DEPTH に置く */
const DEPTH = 1

/** 断面の各点を、手前（0〜7）・奥（8〜15）の順に並べた頂点 */
const VERTICES: [number, number, number][] = [
  ...PROFILE.map(([x, y]): [number, number, number] => [x, y, DEPTH]),
  ...PROFILE.map(([x, y]): [number, number, number] => [x, y, -DEPTH])
]

/**
 * 稜線。結ぶ 2 頂点の番号を並べる。
 * 手前の断面を一周、奥の断面を一周したあと、手前と奥を結ぶ 8 本を並べる。
 */
const EDGES = [
  0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 0, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14,
  15, 15, 8, 0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15
]

/**
 * 面。外から見て反時計回りになる順に、面を囲む頂点の番号を並べる。
 * 断面は凹んだ多角形なので、先頭の頂点から扇状に分割しても外へはみ出さない
 * 角（最上段の真下）から始める。
 */
const FACES: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 0], // 手前の断面 z = 1
  [9, 8, 15, 14, 13, 12, 11, 10], // 奥の断面 z = -1
  [1, 0, 8, 9], // 底面 y = -1
  [2, 1, 9, 10], // 右の側面 x = 1
  [3, 2, 10, 11], // 1 段目の上を向いた面 y = 1
  [4, 3, 11, 12], // 段差 x = 1/3
  [5, 4, 12, 13], // 2 段目の上を向いた面 y = 1/3
  [6, 5, 13, 14], // 段差 x = -1/3
  [7, 6, 14, 15], // 3 段目の上を向いた面 y = -1/3
  [0, 7, 15, 8] // 左の側面 x = -1
]

// 背景（暗めのグレー）の上で、稜線は白に近い色にする
const EDGE_COLOR = "#e8e8ee"

/** 陰線消去で取り除かれた稜線を残すときの色。手前の稜線と混ざらない暗さにする */
const HIDDEN_EDGE_COLOR = "#5c626f"

/** 可視面表示で面を塗る色。陰影を付けないので、すべての面がこの 1 色になる */
const SURFACE_COLOR = "#9db4d0"

/** 線の太さ（ピクセル） */
const LINE_WIDTH = 2.5

/** 左右に並べる 2 体の間隔（原点からの距離） */
const OFFSET_X = 1.9

/** 立体が 3 次元の形として読めるよう、正面から少しだけ回した向きで置く */
const YAW = Math.PI * 0.13

const LABEL_COLOR = "#e8e8ee"
const LABEL_HEIGHT = 0.26
/** ラベルの高さ。立体の上端（y = 1）から間を空けて置く */
const LABEL_Y = 1.95
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 稜線 1 本を 1 本の線分として、両端の座標を並べる */
const createEdgePositions = () => {
  const positions: number[] = []
  for (let i = 0; i < EDGES.length; i += 2) {
    positions.push(...VERTICES[EDGES[i]], ...VERTICES[EDGES[i + 1]])
  }
  return new Float32Array(positions)
}

/** 多角形の面を三角形に分割し、頂点の座標を並べる */
const createFacePositions = () => {
  const positions: number[] = []
  for (const face of FACES) {
    // 面の先頭の頂点から扇状に分割する
    for (let i = 1; i < face.length - 1; i++) {
      positions.push(...VERTICES[face[0]], ...VERTICES[face[i]], ...VERTICES[face[i + 1]])
    }
  }
  return new Float32Array(positions)
}

/** 文字を描いた canvas をテクスチャにしたラベル */
const createLabel = (text: string, height: number) => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  let textWidth = LABEL_TEXTURE_HEIGHT
  if (context) {
    context.font = LABEL_FONT
    textWidth = context.measureText(text).width
  }

  canvas.width = Math.ceil(textWidth + LABEL_TEXTURE_PADDING * 2)
  canvas.height = LABEL_TEXTURE_HEIGHT

  if (context) {
    // canvas の大きさを変えると描画状態が初期化されるので、書体はここで指定し直す
    context.font = LABEL_FONT
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillStyle = LABEL_COLOR
    context.fillText(text, canvas.width / 2, canvas.height / 2)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

export const createHiddenLineAndVisibleSurfaceScene = ({ scene, camera, params }: SceneContext) => {
  const faceGeometry = new BufferGeometry()
  faceGeometry.setAttribute("position", new Float32BufferAttribute(createFacePositions(), 3))

  const edgeGeometry = new LineSegmentsGeometry()
  edgeGeometry.setPositions(createEdgePositions())

  // 左：陰線消去した線画。
  // 面は色を書かずに深度だけを書き、稜線はその深度に対する深度テストで隠れる。
  // polygonOffset で面をわずかに奥へずらし、面の縁にある稜線が z ファイティングしないようにする
  const occluderMaterial = new MeshBasicMaterial({
    colorWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  })
  const occluder = new Mesh(faceGeometry, occluderMaterial)
  occluder.renderOrder = 0

  const edgeMaterial = new LineMaterial({ color: EDGE_COLOR, alphaToCoverage: true })
  edgeMaterial.linewidth = LINE_WIDTH
  const edges = new LineSegments2(edgeGeometry, edgeMaterial)
  // 深度を書いた面より後に描く（描く順が入れ替わると稜線が隠れない）
  edges.renderOrder = 2

  // 取り除かれた稜線。深度テストを外してすべての稜線を薄く描き、
  // このあとに描かれる手前の稜線で上書きさせる
  const hiddenEdgeMaterial = new LineMaterial({
    color: HIDDEN_EDGE_COLOR,
    alphaToCoverage: true,
    depthTest: false,
    depthWrite: false
  })
  hiddenEdgeMaterial.linewidth = LINE_WIDTH
  const hiddenEdges = new LineSegments2(edgeGeometry, hiddenEdgeMaterial)
  hiddenEdges.renderOrder = 1

  const hiddenLine = new Group()
  hiddenLine.add(occluder, hiddenEdges, edges)
  hiddenLine.position.x = -OFFSET_X
  scene.add(hiddenLine)

  // 右：可視面表示。隠面消去は深度バッファが行う。
  // 陰影を付けないので、見えている面はすべて同じ色になる
  const surfaceMaterial = new MeshBasicMaterial({ color: SURFACE_COLOR })
  const surface = new Mesh(faceGeometry, surfaceMaterial)

  const visibleSurface = new Group()
  visibleSurface.add(surface)
  visibleSurface.position.x = OFFSET_X
  scene.add(visibleSurface)

  const labels = [createLabel("陰線消去", LABEL_HEIGHT), createLabel("可視面表示", LABEL_HEIGHT)]
  labels[0].sprite.position.set(-OFFSET_X, LABEL_Y, 0)
  labels[1].sprite.position.set(OFFSET_X, LABEL_Y, 0)
  labels.forEach(({ sprite }) => scene.add(sprite))

  return {
    update: () => {
      hiddenEdges.visible = params.showHiddenEdges

      // 左右は原点から離れた位置にあるため、透視投影では視点との角度が食い違い、
      // 同じ立体でも違う向きに見えてしまう。その差のぶんだけ各立体を回して向きを揃える。
      // 視点の回り込み（原点から見た方位）は打ち消さないので、ドラッグでの回転は効いたままになる
      const centerAzimuth = Math.atan2(camera.position.x, camera.position.z)
      for (const group of [hiddenLine, visibleSurface]) {
        const azimuth = Math.atan2(
          camera.position.x - group.position.x,
          camera.position.z - group.position.z
        )
        group.rotation.y = YAW + azimuth - centerAzimuth
      }
    },
    dispose: () => {
      faceGeometry.dispose()
      edgeGeometry.dispose()
      occluderMaterial.dispose()
      edgeMaterial.dispose()
      hiddenEdgeMaterial.dispose()
      surfaceMaterial.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
