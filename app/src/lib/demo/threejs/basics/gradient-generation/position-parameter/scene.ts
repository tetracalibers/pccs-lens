import {
  CanvasTexture,
  Color,
  DataTexture,
  LinearFilter,
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
  /** 注目している画素の番号（記事の i） */
  index: number
  /** 帯の画素数（記事の N）。固定値なので、scene.ts が書き戻す表示用の値として持つ */
  pixelCount: string
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

/** 帯を何画素で描くか（記事の N）。動かすのは注目画素だけなので、画素数は固定する */
const PIXEL_COUNT = 12

/** 画素 1 つの大きさ。画素は正方形なので、この値がそのまま帯の高さにもなる */
const CELL_SIZE = 0.3

/** グラデーションを焼くテクスチャの横の解像度。画素の並びよりずっと細かくとる */
const GRADIENT_RESOLUTION = 512

/** 帯の上に番号のラベルを置くための余白 */
const LABEL_SPACE = 0.34

/** 注目画素を囲む枠の太さ。画素の輪郭として細く回す */
const FOCUS_BORDER = 0.014

/** 画素の中に載せるラベルの色。両端の色も中間色もどれも明るいので、濃い色を載せる */
const CELL_LABEL_COLOR = "#2a2d33"

/** 画素の外（帯の上）に置く番号のラベルの色。背景の上で読める明るい色にする */
const INDEX_LABEL_COLOR = "#c9d2de"

/** 画素の中に載せるラベルの大きさ（上限と、画素の一辺に対する高さ・幅の割合） */
const CELL_LABEL_HEIGHT = 0.2
const CELL_LABEL_FILL = 0.62
const CELL_LABEL_WIDTH_FILL = 0.86

/** 番号のラベルの大きさ（上限と、画素の一辺に対する割合）と、帯の上に逃がす距離 */
const INDEX_LABEL_HEIGHT = 0.18
const INDEX_LABEL_FILL = 0.9
const INDEX_LABEL_GAP = 0.16

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 重なる要素を、奥から手前へ振り分ける z。正面から見る構図なので厚みは絵に出ない */
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

  // 大きさは画素に合わせて決めるので、縦横比だけを覚えておく
  return { sprite, texture, material, aspect: canvas.width / canvas.height }
}

/** 線形補間 f(t) = (1 - t)A + tB。色の成分ごとに、同じ割合で混ぜ合わせる */
const colorAt = (t: number) =>
  COLOR_A.map((a, channel) => Math.round((1 - t) * a + t * COLOR_B[channel]))

/** 0〜255 の成分で持っている色を、Three.js が扱う 0〜1 に直して流し込む */
const applyColor = (target: Color, level: number[]) =>
  target.setRGB(level[0] / 255, level[1] / 255, level[2] / 255, SRGBColorSpace)

export const createPositionParameterScene = ({ scene, params }: SceneContext) => {
  // 画素・枠は、すべて 1 辺 1 の板を大きさと位置を与えて使い回す
  const unitGeometry = new PlaneGeometry(1, 1)

  // 帯の横幅と、左から i 番目の画素の中心。画素数が固定なのでどちらも動かない
  const bandWidth = CELL_SIZE * PIXEL_COUNT
  const bandLeft = -bandWidth / 2
  const centerOf = (i: number) => bandLeft + (i + 0.5) * CELL_SIZE

  // 番号のラベルの余白と帯を合わせた高さが canvas の中央に来るよう、帯の高さを決める
  const bandY = -LABEL_SPACE / 2

  // 帯。連続的なグラデーションを 1 枚の板に貼るので、画素と画素の境目は出ない
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
  gradient.scale.set(bandWidth, CELL_SIZE, 1)
  gradient.position.set(0, bandY, LAYER_CELL)
  scene.add(gradient)

  // 注目画素を囲む枠。帯の 1 画素より一回り大きい板を帯の手前に置く
  const borderMaterial = new MeshBasicMaterial({ color: "#e8ecf2" })
  const cellBorder = new Mesh(unitGeometry, borderMaterial)
  cellBorder.scale.set(CELL_SIZE + FOCUS_BORDER * 2, CELL_SIZE + FOCUS_BORDER * 2, 1)
  scene.add(cellBorder)

  // 注目画素の色。枠の上に、その画素の値である f(t) を 1 色で塗る
  const focusMaterial = new MeshBasicMaterial()
  const focusCell = new Mesh(unitGeometry, focusMaterial)
  focusCell.scale.set(CELL_SIZE, CELL_SIZE, 1)
  scene.add(focusCell)

  // 画素の中に載せるラベル（両端が式の A・B であること、注目画素の色が f(t) であること）と、
  // 帯の上に置く番号のラベル（左端が 0、注目画素が i、右端が N - 1 であること）
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

  // ラベルの大きさは画素の大きさから決まるので、動かない位置とあわせてここで済ませる
  const cellLabelHeight = Math.min(CELL_LABEL_HEIGHT, CELL_SIZE * CELL_LABEL_FILL)
  for (const label of [labelA, labelB, labelFocus]) {
    fitLabel(label, cellLabelHeight, CELL_SIZE * CELL_LABEL_WIDTH_FILL)
  }
  const indexLabelHeight = Math.min(INDEX_LABEL_HEIGHT, CELL_SIZE * INDEX_LABEL_FILL)
  for (const label of [labelFirst, labelIndex, labelLast]) {
    fitLabel(label, indexLabelHeight, Infinity)
  }

  const indexY = bandY + CELL_SIZE / 2 + INDEX_LABEL_GAP
  labelA.sprite.position.set(centerOf(0), bandY, LAYER_LABEL)
  labelB.sprite.position.set(centerOf(PIXEL_COUNT - 1), bandY, LAYER_LABEL)
  labelFirst.sprite.position.set(centerOf(0), indexY, LAYER_LABEL)
  labelLast.sprite.position.set(centerOf(PIXEL_COUNT - 1), indexY, LAYER_LABEL)

  return {
    update: () => {
      const { index } = params

      // 位置パラメータ：左から i 番目の画素の割合は i / (N - 1)。
      // 両端がちょうど 0 と 1 になるので、i = 0 は A、i = N - 1 は B そのものになる
      const t = index / (PIXEL_COUNT - 1)
      const level = colorAt(t)

      params.pixelCount = `${PIXEL_COUNT}`
      params.ratio = `${index} / ${PIXEL_COUNT - 1} = ${t.toFixed(2)}`
      params.color = `${(1 - t).toFixed(2)}A + ${t.toFixed(2)}B = (${level.join(", ")})`

      // 注目画素の枠と、その上に塗る f(t) の色
      const focusX = centerOf(index)
      cellBorder.position.set(focusX, bandY, LAYER_BORDER)
      applyColor(focusMaterial.color, level)
      focusCell.position.set(focusX, bandY, LAYER_FRONT)

      // 注目画素に重なるラベルは隠す（画素の中は f(t)、帯の上は i を優先する）
      labelFocus.sprite.position.set(focusX, bandY, LAYER_LABEL)
      labelIndex.sprite.position.set(focusX, indexY, LAYER_LABEL)
      labelA.sprite.visible = index !== 0
      labelB.sprite.visible = index !== PIXEL_COUNT - 1
      labelFirst.sprite.visible = index !== 0
      labelLast.sprite.visible = index !== PIXEL_COUNT - 1
    },
    dispose: () => {
      const disposables = [
        unitGeometry,
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
