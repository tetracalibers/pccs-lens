import {
  BufferGeometry,
  CanvasTexture,
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
export type ConnectivitySpreadParams = {
  /** 中心の画素から近傍を何歩たどったか */
  steps: number
  /** 4 連結で届いた画素の数。scene.ts が組み立てて書き戻すので、初期値は使われない */
  reached4: string
  /** 8 連結で届いた画素の数。scene.ts が組み立てて書き戻すので、初期値は使われない */
  reached8: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ConnectivitySpreadParams
}

/**
 * 画素の格子。中心の画素を 1 つに決められるよう、縦横は奇数個にとる。
 * 8 連結なら (CELLS - 1) / 2 歩で格子全体に届く大きさ
 */
const CELLS = 7
const CENTER = (CELLS - 1) / 2
const PITCH = 0.33
const PLOT_SIZE = CELLS * PITCH
const HALF_SIZE = PLOT_SIZE / 2

/** 2 つの格子のあいだの隙間 */
const GRID_GAP = 0.42

/** 近傍のとらえ方。中心の画素から見て、隣とみなす画素の列と行のずれ */
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

/** 左右に並べる 2 つの格子。同じ歩数でも、近傍のとらえ方で広がる形が変わる */
const GRIDS = [
  { title: "4連結", offsetX: -(PLOT_SIZE + GRID_GAP) / 2, neighbors: NEIGHBORS_4 },
  { title: "8連結", offsetX: (PLOT_SIZE + GRID_GAP) / 2, neighbors: NEIGHBORS_8 }
]

/** 格子の名前の文字の高さと、格子の上端から逃がす距離 */
const TITLE_HEIGHT = 0.24
const TITLE_MARGIN = 0.22

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_PIXEL = 0.01
const LAYER_CENTER_PIXEL = 0.015
const LAYER_GRID = 0.02
const LAYER_FRAME = 0.03
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、格子・中心の画素・届いた画素を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const CENTER_COLOR = "#f2766a"
const REACHED_COLOR = "#ffc857"
const TITLE_COLOR = "#c9d2de"

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
 * 画素を単位とした位置を、格子の中心を原点とするワールド座標へ移す。
 * 画像座標系は y 軸を下向きにとるので、行が増えるほど下へ下がる。
 * 整数が画素どうしの境目、+0.5 が画素の中心に当たる
 */
const localXOf = (x: number) => -HALF_SIZE + x * PITCH
const localYOf = (y: number) => HALF_SIZE - y * PITCH

/**
 * 中心の画素から近傍をたどって、steps 歩で届く画素を求める。
 * いま届いたばかりの画素（frontier）の近傍へ、1 歩ずつ広げていく
 */
const reachedWithin = (steps: number, neighbors: [number, number][]) => {
  const reached = Array.from({ length: CELLS }, () => Array.from({ length: CELLS }, () => false))
  reached[CENTER][CENTER] = true

  let frontier: [number, number][] = [[CENTER, CENTER]]

  for (let step = 0; step < steps; step++) {
    const next: [number, number][] = []

    for (const [column, row] of frontier) {
      for (const [dc, dr] of neighbors) {
        const c = column + dc
        const r = row + dr
        if (c < 0 || c >= CELLS || r < 0 || r >= CELLS) continue
        if (reached[r][c]) continue

        reached[r][c] = true
        next.push([c, r])
      }
    }

    frontier = next
  }

  return reached
}

export const createConnectivitySpreadScene = ({ scene, params }: SceneContext) => {
  const barGeometry = new PlaneGeometry(1, 1)

  // 近傍をたどって届いた画素。2 つの格子で色は同じなので、まとめて 1 つに確保しておく。
  // 塗った色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const reachedMaterial = new MeshBasicMaterial({ color: REACHED_COLOR })
  const reachedPixels = new InstancedMesh(barGeometry, reachedMaterial, CELLS * CELLS * GRIDS.length)
  reachedPixels.frustumCulled = false
  scene.add(reachedPixels)

  // 画素どうしの境目と、格子の外周。2 つの格子をまとめて 1 本のジオメトリに引く
  const gridPoints: Vector3[] = []
  const framePoints: Vector3[] = []

  GRIDS.forEach(({ offsetX }) => {
    for (let column = 0; column <= CELLS; column++) {
      const x = offsetX + localXOf(column)
      gridPoints.push(new Vector3(x, -HALF_SIZE, LAYER_GRID), new Vector3(x, HALF_SIZE, LAYER_GRID))
    }
    for (let row = 0; row <= CELLS; row++) {
      const y = localYOf(row)
      gridPoints.push(
        new Vector3(offsetX - HALF_SIZE, y, LAYER_GRID),
        new Vector3(offsetX + HALF_SIZE, y, LAYER_GRID)
      )
    }

    const corners = [
      new Vector3(offsetX - HALF_SIZE, HALF_SIZE, LAYER_FRAME),
      new Vector3(offsetX + HALF_SIZE, HALF_SIZE, LAYER_FRAME),
      new Vector3(offsetX + HALF_SIZE, -HALF_SIZE, LAYER_FRAME),
      new Vector3(offsetX - HALF_SIZE, -HALF_SIZE, LAYER_FRAME)
    ]
    corners.forEach((corner, index) => {
      framePoints.push(corner, corners[(index + 1) % corners.length])
    })
  })

  const gridGeometry = new BufferGeometry().setFromPoints(gridPoints)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  scene.add(new LineSegments(gridGeometry, gridMaterial))

  const frameGeometry = new BufferGeometry().setFromPoints(framePoints)
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  scene.add(new LineSegments(frameGeometry, frameMaterial))

  // たどり始める中心の画素。届いた画素と見分けるため、別の色で描く
  const centerMaterial = new MeshBasicMaterial({ color: CENTER_COLOR })
  GRIDS.forEach(({ offsetX }) => {
    const centerPixel = new Mesh(barGeometry, centerMaterial)
    centerPixel.scale.set(PITCH, PITCH, 1)
    centerPixel.position.set(
      offsetX + localXOf(CENTER + 0.5),
      localYOf(CENTER + 0.5),
      LAYER_CENTER_PIXEL
    )
    scene.add(centerPixel)
  })

  // 格子の名前。文字は変わらないので作り直さない
  const titleLabels = GRIDS.map(({ title, offsetX }) => {
    const label = createLabel(title, TITLE_COLOR, TITLE_HEIGHT)
    label.sprite.position.set(offsetX, HALF_SIZE + TITLE_MARGIN, LAYER_LABEL)
    scene.add(label.sprite)
    return label
  })

  const matrix = new Matrix4()

  return {
    update: () => {
      const steps = Math.round(params.steps)
      const counts: number[] = []
      let painted = 0

      GRIDS.forEach(({ offsetX, neighbors }) => {
        const reached = reachedWithin(steps, neighbors)
        let count = 0

        for (let row = 0; row < CELLS; row++) {
          for (let column = 0; column < CELLS; column++) {
            if (!reached[row][column]) continue
            count++
            // 中心の画素は別の色で描いてあるので、ここでは重ねない
            if (row === CENTER && column === CENTER) continue

            matrix.makeScale(PITCH, PITCH, 1)
            matrix.setPosition(
              offsetX + localXOf(column + 0.5),
              localYOf(row + 0.5),
              LAYER_PIXEL
            )
            reachedPixels.setMatrixAt(painted++, matrix)
          }
        }

        counts.push(count)
      })

      reachedPixels.count = painted
      reachedPixels.instanceMatrix.needsUpdate = true

      // 同じ歩数でも届く画素の数が違うことを、数でも追えるようにする
      params.reached4 = `${counts[0]}個`
      params.reached8 = `${counts[1]}個`
    },
    dispose: () => {
      const disposables = [
        barGeometry,
        reachedMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        centerMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      reachedPixels.dispose()
      titleLabels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
