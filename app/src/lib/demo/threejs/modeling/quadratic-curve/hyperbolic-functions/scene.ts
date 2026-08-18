import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
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
export type HyperbolicFunctionsParams = {
  /** 双曲線関数に渡すパラメータ */
  t: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  cosh: string
  sinh: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: HyperbolicFunctionsParams
}

/** t を動かせる範囲。実数全体のうち、画面に収まるところを切り取っている */
const T_MAX = 2

/** 標準形の a と b */
const RADIUS_A = 1
const RADIUS_B = 0.8

/** 左のグラフを置く位置と、右の双曲線を置く位置 */
const GRAPH_CENTER_X = -2.4
const CURVE_CENTER_X = 2.4

/** グラフの目盛り。t と値の 1 単位あたりのワールド座標 */
const GRAPH_SCALE_T = 0.7
const GRAPH_SCALE_VALUE = 0.42

/** 双曲線の側の目盛り。1 単位あたりのワールド座標 */
const CURVE_SCALE = 0.5

/** グラフの縦軸が覆う値の範囲。cosh・sinh が t = ±2 でとる値まで入る */
const VALUE_MAX = 4

/** 軸を、目盛りの端からさらに伸ばす長さ（矢印を置くぶん） */
const AXIS_MARGIN = 0.32

/** 曲線を描く折れ線の分割数 */
const CURVE_SEGMENTS = 160

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.18

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.26

/** 今の t に対応する点を示す球の半径 */
const POINT_RADIUS = 0.075

/** 補助の線の薄さ。軸や曲線より控えめにする */
const HELPER_OPACITY = 0.55

/** 格子の線の薄さ。座標の目安であって主役ではない */
const GRID_OPACITY = 0.28

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.28
const ANNOTATION_LABEL_HEIGHT = 0.26

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しだけ振り分ける z。
 * とくに双曲線と辿った跡は同じ曲線上に重なるので、前後を決めないと描画が競合する。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_AXIS = -0.01
const LAYER_HELPER = 0
const LAYER_CURVE = 0.01
const LAYER_TRACE = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、2 つの図が互いに見分けられる色にする。
// cosh は x の色、sinh は y の色にして、グラフの値がどちらの座標になるかを色で対応づける
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const GRID_COLOR = "#9aa3b0"
const HELPER_COLOR = "#c9d2de"
const CURVE_COLOR = "#6d7f96"
const TRACE_COLOR = "#ffc857"
const MARKER_COLOR = "#f57fc4"

/** cosh t = (eᵗ + e⁻ᵗ) / 2 */
const cosh = (t: number) => (Math.exp(t) + Math.exp(-t)) / 2

/** sinh t = (eᵗ − e⁻ᵗ) / 2 */
const sinh = (t: number) => (Math.exp(t) - Math.exp(-t)) / 2

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
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

  return {
    sprite,
    texture,
    material,
    dispose: () => {
      texture.dispose()
      material.dispose()
    }
  }
}

/** 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string | null, color: string, direction: Vector3, half: number) => {
  const group = new Group()
  group.position.z = LAYER_AXIS
  const disposables: { dispose: () => void }[] = []

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-half),
    direction.clone().multiplyScalar(half)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))
  disposables.push(lineGeometry, lineMaterial)

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(half)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)
  disposables.push(arrowGeometry, arrowMaterial)

  // 曲線に名前を付けてある図では、軸そのものに名前を置かないこともある
  if (name !== null) {
    const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
    label.sprite.position.copy(direction).multiplyScalar(half + LABEL_OFFSET)
    label.sprite.position.z = LAYER_LABEL - LAYER_AXIS
    group.add(label.sprite)
    disposables.push(label)
  }

  return {
    object: group,
    dispose: () => disposables.forEach((disposable) => disposable.dispose())
  }
}

/** 座標を読み取る目安になる格子。軸を伸ばした範囲いっぱいに引く */
const createGrid = (halfX: number, halfY: number, spacingX: number, spacingY: number) => {
  const points: Vector3[] = []

  const countX = Math.floor(halfX / spacingX)
  for (let i = -countX; i <= countX; i++) {
    points.push(
      new Vector3(i * spacingX, -halfY, LAYER_GRID),
      new Vector3(i * spacingX, halfY, LAYER_GRID)
    )
  }

  const countY = Math.floor(halfY / spacingY)
  for (let i = -countY; i <= countY; i++) {
    points.push(
      new Vector3(-halfX, i * spacingY, LAYER_GRID),
      new Vector3(halfX, i * spacingY, LAYER_GRID)
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

/**
 * t を刻んで点を並べた折れ線。頂点数は固定して、t の刻み幅だけを変えられるようにする。
 * `toPoint` は t からワールド座標を返す
 */
const createParametricCurve = (
  color: string,
  z: number,
  toPoint: (t: number, target: Vector3) => Vector3
) => {
  const positions = new Float32BufferAttribute(new Float32Array((CURVE_SEGMENTS + 1) * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new Line(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  const point = new Vector3()

  const set = (from: number, to: number) => {
    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
      toPoint(from + (to - from) * (i / CURVE_SEGMENTS), point)
      positions.setXYZ(i, point.x, point.y, z)
    }
    positions.needsUpdate = true
  }

  return {
    object: line,
    set,
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 両端が動く 1 本の線分 */
const createSegment = (color: string, opacity: number) => {
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  const line = new LineSegments(geometry, material)
  line.frustumCulled = false

  return {
    object: line,
    set: (fromX: number, fromY: number, toX: number, toY: number) => {
      positions.setXYZ(0, fromX, fromY, LAYER_HELPER)
      positions.setXYZ(1, toX, toY, LAYER_HELPER)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 今の t に対応する点を示す球 */
const createMarker = (color: string) => {
  const geometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const material = new MeshBasicMaterial({ color })
  return {
    object: new Mesh(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createHyperbolicFunctionsScene = ({ scene, params }: SceneContext) => {
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item)
    return item
  }

  // 左：t を横軸にとった cosh t と sinh t のグラフ
  const graph = new Group()
  graph.position.x = GRAPH_CENTER_X
  scene.add(graph)

  const graphHalfT = T_MAX * GRAPH_SCALE_T + AXIS_MARGIN
  const graphHalfValue = VALUE_MAX * GRAPH_SCALE_VALUE + AXIS_MARGIN

  graph.add(track(createGrid(graphHalfT, graphHalfValue, GRAPH_SCALE_T, GRAPH_SCALE_VALUE)).object)
  graph.add(track(createAxis("t", HELPER_COLOR, X_DIRECTION, graphHalfT)).object)
  // 縦軸は cosh・sinh の値の軸。どちらの曲線かは曲線名のラベルで示すので、軸には名前を置かない
  graph.add(track(createAxis(null, HELPER_COLOR, Y_DIRECTION, graphHalfValue)).object)

  const coshCurve = track(
    createParametricCurve(X_COLOR, LAYER_CURVE, (t, target) =>
      target.set(t * GRAPH_SCALE_T, cosh(t) * GRAPH_SCALE_VALUE, 0)
    )
  )
  const sinhCurve = track(
    createParametricCurve(Y_COLOR, LAYER_CURVE, (t, target) =>
      target.set(t * GRAPH_SCALE_T, sinh(t) * GRAPH_SCALE_VALUE, 0)
    )
  )
  coshCurve.set(-T_MAX, T_MAX)
  sinhCurve.set(-T_MAX, T_MAX)
  graph.add(coshCurve.object, sinhCurve.object)

  // cosh がここより下へ来ないことを示す、値 1 の高さの線
  const coshFloor = track(createSegment(HELPER_COLOR, HELPER_OPACITY))
  coshFloor.set(-graphHalfT, GRAPH_SCALE_VALUE, graphHalfT, GRAPH_SCALE_VALUE)
  graph.add(coshFloor.object)

  const coshLabel = track(createLabel("cosh t", X_COLOR, ANNOTATION_LABEL_HEIGHT))
  coshLabel.sprite.position.set(
    -T_MAX * GRAPH_SCALE_T - 0.15,
    cosh(T_MAX) * GRAPH_SCALE_VALUE + 0.22,
    LAYER_LABEL
  )
  const sinhLabel = track(createLabel("sinh t", Y_COLOR, ANNOTATION_LABEL_HEIGHT))
  sinhLabel.sprite.position.set(
    -T_MAX * GRAPH_SCALE_T - 0.15,
    sinh(-T_MAX) * GRAPH_SCALE_VALUE - 0.22,
    LAYER_LABEL
  )
  const floorLabel = track(createLabel("1", HELPER_COLOR, ANNOTATION_LABEL_HEIGHT))
  floorLabel.sprite.position.set(-0.24, GRAPH_SCALE_VALUE, LAYER_LABEL)
  graph.add(coshLabel.sprite, sinhLabel.sprite, floorLabel.sprite)

  // 今の t の位置を示す縦線と、その t での cosh・sinh の値
  const tLine = track(createSegment(HELPER_COLOR, HELPER_OPACITY))
  const coshMarker = track(createMarker(X_COLOR))
  const sinhMarker = track(createMarker(Y_COLOR))
  graph.add(tLine.object, coshMarker.object, sinhMarker.object)

  // 右：cosh・sinh の値をそのまま座標にとった双曲線
  const curve = new Group()
  curve.position.x = CURVE_CENTER_X
  scene.add(curve)

  const curveHalfX = RADIUS_A * cosh(T_MAX) * CURVE_SCALE + AXIS_MARGIN
  const curveHalfY = RADIUS_B * sinh(T_MAX) * CURVE_SCALE + AXIS_MARGIN

  curve.add(track(createGrid(curveHalfX, curveHalfY, CURVE_SCALE, CURVE_SCALE)).object)
  curve.add(track(createAxis("x", X_COLOR, X_DIRECTION, curveHalfX)).object)
  curve.add(track(createAxis("y", Y_COLOR, Y_DIRECTION, curveHalfY)).object)

  // x = a cosh t, y = b sinh t で辿れる枝と、符号を反転させないと得られないもう 1 本の枝
  const rightBranch = track(
    createParametricCurve(CURVE_COLOR, LAYER_CURVE, (t, target) =>
      target.set(RADIUS_A * cosh(t) * CURVE_SCALE, RADIUS_B * sinh(t) * CURVE_SCALE, 0)
    )
  )
  const leftBranch = track(
    createParametricCurve(CURVE_COLOR, LAYER_CURVE, (t, target) =>
      target.set(-RADIUS_A * cosh(t) * CURVE_SCALE, RADIUS_B * sinh(t) * CURVE_SCALE, 0)
    )
  )
  rightBranch.set(-T_MAX, T_MAX)
  leftBranch.set(-T_MAX, T_MAX)
  curve.add(rightBranch.object, leftBranch.object)

  // t をここまで動かしたぶんの跡
  const trace = track(
    createParametricCurve(TRACE_COLOR, LAYER_TRACE, (t, target) =>
      target.set(RADIUS_A * cosh(t) * CURVE_SCALE, RADIUS_B * sinh(t) * CURVE_SCALE, 0)
    )
  )
  curve.add(trace.object)

  // cosh が 1 を下回らないので、x は a より内側へ来ない
  const vertexLine = track(createSegment(HELPER_COLOR, HELPER_OPACITY))
  vertexLine.set(RADIUS_A * CURVE_SCALE, -curveHalfY, RADIUS_A * CURVE_SCALE, curveHalfY)
  curve.add(vertexLine.object)

  const vertexLabel = track(createLabel("a", HELPER_COLOR, ANNOTATION_LABEL_HEIGHT))
  vertexLabel.sprite.position.set(RADIUS_A * CURVE_SCALE - 0.2, -0.26, LAYER_LABEL)
  curve.add(vertexLabel.sprite)

  // 今の t に対応する双曲線上の点と、その座標を軸の上で読むための線
  const pointMarker = track(createMarker(MARKER_COLOR))
  const readingX = track(createSegment(X_COLOR, HELPER_OPACITY))
  const readingY = track(createSegment(Y_COLOR, HELPER_OPACITY))
  curve.add(pointMarker.object, readingX.object, readingY.object)

  return {
    update: () => {
      const { t } = params
      const coshValue = cosh(t)
      const sinhValue = sinh(t)

      // 左のグラフ。横軸の位置が t、縦軸の位置がその t での値
      const graphX = t * GRAPH_SCALE_T
      tLine.set(graphX, -graphHalfValue, graphX, graphHalfValue)
      coshMarker.object.position.set(graphX, coshValue * GRAPH_SCALE_VALUE, LAYER_POINT)
      sinhMarker.object.position.set(graphX, sinhValue * GRAPH_SCALE_VALUE, LAYER_POINT)

      // 右の双曲線。パラメータ形式 x = a cosh t, y = b sinh t
      const x = RADIUS_A * coshValue * CURVE_SCALE
      const y = RADIUS_B * sinhValue * CURVE_SCALE
      trace.set(-T_MAX, t)
      pointMarker.object.position.set(x, y, LAYER_POINT)
      readingX.set(x, y, x, 0)
      readingY.set(x, y, 0, y)

      params.cosh = coshValue.toFixed(2)
      params.sinh = sinhValue.toFixed(2)
    },
    dispose: () => disposables.forEach((item) => item.dispose())
  }
}
