import {
  CanvasTexture,
  Fog,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"

/** Tweakpane で操作するパラメータ */
export type DepthCueingParams = {
  /** デプスキューイングの効き。0 で左右が同じ見え方になる */
  strength: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: DepthCueingParams
}

/**
 * 一角を欠いた直方体（L字ブロック）の頂点。さまざまな形状モデルのデモと同じ形。
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

// 背景（暗めのグレー）の上で、稜線は白に近い色にする
const EDGE_COLOR = "#e8e8ee"

/** canvas の背景色。デプスキューイングで奥の線を沈ませる先の色でもある */
const BACKGROUND_COLOR = "#26282d"

/** 線の太さ（ピクセル） */
const LINE_WIDTH = 2.5

/** 左右に並べる 2 体の間隔（原点からの距離） */
const OFFSET_X = 1.9

/** 立体が 3 次元の形として読めるよう、正面から少しだけ回した向きで置く */
const YAW = Math.PI * 0.13

/**
 * 霞ませる奥行きの半径。立体を包む球の半径にあたる。
 * 効きが最大のとき、中心より手前 DEPTH_RADIUS で霞み始め、奥 DEPTH_RADIUS で背景に溶けきる。
 * 立体の奥行きより広く取ると差が出ないので、包む球ちょうどの大きさにする。
 */
const DEPTH_RADIUS = 1.45

/** 効きの下限。0 のときに霞ませる範囲が無限に広がらないようにする */
const MIN_STRENGTH = 0.02

const LABEL_COLOR = "#e8e8ee"
const LABEL_HEIGHT = 0.26
const LABEL_Y = -1.7
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

// 視点からの奥行きを測るための作業用ベクトル（毎フレーム使い回す）
const forward = new Vector3()
const point = new Vector3()

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
  // ラベルは奥行きの手がかりではないので、シーンの霞み（fog）の影響を受けないようにする
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    fog: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

export const createDepthCueingScene = ({ scene, camera, params }: SceneContext) => {
  const positions = createEdgePositions()
  const geometry = new LineSegmentsGeometry()
  geometry.setPositions(positions)

  // 視点から遠いほど線を背景色へ近づける（デプスキューイング）。混ぜる割合は
  // シェーダがフラグメントごとに計算する。範囲（near・far）は update で立体に合わせる
  const fog = new Fog(BACKGROUND_COLOR, 0, 1)
  scene.fog = fog

  // 太さのある線は、画面上の幅で描くために canvas の大きさを必要とする。
  // その受け渡しは LineSegments2 が描画の直前に行うので、ここでは太さだけ決めればよい。
  // 左は霞ませない（LineMaterial は ShaderMaterial なので fog は既定で false）
  const plainMaterial = new LineMaterial({ color: EDGE_COLOR, alphaToCoverage: true })
  plainMaterial.linewidth = LINE_WIDTH
  // 右だけシーンの霞みを受け取る
  const cuedMaterial = new LineMaterial({ color: EDGE_COLOR, alphaToCoverage: true, fog: true })
  cuedMaterial.linewidth = LINE_WIDTH

  const plain = new LineSegments2(geometry, plainMaterial)
  plain.position.x = -OFFSET_X
  scene.add(plain)

  const cued = new LineSegments2(geometry, cuedMaterial)
  cued.position.x = OFFSET_X
  scene.add(cued)

  const labels = [
    createLabel("ワイヤフレーム", LABEL_HEIGHT),
    createLabel("デプスキューイング", LABEL_HEIGHT)
  ]
  labels[0].sprite.position.set(-OFFSET_X, LABEL_Y, 0)
  labels[1].sprite.position.set(OFFSET_X, LABEL_Y, 0)
  labels.forEach(({ sprite }) => scene.add(sprite))

  return {
    update: () => {
      // 左右は原点から離れた位置にあるため、透視投影では視点との角度が食い違い、
      // 同じ立体でも違う向きに見えてしまう。その差のぶんだけ各立体を回して向きを揃える。
      // 視点の回り込み（原点から見た方位）は打ち消さないので、ドラッグでの回転は効いたままになる
      const centerAzimuth = Math.atan2(camera.position.x, camera.position.z)
      for (const lines of [plain, cued]) {
        const azimuth = Math.atan2(
          camera.position.x - lines.position.x,
          camera.position.z - lines.position.z
        )
        lines.rotation.y = YAW + azimuth - centerAzimuth
      }

      // 視線の向き。視点からの奥行きは、この向きへの射影で測れる
      camera.getWorldDirection(forward)
      const centerDepth = point.copy(cued.position).sub(camera.position).dot(forward)

      // 立体を包む球の手前側で霞み始める。効きが弱いほど、溶けきるまでの奥行きを遠くへ伸ばす
      fog.near = centerDepth - DEPTH_RADIUS
      fog.far = fog.near + (DEPTH_RADIUS * 2) / Math.max(params.strength, MIN_STRENGTH)
    },
    dispose: () => {
      geometry.dispose()
      plainMaterial.dispose()
      cuedMaterial.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
