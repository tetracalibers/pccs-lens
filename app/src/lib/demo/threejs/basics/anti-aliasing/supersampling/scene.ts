import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
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

/** 拡大して見せる画素 1 つの 1 辺と、2 つ並べる間隔・高さ */
const PIXEL = 1.5
const PIXEL_GAP = 0.8
const PIXEL_X = (PIXEL + PIXEL_GAP) / 2
const PIXEL_Y = -0.15
const PIXEL_TOP = PIXEL_Y + PIXEL / 2

/** 1 辺あたりのサンプリング点の数の上限。点と区画の境目をこの数に合わせて先に確保しておく */
const MAX_SAMPLES_PER_SIDE = 6
const MAX_SAMPLES = MAX_SAMPLES_PER_SIDE * MAX_SAMPLES_PER_SIDE

/** サンプリング点の大きさ。区画の大きさに比例させ、点が大きくなりすぎないよう上限を設ける */
const DOT_SCALE = 0.22
const DOT_MAX_RADIUS = 0.075
/** 点の下に敷く縁を、点の半径の何倍にするか */
const RING_RATIO = 1.5

/** 左の画素から右の画素へ向かう矢印。全体の長さと、軸の太さ・矢じりの大きさ */
const ARROW_SPAN = 0.5
const ARROW_THICKNESS = 0.03
const ARROW_HEAD_HEIGHT = 0.18
const ARROW_HEAD_RADIUS = 0.075

/** 見出しの文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.18

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 図形の色と背景の色。サンプリング点は、落ちた位置にあるこのどちらかの色を取る */
const FIGURE: Rgb = { r: 255, g: 200, b: 87 }
const BACKGROUND: Rgb = { r: 61, g: 111, b: 168 }

// 背景（暗めのグレー）の上で、区画の境目・枠・点の縁・矢印を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const ARROW_COLOR = "#9aa3b0"
const LABEL_COLOR = "#c9d2de"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_FIGURE = 0.01
const LAYER_GRID = 0.02
const LAYER_RING = 0.03
const LAYER_DOT = 0.04
const LAYER_EDGE = 0.05
const LAYER_LABEL = 0.1

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

  // 左の画素の地。図形が覆っていない部分は背景の色になる。
  // 指定した色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const pixelGeometry = new PlaneGeometry(PIXEL, PIXEL)
  const backgroundMaterial = new MeshBasicMaterial()
  applyColor(backgroundMaterial, BACKGROUND)
  const backgroundPixel = new Mesh(pixelGeometry, backgroundMaterial)
  backgroundPixel.position.set(-PIXEL_X, PIXEL_Y, 0)
  scene.add(backgroundPixel)

  // 画素にかかった図形。画素と同じ大きさの板を輪郭の直線でクリッピングし、図形側だけを残す。
  // クリッピング面はワールド座標で効くので、板の位置に合わせて update で置き直す
  const figurePlane = new Plane(new Vector3(-1, 0, 0), 0)
  const figureMaterial = new MeshBasicMaterial({ clippingPlanes: [figurePlane] })
  applyColor(figureMaterial, FIGURE)
  const figurePixel = new Mesh(pixelGeometry, figureMaterial)
  figurePixel.position.set(-PIXEL_X, PIXEL_Y, LAYER_FIGURE)
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

  // サンプリング点。図形側に落ちた点と背景側に落ちた点を、取った色の材質で描き分ける。
  // どちらの色の上でも点の位置が分かるよう、少し大きい円を縁として下に敷く
  const dotGeometry = new CircleGeometry(1, 16)
  const ringMaterial = new MeshBasicMaterial({ color: FRAME_COLOR })
  const rings = new InstancedMesh(dotGeometry, ringMaterial, MAX_SAMPLES)
  rings.frustumCulled = false
  rings.position.z = LAYER_RING
  scene.add(rings)

  // 点は図形の板と同じ色だが、クリッピングを受けないよう材質を分けて持つ
  const figureDotMaterial = new MeshBasicMaterial()
  applyColor(figureDotMaterial, FIGURE)
  const figureDots = new InstancedMesh(dotGeometry, figureDotMaterial, MAX_SAMPLES)
  figureDots.frustumCulled = false
  figureDots.position.z = LAYER_DOT
  scene.add(figureDots)

  const backgroundDots = new InstancedMesh(dotGeometry, backgroundMaterial, MAX_SAMPLES)
  backgroundDots.frustumCulled = false
  backgroundDots.position.z = LAYER_DOT
  scene.add(backgroundDots)

  // 右の画素。サンプリング点の色を平均した色で塗る
  const averageMaterial = new MeshBasicMaterial()
  const averagePixel = new Mesh(pixelGeometry, averageMaterial)
  averagePixel.position.set(PIXEL_X, PIXEL_Y, 0)
  scene.add(averagePixel)

  // 画素の枠。1 辺 1 の正方形として作り、置く場所に合わせて伸ばす
  const outlineGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      // prettier-ignore
      [
        -0.5, -0.5, 0,
        0.5, -0.5, 0,
        0.5, 0.5, 0,
        -0.5, 0.5, 0
      ],
      3
    )
  )
  const outlineMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  const outlinePlacements = [-PIXEL_X, PIXEL_X]
  outlinePlacements.forEach((x) => {
    const outline = new LineLoop(outlineGeometry, outlineMaterial)
    outline.position.set(x, PIXEL_Y, LAYER_EDGE)
    outline.scale.set(PIXEL, PIXEL, 1)
    scene.add(outline)
  })

  // 左の画素から右の画素へ向かう矢印。軸は細長い長方形、矢じりは円錐で描く
  const arrowMaterial = new MeshBasicMaterial({ color: ARROW_COLOR })
  const shaftGeometry = new PlaneGeometry(ARROW_SPAN - ARROW_HEAD_HEIGHT, ARROW_THICKNESS)
  const shaft = new Mesh(shaftGeometry, arrowMaterial)
  shaft.position.set(-ARROW_HEAD_HEIGHT / 2, PIXEL_Y, LAYER_EDGE)
  scene.add(shaft)

  // ConeGeometry は +y 向きに尖っているので、右を向くように回す
  const headGeometry = new ConeGeometry(ARROW_HEAD_RADIUS, ARROW_HEAD_HEIGHT, 12)
  const head = new Mesh(headGeometry, arrowMaterial)
  head.position.set((ARROW_SPAN - ARROW_HEAD_HEIGHT) / 2, PIXEL_Y, LAYER_EDGE)
  head.rotation.z = -Math.PI / 2
  scene.add(head)

  const labels = [
    { text: "1画素とサンプリング点", x: -PIXEL_X, y: PIXEL_TOP + 0.22 },
    { text: "平均した色で塗った画素", x: PIXEL_X, y: PIXEL_TOP + 0.22 }
  ].map(({ text, x, y }) => {
    const label = createLabel(text, LABEL_HEIGHT)
    label.sprite.position.set(x, y, LAYER_LABEL)
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
      figurePlane.constant = offset * PIXEL + normalX * -PIXEL_X + normalY * PIXEL_Y

      // 区画の境目。画素の 1 辺を点の数で等分した位置に引く
      const pitch = PIXEL / samples
      let vertex = 0
      for (let index = 0; index <= samples; index++) {
        const shift = -PIXEL / 2 + index * pitch
        gridPosition.setXYZ(vertex++, -PIXEL_X + shift, PIXEL_Y - PIXEL / 2, 0)
        gridPosition.setXYZ(vertex++, -PIXEL_X + shift, PIXEL_Y + PIXEL / 2, 0)
        gridPosition.setXYZ(vertex++, -PIXEL_X - PIXEL / 2, PIXEL_Y + shift, 0)
        gridPosition.setXYZ(vertex++, -PIXEL_X + PIXEL / 2, PIXEL_Y + shift, 0)
      }
      gridPosition.needsUpdate = true
      gridGeometry.setDrawRange(0, vertex)

      // 画素を samples × samples の区画に分け、それぞれの中心を 1 点として色を求める。
      // 点の色は、図形側なら図形の色、そうでなければ背景の色になる
      const radius = Math.min(pitch * DOT_SCALE, DOT_MAX_RADIUS)
      let sampleIndex = 0
      let insideCount = 0
      let outsideCount = 0
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

          const dotX = -PIXEL_X + x * PIXEL
          const dotY = PIXEL_Y + y * PIXEL

          matrix.makeScale(radius, radius, 1)
          matrix.setPosition(dotX, dotY, 0)
          if (inside) figureDots.setMatrixAt(insideCount++, matrix)
          else backgroundDots.setMatrixAt(outsideCount++, matrix)

          matrix.makeScale(radius * RING_RATIO, radius * RING_RATIO, 1)
          matrix.setPosition(dotX, dotY, 0)
          rings.setMatrixAt(sampleIndex++, matrix)
        }
      }

      figureDots.count = insideCount
      figureDots.instanceMatrix.needsUpdate = true
      backgroundDots.count = outsideCount
      backgroundDots.instanceMatrix.needsUpdate = true
      rings.count = total
      rings.instanceMatrix.needsUpdate = true

      // 点の色の平均が、元の画素の色になる
      applyColor(averageMaterial, {
        r: Math.round(sumRed / total),
        g: Math.round(sumGreen / total),
        b: Math.round(sumBlue / total)
      })

      // 図形が実際に覆っている面積の割合。点による推定がこれに近づくかを見比べられるようにする
      const overlap = clipHalfPlane(UNIT_PIXEL, normalX, normalY, offset)
      params.estimate = `${insideCount} / ${total} = ${(insideCount / total).toFixed(2)}`
      params.exact = areaOf(overlap).toFixed(2)
    },
    dispose: () => {
      const disposables = [
        pixelGeometry,
        backgroundMaterial,
        figureMaterial,
        gridGeometry,
        gridMaterial,
        dotGeometry,
        ringMaterial,
        figureDotMaterial,
        averageMaterial,
        outlineGeometry,
        outlineMaterial,
        shaftGeometry,
        headGeometry,
        arrowMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      rings.dispose()
      figureDots.dispose()
      backgroundDots.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
