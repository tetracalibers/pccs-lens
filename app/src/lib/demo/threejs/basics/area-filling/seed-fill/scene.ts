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
export type SeedFillParams = {
  /** シード点から近傍を何歩たどったか */
  steps: number
  /** その画素を塗ってよいかの判定の基準 */
  criterion: "boundary" | "interior"
  /** 近傍のとらえ方。隣とみなす方向の数 */
  connectivity: 4 | 8
  /** 塗った画素の数。scene.ts が組み立てて書き戻すので、初期値は使われない */
  filled: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: SeedFillParams
}

/**
 * 盤面。B が境界の画素、. が塗る前の内部の色、O が内部にある別の色の部分、- が領域の外。
 * 左上の部屋は別の色の帯で上下に仕切られていて、右下の部屋とは
 * 角どうしが斜めに触れているだけで繋がっている
 */
const BOARD = [
  "----------------",
  "--BBBBBBBB------",
  "--B......B------",
  "--B......B------",
  "--BOOOOOOB------",
  "--B......B------",
  "--B......BBBBB--",
  "--BBBBBBB....B--",
  "--------B....B--",
  "--------B....B--",
  "--------B....B--",
  "--------BBBBBB--",
  "----------------"
]

/** 塗りつぶしの出発点となるシード点（列, 行）。帯より下の側に置く */
const SEED: [number, number] = [3, 6]

/** 画素の格子 */
const ROWS = BOARD.length
const COLS = BOARD[0].length
const PITCH = 0.2
const PLOT_WIDTH = COLS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/** 近傍のとらえ方。いま見ている画素から見て、隣とみなす画素の列と行のずれ */
const NEIGHBORS_4: [number, number][] = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1]
]
const NEIGHBORS_8: [number, number][] = [
  ...NEIGHBORS_4,
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1]
]

/** シード点を示す点の半径 */
const SEED_DOT_RADIUS = 0.055

/** 凡例を並べる位置（格子の右）と、色見本の長さ・文字までの間隔・項目どうしの間隔 */
const LEGEND_X = 1.8
const LEGEND_SWATCH = 0.26
const LEGEND_TEXT_GAP = 0.12
const LEGEND_GAP = 0.32

/** 凡例の文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.19

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_CELL = 0.01
const LAYER_FILL = 0.015
const LAYER_FRONTIER = 0.02
const LAYER_GRID = 0.025
const LAYER_FRAME = 0.03
const LAYER_SEED = 0.05
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、境界・内部・別の色の部分・塗った画素を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const BOUNDARY_COLOR = "#6fd8ff"
const INTERIOR_COLOR = "#4a5160"
const PATCH_COLOR = "#a58bd8"
const FILL_COLOR = "#ffc857"
const FRONTIER_COLOR = "#f2766a"
const SEED_COLOR = "#f5f8fc"
const LABEL_COLOR = "#c9d2de"

/** 図全体を canvas の中央に寄せる位置。右の凡例の分だけ左へ寄せる */
const GRAPH_OFFSET = new Vector3(-0.72, 0, 0)

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
 * 画素 (column, row) を塗ってよいか。
 * 境界色基準は境界色でなければ塗り進め、内部色基準は塗り始める前の内部の色と同じ画素だけを塗る
 */
const canFill = (column: number, row: number, criterion: SeedFillParams["criterion"]) => {
  const cell = BOARD[row][column]
  return criterion === "boundary" ? cell !== "B" : cell === "."
}

/**
 * シード点から近傍をたどって、steps 歩で塗れた画素と、いま広がった先端を求める。
 * 隣接する画素を順に調べ、塗ってよければ塗り、そこからさらに隣接する画素を調べる
 */
const spreadFrom = (
  steps: number,
  neighbors: [number, number][],
  criterion: SeedFillParams["criterion"]
) => {
  const filled = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false))
  filled[SEED[1]][SEED[0]] = true

  let frontier: [number, number][] = [SEED]

  for (let step = 0; step < steps; step++) {
    const next: [number, number][] = []

    for (const [column, row] of frontier) {
      for (const [dc, dr] of neighbors) {
        const c = column + dc
        const r = row + dr
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue
        // すでに塗ってあればやり直さない
        if (filled[r][c]) continue
        // 境界に達していたら塗らない
        if (!canFill(c, r, criterion)) continue

        filled[r][c] = true
        next.push([c, r])
      }
    }

    frontier = next
  }

  return { filled, frontier }
}

export const createSeedFillScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  const cellGeometry = new PlaneGeometry(1, 1)
  const dotGeometry = new CircleGeometry(SEED_DOT_RADIUS, 16)
  const matrix = new Matrix4()

  /**
   * 盤面のうち、文字が cell の画素をまとめて置く。
   * 塗った色をそのままの濃さで見せたいので、陰影の付かない材質にする
   */
  const placeCells = (cell: string, color: string) => {
    const material = new MeshBasicMaterial({ color })
    const cells = new InstancedMesh(cellGeometry, material, COLS * ROWS)
    cells.frustumCulled = false

    let placed = 0
    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLS; column++) {
        if (BOARD[row][column] !== cell) continue

        matrix.makeScale(PITCH, PITCH, 1)
        matrix.setPosition(worldXOf(column + 0.5), worldYOf(row + 0.5), LAYER_CELL)
        cells.setMatrixAt(placed++, matrix)
      }
    }
    cells.count = placed
    graph.add(cells)

    return material
  }

  const boundaryMaterial = placeCells("B", BOUNDARY_COLOR)
  const interiorMaterial = placeCells(".", INTERIOR_COLOR)
  const patchMaterial = placeCells("O", PATCH_COLOR)

  // 塗った画素と、そのうち直前の 1 歩で広がった先端
  const fillMaterial = new MeshBasicMaterial({ color: FILL_COLOR })
  const fillPixels = new InstancedMesh(cellGeometry, fillMaterial, COLS * ROWS)
  fillPixels.frustumCulled = false
  graph.add(fillPixels)

  const frontierMaterial = new MeshBasicMaterial({ color: FRONTIER_COLOR })
  const frontierPixels = new InstancedMesh(cellGeometry, frontierMaterial, COLS * ROWS)
  frontierPixels.frustumCulled = false
  graph.add(frontierPixels)

  // 画素どうしの境目
  const gridPoints: Vector3[] = []
  for (let column = 0; column <= COLS; column++) {
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

  // 塗りつぶしの出発点。塗られたあとも位置が分かるように、点で重ねておく
  const seedMaterial = new MeshBasicMaterial({ color: SEED_COLOR })
  const seedDot = new Mesh(dotGeometry, seedMaterial)
  seedDot.position.set(worldXOf(SEED[0] + 0.5), worldYOf(SEED[1] + 0.5), LAYER_SEED)
  graph.add(seedDot)

  // 凡例。色見本は、画素は四角、シード点は点で示す
  const legendItems = [
    { text: "境界の画素", geometry: cellGeometry, material: boundaryMaterial },
    { text: "塗る前の内部", geometry: cellGeometry, material: interiorMaterial },
    { text: "別の色の部分", geometry: cellGeometry, material: patchMaterial },
    { text: "塗った画素", geometry: cellGeometry, material: fillMaterial },
    { text: "広がった先端", geometry: cellGeometry, material: frontierMaterial },
    { text: "シード点", geometry: dotGeometry, material: seedMaterial }
  ]
  const legendTop = ((legendItems.length - 1) * LEGEND_GAP) / 2
  const legendLabels = legendItems.map(({ text, geometry, material }, index) => {
    const y = legendTop - index * LEGEND_GAP

    const swatch = new Mesh(geometry, material)
    if (geometry === cellGeometry) swatch.scale.setScalar(LEGEND_SWATCH * 0.8)
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

  return {
    update: () => {
      const steps = Math.round(params.steps)
      const neighbors = params.connectivity === 8 ? NEIGHBORS_8 : NEIGHBORS_4
      const { filled, frontier } = spreadFrom(steps, neighbors, params.criterion)

      const onFrontier = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false))
      frontier.forEach(([column, row]) => {
        onFrontier[row][column] = true
      })

      let painted = 0
      let fillPlaced = 0
      let frontierPlaced = 0

      for (let row = 0; row < ROWS; row++) {
        for (let column = 0; column < COLS; column++) {
          if (!filled[row][column]) continue
          painted++

          const isFrontier = onFrontier[row][column]
          matrix.makeScale(PITCH, PITCH, 1)
          matrix.setPosition(
            worldXOf(column + 0.5),
            worldYOf(row + 0.5),
            isFrontier ? LAYER_FRONTIER : LAYER_FILL
          )

          if (isFrontier) {
            frontierPixels.setMatrixAt(frontierPlaced++, matrix)
          } else {
            fillPixels.setMatrixAt(fillPlaced++, matrix)
          }
        }
      }

      fillPixels.count = fillPlaced
      fillPixels.instanceMatrix.needsUpdate = true
      frontierPixels.count = frontierPlaced
      frontierPixels.instanceMatrix.needsUpdate = true

      // 塗れる画素がなくなったら、そこで塗りつぶしが終わったことを示す
      params.filled =
        frontier.length === 0 ? `${painted}個（これ以上広がらない）` : `${painted}個`
    },
    dispose: () => {
      const disposables = [
        cellGeometry,
        dotGeometry,
        boundaryMaterial,
        interiorMaterial,
        patchMaterial,
        fillMaterial,
        frontierMaterial,
        seedMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      fillPixels.dispose()
      frontierPixels.dispose()
      legendLabels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
