import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  FrontSide,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from "three"

/** Tweakpane で操作するパラメータ */
export type ObliqueParams = {
  /** 奥行き方向の辺が像の上で何倍の長さになるか。1 でカバリエ図、0.5 でキャビネット図 */
  depthScale: number
  /** 像の上で奥行きの辺が伸びる向き（度）。x 軸から反時計回りに測る */
  depthAngleDeg: number
  /** 奥行き方向にスキューさせた形状を重ねて見せるか */
  showSkewed: boolean
  /** 投射線が投影面となす角。scene.ts が計算して書き戻す表示用の値 */
  rayAngle: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  renderer: WebGLRenderer
  params: ObliqueParams
  /** 次のフレームで 1 回だけ描画させる。ドラッグで左の図を回したあとに呼ぶ */
  invalidate: () => void
}

/**
 * 1 辺 1 の立方体の 8 頂点。前半 4 つが投影面に接した面（z = 0）、後半 4 つが手前の面（z = 1）。
 * 接した面の中心を原点に置き、投影面に垂直な奥行き方向（z の正の側）へ伸ばす
 */
const CUBE_VERTICES: [number, number, number][] = [
  [-0.5, -0.5, 0],
  [0.5, -0.5, 0],
  [0.5, 0.5, 0],
  [-0.5, 0.5, 0],
  [-0.5, -0.5, 1],
  [0.5, -0.5, 1],
  [0.5, 0.5, 1],
  [-0.5, 0.5, 1]
]

/** 立方体の稜線 12 本。結ぶ 2 頂点の番号を並べる */
const CUBE_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/**
 * 投影面に接した面（0-1-2-3）を除いた 8 本。
 * この面は自分自身の像とぴったり重なるので、形状の側では描かず像の色で見せる
 */
const CUBE_EDGES_OFF_PLANE = [4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/**
 * 立方体の 6 面を三角形 2 枚ずつに割ったもの。塗って見せるスキュー形状に使う。
 * 手前を向いた面だけを描かせるので、外から見て反時計回りになる順に並べる。
 * 面の順は、投影面に接した面（z = 0）・手前の面（z = 1）・下・上・左・右
 */
const CUBE_FACES = [
  0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, 0, 4, 7, 0, 7, 3, 1, 2, 6,
  1, 6, 5
]

/** 座標軸の向き。順に x・y・z */
const AXIS_DIRECTIONS: [number, number, number][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]

const AXIS_NAMES = ["x", "y", "z"]

/** 軸を原点から伸ばす長さ。立方体の 1 辺（1）より少し長くして、面の先に軸名を出す */
const AXIS_LENGTH = 1.15

/** 軸の像が短くなりすぎたときに、矢印と軸名を隠す長さ。0 の向きは正規化できない */
const MIN_AXIS_LENGTH = 1e-4

/** 投影面の 1 辺の長さ。像が奥行きの向きへずれても収まる大きさにする */
const PLANE_SIZE = 3.2

/** 左右 2 面の中心を、原点からどれだけ離して置くか */
const PANEL_OFFSET = 2

/**
 * 左の面（空間のようす）の見せ方。
 * 投影面と投射線を含む立体なので、右の面よりかさばる。縮めたうえで、
 * 投射線が真後ろを向いて点に見えないように斜めから見る向きへ回す
 */
const SETUP_SCALE = 0.62
const SETUP_TILT_X = 0.28
const SETUP_TILT_Y = -0.75

/** 左の面をドラッグで回す速さ（1 px あたりのラジアン） */
const DRAG_ROTATE_SPEED = 0.007

/**
 * 左の面を回せる範囲。
 *
 * 横は投影面の正面（`0`）まで回せるようにする。そこまで回すと投射方向から見ることになり、
 * 像とそれを生む形状がぴったり重なる。真横まで倒すと投影面が線に潰れるので、手前で止める。
 * 縦は、見上げる向きと見下ろしすぎる向きの両方を落とす
 */
const SETUP_YAW_RANGE: [number, number] = [-1.2, 0.2]
const SETUP_PITCH_RANGE: [number, number] = [-0.2, 0.8]

/**
 * スキューさせた形状を照らす光。塗った面だけが陰影の付く材質で、ほかの線には効かない。
 * 面ごとの明るさの差がないと、単色で塗った箱が平らな影絵に見えてしまう。
 *
 * 塗るのが明るい色なので、光を強くすると手前を向いた面がどれも白飛びして差が消える。
 * 環境光は弱くとり、面の向きの違いが明るさに残る強さにする。
 * 位置は、手前を向いた 3 面の明るさがそれぞれ離れる向きから当たるように選ぶ
 */
const AMBIENT_INTENSITY = 0.6
const KEY_LIGHT_INTENSITY = 3.2
const KEY_LIGHT_POSITION: [number, number, number] = [-2, 3, 2]

/** 矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.16

/** 軸名のラベルの高さ（表示上の大きさ）と、矢印の先からさらに離す距離 */
const AXIS_LABEL_HEIGHT = 0.26
const LABEL_OFFSET = 0.2

/** 見出しのラベルの高さと、2 つの見出しを置く高さ */
const TITLE_HEIGHT = 0.3
const TITLE_Y = 1.85

/** 縮まなかったときの軸の先を示す円の分割数 */
const CIRCLE_SEGMENTS = 96

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・形状・像・投影面が見分けられる色にする。
// 軸の色はほかの座標系のデモと揃え、像は形状と見分けのつく暖色にする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const AXIS_COLORS = [X_COLOR, Y_COLOR, Z_COLOR]
const SHAPE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const PLANE_COLOR = "#8fa3bf"
const GUIDE_COLOR = "#667486"
const TITLE_COLOR = "#e8e8ee"
/** スキューさせた形状。形状・像・軸のどれとも取り違えない色にする */
const SKEW_COLOR = "#c792ea"
/** スキューさせた形状の稜線。塗りより暗くして、立方体や像の線と競らせない */
const SKEW_EDGE_COLOR = "#a473c9"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「投影面に写った像」のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる半透明の面や線が
    // ラベルの矩形の形に欠け、文字に黒い下敷きが付いたように見える
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/**
 * 原点から 1 点へ伸ばす軸。像の上の軸は操作のたびに向きも長さも変わるので、
 * 先端を渡して作り直せるようにする
 */
const createAxis = (name: string, color: string, labelHeight: number) => {
  const group = new Group()

  const linePosition = new Float32BufferAttribute(new Float32Array(6), 3)
  const lineGeometry = new BufferGeometry().setAttribute("position", linePosition)
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  group.add(arrow)

  const label = createLabel(name, color, labelHeight)
  group.add(label.sprite)

  const direction = new Vector3()

  return {
    object: group,
    setTip: (tip: Vector3) => {
      linePosition.setXYZ(0, 0, 0, 0)
      linePosition.setXYZ(1, tip.x, tip.y, tip.z)
      linePosition.needsUpdate = true

      // 奥行きの倍率を 0 まで下げると z 軸の像は点に潰れる。
      // 向きを持たなくなるので、矢印と軸名は隠す
      const length = tip.length()
      arrow.visible = length > MIN_AXIS_LENGTH
      label.sprite.visible = length > MIN_AXIS_LENGTH
      if (length <= MIN_AXIS_LENGTH) return

      direction.copy(tip).divideScalar(length)
      arrow.position.copy(tip)
      arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
      label.sprite.position.copy(tip).addScaledVector(direction, LABEL_OFFSET)
    },
    dispose: () => {
      lineGeometry.dispose()
      lineMaterial.dispose()
      arrowGeometry.dispose()
      arrowMaterial.dispose()
      label.texture.dispose()
      label.material.dispose()
    }
  }
}

/** 稜線でつないだ線を、頂点を書き換えられる形で作る */
const createWireframe = (vertexCount: number, edges: number[], color: string) => {
  const vertices = new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", vertices).setIndex(edges)
  const material = new LineBasicMaterial({ color })
  return { object: new LineSegments(geometry, material), vertices, geometry, material }
}

const clamp = (value: number, [min, max]: [number, number]) => Math.min(Math.max(value, min), max)

export const createObliqueScene = ({ scene, renderer, params, invalidate }: SceneContext) => {
  // 左は空間のようす（立方体・座標軸・投影面・投射線・投影面に写った像）。
  // 投影面が画面と平行なままなので、傾けているのは形状の側に見える
  const setup = new Group()
  setup.position.x = -PANEL_OFFSET
  setup.rotation.set(SETUP_TILT_X, SETUP_TILT_Y, 0)
  setup.scale.setScalar(SETUP_SCALE)
  scene.add(setup)

  // 右は投影面に写った像だけを正面から見たもの。ここで奥行きの辺の長さと向きを読み取る
  const panel = new Group()
  panel.position.x = PANEL_OFFSET
  scene.add(panel)

  // 投影面。xy 平面に置いた正方形で、立方体の面がちょうど接する
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12,
    // 面に深度を書かせない。x 軸・y 軸はこの面の中を通るので、軸名のラベル（常にカメラを
    // 向く板）が面をまたいで置かれ、深度を書くと向こう側にはみ出た半分が欠けて見える
    depthWrite: false
  })
  setup.add(new Mesh(planeGeometry, planeMaterial))

  const borderGeometry = new EdgesGeometry(planeGeometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  setup.add(new LineSegments(borderGeometry, borderMaterial))

  // 投影される立方体。向きも大きさも変わらないので、頂点はここで一度だけ書き込む。
  // 投影面に接した面は自分自身の像と重なるので、稜線からは外してある
  const shape = createWireframe(CUBE_VERTICES.length, CUBE_EDGES_OFF_PLANE, SHAPE_COLOR)
  CUBE_VERTICES.forEach(([x, y, z], i) => shape.vertices.setXYZ(i, x, y, z))
  shape.vertices.needsUpdate = true
  setup.add(shape.object)

  // 投射線。頂点 1 つにつき 1 本（2 頂点）、頂点から像へ斜めに結ぶ。
  // 投影面に接した面の 4 頂点は像と同じ位置なので、長さ 0 の線になって現れない
  const rayPosition = new Float32BufferAttribute(new Float32Array(CUBE_VERTICES.length * 6), 3)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  setup.add(new LineSegments(rayGeometry, rayMaterial))

  // 奥行き方向にスキューさせた形状。本文が触れるまでは出さないので、
  // 塗りと稜線をまとめて隠せるように 1 つの Group に入れる
  const skewed = new Group()
  skewed.visible = false
  setup.add(skewed)

  // 稜線で描くと立方体・像・投射線に線が重なって読み取りづらくなるので、
  // スキューさせた形状は薄く塗った面だけで見せる
  const skewedVertices = new Float32BufferAttribute(new Float32Array(CUBE_VERTICES.length * 3), 3)
  const skewedGeometry = new BufferGeometry()
    .setAttribute("position", skewedVertices)
    .setIndex(CUBE_FACES)
  const skewedMaterial = new MeshStandardMaterial({
    color: SKEW_COLOR,
    // 光沢を出さない。面ごとの明るさの差だけで立体に見せる
    roughness: 1,
    // 8 頂点を面どうしで共有しているので、法線は面ごとに求めさせる。
    // スキューで面の向きが変わっても、陰影がそのまま追従する
    flatShading: true,
    // 裏を向いた面は描かない。表と裏が重なると濃さが均されて、塗りが平らな影絵に見える
    side: FrontSide,
    transparent: true,
    opacity: 0.5,
    // 面に深度を書かせない。向こう側を通る投射線と、投影面に写った像を隠さないため
    depthWrite: false
  })
  skewed.add(new Mesh(skewedGeometry, skewedMaterial))

  // 塗りは半透明なので、背景や後ろの線と混ざって輪郭が緩む。稜線を重ねて形の縁を立てる。
  // 頂点は塗りと同じものを使い、投影面に接した面（像と重なる）の 4 本は引かない
  const skewedEdgeGeometry = new BufferGeometry()
    .setAttribute("position", skewedVertices)
    .setIndex(CUBE_EDGES_OFF_PLANE)
  const skewedEdgeMaterial = new LineBasicMaterial({ color: SKEW_EDGE_COLOR })
  skewed.add(new LineSegments(skewedEdgeGeometry, skewedEdgeMaterial))

  // スキューさせた形状だけが陰影の付く材質なので、光もそのためだけに置く
  const keyLight = new DirectionalLight("#ffffff", KEY_LIGHT_INTENSITY)
  keyLight.position.set(...KEY_LIGHT_POSITION)
  scene.add(new AmbientLight("#ffffff", AMBIENT_INTENSITY), keyLight)

  // 投影面に写った像。接した面の像も含めて、稜線を 12 本とも描く
  const planeImage = createWireframe(CUBE_VERTICES.length, CUBE_EDGES, IMAGE_COLOR)
  setup.add(planeImage.object)

  // 右の面に写す像。座標軸は面の内側を通るだけなので、こちらも稜線は 12 本
  const panelImage = createWireframe(CUBE_VERTICES.length, CUBE_EDGES, IMAGE_COLOR)
  panel.add(panelImage.object)

  // 縮まなかったときの軸の先。奥行きの軸の像がここまで届いていればカバリエ図になる
  const circleGeometry = new BufferGeometry().setFromPoints(
    Array.from({ length: CIRCLE_SEGMENTS }, (_, i) => {
      const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2
      return new Vector3(Math.cos(angle) * AXIS_LENGTH, Math.sin(angle) * AXIS_LENGTH, 0)
    })
  )
  const circleMaterial = new LineBasicMaterial({ color: GUIDE_COLOR })
  panel.add(new LineLoop(circleGeometry, circleMaterial))

  // 空間の 3 軸は動かないので、先端もここで決めておく。
  // 左の面は縮めて置くので、軸名だけは縮んだぶんを打ち消して同じ大きさに見せる
  const spaceAxes = AXIS_NAMES.map((name, i) =>
    createAxis(name, AXIS_COLORS[i], AXIS_LABEL_HEIGHT / SETUP_SCALE)
  )
  spaceAxes.forEach((axis, i) => {
    axis.setTip(new Vector3(...AXIS_DIRECTIONS[i]).multiplyScalar(AXIS_LENGTH))
    setup.add(axis.object)
  })

  // 右の面に写す軸の像。x 軸と y 軸は投影面に平行なので、そのままの長さで写る
  const panelAxes = AXIS_NAMES.map((name, i) => createAxis(name, AXIS_COLORS[i], AXIS_LABEL_HEIGHT))
  panelAxes.forEach((axis) => panel.add(axis.object))

  const titles = [
    createLabel("立方体と投影面", TITLE_COLOR, TITLE_HEIGHT),
    createLabel("投影面に写った像", TITLE_COLOR, TITLE_HEIGHT)
  ]
  titles[0].sprite.position.set(-PANEL_OFFSET, TITLE_Y, 0)
  titles[1].sprite.position.set(PANEL_OFFSET, TITLE_Y, 0)
  titles.forEach((title) => scene.add(title.sprite))

  // 左の面だけをドラッグで回す。カメラを回すと右の面まで傾き、像の上の長さの比も角度も
  // 読めなくなるので、動かすのはこの Group だけにする
  const canvas = renderer.domElement
  let dragPointer: number | null = null
  let lastX = 0
  let lastY = 0

  const handlePointerDown = (event: PointerEvent) => {
    // 2 本目の指はピンチによるズーム。回転は取りやめて OrbitControls に任せる
    if (dragPointer !== null) {
      dragPointer = null
      return
    }
    // 起点が左半分のときだけ回す。右の面（像を正面から読む図）の上では反応させない
    const bounds = canvas.getBoundingClientRect()
    if (event.clientX - bounds.left > bounds.width / 2) return

    dragPointer = event.pointerId
    lastX = event.clientX
    lastY = event.clientY
    // canvas の外まで指が出ても動かし続けられるようにする（pointerup で自動的に解ける）
    canvas.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerId !== dragPointer) return

    // 横は投影面に垂直な軸まわり、縦は画面の横軸まわりに回す（回転の順は y のあとに x）
    setup.rotation.y = clamp(
      setup.rotation.y + (event.clientX - lastX) * DRAG_ROTATE_SPEED,
      SETUP_YAW_RANGE
    )
    setup.rotation.x = clamp(
      setup.rotation.x + (event.clientY - lastY) * DRAG_ROTATE_SPEED,
      SETUP_PITCH_RANGE
    )
    lastX = event.clientX
    lastY = event.clientY

    // 描画は要求されたときだけ走る。Tweakpane や OrbitControls を経由しない操作なので、
    // ここで次のフレームを頼む
    invalidate()
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId === dragPointer) dragPointer = null
  }

  canvas.addEventListener("pointerdown", handlePointerDown)
  canvas.addEventListener("pointermove", handlePointerMove)
  canvas.addEventListener("pointerup", handlePointerUp)
  canvas.addEventListener("pointercancel", handlePointerUp)

  const tip = new Vector3()

  return {
    update: () => {
      // 奥行き 1 に対して、像が投影面の上でどれだけずれるか。
      // 倍率 1 ならカバリエ図、0.5 ならキャビネット図になる
      const angle = MathUtils.degToRad(params.depthAngleDeg)
      const shiftX = params.depthScale * Math.cos(angle)
      const shiftY = params.depthScale * Math.sin(angle)

      CUBE_VERTICES.forEach(([x, y, z], i) => {
        // 斜投影の像は、投影面からの距離（z）に比例したずれを x・y に加えると求まる。
        // 投影面に接した面（z = 0）はずれを受けないので、形も大きさも変わらずに写る
        const imageX = x + z * shiftX
        const imageY = y + z * shiftY
        planeImage.vertices.setXYZ(i, imageX, imageY, 0)
        panelImage.vertices.setXYZ(i, imageX, imageY, 0)

        // 投射線は頂点から像へ結ぶ。どの頂点でも向きは同じ（互いに平行）だが、
        // 投影面とは直角に交わらない
        rayPosition.setXYZ(i * 2, x, y, z)
        rayPosition.setXYZ(i * 2 + 1, imageX, imageY, 0)

        // 像と同じずれを与えたまま投影面からの距離（z）を保つと、
        // 奥行き方向にスキューさせた形状になる。垂直に下ろすと同じ像に重なる
        skewedVertices.setXYZ(i, imageX, imageY, z)
      })
      planeImage.vertices.needsUpdate = true
      panelImage.vertices.needsUpdate = true
      rayPosition.needsUpdate = true
      skewedVertices.needsUpdate = true

      skewed.visible = params.showSkewed

      // 像の上の 3 軸。投影面に平行な x 軸・y 軸は向きも長さも変わらず、
      // 投影面に垂直な z 軸だけが斜めに倒れて、倍率のぶんだけ短くなる
      AXIS_DIRECTIONS.forEach(([x, y, z], i) => {
        panelAxes[i].setTip(tip.set(x + z * shiftX, y + z * shiftY, 0).multiplyScalar(AXIS_LENGTH))
      })

      // 投射線が投影面となす角。奥行き 1 に対して像が倍率のぶんだけずれるので、
      // 傾きは atan(1 / 倍率) で決まる。倍率 1（カバリエ図）でちょうど 45 度になる
      const rayAngleDeg = MathUtils.radToDeg(Math.atan2(1, params.depthScale))
      params.rayAngle = `${Math.round(rayAngleDeg)}°`
    },
    dispose: () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerup", handlePointerUp)
      canvas.removeEventListener("pointercancel", handlePointerUp)

      const disposables = [
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        shape.geometry,
        shape.material,
        rayGeometry,
        rayMaterial,
        skewedGeometry,
        skewedMaterial,
        skewedEdgeGeometry,
        skewedEdgeMaterial,
        planeImage.geometry,
        planeImage.material,
        panelImage.geometry,
        panelImage.material,
        circleGeometry,
        circleMaterial,
        ...titles.flatMap((title) => [title.texture, title.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
      ;[...spaceAxes, ...panelAxes].forEach((axis) => axis.dispose())
    }
  }
}
