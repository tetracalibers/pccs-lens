import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type HomogeneousLineParams = {
  /** 同次座標の w 成分。0 でない値をとる */
  w: number
  /** 同次座標に掛ける定数倍 */
  k: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  scaled: string
  normalized: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: HomogeneousLineParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2.4

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** w = 1 の平面の 1 辺の半分の長さ */
const PLANE_HALF = 2

/** 平面の塗りの不透明度。奥の直線や点が透けて見える程度に抑える */
const PLANE_OPACITY = 0.12

/** w = 1 の平面に敷く格子の間隔 */
const GRID_STEP = 0.5

/** 格子線と外周の枠線の不透明度。塗りより濃くして、面の広がりと傾きを読めるようにする */
const GRID_OPACITY = 0.3
const FRAME_OPACITY = 0.7

/** w 軸が平面を貫く位置に打つ目盛りの、軸から各向きへ伸ばす長さ */
const TICK_HALF = 0.11

/**
 * 同次座標 (x, y, w) の x・y 成分。
 * この図で見せたいのは w と定数倍のはたらきなので、x・y は操作させず固定する
 */
const BASE_X = -0.57
const BASE_Y = 0.6

/**
 * 定数倍でたどれる点が並ぶ直線を、原点から正負どちらへも伸ばす長さ。
 * パラメータをどの端に振っても、k 倍した点が直線の内側に収まる長さにする
 */
const LINE_HALF = 5.2

/** 同次座標が指す点を表す球の半径 */
const POINT_RADIUS = 0.07

/** 原点を示す球の半径 */
const ORIGIN_RADIUS = 0.045

/** k がこの範囲まで 1 に近ければ、k 倍した点は (x, y, w) と重なっているものとして描かない */
const SAME_POINT_RANGE = 0.02

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 座標を書いたラベルの高さ。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_HEIGHT = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルを、それが指す点から離す距離 */
const LABEL_GAP = 0.14

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const W_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・平面・3 つの点が見分けられる色にする。
// w は 3 本目の軸なので、他のデモの z 軸と同じ青にする。
// 同じ点を指す 3 つの座標は、もとの同次座標・その定数倍・正規化後で色を分ける
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const W_COLOR = "#5ec8f2"
const BASE_COLOR = "#ffc857"
const SCALED_COLOR = "#b79cf5"
const NORMALIZED_COLOR = "#f57fc4"
const PLANE_COLOR = "#8fa3bf"
const LINE_COLOR = "#e8e8ee"
const ORIGIN_COLOR = "#9aa3b0"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * `(x/w, y/w, 1)` のような長いラベルもあるので、文字の幅を測って板の横幅を決める
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる半透明の面や線が
    // ラベルの矩形の形に欠け、文字に黒い下敷きが付いたように見える
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
 * w = 1 の平面に敷く格子と、その外周の枠線。
 * 一様な塗りだけでは面の傾きが読めず、点が面の上にあるのか手前に浮いているのか分からないので、
 * 遠近で収束する線を引いて、面を見える床にする
 */
const createPlaneGrid = () => {
  const group = new Group()

  // 外周は枠線として別に引くので、格子は内側の線だけを並べる
  const gridPoints: Vector3[] = []
  const lineCount = (PLANE_HALF * 2) / GRID_STEP
  for (let i = 1; i < lineCount; i++) {
    const offset = -PLANE_HALF + i * GRID_STEP
    gridPoints.push(
      new Vector3(offset, -PLANE_HALF, 1),
      new Vector3(offset, PLANE_HALF, 1),
      new Vector3(-PLANE_HALF, offset, 1),
      new Vector3(PLANE_HALF, offset, 1)
    )
  }
  const gridGeometry = new BufferGeometry().setFromPoints(gridPoints)
  const gridMaterial = new LineBasicMaterial({
    color: PLANE_COLOR,
    transparent: true,
    opacity: GRID_OPACITY,
    depthWrite: false
  })
  group.add(new LineSegments(gridGeometry, gridMaterial))

  // 面がどこまで広がっているかを確定させる外周。格子より濃くする
  const frameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-PLANE_HALF, -PLANE_HALF, 1),
    new Vector3(PLANE_HALF, -PLANE_HALF, 1),
    new Vector3(PLANE_HALF, PLANE_HALF, 1),
    new Vector3(-PLANE_HALF, PLANE_HALF, 1)
  ])
  const frameMaterial = new LineBasicMaterial({
    color: PLANE_COLOR,
    transparent: true,
    opacity: FRAME_OPACITY,
    depthWrite: false
  })
  group.add(new LineLoop(frameGeometry, frameMaterial))

  return {
    object: group,
    dispose: () => {
      const disposables = [gridGeometry, gridMaterial, frameGeometry, frameMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** w 軸が平面を貫く位置に打つ目盛り。どの向きから見ても読めるよう、面内の十字にする */
const createPlaneTick = () => {
  const geometry = new BufferGeometry().setFromPoints([
    new Vector3(-TICK_HALF, 0, 1),
    new Vector3(TICK_HALF, 0, 1),
    new Vector3(0, -TICK_HALF, 1),
    new Vector3(0, TICK_HALF, 1)
  ])
  const material = new LineBasicMaterial({ color: W_COLOR })

  return {
    object: new LineSegments(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 同次座標が指す位置を表す球 */
const createPoint = (color: string, radius: number) => {
  const geometry = new SphereGeometry(radius, 16, 12)
  const material = new MeshBasicMaterial({ color })

  return {
    mesh: new Mesh(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 1 本の線分。両端を毎フレーム書き換える */
const createSegment = (color: string) => {
  const position = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color })

  return {
    object: new LineSegments(geometry, material),
    setEnds: (from: Vector3, to: Vector3) => {
      position.setXYZ(0, from.x, from.y, from.z)
      position.setXYZ(1, to.x, to.y, to.z)
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** Tweakpane に読み取り専用で出す座標の文字列。-0.00 と出ないように 0 付近は丸める */
const formatPoint = (...values: number[]) =>
  `(${values.map((value) => (Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2))).join(", ")})`

export const createHomogeneousLineScene = ({ scene, params }: SceneContext) => {
  // 同次座標 (x, y, w) の w を 3 本目の軸として立てる。
  // Three.js の x・y をそのまま平面の x・y にあて、z を w にあてると、
  // w = 1 の平面は x が右・y が上のまま読める板になる
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  const wAxis = createAxis("w", W_COLOR, W_DIRECTION)
  scene.add(xAxis.object, yAxis.object, wAxis.object)

  // 正規化した同次座標が並ぶ w = 1 の平面。
  // 奥の直線や点を隠さないよう、薄く塗って深度は書かない
  const planeGeometry = new PlaneGeometry(PLANE_HALF * 2, PLANE_HALF * 2)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLANE_OPACITY,
    depthWrite: false
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  plane.position.z = 1
  scene.add(plane)

  const planeGrid = createPlaneGrid()
  scene.add(planeGrid.object)

  const planeLabel = createLabel("w = 1", PLANE_COLOR, VALUE_LABEL_HEIGHT)
  planeLabel.sprite.position.set(PLANE_HALF - 0.5, PLANE_HALF + 0.28, 1)
  scene.add(planeLabel.sprite)

  // 平面が w 軸のどの高さにあるのかを、軸の目盛りと数字で結びつける
  const planeTick = createPlaneTick()
  scene.add(planeTick.object)

  const tickLabel = createLabel("1", W_COLOR, VALUE_LABEL_HEIGHT)
  tickLabel.sprite.position.set(0, -(TICK_HALF + LABEL_GAP + tickLabel.sprite.scale.y / 2), 1)
  scene.add(tickLabel.sprite)

  // 定数倍でたどれる点が並ぶ直線は、必ずこの原点を通る
  const origin = createPoint(ORIGIN_COLOR, ORIGIN_RADIUS)
  scene.add(origin.mesh)
  const line = createSegment(LINE_COLOR)
  scene.add(line.object)

  // 同じ 1 点を指す 3 つの座標。もとの同次座標・その定数倍・w で割って正規化した座標
  const basePoint = createPoint(BASE_COLOR, POINT_RADIUS)
  const scaledPoint = createPoint(SCALED_COLOR, POINT_RADIUS)
  const normalizedPoint = createPoint(NORMALIZED_COLOR, POINT_RADIUS)
  scene.add(basePoint.mesh, scaledPoint.mesh, normalizedPoint.mesh)

  const baseLabel = createLabel("(x, y, w)", BASE_COLOR, VALUE_LABEL_HEIGHT)
  const scaledLabel = createLabel("k(x, y, w)", SCALED_COLOR, VALUE_LABEL_HEIGHT)
  const normalizedLabel = createLabel("(x/w, y/w, 1)", NORMALIZED_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(baseLabel.sprite, scaledLabel.sprite, normalizedLabel.sprite)

  const scaledPosition = new Vector3()
  const direction = new Vector3()
  const lineStart = new Vector3()
  const lineEnd = new Vector3()

  return {
    update: () => {
      const { w, k } = params

      // 同次座標 (x, y, w) が指す点
      basePoint.mesh.position.set(BASE_X, BASE_Y, w)
      baseLabel.sprite.position.set(BASE_X, BASE_Y + LABEL_GAP + baseLabel.sprite.scale.y / 2, w)

      // k 倍した (kx, ky, kw)。同じ点を指す別の書き方で、直線上を移動する。
      // k が 1 のときは (x, y, w) にぴったり重なるので描かない
      const overlapped = Math.abs(k - 1) < SAME_POINT_RANGE
      scaledPoint.mesh.visible = !overlapped
      scaledLabel.sprite.visible = !overlapped
      scaledPosition.set(k * BASE_X, k * BASE_Y, k * w)
      scaledPoint.mesh.position.copy(scaledPosition)
      scaledLabel.sprite.position.set(
        scaledPosition.x,
        scaledPosition.y + LABEL_GAP + scaledLabel.sprite.scale.y / 2,
        scaledPosition.z
      )

      // 定数倍でたどれる点をすべて集めると、原点を通る 1 本の直線になる
      direction.set(BASE_X, BASE_Y, w).normalize()
      line.setEnds(
        lineStart.copy(direction).multiplyScalar(-LINE_HALF),
        lineEnd.copy(direction).multiplyScalar(LINE_HALF)
      )

      // x と y を w で割ると、直線が w = 1 の平面と交わる点になる。
      // k を掛けても分子と分母で約分されて消えるので、この点は k を動かしても動かない
      normalizedPoint.mesh.position.set(BASE_X / w, BASE_Y / w, 1)
      normalizedLabel.sprite.position.set(
        BASE_X / w,
        BASE_Y / w - (LABEL_GAP + normalizedLabel.sprite.scale.y / 2),
        1
      )

      // Tweakpane 側に読み取り専用で出す値。k を動かすと上だけが変わり、下は変わらない
      params.scaled = formatPoint(scaledPosition.x, scaledPosition.y, scaledPosition.z)
      params.normalized = formatPoint(BASE_X / w, BASE_Y / w)
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      wAxis.dispose()
      planeGrid.dispose()
      planeTick.dispose()
      origin.dispose()
      line.dispose()
      basePoint.dispose()
      scaledPoint.dispose()
      normalizedPoint.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        planeLabel.texture,
        planeLabel.material,
        tickLabel.texture,
        tickLabel.material,
        baseLabel.texture,
        baseLabel.material,
        scaledLabel.texture,
        scaledLabel.material,
        normalizedLabel.texture,
        normalizedLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
