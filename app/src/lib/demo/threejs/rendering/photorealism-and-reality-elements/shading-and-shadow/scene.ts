import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
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
 * 一角を欠いた直方体（L字ブロック）の頂点。さまざまな形状モデルのデモと同じ形。
 * 1 辺 2 の立方体から、1 辺 1 の角（x・y・z がいずれも正の側）を取り除いた形。
 */
const VERTICES: [number, number, number][] = [
  // 立方体の角のうち、取り除いた角 (1, 1, 1) を除いた 7 つ
  [-1, -1, -1], // 0
  [1, -1, -1], // 1
  [1, 1, -1], // 2
  [-1, 1, -1], // 3
  [-1, -1, 1], // 4
  [1, -1, 1], // 5
  [-1, 1, 1], // 6
  // 角を取り除いてできた 7 つ
  [0, 0, 0], // 7（へこみの奥）
  [1, 0, 0], // 8
  [0, 1, 0], // 9
  [0, 0, 1], // 10
  [1, 1, 0], // 11
  [1, 0, 1], // 12
  [0, 1, 1] // 13
]

/**
 * 面。外から見て反時計回りになる順に、面を囲む頂点の番号を並べる。
 * L 字の面は、切り欠きの反対側の角から始める（先頭の頂点から扇状に三角形へ分割するため）。
 */
const FACES: number[][] = [
  [0, 3, 2, 1], // z = -1
  [0, 1, 5, 4], // y = -1
  [0, 4, 6, 3], // x = -1
  [1, 2, 11, 8, 12, 5], // x = 1（L 字）
  [4, 5, 12, 10, 13, 6], // z = 1（L 字）
  [7, 9, 13, 10], // 切り欠きの壁 x = 0
  [7, 10, 12, 8], // 切り欠きの壁 y = 0
  [7, 8, 11, 9], // 切り欠きの壁 z = 0
  [3, 6, 13, 9, 11, 2] // y = 1（L 字）
]

/** 立体の色。陰影の濃淡が読み取れる明るさにする */
const SURFACE_COLOR = "#9db4d0"

/** 床の色。影が落ちたときの明暗差が出るよう、背景より明るい無彩色にする */
const FLOOR_COLOR = "#565e6c"

const LIGHT_COLOR = "#ffffff"

/** 光源までの距離。平行光源なので向きだけが意味を持つ */
const LIGHT_DISTANCE = 10

/** 床の高さ。立体の底面に合わせる */
const FLOOR_Y = -1

/** 左右に並べる 2 体の間隔（原点からの距離） */
const OFFSET_X = 1.9

/** 立体が 3 次元の形として読めるよう、正面から少しだけ回した向きで置く */
const YAW = Math.PI * 0.13

const LABEL_COLOR = "#e8e8ee"
const LABEL_HEIGHT = 0.26
/** ラベルの高さ。立体の上端（y = 1）から間を空けて置く */
const LABEL_Y = 1.95
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

export const createShadingAndShadowScene = ({ scene, camera, renderer, params }: SceneContext) => {
  // 影を落とすには renderer 側で影の描画を有効にする（このデモに固有かつ必須の設定）
  renderer.shadowMap.enabled = true

  const solidGeometry = createSolidGeometry()
  // 面の明るさは、光の強さ・面の傾き・反射率だけで決まる（鏡面反射は考えない）
  const solidMaterial = new MeshLambertMaterial({ color: SURFACE_COLOR })

  // 左：シェーディングのみ。影を落とさず、自分自身にも影を受けない
  const shaded = new Mesh(solidGeometry, solidMaterial)
  const shadedGroup = new Group()
  shadedGroup.add(shaded)
  shadedGroup.position.x = -OFFSET_X
  scene.add(shadedGroup)

  // 右：影付け。床と自分自身に影が落ちる
  const shadowed = new Mesh(solidGeometry, solidMaterial)
  shadowed.castShadow = true
  shadowed.receiveShadow = true
  const shadowedGroup = new Group()
  shadowedGroup.add(shadowed)
  shadowedGroup.position.x = OFFSET_X
  scene.add(shadowedGroup)

  // 影の落ちる先。左右どちらの立体も同じ床の上に置く
  const floorGeometry = new PlaneGeometry(20, 14)
  const floorMaterial = new MeshLambertMaterial({ color: FLOOR_COLOR })
  const floor = new Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = FLOOR_Y
  floor.receiveShadow = true
  scene.add(floor)

  // 平行光源。影用のカメラは立体のまわりだけに絞り、輪郭のはっきりした影を得る
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  light.shadow.camera.left = -7
  light.shadow.camera.right = 7
  light.shadow.camera.top = 7
  light.shadow.camera.bottom = -7
  light.shadow.camera.near = 0.5
  light.shadow.camera.far = 25
  // 影用のカメラの写す範囲は、変えたあとに投影行列を作り直さないと反映されない
  light.shadow.camera.updateProjectionMatrix()
  // 面と影の境目に縞が出ないよう、面の向きに応じて影の判定をわずかにずらす
  light.shadow.normalBias = 0.02
  scene.add(light)

  scene.add(new AmbientLight(LIGHT_COLOR, 0.4))

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

      // 左右は原点から離れた位置にあるため、透視投影では視点との角度が食い違い、
      // 同じ立体でも違う向きに見えてしまう。その差のぶんだけ各立体を回して向きを揃える。
      // 視点の回り込み（原点から見た方位）は打ち消さないので、ドラッグでの回転は効いたままになる
      const centerAzimuth = Math.atan2(camera.position.x, camera.position.z)
      for (const group of [shadedGroup, shadowedGroup]) {
        const azimuth = Math.atan2(
          camera.position.x - group.position.x,
          camera.position.z - group.position.z
        )
        group.rotation.y = YAW + azimuth - centerAzimuth
      }
    },
    dispose: () => {
      solidGeometry.dispose()
      solidMaterial.dispose()
      floorGeometry.dispose()
      floorMaterial.dispose()
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
