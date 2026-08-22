import {
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** 色。各チャンネルを 0 から 255 の整数で持つ（Tweakpane のカラーピッカーが直接書き換える） */
type Rgb = { r: number; g: number; b: number }

/** Tweakpane で操作するパラメータ */
export type AlphaBlendingParams = {
  /** 寄与率（α 値）。図形が画素の面積をどれだけ覆っているか */
  alpha: number
  /** 図形の色 */
  figure: Rgb
  /** 背景の色 */
  background: Rgb
  /** 混ぜた色の表示。scene.ts が組み立てて書き戻すので、初期値は使われない */
  blended: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: AlphaBlendingParams
}

/** 画素 1 つを表す正方形の 1 辺と、置く高さ */
const SQUARE = 1.4
const SQUARE_Y = 0.34
const SQUARE_TOP = SQUARE_Y + SQUARE / 2

/** α を 0 から 1 まで動かしたときの色を並べた帯と、並べる色の数 */
const RAMP_WIDTH = 3.2
const RAMP_HEIGHT = 0.3
const RAMP_Y = -0.95
const RAMP_STEPS = 21

/**
 * 帯の中で現在の α を指す線の太さ。帯はどんな色にもなりうるので、
 * 暗い縁の上に明るい芯を重ねて、どちらの色の上でも線として見えるようにする
 */
const MARKER_WIDTH = 0.03
const MARKER_EDGE_WIDTH = 0.07

/** 軸の名前や見出しの文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.18
const SMALL_LABEL_HEIGHT = 0.16

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、枠・文字・帯の中の線を互いに見分けられる色にする
const FRAME_COLOR = "#c8ccd4"
const LABEL_COLOR = "#c9d2de"
const MARKER_CORE_COLOR = "#f5f7fa"
const MARKER_EDGE_COLOR = "#26282d"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_FIGURE = 0.01
const LAYER_EDGE = 0.02
const LAYER_MARKER_EDGE = 0.03
const LAYER_MARKER = 0.04
const LAYER_LABEL = 0.1

/** 多角形の頂点 */
type Point = [number, number]

/** 画素の中に置く図形の大きさ（画素の 1 辺に対する比）と、角の丸み（図形の 1 辺に対する比） */
const FIGURE_SIDE_RATIO = 0.72
const FIGURE_CORNER_RATIO = 0.28

/** 角の丸み 1 つを何本の線分で近似するか */
const ROUND_SEGMENTS = 12

/** 図全体を canvas の中央に寄せる位置。帯とその下のラベルの分だけ上へ寄せる */
const LAYOUT_OFFSET = new Vector3(0, 0.09, 0)

/**
 * 寄与率 α で図形の色と背景の色を混ぜる（アルファブレンディング）。
 * C = α C_fg + (1 - α) C_bg を、R・G・B のチャンネルごとに当てる
 */
const blendChannel = (figure: number, background: number, alpha: number) =>
  Math.round(alpha * figure + (1 - alpha) * background)

/**
 * 0 から 255 の色を材質に設定する。
 * 第 4 引数を省くと three は値を作業色空間（リニア）として扱うため、
 * sRGB の値であることを明示して渡す
 */
const applyColor = (material: MeshBasicMaterial, { r, g, b }: Rgb) => {
  material.color.setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
}

/**
 * 画素の中央に置く、背景にすっぽり包まれる図形の輪郭。角丸の正方形にとる。
 * α は図形の不透明度として効くので、形も大きさも α では変わらない
 */
const figureOutline = (): Point[] => {
  const side = SQUARE * FIGURE_SIDE_RATIO
  const radius = side * FIGURE_CORNER_RATIO

  // 角の丸みの中心（正方形の 4 隅から丸みの分だけ内側）を、反時計回りに並べる
  const inset = side / 2 - radius
  const centers: Point[] = [
    [inset, inset],
    [-inset, inset],
    [-inset, -inset],
    [inset, -inset]
  ]

  // 4 つの角を、90 度ずつの弧でつないで輪郭にする
  const points: Point[] = []
  centers.forEach(([cx, cy], index) => {
    for (let step = 0; step <= ROUND_SEGMENTS; step++) {
      const angle = (index * Math.PI) / 2 + (step * Math.PI) / 2 / ROUND_SEGMENTS
      points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
    }
  })

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

export const createAlphaBlendingScene = ({ scene, params }: SceneContext) => {
  const layout = new Group()
  layout.position.copy(LAYOUT_OFFSET)
  scene.add(layout)

  // 画素の地。指定した色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const squareGeometry = new PlaneGeometry(SQUARE, SQUARE)

  const baseMaterial = new MeshBasicMaterial()
  const base = new Mesh(squareGeometry, baseMaterial)
  base.position.set(0, SQUARE_Y, 0)
  layout.add(base)

  // 画素の中に置いた図形。形は動かさないので、頂点は中心から扇状に三角形へ分けて 1 度だけ組む。
  // 頂点は画素の中心を原点として持ち、置く位置は mesh 側で与える
  const outline = figureOutline()
  const figurePoints: Vector3[] = []
  outline.forEach(([x, y], index) => {
    const [nextX, nextY] = outline[(index + 1) % outline.length]
    figurePoints.push(new Vector3(0, 0, 0), new Vector3(x, y, 0), new Vector3(nextX, nextY, 0))
  })

  // α を不透明度として効かせるので、混ぜる計算は GPU のアルファブレンディングが行う
  const figureGeometry = new BufferGeometry().setFromPoints(figurePoints)
  const figureMaterial = new MeshBasicMaterial({ transparent: true })
  const figureRegion = new Mesh(figureGeometry, figureMaterial)
  figureRegion.position.set(0, SQUARE_Y, LAYER_FIGURE)
  layout.add(figureRegion)

  // α を 0 から 1 まで等間隔に刻んだときの画素の色。1 色 1 テクセルのテクスチャにして、
  // 色が混ざらないよう補間なし（NearestFilter）で貼る
  const rampData = new Uint8Array(RAMP_STEPS * 4)
  const rampTexture = new DataTexture(rampData, RAMP_STEPS, 1)
  rampTexture.colorSpace = SRGBColorSpace
  rampTexture.magFilter = NearestFilter
  rampTexture.minFilter = NearestFilter
  const rampGeometry = new PlaneGeometry(RAMP_WIDTH, RAMP_HEIGHT)
  const rampMaterial = new MeshBasicMaterial({ map: rampTexture })
  const ramp = new Mesh(rampGeometry, rampMaterial)
  ramp.position.set(0, RAMP_Y, 0)
  layout.add(ramp)

  // 画素と帯の枠。1 辺 1 の正方形として作り、置く場所に合わせて伸ばす
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
  const outlinePlacements = [
    { x: 0, y: SQUARE_Y, width: SQUARE, height: SQUARE },
    { x: 0, y: RAMP_Y, width: RAMP_WIDTH, height: RAMP_HEIGHT }
  ]
  outlinePlacements.forEach(({ x, y, width, height }) => {
    const outline = new LineLoop(outlineGeometry, outlineMaterial)
    outline.position.set(x, y, LAYER_EDGE)
    outline.scale.set(width, height, 1)
    layout.add(outline)
  })

  // 帯の中で現在の α を指す線。帯の高さいっぱいに引き、暗い縁を下に敷く
  const markerEdgeGeometry = new PlaneGeometry(MARKER_EDGE_WIDTH, RAMP_HEIGHT)
  const markerEdgeMaterial = new MeshBasicMaterial({ color: MARKER_EDGE_COLOR })
  const markerEdge = new Mesh(markerEdgeGeometry, markerEdgeMaterial)
  markerEdge.position.set(0, RAMP_Y, LAYER_MARKER_EDGE)
  layout.add(markerEdge)

  const markerGeometry = new PlaneGeometry(MARKER_WIDTH, RAMP_HEIGHT)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_CORE_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  marker.position.set(0, RAMP_Y, LAYER_MARKER)
  layout.add(marker)

  const labels = [
    { text: "不透明度 α で重ねた図形", height: LABEL_HEIGHT, x: 0, y: SQUARE_TOP + 0.22 },
    {
      text: "α を動かしたときの混ぜた色",
      height: LABEL_HEIGHT,
      x: 0,
      y: RAMP_Y + RAMP_HEIGHT / 2 + 0.22
    },
    {
      text: "α = 0（背景の色）",
      height: SMALL_LABEL_HEIGHT,
      x: -RAMP_WIDTH / 2,
      y: RAMP_Y - RAMP_HEIGHT / 2 - 0.34
    },
    {
      text: "α = 1（図形の色）",
      height: SMALL_LABEL_HEIGHT,
      x: RAMP_WIDTH / 2,
      y: RAMP_Y - RAMP_HEIGHT / 2 - 0.34
    }
  ].map(({ text, height, x, y }) => {
    const label = createLabel(text, height)
    label.sprite.position.set(x, y, LAYER_LABEL)
    layout.add(label.sprite)
    return label
  })

  return {
    update: () => {
      const { alpha, figure, background } = params

      // 地は背景の色、図形は図形の色。α は図形の不透明度として効かせる
      applyColor(baseMaterial, background)
      applyColor(figureMaterial, figure)
      figureMaterial.opacity = alpha

      // 図形の内側に現れる色。GPU が混ぜた結果と同じものを、式のとおりに計算して読み出しに出す
      const red = blendChannel(figure.r, background.r, alpha)
      const green = blendChannel(figure.g, background.g, alpha)
      const blue = blendChannel(figure.b, background.b, alpha)
      params.blended = `R ${red} / G ${green} / B ${blue}`

      // 同じ混ぜ方を、α を 0 から 1 まで刻んだすべての値について行う
      for (let step = 0; step < RAMP_STEPS; step++) {
        const rampAlpha = step / (RAMP_STEPS - 1)
        rampData[step * 4] = blendChannel(figure.r, background.r, rampAlpha)
        rampData[step * 4 + 1] = blendChannel(figure.g, background.g, rampAlpha)
        rampData[step * 4 + 2] = blendChannel(figure.b, background.b, rampAlpha)
        rampData[step * 4 + 3] = 255
      }
      rampTexture.needsUpdate = true

      // 線は帯の左端を α = 0、右端を α = 1 として動かす。
      // 線の太さの分だけ内側に寄せ、帯から食み出さないようにする
      const markerSpan = RAMP_WIDTH - MARKER_EDGE_WIDTH
      marker.position.x = -markerSpan / 2 + alpha * markerSpan
      markerEdge.position.x = marker.position.x
    },
    dispose: () => {
      rampTexture.dispose()
      const disposables = [
        squareGeometry,
        baseMaterial,
        figureGeometry,
        figureMaterial,
        rampGeometry,
        rampMaterial,
        outlineGeometry,
        outlineMaterial,
        markerEdgeGeometry,
        markerEdgeMaterial,
        markerGeometry,
        markerMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
