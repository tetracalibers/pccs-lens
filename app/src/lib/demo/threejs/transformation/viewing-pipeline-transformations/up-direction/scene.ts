import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type UpDirectionParams = {
  /** 視線を軸に上方向を傾ける角度（度） */
  roll: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: UpDirectionParams
}

/** 物体の置き方。モデリング変換行列のもとになる */
type Placement = {
  /** 拡大/縮小の倍率（3 軸とも同じ） */
  scale: number
  /** y 軸まわりの回転（度） */
  rotationY: number
  position: [number, number, number]
  color: string
}

/** 稜線でつないだ線 1 本ぶん。上方向が変わるたびに作り直す */
type Wireframe = LineSegments<BufferGeometry, LineBasicMaterial>

/**
 * 家型の頂点。モデリング座標系での座標で、底面の中心が原点に来るように取る。
 * 前半の 8 つが箱（壁）の隅、後半の 2 つが屋根の稜線の端
 */
const HOUSE_VERTICES: [number, number, number][] = [
  [-0.5, 0, -0.4],
  [0.5, 0, -0.4],
  [0.5, 0, 0.4],
  [-0.5, 0, 0.4],
  [-0.5, 0.8, -0.4],
  [0.5, 0.8, -0.4],
  [0.5, 0.8, 0.4],
  [-0.5, 0.8, 0.4],
  [-0.5, 1.2, 0],
  [0.5, 1.2, 0]
]

/** 家型の稜線。結ぶ 2 頂点の番号を並べる */
const HOUSE_EDGES = [
  0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7, 4, 8, 7, 8, 5, 9, 6, 9, 8,
  9
]

/** 場面に並べる 3 体。同じ頂点データを、モデリング変換行列だけ変えて配置する */
const PLACEMENTS: Placement[] = [
  { scale: 0.55, rotationY: 25, position: [-0.62, 0, 0.15], color: "#ffc857" },
  { scale: 0.4, rotationY: -30, position: [0.5, 0, 0.35], color: "#f57fc4" },
  { scale: 0.7, rotationY: 8, position: [0.05, 0, -0.75], color: "#b79cf5" }
]

/** カメラの形の大きさ。場面に並ぶ物体と釣り合う倍率まで縮める */
const CAMERA_SCALE = 0.42

/** 視点の位置と、カメラが向く先。上方向を回しても、この 2 つは動かさない */
const CAMERA_POSITION = new Vector3(2.46, 1.33, 2.46)
const TARGET = new Vector3(0, 0.4, 0)

/** 写す側のカメラ。縦横比は枠の縦横比と揃える */
const FOV = 45
const ASPECT = 1.5
const NEAR = 1
const FAR = 8

/** 場面を、枠と重ならない位置まで左へ寄せる距離 */
const SCENE_OFFSET = -3

/** 像を写す枠の中心と、その半分の大きさ（縦横比はカメラと同じ） */
const PANEL_CENTER = new Vector3(2.3, 0.4, 0)
const PANEL_HALF_WIDTH = 1.35
const PANEL_HALF_HEIGHT = 0.9

/** 枠の 4 隅（枠の中心を原点とする座標）と、その稜線 */
const FRAME_CORNERS: [number, number, number][] = [
  [-PANEL_HALF_WIDTH, -PANEL_HALF_HEIGHT, 0],
  [PANEL_HALF_WIDTH, -PANEL_HALF_HEIGHT, 0],
  [PANEL_HALF_WIDTH, PANEL_HALF_HEIGHT, 0],
  [-PANEL_HALF_WIDTH, PANEL_HALF_HEIGHT, 0]
]
const FRAME_EDGES = [0, 1, 1, 2, 2, 3, 3, 0]

/** 2 つの見出しを置く高さ。左右で揃える */
const TITLE_HEIGHT_Y = 2

/** 見出しのラベルの高さ（表示上の大きさ） */
const TITLE_HEIGHT = 0.34

/** 場面の見出しを、場面のおおよその中心の上に置くための横位置 */
const SCENE_TITLE_X = 0.65

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、物体・カメラ・枠・見出しが見分けられる色にする。
// 物体の色は、座標系間の変換のデモと揃える
const CAMERA_BODY_COLOR = "#3f5f8a"
const CAMERA_LENS_COLOR = "#1c2a3d"
const FRAME_COLOR = "#8fa3bf"
const TITLE_COLOR = "#e8e8ee"

/**
 * カメラを照らす光。カメラだけが陰影の付く材質で、ほかの線には効かない。
 * 面ごとの明るさの差がないと、単色で塗った箱が平らな影絵に見えてしまう
 */
const AMBIENT_INTENSITY = 2.5
const KEY_LIGHT_INTENSITY = 6
const KEY_LIGHT_POSITION: [number, number, number] = [2, 3, 2]

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「カメラの置き方」のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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
 * モデリング変換行列。拡大/縮小と回転はどちらも原点を中心とする変換なので、
 * 物体が原点にあるうちに大きさと向きを決め、最後の平行移動で置き場所へ運ぶ
 */
const createModelingMatrix = ({ scale, rotationY, position }: Placement) =>
  new Matrix4()
    .makeTranslation(...position)
    .multiply(new Matrix4().makeRotationY(MathUtils.degToRad(rotationY)))
    .multiply(new Matrix4().makeScale(scale, scale, scale))

/** 頂点に行列を掛けた位置で、稜線を結んだ線を作る */
const createWireframe = (
  vertices: Vector3[],
  matrix: Matrix4,
  edges: number[],
  color: string
): Wireframe => {
  const points = vertices.map((vertex) => vertex.clone().applyMatrix4(matrix))
  const geometry = new BufferGeometry().setFromPoints(points).setIndex(edges)
  return new LineSegments(geometry, new LineBasicMaterial({ color }))
}

const houseVertices = HOUSE_VERTICES.map(([x, y, z]) => new Vector3(x, y, z))
const frameCorners = FRAME_CORNERS.map(([x, y, z]) => new Vector3(x, y, z))
const modelingMatrices = PLACEMENTS.map(createModelingMatrix)

/**
 * カメラの形。線だけで描く場面の物体と見分けがつくよう、レンズの付いた筐体として作る。
 *
 * カメラ座標系での形で、視点が原点、視線が z 軸の負の向き。
 * レンズの先端が原点に来るように全体を +z へずらしてあるので、
 * 視線の先（-z 側）には何も置かれず、カメラが場面を隠さない
 */
const createCameraShape = () => {
  const bodyGeometry = new BoxGeometry(1.2, 0.8, 0.7)
  const bodyMaterial = new MeshStandardMaterial({ color: CAMERA_BODY_COLOR })
  const body = new Mesh(bodyGeometry, bodyMaterial)
  body.position.z = 0.8

  const lensGeometry = new CylinderGeometry(0.25, 0.3, 0.5, 32)
  const lensMaterial = new MeshStandardMaterial({ color: CAMERA_LENS_COLOR })
  const lens = new Mesh(lensGeometry, lensMaterial)
  // CylinderGeometry は y 軸方向に伸びるので、視線の向きへ倒す
  lens.rotation.x = Math.PI / 2
  lens.position.z = 0.25

  // 上に載せたビューファインダー。これが無いと、上下が引っくり返っても形が同じで分からない
  const finderGeometry = new BoxGeometry(0.5, 0.25, 0.4)
  const finder = new Mesh(finderGeometry, bodyMaterial)
  finder.position.set(0, 0.52, 0.9)

  const model = new Group()
  model.scale.setScalar(CAMERA_SCALE)
  model.add(body, lens, finder)

  const object = new Group()
  object.add(model)

  return {
    object,
    /** カメラの置き方を表す行列を、位置・向き・大きさに分けて反映する */
    place: (matrix: Matrix4) => {
      matrix.decompose(object.position, object.quaternion, object.scale)
    },
    dispose: () => {
      const disposables = [bodyGeometry, lensGeometry, finderGeometry, bodyMaterial, lensMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/**
 * 枠に写る像。頂点をカメラで投影すると -1〜1 の正規化デバイス座標が返るので、
 * それを枠の大きさに合わせて広げた位置が、この枠に写る像になる
 */
const createImage = (camera: PerspectiveCamera, modeling: Matrix4, color: string): Wireframe => {
  const points = houseVertices.map((vertex) => {
    const ndc = vertex.clone().applyMatrix4(modeling).project(camera)
    return new Vector3(ndc.x * PANEL_HALF_WIDTH, ndc.y * PANEL_HALF_HEIGHT, 0)
  })
  const geometry = new BufferGeometry().setFromPoints(points).setIndex(HOUSE_EDGES)
  return new LineSegments(geometry, new LineBasicMaterial({ color }))
}

export const createUpDirectionScene = ({ scene, params }: SceneContext) => {
  // 左に場面とカメラ、右に写る像の枠を並べる
  const sceneGroup = new Group()
  sceneGroup.position.x = SCENE_OFFSET
  const panel = new Group()
  panel.position.copy(PANEL_CENTER)
  scene.add(sceneGroup, panel)

  const titles = [
    { label: createLabel("カメラの置き方", TITLE_COLOR, TITLE_HEIGHT), parent: sceneGroup },
    { label: createLabel("写る像", TITLE_COLOR, TITLE_HEIGHT), parent: panel }
  ]
  titles[0].label.sprite.position.set(SCENE_TITLE_X, TITLE_HEIGHT_Y, 0)
  titles[1].label.sprite.position.set(0, TITLE_HEIGHT_Y - PANEL_CENTER.y, 0)
  titles.forEach(({ label, parent }) => parent.add(label.sprite))

  // 場面に並ぶ 3 体。上方向を回しても動かないので、一度だけ置く
  const houses = PLACEMENTS.map((placement, i) =>
    createWireframe(houseVertices, modelingMatrices[i], HOUSE_EDGES, placement.color)
  )
  houses.forEach((house) => sceneGroup.add(house))

  // 像を写す枠。カメラの縦横比に合わせた長方形で、こちらも動かない
  const frame = createWireframe(frameCorners, new Matrix4(), FRAME_EDGES, FRAME_COLOR)
  panel.add(frame)

  // カメラの形だけが陰影の付く材質なので、光もカメラのためだけに置く
  const ambient = new AmbientLight("#ffffff", AMBIENT_INTENSITY)
  const keyLight = new DirectionalLight("#ffffff", KEY_LIGHT_INTENSITY)
  keyLight.position.set(...KEY_LIGHT_POSITION)
  scene.add(ambient, keyLight)

  // カメラの形は置き方が変わっても同じなので、一度だけ作って置き直す
  const cameraShape = createCameraShape()
  sceneGroup.add(cameraShape.object)

  // 写す側のカメラ。位置と向きは固定で、上方向だけが変わる
  const camera = new PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  camera.position.copy(CAMERA_POSITION)

  // 視点から注視点へ向かう向き。上方向はこの向きを軸にして回す
  const forward = TARGET.clone().sub(CAMERA_POSITION).normalize()

  // 像は上方向が変わるたびに作り直す
  let built: Wireframe[] = []
  const replaceBuilt = (wireframes: Wireframe[]) => {
    built.forEach((wireframe) => {
      wireframe.removeFromParent()
      wireframe.geometry.dispose()
      wireframe.material.dispose()
    })
    built = wireframes
  }

  // 上方向が変わったときだけ作り直す（カメラを回しただけでは作り直さない）
  let builtRoll = NaN

  return {
    update: () => {
      if (params.roll === builtRoll) return
      builtRoll = params.roll

      // カメラの置き方は、視点の位置・視線の向き・上方向の 3 つで決まる。
      // ここでは位置と向きを固定し、上方向だけを視線のまわりに回す
      camera.up.set(0, 1, 0).applyAxisAngle(forward, MathUtils.degToRad(params.roll))
      camera.lookAt(TARGET)
      camera.updateMatrixWorld()

      // カメラの置き方を表す行列（matrixWorld）どおりの位置と向きに、カメラの形を置く
      cameraShape.place(camera.matrixWorld)

      // 枠に写る像。上方向を回すと、視点も視線の向きも変わらないのに、像だけが回る
      const images = PLACEMENTS.map((placement, i) =>
        createImage(camera, modelingMatrices[i], placement.color)
      )
      images.forEach((image) => panel.add(image))

      replaceBuilt(images)
    },
    dispose: () => {
      replaceBuilt([])
      cameraShape.dispose()
      houses.forEach((house) => {
        house.geometry.dispose()
        house.material.dispose()
      })
      frame.geometry.dispose()
      frame.material.dispose()
      titles.forEach(({ label }) => {
        label.texture.dispose()
        label.material.dispose()
      })
    }
  }
}
