import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Scene,
  SRGBColorSpace
} from "three"

/** Tweakpane で操作するパラメータ */
export type BrightnessTerrainParams = {
  /** 1 辺あたりの標本点の数。画像をいくつのマスに区切って読み取るか */
  sampleCount: number
  /** 読み取った明るさを段階の値に丸めるかどうか */
  quantize: boolean
  /** 量子化レベル数。明るさを何段階で表すか */
  levelCount: number
  /** 標本化する前の連続的な明るさを、右の図に重ねて表示するか */
  showSurface: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: BrightnessTerrainParams
}

/** 画像として扱う正方形の 1 辺。原点を中心に xz 平面へ広げる */
const IMAGE_SIZE = 2
const HALF_IMAGE = IMAGE_SIZE / 2

/** 左のアナログ画像と、右のデジタル化した図の間隔 */
const GAP = 0.7

/** 2 つの図をそれぞれ左右にずらす量 */
const OFFSET_X = (IMAGE_SIZE + GAP) / 2

/** 左に並べるアナログ画像の細かさ。標本化の格子よりずっと細かくとり、連続的な濃淡に見せる */
const PICTURE_RESOLUTION = 256

/** 明るさ 1 のときに持ち上げる高さ */
const HEIGHT_SCALE = 1.1

/** 明るさ 0 の画素にも与える厚み。いちばん暗い画素も板として見えるようにする */
const BASE_HEIGHT = 0.05

/** 画素が 1 マスを占める割合。1 より小さくして、隣の画素との境目を見せる */
const PIXEL_FILL = 0.88

/** 連続的な明るさを描く曲面の分割数。標本点の格子よりずっと細かくとる */
const SURFACE_SEGMENTS = 96

/** 1 辺あたりの標本点の数の上限。この数だけ画素をあらかじめ作っておく */
const MAX_SAMPLE_COUNT = 32

// 画素はグレースケールで塗るので、標本化する前の連続的な明るさは混ざらない暖色にする
const SURFACE_COLOR = "#ffc857"
const FRAME_COLOR = "#5a6472"

/**
 * 光の強さ。Lambert の反射では放射照度を π で割った値が明るさになるので、
 * 上を向いた面に届く放射照度が π になるようにとる。
 * こうすると画素の上面が、その画素の値そのままの灰色で見える
 */
const AMBIENT_INTENSITY = Math.PI * 0.7
const KEY_LIGHT_INTENSITY = Math.PI * 0.35

/** 平行光の位置。原点からの距離が 7、真上との内積が 6/7 になるようにとる */
const KEY_LIGHT_POSITION: [number, number, number] = [2, 6, 3]

/**
 * アナログ画像に見立てた、連続的な明るさの分布。
 * xz 平面上のどの点をとっても、0（暗）から 1（明）までの値が切れ目なく定まる
 */
const brightnessAt = (x: number, z: number) => {
  const gradient = 0.5 + 0.24 * Math.sin(1.7 * x - 1.2 * z + 0.4)
  const highlight = 0.26 * Math.exp(-((x - 0.42) ** 2 + (z + 0.38) ** 2) / 0.12)
  const shadow = 0.24 * Math.exp(-((x + 0.5) ** 2 + (z - 0.45) ** 2) / 0.18)
  return Math.min(1, Math.max(0, gradient + highlight - shadow))
}

/** 明るさ（0〜1）を高さに変換する。曲面と画素で同じ対応を使う */
const heightOf = (brightness: number) => BASE_HEIGHT + brightness * HEIGHT_SCALE

export const createBrightnessTerrainScene = ({ scene, params }: SceneContext) => {
  // 環境光と真上寄りの平行光。画素の側面と曲面の傾きに陰影を付けて、立体として読めるようにする
  const keyLight = new DirectionalLight("#ffffff", KEY_LIGHT_INTENSITY)
  keyLight.position.set(...KEY_LIGHT_POSITION)
  scene.add(new AmbientLight("#ffffff", AMBIENT_INTENSITY), keyLight)

  // 左：もとのアナログ画像。連続的な明るさを、そのまま灰色の濃淡として 1 枚の絵に焼く。
  // 上下は、テクスチャの行が増える向きと z 軸の向きが逆になることに合わせる
  const pictureData = new Uint8Array(PICTURE_RESOLUTION * PICTURE_RESOLUTION * 4)
  for (let row = 0; row < PICTURE_RESOLUTION; row++) {
    for (let column = 0; column < PICTURE_RESOLUTION; column++) {
      const x = -HALF_IMAGE + (IMAGE_SIZE * (column + 0.5)) / PICTURE_RESOLUTION
      const z = HALF_IMAGE - (IMAGE_SIZE * (row + 0.5)) / PICTURE_RESOLUTION
      const level = Math.round(brightnessAt(x, z) * 255)
      const offset = (row * PICTURE_RESOLUTION + column) * 4
      pictureData.set([level, level, level, 255], offset)
    }
  }
  const pictureTexture = new DataTexture(pictureData, PICTURE_RESOLUTION, PICTURE_RESOLUTION)
  pictureTexture.colorSpace = SRGBColorSpace
  pictureTexture.magFilter = LinearFilter
  pictureTexture.minFilter = LinearFilter
  pictureTexture.needsUpdate = true

  // 明るさをそのままの濃さで見せたいので、陰影の付かない材質で貼る
  const pictureGeometry = new PlaneGeometry(IMAGE_SIZE, IMAGE_SIZE)
  pictureGeometry.rotateX(-Math.PI / 2)
  const pictureMaterial = new MeshBasicMaterial({ map: pictureTexture, side: DoubleSide })
  const picture = new Mesh(pictureGeometry, pictureMaterial)
  picture.position.set(-OFFSET_X, 0, 0)
  scene.add(picture)

  // 右：デジタル化した結果。左のアナログ画像と同じ大きさの枠に、同じ向きで並べる
  const terrain = new Group()
  terrain.position.set(OFFSET_X, 0, 0)
  scene.add(terrain)

  // 連続的な明るさの曲面。細かく分割した平面の頂点を、その位置の明るさのぶんだけ持ち上げる
  const surfaceGeometry = new PlaneGeometry(
    IMAGE_SIZE,
    IMAGE_SIZE,
    SURFACE_SEGMENTS,
    SURFACE_SEGMENTS
  )
  surfaceGeometry.rotateX(-Math.PI / 2)
  const surfacePosition = surfaceGeometry.getAttribute("position")
  for (let i = 0; i < surfacePosition.count; i++) {
    surfacePosition.setY(
      i,
      heightOf(brightnessAt(surfacePosition.getX(i), surfacePosition.getZ(i)))
    )
  }
  surfaceGeometry.computeVertexNormals()
  const surfaceMaterial = new MeshLambertMaterial({
    color: SURFACE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.4
  })
  const surface = new Mesh(surfaceGeometry, surfaceMaterial)
  terrain.add(surface)

  // 画素。1 辺 1 の立方体を、底面が y = 0 に来るようずらしておき、
  // 大きさ・位置・色を 1 つずつ与えて格子状に並べる
  const pixelGeometry = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
  const pixelMaterial = new MeshLambertMaterial()
  const pixels = new InstancedMesh(pixelGeometry, pixelMaterial, MAX_SAMPLE_COUNT ** 2)
  terrain.add(pixels)

  // 2 枚に共通の枠。もとの画像と、それをデジタル化したものが同じ大きさであることを示す
  const frameGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      // prettier-ignore
      [
        -HALF_IMAGE, 0, -HALF_IMAGE, HALF_IMAGE, 0, -HALF_IMAGE,
        HALF_IMAGE, 0, -HALF_IMAGE, HALF_IMAGE, 0, HALF_IMAGE,
        HALF_IMAGE, 0, HALF_IMAGE, -HALF_IMAGE, 0, HALF_IMAGE,
        -HALF_IMAGE, 0, HALF_IMAGE, -HALF_IMAGE, 0, -HALF_IMAGE
      ],
      3
    )
  )
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  const pictureFrame = new LineSegments(frameGeometry, frameMaterial)
  pictureFrame.position.set(-OFFSET_X, 0, 0)
  scene.add(pictureFrame)
  terrain.add(new LineSegments(frameGeometry, frameMaterial))

  const matrix = new Matrix4()
  const color = new Color()

  return {
    update: () => {
      const { sampleCount, quantize, levelCount, showSurface } = params
      surface.visible = showSurface

      // 標本化間隔。画像の 1 辺を格子の分割数で割ったものが、そのまま 1 画素の大きさになる
      const pitch = IMAGE_SIZE / sampleCount
      const pixelSize = pitch * PIXEL_FILL

      // 量子化レベル数が n なら、明るさは 0 と 1 を含む n 段階、すなわち n - 1 等分に丸める
      const steps = levelCount - 1

      pixels.count = sampleCount * sampleCount
      for (let row = 0; row < sampleCount; row++) {
        for (let column = 0; column < sampleCount; column++) {
          // 標本化：格子の 1 マスごとに、その中心での明るさを読み取る
          const x = -HALF_IMAGE + (column + 0.5) * pitch
          const z = -HALF_IMAGE + (row + 0.5) * pitch
          const sampled = brightnessAt(x, z)

          // 量子化：読み取った明るさを、決められた段階のうちいちばん近い値に丸める
          const value = quantize ? Math.round(sampled * steps) / steps : sampled

          // 画素の値を、高さと灰色の濃さの両方で表す
          const index = row * sampleCount + column
          matrix.makeScale(pixelSize, heightOf(value), pixelSize)
          matrix.setPosition(x, 0, z)
          pixels.setMatrixAt(index, matrix)
          pixels.setColorAt(index, color.setRGB(value, value, value, SRGBColorSpace))
        }
      }
      pixels.instanceMatrix.needsUpdate = true
      if (pixels.instanceColor) pixels.instanceColor.needsUpdate = true
      pixels.computeBoundingSphere()
    },
    dispose: () => {
      const disposables = [
        pictureTexture,
        pictureGeometry,
        pictureMaterial,
        surfaceGeometry,
        surfaceMaterial,
        pixelGeometry,
        pixelMaterial,
        frameGeometry,
        frameMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pixels.dispose()
    }
  }
}
