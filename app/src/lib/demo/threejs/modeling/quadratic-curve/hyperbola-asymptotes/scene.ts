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
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type HyperbolaAsymptotesParams = {
  /** 原点から頂点までの距離。曲線は x = a と x = -a の外側に分かれる */
  a: number
  /** 曲線上で見ている点の高さ */
  y: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  curveX: string
  asymptoteX: string
  gap: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: HyperbolaAsymptotesParams
}

/**
 * 標準形の b。a だけを動かして、頂点の位置と漸近線の傾き b/a が
 * 同時に変わるところを見せたいので、こちらは固定する
 */
const RADIUS_B = 0.6

/** 曲線と漸近線を描く y の範囲。点が届く範囲より少し先まで伸ばして、曲線が続いていることを示す */
const CURVE_Y_MAX = 2.9

/** 画面の縦いっぱいに引く線（x = ±a）の長さと、横いっぱいに引く線（今の y の高さ）の長さ */
const VERTICAL_HALF = 3.3
const HORIZONTAL_HALF = 5.8

/** 曲線を描く折れ線の分割数 */
const CURVE_SEGMENTS = 160

/** 軸を伸ばす長さ */
const AXIS_HALF_X = 5.2
const AXIS_HALF_Y = 2.75

/** 座標を読む目安になる格子の間隔と、格子を引く範囲（画面の端まで覆う） */
const GRID_SPACING = 0.5
const GRID_HALF_X = 6
const GRID_HALF_Y = 3.3

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.18

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.26

/** 曲線上で見ている点を示す球の半径と、漸近線の上の同じ高さの点を示す球の半径 */
const POINT_RADIUS = 0.075
const ANCHOR_RADIUS = 0.055

/** 「x = a」のラベルを、線からずらす量。x 軸の下へ逃がす */
const VERTEX_LABEL_SHIFT_X = 0.55
const VERTEX_LABEL_DROP = -0.3

/** 漸近線のラベルを置く高さと、線から内側へずらす量 */
const ASYMPTOTE_LABEL_Y = 2.25
const ASYMPTOTE_LABEL_INSET = 0.72

/** 補助の線の薄さ。軸や曲線より控えめにする */
const HELPER_OPACITY = 0.55

/** 曲線が入ってこられない帯（-a < x < a）の薄さ。境界の線より控えめにする */
const BAND_OPACITY = 0.12

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
 * 曲線と漸近線は端へ行くほど重なるので、前後を決めないと描画が競合する。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_BAND = -0.015
const LAYER_AXIS = -0.01
const LAYER_HELPER = 0
const LAYER_ASYMPTOTE = 0.005
const LAYER_CURVE = 0.01
const LAYER_GAP = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、それぞれの役割が見分けられる色にする。
// 曲線が近づいていく先である漸近線は、放物線の焦点・準線と同じ「曲線を決めるもの」の色にする
const CURVE_COLOR = "#8fa3bf"
const ASYMPTOTE_COLOR = "#5ec8f2"
const GAP_COLOR = "#ffc857"
const POINT_COLOR = "#f57fc4"
const AXIS_COLOR = "#b9c0cc"
const HELPER_COLOR = "#c9d2de"
const GRID_COLOR = "#9aa3b0"

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
    set: (x: number, y: number) => sprite.position.set(x, y, LAYER_LABEL),
    dispose: () => {
      texture.dispose()
      material.dispose()
    }
  }
}

/** 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string, direction: Vector3, half: number) => {
  const group = new Group()
  group.position.z = LAYER_AXIS
  const disposables: { dispose: () => void }[] = []

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-half),
    direction.clone().multiplyScalar(half)
  ])
  const lineMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  group.add(new LineSegments(lineGeometry, lineMaterial))
  disposables.push(lineGeometry, lineMaterial)

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color: AXIS_COLOR })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(half)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)
  disposables.push(arrowGeometry, arrowMaterial)

  const label = createLabel(name, AXIS_COLOR, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(half + LABEL_OFFSET)
  label.sprite.position.z = LAYER_LABEL - LAYER_AXIS
  group.add(label.sprite)
  disposables.push(label)

  return {
    object: group,
    dispose: () => disposables.forEach((disposable) => disposable.dispose())
  }
}

/** 座標を読み取る目安になる格子 */
const createGrid = () => {
  const points: Vector3[] = []

  const countX = Math.floor(GRID_HALF_X / GRID_SPACING)
  for (let i = -countX; i <= countX; i++) {
    points.push(
      new Vector3(i * GRID_SPACING, -GRID_HALF_Y, LAYER_GRID),
      new Vector3(i * GRID_SPACING, GRID_HALF_Y, LAYER_GRID)
    )
  }

  const countY = Math.floor(GRID_HALF_Y / GRID_SPACING)
  for (let i = -countY; i <= countY; i++) {
    points.push(
      new Vector3(-GRID_HALF_X, i * GRID_SPACING, LAYER_GRID),
      new Vector3(GRID_HALF_X, i * GRID_SPACING, LAYER_GRID)
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
 * y を刻んで点を並べた折れ線。頂点数は固定して、位置だけを差し替えられるようにする。
 * `toX` は y からその高さでの x を返す
 */
const createCurve = (color: string, z: number, toX: (y: number) => number) => {
  const positions = new Float32BufferAttribute(new Float32Array((CURVE_SEGMENTS + 1) * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new Line(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    set: () => {
      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const y = -CURVE_Y_MAX + 2 * CURVE_Y_MAX * (i / CURVE_SEGMENTS)
        positions.setXYZ(i, toX(y), y, z)
      }
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 両端が動く 1 本の線分 */
const createSegment = (color: string, opacity: number, z: number) => {
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  const line = new LineSegments(geometry, material)
  line.frustumCulled = false

  return {
    object: line,
    set: (fromX: number, fromY: number, toX: number, toY: number) => {
      positions.setXYZ(0, fromX, fromY, z)
      positions.setXYZ(1, toX, toY, z)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 特定の位置を示す球 */
const createMarker = (color: string, radius: number) => {
  const geometry = new SphereGeometry(radius, 16, 12)
  const material = new MeshBasicMaterial({ color })
  const mesh = new Mesh(geometry, material)

  return {
    object: mesh,
    set: (x: number, y: number) => mesh.position.set(x, y, LAYER_POINT),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 曲線が入ってこられない帯（-a < x < a）。横幅だけを a に合わせて伸縮させる */
const createBand = () => {
  const geometry = new PlaneGeometry(1, VERTICAL_HALF * 2)
  const material = new MeshBasicMaterial({
    color: HELPER_COLOR,
    transparent: true,
    opacity: BAND_OPACITY,
    depthWrite: false
  })
  const mesh = new Mesh(geometry, material)
  mesh.position.z = LAYER_BAND

  return {
    object: mesh,
    set: (a: number) => mesh.scale.set(a * 2, 1, 1),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createHyperbolaAsymptotesScene = ({ scene, params }: SceneContext) => {
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item)
    return item
  }

  // 原点から頂点までの距離。漸近線の傾き b/a もこの値で決まる
  let a = params.a

  /** 標準形 x²/a² - y²/b² = 1 の右側の枝で、高さ y にある点の x */
  const hyperbolaX = (y: number) => a * Math.sqrt(1 + (y * y) / (RADIUS_B * RADIUS_B))

  /** 漸近線 y = ±(b/a)x を x について解いた形。高さ y にある点の x */
  const asymptoteX = (y: number) => (a * y) / RADIUS_B

  scene.add(track(createGrid()).object)
  scene.add(track(createAxis("x", X_DIRECTION, AXIS_HALF_X)).object)
  scene.add(track(createAxis("y", Y_DIRECTION, AXIS_HALF_Y)).object)

  // x の絶対値が a より小さくなれない、すなわち曲線が入ってこられない帯
  const band = track(createBand())
  scene.add(band.object)

  // 帯の境界。この 2 本を境に、曲線が右と左へ分かれる
  const rightBound = track(createSegment(HELPER_COLOR, HELPER_OPACITY, LAYER_HELPER))
  const leftBound = track(createSegment(HELPER_COLOR, HELPER_OPACITY, LAYER_HELPER))
  scene.add(rightBound.object, leftBound.object)

  const rightBoundLabel = track(createLabel("x = a", HELPER_COLOR, ANNOTATION_LABEL_HEIGHT))
  const leftBoundLabel = track(createLabel("x = -a", HELPER_COLOR, ANNOTATION_LABEL_HEIGHT))
  scene.add(rightBoundLabel.sprite, leftBoundLabel.sprite)

  // y を大きくしていったときに曲線が限りなく近づく 2 本の直線
  const risingAsymptote = track(createSegment(ASYMPTOTE_COLOR, 1, LAYER_ASYMPTOTE))
  const fallingAsymptote = track(createSegment(ASYMPTOTE_COLOR, 1, LAYER_ASYMPTOTE))
  scene.add(risingAsymptote.object, fallingAsymptote.object)

  const risingLabel = track(createLabel("y = (b/a)x", ASYMPTOTE_COLOR, ANNOTATION_LABEL_HEIGHT))
  const fallingLabel = track(createLabel("y = -(b/a)x", ASYMPTOTE_COLOR, ANNOTATION_LABEL_HEIGHT))
  scene.add(risingLabel.sprite, fallingLabel.sprite)

  // 帯を挟んで右と左に分かれる 2 本の枝
  const rightBranch = track(createCurve(CURVE_COLOR, LAYER_CURVE, hyperbolaX))
  const leftBranch = track(createCurve(CURVE_COLOR, LAYER_CURVE, (y) => -hyperbolaX(y)))
  scene.add(rightBranch.object, leftBranch.object)

  // 今見ている高さ。この高さで曲線と漸近線がどれだけ離れているかを読む
  const heightLine = track(createSegment(HELPER_COLOR, HELPER_OPACITY, LAYER_HELPER))
  scene.add(heightLine.object)

  const rightPoint = track(createMarker(POINT_COLOR, POINT_RADIUS))
  const leftPoint = track(createMarker(POINT_COLOR, POINT_RADIUS))
  const rightFoot = track(createMarker(ASYMPTOTE_COLOR, ANCHOR_RADIUS))
  const leftFoot = track(createMarker(ASYMPTOTE_COLOR, ANCHOR_RADIUS))
  scene.add(rightPoint.object, leftPoint.object, rightFoot.object, leftFoot.object)

  // 曲線上の点から、同じ高さの漸近線上の点までの隔たり
  const rightGap = track(createSegment(GAP_COLOR, 1, LAYER_GAP))
  const leftGap = track(createSegment(GAP_COLOR, 1, LAYER_GAP))
  scene.add(rightGap.object, leftGap.object)

  return {
    update: () => {
      a = params.a
      const y = params.y

      // a が変わると頂点の位置と漸近線の傾きが変わるので、曲線と直線は毎フレーム引き直す
      rightBranch.set()
      leftBranch.set()

      band.set(a)
      rightBound.set(a, -VERTICAL_HALF, a, VERTICAL_HALF)
      leftBound.set(-a, -VERTICAL_HALF, -a, VERTICAL_HALF)
      rightBoundLabel.set(a + VERTEX_LABEL_SHIFT_X, VERTEX_LABEL_DROP)
      leftBoundLabel.set(-a - VERTEX_LABEL_SHIFT_X, VERTEX_LABEL_DROP)

      // 漸近線は原点を通る直線なので、上端と下端を結ぶだけでよい
      const asymptoteTop = asymptoteX(CURVE_Y_MAX)
      risingAsymptote.set(-asymptoteTop, -CURVE_Y_MAX, asymptoteTop, CURVE_Y_MAX)
      fallingAsymptote.set(asymptoteTop, -CURVE_Y_MAX, -asymptoteTop, CURVE_Y_MAX)
      risingLabel.set(asymptoteX(ASYMPTOTE_LABEL_Y) - ASYMPTOTE_LABEL_INSET, ASYMPTOTE_LABEL_Y)
      fallingLabel.set(-asymptoteX(ASYMPTOTE_LABEL_Y) + ASYMPTOTE_LABEL_INSET, ASYMPTOTE_LABEL_Y)

      // 曲線上の点と、同じ高さで漸近線の上にある点。
      // 高さが負のときに右の枝が近づく先は、傾きが負のほうの漸近線なので、絶対値で見る
      const curveX = hyperbolaX(y)
      const footX = asymptoteX(Math.abs(y))

      heightLine.set(-HORIZONTAL_HALF, y, HORIZONTAL_HALF, y)
      rightPoint.set(curveX, y)
      leftPoint.set(-curveX, y)
      rightFoot.set(footX, y)
      leftFoot.set(-footX, y)
      rightGap.set(footX, y, curveX, y)
      leftGap.set(-footX, y, -curveX, y)

      // 右の枝で読んだ値。y を大きくするほど 2 つの x が近づき、隔たりが 0 へ向かう
      params.curveX = curveX.toFixed(2)
      params.asymptoteX = footX.toFixed(2)
      params.gap = (curveX - footX).toFixed(3)
    },
    dispose: () => disposables.forEach((item) => item.dispose())
  }
}
