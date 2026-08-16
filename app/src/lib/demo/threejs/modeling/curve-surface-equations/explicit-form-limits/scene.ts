import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ExplicitFormLimitsParams = {
  /** 縦線を立てる位置の x 座標。円と曲面の両方に効く */
  x: number
  /** 縦線を立てる位置の y 座標。曲面のほうにだけ効く */
  y: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  curveHits: string
  surfaceHits: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ExplicitFormLimitsParams
}

/** 2 つの図を、原点から左右へ振り分ける距離 */
const GROUP_OFFSET = 2.4

/** 平面（x・y）方向の軸を、原点から正負どちらへも伸ばす長さ */
const PANEL_HALF = 1.5

/** 高さ（z）の軸を、xy 平面から上へ伸ばす長さと、下へ出す長さ */
const HEIGHT_AXIS_UP = 1.9
const HEIGHT_AXIS_DOWN = 0.25

/** 右の図の xy 平面を、左の図の原点より下げる距離。曲面が上へ伸びるぶんの釣り合いを取る */
const GROUND_DROP = 0.75

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.3

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 円の半径と、円を描く線の分割数 */
const CIRCLE_RADIUS = 1
const CIRCLE_SEGMENTS = 128

/** 縦線が円と交わりうる点の数 */
const MAX_CURVE_HITS = 2

/** 円の図で、縦線を上下へ伸ばす長さ */
const CURVE_PROBE_HALF = 1.3

/**
 * せり出した曲面の輪郭。`(z 軸からの距離, 高さ)` を下から上へ並べ、これを z 軸まわりに回して曲面にする。
 * 上のほうで一度外へ張り出してから内へ戻るので、張り出しの下に入る位置では高さが 3 つになる
 */
const PROFILE: [number, number][] = [
  [0.48, 0.0],
  [0.36, 0.38],
  [0.32, 0.76],
  [0.4, 0.92],
  [0.98, 1.14],
  [0.87, 1.34],
  [0.53, 1.52],
  [0.0, 1.63]
]

/** 輪郭を回す向きの分割数 */
const LATHE_SEGMENTS = 72

/** 縦線が曲面と交わりうる点の数。上の輪郭では最大 3 つ */
const MAX_SURFACE_HITS = 3

/** 曲面の図で、縦線を xy 平面から上下へ伸ばす長さ */
const SURFACE_PROBE_TOP = 1.85
const SURFACE_PROBE_BOTTOM = -0.2

/** xy 平面を示す正方形の 1 辺と、その塗りの不透明度 */
const GROUND_SIZE = PANEL_HALF * 2
const GROUND_OPACITY = 0.14

/** 曲面の不透明度。せり出しの下に入った縦線と交点が透けて見える濃さにする */
const SURFACE_OPACITY = 0.55

/** 交点を示す球の半径 */
const HIT_RADIUS = 0.075

const X_DIRECTION = new Vector3(1, 0, 0)
const UP_DIRECTION = new Vector3(0, 1, 0)
const DEPTH_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・円・曲面・縦線・交点が見分けられる色にする。
// 軸の色は、ほかのデモ（点と方向・座標系）と揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const CURVE_COLOR = "#ffc857"
const SURFACE_COLOR = "#9db4d0"
const PROBE_COLOR = "#e8e8ee"
const HIT_COLOR = "#f57fc4"
const PLANE_COLOR = "#8fa3bf"
const LIGHT_COLOR = "#ffffff"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 軸名は 1 文字だが、書体によって字幅が変わるので、文字の幅を測って板の横幅を決める
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

/**
 * 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る。
 * 高さの軸は下へ伸ばす意味が薄いので、正負で長さを変えられるようにしておく
 */
const createAxis = (
  name: string,
  color: string,
  direction: Vector3,
  forward: number,
  backward = forward
) => {
  const group = new Group()

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-backward),
    direction.clone().multiplyScalar(forward)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(forward)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(forward + LABEL_OFFSET)
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

/** 縦線とぶつかった点。数が変わるので、最大数だけ作っておいて表示を切り替える */
const createHitPoints = (count: number) => {
  const geometry = new SphereGeometry(HIT_RADIUS, 16, 12)
  const material = new MeshBasicMaterial({ color: HIT_COLOR })
  const meshes = Array.from({ length: count }, () => new Mesh(geometry, material))

  return {
    objects: meshes,
    setPositions: (positions: Vector3[]) => {
      meshes.forEach((mesh, index) => {
        mesh.visible = index < positions.length
        if (index < positions.length) mesh.position.copy(positions[index])
      })
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 縦線 `x = 一定` が円と交わる y。半径の外では交点がない */
const findCircleHeights = (x: number) => {
  const squared = CIRCLE_RADIUS * CIRCLE_RADIUS - x * x
  if (squared < 0) return []
  const y = Math.sqrt(squared)
  // 円の左端・右端では上下の交点が重なって 1 つになる
  return y === 0 ? [0] : [-y, y]
}

/** z 軸から `distance` だけ離れたところで、輪郭が持つ高さをすべて求める */
const findSurfaceHeights = (distance: number) => {
  const heights: number[] = []

  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [r0, h0] = PROFILE[i]
    const [r1, h1] = PROFILE[i + 1]
    // この区間をまたいでいなければ、輪郭はこの距離を通らない
    if (r0 === r1 || (distance - r0) * (distance - r1) > 0) continue
    heights.push(h0 + ((distance - r0) / (r1 - r0)) * (h1 - h0))
  }

  // 区間の継ぎ目をちょうど通ったときは同じ高さが 2 度出るので、隣り合う重なりを落とす
  return heights.filter(
    (height, index) => index === 0 || Math.abs(height - heights[index - 1]) > 1e-4
  )
}

/** 左の図。xy 平面に立てた円と、x を決めたときの y を読み取る縦線 */
const createCurvePanel = () => {
  const group = new Group()
  group.position.x = -GROUP_OFFSET

  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, PANEL_HALF),
    createAxis("y", Y_COLOR, UP_DIRECTION, PANEL_HALF)
  ]
  group.add(...axes.map((axis) => axis.object))

  // 円 x² + y² − r² = 0。xy 平面を立てて置き、x が右・y が上のまま読めるようにする
  const circlePoints: Vector3[] = []
  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2
    circlePoints.push(
      new Vector3(CIRCLE_RADIUS * Math.cos(angle), CIRCLE_RADIUS * Math.sin(angle), 0)
    )
  }
  const circleGeometry = new BufferGeometry().setFromPoints(circlePoints)
  const circleMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  group.add(new LineLoop(circleGeometry, circleMaterial))

  // x を決めたときの y を読み取る縦線。y 軸と平行なまま、x 軸に沿って動く
  const probeGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -CURVE_PROBE_HALF, 0),
    new Vector3(0, CURVE_PROBE_HALF, 0)
  ])
  const probeMaterial = new LineBasicMaterial({ color: PROBE_COLOR })
  const probe = new LineSegments(probeGeometry, probeMaterial)
  group.add(probe)

  const hits = createHitPoints(MAX_CURVE_HITS)
  group.add(...hits.objects)

  return {
    object: group,
    /** 縦線を x へ動かし、円と交わった点を置く。戻り値は交点の数 */
    setProbe: (x: number) => {
      probe.position.x = x
      const heights = findCircleHeights(x)
      hits.setPositions(heights.map((y) => new Vector3(x, y, 0)))
      return heights.length
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      hits.dispose()
      const disposables = [circleGeometry, circleMaterial, probeGeometry, probeMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 右の図。せり出した曲面と、xy 平面上の 1 点から立てた縦線 */
const createSurfacePanel = () => {
  const group = new Group()
  group.position.set(GROUP_OFFSET, -GROUND_DROP, 0)

  // 高さを表す z 軸をワールドの上向きにとる。残る x・y は床にあたる 2 方向に割り当てる
  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, PANEL_HALF),
    createAxis("y", Y_COLOR, DEPTH_DIRECTION, PANEL_HALF),
    createAxis("z", Z_COLOR, UP_DIRECTION, HEIGHT_AXIS_UP, HEIGHT_AXIS_DOWN)
  ]
  group.add(...axes.map((axis) => axis.object))

  // xy 平面。高さを割り当てる相手がこの平面上の点であることを示す
  const groundGeometry = new PlaneGeometry(GROUND_SIZE, GROUND_SIZE)
  const groundMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: GROUND_OPACITY,
    // 面より奥にあるものを薄く覆いたいだけなので、深度は比較するが書かない
    depthWrite: false
  })
  const ground = new Mesh(groundGeometry, groundMaterial)
  // PlaneGeometry は xy 平面に立っているので、床として寝かせる
  ground.rotation.x = -Math.PI / 2
  group.add(ground)

  // 輪郭を回してできる曲面。LatheGeometry は上向きの軸のまわりに回すので、高さがそのまま高さになる。
  // せり出しの下を通る縦線と交点が見えるよう、半透明にして深度は書かない
  const surfaceGeometry = new LatheGeometry(
    PROFILE.map(([radius, height]) => new Vector2(radius, height)),
    LATHE_SEGMENTS
  )
  const surfaceMaterial = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide,
    transparent: true,
    opacity: SURFACE_OPACITY,
    depthWrite: false
  })
  group.add(new Mesh(surfaceGeometry, surfaceMaterial))

  // xy 平面上の点から真上に立てた縦線。この 1 本が曲面と何回ぶつかるかを見る
  const probeGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, SURFACE_PROBE_BOTTOM, 0),
    new Vector3(0, SURFACE_PROBE_TOP, 0)
  ])
  const probeMaterial = new LineBasicMaterial({ color: PROBE_COLOR })
  const probe = new LineSegments(probeGeometry, probeMaterial)
  group.add(probe)

  const hits = createHitPoints(MAX_SURFACE_HITS)
  group.add(...hits.objects)

  return {
    object: group,
    /** 縦線を xy 平面上の (x, y) へ動かし、曲面と交わった点を置く。戻り値は交点の数 */
    setProbe: (x: number, y: number) => {
      // ワールドの奥行きが xy 平面の y にあたる
      probe.position.set(x, 0, y)

      // 回転体なので、交わり方は z 軸からの距離だけで決まる
      const heights = findSurfaceHeights(Math.hypot(x, y))
      hits.setPositions(heights.map((height) => new Vector3(x, height, y)))
      return heights.length
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      hits.dispose()
      const disposables = [
        groundGeometry,
        groundMaterial,
        surfaceGeometry,
        surfaceMaterial,
        probeGeometry,
        probeMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createExplicitFormLimitsScene = ({ scene, params }: SceneContext) => {
  // 1 つの x に y が 2 つ対応する円を左に、同じ位置に高さが複数ある曲面を右に並べる
  const curvePanel = createCurvePanel()
  const surfacePanel = createSurfacePanel()
  scene.add(curvePanel.object, surfacePanel.object)

  // 曲面のせり出しを陰影でも読み取れるようにする光。向きは固定
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light, new AmbientLight(LIGHT_COLOR, 0.5))

  return {
    update: () => {
      const curveCount = curvePanel.setProbe(params.x)
      const surfaceCount = surfacePanel.setProbe(params.x, params.y)

      // Tweakpane 側に読み取り専用で出す値。円では 2 まで、曲面では 3 まで増える
      params.curveHits = `${curveCount} 個`
      params.surfaceHits = `${surfaceCount} 個`
    },
    dispose: () => {
      curvePanel.dispose()
      surfacePanel.dispose()
    }
  }
}
