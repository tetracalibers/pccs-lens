import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  Float32BufferAttribute,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
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

/** グラデーションを焼くテクスチャの横の解像度。画素の格子よりずっと細かくとる */
const GRADIENT_RESOLUTION = 512

/**
 * 色を塗る行の下に、画素の格子だけを続ける行数の上限。
 * この帯が画像の 1 行であることを示すためのもので、下へ伸ばす
 */
const MAX_GRID_ROWS_BELOW = 8

/** 図全体を収める高さと、色を塗る行の上に番号のラベルを置くための余白 */
const CONTENT_HEIGHT = 2.6
const LABEL_SPACE = 0.34

/** 格子の線を引くのに使う頂点数の上限（縦 21 本・横 10 本ぶん） */
const MAX_GRID_VERTICES = 64

/** 注目画素を囲む枠の太さ。格子の線と同じくらいの細さにする */
const FOCUS_BORDER = 0.014

/** 格子の線の色。色を塗った行より控えめにする */
const GRID_COLOR = "#5c6470"

/** 画素の中に載せるラベルの色。両端の色も中間色もどれも明るいので、濃い色を載せる */
const CELL_LABEL_COLOR = "#2a2d33"

/** 画素の外（行の上）に置く番号のラベルの色。背景の上で読める明るい色にする */
const INDEX_LABEL_COLOR = "#c9d2de"

/** 画素の中に載せるラベルの大きさ（上限と、画素の一辺に対する高さ・幅の割合） */
const CELL_LABEL_HEIGHT = 0.2
const CELL_LABEL_FILL = 0.62
const CELL_LABEL_WIDTH_FILL = 0.86

/** 番号のラベルの大きさ（上限と、画素の一辺に対する割合）と、行の上に逃がす距離 */
const INDEX_LABEL_HEIGHT = 0.18
const INDEX_LABEL_FILL = 0.9
const INDEX_LABEL_GAP = 0.16

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 重なる要素を、奥から手前へ振り分ける z。正面から見る構図なので厚みは絵に出ない */
const LAYER_GRID = 0.005
const LAYER_CELL = 0.01
const LAYER_BORDER = 0.02
const LAYER_FRONT = 0.03
const LAYER_LABEL = 0.04

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
 */
const createLabel = (text: string, color: string) => {
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
  // 画素・枠・線は、すべて 1 辺 1 の板を大きさと位置を与えて使い回す
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

  // 色を塗る行。連続的なグラデーションを 1 枚の板に貼るので、
  // 画素と画素の境目は出ない（格子は板の後ろに隠れる）
  const gradientData = new Uint8Array(GRADIENT_RESOLUTION * 4)
  for (let column = 0; column < GRADIENT_RESOLUTION; column++) {
    const level = colorAt((column + 0.5) / GRADIENT_RESOLUTION)
    gradientData.set([...level, 255], column * 4)
  }
  const gradientTexture = new DataTexture(gradientData, GRADIENT_RESOLUTION, 1)
  gradientTexture.colorSpace = SRGBColorSpace
  gradientTexture.magFilter = LinearFilter
  gradientTexture.minFilter = LinearFilter
  gradientTexture.needsUpdate = true

  const gradientMaterial = new MeshBasicMaterial({ map: gradientTexture })
  const gradient = new Mesh(unitGeometry, gradientMaterial)
  scene.add(gradient)

  // 注目画素を囲む枠
  const borderMaterial = new MeshBasicMaterial({ color: "#e8ecf2" })
  const cellBorder = new Mesh(unitGeometry, borderMaterial)
  scene.add(cellBorder)

  // 注目画素の色。枠の上に、その画素の値である f(t) を 1 色で塗る
  const focusMaterial = new MeshBasicMaterial()
  const focusCell = new Mesh(unitGeometry, focusMaterial)
  scene.add(focusCell)

  // 画素の中に載せるラベル（両端が式の A・B であること、注目画素の色が f(t) であること）と、
  // 行の上に置く番号のラベル（左端が 0、注目画素が i、右端が N - 1 であること）
  const labels = [
    ...["A", "B", "f(t)"].map((text) => createLabel(text, CELL_LABEL_COLOR)),
    ...["0", "i", "N - 1"].map((text) => createLabel(text, INDEX_LABEL_COLOR))
  ]
  labels.forEach((label) => scene.add(label.sprite))
  const [labelA, labelB, labelFocus, labelFirst, labelIndex, labelLast] = labels

  /** ラベルを、与えた縦・横の枠からはみ出さない範囲で最大の大きさに合わせる */
  const fitLabel = (
    { sprite, aspect }: (typeof labels)[number],
    limitHeight: number,
    limitWidth: number
  ) => {
    const height = Math.min(limitHeight, limitWidth / aspect)
    sprite.scale.set(height * aspect, height, 1)
  }

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

      // 1 画素が占める幅。画素は正方形なので、この値がそのまま格子の 1 行の高さにもなる
      const pitch = Math.min(BAND_MAX_WIDTH / pixelCount, MAX_CELL_SIZE)
      const bandWidth = pitch * pixelCount
      const bandLeft = -bandWidth / 2
      const centerOf = (i: number) => bandLeft + (i + 0.5) * pitch

      // 格子として下に続ける行数。収まる数までとし、
      // 画像の一部として見えるよう、縦が横より長くならないところで止める
      const rowsBelow = Math.min(
        MAX_GRID_ROWS_BELOW,
        pixelCount - 1,
        Math.max(0, Math.floor((CONTENT_HEIGHT - LABEL_SPACE) / pitch) - 1)
      )

      // 番号のラベルと格子を合わせた高さが canvas の中央に来るよう、色を塗る行の高さを決める
      const gridHeight = (1 + rowsBelow) * pitch
      const bandY = (LABEL_SPACE + gridHeight) / 2 - LABEL_SPACE - pitch / 2

      // 格子：画素の境目に沿って、縦の線を画素数 + 1 本、横の線を行数 + 1 本引く
      const gridPosition = gridGeometry.getAttribute("position")
      const gridTop = bandY + pitch / 2
      const gridBottom = gridTop - gridHeight
      let vertex = 0
      const addPoint = (x: number, y: number) => gridPosition.setXYZ(vertex++, x, y, LAYER_GRID)

      for (let k = 0; k <= pixelCount; k++) {
        const x = bandLeft + k * pitch
        addPoint(x, gridTop)
        addPoint(x, gridBottom)
      }
      for (let row = 0; row <= rowsBelow + 1; row++) {
        const y = gridTop - row * pitch
        addPoint(bandLeft, y)
        addPoint(bandLeft + bandWidth, y)
      }
      gridPosition.needsUpdate = true
      gridGeometry.setDrawRange(0, vertex)
      gridGeometry.computeBoundingSphere()

      // 色を塗るのは注目している行だけ。ほかの行は格子のまま残す。
      // 帯は格子の 1 行にぴたりと重ね、格子の線を隠して連続的な見た目にする
      gradient.scale.set(bandWidth, pitch, 1)
      gradient.position.set(0, bandY, LAYER_CELL)

      // 注目画素の枠。格子の 1 マスより一回り大きい板を帯の手前に置き、
      // その上に、その画素の値である f(t) の色を 1 色で塗る
      const focusX = centerOf(index)
      cellBorder.scale.set(pitch + FOCUS_BORDER * 2, pitch + FOCUS_BORDER * 2, 1)
      cellBorder.position.set(focusX, bandY, LAYER_BORDER)
      applyColor(focusMaterial.color, level)
      focusCell.scale.set(pitch, pitch, 1)
      focusCell.position.set(focusX, bandY, LAYER_FRONT)

      // 画素の中のラベルは A・B・f(t)。注目画素が端に来たときは f(t) を優先する
      const cellLabelHeight = Math.min(CELL_LABEL_HEIGHT, pitch * CELL_LABEL_FILL)
      for (const label of [labelA, labelB, labelFocus]) {
        fitLabel(label, cellLabelHeight, pitch * CELL_LABEL_WIDTH_FILL)
      }
      labelA.sprite.position.set(centerOf(0), bandY, LAYER_LABEL)
      labelB.sprite.position.set(centerOf(pixelCount - 1), bandY, LAYER_LABEL)
      labelFocus.sprite.position.set(focusX, bandY, LAYER_LABEL)
      labelA.sprite.visible = index !== 0
      labelB.sprite.visible = index !== pixelCount - 1

      // 行の上の番号は 0・i・N - 1。i がその位置に重なるときは、0・N - 1 を隠す
      const indexLabelHeight = Math.min(INDEX_LABEL_HEIGHT, pitch * INDEX_LABEL_FILL)
      const indexY = gridTop + INDEX_LABEL_GAP
      for (const label of [labelFirst, labelIndex, labelLast]) {
        fitLabel(label, indexLabelHeight, Infinity)
      }
      labelFirst.sprite.position.set(centerOf(0), indexY, LAYER_LABEL)
      labelIndex.sprite.position.set(focusX, indexY, LAYER_LABEL)
      labelLast.sprite.position.set(centerOf(pixelCount - 1), indexY, LAYER_LABEL)
      labelFirst.sprite.visible = index !== 0
      labelLast.sprite.visible = index !== pixelCount - 1
    },
    dispose: () => {
      const disposables = [
        unitGeometry,
        gridGeometry,
        gridMaterial,
        gradientTexture,
        gradientMaterial,
        borderMaterial,
        focusMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
