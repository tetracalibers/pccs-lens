import {
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
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
export type FalseContourParams = {
  /** 画素値を表すビット数 */
  bitCount: number
  /** 量子化レベル数。scene.ts が計算して書き戻す */
  levelCount: string
  /** 段の境目の数。scene.ts が計算して書き戻す */
  contourCount: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: FalseContourParams
}

/** 画像として扱う正方形の 1 辺と、左右に並べた 2 枚の間隔 */
const IMAGE_SIZE = 2
const HALF_IMAGE = IMAGE_SIZE / 2
const IMAGE_GAP = 0.45

/** 2 枚の画像の中心の x 座標 */
const REFERENCE_X = -(HALF_IMAGE + IMAGE_GAP / 2)
const QUANTIZED_X = HALF_IMAGE + IMAGE_GAP / 2

/**
 * 明るさを焼く格子の細かさ。
 * 標本化ではなく量子化を見せる図なので、格子は目に見えない細かさにとる
 */
const RESOLUTION = 512

/**
 * グラデーションの中心。画像の右上のわずかに外側に置き、そこから外へ向かって暗くなるようにする。
 * 明暗の変化が緩やかなので、量子化を粗くすると段の境目が等高線のように現れる
 */
const GRADIENT_CENTER = 1.12

/** 中心からの距離の最小・最大。明るさが 0〜1 をちょうど使い切るように正規化する */
const MIN_DISTANCE = Math.SQRT2 * (GRADIENT_CENTER - 1)
const MAX_DISTANCE = Math.SQRT2 * GRADIENT_CENTER

/** ラベルの高さ（ワールド座標での大きさ）と、画像の上に逃がす距離 */
const LABEL_HEIGHT = 0.24
const LABEL_OFFSET = 0.28

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 画像の外周と、その少し手前に置くラベルの z */
const LAYER_FRAME = 0.002
const LAYER_LABEL = 0.01

const FRAME_COLOR = "#c8ccd4"
const LABEL_COLOR = "#c9d2de"

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

/** もとの連続的なグラデーション。位置 (x, y)（ともに 0〜1）での明るさ（0〜1）を返す */
const brightnessAt = (x: number, y: number) => {
  const distance = Math.hypot(x - GRADIENT_CENTER, y - GRADIENT_CENTER)
  return 1 - (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)
}

/** 明るさ（0〜1）を、一番近い段階に丸める。用意する段階の数が量子化レベル数 */
const quantize = (brightness: number, levelCount: number) =>
  Math.round(brightness * (levelCount - 1)) / (levelCount - 1)

/**
 * 明るさを 1 テクセルずつ焼く。
 * `levelOf` に丸め方を渡すことで、量子化する前とした後を同じ手順で作る
 */
const fillGrayscale = (data: Uint8Array, levelOf: (brightness: number) => number) => {
  for (let row = 0; row < RESOLUTION; row++) {
    for (let column = 0; column < RESOLUTION; column++) {
      // テクセル 1 つ分の真ん中で明るさを読み取る
      const x = (column + 0.5) / RESOLUTION
      const y = (row + 0.5) / RESOLUTION
      const level = Math.round(levelOf(brightnessAt(x, y)) * 255)
      data.set([level, level, level, 255], (row * RESOLUTION + column) * 4)
    }
  }
}

/** 明るさをそのままの濃さで貼るためのテクスチャ。テクセルどうしは滑らかに繋ぐ */
const createGrayscaleTexture = (data: Uint8Array) => {
  const texture = new DataTexture(data, RESOLUTION, RESOLUTION)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export const createFalseContourScene = ({ scene, params }: SceneContext) => {
  // 左：もとのグラデーション。ビット数を変えても焼き直さないので、ここで一度だけ作る
  const referenceData = new Uint8Array(RESOLUTION * RESOLUTION * 4)
  fillGrayscale(referenceData, (brightness) => brightness)
  const referenceTexture = createGrayscaleTexture(referenceData)

  // 右：量子化した結果。ビット数が変わるたびに焼き直す
  const quantizedData = new Uint8Array(RESOLUTION * RESOLUTION * 4)
  const quantizedTexture = createGrayscaleTexture(quantizedData)

  // 明るさをそのままの濃さで見せたいので、2 枚とも陰影の付かない材質で貼る
  const imageGeometry = new PlaneGeometry(IMAGE_SIZE, IMAGE_SIZE)
  const referenceMaterial = new MeshBasicMaterial({ map: referenceTexture, side: DoubleSide })
  const reference = new Mesh(imageGeometry, referenceMaterial)
  reference.position.x = REFERENCE_X
  scene.add(reference)

  const quantizedMaterial = new MeshBasicMaterial({ map: quantizedTexture, side: DoubleSide })
  const quantized = new Mesh(imageGeometry, quantizedMaterial)
  quantized.position.x = QUANTIZED_X
  scene.add(quantized)

  // 画像の外周。背景と明るさが近い部分でも、画像の範囲が分かるようにする
  const framePoints = [
    new Vector3(-HALF_IMAGE, -HALF_IMAGE, LAYER_FRAME),
    new Vector3(HALF_IMAGE, -HALF_IMAGE, LAYER_FRAME),
    new Vector3(HALF_IMAGE, -HALF_IMAGE, LAYER_FRAME),
    new Vector3(HALF_IMAGE, HALF_IMAGE, LAYER_FRAME),
    new Vector3(HALF_IMAGE, HALF_IMAGE, LAYER_FRAME),
    new Vector3(-HALF_IMAGE, HALF_IMAGE, LAYER_FRAME),
    new Vector3(-HALF_IMAGE, HALF_IMAGE, LAYER_FRAME),
    new Vector3(-HALF_IMAGE, -HALF_IMAGE, LAYER_FRAME)
  ]
  const frameGeometry = new BufferGeometry().setFromPoints(framePoints)
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  for (const x of [REFERENCE_X, QUANTIZED_X]) {
    const frame = new LineSegments(frameGeometry, frameMaterial)
    frame.position.x = x
    scene.add(frame)
  }

  const labels = [
    { text: "もとのグラデーション", x: REFERENCE_X },
    { text: "量子化した結果", x: QUANTIZED_X }
  ].map(({ text, x }) => {
    const label = createLabel(text, LABEL_COLOR, LABEL_HEIGHT)
    label.sprite.position.set(x, HALF_IMAGE + LABEL_OFFSET, LAYER_LABEL)
    scene.add(label.sprite)
    return label
  })

  // ビット数が変わったときだけ焼き直す（カメラを動かしただけでは作り直さない）
  let builtBitCount = NaN

  return {
    update: () => {
      const { bitCount } = params

      // ビットを 1 つ増やす度に、表せる段階は 2 倍になる
      const levelCount = 2 ** bitCount
      params.levelCount = `${levelCount}段階`
      // 明るさは 0 から 1 まで一様に変わるので、段と段の境目は段階の数より 1 つ少ない
      params.contourCount = `${levelCount - 1}本`

      if (bitCount === builtBitCount) return
      builtBitCount = bitCount

      fillGrayscale(quantizedData, (brightness) => quantize(brightness, levelCount))
      quantizedTexture.needsUpdate = true
    },
    dispose: () => {
      const disposables = [
        imageGeometry,
        referenceTexture,
        referenceMaterial,
        quantizedTexture,
        quantizedMaterial,
        frameGeometry,
        frameMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
