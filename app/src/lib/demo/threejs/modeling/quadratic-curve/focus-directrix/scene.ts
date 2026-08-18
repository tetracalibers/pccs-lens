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
export type FocusDirectrixParams = {
  /** 頂点から焦点までの距離。焦点は (p, 0) に、準線は x = -p に置かれる */
  p: number
  /** 曲線上で見ている点の y 座標 */
  y: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  focusDistance: string
  directrixDistance: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: FocusDirectrixParams
}

/** 放物線を描く y の範囲。点が届く範囲より少し先まで伸ばして、曲線が続いていることを示す */
const CURVE_Y_MAX = 2.2

/** 曲線を描く折れ線の分割数 */
const CURVE_SEGMENTS = 160

/** 軸を伸ばす長さ。x は放物線が最も横に開くところまで、y は曲線の端より少し外まで */
const AXIS_HALF_X = 4.6
const AXIS_HALF_Y = 2.55

/** 座標を読む目安になる格子の間隔と、格子を引く範囲（画面の端まで覆う） */
const GRID_SPACING = 0.5
const GRID_HALF_X = 6
const GRID_HALF_Y = 2.8

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.18

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.26

/** 曲線上で見ている点を示す球の半径と、焦点・準線上の足を示す球の半径 */
const POINT_RADIUS = 0.075
const ANCHOR_RADIUS = 0.06

/** 「焦点 (p, 0)」のラベルを、焦点からずらす量。x 軸の下へ逃がす */
const FOCUS_LABEL_SHIFT_X = 0.15
const FOCUS_LABEL_DROP = -0.34

/** 「準線 x = -p」のラベルを、準線の左へずらす量と、置く高さ */
const DIRECTRIX_LABEL_SHIFT_X = -0.68
const DIRECTRIX_LABEL_Y = 2.1

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
 * 距離の線は放物線と交わるので、前後を決めないと描画が競合する。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_AXIS = -0.01
const LAYER_HELPER = 0
const LAYER_CURVE = 0.01
const LAYER_DISTANCE = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 つの役割が見分けられる色にする。
// 焦点と準線は放物線を決める 1 組なので同じ色、2 本の距離は等しいことが主題なのでこちらも同じ色にする
const CURVE_COLOR = "#8fa3bf"
const DEFINITION_COLOR = "#5ec8f2"
const DISTANCE_COLOR = "#ffc857"
const POINT_COLOR = "#f57fc4"
const AXIS_COLOR = "#b9c0cc"
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
const createCurve = (color: string, toX: (y: number) => number) => {
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
        positions.setXYZ(i, toX(y), y, LAYER_CURVE)
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
const createSegment = (color: string, z: number) => {
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
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

export const createFocusDirectrixScene = ({ scene, params }: SceneContext) => {
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item)
    return item
  }

  // 頂点から焦点までの距離。準線までの距離も同じ p なので、この 1 つで両方が決まる
  let p = params.p

  /** 放物線 y² = 4px 上で、高さ y にある点の x */
  const parabolaX = (y: number) => (y * y) / (4 * p)

  scene.add(track(createGrid()).object)
  scene.add(track(createAxis("x", X_DIRECTION, AXIS_HALF_X)).object)
  scene.add(track(createAxis("y", Y_DIRECTION, AXIS_HALF_Y)).object)

  // 焦点と準線から等しい距離にある点の集まりとして現れる放物線
  const curve = track(createCurve(CURVE_COLOR, parabolaX))
  scene.add(curve.object)

  // 放物線を決める 1 組。定点である焦点と、定直線である準線
  const focus = track(createMarker(DEFINITION_COLOR, ANCHOR_RADIUS))
  const directrix = track(createSegment(DEFINITION_COLOR, LAYER_HELPER))
  scene.add(focus.object, directrix.object)

  const focusLabel = track(createLabel("焦点 (p, 0)", DEFINITION_COLOR, ANNOTATION_LABEL_HEIGHT))
  const directrixLabel = track(
    createLabel("準線 x = -p", DEFINITION_COLOR, ANNOTATION_LABEL_HEIGHT)
  )
  scene.add(focusLabel.sprite, directrixLabel.sprite)

  // 曲線上で見ている点と、そこから焦点・準線へ引いた 2 本の線。
  // 長さが等しいことが主題なので、2 本は同じ色にする
  const point = track(createMarker(POINT_COLOR, POINT_RADIUS))
  const toFocus = track(createSegment(DISTANCE_COLOR, LAYER_DISTANCE))
  const toDirectrix = track(createSegment(DISTANCE_COLOR, LAYER_DISTANCE))
  // 準線の上で、点から下ろした垂線が当たる位置
  const foot = track(createMarker(DEFINITION_COLOR, ANCHOR_RADIUS))
  scene.add(point.object, toFocus.object, toDirectrix.object, foot.object)

  return {
    update: () => {
      p = params.p
      const y = params.y
      const x = parabolaX(y)

      // p が変わると放物線の開き方が変わるので、曲線は毎フレーム引き直す
      curve.set()

      focus.set(p, 0)
      focusLabel.set(p + FOCUS_LABEL_SHIFT_X, FOCUS_LABEL_DROP)
      directrix.set(-p, -AXIS_HALF_Y, -p, AXIS_HALF_Y)
      directrixLabel.set(-p + DIRECTRIX_LABEL_SHIFT_X, DIRECTRIX_LABEL_Y)

      point.set(x, y)
      foot.set(-p, y)
      toFocus.set(x, y, p, 0)
      toDirectrix.set(x, y, -p, y)

      // 焦点までは 2 点間の距離、準線までは x 方向の隔たり。
      // 別々に求めているが、放物線上の点ではこの 2 つが必ず一致する
      params.focusDistance = Math.hypot(x - p, y).toFixed(2)
      params.directrixDistance = (x + p).toFixed(2)
    },
    dispose: () => disposables.forEach((item) => item.dispose())
  }
}
