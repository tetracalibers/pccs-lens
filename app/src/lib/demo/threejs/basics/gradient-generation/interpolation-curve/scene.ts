import {
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
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

/** 補間に使う関数の種類 */
export type CurveKind = "linear" | "quadraticIn" | "quadraticOut" | "logarithmic"

/** Tweakpane で操作するパラメータ */
export type InterpolationCurveParams = {
  /** 補間に使う関数 */
  curve: CurveKind
  /** 選んだ関数の式。scene.ts が書き戻す */
  formula: string
  /** 中央（t = 0.5）での値。scene.ts が計算して書き戻す */
  midValue: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: InterpolationCurveParams
}

/**
 * 補間関数。どれも f(0) = 0・f(1) = 1 を満たすので、
 * 両端の色は変わらず、途中の変化の仕方だけが変わる
 */
const CURVES: Record<CurveKind, { formula: string; valueAt: (t: number) => number }> = {
  linear: { formula: "f(t) = t", valueAt: (t) => t },
  quadraticIn: { formula: "f(t) = t²", valueAt: (t) => t * t },
  quadraticOut: { formula: "f(t) = 1 - (1 - t)²", valueAt: (t) => 1 - (1 - t) ** 2 },
  // log(1 + 9t) / log(10)。t = 1 でちょうど 1 になるよう、底が 10 になるように 9 倍する
  logarithmic: { formula: "f(t) = log(1 + 9t) / log(10)", valueAt: (t) => Math.log10(1 + 9 * t) }
}

/** グラフの大きさ。横軸に割合 t の 0〜1、縦軸に補間した値 f(t) の 0〜1 を対応させる */
const PLOT_WIDTH = 4
const PLOT_HEIGHT = 1.9

/** グラフの下に敷くグラデーションの帯と、グラフとの間隔 */
const BAND_HEIGHT = 0.5
const BAND_GAP = 0.36
const BAND_BOTTOM = -(BAND_GAP + BAND_HEIGHT)

/** 帯を焼くときの画素数。1 画素ずつ t を求めて明るさを決める */
const RESOLUTION = 256

/** カーブを折れ線で描くときの分割数。曲がりが角張って見えない程度に細かくとる */
const CURVE_SEGMENTS = 128

/** 補助線を引く位置。両端ではなく中央を見ることで、変化の偏りが読み取れる */
const MID_T = 0.5

/** 軸を目盛りの外側へ少し延ばす長さと、目盛りの長さ */
const AXIS_MARGIN = 0.16
const TICK_LENGTH = 0.07

/** xy 平面に重なる要素を、奥から手前へ振り分ける z。正面から見る構図なので厚みは絵に出ない */
const LAYER_BAND_FRAME = 0.002
const LAYER_AXIS = 0.01
const LAYER_REFERENCE = 0.02
const LAYER_GUIDE = 0.03
const LAYER_CURVE = 0.04
const LAYER_DOT = 0.05

const AXIS_COLOR = "#9aa3b0"
const CURVE_COLOR = "#ffc857"
/** 線形補間のカーブ。選んだカーブがそこからどれだけ外れているかを見るための基準線 */
const REFERENCE_COLOR = "#6e7a8a"
const GUIDE_COLOR = "#aeb6c2"
const FRAME_COLOR = "#c8ccd4"
const LABEL_COLOR = "#c9d2de"

/** ラベルの文字の大きさ（ワールド座標での高さ） */
const AXIS_LABEL_HEIGHT = 0.2
const TICK_LABEL_HEIGHT = 0.17

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 図全体を canvas の中央に寄せるための、グラフ原点の位置 */
const ORIGIN_X = -2.04
const ORIGIN_Y = -0.68

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
 */
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

export const createInterpolationCurveScene = ({ scene, params }: SceneContext) => {
  // 図はすべて xy 平面に置く。グラフの原点を group の原点にとり、group ごと中央へ寄せる
  const graph = new Group()
  graph.position.set(ORIGIN_X, ORIGIN_Y, 0)
  scene.add(graph)

  // 横軸（割合 t）と縦軸（補間した値 f(t)）、および t = 0.5・1 と f = 1 の目盛り
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-AXIS_MARGIN, 0, LAYER_AXIS),
    new Vector3(PLOT_WIDTH + AXIS_MARGIN, 0, LAYER_AXIS),
    new Vector3(0, -AXIS_MARGIN, LAYER_AXIS),
    new Vector3(0, PLOT_HEIGHT + AXIS_MARGIN, LAYER_AXIS),
    new Vector3(MID_T * PLOT_WIDTH, 0, LAYER_AXIS),
    new Vector3(MID_T * PLOT_WIDTH, -TICK_LENGTH, LAYER_AXIS),
    new Vector3(PLOT_WIDTH, 0, LAYER_AXIS),
    new Vector3(PLOT_WIDTH, -TICK_LENGTH, LAYER_AXIS),
    new Vector3(-TICK_LENGTH, PLOT_HEIGHT, LAYER_AXIS),
    new Vector3(0, PLOT_HEIGHT, LAYER_AXIS)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // 線形補間のカーブ。両端をまっすぐ結んだ基準線として、選んだカーブの下に敷いておく
  const referenceGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, LAYER_REFERENCE),
    new Vector3(PLOT_WIDTH, PLOT_HEIGHT, LAYER_REFERENCE)
  ])
  const referenceMaterial = new LineBasicMaterial({ color: REFERENCE_COLOR })
  const reference = new Line(referenceGeometry, referenceMaterial)
  graph.add(reference)

  // 選んだ補間関数のカーブ。関数を切り替えるたびに、同じ頂点を動かして描き直す
  const curveGeometry = new BufferGeometry()
  curveGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array((CURVE_SEGMENTS + 1) * 3), 3)
  )
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  graph.add(new Line(curveGeometry, curveMaterial))

  // グラフの下に敷くグラデーションの帯。横 1 列の画素として焼き、横軸を t として共有する
  const bandData = new Uint8Array(RESOLUTION * 4)
  const bandTexture = new DataTexture(bandData, RESOLUTION, 1)
  bandTexture.colorSpace = SRGBColorSpace
  bandTexture.magFilter = LinearFilter
  bandTexture.minFilter = LinearFilter

  // 補間した値をそのままの濃さで見せたいので、陰影の付かない材質で貼る
  const bandGeometry = new PlaneGeometry(PLOT_WIDTH, BAND_HEIGHT)
  const bandMaterial = new MeshBasicMaterial({ map: bandTexture })
  const band = new Mesh(bandGeometry, bandMaterial)
  band.position.set(PLOT_WIDTH / 2, -(BAND_GAP + BAND_HEIGHT / 2), 0)
  graph.add(band)

  // 帯の外周。暗い端が背景に溶けても、帯の範囲が分かるようにする
  const bandFrameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -BAND_GAP, LAYER_BAND_FRAME),
    new Vector3(PLOT_WIDTH, -BAND_GAP, LAYER_BAND_FRAME),
    new Vector3(PLOT_WIDTH, -BAND_GAP, LAYER_BAND_FRAME),
    new Vector3(PLOT_WIDTH, BAND_BOTTOM, LAYER_BAND_FRAME),
    new Vector3(PLOT_WIDTH, BAND_BOTTOM, LAYER_BAND_FRAME),
    new Vector3(0, BAND_BOTTOM, LAYER_BAND_FRAME),
    new Vector3(0, BAND_BOTTOM, LAYER_BAND_FRAME),
    new Vector3(0, -BAND_GAP, LAYER_BAND_FRAME)
  ])
  const bandFrameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  graph.add(new LineSegments(bandFrameGeometry, bandFrameMaterial))

  // 中央（t = 0.5）の補助線。カーブの高さを縦軸へ、そのまま帯の明るさへ辿れるようにする
  const guideGeometry = new BufferGeometry()
  guideGeometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(4 * 3), 3))
  const guideMaterial = new LineDashedMaterial({
    color: GUIDE_COLOR,
    dashSize: 0.07,
    gapSize: 0.05
  })
  const guides = new LineSegments(guideGeometry, guideMaterial)
  graph.add(guides)

  // 中央でのカーブ上の点
  const dotGeometry = new SphereGeometry(0.05, 12, 8)
  const dotMaterial = new MeshBasicMaterial({ color: CURVE_COLOR })
  const dot = new Mesh(dotGeometry, dotMaterial)
  graph.add(dot)

  const labels = [
    { text: "t", x: PLOT_WIDTH + AXIS_MARGIN + 0.1, y: 0.16, height: AXIS_LABEL_HEIGHT },
    { text: "f(t)", x: 0.28, y: PLOT_HEIGHT + AXIS_MARGIN + 0.06, height: AXIS_LABEL_HEIGHT },
    { text: "0", x: -0.18, y: 0, height: TICK_LABEL_HEIGHT },
    { text: "1", x: -0.18, y: PLOT_HEIGHT, height: TICK_LABEL_HEIGHT },
    { text: "0.5", x: MID_T * PLOT_WIDTH, y: -0.19, height: TICK_LABEL_HEIGHT },
    { text: "1", x: PLOT_WIDTH, y: -0.19, height: TICK_LABEL_HEIGHT }
  ].map(({ text, x, y, height }) => {
    const label = createLabel(text, height)
    label.sprite.position.set(x, y, LAYER_DOT)
    graph.add(label.sprite)
    return label
  })

  // 補間関数が変わったときだけ描き直す（カメラを動かしただけでは焼き直さない）
  let builtCurve: CurveKind | null = null

  return {
    update: () => {
      const { curve } = params
      const { formula, valueAt } = CURVES[curve]

      params.formula = formula
      params.midValue = valueAt(MID_T).toFixed(2)

      if (curve === builtCurve) return
      builtCurve = curve

      // 線形を選んでいるときは、カーブが基準線とぴったり重なるので基準線を隠す
      reference.visible = curve !== "linear"

      // カーブ：割合 t を等間隔に刻み、その位置での f(t) を高さにとる
      const curvePosition = curveGeometry.getAttribute("position")
      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const t = i / CURVE_SEGMENTS
        curvePosition.setXYZ(i, t * PLOT_WIDTH, valueAt(t) * PLOT_HEIGHT, LAYER_CURVE)
      }
      curvePosition.needsUpdate = true
      curveGeometry.computeBoundingSphere()

      // 帯：画素 1 つ分の真ん中で割合 t を求め、f(t) をその画素の明るさとして焼く
      for (let column = 0; column < RESOLUTION; column++) {
        const t = (column + 0.5) / RESOLUTION
        const level = Math.round(valueAt(t) * 255)
        bandData.set([level, level, level, 255], column * 4)
      }
      bandTexture.needsUpdate = true

      // 中央の補助線：カーブ上の点から、下へ帯まで、左へ縦軸まで辿る
      const midX = MID_T * PLOT_WIDTH
      const midY = valueAt(MID_T) * PLOT_HEIGHT
      const guidePosition = guideGeometry.getAttribute("position")
      guidePosition.setXYZ(0, midX, midY, LAYER_GUIDE)
      guidePosition.setXYZ(1, midX, BAND_BOTTOM, LAYER_GUIDE)
      guidePosition.setXYZ(2, 0, midY, LAYER_GUIDE)
      guidePosition.setXYZ(3, midX, midY, LAYER_GUIDE)
      guidePosition.needsUpdate = true
      // 破線の刻みは頂点間の距離から決まるので、頂点を動かしたら測り直す
      guides.computeLineDistances()

      dot.position.set(midX, midY, LAYER_DOT)
    },
    dispose: () => {
      const disposables = [
        axisGeometry,
        axisMaterial,
        referenceGeometry,
        referenceMaterial,
        curveGeometry,
        curveMaterial,
        bandTexture,
        bandGeometry,
        bandMaterial,
        bandFrameGeometry,
        bandFrameMaterial,
        guideGeometry,
        guideMaterial,
        dotGeometry,
        dotMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
