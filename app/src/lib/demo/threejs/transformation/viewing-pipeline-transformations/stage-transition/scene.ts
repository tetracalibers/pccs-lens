import {
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
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
type PipelineStage = "modeling" | "world" | "camera" | "projection" | "ndc"

/** 座標系と座標系のあいだの変換 */
export type TransitionStep = "modeling" | "view" | "projection"

/** Tweakpane で操作するパラメータ */
export type StageTransitionParams = {
  /** どの変換を見るか */
  step: TransitionStep
  /** 変換の進み具合。0 で変換前の座標系、1 で変換後の座標系 */
  progress: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: StageTransitionParams
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

/** 1 つの変換。変換前と変換後の座標系を結ぶ */
type Step = {
  key: TransitionStep
  /** 変換前の座標系 */
  from: PipelineStage
  /** 変換後の座標系 */
  to: PipelineStage
  /** 図の下に出す見出し */
  title: string
}

/** 段ごとの、線を引くための頂点位置 */
type StagePoints = {
  /** 3 体ぶん */
  houses: Vector3[][]
  /** カメラが写す範囲の 8 隅 */
  frustum: Vector3[]
}

/** 進み具合に応じて頂点位置を書き換える線 */
type MorphingWireframe = {
  lines: LineSegments<BufferGeometry, LineBasicMaterial>
  /** 書き換える位置。書き換えたら needsUpdate を立てる */
  position: Float32BufferAttribute
}

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

/**
 * 変換の並び。パイプラインを進む順に並べる。
 * カメラ座標系から投影座標系への z 軸の反転は入れない。右手系から左手系への
 * 移り変わりを連続的にたどると、途中で必ず形が平らに潰れる瞬間を通るため
 */
const STEPS: Step[] = [
  {
    key: "modeling",
    from: "modeling",
    to: "world",
    title: "モデリング座標系 → ワールド座標系"
  },
  { key: "view", from: "world", to: "camera", title: "ワールド座標系 → カメラ座標系" },
  {
    key: "projection",
    from: "projection",
    to: "ndc",
    title: "投影座標系 → 正規化デバイス座標系"
  }
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
 * 表示だけを一律に拡大縮小して枠に収める（座標値そのものは変えない）。
 * 変換の途中では、変換前の段と変換後の段の倍率のあいだを取る
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

/** 変換の見出しの高さと、置く高さ。中身と重ならないよう図の下に置く */
const TITLE_HEIGHT = 0.32
const TITLE_Y = -2.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・物体・カメラが写す範囲が見分けられる色にする。
// 軸と物体の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
/** モデリング座標系に置く、変換前の形状の色。どの物体のものでもないので無彩色にする */
const SHAPE_COLOR = "#e8e8ee"
/** カメラが写す範囲の色。中に置かれた物体より控えめにする */
const FRUSTUM_COLOR = "#8fa3bf"
const TITLE_COLOR = "#e8e8ee"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「モデリング座標系 → ワールド座標系」のような長いラベルもあるので、文字の幅を測って板の横幅を決める
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
 * 頂点に行列を掛けた位置を求める。
 * `applyMatrix4` は同次座標の `w` で割るので、投影行列を含む段では透視除算まで済んだ座標になる
 */
const transformPoints = (vertices: Vector3[], matrix: Matrix4) =>
  vertices.map((vertex) => vertex.clone().applyMatrix4(matrix))

/**
 * 頂点位置を書き換えながら使う線。稜線のつなぎ方と色だけを先に決めておき、
 * 位置は変換の進み具合に応じて入れ直す
 */
const createMorphingWireframe = (
  vertexCount: number,
  edges: number[],
  color: string
): MorphingWireframe => {
  const position = new Float32BufferAttribute(vertexCount * 3, 3)
  // 中身を何度も書き換えることを three.js に伝えておく
  position.setUsage(DynamicDrawUsage)

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", position)
  geometry.setIndex(edges)

  const lines = new LineSegments(geometry, new LineBasicMaterial({ color }))
  // 頂点が動き回るので、生成時に求めた境界球で視錐台カリングを判断させない
  lines.frustumCulled = false

  return { lines, position }
}

/**
 * 変換前の位置と変換後の位置を、進み具合で混ぜて線に書き込む。
 * 途中の位置は 2 つの座標系を見比べるための見せかけで、そこに座標系があるわけではない
 */
const morphWireframe = (
  wireframe: MorphingWireframe,
  from: Vector3[],
  to: Vector3[],
  progress: number
) => {
  const point = new Vector3()
  from.forEach((start, i) => {
    point.lerpVectors(start, to[i], progress)
    wireframe.position.setXYZ(i, point.x, point.y, point.z)
  })
  wireframe.position.needsUpdate = true
}

export const createStageTransitionScene = ({ scene, params }: SceneContext) => {
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

  // 3 体が共有する 1 つの頂点データと、体ごとに違うモデリング変換行列
  const houseVertices = HOUSE_VERTICES.map(([x, y, z]) => new Vector3(x, y, z))
  const modelingMatrices = PLACEMENTS.map(createModelingMatrix)

  // カメラが写す範囲の 8 隅。正規化デバイス座標系の立方体の隅を逆投影すると、ワールド座標での隅になる
  const frustumCorners = NDC_CORNERS.map(([x, y, z]) => new Vector3(x, y, z).unproject(subject))

  // ワールド座標をその段の座標系へ移す行列から、その段での頂点位置を求める
  const pointsAt = (stageMatrix: Matrix4): StagePoints => ({
    houses: modelingMatrices.map((modeling) =>
      transformPoints(houseVertices, new Matrix4().multiplyMatrices(stageMatrix, modeling))
    ),
    frustum: transformPoints(frustumCorners, stageMatrix)
  })

  const stagePoints: Record<PipelineStage, StagePoints> = {
    // モデリング座標系にあるのは、3 体が共有している 1 つの形状データ。
    // カメラが写す範囲はワールド座標系のもので、モデリング変換では動かない（現れるだけ）
    modeling: {
      houses: modelingMatrices.map(() => houseVertices),
      frustum: frustumCorners
    },
    world: pointsAt(new Matrix4()),
    camera: pointsAt(toCamera),
    projection: pointsAt(toProjection),
    ndc: pointsAt(toNdc)
  }

  const houses = PLACEMENTS.map((placement) =>
    createMorphingWireframe(HOUSE_VERTICES.length, HOUSE_EDGES, placement.color)
  )
  const frustum = createMorphingWireframe(NDC_CORNERS.length, BOX_EDGES, FRUSTUM_COLOR)
  // カメラが写す範囲は、モデリング変換のあいだに現れる
  frustum.lines.material.transparent = true
  content.add(...houses.map((house) => house.lines), frustum.lines)

  // 形状データの色から各体の色へ移すために、色も混ぜられる形で持っておく
  const shapeColor = new Color(SHAPE_COLOR)
  const placementColors = PLACEMENTS.map((placement) => new Color(placement.color))

  // 変換の見出し。4 つとも作っておき、選ばれているものだけを見せる
  const titles = STEPS.map((step) => {
    const label = createLabel(step.title, TITLE_COLOR, TITLE_HEIGHT)
    label.sprite.position.y = TITLE_Y
    label.sprite.visible = false
    scene.add(label.sprite)
    return { key: step.key, ...label }
  })

  // 変換か進み具合が変わったときだけ置き直す（カメラを回しただけでは置き直さない）
  let builtKey = ""

  return {
    update: () => {
      const key = `${params.step} ${params.progress}`
      if (key === builtKey) return
      builtKey = key

      const step = STEPS.find((candidate) => candidate.key === params.step) ?? STEPS[0]
      const progress = params.progress
      const before = stagePoints[step.from]
      const after = stagePoints[step.to]

      // 表示倍率も、変換前の段と変換後の段のあいだを取る（座標値そのものは変えない）
      content.scale.setScalar(MathUtils.lerp(VIEW_SCALE[step.from], VIEW_SCALE[step.to], progress))

      houses.forEach((house, i) => {
        morphWireframe(house, before.houses[i], after.houses[i], progress)
        // モデリング座標系にあるのは 3 体に共有された 1 つの形状データなので、
        // 3 体に分かれていくにつれて、無彩色から体ごとの色へ移す
        const separation = step.key === "modeling" ? progress : 1
        house.lines.material.color.copy(shapeColor).lerp(placementColors[i], separation)
      })

      morphWireframe(frustum, before.frustum, after.frustum, progress)
      frustum.lines.material.opacity = step.key === "modeling" ? progress : 1

      titles.forEach((title) => {
        title.sprite.visible = title.key === step.key
      })
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      houses.concat(frustum).forEach((wireframe) => {
        wireframe.lines.geometry.dispose()
        wireframe.lines.material.dispose()
      })
      titles.forEach((title) => {
        title.texture.dispose()
        title.material.dispose()
      })
    }
  }
}
