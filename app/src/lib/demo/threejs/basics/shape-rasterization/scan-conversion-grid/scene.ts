import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
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
export type ScanConversionGridParams = {
  /** 描きたい直線の傾き。x を画素 1 つ分進めたときに、y が何画素分下がるか */
  slope: number
  /** 画素格子の横の画素数。縦の画素数は格子の縦横比から決まる */
  columns: number
  /** 連続な直線を格子に重ねて表示するか */
  showLine: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ScanConversionGridParams
}

/**
 * 画素格子の大きさ。横 3 : 縦 2 にとる。
 * 横の画素数を 3 の倍数にすれば、縦の画素数が整数になり画素が正方形に収まる
 */
const PLOT_WIDTH = 3.6
const PLOT_HEIGHT = 2.4
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/** 横の画素数の上限。格子線と塗る画素の分をこの数に合わせて先に確保しておく */
const MAX_COLUMNS = 42
const MAX_ROWS = (MAX_COLUMNS * PLOT_HEIGHT) / PLOT_WIDTH

/** 座標軸を格子の外へ逃がす距離と、軸を格子より長く伸ばす分 */
const AXIS_MARGIN = 0.18
const AXIS_OVERSHOOT = 0.26

/** 座標軸の矢じりの大きさ */
const ARROW_HEIGHT = 0.16
const ARROW_RADIUS = 0.06

/**
 * 描きたい連続な直線の太さ。線材（LineBasicMaterial）の線幅は WebGL では
 * 常に 1 ドットに固定されるため、描画対象である直線は細長い長方形として描く
 */
const LINE_THICKNESS = 0.034

/** 原点を示す点の半径 */
const ORIGIN_DOT_RADIUS = 0.045

/** 凡例を並べる位置（格子の右）と、色見本の長さ・項目どうしの間隔 */
const LEGEND_X = 2.0
const LEGEND_SWATCH = 0.26
const LEGEND_GAP = 0.36

/** 軸の名前・原点・凡例の文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.24
const LABEL_HEIGHT = 0.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_PIXEL = 0.01
const LAYER_GRID = 0.02
const LAYER_FRAME = 0.03
const LAYER_AXIS = 0.04
const LAYER_LINE = 0.05
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、格子・塗る画素・連続な直線を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const PIXEL_COLOR = "#ffc857"
const LINE_COLOR = "#6fd8ff"
const AXIS_COLOR = "#9aa3b0"
const LABEL_COLOR = "#c9d2de"

/** 図全体を canvas の中央に寄せる位置。右の凡例と左の軸名の分だけ左へ寄せる */
const GRAPH_OFFSET = new Vector3(-0.44, 0, 0)

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

/** 横の画素数から縦の画素数を決める。格子の縦横比に合わせると画素が正方形になる */
const rowCountOf = (columns: number) => (columns * PLOT_HEIGHT) / PLOT_WIDTH

/**
 * 画素 (column, row) の中心のワールド座標。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる
 */
const centerXOf = (column: number, pitch: number) => -HALF_WIDTH + (column + 0.5) * pitch
const centerYOf = (row: number, pitch: number) => HALF_HEIGHT - (row + 0.5) * pitch

/**
 * 列 column の中心で、描きたい直線が通る y。画素の行を単位とした小数になる。
 * 直線は格子の中心を通り、傾きを変えるとそこを軸に回る
 */
const exactRowAt = (column: number, slope: number, columns: number, rows: number) =>
  (rows - 1) / 2 + slope * (column - (columns - 1) / 2)

export const createScanConversionGridScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 塗る画素。1 列につき 1 つなので、横の画素数の上限だけ先に確保しておく。
  // 塗った色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const pixelGeometry = new PlaneGeometry(1, 1)
  const pixelMaterial = new MeshBasicMaterial({ color: PIXEL_COLOR })
  const pixels = new InstancedMesh(pixelGeometry, pixelMaterial, MAX_COLUMNS)
  pixels.frustumCulled = false
  graph.add(pixels)

  // 画素どうしの境目。画素数が変わるたびに引き直すので、頂点は上限の数だけ先に確保しておく
  const gridPosition = new Float32BufferAttribute(
    new Float32Array((MAX_COLUMNS + 1 + MAX_ROWS + 1) * 2 * 3),
    3
  )
  const gridGeometry = new BufferGeometry().setAttribute("position", gridPosition)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  graph.add(new LineSegments(gridGeometry, gridMaterial))

  // 画像の外周。画素数を変えても、画像そのものの大きさは変わらないことが分かるようにする
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

  // 原点。画像の左上の角にあることを示す
  const originGeometry = new SphereGeometry(ORIGIN_DOT_RADIUS, 12, 8)
  const originMaterial = new MeshBasicMaterial({ color: FRAME_COLOR })
  const originDot = new Mesh(originGeometry, originMaterial)
  originDot.position.set(-HALF_WIDTH, HALF_HEIGHT, LAYER_AXIS)
  graph.add(originDot)

  // 描きたい連続な直線。格子とは無関係に、切れ目なく引かれた線。
  // 図の主役なので、格子線や画素の境目に埋もれない太さで描く
  const lineGeometry = new PlaneGeometry(1, 1)
  const lineMaterial = new MeshBasicMaterial({ color: LINE_COLOR })
  const continuousLine = new Mesh(lineGeometry, lineMaterial)
  continuousLine.position.z = LAYER_LINE
  graph.add(continuousLine)

  const labels = [
    { text: "x", color: AXIS_COLOR, height: AXIS_LABEL_HEIGHT, x: axisRightX + 0.36, y: axisTopY },
    {
      text: "y",
      color: AXIS_COLOR,
      height: AXIS_LABEL_HEIGHT,
      x: axisLeftX - 0.26,
      y: axisBottomY + 0.3
    },
    {
      text: "原点 (0, 0)",
      color: LABEL_COLOR,
      height: LABEL_HEIGHT,
      x: -HALF_WIDTH + 0.62,
      y: axisTopY + 0.26
    },
    {
      text: "連続な直線",
      color: LINE_COLOR,
      height: LABEL_HEIGHT,
      x: LEGEND_X + LEGEND_SWATCH + 0.54,
      y: LEGEND_GAP / 2
    },
    {
      text: "塗られる画素",
      color: PIXEL_COLOR,
      height: LABEL_HEIGHT,
      x: LEGEND_X + LEGEND_SWATCH + 0.62,
      y: -LEGEND_GAP / 2
    }
  ].map(({ text, color, height, x, y }) => {
    const label = createLabel(text, color, height)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  // 凡例の色見本。連続な直線は線で、塗られる画素は四角で示す
  const swatchLine = new Mesh(lineGeometry, lineMaterial)
  swatchLine.scale.set(LEGEND_SWATCH, LINE_THICKNESS, 1)
  swatchLine.position.set(LEGEND_X + LEGEND_SWATCH / 2, LEGEND_GAP / 2, LAYER_LABEL)
  graph.add(swatchLine)

  const swatchPixel = new Mesh(pixelGeometry, pixelMaterial)
  swatchPixel.scale.setScalar(LEGEND_SWATCH * 0.8)
  swatchPixel.position.set(LEGEND_X + LEGEND_SWATCH / 2, -LEGEND_GAP / 2, LAYER_LABEL)
  graph.add(swatchPixel)

  // 画素数が変わったときだけ格子を引き直す（傾きを変えただけでは引き直さない）
  let builtColumns = NaN
  const matrix = new Matrix4()

  return {
    update: () => {
      // 画素が正方形になるよう、横の画素数は 3 の倍数にとる（格子は横 3 : 縦 2）
      const columns = Math.round(params.columns / 3) * 3
      const rows = rowCountOf(columns)
      const pitch = PLOT_WIDTH / columns
      const { slope } = params

      if (columns !== builtColumns) {
        builtColumns = columns

        let vertex = 0
        for (let column = 0; column <= columns; column++) {
          const x = -HALF_WIDTH + column * pitch
          gridPosition.setXYZ(vertex++, x, -HALF_HEIGHT, LAYER_GRID)
          gridPosition.setXYZ(vertex++, x, HALF_HEIGHT, LAYER_GRID)
        }
        for (let row = 0; row <= rows; row++) {
          const y = HALF_HEIGHT - row * pitch
          gridPosition.setXYZ(vertex++, -HALF_WIDTH, y, LAYER_GRID)
          gridPosition.setXYZ(vertex++, HALF_WIDTH, y, LAYER_GRID)
        }
        gridPosition.needsUpdate = true
        gridGeometry.setDrawRange(0, vertex)
      }

      // 1 列につき 1 画素、直線に最も近い画素（y を四捨五入した行）を塗る
      let painted = 0
      for (let column = 0; column < columns; column++) {
        const row = Math.round(exactRowAt(column, slope, columns, rows))
        if (row < 0 || row > rows - 1) continue

        matrix.makeScale(pitch, pitch, 1)
        matrix.setPosition(centerXOf(column, pitch), centerYOf(row, pitch), LAYER_PIXEL)
        pixels.setMatrixAt(painted++, matrix)
      }
      pixels.count = painted
      pixels.instanceMatrix.needsUpdate = true

      // 直線は格子の中心を通る。x 方向の端と y 方向の端のうち、先に達する方で切る
      const halfLength = Math.min(HALF_WIDTH, HALF_HEIGHT / Math.abs(slope))
      // 長方形の長辺を線分の長さに合わせ、傾きの分だけ回す（y 軸が下向きなので回転は逆向き）
      continuousLine.scale.set(2 * halfLength * Math.hypot(1, slope), LINE_THICKNESS, 1)
      continuousLine.rotation.z = Math.atan(-slope)
      continuousLine.visible = params.showLine
    },
    dispose: () => {
      const disposables = [
        pixelGeometry,
        pixelMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        axisGeometry,
        axisMaterial,
        arrowGeometry,
        arrowMaterial,
        originGeometry,
        originMaterial,
        lineGeometry,
        lineMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pixels.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
