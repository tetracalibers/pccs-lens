import {
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  Scene,
  SRGBColorSpace
} from "three"

/** Tweakpane で操作するパラメータ */
export type PixelCoverageParams = {
  /** 図形（斜めの帯）の傾き。x を右へ 1 進めたときに、下へどれだけ下がるか */
  slope: number
  /** 図形の太さ。画素の大きさとは無関係に、画像の中での太さを決める */
  thickness: number
  /** 横の画素数。縦の画素数は画像の縦横比から決まる */
  columns: number
  /** 各画素の寄与率を数値で重ねるか */
  showValues: boolean
  /** 連続な図形そのものを重ねるか */
  showFigure: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: PixelCoverageParams
}

/**
 * 画像の大きさ。横 3 : 縦 2 にとる。
 * 横の画素数を 3 の倍数にすれば、縦の画素数が整数になり画素が正方形に収まる
 */
const IMAGE_WIDTH = 3.6
const IMAGE_HEIGHT = 2.4
const HALF_WIDTH = IMAGE_WIDTH / 2
const HALF_HEIGHT = IMAGE_HEIGHT / 2

/** 横の画素数の上限。格子線の頂点をこの数に合わせて先に確保しておく */
const MAX_COLUMNS = 12
const MAX_ROWS = Math.round((MAX_COLUMNS * IMAGE_HEIGHT) / IMAGE_WIDTH)

/**
 * 連続な図形（斜めの帯）を画像の矩形で切り取った多角形の、頂点数の上限。
 * 長方形（4 頂点）を半平面で 2 回切り取るので、多くとも 6 頂点になる
 */
const MAX_FIGURE_POLYGON_VERTICES = 6

/** その多角形を三角形扇に分けたときの頂点数（三角形 4 つ） */
const FIGURE_VERTICES = (MAX_FIGURE_POLYGON_VERTICES - 2) * 3

/** 寄与率がちょうど 0・1 かの判定に使う許容誤差（面積の計算に丸め誤差が乗る） */
const COVERAGE_EPSILON = 1e-6

/** 寄与率の数値を描き込む canvas の解像度。画像と同じ縦横比にとる */
const VALUE_CANVAS_WIDTH = 1080
const VALUE_CANVAS_HEIGHT = Math.round((VALUE_CANVAS_WIDTH * IMAGE_HEIGHT) / IMAGE_WIDTH)

/** 寄与率の数値の大きさ。画素 1 つ分の大きさに対する比 */
const VALUE_FONT_SCALE = 0.3

/**
 * 図形の色と背景の色。寄与率の分だけ図形の色を、残りだけ背景の色を混ぜた色が画素の色になる。
 * 背景はデモの地色と重ならない青にとる。地色と同じ色にすると、中間の寄与率の画素が
 * 「混ざった色」ではなく「半透明の図形」に見えてしまう
 */
const FIGURE_RGB = [255, 200, 87]
const BACKGROUND_RGB = [61, 111, 168]

// 背景（暗めのグレー）の上で、格子・数値を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"

// 連続な図形は図形の色そのもの（= FIGURE_RGB）で塗る
const FIGURE_COLOR = "#ffc857"

/** 寄与率の数値。明るい画素の上では暗い色、暗い画素の上では明るい色にする */
const VALUE_DARK = "#26282d"
const VALUE_LIGHT = "#c9d2de"

/** 数値の濃淡を切り替える下地の明るさ（0 から 255 の輝度） */
const VALUE_LUMINANCE_THRESHOLD = 140

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない。
 *
 * ただし遠近法では手前にあるものが大きく写るので、画面の中心から離れた位置にある要素は
 * z の分だけ外側へずれる。画素の境目のように下地とぴったり重ねたいものは z を持たせず、
 * 深度テストを切って描画順（→ FIGURE_ORDER・GRID_ORDER）で手前に出す
 */
const LAYER_VALUE = 0.05

/**
 * 深度テストを切って手前に描く要素の描画順。数が大きいほどあとに描かれる。
 * 「画素の色 → 連続な図形 → 画素の境目」の順に重ね、格子は図形の上にも残す
 */
const FIGURE_ORDER = 1
const GRID_ORDER = 2

/** 多角形の頂点 */
type Point = [number, number]

/**
 * 横の画素数から縦の画素数を決める。画像の縦横比に合わせると画素が正方形になる。
 *
 * 割り切れる組み合わせしか使わないが、2.4 / 3.6 が二進小数で表せないため
 * 商には誤差が乗る（9 画素なら 5.999999999999999）。丸めずにテクスチャの高さへ渡すと
 * WebGL 側で整数に切り捨てられ、6 行分の色が高さ 5 のテクスチャとして貼られてしまう
 */
const rowsOf = (columns: number) => Math.round((columns * IMAGE_HEIGHT) / IMAGE_WIDTH)

/** 左下の角と幅・高さから、長方形の頂点を反時計回りに並べる */
const rectOf = (x: number, y: number, width: number, height: number): Point[] => [
  [x, y],
  [x + width, y],
  [x + width, y + height],
  [x, y + height]
]

/**
 * 凸多角形を、直線 nx * x + ny * y = offset の片側（値が offset 以下の側）だけに切り取る。
 * 辺をたどりながら、残す側の頂点と、直線をまたぐ辺の交点を拾っていく
 */
const clipHalfPlane = (polygon: Point[], nx: number, ny: number, offset: number): Point[] => {
  const clipped: Point[] = []

  polygon.forEach(([ax, ay], index) => {
    const [bx, by] = polygon[(index + 1) % polygon.length]
    // 直線から見た余裕。正なら残す側にある
    const marginA = offset - (nx * ax + ny * ay)
    const marginB = offset - (nx * bx + ny * by)
    const insideA = marginA >= 0
    const insideB = marginB >= 0

    if (insideA) clipped.push([ax, ay])
    // 辺が直線をまたぐなら、その交点を新しい頂点として足す
    if (insideA !== insideB) {
      const ratio = marginA / (marginA - marginB)
      clipped.push([ax + (bx - ax) * ratio, ay + (by - ay) * ratio])
    }
  })

  return clipped
}

/** 多角形の面積。頂点を順にたどって外積を足し合わせる（靴ひも公式） */
const areaOf = (polygon: Point[]) => {
  let doubled = 0

  polygon.forEach(([ax, ay], index) => {
    const [bx, by] = polygon[(index + 1) % polygon.length]
    doubled += ax * by - bx * ay
  })

  return Math.abs(doubled) / 2
}

/**
 * 多角形から、図形（斜めの帯）に重なる部分を切り出す。
 * 図形は「中心線からの距離が太さの半分以内」の帯なので、中心線の両側で 2 回切り取る
 */
const clipBand = (
  polygon: Point[],
  normalX: number,
  normalY: number,
  halfThickness: number
): Point[] =>
  clipHalfPlane(
    clipHalfPlane(polygon, normalX, normalY, halfThickness),
    -normalX,
    -normalY,
    halfThickness
  )

/**
 * 画素の寄与率。左下の角が (x, y) で 1 辺が size の画素を、図形がどれだけ覆っているかの面積比。
 * 画素の正方形から図形に重なる部分を切り出し、その面積を画素の面積で割る
 */
const coverageOf = (
  x: number,
  y: number,
  size: number,
  normalX: number,
  normalY: number,
  halfThickness: number
) => areaOf(clipBand(rectOf(x, y, size, size), normalX, normalY, halfThickness)) / (size * size)

/**
 * 寄与率の表示。図形が覆い切った画素だけが `1`、まったくかかっていない画素だけが `0` になる。
 * 小数第 2 位までの丸めで 1 未満の値が `1` に化けないよう、両端は `0.99`・`0.01` で止める
 */
const formatCoverage = (coverage: number) => {
  if (coverage >= 1 - COVERAGE_EPSILON) return "1"
  if (coverage <= COVERAGE_EPSILON) return "0"

  return Math.min(Math.max(coverage, 0.01), 0.99).toFixed(2)
}

/**
 * 凸多角形を、先頭の頂点から扇状に三角形へ分けて頂点配列へ書き込む。
 * 書き込んだ頂点数を返す（三角形にならない多角形なら 0）
 */
const pushFan = (position: Float32BufferAttribute, polygon: Point[]) => {
  let vertex = 0

  for (let index = 1; index + 1 < polygon.length; index++) {
    for (const [x, y] of [polygon[0], polygon[index], polygon[index + 1]]) {
      position.setXYZ(vertex++, x, y, 0)
    }
  }

  return vertex
}

/** 1 画素 1 テクセルのテクスチャ。拡大しても画素が混ざらないよう、補間なし（NearestFilter）で貼る */
const createPixelTexture = (data: Uint8Array, columns: number, rows: number) => {
  const texture = new DataTexture(data, columns, rows)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  return texture
}

export const createPixelCoverageScene = ({ scene, params }: SceneContext) => {
  // 画素の色。寄与率で混ぜた色を 1 画素 1 テクセルのテクスチャに焼いて貼る。
  // 混ぜた色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const imageGeometry = new PlaneGeometry(IMAGE_WIDTH, IMAGE_HEIGHT)
  const imageMaterial = new MeshBasicMaterial()
  scene.add(new Mesh(imageGeometry, imageMaterial))

  let pixelData = new Uint8Array(0)

  // 連続な図形。画素の格子とは無関係に決まる、切れ目のない図形そのもの。
  // 画素の色とぴったり重ねたいので、格子と同じく画像の平面（z = 0）に置く
  const figurePosition = new Float32BufferAttribute(new Float32Array(FIGURE_VERTICES * 3), 3)
  const figureGeometry = new BufferGeometry().setAttribute("position", figurePosition)
  const figureMaterial = new MeshBasicMaterial({ color: FIGURE_COLOR, depthTest: false })
  const figure = new Mesh(figureGeometry, figureMaterial)
  figure.renderOrder = FIGURE_ORDER
  scene.add(figure)

  // 画素どうしの境目。画素数が変わるたびに引き直すので、頂点は上限の数だけ先に確保しておく
  const gridPosition = new Float32BufferAttribute(
    new Float32Array((MAX_COLUMNS + 1 + MAX_ROWS + 1) * 2 * 3),
    3
  )
  const gridGeometry = new BufferGeometry().setAttribute("position", gridPosition)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR, depthTest: false })
  const grid = new LineSegments(gridGeometry, gridMaterial)
  grid.renderOrder = GRID_ORDER
  scene.add(grid)

  // 寄与率の数値。画素ごとに板を並べるより、1 枚の canvas に描いて画像に重ねる方が軽い
  const valueCanvas = document.createElement("canvas")
  valueCanvas.width = VALUE_CANVAS_WIDTH
  valueCanvas.height = VALUE_CANVAS_HEIGHT
  const valueContext = valueCanvas.getContext("2d")
  const valueTexture = new CanvasTexture(valueCanvas)
  valueTexture.colorSpace = SRGBColorSpace
  const valueGeometry = new PlaneGeometry(IMAGE_WIDTH, IMAGE_HEIGHT)
  const valueMaterial = new MeshBasicMaterial({
    map: valueTexture,
    transparent: true,
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる線が板の矩形の形に欠ける
    depthWrite: false
  })
  const valueOverlay = new Mesh(valueGeometry, valueMaterial)
  valueOverlay.position.z = LAYER_VALUE
  scene.add(valueOverlay)

  // 画素数が変わったときだけ格子とテクスチャを作り直す（傾きを変えただけでは作り直さない）
  let builtColumns = NaN

  return {
    update: () => {
      const { columns, showValues, showFigure } = params
      const rows = rowsOf(columns)
      const pitch = IMAGE_WIDTH / columns

      // 図形（斜めの帯）の中心線に立てた法線と、太さの半分。
      // 傾きが正のときに右下へ向かうよう、画像座標系にならって回す向きを反転させる
      const angle = Math.atan(-params.slope)
      const normalX = -Math.sin(angle)
      const normalY = Math.cos(angle)
      const halfThickness = params.thickness / 2

      if (columns !== builtColumns) {
        builtColumns = columns

        imageMaterial.map?.dispose()
        pixelData = new Uint8Array(columns * rows * 4)
        imageMaterial.map = createPixelTexture(pixelData, columns, rows)
        imageMaterial.needsUpdate = true

        let vertex = 0
        for (let column = 0; column <= columns; column++) {
          const x = -HALF_WIDTH + column * pitch
          gridPosition.setXYZ(vertex++, x, -HALF_HEIGHT, 0)
          gridPosition.setXYZ(vertex++, x, HALF_HEIGHT, 0)
        }
        for (let row = 0; row <= rows; row++) {
          const y = -HALF_HEIGHT + row * pitch
          gridPosition.setXYZ(vertex++, -HALF_WIDTH, y, 0)
          gridPosition.setXYZ(vertex++, HALF_WIDTH, y, 0)
        }
        gridPosition.needsUpdate = true
        gridGeometry.setDrawRange(0, vertex)
      }

      // 数値は画素の大きさに合わせた字の大きさで、毎回まとめて描き直す
      const cell = VALUE_CANVAS_WIDTH / columns
      if (valueContext) {
        valueContext.clearRect(0, 0, VALUE_CANVAS_WIDTH, VALUE_CANVAS_HEIGHT)
        valueContext.font = `bold ${Math.round(cell * VALUE_FONT_SCALE)}px sans-serif`
        valueContext.textAlign = "center"
        valueContext.textBaseline = "middle"
      }

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          // 画素の左下の角。テクスチャの行はテクスチャ座標にならって下から数える
          const x = -HALF_WIDTH + column * pitch
          const y = -HALF_HEIGHT + row * pitch
          const coverage = coverageOf(x, y, pitch, normalX, normalY, halfThickness)

          // 寄与率の分だけ図形の色を、残りだけ背景の色を混ぜる
          const offset = (row * columns + column) * 4
          for (let channel = 0; channel < 3; channel++) {
            pixelData[offset + channel] = Math.round(
              coverage * FIGURE_RGB[channel] + (1 - coverage) * BACKGROUND_RGB[channel]
            )
          }
          pixelData[offset + 3] = 255

          if (valueContext && showValues) {
            // 文字の濃淡は下地になった混色の明るさで選ぶ（青の上でも黄の上でも読めるように）
            const luminance =
              0.299 * pixelData[offset] +
              0.587 * pixelData[offset + 1] +
              0.114 * pixelData[offset + 2]
            valueContext.fillStyle =
              luminance > VALUE_LUMINANCE_THRESHOLD ? VALUE_DARK : VALUE_LIGHT
            // canvas は上から下へ数えるので、テクスチャの行とは上下が逆になる
            valueContext.fillText(
              formatCoverage(coverage),
              (column + 0.5) * cell,
              VALUE_CANVAS_HEIGHT - (row + 0.5) * cell
            )
          }
        }
      }

      // 書き込んだ画素の色と数値を GPU へ送る
      const pixelTexture = imageMaterial.map
      if (pixelTexture) pixelTexture.needsUpdate = true
      valueTexture.needsUpdate = true
      valueOverlay.visible = showValues

      // 連続な図形。画素に対する寄与率と同じ切り取りを、画素ではなく画像全体へ 1 回かけると、
      // 画素の格子とは無関係な図形そのもの（画像の左上と右下の角を覆う多角形）が得られる
      const imageRect = rectOf(-HALF_WIDTH, -HALF_HEIGHT, IMAGE_WIDTH, IMAGE_HEIGHT)
      const figurePolygon = clipBand(imageRect, normalX, normalY, halfThickness)
      const figureVertex = pushFan(figurePosition, figurePolygon)
      figurePosition.needsUpdate = true
      figureGeometry.setDrawRange(0, figureVertex)
      figure.visible = showFigure
    },
    dispose: () => {
      imageMaterial.map?.dispose()
      valueTexture.dispose()
      const disposables = [
        imageGeometry,
        imageMaterial,
        gridGeometry,
        gridMaterial,
        figureGeometry,
        figureMaterial,
        valueGeometry,
        valueMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
