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
  NearestFilter,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type MoirePatternParams = {
  /** 縞の細かさ。画像の幅あたりに入る縞の本数 */
  frequency: number
  /** 縞の傾き（度） */
  angle: number
  /** 1 辺あたりの標本点の数 */
  sampleCount: number
  /** 標本化定理を満たすかどうか。scene.ts が判定して書き戻す */
  theorem: string
  /** 現れるモアレの読み取り。scene.ts が計算して書き戻す */
  moire: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: MoirePatternParams
}

/** 画像として扱う正方形の 1 辺と、左右に並べた 2 枚の間隔 */
const IMAGE_SIZE = 2
const HALF_IMAGE = IMAGE_SIZE / 2
const IMAGE_GAP = 0.45

/** 2 枚の画像の中心の x 座標 */
const REFERENCE_X = -(HALF_IMAGE + IMAGE_GAP / 2)
const SAMPLED_X = HALF_IMAGE + IMAGE_GAP / 2

/**
 * もとの縞模様を焼く格子の細かさ。
 * 標本化の格子よりずっと細かくとることで、連続的な明暗として見せる
 */
const REFERENCE_RESOLUTION = 384

/** モアレの縞の本数がこれを下回ったら、縞が消えたものとして扱う */
const VANISHED_FREQUENCY = 0.05

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

/**
 * もとの連続的な縞模様。位置 (x, y)（ともに 0〜1）での明るさ（0〜1）を返す。
 * 縞に垂直な向きへ進むほど明暗が繰り返すので、傾けた向きの成分で位相を決める
 */
const patternAt = (x: number, y: number, frequency: number, angle: number) => {
  const radians = (angle * Math.PI) / 180
  const alongStripes = x * Math.cos(radians) + y * Math.sin(radians)
  return 0.5 + 0.5 * Math.sin(2 * Math.PI * frequency * alongStripes)
}

/** 指定した細かさの格子で明るさを読み取り、1 格子 1 テクセルとして焼く */
const fillGrayscale = (data: Uint8Array, resolution: number, frequency: number, angle: number) => {
  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      // 格子 1 つ分の真ん中で明るさを読み取る
      const x = (column + 0.5) / resolution
      const y = (row + 0.5) / resolution
      const level = Math.round(patternAt(x, y, frequency, angle) * 255)
      data.set([level, level, level, 255], (row * resolution + column) * 4)
    }
  }
}

/** 標本値を 1 画素 1 テクセルに焼く。拡大しても画素どうしが混ざらないよう、補間なしで貼る */
const createSampledTexture = (sampleCount: number, frequency: number, angle: number) => {
  const data = new Uint8Array(sampleCount * sampleCount * 4)
  fillGrayscale(data, sampleCount, frequency, angle)

  const texture = new DataTexture(data, sampleCount, sampleCount)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.needsUpdate = true
  return texture
}

/**
 * 標本化で失われずに残る縞の本数。
 * 標本化周波数の整数倍ぶんを引いた（折り返した）値になり、
 * 縦横それぞれの向きで折り返しが起きる
 */
const foldedFrequency = (frequency: number, sampleCount: number) =>
  frequency - sampleCount * Math.round(frequency / sampleCount)

export const createMoirePatternScene = ({ scene, params }: SceneContext) => {
  // 左：もとの連続的な縞模様。テクセルどうしを滑らかに繋いで、明暗の切れ目を見せない
  const referenceData = new Uint8Array(REFERENCE_RESOLUTION * REFERENCE_RESOLUTION * 4)
  const referenceTexture = new DataTexture(
    referenceData,
    REFERENCE_RESOLUTION,
    REFERENCE_RESOLUTION
  )
  referenceTexture.colorSpace = SRGBColorSpace
  referenceTexture.magFilter = LinearFilter
  referenceTexture.minFilter = LinearFilter

  // 明るさをそのままの濃さで見せたいので、2 枚とも陰影の付かない材質で貼る
  const imageGeometry = new PlaneGeometry(IMAGE_SIZE, IMAGE_SIZE)
  const referenceMaterial = new MeshBasicMaterial({ map: referenceTexture, side: DoubleSide })
  const reference = new Mesh(imageGeometry, referenceMaterial)
  reference.position.x = REFERENCE_X
  scene.add(reference)

  // 右：標本化した結果
  const sampledMaterial = new MeshBasicMaterial({ side: DoubleSide })
  const sampled = new Mesh(imageGeometry, sampledMaterial)
  sampled.position.x = SAMPLED_X
  scene.add(sampled)

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
  for (const x of [REFERENCE_X, SAMPLED_X]) {
    const frame = new LineSegments(frameGeometry, frameMaterial)
    frame.position.x = x
    scene.add(frame)
  }

  const labels = [
    { text: "もとの縞模様", x: REFERENCE_X },
    { text: "標本化した結果", x: SAMPLED_X }
  ].map(({ text, x }) => {
    const label = createLabel(text, LABEL_COLOR, LABEL_HEIGHT)
    label.sprite.position.set(x, HALF_IMAGE + LABEL_OFFSET, LAYER_LABEL)
    scene.add(label.sprite)
    return label
  })

  // 縞や標本点の数が変わったときだけ焼き直す（カメラを動かしただけでは作り直さない）
  let builtFrequency = NaN
  let builtAngle = NaN
  let builtSampleCount = NaN

  return {
    update: () => {
      const { frequency, angle, sampleCount } = params

      // 標本化の格子は縦横に並ぶので、縞の細かさも縦横の成分に分けて考える。
      // どちらの成分も標本化周波数の半分に収まっていれば、標本化定理を満たす
      const radians = (angle * Math.PI) / 180
      const acrossX = frequency * Math.cos(radians)
      const acrossY = frequency * Math.sin(radians)
      const satisfied = 2 * Math.max(Math.abs(acrossX), Math.abs(acrossY)) <= sampleCount
      params.theorem = satisfied ? "満たす" : "満たさない"

      const moire = Math.hypot(
        foldedFrequency(acrossX, sampleCount),
        foldedFrequency(acrossY, sampleCount)
      )
      params.moire = satisfied
        ? "現れない（もとの縞のまま）"
        : moire < VANISHED_FREQUENCY
          ? "縞が消える"
          : `約${moire.toFixed(1)}本の太い縞`

      if (
        frequency === builtFrequency &&
        angle === builtAngle &&
        sampleCount === builtSampleCount
      ) {
        return
      }

      // もとの縞模様は、標本点の数が変わっただけなら焼き直さなくてよい
      if (frequency !== builtFrequency || angle !== builtAngle) {
        fillGrayscale(referenceData, REFERENCE_RESOLUTION, frequency, angle)
        referenceTexture.needsUpdate = true
      }

      builtFrequency = frequency
      builtAngle = angle
      builtSampleCount = sampleCount

      // 標本化。標本点の位置で明るさを読み取り、その値を画素として並べる
      sampledMaterial.map?.dispose()
      sampledMaterial.map = createSampledTexture(sampleCount, frequency, angle)
      sampledMaterial.needsUpdate = true
    },
    dispose: () => {
      sampledMaterial.map?.dispose()
      const disposables = [
        imageGeometry,
        referenceTexture,
        referenceMaterial,
        sampledMaterial,
        frameGeometry,
        frameMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
