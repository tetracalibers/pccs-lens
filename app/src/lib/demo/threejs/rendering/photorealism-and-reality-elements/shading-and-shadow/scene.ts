import {
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Float32BufferAttribute,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  WebGLRenderer
} from "three"

/** Tweakpane で操作するパラメータ */
export type ShadingAndShadowParams = {
  /** 光源の方位（度）。0 で視点の方向、正で右回り */
  azimuth: number
  /** 光源の高さ（度）。90 で真上 */
  elevation: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  params: ShadingAndShadowParams
}

/**
 * 立体の断面（xy 平面）の輪郭。外（+z）から見て反時計回りに並べる。
 * 1 辺 2 の立方体を、幅・高さとも 2/3 の段で 3 段に切り下げた階段の形。この記事の他のデモと同じ形。
 * 段の上を向いた 3 つの面は向きが同じなので、シェーディングだけならすべて同じ明るさになる。
 */
const PROFILE: [number, number][] = [
  [-1, -1], // 0
  [1, -1], // 1
  [1, 1], // 2（最上段の上端）
  [1 / 3, 1], // 3
  [1 / 3, 1 / 3], // 4
  [-1 / 3, 1 / 3], // 5
  [-1 / 3, -1 / 3], // 6
  [-1, -1 / 3] // 7
]

/** 断面を押し出す奥行き。断面を z = ±DEPTH に置く */
const DEPTH = 1

/** 断面の各点を、手前（0〜7）・奥（8〜15）の順に並べた頂点 */
const VERTICES: [number, number, number][] = [
  ...PROFILE.map(([x, y]): [number, number, number] => [x, y, DEPTH]),
  ...PROFILE.map(([x, y]): [number, number, number] => [x, y, -DEPTH])
]

/**
 * 面。外から見て反時計回りになる順に、面を囲む頂点の番号を並べる。
 * 断面は凹んだ多角形なので、先頭の頂点から扇状に分割しても外へはみ出さない
 * 角（最上段の真下）から始める。
 */
const FACES: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 0], // 手前の断面 z = 1
  [9, 8, 15, 14, 13, 12, 11, 10], // 奥の断面 z = -1
  [1, 0, 8, 9], // 底面 y = -1
  [2, 1, 9, 10], // 右の側面 x = 1
  [3, 2, 10, 11], // 1 段目の上を向いた面 y = 1
  [4, 3, 11, 12], // 段差 x = 1/3
  [5, 4, 12, 13], // 2 段目の上を向いた面 y = 1/3
  [6, 5, 13, 14], // 段差 x = -1/3
  [7, 6, 14, 15], // 3 段目の上を向いた面 y = -1/3
  [0, 7, 15, 8] // 左の側面 x = -1
]

/** 立体の色。陰影の濃淡が読み取れる明るさにする */
const SURFACE_COLOR = "#9db4d0"

const LIGHT_COLOR = "#ffffff"

/** 環境光のうち、下から回り込む分の色。背景に近い暗さにする */
const GROUND_COLOR = "#2a2c31"

/** 光源までの距離。平行光源なので向きだけが意味を持つ */
const LIGHT_DISTANCE = 10

/** 左右に並べる 2 体の間隔（原点からの距離） */
const OFFSET_X = 1.9

/**
 * 段の面と段差の両方が見えるよう、階段が手前左へ下る向きに置く。
 * 左右とも同じ向きにする。光源はシーンに対して置くので、向きが同じなら光の当たり方も揃う。
 */
const YAW = Math.PI * 0.22

const LABEL_COLOR = "#e8e8ee"
const LABEL_HEIGHT = 0.26
/** ラベルの高さ。立体の上端（y = 1）から十分に間を空けて置く */
const LABEL_Y = 2.3
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 多角形の面を三角形に分割し、頂点の座標を並べる */
const createFacePositions = () => {
  const positions: number[] = []
  for (const face of FACES) {
    // 面の先頭の頂点から扇状に分割する
    for (let i = 1; i < face.length - 1; i++) {
      positions.push(...VERTICES[face[0]], ...VERTICES[face[i]], ...VERTICES[face[i + 1]])
    }
  }
  return new Float32Array(positions)
}

/** 面のデータから、面ごとに独立した頂点を持つジオメトリを作る */
const createSolidGeometry = () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(createFacePositions(), 3))
  // 頂点を面ごとに分けているので、法線は面ごとに平らに求まる
  geometry.computeVertexNormals()
  return geometry
}

/** 方位角と仰角から平行光源の向きを決める */
const setLightDirection = (light: DirectionalLight, azimuthDeg: number, elevationDeg: number) => {
  const azimuth = MathUtils.degToRad(azimuthDeg)
  const elevation = MathUtils.degToRad(elevationDeg)
  light.position.set(
    LIGHT_DISTANCE * Math.cos(elevation) * Math.sin(azimuth),
    LIGHT_DISTANCE * Math.sin(elevation),
    LIGHT_DISTANCE * Math.cos(elevation) * Math.cos(azimuth)
  )
}

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

export const createShadingAndShadowScene = ({ scene, renderer, params }: SceneContext) => {
  // 影を落とすには renderer 側で影の描画を有効にする（このデモに固有かつ必須の設定）
  renderer.shadowMap.enabled = true

  const solidGeometry = createSolidGeometry()
  // 面の明るさは、光の強さ・面の傾き・反射率だけで決まる（鏡面反射は考えない）
  const solidMaterial = new MeshLambertMaterial({ color: SURFACE_COLOR })

  // 左：シェーディングのみ。影を落とさず、影も受けない
  const shaded = new Mesh(solidGeometry, solidMaterial)
  shaded.position.x = -OFFSET_X
  shaded.rotation.y = YAW
  scene.add(shaded)

  // 右：影付け。同じ立体に影を落とす側と受ける側の両方を指定すると、
  // 段差が落とした影を、その下の段の面が受ける
  const shadowed = new Mesh(solidGeometry, solidMaterial)
  shadowed.position.x = OFFSET_X
  shadowed.rotation.y = YAW
  shadowed.castShadow = true
  shadowed.receiveShadow = true
  scene.add(shadowed)

  // 平行光源。影用のカメラは立体のまわりだけに絞り、輪郭のはっきりした影を得る
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  light.shadow.camera.left = -4
  light.shadow.camera.right = 4
  light.shadow.camera.top = 4
  light.shadow.camera.bottom = -4
  light.shadow.camera.near = 0.5
  light.shadow.camera.far = 25
  // 影用のカメラの写す範囲は、変えたあとに投影行列を作り直さないと反映されない
  light.shadow.camera.updateProjectionMatrix()
  // 面と影の境目に縞が出ないよう、面の向きに応じて影の判定をわずかにずらす
  light.shadow.normalBias = 0.02
  scene.add(light)

  // 光の届かない面も真っ暗にはならない。上を向いた面ほど明るい環境光を足すことで、
  // 影に入った段の面と、光を背にした段差の面が同じ明るさに溶けるのを防ぐ
  scene.add(new HemisphereLight(LIGHT_COLOR, GROUND_COLOR, 0.55))

  const labels = [
    createLabel("シェーディングのみ", LABEL_HEIGHT),
    createLabel("影付け", LABEL_HEIGHT)
  ]
  labels[0].sprite.position.set(-OFFSET_X, LABEL_Y, 0)
  labels[1].sprite.position.set(OFFSET_X, LABEL_Y, 0)
  labels.forEach(({ sprite }) => scene.add(sprite))

  return {
    update: () => {
      // 光源の位置が変われば、影用のカメラは three が描画の直前に追従させる
      setLightDirection(light, params.azimuth, params.elevation)
    },
    dispose: () => {
      solidGeometry.dispose()
      solidMaterial.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
