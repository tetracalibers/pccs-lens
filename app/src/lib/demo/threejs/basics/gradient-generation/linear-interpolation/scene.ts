import {
  CanvasTexture,
  DataTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  SRGBColorSpace
} from "three"

/** Tweakpane で操作するパラメータ */
export type LinearInterpolationParams = {
  /** 始点 A から終点 B までの割合（0〜1） */
  t: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: LinearInterpolationParams
}

/** グラデーションの帯。横幅がそのまま割合 t の 0〜1 に対応する */
const BAND_WIDTH = 2.8
const BAND_HEIGHT = 0.6
const HALF_WIDTH = BAND_WIDTH / 2
const BAND_Y = 0.2

/** 補間の結果 f(t) を指す線の太さと、帯の上下にはみ出させる長さ */
const MARKER_WIDTH = 0.022
const MARKER_OVERHANG = 0.06

/**
 * 両端の 2 色。8 ビットの成分（0〜255）で持ち、線形補間もこの値のまま行う。
 * 画素に記録される値そのものを混ぜ合わせるので、中間の色が式のとおりに見える
 */
const COLOR_A = [255, 200, 87]
const COLOR_B = [94, 200, 242]

/** グラデーションを焼くテクスチャの横の解像度 */
const GRADIENT_RESOLUTION = 512

/**
 * 帯に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_BAND = 0.01
const LAYER_MARKER = 0.02
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上でも、グラデーションの帯の上でも読める文字と線の色
const LABEL_COLOR = "#c9d2de"
const MARKER_COLOR = "#e8ecf2"

/** 図に添える文字をまとめて描く板の大きさと、その中心の高さ */
const TEXT_WIDTH = 3.4
const TEXT_HEIGHT = 1.5
const TEXT_CENTER_Y = 0.095

/** 文字の板の解像度。ワールド座標の長さ 1 に対する画素数 */
const TEXT_PIXELS_PER_UNIT = 480

/** 文字の大きさ（ワールド座標での高さ）と、帯・文字どうしの間隔 */
const LABEL_SIZE = 0.16
const LABEL_GAP = 0.09
const PERCENT_GAP = 0.05

/** 線形補間 f(t) = (1 - t)A + tB。色の成分ごとに、同じ割合で混ぜ合わせる */
const mixOf = (t: number) => COLOR_A.map((a, index) => Math.round((1 - t) * a + t * COLOR_B[index]))

/** 割合 t を、帯の上の横位置に対応させる */
const xOf = (t: number) => -HALF_WIDTH + t * BAND_WIDTH

/** 割合（0〜1）を百分率の整数にする */
const percentOf = (ratio: number) => Math.round(ratio * 100)

export const createLinearInterpolationScene = ({ scene, params }: SceneContext) => {
  const figure = new Group()
  // 図全体を canvas の中央に寄せる
  figure.position.y = -TEXT_CENTER_Y
  scene.add(figure)

  // A から B へのグラデーション。横位置に応じた t を式に代入した色を、1 行のテクスチャに焼く
  const gradientData = new Uint8Array(GRADIENT_RESOLUTION * 4)
  for (let i = 0; i < GRADIENT_RESOLUTION; i++) {
    const [r, g, b] = mixOf(i / (GRADIENT_RESOLUTION - 1))
    gradientData.set([r, g, b, 255], i * 4)
  }
  const gradientTexture = new DataTexture(gradientData, GRADIENT_RESOLUTION, 1)
  gradientTexture.colorSpace = SRGBColorSpace
  gradientTexture.magFilter = LinearFilter
  gradientTexture.minFilter = LinearFilter
  gradientTexture.needsUpdate = true

  // 混ぜ合わせた色をそのままの濃さで見せたいので、陰影の付かない材質で貼る
  const bandGeometry = new PlaneGeometry(BAND_WIDTH, BAND_HEIGHT)
  const bandMaterial = new MeshBasicMaterial({ map: gradientTexture })
  const band = new Mesh(bandGeometry, bandMaterial)
  band.position.set(0, BAND_Y, LAYER_BAND)
  figure.add(band)

  // 補間の結果 f(t) を指す線。帯のどの色が f(t) なのかを、上下にはみ出した線で示す
  const markerGeometry = new PlaneGeometry(MARKER_WIDTH, BAND_HEIGHT + MARKER_OVERHANG * 2)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  marker.position.set(0, BAND_Y, LAYER_MARKER)
  figure.add(marker)

  // 図に添える文字。位置や表示が変わるものを含むので、1 枚の canvas にまとめて描き直す
  const textCanvas = document.createElement("canvas")
  textCanvas.width = Math.round(TEXT_WIDTH * TEXT_PIXELS_PER_UNIT)
  textCanvas.height = Math.round(TEXT_HEIGHT * TEXT_PIXELS_PER_UNIT)
  const textContext = textCanvas.getContext("2d")
  const textTexture = new CanvasTexture(textCanvas)
  textTexture.colorSpace = SRGBColorSpace
  const textGeometry = new PlaneGeometry(TEXT_WIDTH, TEXT_HEIGHT)
  const textMaterial = new MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれるものが板の矩形の形に欠ける
    depthWrite: false
  })
  const textOverlay = new Mesh(textGeometry, textMaterial)
  textOverlay.position.set(0, TEXT_CENTER_Y, LAYER_LABEL)
  figure.add(textOverlay)

  /** 図の座標を、文字を描く canvas の画素の位置に直す */
  const toCanvasX = (x: number) => (x + TEXT_WIDTH / 2) * TEXT_PIXELS_PER_UNIT
  const toCanvasY = (y: number) => (TEXT_CENTER_Y + TEXT_HEIGHT / 2 - y) * TEXT_PIXELS_PER_UNIT

  const drawTexts = (t: number) => {
    if (!textContext) return

    textContext.clearRect(0, 0, textCanvas.width, textCanvas.height)
    textContext.fillStyle = LABEL_COLOR
    textContext.font = `bold ${Math.round(LABEL_SIZE * TEXT_PIXELS_PER_UNIT)}px sans-serif`

    // 帯の上の線が指しているのが補間の結果であること。線と一緒に横へ動く
    textContext.textAlign = "center"
    textContext.textBaseline = "bottom"
    const markerTop = BAND_Y + BAND_HEIGHT / 2 + MARKER_OVERHANG
    textContext.fillText("f(t)", toCanvasX(xOf(t)), toCanvasY(markerTop + LABEL_GAP))

    // 帯の両端が混ぜ合わせるもとの 2 色であることと、その色が何 % 使われているか。
    // 端の真下に置くので、左は左揃え、右は右揃えにする
    const labelY = toCanvasY(BAND_Y - BAND_HEIGHT / 2 - LABEL_GAP)
    const percentY = toCanvasY(BAND_Y - BAND_HEIGHT / 2 - LABEL_GAP - LABEL_SIZE - PERCENT_GAP)
    textContext.textBaseline = "top"

    textContext.textAlign = "left"
    textContext.fillText("A", toCanvasX(-HALF_WIDTH), labelY)
    textContext.fillText(`${percentOf(1 - t)}%`, toCanvasX(-HALF_WIDTH), percentY)

    textContext.textAlign = "right"
    textContext.fillText("B", toCanvasX(HALF_WIDTH), labelY)
    textContext.fillText(`${percentOf(t)}%`, toCanvasX(HALF_WIDTH), percentY)

    textTexture.needsUpdate = true
  }

  // t が変わったときだけ描き直す（カメラを動かしただけでは作り直さない）
  let drawnT = NaN

  return {
    update: () => {
      const { t } = params
      if (t === drawnT) return
      drawnT = t

      // 帯の上で t にあたる位置に線を立てる
      marker.position.x = xOf(t)

      drawTexts(t)
    },
    dispose: () => {
      const disposables = [
        gradientTexture,
        bandGeometry,
        bandMaterial,
        markerGeometry,
        markerMaterial,
        textTexture,
        textGeometry,
        textMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
