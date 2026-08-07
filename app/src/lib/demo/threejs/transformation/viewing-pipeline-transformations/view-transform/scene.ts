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
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ViewTransformParams = {
  /** 注視点のまわりを回る角度（度） */
  azimuth: number
  /** 注視点を見下ろす角度（度） */
  elevation: number
  /** 注視点までの距離 */
  distance: number
  /** 視線を軸に上方向を傾ける角度（度） */
  roll: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ViewTransformParams
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

/** 稜線でつないだ線 1 本ぶん。カメラの置き方が変わるたびに作り直す */
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

/** ワールド座標系に並べる 3 体。同じ頂点データを、モデリング変換行列だけ変えて配置する */
const PLACEMENTS: Placement[] = [
  { scale: 0.55, rotationY: 25, position: [-0.62, 0, 0.15], color: "#ffc857" },
  { scale: 0.4, rotationY: -30, position: [0.5, 0, 0.35], color: "#f57fc4" },
  { scale: 0.7, rotationY: 8, position: [0.05, 0, -0.75], color: "#b79cf5" }
]

/**
 * カメラの形。カメラ座標系での座標で、視点が原点、視線が z 軸の負の向き。
 * 0 が視点、1〜4 が前方の四角形の隅、5 が上方向を示す三角形の先端
 */
const CAMERA_VERTICES: [number, number, number][] = [
  [0, 0, 0],
  [-0.3, -0.21, -0.5],
  [0.3, -0.21, -0.5],
  [0.3, 0.21, -0.5],
  [-0.3, 0.21, -0.5],
  [0, 0.4, -0.5]
]

/** カメラの形の稜線。結ぶ 2 頂点の番号を並べる */
const CAMERA_EDGES = [0, 1, 0, 2, 0, 3, 0, 4, 1, 2, 2, 3, 3, 4, 4, 1, 3, 5, 4, 5]

/** カメラが向く先。3 体の並びのおおよその中心に置く */
const TARGET = new Vector3(0, 0.4, 0)

/** 2 つの座標系を、原点から左右へ振り分ける距離 */
const GROUP_OFFSET = 2.6

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 1.5

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.16

/** 軸名のラベルの高さ（表示上の大きさ）と、矢印の先からさらに離す距離 */
const AXIS_LABEL_HEIGHT = 0.28
const LABEL_OFFSET = 0.24

/** 系の名前のラベルの高さ。見出しなので軸名より大きくする */
const TITLE_HEIGHT = 0.34

/** 系の名前を、y 軸の先からさらに離す距離 */
const TITLE_OFFSET = 0.7

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・物体・カメラ・系の名前が見分けられる色にする。
// 軸と物体の色は、パイプラインのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const CAMERA_COLOR = "#e8e8ee"
const TITLE_COLOR = "#e8e8ee"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「ワールド座標系」のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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
 * カメラの置き方を表す行列。視点の位置・視線の向き・上方向の 3 つから、
 * カメラ座標系の 3 本の軸を組み立てる
 */
const createPoseMatrix = ({ azimuth, elevation, distance, roll }: ViewTransformParams) => {
  const azimuthRad = MathUtils.degToRad(azimuth)
  const elevationRad = MathUtils.degToRad(elevation)

  // 視点の位置。注視点のまわりを、方位角・仰角・距離で回す
  const position = new Vector3(
    Math.cos(elevationRad) * Math.sin(azimuthRad),
    Math.sin(elevationRad),
    Math.cos(elevationRad) * Math.cos(azimuthRad)
  )
    .multiplyScalar(distance)
    .add(TARGET)

  // 右手系では視線が z 軸の負の向きになるので、視点から注視点へ向かう向きの逆を z 軸にとる
  const zAxis = position.clone().sub(TARGET).normalize()
  // 上方向。視線を軸に回すと、位置と向きが同じままでもカメラの置き方が変わる
  const up = new Vector3(0, 1, 0).applyAxisAngle(zAxis, MathUtils.degToRad(roll))
  // 上方向と z 軸の両方に直交する向きが x 軸で、そこから y 軸が決まる
  const xAxis = new Vector3().crossVectors(up, zAxis).normalize()
  const yAxis = new Vector3().crossVectors(zAxis, xAxis)

  // 3 本の軸を列に並べ、視点の位置を最後の列に置いたものが、カメラの置き方を表す行列になる
  return new Matrix4().makeBasis(xAxis, yAxis, zAxis).setPosition(position)
}

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
const cameraVertices = CAMERA_VERTICES.map(([x, y, z]) => new Vector3(x, y, z))
const modelingMatrices = PLACEMENTS.map(createModelingMatrix)

/** 1 つの座標系を、3 本の軸・系の名前・3 体の物体・カメラの組で作る */
const createSystem = (title: string, offsetX: number) => {
  const group = new Group()
  group.position.x = offsetX

  const axes = [
    createAxis("x", X_COLOR, new Vector3(1, 0, 0)),
    createAxis("y", Y_COLOR, new Vector3(0, 1, 0)),
    createAxis("z", Z_COLOR, new Vector3(0, 0, 1))
  ]
  group.add(...axes.map((axis) => axis.object))

  const label = createLabel(title, TITLE_COLOR, TITLE_HEIGHT)
  label.sprite.position.y = AXIS_LENGTH + TITLE_OFFSET
  group.add(label.sprite)

  // 物体とカメラはカメラの置き方が変わるたびに作り直すので、軸や名前とは分けておく
  const content = new Group()
  group.add(content)
  let built: Wireframe[] = []

  return {
    object: group,
    /**
     * この座標系へ移す行列（`systemMatrix`）を渡して、中身を置き直す。
     * 物体はモデリング変換で、カメラは置き方を表す行列（`pose`）で、それぞれ場面の中に置かれている
     */
    place: (systemMatrix: Matrix4, pose: Matrix4) => {
      built.forEach((wireframe) => {
        wireframe.geometry.dispose()
        wireframe.material.dispose()
      })
      content.clear()

      built = [
        ...PLACEMENTS.map((placement, i) =>
          createWireframe(
            houseVertices,
            new Matrix4().multiplyMatrices(systemMatrix, modelingMatrices[i]),
            HOUSE_EDGES,
            placement.color
          )
        ),
        createWireframe(
          cameraVertices,
          new Matrix4().multiplyMatrices(systemMatrix, pose),
          CAMERA_EDGES,
          CAMERA_COLOR
        )
      ]
      built.forEach((wireframe) => content.add(wireframe))
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      built.forEach((wireframe) => {
        wireframe.geometry.dispose()
        wireframe.material.dispose()
      })
      label.texture.dispose()
      label.material.dispose()
    }
  }
}

export const createViewTransformScene = ({ scene, params }: SceneContext) => {
  // ワールド座標系を左、カメラ座標系を右に並べる
  const worldSystem = createSystem("ワールド座標系", -GROUP_OFFSET)
  const cameraSystem = createSystem("カメラ座標系", GROUP_OFFSET)
  scene.add(worldSystem.object, cameraSystem.object)

  // カメラの置き方が変わったときだけ作り直す（カメラを回しただけでは作り直さない）
  let builtKey = ""

  return {
    update: () => {
      const key = `${params.azimuth} ${params.elevation} ${params.distance} ${params.roll}`
      if (key === builtKey) return
      builtKey = key

      // カメラの置き方（視点の位置・視線の向き・上方向）を表す行列
      const pose = createPoseMatrix(params)
      // 視野変換行列。カメラを置くために行った回転と平行移動を、ちょうど打ち消す逆行列
      const view = pose.clone().invert()

      // 同じ中身を、ワールド座標系ではそのまま、カメラ座標系では視野変換を掛けて置く
      worldSystem.place(new Matrix4(), pose)
      cameraSystem.place(view, pose)
    },
    dispose: () => {
      worldSystem.dispose()
      cameraSystem.dispose()
    }
  }
}
