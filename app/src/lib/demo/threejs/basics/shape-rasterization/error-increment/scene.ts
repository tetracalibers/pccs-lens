import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ErrorIncrementParams = {
  /** 直線の傾き a。x を 1 進めたときに y が増える量 */
  slope: number
  /** x をいくつ進めたか。この列まで塗り進めた状態を見せる */
  step: number
  /** 現在の誤差。scene.ts が組み立てて書き戻すので、初期値は使われない */
  error: string
  /** 0.5 との比較と、その結果。scene.ts が組み立てて書き戻すので、初期値は使われない */
  judgement: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ErrorIncrementParams
}

/**
 * 画素の格子。誤差と 0.5（画素の半分）の大小を読み取れるよう、画素を大きめにとる。
 * 直線は左上の画素の中心から始まり、傾きの上限まで格子の中に収まる
 */
const COLUMNS = 9
const ROWS = 6
const PITCH = 0.4
const PLOT_WIDTH = COLUMNS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/** 描きたい直線の太さ。線材の線幅は WebGL では 1 ドット固定なので、細長い長方形として描く */
const LINE_THICKNESS = 0.034

/** 誤差を示す棒の太さと、しきい値の目印の太さ */
const ERROR_THICKNESS = 0.032
const THRESHOLD_THICKNESS = 0.03

/** 誤差を測る基準（画素の中心）を示す点の半径 */
const DOT_RADIUS = 0.042

/**
 * 塗った画素を縦横に 2 等分する破線の、破線と隙間の長さ。
 * 画素 1 つぶん（PITCH）が周期（破線 + 隙間）のちょうど整数倍になる値をとる。
 * three の LineSegments は破線の位相を線分をまたいで積算するため、
 * 整数倍でないとどの画素の破線がどこから始まるかが揃わない
 */
const HALVING_DASH_SIZE = 0.045
const HALVING_GAP_SIZE = 0.035

/** しきい値の線の両端を示す点の半径。誤差の点より小さくして、主役を取らないようにする */
const THRESHOLD_DOT_RADIUS = 0.028

/** 座標軸を格子の外へ逃がす距離と、軸を格子より長く伸ばす分 */
const AXIS_MARGIN = 0.18
const AXIS_OVERSHOOT = 0.26

/** 座標軸の矢じりの大きさ */
const ARROW_HEIGHT = 0.16
const ARROW_RADIUS = 0.06

/** 軸の名前・凡例の文字の高さ（ワールド座標での大きさ） */
const AXIS_LABEL_HEIGHT = 0.24
const NOTE_LABEL_HEIGHT = 0.22

/** しきい値 0.5 の注記の文字の高さと、注記を線から逃がす距離。線に添えて小さく置く */
const THRESHOLD_LABEL_HEIGHT = 0.18
const THRESHOLD_LABEL_MARGIN = 0.04

/**
 * 誤差 e の凡例。図の中では誤差の棒と他の要素が重なって読めないので、
 * 座標平面の右に出す。色見本は実際の描き方と同じ形（片端に点を置いた縦線）にする
 */
const LEGEND_SWATCH_LENGTH = 0.24
const LEGEND_SWATCH_GAP = 0.09
const LEGEND_OFFSET_X = 0.58
const LEGEND_OFFSET_Y = 0.32

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない。
 * ただし透視投影なので、z が離れると同じ x・y でも投影される位置がわずかにずれる。
 * 1 つの目印を線と点で組み立てる場合は、パーツの z を隣り合う値にして揃える
 */
const LAYER_PIXEL = 0.01
const LAYER_CURRENT_PIXEL = 0.015
const LAYER_HALVING = 0.018
const LAYER_GRID = 0.02
const LAYER_FRAME = 0.03
const LAYER_AXIS = 0.04
const LAYER_THRESHOLD = 0.05
const LAYER_THRESHOLD_DOT = 0.051
const LAYER_LINE = 0.06
const LAYER_ERROR = 0.07
const LAYER_ERROR_DOT = 0.071
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、塗った画素・直線・誤差・しきい値を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const LINE_COLOR = "#6fd8ff"
const PIXEL_COLOR = "#ffc857"
const PAST_PIXEL_OPACITY = 0.45
const ERROR_COLOR = "#f2766a"
const THRESHOLD_COLOR = "#b48cf2"
const AXIS_COLOR = "#9aa3b0"

/** 図全体を canvas の中央に寄せる位置 */
const GRAPH_OFFSET = new Vector3(-0.13, 0, 0)

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
 * x（画素の列）と y（画素の行を単位とした小数）のワールド座標。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる
 */
const worldXOf = (x: number) => -HALF_WIDTH + (x + 0.5) * PITCH
const worldYOf = (y: number) => HALF_HEIGHT - (y + 0.5) * PITCH

/**
 * 画素 (column, row) を縦横に 2 等分する破線の頂点を、positions の offset から書き込む。
 * 画素の中心から辺までが 0.5 であることを、線として目で追えるようにする
 */
const writeHalvingLines = (
  positions: Float32Array,
  offset: number,
  column: number,
  row: number
) => {
  const centerX = worldXOf(column)
  const centerY = worldYOf(row)
  const half = PITCH / 2
  positions.set(
    [
      // 縦の 2 等分線
      centerX,
      centerY - half,
      LAYER_HALVING,
      centerX,
      centerY + half,
      LAYER_HALVING,
      // 横の 2 等分線
      centerX - half,
      centerY,
      LAYER_HALVING,
      centerX + half,
      centerY,
      LAYER_HALVING
    ],
    offset
  )
  return offset + 12
}

export const createErrorIncrementScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  const barGeometry = new PlaneGeometry(1, 1)

  // すでに塗った画素。いま決めた画素と見分けるため、控えめな濃さにする
  const pastPixelMaterial = new MeshBasicMaterial({
    color: PIXEL_COLOR,
    transparent: true,
    opacity: PAST_PIXEL_OPACITY
  })
  const pastPixels = new InstancedMesh(barGeometry, pastPixelMaterial, COLUMNS)
  pastPixels.frustumCulled = false
  graph.add(pastPixels)

  // 塗った画素を縦横に 2 等分する破線。塗る画素の数は step で変わるので、
  // 最大数ぶんの頂点を確保しておき、update() で使う本数だけ描く
  const halvingPositions = new Float32Array(COLUMNS * 12)
  const halvingGeometry = new BufferGeometry()
  halvingGeometry.setAttribute("position", new BufferAttribute(halvingPositions, 3))
  const halvingMaterial = new LineDashedMaterial({
    color: GRID_COLOR,
    dashSize: HALVING_DASH_SIZE,
    gapSize: HALVING_GAP_SIZE
  })
  const halvingLines = new LineSegments(halvingGeometry, halvingMaterial)
  halvingLines.frustumCulled = false
  graph.add(halvingLines)

  // いま誤差の判定で決めた画素
  const currentPixelMaterial = new MeshBasicMaterial({ color: PIXEL_COLOR })
  const currentPixel = new Mesh(barGeometry, currentPixelMaterial)
  currentPixel.scale.set(PITCH, PITCH, 1)
  graph.add(currentPixel)

  // 画素どうしの境目。誤差と比べる 0.5 は、画素の中心から境目までの距離に当たる
  const gridPoints: Vector3[] = []
  for (let column = 0; column <= COLUMNS; column++) {
    const x = -HALF_WIDTH + column * PITCH
    gridPoints.push(new Vector3(x, -HALF_HEIGHT, LAYER_GRID), new Vector3(x, HALF_HEIGHT, LAYER_GRID))
  }
  for (let row = 0; row <= ROWS; row++) {
    const y = HALF_HEIGHT - row * PITCH
    gridPoints.push(new Vector3(-HALF_WIDTH, y, LAYER_GRID), new Vector3(HALF_WIDTH, y, LAYER_GRID))
  }
  const gridGeometry = new BufferGeometry().setFromPoints(gridPoints)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  graph.add(new LineSegments(gridGeometry, gridMaterial))

  // 画像の外周
  const frameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(-HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(-HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(-HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME)
  ])
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  graph.add(new LineSegments(frameGeometry, frameMaterial))

  // 画像座標系の軸。左上の原点から、x 軸は右へ、y 軸は下へ伸ばす
  const axisTopY = HALF_HEIGHT + AXIS_MARGIN
  const axisLeftX = -HALF_WIDTH - AXIS_MARGIN
  const axisRightX = HALF_WIDTH + AXIS_OVERSHOOT
  const axisBottomY = -HALF_HEIGHT - AXIS_OVERSHOOT
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(axisLeftX, axisTopY, LAYER_AXIS),
    new Vector3(axisRightX, axisTopY, LAYER_AXIS),
    new Vector3(axisLeftX, axisTopY, LAYER_AXIS),
    new Vector3(axisLeftX, axisBottomY, LAYER_AXIS)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // 軸の矢じり。ConeGeometry は +y 向きに尖っているので、向きたい方向へ回す
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const arrowMaterial = new MeshBasicMaterial({ color: AXIS_COLOR })

  const xArrow = new Mesh(arrowGeometry, arrowMaterial)
  xArrow.position.set(axisRightX + ARROW_HEIGHT / 2, axisTopY, LAYER_AXIS)
  xArrow.rotation.z = -Math.PI / 2
  graph.add(xArrow)

  const yArrow = new Mesh(arrowGeometry, arrowMaterial)
  yArrow.position.set(axisLeftX, axisBottomY - ARROW_HEIGHT / 2, LAYER_AXIS)
  yArrow.rotation.z = Math.PI
  graph.add(yArrow)

  // 誤差を比べるしきい値 0.5。画素の右辺に、中心から境目まで（画素の半分）の長さで立てる
  const thresholdMaterial = new MeshBasicMaterial({ color: THRESHOLD_COLOR })
  const threshold = new Mesh(barGeometry, thresholdMaterial)
  threshold.scale.set(THRESHOLD_THICKNESS, PITCH / 2, 1)
  graph.add(threshold)

  // 描きたい直線。図の主役なので、格子線に埋もれない太さで描く
  const lineMaterial = new MeshBasicMaterial({ color: LINE_COLOR })
  const straightLine = new Mesh(barGeometry, lineMaterial)
  graph.add(straightLine)

  // 誤差。1 つ前に塗った画素の中心から、直線までの y 方向の隔たり
  const errorMaterial = new MeshBasicMaterial({ color: ERROR_COLOR })
  const errorBar = new Mesh(barGeometry, errorMaterial)
  graph.add(errorBar)

  // 誤差を測る基準となる、1 つ前に塗った画素の中心
  const dotGeometry = new CircleGeometry(DOT_RADIUS, 16)
  const dotMaterial = new MeshBasicMaterial({ color: ERROR_COLOR })
  const baseDot = new Mesh(dotGeometry, dotMaterial)
  graph.add(baseDot)

  // しきい値の線の両端。誤差の点と同じ形で、半径だけ小さくする
  const thresholdDotGeometry = new CircleGeometry(THRESHOLD_DOT_RADIUS, 16)
  const thresholdDots = [0, 1].map(() => {
    const dot = new Mesh(thresholdDotGeometry, thresholdMaterial)
    graph.add(dot)
    return dot
  })

  const axisLabels = [
    { text: "x", x: axisRightX + 0.36, y: axisTopY },
    { text: "y", x: axisLeftX - 0.26, y: axisBottomY + 0.3 }
  ].map(({ text, x, y }) => {
    const label = createLabel(text, AXIS_COLOR, AXIS_LABEL_HEIGHT)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  // しきい値の注記。文字は変わらないので作り直さず、位置だけ毎回動かす
  const thresholdLabel = createLabel("0.5", THRESHOLD_COLOR, THRESHOLD_LABEL_HEIGHT)
  graph.add(thresholdLabel.sprite)

  // 誤差 e の凡例。座標平面の右上に、図の中の誤差と同じ形（片端に点を置いた縦線）で置く。
  // 位置も文字も変わらないので、ここで一度だけ置く
  const legendLabel = createLabel("e", ERROR_COLOR, NOTE_LABEL_HEIGHT)
  const legendBar = new Mesh(barGeometry, errorMaterial)
  legendBar.scale.set(ERROR_THICKNESS, LEGEND_SWATCH_LENGTH, 1)
  const legendDot = new Mesh(dotGeometry, dotMaterial)
  graph.add(legendLabel.sprite, legendBar, legendDot)

  const legendX = HALF_WIDTH + LEGEND_OFFSET_X
  const legendY = HALF_HEIGHT - LEGEND_OFFSET_Y
  legendBar.position.set(legendX, legendY, LAYER_ERROR)
  // 点は、図の中で誤差を測る基準（画素の中心）にあたる側の端に置く
  legendDot.position.set(legendX, legendY + LEGEND_SWATCH_LENGTH / 2, LAYER_ERROR_DOT)
  legendLabel.sprite.position.set(
    legendX + LEGEND_SWATCH_GAP + legendLabel.sprite.scale.x / 2,
    legendY,
    LAYER_LABEL
  )

  const matrix = new Matrix4()

  return {
    update: () => {
      const { slope } = params
      const step = Math.round(params.step)

      // 直線は左上の画素の中心から引く。傾きを変えると、その点を軸に回る
      const pivotX = worldXOf(0)
      const pivotY = worldYOf(0)
      const length = (PLOT_WIDTH - PITCH / 2) * Math.hypot(1, slope)
      straightLine.scale.set(length, LINE_THICKNESS, 1)
      straightLine.rotation.z = Math.atan(-slope)
      // 左端を軸に合わせるため、線の中心を伸びる向きへ半分ずらす
      straightLine.position.set(
        pivotX + (length / 2) * Math.cos(straightLine.rotation.z),
        pivotY + (length / 2) * Math.sin(straightLine.rotation.z),
        LAYER_LINE
      )

      // 誤差による増分法。誤差に傾きを足し、0.5 を超えたら塗る画素を 1 行進めて誤差から 1 を引く
      let row = 0
      let error = 0
      let previousRow = 0
      let errorBefore = 0

      matrix.makeScale(PITCH, PITCH, 1)
      matrix.setPosition(worldXOf(0), worldYOf(0), LAYER_PIXEL)
      pastPixels.setMatrixAt(0, matrix)
      let halvingOffset = writeHalvingLines(halvingPositions, 0, 0, 0)

      for (let x = 1; x <= step; x++) {
        previousRow = row
        errorBefore = error

        error += slope
        if (error > 0.5) {
          row += 1
          error -= 1
        }

        matrix.makeScale(PITCH, PITCH, 1)
        matrix.setPosition(worldXOf(x), worldYOf(row), LAYER_PIXEL)
        pastPixels.setMatrixAt(x, matrix)
        halvingOffset = writeHalvingLines(halvingPositions, halvingOffset, x, row)
      }
      pastPixels.count = step + 1
      pastPixels.instanceMatrix.needsUpdate = true

      // 破線は、書き込んだぶんだけ描く。位相を測り直すため線分の長さも計算し直す
      halvingGeometry.setDrawRange(0, halvingOffset / 3)
      halvingGeometry.attributes.position.needsUpdate = true
      halvingLines.computeLineDistances()

      // いま決めた画素を、濃い色で重ねる
      currentPixel.position.set(worldXOf(step), worldYOf(row), LAYER_CURRENT_PIXEL)

      // 誤差は、1 つ前に塗った画素の中心から測る。step が 0 のときは測る相手がいない
      const showError = step > 0
      errorBar.visible = showError
      baseDot.visible = showError
      threshold.visible = showError
      thresholdDots.forEach((dot) => (dot.visible = showError))
      thresholdLabel.sprite.visible = showError
      legendLabel.sprite.visible = showError
      legendBar.visible = showError
      legendDot.visible = showError

      const errorAfterIncrement = errorBefore + slope

      if (showError) {
        const baseY = worldYOf(previousRow)
        const tipY = worldYOf(previousRow + errorAfterIncrement)
        const columnX = worldXOf(step)

        errorBar.scale.set(ERROR_THICKNESS, Math.abs(baseY - tipY), 1)
        errorBar.position.set(columnX, (baseY + tipY) / 2, LAYER_ERROR)
        baseDot.position.set(columnX, baseY, LAYER_ERROR_DOT)

        // しきい値は、誤差を測る基準になった画素（1 つ前に塗った画素）の中に立てる。
        // 誤差と同じ列に置くと、その列で塗った画素は 1 行下にあるため、
        // 線が塗った画素の頂点から外へ飛び出しているようにしか見えない。
        // その画素の右辺に沿わせ、中心から境目まで（画素の半分）の長さで、
        // 誤差と同じ向きの端（誤差が上向きなら上端、下向きなら下端）へ伸ばして、
        // 誤差と長さを見比べられるようにする
        const thresholdX = worldXOf(step - 1) + PITCH / 2
        const thresholdEdgeY = baseY + (tipY > baseY ? PITCH / 2 : -PITCH / 2)
        const thresholdMidY = (baseY + thresholdEdgeY) / 2
        threshold.position.set(thresholdX, thresholdMidY, LAYER_THRESHOLD)
        thresholdDots[0].position.set(thresholdX, baseY, LAYER_THRESHOLD_DOT)
        thresholdDots[1].position.set(thresholdX, thresholdEdgeY, LAYER_THRESHOLD_DOT)

        // 注記は線の左側へ。右側は誤差の棒が来るので空けておく
        thresholdLabel.sprite.position.set(
          thresholdX - THRESHOLD_LABEL_MARGIN - thresholdLabel.sprite.scale.x / 2,
          thresholdMidY,
          LAYER_LABEL
        )
      }

      // 誤差と 0.5 の大小だけで次の画素が決まることを、数字でも追えるようにする
      params.error = showError
        ? `${error.toFixed(2)}`
        : `${error.toFixed(2)}（開始時。直線は画素の中心を通る）`
      params.judgement = showError
        ? `${errorBefore.toFixed(2)} + ${slope.toFixed(2)} = ${errorAfterIncrement.toFixed(2)}` +
          (errorAfterIncrement > 0.5 ? " > 0.5 → yを1増やし、eから1を引く" : " ≦ 0.5 → yはそのまま")
        : "まだ増分を足していない"
    },
    dispose: () => {
      const disposables = [
        barGeometry,
        halvingGeometry,
        halvingMaterial,
        pastPixelMaterial,
        currentPixelMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        axisGeometry,
        axisMaterial,
        arrowGeometry,
        arrowMaterial,
        thresholdMaterial,
        lineMaterial,
        errorMaterial,
        dotGeometry,
        dotMaterial,
        thresholdDotGeometry
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pastPixels.dispose()
      const labels = [...axisLabels, thresholdLabel, legendLabel]
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
