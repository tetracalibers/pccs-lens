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

/** ビューイングパイプラインが経由する座標系 */
export type PipelineStage = "modeling" | "world" | "camera" | "projection" | "ndc"

/** Tweakpane で操作するパラメータ */
export type PipelineStagesParams = {
  /** どの座標系で見るか */
  stage: PipelineStage
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: PipelineStagesParams
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

/** 稜線でつないだ線 1 本ぶん。段が変わるたびに作り直す */
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

/** 直方体の稜線。結ぶ 2 隅の番号を並べる（前半の 4 つが近接面、後半の 4 つが遠方面） */
const BOX_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/** 正規化デバイス座標系の立方体（-1〜1）の 8 隅。並びは `BOX_EDGES` に合わせる */
const NDC_CORNERS: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1]
]

/** ワールド座標系に並べる 3 体。同じ頂点データを、モデリング変換行列だけ変えて配置する */
const PLACEMENTS: Placement[] = [
  { scale: 0.55, rotationY: 25, position: [-0.62, 0, 0.15], color: "#ffc857" },
  { scale: 0.4, rotationY: -30, position: [0.5, 0, 0.35], color: "#f57fc4" },
  { scale: 0.7, rotationY: 8, position: [0.05, 0, -0.75], color: "#b79cf5" }
]

/** 写す側のカメラ。この置き方から視野変換行列が、画角と前後の面から投影行列が決まる */
const SUBJECT_POSITION: [number, number, number] = [0, 1.1, 2.6]
const SUBJECT_TARGET: [number, number, number] = [0, 0.45, 0]
const SUBJECT_FOV = 34
/** 写す側のカメラの縦横比。デモを表示する canvas の縦横比とは関係なく固定する */
const SUBJECT_ASPECT = 1.5
const SUBJECT_NEAR = 0.8
const SUBJECT_FAR = 3.9

/**
 * 段ごとの表示倍率。座標系が変わると空間の広さも大きく変わるので、
 * 表示だけを一律に拡大縮小して枠に収める（座標値そのものは変えない）
 */
const VIEW_SCALE: Record<PipelineStage, number> = {
  modeling: 2.4,
  world: 1,
  camera: 1,
  projection: 1,
  ndc: 1.8
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 1.5

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.16

/** 軸名のラベルの高さ（表示上の大きさ）と、矢印の先からさらに離す距離 */
const AXIS_LABEL_HEIGHT = 0.28
const LABEL_OFFSET = 0.24

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・物体・カメラが写す範囲が見分けられる色にする。
// 軸の色は、座標系の記事のデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
/** モデリング座標系に置く、変換前の形状の色。どの物体のものでもないので無彩色にする */
const SHAPE_COLOR = "#e8e8ee"
/** カメラが写す範囲の色。中に置かれた物体より控えめにする */
const FRUSTUM_COLOR = "#8fa3bf"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 軸名は 1 文字だが、文字の幅を測って板の横幅を決める
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
 * 頂点に行列を掛けた位置で、稜線を結んだ線を作る。
 * `applyMatrix4` は同次座標の `w` で割るので、投影行列を含む段では透視除算まで済んだ座標になる
 */
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

export const createPipelineStagesScene = ({ scene, params }: SceneContext) => {
  // 3 本の軸は、いま見ている座標系そのものを表す。原点と向きが読み取れればよいので、
  // 段ごとの表示倍率（content）の外に置き、長さは変えない
  const axes = [
    createAxis("x", X_COLOR, new Vector3(1, 0, 0)),
    createAxis("y", Y_COLOR, new Vector3(0, 1, 0)),
    createAxis("z", Z_COLOR, new Vector3(0, 0, 1))
  ]
  scene.add(...axes.map((axis) => axis.object))

  const content = new Group()
  scene.add(content)

  // 写す側のカメラ。ここでは置き方を固定し、そこから決まる行列だけを使う
  const subject = new PerspectiveCamera(SUBJECT_FOV, SUBJECT_ASPECT, SUBJECT_NEAR, SUBJECT_FAR)
  subject.position.set(...SUBJECT_POSITION)
  subject.lookAt(...SUBJECT_TARGET)
  subject.updateMatrixWorld()

  // 視野変換。カメラを置くために行った回転と平行移動を、ちょうど打ち消す逆行列
  const view = subject.matrixWorld.clone().invert()

  // z 軸の反転。右手系のカメラ座標系を、視線が z 軸の正の向きになる左手系へ移す
  const zFlip = new Matrix4().makeScale(1, 1, -1)

  // 投影変換。three.js の投影行列は右手系のカメラ座標を前提にしているので、
  // 左手系に直した分（z 軸の反転）を打ち消してから掛ける
  const projection = new Matrix4().multiplyMatrices(subject.projectionMatrix, zFlip)

  // ワールド座標を、それぞれの段の座標系へ移す行列。手前の段の行列に順に掛け合わせていく
  const toCamera = view.clone()
  const toProjection = new Matrix4().multiplyMatrices(zFlip, toCamera)
  const toNdc = new Matrix4().multiplyMatrices(projection, toProjection)

  const stageMatrices: Record<Exclude<PipelineStage, "modeling">, Matrix4> = {
    world: new Matrix4(),
    camera: toCamera,
    projection: toProjection,
    ndc: toNdc
  }

  const houseVertices = HOUSE_VERTICES.map(([x, y, z]) => new Vector3(x, y, z))

  // カメラが写す範囲の 8 隅。正規化デバイス座標系の立方体の隅を逆投影すると、ワールド座標での隅になる
  const frustumCorners = NDC_CORNERS.map(([x, y, z]) => new Vector3(x, y, z).unproject(subject))

  // 段が変わるたびに作り直す。前の段のものは破棄する
  let built: Wireframe[] = []
  const rebuild = (wireframes: Wireframe[]) => {
    built.forEach((wireframe) => {
      wireframe.geometry.dispose()
      wireframe.material.dispose()
    })
    content.clear()
    wireframes.forEach((wireframe) => content.add(wireframe))
    built = wireframes
  }

  // 段が変わったときだけ作り直す（カメラを回しただけでは作り直さない）
  let builtStage: PipelineStage | null = null

  return {
    update: () => {
      const stage = params.stage
      if (stage === builtStage) return
      builtStage = stage

      content.scale.setScalar(VIEW_SCALE[stage])

      if (stage === "modeling") {
        // モデリング座標系にはまだ場面もカメラもない。3 体が共有している頂点データをそのまま置く
        rebuild([createWireframe(houseVertices, new Matrix4(), HOUSE_EDGES, SHAPE_COLOR)])
        return
      }

      const stageMatrix = stageMatrices[stage]
      rebuild([
        // 同じ頂点データを共有する 3 体。モデリング変換行列だけが違う
        ...PLACEMENTS.map((placement) =>
          createWireframe(
            houseVertices,
            new Matrix4().multiplyMatrices(stageMatrix, createModelingMatrix(placement)),
            HOUSE_EDGES,
            placement.color
          )
        ),
        // カメラが写す範囲。正規化デバイス座標系では -1〜1 の立方体に収まる
        createWireframe(frustumCorners, stageMatrix, BOX_EDGES, FRUSTUM_COLOR)
      ])
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      rebuild([])
    }
  }
}
