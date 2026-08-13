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
