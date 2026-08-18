import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ。どちらも動かす制御点 P1 の位置（パネルの中での座標） */
export type ControlPolygonParams = {
  /** 制御点が 3 つの側の P1 */
  quadratic: { x: number; y: number }
  /** 制御点が 4 つの側の P1 */
  cubic: { x: number; y: number }
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ControlPolygonParams
}

/** 制御点が 3 つの側と 4 つの側。動かすのはどちらも P1（添字 1 の点） */
const QUADRATIC_POINTS: [number, number][] = [
  [-1.6, -1],
  [0, 1.4],
  [1.6, -1]
]
const CUBIC_POINTS: [number, number][] = [
  [-1.7, -1],
  [-0.6, 1.4],
  [0.7, 1.4],
  [1.7, -1]
]
const MOVABLE_INDEX = 1

/** 2 つのパネルを左右に振り分ける距離 */
const PANEL_OFFSET = 2.6

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 64

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** 動かす前の曲線を薄く残す濃さ。今の曲線と見比べて、引き寄せられた量を読み取る */
const GHOST_OPACITY = 0.3

/** 制御点と、動かす制御点を示す球の半径 */
const CONTROL_RADIUS = 0.1
const MOVABLE_RADIUS = 0.12

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28
const TITLE_HEIGHT = 0.32

/** パネルの見出しを置く高さ */
const TITLE_Y = 2.55

/** 動かす制御点のラベルを、点そのものから離す向き */
const MOVABLE_LABEL_OFFSET = new Vector3(0.34, 0.24, 0)

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GHOST = 0
const LAYER_POLYGON = 0.01
const LAYER_CURVE = 0.02
const LAYER_POINT = 0.03
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、制御多角形・曲線・制御点が見分けられる色にする
const POLYGON_COLOR = "#9aa3b0"
const CURVE_COLOR = "#ffc857"
const CONTROL_COLOR = "#b79cf5"
const MOVABLE_COLOR = "#f57fc4"
const TITLE_COLOR = "#c9d2de"

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

// ド・カステリョのアルゴリズムで使う作業用の点。毎フレーム何度も呼ばれるので、その都度は作らない
const work: Vector3[] = []

/**
 * 制御点が何個でも使えるベジェ曲線上の点。
 * 隣り合う点どうしを t で線形補間する操作を、点が 1 つになるまで繰り返す
 */
const bezierPoint = (controls: Vector3[], t: number, target: Vector3) => {
  while (work.length < controls.length) work.push(new Vector3())
  controls.forEach((control, i) => work[i].copy(control))

  for (let last = controls.length - 1; last > 0; last--) {
    for (let i = 0; i < last; i++) work[i].lerp(work[i + 1], t)
  }

  return target.copy(work[0])
}

/** 頂点が動く折れ線。頂点を作り直さず、座標だけ書き換える */
const createPolyline = (count: number, z: number) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(count * 3), 3)
  geometry.setAttribute("position", positions)

  return {
    geometry,
    set: (index: number, point: Vector3) => positions.setXYZ(index, point.x, point.y, z),
    commit: () => {
      positions.needsUpdate = true
      geometry.computeBoundingSphere()
    }
  }
}

/**
 * 制御多角形（破線）とベジェ曲線（実線）を重ねた 1 枚のパネル。
 * 動かす前の曲線を薄く残し、制御点を動かしたときの引き寄せられ方が読めるようにする
 */
const createPanel = (source: [number, number][], title: string, offsetX: number) => {
  const group = new Group()
  group.position.x = offsetX

  const controls = source.map(([x, y]) => new Vector3(x, y, 0))
  const sample = new Vector3()

  // 動かす前の曲線。制御点の初期位置から 1 度だけ求める
  const ghostPoints: Vector3[] = []
  for (let i = 0; i <= CURVE_SEGMENTS; i++) {
    bezierPoint(controls, i / CURVE_SEGMENTS, sample)
    ghostPoints.push(new Vector3(sample.x, sample.y, LAYER_GHOST))
  }
  const ghostGeometry = new BufferGeometry().setFromPoints(ghostPoints)
  const ghostMaterial = new LineBasicMaterial({
    color: CURVE_COLOR,
    transparent: true,
    opacity: GHOST_OPACITY
  })
  group.add(new Line(ghostGeometry, ghostMaterial))

  // 制御点を順に結んだ折れ線。曲線と描き分けるため破線にする
  const polygon = createPolyline(controls.length, LAYER_POLYGON)
  const polygonMaterial = new LineDashedMaterial({
    color: POLYGON_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const polygonLine = new Line(polygon.geometry, polygonMaterial)
  group.add(polygonLine)

  // 制御点から求めた曲線
  const curve = createPolyline(CURVE_SEGMENTS + 1, LAYER_CURVE)
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  group.add(new Line(curve.geometry, curveMaterial))

  // 制御点。動かす 1 つだけ、色と大きさを変えて見分けられるようにする
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  controls.forEach((control, i) => {
    if (i === MOVABLE_INDEX) return
    const mesh = new Mesh(controlGeometry, controlMaterial)
    mesh.position.set(control.x, control.y, LAYER_POINT)
    group.add(mesh)
  })
  const movableGeometry = new SphereGeometry(MOVABLE_RADIUS, 16, 12)
  const movableMaterial = new MeshBasicMaterial({ color: MOVABLE_COLOR })
  const movable = new Mesh(movableGeometry, movableMaterial)
  group.add(movable)

  const movableLabel = createLabel("P₁", MOVABLE_COLOR, LABEL_HEIGHT)
  const titleLabel = createLabel(title, TITLE_COLOR, TITLE_HEIGHT)
  titleLabel.sprite.position.set(0, TITLE_Y, LAYER_LABEL)
  group.add(movableLabel.sprite, titleLabel.sprite)

  return {
    object: group,
    /** 動かす制御点を置き直し、制御多角形と曲線を引き直す */
    update: (position: { x: number; y: number }) => {
      controls[MOVABLE_INDEX].set(position.x, position.y, 0)
      movable.position.set(position.x, position.y, LAYER_POINT)
      movableLabel.sprite.position
        .copy(controls[MOVABLE_INDEX])
        .add(MOVABLE_LABEL_OFFSET)
        .setZ(LAYER_LABEL)

      controls.forEach((control, i) => polygon.set(i, control))
      polygon.commit()
      // 破線の刻みは頂点ごとの「線に沿った距離」で決まるため、頂点を動かすたびに測り直す
      polygonLine.computeLineDistances()

      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        curve.set(i, bezierPoint(controls, i / CURVE_SEGMENTS, sample))
      }
      curve.commit()
    },
    dispose: () => {
      const disposables = [
        ghostGeometry,
        ghostMaterial,
        polygon.geometry,
        polygonMaterial,
        curve.geometry,
        curveMaterial,
        controlGeometry,
        controlMaterial,
        movableGeometry,
        movableMaterial,
        movableLabel.texture,
        movableLabel.material,
        titleLabel.texture,
        titleLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createControlPolygonScene = ({ scene, params }: SceneContext) => {
  // 制御点の数だけを変えた 2 枚を左右に並べ、同じ操作での違いを見比べられるようにする
  const quadratic = createPanel(QUADRATIC_POINTS, "制御点3つ", -PANEL_OFFSET)
  const cubic = createPanel(CUBIC_POINTS, "制御点4つ", PANEL_OFFSET)
  scene.add(quadratic.object, cubic.object)

  return {
    update: () => {
      quadratic.update(params.quadratic)
      cubic.update(params.cubic)
    },
    dispose: () => {
      quadratic.dispose()
      cubic.dispose()
    }
  }
}
