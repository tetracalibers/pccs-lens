import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
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
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ScanlineFillParams = {
  /** いま走査している行。この行の 1 つ上の行までは塗り終えた状態を見せる */
  row: number
  /** 走査線とポリゴンの交点の個数。scene.ts が組み立てて書き戻すので、初期値は使われない */
  crossingCount: string
  /** 塗る区間の取り方。scene.ts が組み立てて書き戻すので、初期値は使われない */
  spans: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ScanlineFillParams
}

/** 画素の格子。ポリゴンの輪郭のがたつきと、行ごとに塗られた画素の並びが読める細かさにとる */
const COLUMNS = 24
const ROWS = 16
const PITCH = 0.15
const PLOT_WIDTH = COLUMNS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/**
 * 塗りつぶす閉領域。本文の例に合わせて、山が 2 つ並んだ形をとる。
 * 走査線は画素の中心（行 + 0.5）を通るので、頂点の y を整数にとっておけば、
 * 走査線が頂点の高さにちょうど重なることがない
 */
const POLYGON: [number, number][] = [
  [2.5, 13],
  [7.5, 2],
  [11, 8],
  [14, 8],
  [17.5, 3],
  [21.5, 13]
]

/**
 * ポリゴンの輪郭と走査線の太さ。線材（LineBasicMaterial）の線幅は WebGL では
 * 常に 1 ドットに固定されるため、図の主役である輪郭と走査線は細長い長方形として描く
 */
const OUTLINE_THICKNESS = 0.03
const SCANLINE_THICKNESS = 0.028

/** 走査線を格子の外へ伸ばす分。画像を横切る 1 本の線であることが分かるようにする */
const SCANLINE_OVERSHOOT = 0.14

/** 交点を示す点の半径 */
const DOT_RADIUS = 0.046

/** 凡例を並べる位置（格子の右）と、色見本の長さ・文字までの間隔・項目どうしの間隔 */
const LEGEND_X = 2.0
const LEGEND_SWATCH = 0.26
const LEGEND_TEXT_GAP = 0.12
const LEGEND_GAP = 0.34

/** 凡例の文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
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
const LAYER_CURRENT_PIXEL = 0.015
const LAYER_GRID = 0.02
const LAYER_FRAME = 0.03
const LAYER_SCANLINE = 0.05
const LAYER_OUTLINE = 0.06
const LAYER_DOT = 0.08
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、輪郭・走査線・交点・塗った画素を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const OUTLINE_COLOR = "#6fd8ff"
const SCANLINE_COLOR = "#f2766a"
const CROSSING_COLOR = "#f5f8fc"
const PIXEL_COLOR = "#ffc857"
const PAST_PIXEL_OPACITY = 0.45
const LABEL_COLOR = "#c9d2de"

/** 図全体を canvas の中央に寄せる位置。右の凡例の分だけ左へ寄せる */
const GRAPH_OFFSET = new Vector3(-0.79, 0, 0)

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
 * 画素を単位とした位置を、ワールド座標へ移す。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる。
 * 整数が画素どうしの境目、+0.5 が画素の中心に当たる
 */
const worldXOf = (x: number) => -HALF_WIDTH + x * PITCH
const worldYOf = (y: number) => HALF_HEIGHT - y * PITCH

/**
 * 走査線の高さ y で、ポリゴンの辺と交わる点の x を左から順に並べる。
 * 水平な辺は走査線と交点を作らないので飛ばし、辺の上端を含み下端を含まない
 * 範囲で数えることで、頂点の高さでも交点を二重に数えないようにする
 */
const crossingsAt = (y: number) => {
  const xs: number[] = []

  for (let i = 0; i < POLYGON.length; i++) {
    const [x1, y1] = POLYGON[i]
    const [x2, y2] = POLYGON[(i + 1) % POLYGON.length]
    if (y1 === y2) continue
    if (y < Math.min(y1, y2) || y >= Math.max(y1, y2)) continue

    xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1))
  }

  return xs.sort((a, b) => a - b)
}

/**
 * 区間 [left, right) を塗る画素の列。
 * 画素の中心は列 + 0.5 にあるので、中心が区間に入る列だけを塗る
 */
const columnsIn = (left: number, right: number) => ({
  first: Math.max(0, Math.ceil(left - 0.5)),
  last: Math.min(COLUMNS - 1, Math.ceil(right - 0.5) - 1)
})

/** 細長い長方形を、2 点を結ぶ線分に重ねる */
const placeBar = (
  bar: Mesh,
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  thickness: number,
  z: number
) => {
  const ax = worldXOf(x1)
  const ay = worldYOf(y1)
  const bx = worldXOf(x2)
  const by = worldYOf(y2)

  bar.scale.set(Math.hypot(bx - ax, by - ay), thickness, 1)
  bar.rotation.z = Math.atan2(by - ay, bx - ax)
  bar.position.set((ax + bx) / 2, (ay + by) / 2, z)
}

export const createScanlineFillScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  const barGeometry = new PlaneGeometry(1, 1)
  const dotGeometry = new CircleGeometry(DOT_RADIUS, 16)

  // 塗り終えた行の画素。いま塗った区間と見分けるため、控えめな濃さにする。
  // 塗った色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const pastPixelMaterial = new MeshBasicMaterial({
    color: PIXEL_COLOR,
    transparent: true,
    opacity: PAST_PIXEL_OPACITY
  })
  const pastPixels = new InstancedMesh(barGeometry, pastPixelMaterial, COLUMNS * ROWS)
  pastPixels.frustumCulled = false
  graph.add(pastPixels)

  // いま走査している行で、交点をもとに塗った区間の画素
  const currentPixelMaterial = new MeshBasicMaterial({ color: PIXEL_COLOR })
  const currentPixels = new InstancedMesh(barGeometry, currentPixelMaterial, COLUMNS)
  currentPixels.frustumCulled = false
  graph.add(currentPixels)

  // 画素どうしの境目
  const gridPoints: Vector3[] = []
  for (let column = 0; column <= COLUMNS; column++) {
    const x = worldXOf(column)
    gridPoints.push(new Vector3(x, -HALF_HEIGHT, LAYER_GRID), new Vector3(x, HALF_HEIGHT, LAYER_GRID))
  }
  for (let row = 0; row <= ROWS; row++) {
    const y = worldYOf(row)
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

  // 塗りつぶす閉領域の輪郭。格子とは無関係に、切れ目なく閉じた線
  const outlineMaterial = new MeshBasicMaterial({ color: OUTLINE_COLOR })
  POLYGON.forEach((vertex, index) => {
    const edge = new Mesh(barGeometry, outlineMaterial)
    placeBar(edge, vertex, POLYGON[(index + 1) % POLYGON.length], OUTLINE_THICKNESS, LAYER_OUTLINE)
    graph.add(edge)
  })

  // 走査線。画像を横切る 1 本の水平な線で、行を 1 つずらすたびに下へ動く
  const scanlineMaterial = new MeshBasicMaterial({ color: SCANLINE_COLOR })
  const scanline = new Mesh(barGeometry, scanlineMaterial)
  scanline.scale.set(PLOT_WIDTH + SCANLINE_OVERSHOOT * 2, SCANLINE_THICKNESS, 1)
  graph.add(scanline)

  // 走査線と輪郭の交点。この点の位置から、塗る区間が決まる
  const crossingMaterial = new MeshBasicMaterial({ color: CROSSING_COLOR })
  const crossingDots = new InstancedMesh(dotGeometry, crossingMaterial, POLYGON.length)
  crossingDots.frustumCulled = false
  graph.add(crossingDots)

  // 凡例。色見本は、輪郭と走査線は線、交点は点、画素は四角で示す
  const legendItems = [
    {
      text: "ポリゴンの輪郭",
      geometry: barGeometry,
      material: outlineMaterial,
      scale: [LEGEND_SWATCH, OUTLINE_THICKNESS]
    },
    {
      text: "走査線",
      geometry: barGeometry,
      material: scanlineMaterial,
      scale: [LEGEND_SWATCH, SCANLINE_THICKNESS]
    },
    { text: "交点", geometry: dotGeometry, material: crossingMaterial, scale: [1, 1] },
    {
      text: "いま塗った区間",
      geometry: barGeometry,
      material: currentPixelMaterial,
      scale: [LEGEND_SWATCH * 0.8, LEGEND_SWATCH * 0.8]
    },
    {
      text: "塗り終えた画素",
      geometry: barGeometry,
      material: pastPixelMaterial,
      scale: [LEGEND_SWATCH * 0.8, LEGEND_SWATCH * 0.8]
    }
  ]
  const legendTop = ((legendItems.length - 1) * LEGEND_GAP) / 2
  const legendLabels = legendItems.map(({ text, geometry, material, scale }, index) => {
    const y = legendTop - index * LEGEND_GAP

    const swatch = new Mesh(geometry, material)
    swatch.scale.set(scale[0], scale[1], 1)
    swatch.position.set(LEGEND_X + LEGEND_SWATCH / 2, y, LAYER_LABEL)
    graph.add(swatch)

    // 文字の左端を色見本のうしろに揃える。中央寄せの板なので、測った幅の半分だけ右へずらす
    const label = createLabel(text, LABEL_COLOR, LABEL_HEIGHT)
    label.sprite.position.set(
      LEGEND_X + LEGEND_SWATCH + LEGEND_TEXT_GAP + label.sprite.scale.x / 2,
      y,
      LAYER_LABEL
    )
    graph.add(label.sprite)

    return label
  })

  const matrix = new Matrix4()

  /** 走査線 row の塗る区間を画素で埋め、埋めた画素の数を返す */
  const fillRow = (row: number, pixels: InstancedMesh, offset: number, z: number) => {
    const crossings = crossingsAt(row + 0.5)
    let painted = offset

    // 交点を左から順に並べ、奇数番目の交点から次の偶数番目の交点までを塗る
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const { first, last } = columnsIn(crossings[i], crossings[i + 1])
      for (let column = first; column <= last; column++) {
        matrix.makeScale(PITCH, PITCH, 1)
        matrix.setPosition(worldXOf(column + 0.5), worldYOf(row + 0.5), z)
        pixels.setMatrixAt(painted++, matrix)
      }
    }

    return painted - offset
  }

  return {
    update: () => {
      const row = Math.round(params.row)

      // 上の行から順に、走査線ごとの区間を塗り終えた状態
      let pastCount = 0
      for (let above = 0; above < row; above++) {
        pastCount += fillRow(above, pastPixels, pastCount, LAYER_PIXEL)
      }
      pastPixels.count = pastCount
      pastPixels.instanceMatrix.needsUpdate = true

      // いま走査している行
      currentPixels.count = fillRow(row, currentPixels, 0, LAYER_CURRENT_PIXEL)
      currentPixels.instanceMatrix.needsUpdate = true

      scanline.position.set(0, worldYOf(row + 0.5), LAYER_SCANLINE)

      const crossings = crossingsAt(row + 0.5)
      crossings.forEach((x, index) => {
        matrix.identity()
        matrix.setPosition(worldXOf(x), worldYOf(row + 0.5), LAYER_DOT)
        crossingDots.setMatrixAt(index, matrix)
      })
      crossingDots.count = crossings.length
      crossingDots.instanceMatrix.needsUpdate = true

      // 交点が偶数個できることと、区間の取り方を数と言葉でも追えるようにする
      params.crossingCount =
        crossings.length === 0
          ? "0個（走査線が領域と交わらない）"
          : `${crossings.length}個（偶数）`

      const spans: string[] = []
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        spans.push(`${i + 1}番目〜${i + 2}番目`)
      }
      params.spans = spans.length === 0 ? "なし" : spans.join("、")
    },
    dispose: () => {
      const disposables = [
        barGeometry,
        dotGeometry,
        pastPixelMaterial,
        currentPixelMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        outlineMaterial,
        scanlineMaterial,
        crossingMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pastPixels.dispose()
      currentPixels.dispose()
      crossingDots.dispose()
      legendLabels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
