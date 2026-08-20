import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
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

/** 画素 1 つを表す正方形の 1 辺と、2 つ並べる間隔・高さ */
const SQUARE = 1.1
const SQUARE_GAP = 1.0
const SQUARE_X = (SQUARE + SQUARE_GAP) / 2
const SQUARE_Y = 0.34
const SQUARE_TOP = SQUARE_Y + SQUARE / 2

/** 左の画素から右の画素へ向かう矢印。全体の長さと、軸の太さ・矢じりの大きさ */
const ARROW_SPAN = 0.5
const ARROW_THICKNESS = 0.03
const ARROW_HEAD_HEIGHT = 0.18
const ARROW_HEAD_RADIUS = 0.075

/** α を 0 から 1 まで動かしたときの色を並べた帯と、並べる色の数 */
const RAMP_WIDTH = 3.2
const RAMP_HEIGHT = 0.3
const RAMP_Y = -0.95
const RAMP_STEPS = 21

/** 帯の下で現在の α を指す、三角の印の大きさ */
const MARKER_SIZE = 0.14

/** 軸の名前や見出しの文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.18
const SMALL_LABEL_HEIGHT = 0.16

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、枠・矢印・文字を互いに見分けられる色にする
const FRAME_COLOR = "#c8ccd4"
const LABEL_COLOR = "#c9d2de"
const ARROW_COLOR = "#9aa3b0"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_TRIANGLE = 0.01
const LAYER_EDGE = 0.02
const LAYER_LABEL = 0.1

/** 図全体を canvas の中央に寄せる位置。帯とその下のラベルの分だけ上へ寄せる */
const LAYOUT_OFFSET = new Vector3(0, 0.15, 0)

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

  // 図形がかかった画素と、混ぜた色で塗った画素。
  // 指定した色をそのままの濃さで見せたいので、陰影の付かない材質にする
  const squareGeometry = new PlaneGeometry(SQUARE, SQUARE)

  const baseMaterial = new MeshBasicMaterial()
  const base = new Mesh(squareGeometry, baseMaterial)
  base.position.set(-SQUARE_X, SQUARE_Y, 0)
  layout.add(base)

  // 図形の境界。45 度の直線で正方形を分けるので、残る側は直角二等辺三角形になる
  const trianglePosition = new Float32BufferAttribute(new Float32Array(3 * 3), 3)
  const triangleGeometry = new BufferGeometry().setAttribute("position", trianglePosition)
  const triangleMaterial = new MeshBasicMaterial()
  const triangle = new Mesh(triangleGeometry, triangleMaterial)
  triangle.position.z = LAYER_TRIANGLE
  layout.add(triangle)

  const blendedMaterial = new MeshBasicMaterial()
  const blended = new Mesh(squareGeometry, blendedMaterial)
  blended.position.set(SQUARE_X, SQUARE_Y, 0)
  layout.add(blended)

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
    { x: -SQUARE_X, y: SQUARE_Y, width: SQUARE, height: SQUARE },
    { x: SQUARE_X, y: SQUARE_Y, width: SQUARE, height: SQUARE },
    { x: 0, y: RAMP_Y, width: RAMP_WIDTH, height: RAMP_HEIGHT }
  ]
  outlinePlacements.forEach(({ x, y, width, height }) => {
    const outline = new LineLoop(outlineGeometry, outlineMaterial)
    outline.position.set(x, y, LAYER_EDGE)
    outline.scale.set(width, height, 1)
    layout.add(outline)
  })

  // 左の画素から右の画素へ向かう矢印。軸は細長い長方形、矢じりは円錐で描く
  const arrowMaterial = new MeshBasicMaterial({ color: ARROW_COLOR })
  const shaftGeometry = new PlaneGeometry(ARROW_SPAN - ARROW_HEAD_HEIGHT, ARROW_THICKNESS)
  const shaft = new Mesh(shaftGeometry, arrowMaterial)
  shaft.position.set(-ARROW_HEAD_HEIGHT / 2, SQUARE_Y, LAYER_EDGE)
  layout.add(shaft)

  // ConeGeometry は +y 向きに尖っているので、右を向くように回す
  const headGeometry = new ConeGeometry(ARROW_HEAD_RADIUS, ARROW_HEAD_HEIGHT, 12)
  const head = new Mesh(headGeometry, arrowMaterial)
  head.position.set((ARROW_SPAN - ARROW_HEAD_HEIGHT) / 2, SQUARE_Y, LAYER_EDGE)
  head.rotation.z = -Math.PI / 2
  layout.add(head)

  // 帯の下で現在の α を指す印。上を向いた三角にする
  const markerGeometry = new ConeGeometry(MARKER_SIZE / 2, MARKER_SIZE, 3)
  const markerMaterial = new MeshBasicMaterial({ color: FRAME_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  marker.position.set(0, RAMP_Y - RAMP_HEIGHT / 2 - MARKER_SIZE / 2 - 0.02, LAYER_EDGE)
  layout.add(marker)

  const labels = [
    { text: "図形がかかった画素", height: LABEL_HEIGHT, x: -SQUARE_X, y: SQUARE_TOP + 0.22 },
    { text: "混ぜた色で塗った画素", height: LABEL_HEIGHT, x: SQUARE_X, y: SQUARE_TOP + 0.22 },
    {
      text: "α を動かしたときの画素の色",
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

      // 図形が覆う面積の割合が α になるよう、45 度の境界で正方形を分ける。
      // α が半分以下なら図形が三角形、半分を超えたら覆われていない背景が三角形になる
      const coversMost = alpha > 0.5
      const leg = SQUARE * Math.sqrt(2 * (coversMost ? 1 - alpha : alpha))

      applyColor(baseMaterial, coversMost ? figure : background)
      applyColor(triangleMaterial, coversMost ? background : figure)

      const left = -SQUARE_X - SQUARE / 2
      const right = -SQUARE_X + SQUARE / 2
      const bottom = SQUARE_Y - SQUARE / 2
      const top = SQUARE_Y + SQUARE / 2
      if (coversMost) {
        // 覆われていない背景が、右上の角に三角形として残る
        trianglePosition.setXYZ(0, right, top, 0)
        trianglePosition.setXYZ(1, right - leg, top, 0)
        trianglePosition.setXYZ(2, right, top - leg, 0)
      } else {
        // 図形が、左下の角から三角形として覆う
        trianglePosition.setXYZ(0, left, bottom, 0)
        trianglePosition.setXYZ(1, left + leg, bottom, 0)
        trianglePosition.setXYZ(2, left, bottom + leg, 0)
      }
      trianglePosition.needsUpdate = true

      // 寄与率の分だけ図形の色を、残りだけ背景の色を混ぜた色が、この画素の最終的な色になる
      const red = blendChannel(figure.r, background.r, alpha)
      const green = blendChannel(figure.g, background.g, alpha)
      const blue = blendChannel(figure.b, background.b, alpha)
      applyColor(blendedMaterial, { r: red, g: green, b: blue })
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

      // 印は帯の左端を α = 0、右端を α = 1 として滑らかに動かす
      marker.position.x = -RAMP_WIDTH / 2 + alpha * RAMP_WIDTH
    },
    dispose: () => {
      rampTexture.dispose()
      const disposables = [
        squareGeometry,
        baseMaterial,
        triangleGeometry,
        triangleMaterial,
        blendedMaterial,
        rampGeometry,
        rampMaterial,
        outlineGeometry,
        outlineMaterial,
        shaftGeometry,
        headGeometry,
        arrowMaterial,
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
