import {
  CanvasTexture,
  Color,
  InstancedMesh,
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
const MAX_CELL_SIZE = 0.46

/** 隣の画素との境目。画素の大きさに依らない細さにして、1 枚の帯に見えるようにする */
const CELL_GAP = 0.014

/** 帯の中心の高さ */
const BAND_Y = -0.36

/** 注目画素を囲む枠の太さ。隣の画素との境目と同じ細さに揃える */
const FOCUS_BORDER = CELL_GAP

/** 色見本を囲む縁の太さ */
const SWATCH_BORDER = 0.04

/** 注目画素の色を拡大して見せる色見本の大きさと、その中心の高さ */
const SWATCH_SIZE = 0.62
const SWATCH_Y = 0.6

/** 色見本と注目画素をつなぐ線の太さ */
const CONNECTOR_WIDTH = 0.024

/** 画素数の上限。この数だけ画素をあらかじめ作っておく */
const MAX_PIXEL_COUNT = 20

/** 縁と線の色。背景の上でも、どの中間色の上でも見える明るい色にする */
const HIGHLIGHT_COLOR = "#e8ecf2"
const LABEL_COLOR = "#c9d2de"

/** 両端に添える A・B のラベルの大きさと、帯から下に逃がす距離 */
const LABEL_HEIGHT = 0.2
const LABEL_GAP = 0.22

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 重なる要素を、奥から手前へ振り分ける z。正面から見る構図なので厚みは絵に出ない */
const LAYER_CONNECTOR = 0.006
const LAYER_CELL = 0.01
const LAYER_BORDER = 0.02
const LAYER_FRONT = 0.03
const LAYER_LABEL = 0.04

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

/** 線形補間 f(t) = (1 - t)A + tB。色の成分ごとに、同じ割合で混ぜ合わせる */
const colorAt = (t: number) =>
  COLOR_A.map((a, channel) => Math.round((1 - t) * a + t * COLOR_B[channel]))

/** 0〜255 の成分で持っている色を、Three.js が扱う 0〜1 に直して流し込む */
const applyColor = (target: Color, level: number[]) =>
  target.setRGB(level[0] / 255, level[1] / 255, level[2] / 255, SRGBColorSpace)

export const createPositionParameterScene = ({ scene, params }: SceneContext) => {
  // 画素・色見本・縁・線は、すべて 1 辺 1 の板を大きさと位置を与えて使い回す
  const unitGeometry = new PlaneGeometry(1, 1)

  // 画素。番号ごとに大きさ・位置・色を与えて横一列に並べる
  const cellMaterial = new MeshBasicMaterial()
  const cells = new InstancedMesh(unitGeometry, cellMaterial, MAX_PIXEL_COUNT)
  scene.add(cells)

  // 注目画素を囲む縁と、色見本の縁・つなぐ線。いずれも同じ明るい色で塗る
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

  // 両端の色が式の A・B であることを示すラベル。位置は画素の大きさに合わせて動かす
  const labels = ["A", "B"].map((text) => {
    const label = createLabel(text, LABEL_HEIGHT)
    scene.add(label.sprite)
    return label
  })

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

      cells.count = pixelCount
      for (let i = 0; i < pixelCount; i++) {
        const value = colorAt(i / (pixelCount - 1))

        matrix.makeScale(cellSize, cellSize, 1)
        matrix.setPosition(centerOf(i), BAND_Y, LAYER_CELL)
        cells.setMatrixAt(i, matrix)
        cells.setColorAt(i, applyColor(color, value))
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

      // A・B のラベルは、両端の画素の真下に置く
      const labelY = BAND_Y - cellSize / 2 - LABEL_GAP
      labels[0].sprite.position.set(centerOf(0), labelY, LAYER_LABEL)
      labels[1].sprite.position.set(centerOf(pixelCount - 1), labelY, LAYER_LABEL)
    },
    dispose: () => {
      const disposables = [
        unitGeometry,
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
