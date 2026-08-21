import {
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace
} from "three"

/** Tweakpane で操作するパラメータ */
export type PositionParameterParams = {
  /** 帯を何画素で描くか（記事の N） */
  pixelCount: number
  /** 注目している画素の番号（記事の i） */
  index: number
  /** 注目画素の割合 t。scene.ts が計算して書き戻す */
  ratio: string
  /** 注目画素の色。scene.ts が計算して書き戻す */
  color: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: PositionParameterParams
}

/**
 * 両端の 2 色（記事の A と B）。8 ビットの成分（0〜255）で持ち、線形補間もこの値のまま行う。
 * 画素に記録される値そのものを混ぜ合わせるので、中間の色が式のとおりに見える
 */
const COLOR_A = [255, 200, 87]
const COLOR_B = [94, 200, 242]

/**
 * 帯に使える横幅と、画素 1 つの大きさの上限。
 * 画素は正方形なので、画素数が少ないときは幅いっぱいに広げず、この大きさで止める
 */
const BAND_MAX_WIDTH = 3.6
const MAX_CELL_SIZE = 0.3

/** 隣の画素との境目。画素の大きさに依らない細さにして、1 枚の帯に見えるようにする */
const CELL_GAP = 0.014

/** 色を塗る行（記事の帯）の高さ */
const BAND_Y = -0.05

/**
 * 色を塗る行の上・下に、画素の格子だけを続ける行数の上限。
 * この帯が画像の 1 行であることを示すためのもので、下側を長くとる（上は色見本に使う）
 */
const MAX_GRID_ROWS_ABOVE = 2
const MAX_GRID_ROWS_BELOW = 6

/** 格子を描ける範囲。この 2 つの高さの間に収まる行数だけを描く */
const GRID_TOP = 0.47
const GRID_BOTTOM = -1.42

/** 格子の線を引くのに使う頂点数の上限（縦 21 本・横 10 本ぶん） */
const MAX_GRID_VERTICES = 64

/** 注目画素を囲む枠の太さ。隣の画素との境目と同じ細さに揃える */
const FOCUS_BORDER = CELL_GAP

/** 色見本を囲む縁の太さ */
const SWATCH_BORDER = 0.04

/** 注目画素の色を拡大して見せる色見本の大きさと、その中心の高さ */
const SWATCH_SIZE = 0.62
const SWATCH_Y = 1

/** 色見本と注目画素をつなぐ線の太さ */
const CONNECTOR_WIDTH = 0.024

/** 画素数の上限。この数だけ画素をあらかじめ作っておく */
const MAX_PIXEL_COUNT = 20

/** 枠と線の色。背景の上でも、どの中間色の上でも見える明るい色にする */
const HIGHLIGHT_COLOR = "#e8ecf2"

/** 格子の線の色。色を塗った行より控えめにする */
const GRID_COLOR = "#5c6470"

/** 画素の中に載せるラベルの色。両端の色も中間色もどれも明るいので、濃い色を載せる */
const LABEL_COLOR = "#2a2d33"

/** 画素の中に載せるラベルの大きさ（上限と、画素の一辺に対する高さ・幅の割合） */
const LABEL_HEIGHT = 0.2
const LABEL_FILL = 0.62
const LABEL_WIDTH_FILL = 0.86

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 重なる要素を、奥から手前へ振り分ける z。正面から見る構図なので厚みは絵に出ない */
const LAYER_GRID = 0.005
const LAYER_CELL = 0.01
const LAYER_CONNECTOR = 0.015
const LAYER_BORDER = 0.02
const LAYER_FRONT = 0.03
const LAYER_LABEL = 0.04

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
 */
const createLabel = (text: string) => {
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

  // 大きさは画素に合わせて毎回決めるので、縦横比だけを覚えておく
  return { sprite, texture, material, aspect: canvas.width / canvas.height }
}

/** 線形補間 f(t) = (1 - t)A + tB。色の成分ごとに、同じ割合で混ぜ合わせる */
const colorAt = (t: number) =>
  COLOR_A.map((a, channel) => Math.round((1 - t) * a + t * COLOR_B[channel]))

/** 0〜255 の成分で持っている色を、Three.js が扱う 0〜1 に直して流し込む */
const applyColor = (target: Color, level: number[]) =>
  target.setRGB(level[0] / 255, level[1] / 255, level[2] / 255, SRGBColorSpace)

export const createPositionParameterScene = ({ scene, params }: SceneContext) => {
  // 画素・色見本・枠・線は、すべて 1 辺 1 の板を大きさと位置を与えて使い回す
  const unitGeometry = new PlaneGeometry(1, 1)

  // 画素の格子。画素の境目に沿って縦横の線を引く。
  // 引く本数は画素数と収まる行数で変わるので、頂点をあらかじめ確保して使う数だけ描く
  const gridGeometry = new BufferGeometry()
  gridGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array(MAX_GRID_VERTICES * 3), 3)
  )
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  scene.add(new LineSegments(gridGeometry, gridMaterial))

  // 色を塗る行の画素。番号ごとに大きさ・位置・色を与えて横一列に並べる
  const cellMaterial = new MeshBasicMaterial()
  const cells = new InstancedMesh(unitGeometry, cellMaterial, MAX_PIXEL_COUNT)
  scene.add(cells)

  // 注目画素を囲む枠と、色見本の縁・つなぐ線。いずれも同じ明るい色で塗る
  const highlightMaterial = new MeshBasicMaterial({ color: HIGHLIGHT_COLOR })
  const cellHighlight = new Mesh(unitGeometry, highlightMaterial)
  scene.add(cellHighlight)

  const connector = new Mesh(unitGeometry, highlightMaterial)
  scene.add(connector)

  const swatchBorder = new Mesh(unitGeometry, highlightMaterial)
  swatchBorder.scale.set(SWATCH_SIZE + SWATCH_BORDER * 2, SWATCH_SIZE + SWATCH_BORDER * 2, 1)
  swatchBorder.position.set(0, SWATCH_Y, LAYER_BORDER)
  scene.add(swatchBorder)

  // 注目画素の色を拡大して見せる色見本
  const swatchMaterial = new MeshBasicMaterial()
  const swatch = new Mesh(unitGeometry, swatchMaterial)
  swatch.scale.set(SWATCH_SIZE, SWATCH_SIZE, 1)
  swatch.position.set(0, SWATCH_Y, LAYER_FRONT)
  scene.add(swatch)

  // 注目画素の色。枠の上に同じ色を塗り直すための板（色見本と材質を共有する）
  const focusCell = new Mesh(unitGeometry, swatchMaterial)
  scene.add(focusCell)

  // 両端の色が式の A・B であることを示すラベルと、注目画素の色が f(t) であることを
  // 示すラベル。いずれも画素の中に載せる
  const labels = ["A", "B", "f(t)"].map((text) => {
    const label = createLabel(text)
    scene.add(label.sprite)
    return label
  })
  const [labelA, labelB, labelFocus] = labels

  /** ラベルを画素の中に収まる大きさに合わせる（縦横どちらもはみ出さない範囲で最大にとる） */
  const fitLabel = ({ sprite, aspect }: (typeof labels)[number], cellSize: number) => {
    const height = Math.min(
      LABEL_HEIGHT,
      cellSize * LABEL_FILL,
      (cellSize * LABEL_WIDTH_FILL) / aspect
    )
    sprite.scale.set(height * aspect, height, 1)
  }

  const matrix = new Matrix4()
  const color = new Color()

  return {
    update: () => {
      const { pixelCount } = params
      // 画素数を減らしたときに、注目画素が帯の外へ出ないようにする
      const index = Math.min(params.index, pixelCount - 1)

      // 位置パラメータ：左から i 番目の画素の割合は i / (N - 1)。
      // 両端がちょうど 0 と 1 になるので、i = 0 は A、i = N - 1 は B そのものになる
      const t = index / (pixelCount - 1)
      const level = colorAt(t)

      params.ratio = `i / (N - 1) = ${index} / ${pixelCount - 1} = ${t.toFixed(2)}`
      params.color = `${(1 - t).toFixed(2)}A + ${t.toFixed(2)}B = (${level.join(", ")})`

      // 1 画素が占める幅。画素は正方形なので、境目を引いた残りがそのまま高さにもなる
      const pitch = Math.min(BAND_MAX_WIDTH / pixelCount, MAX_CELL_SIZE)
      const cellSize = pitch - CELL_GAP
      const bandLeft = (-pitch * pixelCount) / 2
      const centerOf = (i: number) => bandLeft + (i + 0.5) * pitch

      // 格子として続ける行数。描ける範囲に収まる数までとし、
      // 画像の一部として見えるよう、縦が横より長くならないところで止める
      const fits = (space: number) => Math.max(0, Math.floor(space / pitch - 0.5))
      const rowsAbove = Math.min(MAX_GRID_ROWS_ABOVE, fits(GRID_TOP - BAND_Y))
      const rowsBelow = Math.min(
        MAX_GRID_ROWS_BELOW,
        fits(BAND_Y - GRID_BOTTOM),
        Math.max(1, pixelCount - 1) - rowsAbove
      )

      // 格子：画素の境目に沿って、縦の線を画素数 + 1 本、横の線を行数 + 1 本引く
      const gridPosition = gridGeometry.getAttribute("position")
      const gridTop = BAND_Y + (rowsAbove + 0.5) * pitch
      const gridBottom = BAND_Y - (rowsBelow + 0.5) * pitch
      let vertex = 0
      const addPoint = (x: number, y: number) => gridPosition.setXYZ(vertex++, x, y, LAYER_GRID)

      for (let k = 0; k <= pixelCount; k++) {
        const x = bandLeft + k * pitch
        addPoint(x, gridTop)
        addPoint(x, gridBottom)
      }
      for (let row = -rowsBelow - 1; row <= rowsAbove; row++) {
        const y = BAND_Y + (row + 0.5) * pitch
        addPoint(bandLeft, y)
        addPoint(bandLeft + pitch * pixelCount, y)
      }
      gridPosition.needsUpdate = true
      gridGeometry.setDrawRange(0, vertex)
      gridGeometry.computeBoundingSphere()

      // 色を塗るのは注目している行だけ。ほかの行は格子のまま残す
      cells.count = pixelCount
      for (let i = 0; i < pixelCount; i++) {
        applyColor(color, colorAt(i / (pixelCount - 1)))
        matrix.makeScale(cellSize, cellSize, 1)
        matrix.setPosition(centerOf(i), BAND_Y, LAYER_CELL)
        cells.setMatrixAt(i, matrix)
        cells.setColorAt(i, color)
      }
      cells.instanceMatrix.needsUpdate = true
      if (cells.instanceColor) cells.instanceColor.needsUpdate = true
      cells.computeBoundingSphere()

      // 注目画素の枠。画素より一回り大きい板を手前に置き、その上に画素の色を塗り直す。
      // 画素の後ろに置くと、左右は隣の画素に隠れて境目の幅しか見えず、上下だけ太く見えてしまう
      const focusX = centerOf(index)
      cellHighlight.scale.set(cellSize + FOCUS_BORDER * 2, cellSize + FOCUS_BORDER * 2, 1)
      cellHighlight.position.set(focusX, BAND_Y, LAYER_BORDER)
      focusCell.scale.set(cellSize, cellSize, 1)
      focusCell.position.set(focusX, BAND_Y, LAYER_FRONT)

      // 注目画素の上端と、色見本の下端を線で結ぶ。色見本は中央に据えたままなので、
      // 注目画素が中央から離れるほど線は斜めになる。板を伸ばして向きを合わせる
      applyColor(swatchMaterial.color, level)
      const cellTop = BAND_Y + cellSize / 2
      const swatchBottom = SWATCH_Y - SWATCH_SIZE / 2
      const spanX = -focusX
      const spanY = swatchBottom - cellTop
      connector.scale.set(CONNECTOR_WIDTH, Math.hypot(spanX, spanY), 1)
      connector.position.set(focusX + spanX / 2, cellTop + spanY / 2, LAYER_CONNECTOR)
      // 板の長い辺（ローカルの y 軸）が、結ぶ向きに重なるまで回す
      connector.rotation.z = Math.atan2(spanY, spanX) - Math.PI / 2

      // ラベルは画素の中に収まる大きさで載せる。A・B は両端の画素、f(t) は注目画素に置き、
      // 注目画素が端に来たときは f(t) を優先して、その端のラベルを隠す
      labels.forEach((label) => fitLabel(label, cellSize))
      labelA.sprite.position.set(centerOf(0), BAND_Y, LAYER_LABEL)
      labelB.sprite.position.set(centerOf(pixelCount - 1), BAND_Y, LAYER_LABEL)
      labelFocus.sprite.position.set(focusX, BAND_Y, LAYER_LABEL)
      labelA.sprite.visible = index !== 0
      labelB.sprite.visible = index !== pixelCount - 1
    },
    dispose: () => {
      const disposables = [
        unitGeometry,
        gridGeometry,
        gridMaterial,
        cellMaterial,
        highlightMaterial,
        swatchMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
      cells.dispose()
    }
  }
}
