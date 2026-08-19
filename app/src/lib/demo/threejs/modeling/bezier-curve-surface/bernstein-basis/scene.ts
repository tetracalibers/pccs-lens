import {
  BufferGeometry,
  CanvasTexture,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type BernsteinBasisParams = {
  /** グラフを読み取る位置。横軸の値 */
  t: number
  /** scene.ts が計算して書き戻す、4 つの重みの値 */
  weights: string
  /** scene.ts が計算して書き戻す、4 つの重みの合計 */
  total: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: BernsteinBasisParams
}

/** 3 次のバーンスタイン基底関数の数と、二項係数 C(3, i) */
const BASIS_COUNT = 4
const BINOMIALS = [1, 3, 3, 1]

/** グラフの描画域。横軸の 0〜1 が PLOT_WIDTH、縦軸の 0〜1 が PLOT_HEIGHT にあたる */
const PLOT_WIDTH = 4.2
const PLOT_HEIGHT = 2.6

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 96

/** 軸を描画域より少し伸ばす長さと、目盛りの長さ */
const AXIS_OVERSHOOT = 0.3
const TICK_LENGTH = 0.1

/** 合計を示す積み上げ棒の位置（横軸の右）と幅。横軸の名前と重ならない位置まで離す */
const BAR_X = PLOT_WIDTH + 1.15
const BAR_WIDTH = 0.4

/** 重みが 0 のときも板が潰れないようにする最小の高さ */
const MIN_BAR_HEIGHT = 1e-4

/** 今の t での重みを示す点の半径 */
const DOT_RADIUS = 0.05

/** 補助線の薄さ。重みが 1 になる高さの目安 */
const GUIDE_OPACITY = 0.35

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24
const TICK_LABEL_HEIGHT = 0.2

/** 基底関数の名前を曲線から上へ逃がす距離 */
const BASIS_LABEL_OFFSET = 0.26

/**
 * 両端の基底関数の山は縦軸・補助線に重なるので、名前は山そのものではなく、
 * この t だけ内側へ入った曲線上の点に添える
 */
const END_LABEL_T = 0.12

/** グラフ全体を canvas の中央に寄せる位置 */
const GRAPH_OFFSET = new Vector3(-2.6, -1.425, 0)

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GUIDE = 0
const LAYER_AXIS = 0.01
const LAYER_READOUT = 0.02
const LAYER_BAR = 0.03
const LAYER_CURVE = 0.04
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、4 本の基底関数を互いに見分けられる色にする。
// 山が現れる順（左から右）に色を割り当て、積み上げ棒と重みの点にも同じ色を使う
const BASIS_COLORS = ["#f2766a", "#ffc857", "#7fd88f", "#5ec8f2"]
const BASIS_LABELS = ["B₀,₃", "B₁,₃", "B₂,₃", "B₃,₃"]
const AXIS_COLOR = "#9aa3b0"
const TICK_LABEL_COLOR = "#c9d2de"
const READOUT_COLOR = "#f57fc4"

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

/** 3 次のバーンスタイン基底関数 B(i, 3)(t) = C(3, i) t^i (1 − t)^(3 − i) */
const bernstein = (i: number, t: number) => BINOMIALS[i] * t ** i * (1 - t) ** (BASIS_COUNT - 1 - i)

/** グラフの座標（横軸 t・縦軸 重み）を、シーンの座標に移す */
const toScene = (t: number, weight: number, z: number, target: Vector3) =>
  target.set(t * PLOT_WIDTH, weight * PLOT_HEIGHT, z)

export const createBernsteinBasisScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 軸と目盛り。横軸は t の 0〜1、縦軸は重みの 0〜1 を測る
  const axisPoints: Vector3[] = [
    new Vector3(0, 0, LAYER_AXIS),
    new Vector3(PLOT_WIDTH + AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(0, 0, LAYER_AXIS),
    new Vector3(0, PLOT_HEIGHT + AXIS_OVERSHOOT, LAYER_AXIS)
  ]
  for (const value of [0.5, 1]) {
    axisPoints.push(
      new Vector3(value * PLOT_WIDTH, 0, LAYER_AXIS),
      new Vector3(value * PLOT_WIDTH, -TICK_LENGTH, LAYER_AXIS),
      new Vector3(0, value * PLOT_HEIGHT, LAYER_AXIS),
      new Vector3(-TICK_LENGTH, value * PLOT_HEIGHT, LAYER_AXIS)
    )
  }
  const axisGeometry = new BufferGeometry().setFromPoints(axisPoints)
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // 重みが 1 になる高さの補助線。積み上げ棒の先がここで止まり続けることを読み取らせる
  const guideGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, PLOT_HEIGHT, LAYER_GUIDE),
    new Vector3(BAR_X + BAR_WIDTH / 2, PLOT_HEIGHT, LAYER_GUIDE)
  ])
  const guideMaterial = new LineBasicMaterial({
    color: AXIS_COLOR,
    transparent: true,
    opacity: GUIDE_OPACITY
  })
  graph.add(new LineSegments(guideGeometry, guideMaterial))

  // 4 本の基底関数。色は曲線・重みの点・積み上げ棒で共有する
  const basisMaterials = BASIS_COLORS.map((color) => new LineBasicMaterial({ color }))
  const fillMaterials = BASIS_COLORS.map((color) => new MeshBasicMaterial({ color }))
  const curveGeometries = basisMaterials.map((material, i) => {
    const points: Vector3[] = []
    for (let step = 0; step <= CURVE_SEGMENTS; step++) {
      const t = step / CURVE_SEGMENTS
      points.push(toScene(t, bernstein(i, t), LAYER_CURVE, new Vector3()))
    }
    const geometry = new BufferGeometry().setFromPoints(points)
    graph.add(new Line(geometry, material))
    return geometry
  })

  // 今の t を示す縦線。長さは変わらないので、横へ動かすだけでよい
  const readoutGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, LAYER_READOUT),
    new Vector3(0, PLOT_HEIGHT, LAYER_READOUT)
  ])
  const readoutMaterial = new LineBasicMaterial({ color: READOUT_COLOR })
  const readoutLine = new LineSegments(readoutGeometry, readoutMaterial)
  graph.add(readoutLine)

  // 今の t で各基底関数が取る重みを示す点
  const dotGeometry = new SphereGeometry(DOT_RADIUS, 16, 12)
  const dots = fillMaterials.map((material) => {
    const dot = new Mesh(dotGeometry, material)
    graph.add(dot)
    return dot
  })

  // 4 つの重みを積み上げた棒。高さの合計がつねに 1 になることを示す
  const barGeometry = new PlaneGeometry(1, 1)
  const bars = fillMaterials.map((material) => {
    const bar = new Mesh(barGeometry, material)
    graph.add(bar)
    return bar
  })

  // 曲線の名前は、それぞれの山の上に置く。山の位置は t = i / 3
  const basisLabels = BASIS_LABELS.map((text, i) => {
    const label = createLabel(text, BASIS_COLORS[i], LABEL_HEIGHT)
    const peak = i / (BASIS_COUNT - 1)
    const anchor = peak === 0 ? END_LABEL_T : peak === 1 ? 1 - END_LABEL_T : peak
    toScene(anchor, bernstein(i, anchor), LAYER_LABEL, label.sprite.position)
    label.sprite.position.y += BASIS_LABEL_OFFSET
    graph.add(label.sprite)
    return label
  })

  const staticLabels = [
    { text: "0", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.16, y: -0.19 },
    { text: "0.5", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: PLOT_WIDTH / 2, y: -0.2 },
    { text: "1", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: PLOT_WIDTH, y: -0.2 },
    {
      text: "0.5",
      color: TICK_LABEL_COLOR,
      height: TICK_LABEL_HEIGHT,
      x: -0.3,
      y: PLOT_HEIGHT / 2
    },
    { text: "1", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.26, y: PLOT_HEIGHT },
    {
      text: "t",
      color: AXIS_COLOR,
      height: LABEL_HEIGHT,
      x: PLOT_WIDTH + AXIS_OVERSHOOT + 0.18,
      y: 0
    },
    { text: "重み", color: AXIS_COLOR, height: LABEL_HEIGHT, x: 0.1, y: PLOT_HEIGHT + 0.46 }
  ].map(({ text, color, height, x, y }) => {
    const label = createLabel(text, color, height)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  const scratch = new Vector3()

  return {
    update: () => {
      const t = params.t
      readoutLine.position.x = t * PLOT_WIDTH

      // 各基底関数が今の t で取る重み。点の高さと、積み上げ棒の 1 段ぶんになる
      const weights = dots.map((dot, i) => {
        const weight = bernstein(i, t)
        dot.position.copy(toScene(t, weight, LAYER_POINT, scratch))
        return weight
      })

      let bottom = 0
      weights.forEach((weight, i) => {
        const height = weight * PLOT_HEIGHT
        bars[i].scale.set(BAR_WIDTH, Math.max(height, MIN_BAR_HEIGHT), 1)
        bars[i].position.set(BAR_X, bottom + height / 2, LAYER_BAR)
        bottom += height
      })

      // Tweakpane 側に読み取り専用で出す、4 つの重みとその合計。
      // multiline のモニターは折り返さない（white-space: pre）ので、1 行 1 つに改行して渡す
      params.weights = weights
        .map((weight, i) => `${BASIS_LABELS[i]} = ${weight.toFixed(2)}`)
        .join("\n")
      params.total = weights.reduce((sum, weight) => sum + weight, 0).toFixed(2)
    },
    dispose: () => {
      const disposables = [
        axisGeometry,
        axisMaterial,
        guideGeometry,
        guideMaterial,
        readoutGeometry,
        readoutMaterial,
        dotGeometry,
        barGeometry,
        ...curveGeometries,
        ...basisMaterials,
        ...fillMaterials,
        ...[...basisLabels, ...staticLabels].flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
