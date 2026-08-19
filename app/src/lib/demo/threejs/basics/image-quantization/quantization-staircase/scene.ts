import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
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
export type QuantizationStaircaseParams = {
  /** 量子化で用意する段階の数 */
  levelCount: number
  /** 丸める前の明るさ（0〜1） */
  input: number
  /** 丸めた結果の画素値。scene.ts が計算して書き戻す */
  pixelValue: string
  /** 丸めによって生じるずれ。scene.ts が計算して書き戻す */
  gap: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: QuantizationStaircaseParams
}

/**
 * グラフの描画域。明るさの 0〜1（横軸）と、画素値の 0〜段階の数 - 1（縦軸）を、
 * ともにこの幅に対応させる。縦横が同じ長さなので、丸めが起きない場合が 45 度の直線になる
 */
const PLOT_SIZE = 2.4

/** 段階の数の上限。踏み板・立ち上がり・目盛りの頂点をこの数に合わせて先に確保しておく */
const MAX_LEVEL_COUNT = 16

/** 縦軸の目盛りに数字を添える段階の数の上限。これを超えたら数字は両端だけにする */
const NUMBERED_LEVEL_LIMIT = 8

/** 軸を描画域より少し伸ばす長さと、目盛りの長さ */
const AXIS_OVERSHOOT = 0.18
const TICK_LENGTH = 0.075

/** 目盛りの数字を、目盛りの先からさらに逃がす距離 */
const LEVEL_LABEL_MARGIN = 0.08

/** 入力と出力を指す点を示す球の半径 */
const DOT_RADIUS = 0.045

/** 補助線の破線の刻みと薄さ。階段や 45 度の直線より控えめに見せる */
const DASH_SIZE = 0.07
const GAP_SIZE = 0.05
const GUIDE_OPACITY = 0.75

/** 立ち上がりの薄さ。踏み板（丸めた結果そのもの）より控えめに見せる */
const RISER_OPACITY = 0.45

/** 凡例を並べる高さと、項目どうしの間隔 */
const LEGEND_Y = PLOT_SIZE + 0.58
const LEGEND_GAP = 0.32

/** 軸の名前・目盛りの文字・凡例の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.22
const TICK_LABEL_HEIGHT = 0.19
const LEGEND_HEIGHT = 0.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_AXIS = 0.01
const LAYER_RISER = 0.02
const LAYER_SOURCE = 0.03
const LAYER_TREAD = 0.04
const LAYER_GUIDE = 0.05
const LAYER_GAP = 0.06
const LAYER_DOT = 0.07
const LAYER_LABEL = 0.12

// 背景（暗めのグレー）の上で、丸める前・丸めた後・その差を互いに見分けられる色にする
const SOURCE_COLOR = "#5ec8f2"
const OUTPUT_COLOR = "#ffc857"
const GAP_COLOR = "#f2766a"
const GUIDE_COLOR = "#aeb6c2"
const AXIS_COLOR = "#9aa3b0"
const TICK_LABEL_COLOR = "#c9d2de"

/** グラフ全体を canvas の中央に寄せる位置 */
const GRAPH_OFFSET = new Vector3(-PLOT_SIZE / 2, -1.22, 0)

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

/** 段階の間隔。段階の数が L なら、明るさの 0〜1 を L - 1 等分した幅になる */
const stepWidthOf = (levelCount: number) => 1 / (levelCount - 1)

/** 明るさ（0〜1）を一番近い段階に丸めたときの、段階の番号（＝画素値） */
const pixelValueOf = (brightness: number, levelCount: number) =>
  Math.round(brightness * (levelCount - 1))

export const createQuantizationStaircaseScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 横軸（入力の明るさ）と縦軸（出力の画素値）。横軸の右端には目盛りを付ける
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(PLOT_SIZE + AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(0, -AXIS_OVERSHOOT, LAYER_AXIS),
    new Vector3(0, PLOT_SIZE + AXIS_OVERSHOOT, LAYER_AXIS),
    new Vector3(PLOT_SIZE, 0, LAYER_AXIS),
    new Vector3(PLOT_SIZE, -TICK_LENGTH, LAYER_AXIS)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // 縦軸の目盛り。段階の数が変わるたびに引き直すので、頂点は上限の数だけ先に確保しておく
  const tickPosition = new Float32BufferAttribute(new Float32Array(MAX_LEVEL_COUNT * 2 * 3), 3)
  const tickGeometry = new BufferGeometry().setAttribute("position", tickPosition)
  graph.add(new LineSegments(tickGeometry, axisMaterial))

  // 丸める前の明るさ。入力がそのまま出力になる（丸めが起きない）場合を表す 45 度の直線
  const sourceGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, LAYER_SOURCE),
    new Vector3(PLOT_SIZE, PLOT_SIZE, LAYER_SOURCE)
  ])
  const sourceMaterial = new LineBasicMaterial({ color: SOURCE_COLOR })
  graph.add(new Line(sourceGeometry, sourceMaterial))

  // 量子化特性の踏み板。同じ段階に丸められる明るさの範囲が、1 段の横幅になる
  const treadPosition = new Float32BufferAttribute(new Float32Array(MAX_LEVEL_COUNT * 2 * 3), 3)
  const treadGeometry = new BufferGeometry().setAttribute("position", treadPosition)
  const treadMaterial = new LineBasicMaterial({ color: OUTPUT_COLOR })
  graph.add(new LineSegments(treadGeometry, treadMaterial))

  // 踏み板と踏み板の境目にある立ち上がり。ここで出力が 1 段階ぶん飛ぶ
  const riserPosition = new Float32BufferAttribute(
    new Float32Array((MAX_LEVEL_COUNT - 1) * 2 * 3),
    3
  )
  const riserGeometry = new BufferGeometry().setAttribute("position", riserPosition)
  const riserMaterial = new LineBasicMaterial({
    color: OUTPUT_COLOR,
    transparent: true,
    opacity: RISER_OPACITY
  })
  graph.add(new LineSegments(riserGeometry, riserMaterial))

  // 入力の明るさを縦に辿り、丸めた先の画素値を横に読み取るための補助線
  const guidePosition = new Float32BufferAttribute(new Float32Array(2 * 2 * 3), 3)
  const guideGeometry = new BufferGeometry().setAttribute("position", guidePosition)
  const guideMaterial = new LineDashedMaterial({
    color: GUIDE_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE,
    transparent: true,
    opacity: GUIDE_OPACITY
  })
  const guides = new LineSegments(guideGeometry, guideMaterial)
  graph.add(guides)

  // 丸めによって生じるずれ。45 度の直線上の明るさと、丸めた先の画素値との差
  const gapPosition = new Float32BufferAttribute(new Float32Array(2 * 3), 3)
  const gapGeometry = new BufferGeometry().setAttribute("position", gapPosition)
  const gapMaterial = new LineBasicMaterial({ color: GAP_COLOR })
  graph.add(new LineSegments(gapGeometry, gapMaterial))

  // 丸める前の明るさ（45 度の直線上）と、丸めた後の画素値（踏み板の上）を指す点
  const dotGeometry = new SphereGeometry(DOT_RADIUS, 12, 8)
  const inputDotMaterial = new MeshBasicMaterial({ color: SOURCE_COLOR })
  const inputDot = new Mesh(dotGeometry, inputDotMaterial)
  graph.add(inputDot)

  const outputDotMaterial = new MeshBasicMaterial({ color: OUTPUT_COLOR })
  const outputDot = new Mesh(dotGeometry, outputDotMaterial)
  graph.add(outputDot)

  const staticLabels = [
    { text: "暗", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: 0, y: -0.2 },
    { text: "明", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: PLOT_SIZE, y: -0.2 },
    {
      text: "入力の明るさ",
      color: AXIS_COLOR,
      height: LABEL_HEIGHT,
      x: PLOT_SIZE / 2,
      y: -0.52
    },
    {
      text: "出力の画素値",
      color: AXIS_COLOR,
      height: LABEL_HEIGHT,
      x: 0,
      y: PLOT_SIZE + 0.26
    }
  ].map(({ text, color, height, x, y }) => {
    const label = createLabel(text, color, height)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  const legendLabels = [
    { text: "丸める前の明るさ", color: SOURCE_COLOR },
    { text: "量子化後の画素値", color: OUTPUT_COLOR },
    { text: "丸めのずれ", color: GAP_COLOR }
  ].map(({ text, color }) => createLabel(text, color, LEGEND_HEIGHT))

  // 凡例は文字数で幅が変わるので、3 つ分の幅を測ってから横一列に中央揃えで並べる
  const legendWidth =
    legendLabels.reduce((total, { sprite }) => total + sprite.scale.x, 0) +
    LEGEND_GAP * (legendLabels.length - 1)
  let legendLeft = PLOT_SIZE / 2 - legendWidth / 2
  legendLabels.forEach(({ sprite }) => {
    sprite.position.set(legendLeft + sprite.scale.x / 2, LEGEND_Y, LAYER_LABEL)
    graph.add(sprite)
    legendLeft += sprite.scale.x + LEGEND_GAP
  })

  // 縦軸の目盛りに添える画素値。段階の数を動かすたびに位置と表示を切り替えるので、
  // 使いうる数字をあらかじめ作っておく
  const levelLabels = Array.from({ length: MAX_LEVEL_COUNT }, (_, k) => {
    const label = createLabel(String(k), TICK_LABEL_COLOR, TICK_LABEL_HEIGHT)
    // 桁数で幅が変わるので、軸から一定の距離で右端が揃うように置く
    label.sprite.position.x = -TICK_LENGTH - LEVEL_LABEL_MARGIN - label.sprite.scale.x / 2
    label.sprite.position.z = LAYER_LABEL
    label.sprite.visible = false
    graph.add(label.sprite)
    return label
  })

  // 段階の数や入力の明るさが変わったときだけ引き直す（カメラを動かしただけでは作り直さない）
  let builtLevelCount = NaN
  let builtInput = NaN

  return {
    update: () => {
      const { levelCount, input } = params
      const stepWidth = stepWidthOf(levelCount)

      // 一番近い段階に丸める。その段階の番号がそのまま画素値になる
      const pixelValue = pixelValueOf(input, levelCount)
      const output = pixelValue * stepWidth

      params.pixelValue = `${pixelValue}（0〜${levelCount - 1}）`
      params.gap = Math.abs(output - input).toFixed(3)

      if (levelCount === builtLevelCount && input === builtInput) return

      // 階段と縦軸の目盛りは、段階の数が変わったときだけ引き直す
      if (levelCount !== builtLevelCount) {
        for (let k = 0; k < levelCount; k++) {
          const y = k * stepWidth * PLOT_SIZE

          // 踏み板。その段階に丸められる明るさの範囲は、隣の段階との中間までになる
          const from = Math.max((k - 0.5) * stepWidth, 0) * PLOT_SIZE
          const to = Math.min((k + 0.5) * stepWidth, 1) * PLOT_SIZE
          treadPosition.setXYZ(k * 2, from, y, LAYER_TREAD)
          treadPosition.setXYZ(k * 2 + 1, to, y, LAYER_TREAD)

          tickPosition.setXYZ(k * 2, -TICK_LENGTH, y, LAYER_AXIS)
          tickPosition.setXYZ(k * 2 + 1, 0, y, LAYER_AXIS)

          // 立ち上がり。1 つ前の段階の高さから、この段階の高さまで垂直に飛ぶ
          if (k > 0) {
            riserPosition.setXYZ((k - 1) * 2, from, y - stepWidth * PLOT_SIZE, LAYER_RISER)
            riserPosition.setXYZ((k - 1) * 2 + 1, from, y, LAYER_RISER)
          }
        }
        treadPosition.needsUpdate = true
        treadGeometry.setDrawRange(0, levelCount * 2)
        tickPosition.needsUpdate = true
        tickGeometry.setDrawRange(0, levelCount * 2)
        riserPosition.needsUpdate = true
        riserGeometry.setDrawRange(0, (levelCount - 1) * 2)

        // 目盛りの数字。段階が細かいときは数字どうしが重なるので、両端だけを残す
        levelLabels.forEach(({ sprite }, k) => {
          sprite.visible =
            k < levelCount &&
            (levelCount <= NUMBERED_LEVEL_LIMIT || k === 0 || k === levelCount - 1)
          sprite.position.y = k * stepWidth * PLOT_SIZE
        })
      }

      builtLevelCount = levelCount
      builtInput = input

      // 45 度の直線上では、明るさがそのまま高さになる（丸めが起きなければ出力もこの高さ）
      const x = input * PLOT_SIZE
      const outputY = output * PLOT_SIZE

      guidePosition.setXYZ(0, x, 0, LAYER_GUIDE)
      guidePosition.setXYZ(1, x, x, LAYER_GUIDE)
      guidePosition.setXYZ(2, x, outputY, LAYER_GUIDE)
      guidePosition.setXYZ(3, 0, outputY, LAYER_GUIDE)
      guidePosition.needsUpdate = true
      // 破線の刻みは頂点間の距離から決まるので、頂点を動かしたら測り直す
      guides.computeLineDistances()

      gapPosition.setXYZ(0, x, x, LAYER_GAP)
      gapPosition.setXYZ(1, x, outputY, LAYER_GAP)
      gapPosition.needsUpdate = true

      inputDot.position.set(x, x, LAYER_DOT)
      outputDot.position.set(x, outputY, LAYER_DOT)
    },
    dispose: () => {
      const disposables = [
        axisGeometry,
        axisMaterial,
        tickGeometry,
        sourceGeometry,
        sourceMaterial,
        treadGeometry,
        treadMaterial,
        riserGeometry,
        riserMaterial,
        guideGeometry,
        guideMaterial,
        gapGeometry,
        gapMaterial,
        dotGeometry,
        inputDotMaterial,
        outputDotMaterial,
        ...[...staticLabels, ...legendLabels, ...levelLabels].flatMap((label) => [
          label.texture,
          label.material
        ])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
