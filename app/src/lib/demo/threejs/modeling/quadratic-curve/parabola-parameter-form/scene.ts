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
export type ParabolaParameterFormParams = {
  /** 開き方を決める定数。標準形 y² = 4px の p */
  p: number
  /** 放物線上の点を選ぶパラメータ */
  t: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  x: string
  y: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ParabolaParameterFormParams
}

/** t を動かせる範囲。実数全体のうち、画面に収まるところを切り取っている */
const T_MIN = -1.6
const T_MAX = 1.6

/** 軸を原点から正負どちらへも伸ばす長さ。この範囲が初期表示で収まるようにカメラを置く */
const AXIS_HALF_X = 3.2
const AXIS_HALF_Y = 2.9

/** 格子の間隔と、原点から数えた本数。1 目盛りが 1 */
const GRID_STEP = 1
const GRID_COUNT_X = 3
const GRID_COUNT_Y = 2

/** 格子の線の薄さ。座標の目安であって主役ではない */
const GRID_OPACITY = 0.3

/** 放物線を描く折れ線の分割数。掃いた跡も同じ頂点数で、刻み幅だけを変える */
const CURVE_SEGMENTS = 160

/** t を刻んで点を並べる本数。頂点から正負どちらへもこの数だけ並べる */
const DOT_COUNT = 4

/** 刻んだ点を示す球の半径 */
const DOT_RADIUS = 0.05

/** 今の t に対応する点を示す球の半径 */
const POINT_RADIUS = 0.085

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** 今の t に対応する点のラベルを、点から離す距離 */
const MARKER_LABEL_GAP_X = 0.5
const MARKER_LABEL_GAP_Y = 0.24

/** 座標を読み取る線の薄さ。軸や曲線より控えめにする */
const READING_OPACITY = 0.6

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.3
const ANNOTATION_LABEL_HEIGHT = 0.26

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しだけ振り分ける z。
 * とくに放物線と掃いた跡は同じ曲線上に重なるので、前後を決めないと描画が競合する。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_AXIS = -0.01
const LAYER_CURVE = 0
const LAYER_READING = 0.005
const LAYER_TRACE = 0.01
const LAYER_DOT = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・格子・放物線・掃いた跡・点列が見分けられる色にする。
// 軸の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const GRID_COLOR = "#9aa3b0"
const CURVE_COLOR = "#6d7f96"
const TRACE_COLOR = "#ffc857"
const DOT_COLOR = "#c9d2de"
const MARKER_COLOR = "#f57fc4"

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

  return { sprite, texture, material }
}

/** 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string, color: string, direction: Vector3, half: number) => {
  const group = new Group()
  group.position.z = LAYER_AXIS

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

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(half + LABEL_OFFSET)
  label.sprite.position.z = LAYER_LABEL - LAYER_AXIS
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

/**
 * p を変えても、t の範囲を変えても使い回せる放物線。
 * 頂点数は固定して、t の刻み幅だけを毎フレーム変える
 */
const createCurve = (color: string, z: number) => {
  const positions = new Float32BufferAttribute(new Float32Array((CURVE_SEGMENTS + 1) * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new Line(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    /** パラメータ形式 x = pt², y = 2pt で、t を from から to まで動かした跡を張る */
    set: (p: number, from: number, to: number) => {
      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const t = from + (to - from) * (i / CURVE_SEGMENTS)
        positions.setXYZ(i, p * t * t, 2 * p * t, z)
      }
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * t を一定の刻みで動かして得られる点。t の刻み幅は同じなので、
 * y は等間隔に並び、x は頂点から離れるほど間隔が広がる
 */
const createDots = () => {
  const geometry = new SphereGeometry(DOT_RADIUS, 12, 8)
  const material = new MeshBasicMaterial({ color: DOT_COLOR })
  const values: number[] = []
  const meshes: Mesh[] = []

  // 頂点（t = 0）を刻みに含めたいので、そこから正負どちらへも同じ幅で数える
  for (let i = 0; i <= DOT_COUNT; i++) {
    const t = (i / DOT_COUNT) * T_MAX
    values.push(t)
    meshes.push(new Mesh(geometry, material))
    if (i === 0) continue
    values.push(-t)
    meshes.push(new Mesh(geometry, material))
  }

  return {
    objects: meshes,
    /** 放物線上へ並べ直し、今の t をまだ超えているものは隠す */
    setPositions: (p: number, current: number) => {
      meshes.forEach((mesh, index) => {
        const t = values[index]
        mesh.visible = t <= current
        if (!mesh.visible) return
        mesh.position.set(p * t * t, 2 * p * t, LAYER_DOT)
      })
    },
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

export const createParabolaParameterFormScene = ({ scene, params }: SceneContext) => {
  const grid = createGrid()
  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, AXIS_HALF_X),
    createAxis("y", Y_COLOR, Y_DIRECTION, AXIS_HALF_Y)
  ]
  scene.add(grid.object, ...axes.map((axis) => axis.object))

  // t を動かせる範囲いっぱいの放物線と、そのうち今の t までに描かれたぶん
  const curve = createCurve(CURVE_COLOR, LAYER_CURVE)
  const trace = createCurve(TRACE_COLOR, LAYER_TRACE)
  scene.add(curve.object, trace.object)

  const dots = createDots()
  scene.add(...dots.objects)

  // 今の t に対応する点と、その x・y を軸の上で読むための線
  const markerGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  scene.add(marker)

  const readingX = createReadingLine(X_COLOR)
  const readingY = createReadingLine(Y_COLOR)
  scene.add(readingX.object, readingY.object)

  const markerLabel = createLabel("(x, y)", MARKER_COLOR, ANNOTATION_LABEL_HEIGHT)
  scene.add(markerLabel.sprite)

  return {
    update: () => {
      const { p, t } = params

      // パラメータ形式 x = pt², y = 2pt
      const x = p * t * t
      const y = 2 * p * t

      curve.set(p, T_MIN, T_MAX)
      trace.set(p, T_MIN, t)
      dots.setPositions(p, t)

      marker.position.set(x, y, LAYER_POINT)
      readingX.set(x, y, x, 0)
      readingY.set(x, y, 0, y)

      // ラベルは点の右側、x 軸から遠ざかる向きへずらして、曲線と重ならないようにする
      markerLabel.sprite.position.set(
        x + MARKER_LABEL_GAP_X,
        y + (t < 0 ? -MARKER_LABEL_GAP_Y : MARKER_LABEL_GAP_Y),
        LAYER_LABEL
      )

      params.x = x.toFixed(2)
      params.y = y.toFixed(2)
    },
    dispose: () => {
      const disposables = [
        markerGeometry,
        markerMaterial,
        markerLabel.texture,
        markerLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
      grid.dispose()
      axes.forEach((axis) => axis.dispose())
      curve.dispose()
      trace.dispose()
      dots.dispose()
      readingX.dispose()
      readingY.dispose()
    }
  }
}
