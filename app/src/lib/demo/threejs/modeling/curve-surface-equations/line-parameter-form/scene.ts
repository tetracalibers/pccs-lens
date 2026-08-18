import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
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
export type LineParameterFormParams = {
  /** 直線が通る点 (p, q)。t = 0 のときの座標。Tweakpane の Point Binding に合わせて x・y の組で持つ */
  pq: { x: number; y: number }
  /** 進む向き。x 方向に a・y 方向に b */
  a: number
  b: number
  /** 直線上の点を 1 つ選ぶパラメータ */
  t: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  point: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: LineParameterFormParams
}

/** 軸を原点から正負どちらへも伸ばす長さ。この範囲が初期表示で収まるようにカメラを置く */
const AXIS_HALF_X = 4.05
const AXIS_HALF_Y = 2.6

/** 格子の間隔と、原点から数えた本数。1 目盛りが 1 */
const GRID_STEP = 1
const GRID_COUNT_X = 4
const GRID_COUNT_Y = 2

/** 格子の線の薄さ。座標の目安であって主役ではない */
const GRID_OPACITY = 0.3

/** t をすべての実数にわたって動かした直線を、基準点から届かせる長さ。表示域の外まで伸ばす */
const LINE_REACH = 14

/** 向きが定まったとみなす最小の長さ。a も b も 0 だと直線は 1 点に潰れる */
const MIN_DIRECTION = 1e-4

/** t を整数にしたときの点を示す球の半径と、その t の範囲（±） */
const TICK_RADIUS = 0.045
const TICK_MAX = 4

/** 基準点・今の点を示す球の半径 */
const POINT_RADIUS = 0.085

/** 軸と成分の矢印で共通に使う矢じりの大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** 矢じりが線からはみ出さない最小の長さ。これより短い成分は矢印ごと隠す */
const ARROW_MIN_LENGTH = ARROW_HEIGHT * 1.2

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.3
const ANNOTATION_LABEL_HEIGHT = 0.26

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** 基準点・今の点のラベルを、点そのものから離す向き */
const BASE_LABEL_OFFSET = new Vector3(-0.52, 0.28, 0)
const MARKER_LABEL_OFFSET = new Vector3(0.52, 0.28, 0)

/** 成分の矢印のラベルを、線から離す向き */
const ALONG_X_LABEL_OFFSET = new Vector3(0, -0.26, 0)
const ALONG_Y_LABEL_OFFSET = new Vector3(0.22, 0, 0)

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しだけ振り分ける z。
 * とくに直線全体と掃いた範囲は同じ直線上に重なるので、前後を決めないと描画が競合する。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_AXIS = -0.01
const LAYER_LINE = 0
const LAYER_TRACE = 0.01
const LAYER_ARROW = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・格子・直線・掃いた範囲・2 つの点が見分けられる色にする。
// 軸の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const GRID_COLOR = "#9aa3b0"
const LINE_COLOR = "#6d7f96"
const TRACE_COLOR = "#ffc857"
const TICK_COLOR = "#c9d2de"
const BASE_COLOR = "#b79cf5"
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
    const x = i * GRID_STEP
    points.push(new Vector3(x, -AXIS_HALF_Y, LAYER_GRID), new Vector3(x, AXIS_HALF_Y, LAYER_GRID))
  }
  for (let i = -GRID_COUNT_Y; i <= GRID_COUNT_Y; i++) {
    const y = i * GRID_STEP
    points.push(new Vector3(-AXIS_HALF_X, y, LAYER_GRID), new Vector3(AXIS_HALF_X, y, LAYER_GRID))
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

/** 両端が毎フレーム動く線分。頂点を作り直さず、座標だけ書き換える */
const createSegment = (color: string) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  geometry.setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new LineSegments(geometry, material)
  // 端点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    set: (from: Vector3, to: Vector3) => {
      positions.setXYZ(0, from.x, from.y, from.z)
      positions.setXYZ(1, to.x, to.y, to.z)
      positions.needsUpdate = true
    },
    setVisible: (visible: boolean) => {
      line.visible = visible
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 成分の矢印。基準点から x 方向へ a、そこから y 方向へ b と辿ることで、進む向きを示す。
 * 成分が 0 に近いと矢じりが線からはみ出すので、そのときは矢印ごと隠す
 */
const createComponentArrow = (name: string, color: string) => {
  const group = new Group()

  const segment = createSegment(color)
  group.add(segment.object)

  const headGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const headMaterial = new MeshBasicMaterial({ color })
  const head = new Mesh(headGeometry, headMaterial)
  group.add(head)

  const label = createLabel(name, color, ANNOTATION_LABEL_HEIGHT)
  group.add(label.sprite)

  const direction = new Vector3()
  const tail = new Vector3()

  return {
    object: group,
    /** `from` から `to` へ矢印を張る。`offset` はラベルを線から離す向き */
    set: (from: Vector3, to: Vector3, offset: Vector3) => {
      const length = from.distanceTo(to)
      group.visible = length > ARROW_MIN_LENGTH
      if (!group.visible) return

      direction.subVectors(to, from).divideScalar(length)
      // 線は矢じりのぶんだけ手前で止める
      segment.set(from, tail.copy(to).addScaledVector(direction, -ARROW_HEIGHT))
      head.position.copy(to).addScaledVector(direction, -ARROW_HEIGHT / 2)
      head.quaternion.setFromUnitVectors(CONE_UP, direction)
      label.sprite.position.lerpVectors(from, to, 0.5).add(offset)
      label.sprite.position.z = LAYER_LABEL
    },
    dispose: () => {
      segment.dispose()
      const disposables = [headGeometry, headMaterial, label.texture, label.material]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** t を整数にしたときの点。t を 1 つ決めるごとに直線上の点が 1 つ決まることを示す */
const createTickPoints = () => {
  const geometry = new SphereGeometry(TICK_RADIUS, 12, 8)
  const material = new MeshBasicMaterial({ color: TICK_COLOR })
  const values: number[] = []
  const meshes: Mesh[] = []

  for (let t = -TICK_MAX; t <= TICK_MAX; t++) {
    // t = 0 の点は基準点として別に描くので飛ばす
    if (t === 0) continue
    values.push(t)
    meshes.push(new Mesh(geometry, material))
  }

  return {
    objects: meshes,
    /** それぞれの t に対応する点へ動かす */
    setPositions: (at: (t: number) => Vector3) => {
      meshes.forEach((mesh, index) => mesh.position.copy(at(values[index])))
    },
    setVisible: (visible: boolean) => {
      meshes.forEach((mesh) => (mesh.visible = visible))
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createLineParameterFormScene = ({ scene, params }: SceneContext) => {
  const grid = createGrid()
  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, AXIS_HALF_X),
    createAxis("y", Y_COLOR, Y_DIRECTION, AXIS_HALF_Y)
  ]
  scene.add(grid.object, ...axes.map((axis) => axis.object))

  // t をすべての実数にわたって動かしたときに得られる直線全体
  const guide = createSegment(LINE_COLOR)
  scene.add(guide.object)

  // t = 0 から今の t までに掃いた範囲。t の正負で伸びる向きが変わる
  const trace = createSegment(TRACE_COLOR)
  scene.add(trace.object)

  const ticks = createTickPoints()
  scene.add(...ticks.objects)

  // 進む向きを、x 方向の成分 a と y 方向の成分 b に分けて示す
  const alongX = createComponentArrow("a", X_COLOR)
  const alongY = createComponentArrow("b", Y_COLOR)
  scene.add(alongX.object, alongY.object)

  // 直線が通る 1 点として与えた (p, q) と、今の t に対応する点 (x, y)
  const pointGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const baseMaterial = new MeshBasicMaterial({ color: BASE_COLOR })
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const basePoint = new Mesh(pointGeometry, baseMaterial)
  const marker = new Mesh(pointGeometry, markerMaterial)
  const baseLabel = createLabel("(p, q)", BASE_COLOR, ANNOTATION_LABEL_HEIGHT)
  const markerLabel = createLabel("(x, y)", MARKER_COLOR, ANNOTATION_LABEL_HEIGHT)
  scene.add(basePoint, marker, baseLabel.sprite, markerLabel.sprite)

  const anchor = new Vector3()
  const current = new Vector3()
  const direction = new Vector3()
  const corner = new Vector3()
  const tip = new Vector3()
  const near = new Vector3()
  const far = new Vector3()
  const scratch = new Vector3()

  /** パラメータ表示 x = p + at, y = q + bt。重ね順を決める z は呼び出し側で指定する */
  const pointAt = (t: number, z: number, target: Vector3) =>
    target.set(params.pq.x + params.a * t, params.pq.y + params.b * t, z)

  return {
    update: () => {
      // 基準点と、今の t に対応する点
      basePoint.position.copy(pointAt(0, LAYER_POINT, anchor))
      marker.position.copy(pointAt(params.t, LAYER_POINT, current))
      baseLabel.sprite.position.set(anchor.x, anchor.y, LAYER_LABEL).add(BASE_LABEL_OFFSET)
      markerLabel.sprite.position.set(current.x, current.y, LAYER_LABEL).add(MARKER_LABEL_OFFSET)

      // a も b も 0 だと向きが決まらず、直線は基準点 1 点に潰れる
      const hasDirection = Math.hypot(params.a, params.b) > MIN_DIRECTION
      guide.setVisible(hasDirection)
      trace.setVisible(hasDirection)
      ticks.setVisible(hasDirection)

      if (hasDirection) {
        // 直線全体は、基準点から向きの正負どちらへも表示域の外まで伸ばす
        direction.set(params.a, params.b, 0).normalize()
        pointAt(0, LAYER_LINE, scratch)
        guide.set(
          near.copy(scratch).addScaledVector(direction, -LINE_REACH),
          far.copy(scratch).addScaledVector(direction, LINE_REACH)
        )

        trace.set(pointAt(0, LAYER_TRACE, near), pointAt(params.t, LAYER_TRACE, far))
        ticks.setPositions((t) => pointAt(t, LAYER_POINT, scratch))
      }

      // 成分の矢印は、基準点から x 方向へ a 進んだ角を折り返し点にする
      pointAt(0, LAYER_ARROW, scratch)
      corner.set(scratch.x + params.a, scratch.y, LAYER_ARROW)
      alongX.set(scratch, corner, ALONG_X_LABEL_OFFSET)
      alongY.set(corner, tip.set(corner.x, corner.y + params.b, LAYER_ARROW), ALONG_Y_LABEL_OFFSET)

      // Tweakpane 側に読み取り専用で出す値
      params.point = `(${current.x.toFixed(2)}, ${current.y.toFixed(2)})`
    },
    dispose: () => {
      grid.dispose()
      axes.forEach((axis) => axis.dispose())
      guide.dispose()
      trace.dispose()
      ticks.dispose()
      alongX.dispose()
      alongY.dispose()
      const disposables = [
        pointGeometry,
        baseMaterial,
        markerMaterial,
        baseLabel.texture,
        baseLabel.material,
        markerLabel.texture,
        markerLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
