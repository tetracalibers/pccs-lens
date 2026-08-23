import {
  BufferGeometry,
  CanvasTexture,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type HermiteFunctionsParams = {
  /** グラフを読み取る位置。横軸の値 */
  t: number
  /** scene.ts が計算して書き戻す、4 つの重みの値 */
  values: string
  /** scene.ts が計算して書き戻す、4 つの重みの傾き */
  slopes: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: HermiteFunctionsParams
}

/** グラフの描画域。横軸の 0〜1 が PLOT_WIDTH、縦軸の 0〜1 が PLOT_HEIGHT にあたる */
const PLOT_WIDTH = 4.2
const PLOT_HEIGHT = 2.6

/** 縦軸の下端。H₃ が負の値をとるので、軸を 0 より下まで伸ばす */
const Y_MIN = -0.25

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 96

/** 軸を描画域より少し伸ばす長さと、目盛りの長さ */
const AXIS_OVERSHOOT = 0.3
const TICK_LENGTH = 0.1

/** 今の t での重みを示す点の半径 */
const DOT_RADIUS = 0.05

/** 補助線の薄さ。重みが 1 になる高さの目安 */
const GUIDE_OPACITY = 0.35

/** 端点の接線の刻みと薄さ、伸ばす長さ（横軸の t にして） */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08
const TANGENT_GUIDE_OPACITY = 0.75
const TANGENT_GUIDE_SPAN = 0.18

/**
 * 傾きが 1 になっている端点の接線。H₂ は t = 0 から前へ、H₃ は t = 1 から後ろへ伸ばす。
 * どちらも「横に進んだぶんだけ縦に動く」線なので、両端で重みが 0 でありながら
 * 曲線が軸から立ち上がる（軸へ落ちる）勢いを持っていることが目で読める
 */
const TANGENT_GUIDES = [
  { basis: 2, from: [0, 0], to: [TANGENT_GUIDE_SPAN, TANGENT_GUIDE_SPAN], labelSign: 1 },
  { basis: 3, from: [1 - TANGENT_GUIDE_SPAN, -TANGENT_GUIDE_SPAN], to: [1, 0], labelSign: -1 }
]

/** 端点の接線に添える名前 */
const TANGENT_GUIDE_LABEL = "傾き1"

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24
const TICK_LABEL_HEIGHT = 0.2

/** 曲線の名前を曲線から逃がす距離と、接線の名前を接線の先へ逃がす距離 */
const CURVE_LABEL_OFFSET = 0.26
const TANGENT_LABEL_OFFSET = 0.28

/**
 * 曲線の名前を添える位置（横軸の t）と、曲線から逃がす向き（1 で上、−1 で下）。
 * H₀ と H₁ は両端で 1 に達し、そこは縦軸と補助線が通っているので、
 * 名前は端ではなく内側へ寄せた位置の曲線の下に置く
 */
const CURVE_LABEL_ANCHORS: [number, number][] = [
  [0.2, -1],
  [0.8, -1],
  [0.5, 1],
  [0.5, -1]
]

/** 横軸の目盛りの数字を置く高さ。H₃ の谷を避けて、軸のすぐ下にとどめる */
const X_TICK_LABEL_Y = -0.18

/** グラフ全体を canvas の中央に寄せる位置 */
const GRAPH_OFFSET = new Vector3(-2.15, -1.225, 0)

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
const LAYER_TANGENT = 0.03
const LAYER_CURVE = 0.04
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で 4 本を見分けられる色にする。
// 位置にかかる H₀・H₁ を赤〜黄、接ベクトルにかかる H₂・H₃ を緑〜青にして、
// 4 本を区別しながら 2 組の対応も読めるようにする
const CURVE_COLORS = ["#f2766a", "#ffc857", "#7fd88f", "#5ec8f2"]
const CURVE_LABELS = ["H₀", "H₁", "H₂", "H₃"]
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

/**
 * 4 つのエルミート関数。両端の位置 P₀, P₁ と接ベクトル V₀, V₁ にかかる重みで、
 * H₀ = 2t³ − 3t² + 1、H₁ = −2t³ + 3t²、H₂ = t³ − 2t² + t、H₃ = t³ − t²
 */
const hermite = (t: number) => {
  const square = t * t
  const cube = square * t

  return [2 * cube - 3 * square + 1, -2 * cube + 3 * square, cube - 2 * square + t, cube - square]
}

/** それぞれを t で微分したもの。グラフのその位置での傾きにあたる */
const hermiteDerivative = (t: number) => {
  const square = t * t

  return [6 * square - 6 * t, -6 * square + 6 * t, 3 * square - 4 * t + 1, 3 * square - 2 * t]
}

/** グラフの座標（横軸 t・縦軸 重み）を、シーンの座標に移す */
const toScene = (t: number, value: number, z: number, target: Vector3) =>
  target.set(t * PLOT_WIDTH, value * PLOT_HEIGHT, z)

/** パネルに出す数値の書き方。小数第 2 位まで揃え、丸めて 0 になる値は符号を付けない */
const format = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2)

export const createHermiteFunctionsScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 軸と目盛り。横軸は t の 0〜1、縦軸は重みを測る
  const axisPoints: Vector3[] = [
    new Vector3(0, 0, LAYER_AXIS),
    new Vector3(PLOT_WIDTH + AXIS_OVERSHOOT, 0, LAYER_AXIS),
    // 縦軸は、H₃ が負の値をとるぶんだけ 0 より下まで伸ばす
    new Vector3(0, Y_MIN * PLOT_HEIGHT, LAYER_AXIS),
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

  // 重みが 1 になる高さの補助線。H₀ が t = 0 で、H₁ が t = 1 でここに届くことを読み取らせる
  const guideGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, PLOT_HEIGHT, LAYER_GUIDE),
    new Vector3(PLOT_WIDTH, PLOT_HEIGHT, LAYER_GUIDE)
  ])
  const guideMaterial = new LineBasicMaterial({
    color: AXIS_COLOR,
    transparent: true,
    opacity: GUIDE_OPACITY
  })
  graph.add(new LineSegments(guideGeometry, guideMaterial))

  // 4 本のエルミート関数。色は曲線と、今の t での重みを示す点で共有する
  const curveMaterials = CURVE_COLORS.map((color) => new LineBasicMaterial({ color }))
  const curveGeometries = curveMaterials.map((material, i) => {
    const points: Vector3[] = []
    for (let step = 0; step <= CURVE_SEGMENTS; step++) {
      const t = step / CURVE_SEGMENTS
      points.push(toScene(t, hermite(t)[i], LAYER_CURVE, new Vector3()))
    }
    const geometry = new BufferGeometry().setFromPoints(points)
    graph.add(new Line(geometry, material))

    return geometry
  })

  // 傾きが 1 になっている端点の接線。曲線と混ざらないよう破線にする
  const guideDirection = new Vector3(PLOT_WIDTH, PLOT_HEIGHT, 0).normalize()
  const tangentGuides = TANGENT_GUIDES.map(({ basis, from, to }) => {
    const geometry = new BufferGeometry().setFromPoints([
      toScene(from[0], from[1], LAYER_TANGENT, new Vector3()),
      toScene(to[0], to[1], LAYER_TANGENT, new Vector3())
    ])
    const material = new LineDashedMaterial({
      color: CURVE_COLORS[basis],
      dashSize: DASH_SIZE,
      gapSize: GAP_SIZE,
      transparent: true,
      opacity: TANGENT_GUIDE_OPACITY
    })
    const line = new Line(geometry, material)
    // 破線の刻みは頂点ごとの「線に沿った距離」で決まるので、作ったあとに測る
    line.computeLineDistances()
    graph.add(line)

    return { geometry, material }
  })

  // 今の t を示す縦線。長さは変わらないので、横へ動かすだけでよい
  const readoutGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, Y_MIN * PLOT_HEIGHT, LAYER_READOUT),
    new Vector3(0, PLOT_HEIGHT, LAYER_READOUT)
  ])
  const readoutMaterial = new LineBasicMaterial({ color: READOUT_COLOR })
  const readoutLine = new LineSegments(readoutGeometry, readoutMaterial)
  graph.add(readoutLine)

  // 今の t で各エルミート関数が取る重みを示す点
  const dotGeometry = new SphereGeometry(DOT_RADIUS, 16, 12)
  const dotMaterials = CURVE_COLORS.map((color) => new MeshBasicMaterial({ color }))
  const dots = dotMaterials.map((material) => {
    const dot = new Mesh(dotGeometry, material)
    graph.add(dot)

    return dot
  })

  // 曲線の名前。両端は縦軸と補助線が通っているので、内側の位置で曲線に添える
  const curveLabels = CURVE_LABELS.map((text, i) => {
    const label = createLabel(text, CURVE_COLORS[i], LABEL_HEIGHT)
    const [anchor, side] = CURVE_LABEL_ANCHORS[i]
    toScene(anchor, hermite(anchor)[i], LAYER_LABEL, label.sprite.position)
    label.sprite.position.y += side * CURVE_LABEL_OFFSET
    graph.add(label.sprite)

    return label
  })

  // 端点の接線の名前。接線の先へ、線を伸ばした向きにさらに逃がして置く
  const tangentLabels = TANGENT_GUIDES.map(({ basis, from, to, labelSign }) => {
    const label = createLabel(TANGENT_GUIDE_LABEL, CURVE_COLORS[basis], LABEL_HEIGHT)
    const far = labelSign > 0 ? to : from
    toScene(far[0], far[1], LAYER_LABEL, label.sprite.position)
    label.sprite.position.addScaledVector(guideDirection, labelSign * TANGENT_LABEL_OFFSET)
    label.sprite.position.z = LAYER_LABEL
    graph.add(label.sprite)

    return label
  })

  const staticLabels = [
    { text: "0", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.17, y: X_TICK_LABEL_Y },
    {
      text: "0.5",
      color: TICK_LABEL_COLOR,
      height: TICK_LABEL_HEIGHT,
      x: PLOT_WIDTH / 2,
      y: X_TICK_LABEL_Y
    },
    {
      text: "1",
      color: TICK_LABEL_COLOR,
      height: TICK_LABEL_HEIGHT,
      x: PLOT_WIDTH,
      y: X_TICK_LABEL_Y
    },
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

      // 今の t で各エルミート関数が取る重みと、その位置での傾き
      const values = hermite(t)
      const slopes = hermiteDerivative(t)
      dots.forEach((dot, i) => dot.position.copy(toScene(t, values[i], LAYER_POINT, scratch)))

      // Tweakpane 側に読み取り専用で出す、4 つの重みとその傾き。
      // multiline のモニターは折り返さない（white-space: pre）ので、1 行 1 つに改行して渡す
      params.values = values.map((value, i) => `${CURVE_LABELS[i]} = ${format(value)}`).join("\n")
      params.slopes = slopes.map((slope, i) => `${CURVE_LABELS[i]}′ = ${format(slope)}`).join("\n")
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
        ...curveGeometries,
        ...curveMaterials,
        ...dotMaterials,
        ...tangentGuides.flatMap(({ geometry, material }) => [geometry, material]),
        ...[...curveLabels, ...tangentLabels, ...staticLabels].flatMap((label) => [
          label.texture,
          label.material
        ])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
