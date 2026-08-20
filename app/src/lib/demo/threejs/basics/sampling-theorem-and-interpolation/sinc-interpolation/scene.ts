import {
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type SincInterpolationParams = {
  /** 重ね合わせる標本点の数。中央の標本点から左右へ広げていく */
  termCount: number
  /** 足し合わせる前の sinc 関数を 1 本ずつ表示するか */
  showTerms: boolean
  /** すべてを重ね合わせた、もとの波を表示するか */
  showSource: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: SincInterpolationParams
}

/** グラフの描画域。位置の 0〜1 が PLOT_WIDTH、明るさのふれの -1〜1 が ±WAVE_HEIGHT にあたる */
const PLOT_WIDTH = 5.2
const WAVE_HEIGHT = 1

/** 標本点の数。中央の 1 点を決められるよう奇数にする */
const SAMPLE_COUNT = 13

/** 中央の標本点の番号 */
const CENTER_INDEX = (SAMPLE_COUNT - 1) / 2

/** 標本値のもとにする波が、描画域の幅あたりに描く山と谷の数 */
const WAVE_CYCLES = 2.5

/** 波と sinc 関数を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 720
const SINC_SEGMENTS = 360

/** 標本点を示す球の半径 */
const DOT_RADIUS = 0.045

/** 軸を描画域より少し伸ばす長さと、明・暗の目盛りの長さ */
const AXIS_OVERSHOOT = 0.2
const TICK_LENGTH = 0.08

/** 重ね合わせた波の破線の刻み。もとの波と重なったとき、下のもとの波が透けて見える長さにする */
const DASH_SIZE = 0.08
const GAP_SIZE = 0.06

/** 標本点から横軸へ下ろす垂線の薄さ */
const STEM_OPACITY = 0.55

/** すでに重ね合わせた sinc 関数の薄さ。何本重なっても、波と標本点が埋もれない濃さにする */
const SINC_OPACITY = 0.3

/** 凡例を並べる高さと、その横位置 */
const LEGEND_Y = WAVE_HEIGHT + 0.44
const LEGEND_X = [0.62, 2.2, 4]

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24
const TICK_LABEL_HEIGHT = 0.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_SINC = 0
const LAYER_AXIS = 0.01
const LAYER_SOURCE = 0.02
const LAYER_NEWEST_SINC = 0.025
const LAYER_SUM = 0.03
const LAYER_STEM = 0.04
const LAYER_DOT = 0.05
const LAYER_LABEL = 0.12

// 背景（暗めのグレー）の上で、要素を互いに見分けられる色にする。
// 標本点の色は、そこに重ねる sinc 関数と垂線にも使う
const SOURCE_COLOR = "#5ec8f2"
const SAMPLE_COLOR = "#ffc857"
const SUM_COLOR = "#f2766a"
const AXIS_COLOR = "#9aa3b0"
const TICK_LABEL_COLOR = "#c9d2de"

/** まだ重ね合わせていない標本点の色。読み取れる位置には置きつつ、重ねた点より一段沈ませる */
const PENDING_SAMPLE_COLOR = "#6b7280"

/** グラフ全体を canvas の中央に寄せる位置 */
const GRAPH_OFFSET = new Vector3(-PLOT_WIDTH / 2, -0.18, 0)

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
 */
const createLabel = (text: string, color: string, height: number) => {
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
    context.fillStyle = color
    context.fillText(text, canvas.width / 2, canvas.height / 2)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる線がラベルの矩形の形に欠ける
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/** sinc 関数。sin(πt) / πt の t = 0 での値は 1 とする */
const sinc = (t: number) => (t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t))

/** k 番目の標本点の位置。画素 1 つ分の真ん中で明るさを読み取るのと同じ取り方 */
const samplePosition = (k: number) => (k + 0.5) / SAMPLE_COUNT

/** 標本点の間隔。sinc 関数の山の幅は、この間隔に合わせる */
const SAMPLE_INTERVAL = 1 / SAMPLE_COUNT

/**
 * k 番目の標本値。両端で 0 になる重みを掛けた波から読み取る。
 * 描画域の外に標本点が残らないので、描画域の中の標本値だけで、もとの波を過不足なく組み立てられる
 */
const sampleValueAt = (k: number) => {
  const t = k / (SAMPLE_COUNT - 1)
  const fade = 0.5 * (1 - Math.cos(2 * Math.PI * t))
  return Math.sin(2 * Math.PI * WAVE_CYCLES * t) * fade
}

/** 標本値。番号を引数にする関数のままだと足し合わせのたびに計算し直すので、先に並べておく */
const SAMPLE_VALUES = Array.from({ length: SAMPLE_COUNT }, (_, k) => sampleValueAt(k))

/**
 * 重ね合わせる順序。中央の標本点から左右へ交互に広げていく。
 * 端から順に足すと、まだ足していない側の食い違いが描画域の中央にまで残る
 */
const ADD_ORDER = Array.from({ length: SAMPLE_COUNT }, (_, k) => k).sort(
  (a, b) => Math.abs(a - CENTER_INDEX) - Math.abs(b - CENTER_INDEX) || a - b
)

/** k 番目の標本値に重ねる sinc 関数の、位置 u での値 */
const sincTermAt = (u: number, k: number) =>
  SAMPLE_VALUES[k] * sinc((u - samplePosition(k)) / SAMPLE_INTERVAL)

export const createSincInterpolationScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 明るさの中間を通る横軸（位置）と、明るさを測る縦軸。縦軸には明・暗の目盛りを付ける
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(PLOT_WIDTH + AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(0, -WAVE_HEIGHT - AXIS_OVERSHOOT, LAYER_AXIS),
    new Vector3(0, WAVE_HEIGHT + AXIS_OVERSHOOT, LAYER_AXIS),
    new Vector3(-TICK_LENGTH, WAVE_HEIGHT, LAYER_AXIS),
    new Vector3(0, WAVE_HEIGHT, LAYER_AXIS),
    new Vector3(-TICK_LENGTH, -WAVE_HEIGHT, LAYER_AXIS),
    new Vector3(0, -WAVE_HEIGHT, LAYER_AXIS)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // もとの波。すべての標本値の sinc 関数を足し合わせたもので、標本点の位置を必ず通る
  const sourcePoints: Vector3[] = []
  for (let step = 0; step <= CURVE_SEGMENTS; step++) {
    const u = step / CURVE_SEGMENTS
    let level = 0
    for (let k = 0; k < SAMPLE_COUNT; k++) {
      level += sincTermAt(u, k)
    }
    sourcePoints.push(new Vector3(u * PLOT_WIDTH, level * WAVE_HEIGHT, LAYER_SOURCE))
  }
  const sourceGeometry = new BufferGeometry().setFromPoints(sourcePoints)
  const sourceMaterial = new LineBasicMaterial({ color: SOURCE_COLOR })
  const sourceLine = new Line(sourceGeometry, sourceMaterial)
  graph.add(sourceLine)

  // ここまでに重ね合わせた波。もとの波と重なったときに下が透けるよう、破線で描く
  const sumPosition = new Float32BufferAttribute(new Float32Array((CURVE_SEGMENTS + 1) * 3), 3)
  const sumGeometry = new BufferGeometry().setAttribute("position", sumPosition)
  const sumMaterial = new LineDashedMaterial({
    color: SUM_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const sumLine = new Line(sumGeometry, sumMaterial)
  graph.add(sumLine)

  // 標本点から横軸へ下ろした垂線。どの位置で明るさを読み取ったかを示す
  const stemPoints: Vector3[] = []
  for (let k = 0; k < SAMPLE_COUNT; k++) {
    const x = samplePosition(k) * PLOT_WIDTH
    const y = SAMPLE_VALUES[k] * WAVE_HEIGHT
    stemPoints.push(new Vector3(x, 0, LAYER_STEM), new Vector3(x, y, LAYER_STEM))
  }
  const stemGeometry = new BufferGeometry().setFromPoints(stemPoints)
  const stemMaterial = new LineBasicMaterial({
    color: SAMPLE_COLOR,
    transparent: true,
    opacity: STEM_OPACITY
  })
  graph.add(new LineSegments(stemGeometry, stemMaterial))

  // 標本点。位置は動かず、重ね合わせが済んだかどうかで色だけが変わる
  const dotGeometry = new SphereGeometry(DOT_RADIUS, 12, 8)
  const dotMaterial = new MeshBasicMaterial()
  const dots = new InstancedMesh(dotGeometry, dotMaterial, SAMPLE_COUNT)
  const matrix = new Matrix4()
  for (let k = 0; k < SAMPLE_COUNT; k++) {
    const x = samplePosition(k) * PLOT_WIDTH
    const y = SAMPLE_VALUES[k] * WAVE_HEIGHT
    dots.setMatrixAt(k, matrix.setPosition(x, y, LAYER_DOT))
  }
  dots.instanceMatrix.needsUpdate = true
  graph.add(dots)

  const addedColor = new Color(SAMPLE_COLOR)
  const pendingColor = new Color(PENDING_SAMPLE_COLOR)

  // 足し合わせる前の sinc 関数。標本値の大きさだけ縦に伸縮し、標本点の位置に山がくる。
  // 形は変わらないので、頂点は組み立てのときに一度だけ置く
  const sincMaterial = new LineBasicMaterial({
    color: SAMPLE_COLOR,
    transparent: true,
    opacity: SINC_OPACITY
  })
  // 直前に足した 1 本だけは濃く描き、山の高さと、ほかの標本点をどう通るかを読み取れるようにする
  const newestSincMaterial = new LineBasicMaterial({ color: SAMPLE_COLOR })
  const sincTerms = Array.from({ length: SAMPLE_COUNT }, (_, k) => {
    const points: Vector3[] = []
    for (let step = 0; step <= SINC_SEGMENTS; step++) {
      const u = step / SINC_SEGMENTS
      points.push(new Vector3(u * PLOT_WIDTH, sincTermAt(u, k) * WAVE_HEIGHT, LAYER_SINC))
    }
    const geometry = new BufferGeometry().setFromPoints(points)
    const line = new Line(geometry, sincMaterial)
    line.visible = false
    graph.add(line)
    return { geometry, line }
  })

  const labels = [
    { text: "明", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.26, y: WAVE_HEIGHT },
    { text: "暗", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.26, y: -WAVE_HEIGHT },
    { text: "位置", color: AXIS_COLOR, height: LABEL_HEIGHT, x: PLOT_WIDTH + 0.32, y: 0 },
    { text: "もとの波", color: SOURCE_COLOR, height: LABEL_HEIGHT, x: LEGEND_X[0], y: LEGEND_Y },
    { text: "sinc関数", color: SAMPLE_COLOR, height: LABEL_HEIGHT, x: LEGEND_X[1], y: LEGEND_Y },
    {
      text: "重ね合わせた波",
      color: SUM_COLOR,
      height: LABEL_HEIGHT,
      x: LEGEND_X[2],
      y: LEGEND_Y
    }
  ].map(({ text, color, height, x, y }) => {
    const label = createLabel(text, color, height)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  // 重ね合わせる本数が変わったときだけ引き直す（カメラを動かしただけでは作り直さない）
  let builtTermCount = NaN
  let builtShowTerms = false
  let builtShowSource = false

  return {
    update: () => {
      const { termCount, showTerms, showSource } = params

      if (
        termCount === builtTermCount &&
        showTerms === builtShowTerms &&
        showSource === builtShowSource
      ) {
        return
      }
      builtTermCount = termCount
      builtShowTerms = showTerms
      builtShowSource = showSource

      sourceLine.visible = showSource

      // 中央から数えて termCount 本ぶんの標本点を、重ね合わせの対象にする
      const added = ADD_ORDER.slice(0, termCount)
      const newest = added[added.length - 1]

      // 重ね合わせ。対象の標本値の sinc 関数だけを足し合わせる
      for (let step = 0; step <= CURVE_SEGMENTS; step++) {
        const u = step / CURVE_SEGMENTS
        let level = 0
        for (const k of added) {
          level += sincTermAt(u, k)
        }
        sumPosition.setXYZ(step, u * PLOT_WIDTH, level * WAVE_HEIGHT, LAYER_SUM)
      }
      sumPosition.needsUpdate = true
      // 破線の刻みは頂点間の距離から決まるので、頂点を動かしたら測り直す
      sumLine.computeLineDistances()

      // 重ね合わせが済んだ標本点と、まだ済んでいない標本点を色で分ける
      for (let k = 0; k < SAMPLE_COUNT; k++) {
        dots.setColorAt(k, added.includes(k) ? addedColor : pendingColor)
      }
      if (dots.instanceColor) dots.instanceColor.needsUpdate = true

      sincTerms.forEach(({ line }, k) => {
        line.visible = showTerms && added.includes(k)
        line.material = k === newest ? newestSincMaterial : sincMaterial
        line.position.z = k === newest ? LAYER_NEWEST_SINC : 0
      })
    },
    dispose: () => {
      const disposables = [
        axisGeometry,
        axisMaterial,
        sourceGeometry,
        sourceMaterial,
        sumGeometry,
        sumMaterial,
        stemGeometry,
        stemMaterial,
        dotGeometry,
        dotMaterial,
        sincMaterial,
        newestSincMaterial,
        ...sincTerms.map(({ geometry }) => geometry),
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
      dots.dispose()
    }
  }
}
