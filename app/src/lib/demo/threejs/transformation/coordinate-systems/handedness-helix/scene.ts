import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type HandednessHelixParams = {
  /** らせんが何周するか */
  turns: number
  /** らせんが y 軸方向に伸びる長さ */
  height: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: HandednessHelixParams
}

/** 座標値の組。どちらの座標系の値かは、この段階では決まっていない */
type Vertex = [number, number, number]

/** 座標系を「3 本の軸の向き」として持つ */
type Basis = { x: Vector3; y: Vector3; z: Vector3 }

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 1.5

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.3

/** 系の名前のラベルの高さ。見出しなので軸名より大きくする */
const TITLE_HEIGHT = 0.36

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** 系の名前を、y 軸の先からさらに離す距離 */
const TITLE_OFFSET = 0.75

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 2 つの座標系を、原点から左右へ振り分ける距離 */
const GROUP_OFFSET = 2.2

/** xy 平面を示す正方形の一辺。x 軸・y 軸の先端まで届く大きさにする */
const PLANE_SIZE = AXIS_LENGTH * 2

/** xy 平面の塗りの不透明度。面より奥にあるものが薄く覆われて見分けられる濃さにする */
const PLANE_OPACITY = 0.18

/** らせんが y 軸から離れている距離 */
const HELIX_RADIUS = 0.55

/** らせんの頂点データの分割数 */
const HELIX_SEGMENTS = 160

/** らせんを通すチューブの太さと、断面の分割数 */
const TUBE_RADIUS = 0.036
const TUBE_RADIAL_SEGMENTS = 10

/** らせんの不透明度。奥を通る部分や軸が透けて見える程度に落とす */
const HELIX_OPACITY = 0.65

/** 頂点データの端を示す球の半径 */
const MARKER_RADIUS = 0.085

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・らせん・らせんの両端の点・系の名前が見分けられる色にする。
// 軸の色は、この記事のほかのデモ（極座標・球面座標・円柱座標）と揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const HELIX_COLOR = "#ffc857"
const START_MARKER_COLOR = "#f57fc4"
const END_MARKER_COLOR = "#b79cf5"
const TITLE_COLOR = "#e8e8ee"
const PLANE_COLOR = "#8fa3bf"
const LIGHT_COLOR = "#ffffff"

/**
 * 右手系と左手系。違いは z 軸の向きだけで、x 軸（右）と y 軸（上）は共通。
 * 右手系は z 軸が画面の手前を、左手系は z 軸が画面の奥を向く
 */
const RIGHT_HANDED: Basis = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1)
}
const LEFT_HANDED: Basis = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, -1)
}

/**
 * 座標値 `(x, y, z)` は「その系の x 軸方向へ x、y 軸方向へ y、z 軸方向へ z だけ進んだ位置」を指す。
 * 同じ 3 つの数を渡しても、z 軸の向きが逆なら置かれる場所が変わる
 */
const toWorld = (basis: Basis, [x, y, z]: Vertex) =>
  new Vector3().addScaledVector(basis.x, x).addScaledVector(basis.y, y).addScaledVector(basis.z, z)

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「右手系」のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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
  const material = new SpriteMaterial({ map: texture, transparent: true })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/** 1 本の軸を、原点をまたぐ直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string, color: string, direction: Vector3) => {
  const group = new Group()

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-AXIS_LENGTH),
    direction.clone().multiplyScalar(AXIS_LENGTH)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(AXIS_LENGTH)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(AXIS_LENGTH + LABEL_OFFSET)
  group.add(label.sprite)

  return {
    object: group,
    dispose: () => {
      const disposables = [
        lineGeometry,
        lineMaterial,
        arrowGeometry,
        arrowMaterial,
        label.texture,
        label.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 頂点データの端に置く点。先頭（下端）と末尾（上端）を色で見分ける */
const createMarker = (color: string) => {
  const geometry = new SphereGeometry(MARKER_RADIUS, 16, 12)
  const material = new MeshStandardMaterial({ color, roughness: 0.5 })

  return {
    object: new Mesh(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * らせんの頂点データ。y 軸のまわりを回りながら y 方向へ進む点を並べる。
 * ここで作るのはただの数の並びで、どちらの系の座標値かはまだ決まっていない
 */
const createHelixVertices = (turns: number, height: number) => {
  const vertices: Vertex[] = []
  for (let i = 0; i <= HELIX_SEGMENTS; i++) {
    const progress = i / HELIX_SEGMENTS
    const angle = progress * turns * Math.PI * 2
    vertices.push([
      HELIX_RADIUS * Math.sin(angle),
      height * (progress - 0.5),
      HELIX_RADIUS * Math.cos(angle)
    ])
  }
  return vertices
}

/** 1 つの座標系を、xy 平面・3 本の軸・系の名前・頂点データから作ったらせんの組で作る */
const createSystem = (name: string, basis: Basis, offsetX: number) => {
  const group = new Group()
  group.position.x = offsetX

  // xy 平面。z 軸がこの面を垂直に貫くので、らせんや点が面の手前を通っているか奥を通っているかで
  // z の符号が読み取れる（PlaneGeometry は既定で xy 平面にある）
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLANE_OPACITY,
    // 面より奥にあるものを覆いたいだけなので、深度は比較するが書かない。
    // 面より手前にあるものは深度の比較で弾かれ、覆われずに残る
    depthWrite: false
  })
  group.add(new Mesh(planeGeometry, planeMaterial))

  const axes = [
    createAxis("x", X_COLOR, basis.x),
    createAxis("y", Y_COLOR, basis.y),
    createAxis("z", Z_COLOR, basis.z)
  ]
  group.add(...axes.map((axis) => axis.object))

  const title = createLabel(name, TITLE_COLOR, TITLE_HEIGHT)
  title.sprite.position.y = AXIS_LENGTH + TITLE_OFFSET
  group.add(title.sprite)

  // らせん。細い線だと交差したところで前後が読み取れないので、太さのあるチューブにして、
  // 手前を通る部分が奥を隠すようにする。奥を通る部分や軸が透けるよう半透明にする
  const helixMaterial = new MeshStandardMaterial({
    color: HELIX_COLOR,
    roughness: 0.5,
    transparent: true,
    opacity: HELIX_OPACITY
  })
  const helix = new Mesh(new BufferGeometry(), helixMaterial)
  // xy 平面より先に描いて、面より奥を通る部分が面に覆われるようにする
  helix.renderOrder = -1
  group.add(helix)

  // 頂点データの先頭（下端）と末尾（上端）の点。同じ座標値でも置かれる場所が系によって変わること、
  // そのなかで上下（y 軸方向）だけは変わらないことが、この 2 点で見比べられる
  const startMarker = createMarker(START_MARKER_COLOR)
  const endMarker = createMarker(END_MARKER_COLOR)
  group.add(startMarker.object, endMarker.object)

  return {
    object: group,
    /** 頂点データを、この系の軸の向きに従ってワールドの位置へ置き換え、らせんの形にする */
    setHelix: (vertices: Vertex[]) => {
      const points = vertices.map((vertex) => toWorld(basis, vertex))

      helix.geometry.dispose()
      helix.geometry = new TubeGeometry(
        new CatmullRomCurve3(points),
        HELIX_SEGMENTS,
        TUBE_RADIUS,
        TUBE_RADIAL_SEGMENTS,
        false
      )

      startMarker.object.position.copy(points[0])
      endMarker.object.position.copy(points[points.length - 1])
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      startMarker.dispose()
      endMarker.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        title.texture,
        title.material,
        helix.geometry,
        helixMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createHandednessHelixScene = ({ scene, params }: SceneContext) => {
  // 右手系を左、左手系を右に並べる
  const rightHanded = createSystem("右手系", RIGHT_HANDED, -GROUP_OFFSET)
  const leftHanded = createSystem("左手系", LEFT_HANDED, GROUP_OFFSET)
  scene.add(rightHanded.object, leftHanded.object)

  // らせんの前後を陰影でも読み取れるようにする光
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light, new AmbientLight(LIGHT_COLOR, 0.4))

  // らせんの形が変わったときだけ作り直す（カメラを動かしただけでは作り直さない）
  let builtTurns = NaN
  let builtHeight = NaN

  return {
    update: () => {
      if (params.turns === builtTurns && params.height === builtHeight) return
      builtTurns = params.turns
      builtHeight = params.height

      // 頂点データは 1 つだけ作り、同じものを両方の系に渡す
      const vertices = createHelixVertices(params.turns, params.height)
      rightHanded.setHelix(vertices)
      leftHanded.setHelix(vertices)
    },
    dispose: () => {
      rightHanded.dispose()
      leftHanded.dispose()
    }
  }
}
