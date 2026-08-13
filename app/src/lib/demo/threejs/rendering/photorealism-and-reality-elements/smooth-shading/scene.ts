import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace
} from "three"

/** Tweakpane で操作するパラメータ */
export type SmoothShadingParams = {
  /** 球を近似するポリゴンの分割数（横方向） */
  segments: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: SmoothShadingParams
}

/** 球の半径 */
const RADIUS = 1.15

/** 球の色。陰影の濃淡が読み取れる明るさにする */
const SURFACE_COLOR = "#9db4d0"

const LIGHT_COLOR = "#ffffff"

/** 左右に並べる 2 体の間隔（原点からの距離） */
const OFFSET_X = 1.9

const LABEL_COLOR = "#e8e8ee"
const LABEL_HEIGHT = 0.26
/** ラベルの高さ。球の上端（y = RADIUS）から間を空けて置く */
const LABEL_Y = 1.95
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * ポリゴンで近似した球。分割数を減らすほど 1 枚 1 枚のポリゴンが大きくなる。
 * 縦方向は横方向の半分にして、ポリゴンの形が細長くなりすぎないようにする。
 */
const createSphereGeometry = (segments: number) =>
  new SphereGeometry(RADIUS, segments, Math.max(2, Math.round(segments / 2)))

/** 文字を描いた canvas をテクスチャにしたラベル */
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
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

export const createSmoothShadingScene = ({ scene, params }: SceneContext) => {
  let segments = params.segments
  let geometry = createSphereGeometry(segments)

  // 左：ポリゴンごとに明るさを一定にする。面の境目が段差として見える
  const flatMaterial = new MeshLambertMaterial({ color: SURFACE_COLOR, flatShading: true })
  const flat = new Mesh(geometry, flatMaterial)
  flat.position.x = -OFFSET_X
  scene.add(flat)

  // 右：頂点の法線を面の内部で補間する（既定の動き）。濃淡が連続する
  const smoothMaterial = new MeshLambertMaterial({ color: SURFACE_COLOR })
  const smooth = new Mesh(geometry, smoothMaterial)
  smooth.position.x = OFFSET_X
  scene.add(smooth)

  // 光源の向きは主題ではないので固定する。左右どちらの球にも同じ向きから当たる
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light)

  scene.add(new AmbientLight(LIGHT_COLOR, 0.4))

  const labels = [
    createLabel("ポリゴンごとに一定", LABEL_HEIGHT),
    createLabel("スムーズシェーディング", LABEL_HEIGHT)
  ]
  labels[0].sprite.position.set(-OFFSET_X, LABEL_Y, 0)
  labels[1].sprite.position.set(OFFSET_X, LABEL_Y, 0)
  labels.forEach(({ sprite }) => scene.add(sprite))

  return {
    update: () => {
      if (segments === params.segments) return

      // 分割数が変わったときだけジオメトリを作り直し、左右で同じものを使う
      segments = params.segments
      const next = createSphereGeometry(segments)
      flat.geometry = next
      smooth.geometry = next
      geometry.dispose()
      geometry = next
    },
    dispose: () => {
      geometry.dispose()
      flatMaterial.dispose()
      smoothMaterial.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
