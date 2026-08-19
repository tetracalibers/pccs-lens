import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type SamplingTheoremParams = {
  /** もとの波の空間周波数。描画域の幅あたりに入る縞の本数 */
  frequency: number
  /** 標本化周波数。描画域の幅あたりに置く標本点の数 */
  sampleCount: number
  /** 各標本値に重ねる sinc 関数を 1 本ずつ表示するか */
  showSincTerms: boolean
  /** 1 周期あたりの標本点数。scene.ts が計算して書き戻す */
  samplesPerPeriod: string
  /** 復元される波の読み取り。scene.ts が計算して書き戻す */
  reconstruction: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: SamplingTheoremParams
}

/** グラフの描画域。位置の 0〜1 が PLOT_WIDTH、明るさのふれの -1〜1 が ±WAVE_HEIGHT にあたる */
const PLOT_WIDTH = 5.2
const WAVE_HEIGHT = 1

/** もとの波と復元された波を折れ線で近似する分割数。細かい縞でも角が立たない数をとる */
const CURVE_SEGMENTS = 720

/** 標本点の数の上限。標本点と垂線の頂点をこの数に合わせて先に確保しておく */
const MAX_SAMPLE_COUNT = 48

/** sinc 関数 1 本を折れ線で近似する分割数 */
const SINC_SEGMENTS = 180

/**
 * 復元の足し合わせに含める、描画域の外の標本点の数。
 * sinc 関数は左右に無限に伸びるので、描画域の中の標本点だけで足し合わせると、
 * 打ち切った影響が両端に波打って現れてしまう
 */
const SINC_TAIL = 64

/** 標本点を示す球の半径 */
const DOT_RADIUS = 0.045

/** 軸を描画域より少し伸ばす長さと、明・暗の目盛りの長さ */
const AXIS_OVERSHOOT = 0.2
const TICK_LENGTH = 0.08

/** 復元された波の破線の刻み。もとの波と重なったとき、下のもとの波が透けて見える長さにする */
const DASH_SIZE = 0.08
const GAP_SIZE = 0.06

/** 標本点から横軸へ下ろす垂線の薄さ */
const STEM_OPACITY = 0.55

/** sinc 関数 1 本ずつの薄さ。重ねて表示しても、もとの波と復元された波が埋もれない濃さにする */
const SINC_OPACITY = 0.28

/** 復元される波の本数がこれを下回ったら、縞が消えたものとして扱う */
const VANISHED_FREQUENCY = 0.05

/** 凡例を並べる高さと、その横位置 */
const LEGEND_Y = WAVE_HEIGHT + 0.44
const LEGEND_X = [0.62, 2.2, 4]

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24
const TICK_LABEL_HEIGHT = 0.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_SINC = 0
const LAYER_AXIS = 0.01
const LAYER_SOURCE = 0.02
const LAYER_RECONSTRUCTION = 0.03
const LAYER_STEM = 0.04
const LAYER_DOT = 0.05
const LAYER_LABEL = 0.12

// 背景（暗めのグレー）の上で、3 つの要素を互いに見分けられる色にする。
// 標本点の色は、そこに重ねる sinc 関数と垂線にも使う
const SOURCE_COLOR = "#5ec8f2"
const SAMPLE_COLOR = "#ffc857"
const RECONSTRUCTION_COLOR = "#f2766a"
const AXIS_COLOR = "#9aa3b0"
const TICK_LABEL_COLOR = "#c9d2de"

/** グラフ全体を canvas の中央に寄せる位置 */
const GRAPH_OFFSET = new Vector3(-PLOT_WIDTH / 2, -0.18, 0)

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

/** もとの連続的な波。位置 u（0〜1）での明るさのふれ（-1〜1）を返す */
const waveAt = (u: number, frequency: number) => Math.sin(2 * Math.PI * frequency * u)

/** k 番目の標本点の位置。画素 1 つ分の真ん中で明るさを読み取るのと同じ取り方 */
const samplePosition = (k: number, sampleCount: number) => (k + 0.5) / sampleCount

/** sinc 関数。sin(πt) / πt の t = 0 での値は 1 とする */
const sinc = (t: number) => (t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t))

/**
 * 標本化定理を満たさないときに現れるエイリアスの本数。
 * もとの縞の本数から標本化周波数の整数倍ぶんを引いた（折り返した）位置に現れる
 */
const aliasFrequencyOf = (frequency: number, sampleCount: number) =>
  Math.abs(frequency - sampleCount * Math.round(frequency / sampleCount))

export const createSamplingTheoremScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 明るさの中間を通る横軸（位置）と、明るさを測る縦軸。縦軸には明・暗の目盛りを付ける
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(PLOT_WIDTH + AXIS_OVERSHOOT, 0, LAYER_AXIS),
    new Vector3(0, -WAVE_HEIGHT - AXIS_OVERSHOOT, LAYER_AXIS),
    new Vector3(0, WAVE_HEIGHT + AXIS_OVERSHOOT, LAYER_AXIS),
    new Vector3(-TICK_LENGTH, WAVE_HEIGHT, LAYER_AXIS),
    new Vector3(0, WAVE_HEIGHT, LAYER_AXIS),
    new Vector3(-TICK_LENGTH, -WAVE_HEIGHT, LAYER_AXIS),
    new Vector3(0, -WAVE_HEIGHT, LAYER_AXIS)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // もとの連続的な波。空間周波数が変わるたびに引き直すので、頂点は分割数のぶん先に確保しておく
  const sourcePosition = new Float32BufferAttribute(new Float32Array((CURVE_SEGMENTS + 1) * 3), 3)
  const sourceGeometry = new BufferGeometry().setAttribute("position", sourcePosition)
  const sourceMaterial = new LineBasicMaterial({ color: SOURCE_COLOR })
  graph.add(new Line(sourceGeometry, sourceMaterial))

  // 標本値から復元された波。もとの波と重なったときに下が透けるよう、破線で描く
  const reconstructionPosition = new Float32BufferAttribute(
    new Float32Array((CURVE_SEGMENTS + 1) * 3),
    3
  )
  const reconstructionGeometry = new BufferGeometry().setAttribute(
    "position",
    reconstructionPosition
  )
  const reconstructionMaterial = new LineDashedMaterial({
    color: RECONSTRUCTION_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const reconstructionLine = new Line(reconstructionGeometry, reconstructionMaterial)
  graph.add(reconstructionLine)

  // 標本点から横軸へ下ろした垂線。どの位置で明るさを読み取ったかを示す
  const stemPosition = new Float32BufferAttribute(new Float32Array(MAX_SAMPLE_COUNT * 2 * 3), 3)
  const stemGeometry = new BufferGeometry().setAttribute("position", stemPosition)
  const stemMaterial = new LineBasicMaterial({
    color: SAMPLE_COLOR,
    transparent: true,
    opacity: STEM_OPACITY
  })
  const stems = new LineSegments(stemGeometry, stemMaterial)
  graph.add(stems)

  // 標本点。数が変わるので、上限のぶんだけ用意して表示する数を切り替える
  const dotGeometry = new SphereGeometry(DOT_RADIUS, 12, 8)
  const dotMaterial = new MeshBasicMaterial({ color: SAMPLE_COLOR })
  const dots = new InstancedMesh(dotGeometry, dotMaterial, MAX_SAMPLE_COUNT)
  graph.add(dots)

  // 各標本値に重ねる sinc 関数。足し合わせる前の 1 本ずつを薄く描く
  const sincMaterial = new LineBasicMaterial({
    color: SAMPLE_COLOR,
    transparent: true,
    opacity: SINC_OPACITY
  })
  const sincTerms = Array.from({ length: MAX_SAMPLE_COUNT }, () => {
    const position = new Float32BufferAttribute(new Float32Array((SINC_SEGMENTS + 1) * 3), 3)
    const geometry = new BufferGeometry().setAttribute("position", position)
    const line = new Line(geometry, sincMaterial)
    line.visible = false
    graph.add(line)
    return { position, geometry, line }
  })

  const labels = [
    { text: "明", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.26, y: WAVE_HEIGHT },
    { text: "暗", color: TICK_LABEL_COLOR, height: TICK_LABEL_HEIGHT, x: -0.26, y: -WAVE_HEIGHT },
    { text: "位置", color: AXIS_COLOR, height: LABEL_HEIGHT, x: PLOT_WIDTH + 0.32, y: 0 },
    { text: "もとの波", color: SOURCE_COLOR, height: LABEL_HEIGHT, x: LEGEND_X[0], y: LEGEND_Y },
    { text: "標本点", color: SAMPLE_COLOR, height: LABEL_HEIGHT, x: LEGEND_X[1], y: LEGEND_Y },
    {
      text: "復元された波",
      color: RECONSTRUCTION_COLOR,
      height: LABEL_HEIGHT,
      x: LEGEND_X[2],
      y: LEGEND_Y
    }
  ].map(({ text, color, height, x, y }) => {
    const label = createLabel(text, color, height)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  const matrix = new Matrix4()

  /** 復元に使う標本値。描画域の外の標本点も含めて、先に読み取っておく */
  const sampledValues: number[] = []

  // 波の形が変わったときだけ引き直す（カメラを動かしただけでは作り直さない）
  let builtFrequency = NaN
  let builtSampleCount = NaN
  let builtShowSincTerms = false

  return {
    update: () => {
      const { frequency, sampleCount, showSincTerms } = params

      // 1 周期あたり 2 点を確保できているかが、標本化定理を満たすかどうかの境目になる
      params.samplesPerPeriod = `${(sampleCount / frequency).toFixed(2)} 点`
      const alias = aliasFrequencyOf(frequency, sampleCount)
      params.reconstruction =
        sampleCount >= 2 * frequency
          ? "もとの波と一致"
          : alias < VANISHED_FREQUENCY
            ? "縞が消える"
            : `約${alias.toFixed(1)}本のエイリアス`

      if (
        frequency === builtFrequency &&
        sampleCount === builtSampleCount &&
        showSincTerms === builtShowSincTerms
      ) {
        return
      }
      builtFrequency = frequency
      builtSampleCount = sampleCount
      builtShowSincTerms = showSincTerms

      // もとの連続的な波
      for (let step = 0; step <= CURVE_SEGMENTS; step++) {
        const u = step / CURVE_SEGMENTS
        sourcePosition.setXYZ(
          step,
          u * PLOT_WIDTH,
          waveAt(u, frequency) * WAVE_HEIGHT,
          LAYER_SOURCE
        )
      }
      sourcePosition.needsUpdate = true

      // 標本化。標本点の位置で、もとの波の明るさを読み取る
      const interval = 1 / sampleCount
      sampledValues.length = 0
      for (let k = -SINC_TAIL; k < sampleCount + SINC_TAIL; k++) {
        sampledValues.push(waveAt(samplePosition(k, sampleCount), frequency))
      }

      // 復元。各標本値に sinc 関数を重ね合わせる
      for (let step = 0; step <= CURVE_SEGMENTS; step++) {
        const u = step / CURVE_SEGMENTS
        let level = 0
        for (let k = -SINC_TAIL; k < sampleCount + SINC_TAIL; k++) {
          level +=
            sampledValues[k + SINC_TAIL] * sinc((u - samplePosition(k, sampleCount)) / interval)
        }
        reconstructionPosition.setXYZ(
          step,
          u * PLOT_WIDTH,
          level * WAVE_HEIGHT,
          LAYER_RECONSTRUCTION
        )
      }
      reconstructionPosition.needsUpdate = true
      // 破線の刻みは頂点間の距離から決まるので、頂点を動かしたら測り直す
      reconstructionLine.computeLineDistances()

      // 標本点とその垂線。描画域の中にある標本点だけを示す
      for (let k = 0; k < sampleCount; k++) {
        const x = samplePosition(k, sampleCount) * PLOT_WIDTH
        const y = sampledValues[k + SINC_TAIL] * WAVE_HEIGHT
        stemPosition.setXYZ(k * 2, x, 0, LAYER_STEM)
        stemPosition.setXYZ(k * 2 + 1, x, y, LAYER_STEM)
        dots.setMatrixAt(k, matrix.setPosition(x, y, LAYER_DOT))
      }
      stemPosition.needsUpdate = true
      stemGeometry.setDrawRange(0, sampleCount * 2)
      dots.count = sampleCount
      dots.instanceMatrix.needsUpdate = true

      // 足し合わせる前の sinc 関数。標本値の大きさだけ縦に伸縮し、標本点の位置に山がくる
      sincTerms.forEach(({ position, line }, k) => {
        line.visible = showSincTerms && k < sampleCount
        if (!line.visible) return

        const center = samplePosition(k, sampleCount)
        const value = sampledValues[k + SINC_TAIL]
        for (let step = 0; step <= SINC_SEGMENTS; step++) {
          const u = step / SINC_SEGMENTS
          const level = value * sinc((u - center) / interval)
          position.setXYZ(step, u * PLOT_WIDTH, level * WAVE_HEIGHT, LAYER_SINC)
        }
        position.needsUpdate = true
      })
    },
    dispose: () => {
      const disposables = [
        axisGeometry,
        axisMaterial,
        sourceGeometry,
        sourceMaterial,
        reconstructionGeometry,
        reconstructionMaterial,
        stemGeometry,
        stemMaterial,
        dotGeometry,
        dotMaterial,
        sincMaterial,
        ...sincTerms.map(({ geometry }) => geometry),
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
      dots.dispose()
    }
  }
}
