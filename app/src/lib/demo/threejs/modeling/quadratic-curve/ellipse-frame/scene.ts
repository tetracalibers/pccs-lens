import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type EllipseFrameParams = {
  /** 楕円の中心を原点からずらす量 */
  centerX: number
  centerY: number
  /** 楕円を中心のまわりに回した角度（度） */
  angleDeg: number
  /** 楕円上の点を選ぶ角度（度） */
  pointDeg: number
  /** scene.ts が計算して書き戻す、X・Y を x と y で表した 1 次式 */
  substitutedX: string
  substitutedY: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: EllipseFrameParams
}

/** 楕円の、対称軸方向の半径。標準形の a と b にあたる */
const RADIUS_X = 1.5
const RADIUS_Y = 0.9

/** 座標軸を原点から正負どちらへも伸ばす長さ。この範囲が初期表示で収まるようにカメラを置く */
const AXIS_HALF_X = 3.6
const AXIS_HALF_Y = 2.5

/** 格子の間隔と、原点から数えた本数。1 目盛りが 1 */
const GRID_STEP = 1
const GRID_COUNT_X = 3
const GRID_COUNT_Y = 2

/** 格子の線の薄さ。座標の目安であって主役ではない */
const GRID_OPACITY = 0.3

/** 楕円を描く折れ線の分割数 */
const ELLIPSE_SEGMENTS = 128

/** 対称軸にとった軸を、中心から正負どちらへも伸ばす長さ。楕円より少し外まで出す */
const FRAME_HALF_X = RADIUS_X + 0.6
const FRAME_HALF_Y = RADIUS_Y + 0.6

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** 楕円上に選んだ点を示す球の半径 */
const POINT_RADIUS = 0.08

/** 座標を読み取る線の薄さ。軸や楕円より控えめにする */
const READING_OPACITY = 0.6

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.3

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 係数がこれより小さい項は、式から落とす */
const FORMAT_EPSILON = 0.005

/**
 * xy 平面に重なる要素を、奥から手前へ少しだけ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_AXIS = -0.01
const LAYER_START = 0
const LAYER_READING = 0.01
const LAYER_FRAME_AXIS = 0.015
const LAYER_ELLIPSE = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、2 組の座標軸・楕円・読み取りの線が見分けられる色にする。
// 座標軸の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const FRAME_X_COLOR = "#b79cf5"
const FRAME_Y_COLOR = "#5ec8f2"
const GRID_COLOR = "#9aa3b0"
const START_COLOR = "#6d7f96"
const ELLIPSE_COLOR = "#ffc857"
const POINT_COLOR = "#f57fc4"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
 */
const createLabel = (text: string, color: string) => {
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
  sprite.scale.set((LABEL_HEIGHT * canvas.width) / canvas.height, LABEL_HEIGHT, 1)

  return { sprite, texture, material }
}

/** 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string, color: string, direction: Vector3, half: number, z: number) => {
  const group = new Group()
  group.position.z = z

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-half),
    direction.clone().multiplyScalar(half)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(half)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  // ラベルは軸と一緒に動くが、Sprite は常にカメラを向くので文字は傾かない
  const label = createLabel(name, color)
  label.sprite.position.copy(direction).multiplyScalar(half + LABEL_OFFSET)
  label.sprite.position.z = LAYER_LABEL - z
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

/** 座標を読み取る目安になる格子。軸を伸ばした範囲いっぱいに引く */
const createGrid = () => {
  const points: Vector3[] = []

  for (let i = -GRID_COUNT_X; i <= GRID_COUNT_X; i++) {
    points.push(
      new Vector3(i * GRID_STEP, -AXIS_HALF_Y, LAYER_GRID),
      new Vector3(i * GRID_STEP, AXIS_HALF_Y, LAYER_GRID)
    )
  }
  for (let i = -GRID_COUNT_Y; i <= GRID_COUNT_Y; i++) {
    points.push(
      new Vector3(-AXIS_HALF_X, i * GRID_STEP, LAYER_GRID),
      new Vector3(AXIS_HALF_X, i * GRID_STEP, LAYER_GRID)
    )
  }

  const geometry = new BufferGeometry().setFromPoints(points)
  const material = new LineBasicMaterial({
    color: GRID_COLOR,
    transparent: true,
    opacity: GRID_OPACITY
  })

  return {
    object: new LineSegments(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 点から軸へ下ろす線。どちらの端も動くので、座標だけ書き換える */
const createReadingLine = (color: string) => {
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({
    color,
    transparent: true,
    opacity: READING_OPACITY
  })
  const line = new LineSegments(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    set: (fromX: number, fromY: number, toX: number, toY: number) => {
      positions.setXYZ(0, fromX, fromY, LAYER_READING)
      positions.setXYZ(1, toX, toY, LAYER_READING)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 係数が 0 の項を落とし、係数が 1 のときは数を省いて、x と y の 1 次式を読める形にする */
const formatLinear = (coefficientX: number, coefficientY: number, constant: number) => {
  let text = ""

  const append = (value: number, symbol: string) => {
    if (Math.abs(value) < FORMAT_EPSILON) return
    const size = Math.abs(value)
    const sign = value < 0 ? "-" : text === "" ? "" : "+"
    const isUnit = symbol !== "" && Math.abs(size - 1) < FORMAT_EPSILON
    text += sign + (isUnit ? symbol : size.toFixed(2) + symbol)
  }

  append(coefficientX, "x")
  append(coefficientY, "y")
  append(constant, "")

  return text === "" ? "0" : text
}

export const createEllipseFrameScene = ({ scene, params }: SceneContext) => {
  const grid = createGrid()
  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, AXIS_HALF_X, LAYER_AXIS),
    createAxis("y", Y_COLOR, Y_DIRECTION, AXIS_HALF_Y, LAYER_AXIS)
  ]
  scene.add(grid.object, ...axes.map((axis) => axis.object))

  // 標準形の楕円。中心が原点、対称軸が座標軸に重なった置き方にあたる
  const ellipsePoints: Vector3[] = []
  for (let i = 0; i < ELLIPSE_SEGMENTS; i++) {
    const angle = (i / ELLIPSE_SEGMENTS) * Math.PI * 2
    ellipsePoints.push(new Vector3(RADIUS_X * Math.cos(angle), RADIUS_Y * Math.sin(angle), 0))
  }
  const ellipseGeometry = new BufferGeometry().setFromPoints(ellipsePoints)

  // 動かす前の置き方を薄く残して、どれだけずれたかを見比べられるようにする
  const startMaterial = new LineBasicMaterial({ color: START_COLOR })
  const startEllipse = new LineLoop(ellipseGeometry, startMaterial)
  startEllipse.position.z = LAYER_START
  scene.add(startEllipse)

  // 楕円に貼りついた座標系。中心を原点、対称軸を軸にとると、この中では楕円は標準形のまま
  const frame = new Group()
  scene.add(frame)

  const ellipseMaterial = new LineBasicMaterial({ color: ELLIPSE_COLOR })
  const ellipse = new LineLoop(ellipseGeometry, ellipseMaterial)
  ellipse.position.z = LAYER_ELLIPSE
  frame.add(ellipse)

  const frameAxes = [
    createAxis("X", FRAME_X_COLOR, X_DIRECTION, FRAME_HALF_X, LAYER_FRAME_AXIS),
    createAxis("Y", FRAME_Y_COLOR, Y_DIRECTION, FRAME_HALF_Y, LAYER_FRAME_AXIS)
  ]
  frame.add(...frameAxes.map((axis) => axis.object))

  // 楕円上に選んだ 1 点。X・Y の読みは楕円と一緒に動くので、貼りついた座標系の中に置く
  const pointGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const pointMaterial = new MeshBasicMaterial({ color: POINT_COLOR })
  const point = new Mesh(pointGeometry, pointMaterial)
  frame.add(point)

  // 同じ 1 点を 2 通りに読む。X・Y は貼りついた座標系の中、x・y は画面の座標系の中で読む
  const readingX = createReadingLine(FRAME_X_COLOR)
  const readingY = createReadingLine(FRAME_Y_COLOR)
  frame.add(readingX.object, readingY.object)

  const readingScreenX = createReadingLine(X_COLOR)
  const readingScreenY = createReadingLine(Y_COLOR)
  scene.add(readingScreenX.object, readingScreenY.object)

  return {
    update: () => {
      const angle = (params.angleDeg * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      frame.position.set(params.centerX, params.centerY, 0)
      frame.rotation.z = angle

      // 楕円のパラメータ形式。貼りついた座標系での読みが (X, Y) になる
      const phi = (params.pointDeg * Math.PI) / 180
      const localX = RADIUS_X * Math.cos(phi)
      const localY = RADIUS_Y * Math.sin(phi)
      point.position.set(localX, localY, LAYER_POINT)
      readingX.set(localX, localY, localX, 0)
      readingY.set(localX, localY, 0, localY)

      // 同じ点を画面の座標系で読んだ値
      const screenX = params.centerX + localX * cos - localY * sin
      const screenY = params.centerY + localX * sin + localY * cos
      readingScreenX.set(screenX, screenY, screenX, 0)
      readingScreenY.set(screenX, screenY, 0, screenY)

      // 逆に、画面の座標系での読み (x, y) から X・Y を求める式。
      // 中心を戻してから回転を戻すので、X も Y も x と y の 1 次式になる
      params.substitutedX = formatLinear(cos, sin, -(params.centerX * cos + params.centerY * sin))
      params.substitutedY = formatLinear(-sin, cos, params.centerX * sin - params.centerY * cos)
    },
    dispose: () => {
      const disposables = [
        ellipseGeometry,
        startMaterial,
        ellipseMaterial,
        pointGeometry,
        pointMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      grid.dispose()
      axes.forEach((axis) => axis.dispose())
      frameAxes.forEach((axis) => axis.dispose())
      readingX.dispose()
      readingY.dispose()
      readingScreenX.dispose()
      readingScreenY.dispose()
    }
  }
}
