import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  DataTexture,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Plane,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from "three"

/** 色。各チャンネルを 0 から 255 の整数で持つ */
type Rgb = { r: number; g: number; b: number }

/** Tweakpane で操作するパラメータ */
export type SupersamplingParams = {
  /** 1 辺あたりのサンプリング点の数。1 画素はこの 2 乗の点で標本化される */
  samples: number
  /** 画素にかかる図形の輪郭の向き（度） */
  angle: number
  /** 輪郭の位置。画素の 1 辺を 1 として、中心からどれだけずれた所を通るか */
  offset: number
  /** 図形側に落ちた点の数と、その割合の表示。scene.ts が組み立てて書き戻す */
  estimate: string
  /** 厳密な面積比（寄与率）の表示。scene.ts が組み立てて書き戻す */
  exact: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  renderer: WebGLRenderer
  params: SupersamplingParams
}

/** 画像の画素数と、画素 1 つの大きさ */
const IMAGE_COLUMNS = 10
const IMAGE_ROWS = 8
const IMAGE_PITCH = 0.175
const IMAGE_WIDTH = IMAGE_COLUMNS * IMAGE_PITCH
const IMAGE_HEIGHT = IMAGE_ROWS * IMAGE_PITCH

/** 拡大して見せる画素の 1 辺。画像と背の高さを揃える */
const PIXEL = IMAGE_HEIGHT

/**
 * 求めた色を埋め戻す画素（画像の左下を 0 とした列と行）。
 * 引き出し線が画像の上を長く横切らないよう、左端に近い列を選ぶ
 */
const TARGET_COLUMN = 1
const TARGET_ROW = 4

/** 拡大図と平均した色の間（矢印）、平均した色と画像の間（引き出し線）の空き */
const ARROW_GAP = 0.45
const CALLOUT_GAP = 0.5

/**
 * 3 つのパネルを横一列に並べたときの、中心の x と共通の y。
 * 1 画素の色を求める手順（拡大図 → 平均した色）を先に置き、
 * その色を埋め戻した結果として画像を最後に置く
 */
const PANEL_Y = -0.12
const CONTENT_WIDTH = PIXEL + ARROW_GAP + PIXEL + CALLOUT_GAP + IMAGE_WIDTH
const PIXEL_X = -CONTENT_WIDTH / 2 + PIXEL / 2
const AVERAGE_X = PIXEL_X + PIXEL / 2 + ARROW_GAP + PIXEL / 2
const IMAGE_X = AVERAGE_X + PIXEL / 2 + CALLOUT_GAP + IMAGE_WIDTH / 2

/** 埋め戻す先の画素の中心（画像の中での位置） */
const TARGET_X = IMAGE_X - IMAGE_WIDTH / 2 + (TARGET_COLUMN + 0.5) * IMAGE_PITCH
const TARGET_Y = PANEL_Y - IMAGE_HEIGHT / 2 + (TARGET_ROW + 0.5) * IMAGE_PITCH

/** 画像の中で埋め戻し先の画素を囲む枠の太さ。線は太さを変えられないので長方形 4 つで描く */
const TARGET_FRAME_WIDTH = 0.022

/** 1 辺あたりのサンプリング点の数の上限。点と区画の境目をこの数に合わせて先に確保しておく */
const MAX_SAMPLES_PER_SIDE = 6
const MAX_SAMPLES = MAX_SAMPLES_PER_SIDE * MAX_SAMPLES_PER_SIDE

/** サンプリング点の大きさ。区画の大きさに比例させ、点が大きくなりすぎないよう上限を設ける */
const DOT_SCALE = 0.165
const DOT_MAX_RADIUS = 0.0525

/** 拡大図から平均した色へ向かう矢印。全体の長さと、軸の太さ・矢じりの大きさ */
const ARROW_SPAN = 0.38
const ARROW_THICKNESS = 0.03
const ARROW_HEAD_HEIGHT = 0.15
const ARROW_HEAD_RADIUS = 0.065

/** 見出しの文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.16

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 図形の色と背景の色。サンプリング点は、落ちた位置にあるこのどちらかの色を取る */
const FIGURE: Rgb = { r: 255, g: 200, b: 87 }
const BACKGROUND: Rgb = { r: 61, g: 111, b: 168 }

// 背景（暗めのグレー）の上で、区画の境目・点の縁・矢印・文字・画素の枠を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const DOT_COLOR = "#9aa3b0"
const ARROW_COLOR = "#9aa3b0"
const LABEL_COLOR = "#c9d2de"
const TARGET_COLOR = "#f5f7fa"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない。
 *
 * ただし遠近法では手前にあるものが大きく写るので、画面の中心から離れた位置にある要素は
 * z の分だけ外側へずれる。画像の中の 1 画素を囲む枠のように、下地とぴったり重ねたい要素は
 * z を持たせず（画像と同じ平面に置き）、深度テストを切って手前に描く（→ OVERLAY_ORDER）
 */
const LAYER_FIGURE = 0.01
const LAYER_GRID = 0.02
const LAYER_DOT = 0.04
const LAYER_EDGE = 0.05
const LAYER_LABEL = 0.1

/** 深度テストを切って手前に描く要素の描画順。数が大きいほどあとに描かれる */
const OVERLAY_ORDER = 1

/** 多角形の頂点 */
type Point = [number, number]

/** 画素 1 つを、中心を原点として -0.5 から 0.5 の正方形で表したもの */
const UNIT_PIXEL: Point[] = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5]
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
 * 0 から 255 の色を材質に設定する。
 * 第 4 引数を省くと three は値を作業色空間（リニア）として扱うため、
 * sRGB の値であることを明示して渡す
 */
const applyColor = (material: MeshBasicMaterial, { r, g, b }: Rgb) => {
  material.color.setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
}

/** 中心 (cx, cy)・1 辺 size の正方形の枠を、太さ width の細長い長方形 4 つとして組む */
const frameVertices = (cx: number, cy: number, size: number, width: number, z: number) => {
  const outer = size / 2 + width / 2
  const inner = size / 2 - width / 2
  // 上・下・左・右の 4 本。角は上下の帯で埋める
  const bars = [
    [cx - outer, cy + inner, cx + outer, cy + outer],
    [cx - outer, cy - outer, cx + outer, cy - inner],
    [cx - outer, cy - inner, cx - inner, cy + inner],
    [cx + inner, cy - inner, cx + outer, cy + inner]
  ]

  const points: Vector3[] = []
  for (const [x0, y0, x1, y1] of bars) {
    points.push(
      new Vector3(x0, y0, z),
      new Vector3(x1, y0, z),
      new Vector3(x1, y1, z),
      new Vector3(x0, y0, z),
      new Vector3(x1, y1, z),
      new Vector3(x0, y1, z)
    )
  }

  return points
}

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

export const createSupersamplingScene = ({ scene, renderer, params }: SceneContext) => {
  // 図形を輪郭の直線で切り出すのに、材質ごとのクリッピングを使う。
  // これが無いと図形が画素いっぱいに広がってしまうので、記事に載せるコードにも含める
  renderer.localClippingEnabled = true

  // 拡大した画素の地。図形が覆っていない部分は背景の色になる。
  // 指定した色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const pixelGeometry = new PlaneGeometry(PIXEL, PIXEL)
  const backgroundMaterial = new MeshBasicMaterial()
  applyColor(backgroundMaterial, BACKGROUND)
  const backgroundPixel = new Mesh(pixelGeometry, backgroundMaterial)
  backgroundPixel.position.set(PIXEL_X, PANEL_Y, 0)
  scene.add(backgroundPixel)

  // 画素にかかった図形。画素と同じ大きさの板を輪郭の直線でクリッピングし、図形側だけを残す。
  // クリッピング面はワールド座標で効くので、板の位置に合わせて update で置き直す
  const figurePlane = new Plane(new Vector3(-1, 0, 0), 0)
  const figureMaterial = new MeshBasicMaterial({ clippingPlanes: [figurePlane] })
  applyColor(figureMaterial, FIGURE)
  const figurePixel = new Mesh(pixelGeometry, figureMaterial)
  figurePixel.position.set(PIXEL_X, PANEL_Y, LAYER_FIGURE)
  scene.add(figurePixel)

  // 画素を分けた区画の境目。点の数が変わるたびに引き直すので、頂点は上限の数だけ確保しておく
  const gridPosition = new Float32BufferAttribute(
    new Float32Array((MAX_SAMPLES_PER_SIDE + 1) * 2 * 2 * 3),
    3
  )
  const gridGeometry = new BufferGeometry().setAttribute("position", gridPosition)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  const grid = new LineSegments(gridGeometry, gridMaterial)
  grid.position.z = LAYER_GRID
  scene.add(grid)

  // サンプリング点。図形の色・背景の色のどちらに落ちても位置が読めるよう、
  // 下地と重ならないグレーの円で描く
  const dotGeometry = new CircleGeometry(1, 16)
  const dotMaterial = new MeshBasicMaterial({ color: DOT_COLOR })
  const dots = new InstancedMesh(dotGeometry, dotMaterial, MAX_SAMPLES)
  dots.frustumCulled = false
  dots.position.z = LAYER_DOT
  scene.add(dots)

  // 中央の画素。サンプリング点の色を平均した色で塗る
  const averageMaterial = new MeshBasicMaterial()
  const averagePixel = new Mesh(pixelGeometry, averageMaterial)
  averagePixel.position.set(AVERAGE_X, PANEL_Y, 0)
  scene.add(averagePixel)

  // 拡大図から平均した色へ向かう矢印。軸は細長い長方形、矢じりは円錐で描く
  const arrowCenterX = (PIXEL_X + AVERAGE_X) / 2
  const arrowMaterial = new MeshBasicMaterial({ color: ARROW_COLOR })
  const shaftGeometry = new PlaneGeometry(ARROW_SPAN - ARROW_HEAD_HEIGHT, ARROW_THICKNESS)
  const shaft = new Mesh(shaftGeometry, arrowMaterial)
  shaft.position.set(arrowCenterX - ARROW_HEAD_HEIGHT / 2, PANEL_Y, LAYER_EDGE)
  scene.add(shaft)

  // ConeGeometry は +y 向きに尖っているので、右を向くように回す
  const headGeometry = new ConeGeometry(ARROW_HEAD_RADIUS, ARROW_HEAD_HEIGHT, 12)
  const head = new Mesh(headGeometry, arrowMaterial)
  head.position.set(arrowCenterX + (ARROW_SPAN - ARROW_HEAD_HEIGHT) / 2, PANEL_Y, LAYER_EDGE)
  head.rotation.z = -Math.PI / 2
  scene.add(head)

  // 画像。すべての画素を拡大図と同じ手順で塗った結果で、1 画素 1 テクセルのテクスチャに焼いて貼る。
  // 拡大しても画素が混ざらないよう、補間なし（NearestFilter）で貼る
  const imageData = new Uint8Array(IMAGE_COLUMNS * IMAGE_ROWS * 4)
  const imageTexture = new DataTexture(imageData, IMAGE_COLUMNS, IMAGE_ROWS)
  imageTexture.colorSpace = SRGBColorSpace
  imageTexture.magFilter = NearestFilter
  imageTexture.minFilter = NearestFilter
  const imageGeometry = new PlaneGeometry(IMAGE_WIDTH, IMAGE_HEIGHT)
  const imageMaterial = new MeshBasicMaterial({ map: imageTexture })
  const image = new Mesh(imageGeometry, imageMaterial)
  image.position.set(IMAGE_X, PANEL_Y, 0)
  scene.add(image)

  // 画像の中で、いま求めた色が入った 1 画素を囲む枠。画素とぴったり重ねたいので画像と同じ平面に置き、
  // 深度テストを切って手前に描く（z で手前に出すと、遠近法で画素からずれてしまう）
  const targetFrameGeometry = new BufferGeometry().setFromPoints(
    frameVertices(TARGET_X, TARGET_Y, IMAGE_PITCH, TARGET_FRAME_WIDTH, 0)
  )
  const targetFrameMaterial = new MeshBasicMaterial({
    color: TARGET_COLOR,
    depthTest: false
  })
  const targetFrame = new Mesh(targetFrameGeometry, targetFrameMaterial)
  targetFrame.renderOrder = OVERLAY_ORDER
  scene.add(targetFrame)

  // 平均した色を埋め戻す先を示す引き出し線。平均した色の画素の右辺の両端から、
  // 画像の中のその画素の左辺の両端へ、すぼまるように引く
  const calloutGeometry = new BufferGeometry().setFromPoints([
    new Vector3(AVERAGE_X + PIXEL / 2, PANEL_Y + PIXEL / 2, 0),
    new Vector3(TARGET_X - IMAGE_PITCH / 2, TARGET_Y + IMAGE_PITCH / 2, 0),
    new Vector3(AVERAGE_X + PIXEL / 2, PANEL_Y - PIXEL / 2, 0),
    new Vector3(TARGET_X - IMAGE_PITCH / 2, TARGET_Y - IMAGE_PITCH / 2, 0)
  ])
  const calloutMaterial = new LineBasicMaterial({ color: ARROW_COLOR, depthTest: false })
  const callout = new LineSegments(calloutGeometry, calloutMaterial)
  callout.renderOrder = OVERLAY_ORDER
  scene.add(callout)

  const labelY = PANEL_Y + PIXEL / 2 + 0.22
  const labels = [
    { text: "拡大した1画素", x: PIXEL_X },
    { text: "平均した色", x: AVERAGE_X },
    { text: "画像全体", x: IMAGE_X }
  ].map(({ text, x }) => {
    const label = createLabel(text, LABEL_HEIGHT)
    label.sprite.position.set(x, labelY, LAYER_LABEL)
    scene.add(label.sprite)
    return label
  })

  const matrix = new Matrix4()

  return {
    update: () => {
      const { samples, offset } = params
      const total = samples * samples

      // 輪郭に立てた法線。図形は「法線方向にはかった座標が offset 以下」の側にある
      const radians = (params.angle * Math.PI) / 180
      const normalX = Math.cos(radians)
      const normalY = Math.sin(radians)

      // 図形側だけを残すクリッピング面。板の中心を原点とした条件を、ワールド座標に直して渡す
      figurePlane.normal.set(-normalX, -normalY, 0)
      figurePlane.constant = offset * PIXEL + normalX * PIXEL_X + normalY * PANEL_Y

      // 区画の境目。画素の 1 辺を点の数で等分した位置に引く
      const pitch = PIXEL / samples
      let vertex = 0
      for (let index = 0; index <= samples; index++) {
        const shift = -PIXEL / 2 + index * pitch
        gridPosition.setXYZ(vertex++, PIXEL_X + shift, PANEL_Y - PIXEL / 2, 0)
        gridPosition.setXYZ(vertex++, PIXEL_X + shift, PANEL_Y + PIXEL / 2, 0)
        gridPosition.setXYZ(vertex++, PIXEL_X - PIXEL / 2, PANEL_Y + shift, 0)
        gridPosition.setXYZ(vertex++, PIXEL_X + PIXEL / 2, PANEL_Y + shift, 0)
      }
      gridPosition.needsUpdate = true
      gridGeometry.setDrawRange(0, vertex)

      // 拡大した画素を samples × samples の区画に分け、それぞれの中心を 1 点として色を求める。
      // 点の色は、図形側なら図形の色、そうでなければ背景の色になる
      const radius = Math.min(pitch * DOT_SCALE, DOT_MAX_RADIUS)
      let sampleIndex = 0
      let insideCount = 0
      let sumRed = 0
      let sumGreen = 0
      let sumBlue = 0

      for (let row = 0; row < samples; row++) {
        for (let column = 0; column < samples; column++) {
          // 画素の中を -0.5 から 0.5 で表した、区画の中心の位置
          const x = (column + 0.5) / samples - 0.5
          const y = (row + 0.5) / samples - 0.5
          const inside = normalX * x + normalY * y <= offset
          const color = inside ? FIGURE : BACKGROUND

          sumRed += color.r
          sumGreen += color.g
          sumBlue += color.b

          if (inside) insideCount++

          matrix.makeScale(radius, radius, 1)
          matrix.setPosition(PIXEL_X + x * PIXEL, PANEL_Y + y * PIXEL, 0)
          dots.setMatrixAt(sampleIndex++, matrix)
        }
      }

      dots.count = total
      dots.instanceMatrix.needsUpdate = true

      // 点の色の平均が、元の画素の色になる
      applyColor(averageMaterial, {
        r: Math.round(sumRed / total),
        g: Math.round(sumGreen / total),
        b: Math.round(sumBlue / total)
      })

      // 同じ手順を画像の全画素に対して行い、求めた色をその画素に埋める。
      // 座標は拡大している画素の中心を原点、画素の 1 辺を 1 として数えるので、
      // 列と行の差がそのまま座標のずれになる
      for (let row = 0; row < IMAGE_ROWS; row++) {
        for (let column = 0; column < IMAGE_COLUMNS; column++) {
          let red = 0
          let green = 0
          let blue = 0

          for (let sampleRow = 0; sampleRow < samples; sampleRow++) {
            for (let sampleColumn = 0; sampleColumn < samples; sampleColumn++) {
              const x = column - TARGET_COLUMN + (sampleColumn + 0.5) / samples - 0.5
              const y = row - TARGET_ROW + (sampleRow + 0.5) / samples - 0.5
              const color = normalX * x + normalY * y <= offset ? FIGURE : BACKGROUND
              red += color.r
              green += color.g
              blue += color.b
            }
          }

          // テクスチャの行はテクスチャ座標にならって下から数える
          const at = (row * IMAGE_COLUMNS + column) * 4
          imageData[at] = Math.round(red / total)
          imageData[at + 1] = Math.round(green / total)
          imageData[at + 2] = Math.round(blue / total)
          imageData[at + 3] = 255
        }
      }
      imageTexture.needsUpdate = true

      // 図形が実際に覆っている面積の割合。点による推定がこれに近づくかを見比べられるようにする
      const overlap = clipHalfPlane(UNIT_PIXEL, normalX, normalY, offset)
      params.estimate = `${insideCount} / ${total} = ${(insideCount / total).toFixed(2)}`
      params.exact = areaOf(overlap).toFixed(2)
    },
    dispose: () => {
      imageTexture.dispose()
      const disposables = [
        imageGeometry,
        imageMaterial,
        targetFrameGeometry,
        targetFrameMaterial,
        calloutGeometry,
        calloutMaterial,
        pixelGeometry,
        backgroundMaterial,
        figureMaterial,
        gridGeometry,
        gridMaterial,
        dotGeometry,
        dotMaterial,
        averageMaterial,
        shaftGeometry,
        headGeometry,
        arrowMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      dots.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
