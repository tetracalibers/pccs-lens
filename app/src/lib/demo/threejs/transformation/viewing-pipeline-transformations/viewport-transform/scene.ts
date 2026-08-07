import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ。長さはすべて画面の画素数で数える */
export type ViewportTransformParams = {
  /** ビューポートの幅 */
  width: number
  /** ビューポートの高さ */
  height: number
  /** 画面の左端からビューポートの左端までの距離 */
  x: number
  /** 画面の上端からビューポートの上端までの距離 */
  y: number
  /** ビューポート変換で y 軸の向きを入れ替えるか */
  flipY: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ViewportTransformParams
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

/** 稜線でつないだ線 1 本ぶん。ビューポートが変わるたびに作り直す */
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

/** 投影変換までを行うカメラ。ここまでの段はこのデモの主題ではないので、置き方は固定する */
const CAMERA_POSITION = new Vector3(2.46, 1.33, 2.46)
const TARGET = new Vector3(0, 0.4, 0)
const FOV = 45
/** 画像に写す範囲の縦横比。ビューポートの縦横比がこれと食い違うと、像が引き伸ばされる */
const ASPECT = 1.5
const NEAR = 1
const FAR = 8

/** 正規化デバイス座標系の断面（-1〜1 の正方形）の 4 隅。左下から反時計回りに並べる */
const SQUARE_CORNERS: [number, number, number][] = [
  [-1, -1, 0],
  [1, -1, 0],
  [1, 1, 0],
  [-1, 1, 0]
]

/** 正方形の 4 辺のうち、上の辺（y が 1 の辺）以外の 3 辺 */
const SQUARE_EDGES = [0, 1, 1, 2, 3, 0]

/** 上の辺。ビューポートのどちら側へ移るかが分かるように、色を変えて描く */
const TOP_EDGE = [2, 3]

/** 画面の大きさ（画素数） */
const SCREEN_WIDTH = 640
const SCREEN_HEIGHT = 400

/** 画面の 4 隅（デバイス座標系での座標）と、その稜線 */
const SCREEN_CORNERS: [number, number, number][] = [
  [0, 0, 0],
  [SCREEN_WIDTH, 0, 0],
  [SCREEN_WIDTH, SCREEN_HEIGHT, 0],
  [0, SCREEN_HEIGHT, 0]
]
const RECT_EDGES = [0, 1, 1, 2, 2, 3, 3, 0]

/** 正規化デバイス座標系の断面を描く位置（正方形の中心） */
const NDC_CENTER = new Vector3(-2.4, 0, 0)

/** 画面を描く位置（左上の隅、つまりデバイス座標の原点）と、画素数を表示上の長さに直す倍率 */
const SCREEN_ORIGIN = new Vector3(0.2, 1, 0)
const DISPLAY_SCALE = 0.005

/** 軸を原点から伸ばす長さ。断面の側は正方形の外まで、画面の側は左上の隅から短く伸ばす */
const NDC_AXIS_LENGTH = 1.25
const SCREEN_AXIS_LENGTH = 0.9

/** 矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.16

/** 軸名のラベルの高さ（表示上の大きさ）と、矢印の先からさらに離す距離 */
const AXIS_LABEL_HEIGHT = 0.28
const LABEL_OFFSET = 0.24

/** 見出しのラベルの高さと、2 つの見出しを置く高さ */
const TITLE_HEIGHT = 0.34
const TITLE_HEIGHT_Y = 2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・像・枠が見分けられる色にする。
// 軸と物体の色は、パイプラインのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
/** 上の辺の色。正規化デバイス座標系の側とビューポートの側で同じ色にする */
const TOP_EDGE_COLOR = "#5ec8f2"
/** 正規化デバイス座標系の断面と、ビューポートの枠 */
const FRAME_COLOR = "#8fa3bf"
/** 画面の枠。ビューポートより控えめにする */
const SCREEN_COLOR = "#667486"
const TITLE_COLOR = "#e8e8ee"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「デバイス座標系」のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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
 * 原点から 1 方向だけへ伸ばす軸。
 * 断面は中心が原点で y が上向き、画面は左上の隅が原点で y が下向きになる
 */
const createArrow = (name: string, color: string, from: Vector3, to: Vector3) => {
  const group = new Group()
  const direction = to.clone().sub(from).normalize()

  const lineGeometry = new BufferGeometry().setFromPoints([from, to])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(to)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(to).addScaledVector(direction, LABEL_OFFSET)
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

/**
 * モデリング変換行列。拡大/縮小と回転はどちらも原点を中心とする変換なので、
 * 物体が原点にあるうちに大きさと向きを決め、最後の平行移動で置き場所へ運ぶ
 */
const createModelingMatrix = ({ scale, rotationY, position }: Placement) =>
  new Matrix4()
    .makeTranslation(...position)
    .multiply(new Matrix4().makeRotationY(MathUtils.degToRad(rotationY)))
    .multiply(new Matrix4().makeScale(scale, scale, scale))

/**
 * ビューポート変換行列。正規化デバイス座標（-1〜1）を、ビューポートの中に収まる位置へ移す。
 * 中身は、ビューポートの大きさに合わせた拡大/縮小と、ビューポートの位置への平行移動。
 * y 軸を反転する環境では、拡大/縮小の y 方向の倍率が負になる
 */
const createViewportMatrix = ({ x, y, width, height, flipY }: ViewportTransformParams) =>
  new Matrix4()
    .makeTranslation(x + width / 2, y + height / 2, 0)
    .multiply(new Matrix4().makeScale(width / 2, flipY ? -height / 2 : height / 2, 1))

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

const squareCorners = SQUARE_CORNERS.map(([x, y, z]) => new Vector3(x, y, z))
const screenCorners = SCREEN_CORNERS.map(([x, y, z]) => new Vector3(x, y, z))

/** 正規化デバイス座標系の断面を、左側に置いて描くための変換 */
const NDC_DISPLAY = new Matrix4().makeTranslation(NDC_CENTER.x, NDC_CENTER.y, NDC_CENTER.z)

/**
 * デバイス座標系を、右側に画面として置いて描くための変換。
 * デバイス座標系は y が下向きなので、描くときだけ y の向きを戻す（表示のための変換）
 */
const SCREEN_DISPLAY = new Matrix4()
  .makeScale(DISPLAY_SCALE, -DISPLAY_SCALE, 1)
  .setPosition(SCREEN_ORIGIN)

/**
 * 投影変換までを済ませた頂点を、正規化デバイス座標で求める。
 * 画像の上での位置を決めるのに使うのは x 座標と y 座標だけなので、z は落としておく
 */
const createNdcVertices = () => {
  const camera = new PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  camera.position.copy(CAMERA_POSITION)
  camera.lookAt(TARGET)
  camera.updateMatrixWorld()

  return PLACEMENTS.map((placement) => {
    const modeling = createModelingMatrix(placement)
    return HOUSE_VERTICES.map(([x, y, z]) => {
      const ndc = new Vector3(x, y, z).applyMatrix4(modeling).project(camera)
      return new Vector3(ndc.x, ndc.y, 0)
    })
  })
}

export const createViewportTransformScene = ({ scene, params }: SceneContext) => {
  const ndcVertices = createNdcVertices()

  // 左に正規化デバイス座標系の断面、右に画面を置く。どちらも動かない
  const statics = [
    createWireframe(squareCorners, NDC_DISPLAY, SQUARE_EDGES, FRAME_COLOR),
    createWireframe(squareCorners, NDC_DISPLAY, TOP_EDGE, TOP_EDGE_COLOR),
    ...ndcVertices.map((vertices, i) =>
      createWireframe(vertices, NDC_DISPLAY, HOUSE_EDGES, PLACEMENTS[i].color)
    ),
    createWireframe(screenCorners, SCREEN_DISPLAY, RECT_EDGES, SCREEN_COLOR)
  ]
  statics.forEach((wireframe) => scene.add(wireframe))

  // 断面は中心が原点で y が上向き、画面は左上の隅が原点で y が下向き
  const ndcAxisX = NDC_CENTER.clone().setX(NDC_CENTER.x + NDC_AXIS_LENGTH)
  const ndcAxisY = NDC_CENTER.clone().setY(NDC_CENTER.y + NDC_AXIS_LENGTH)
  const screenAxisX = SCREEN_ORIGIN.clone().setX(SCREEN_ORIGIN.x + SCREEN_AXIS_LENGTH)
  const screenAxisY = SCREEN_ORIGIN.clone().setY(SCREEN_ORIGIN.y - SCREEN_AXIS_LENGTH)
  const arrows = [
    createArrow("x", X_COLOR, NDC_CENTER, ndcAxisX),
    createArrow("y", Y_COLOR, NDC_CENTER, ndcAxisY),
    createArrow("x", X_COLOR, SCREEN_ORIGIN, screenAxisX),
    createArrow("y", Y_COLOR, SCREEN_ORIGIN, screenAxisY)
  ]
  arrows.forEach((arrow) => scene.add(arrow.object))

  const titles = [
    createLabel("正規化デバイス座標系", TITLE_COLOR, TITLE_HEIGHT),
    createLabel("デバイス座標系", TITLE_COLOR, TITLE_HEIGHT)
  ]
  titles[0].sprite.position.set(NDC_CENTER.x, TITLE_HEIGHT_Y, 0)
  titles[1].sprite.position.set(
    SCREEN_ORIGIN.x + (SCREEN_WIDTH * DISPLAY_SCALE) / 2,
    TITLE_HEIGHT_Y,
    0
  )
  titles.forEach((title) => scene.add(title.sprite))

  // ビューポートと、その中に写る像はビューポートが変わるたびに作り直す
  let built: Wireframe[] = []
  const replaceBuilt = (wireframes: Wireframe[]) => {
    built.forEach((wireframe) => {
      wireframe.removeFromParent()
      wireframe.geometry.dispose()
      wireframe.material.dispose()
    })
    built = wireframes
  }

  // ビューポートが変わったときだけ作り直す（カメラを動かしただけでは作り直さない）
  let builtKey = ""

  return {
    update: () => {
      const key = `${params.x} ${params.y} ${params.width} ${params.height} ${params.flipY}`
      if (key === builtKey) return
      builtKey = key

      // 正規化デバイス座標をビューポートの中へ移し、それを画面として描く位置に直す
      const viewport = createViewportMatrix(params)
      const matrix = new Matrix4().multiplyMatrices(SCREEN_DISPLAY, viewport)

      const wireframes = [
        createWireframe(squareCorners, matrix, SQUARE_EDGES, FRAME_COLOR),
        createWireframe(squareCorners, matrix, TOP_EDGE, TOP_EDGE_COLOR),
        ...ndcVertices.map((vertices, i) =>
          createWireframe(vertices, matrix, HOUSE_EDGES, PLACEMENTS[i].color)
        )
      ]
      wireframes.forEach((wireframe) => scene.add(wireframe))

      replaceBuilt(wireframes)
    },
    dispose: () => {
      replaceBuilt([])
      statics.forEach((wireframe) => {
        wireframe.geometry.dispose()
        wireframe.material.dispose()
      })
      arrows.forEach((arrow) => arrow.dispose())
      titles.forEach((title) => {
        title.texture.dispose()
        title.material.dispose()
      })
    }
  }
}
