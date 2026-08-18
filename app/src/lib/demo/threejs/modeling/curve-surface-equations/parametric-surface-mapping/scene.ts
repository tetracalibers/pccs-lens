import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
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
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ParametricSurfaceMappingParams = {
  /** 平面上の位置を決める 2 つのパラメータ。どちらも 0 から 1 まで */
  u: number
  v: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  point: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ParametricSurfaceMappingParams
}

/** 2 つの図を、原点から左右へ振り分ける距離 */
const GROUP_OFFSET = 2.4

/** u・v が張る平面上で、矩形の領域を描く大きさ */
const DOMAIN_SCALE = 1.8

/** 曲面の半径。球面の一部を切り取った形にする */
const RADIUS = 1.15

/** u が 0 から 1 まで動くあいだに、軸のまわりを回る角度 */
const U_SWEEP = Math.PI * 1.5

/** v が 0 から 1 まで動くあいだに、上下へ振れる角度 */
const V_SWEEP = Math.PI * (2 / 3)

/** 領域と曲面に引く線の本数（区間の数）。両方の図で同じにする */
const GRID_DIVISIONS = 6

/** 曲面の上の曲線を折れ線で描くときの分割数 */
const CURVE_SAMPLES = 36

/** 曲面のメッシュを作るときの分割数。線より細かく刻んで面を滑らかにする */
const SURFACE_STEPS_U = 48
const SURFACE_STEPS_V = 24

/** 領域を示す矩形の塗りの不透明度 */
const DOMAIN_OPACITY = 0.14

/** 曲面の不透明度。裏側を通る線が透けて見える濃さにする */
const SURFACE_OPACITY = 0.45

/** 選んだ点を示す球の半径 */
const MARKER_RADIUS = 0.075

/** u・v 軸を、領域の手前と奥へはみ出させる長さ */
const DOMAIN_AXIS_BACK = 0.25
const DOMAIN_AXIS_FORWARD = DOMAIN_SCALE + 0.4

/** 曲面の図の軸を、原点から正負どちらへも伸ばす長さ */
const SPACE_AXIS_HALF = 1.5

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

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const Z_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・領域・曲面・2 本の強調線・選んだ点が見分けられる色にする。
// 軸の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const GRID_COLOR = "#9aa3b0"
const FIXED_U_COLOR = "#ffc857"
const FIXED_V_COLOR = "#b79cf5"
const MARKER_COLOR = "#f57fc4"
const SURFACE_COLOR = "#9db4d0"
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

/** 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
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

/**
 * `(u, v)` の組から、空間中の点を求める。
 * u は軸のまわりを回る角度に、v は上下へ振れる角度にあてて、球面の一部を切り取った曲面にする
 */
const evaluate = (u: number, v: number, target: Vector3) => {
  const around = u * U_SWEEP
  const upward = (v - 0.5) * V_SWEEP
  const ring = RADIUS * Math.cos(upward)
  return target.set(ring * Math.cos(around), ring * Math.sin(around), RADIUS * Math.sin(upward))
}

/** `(u, v)` の格子を空間へ写し、四角形を三角形に割って曲面のメッシュにする */
const createSurfaceGeometry = () => {
  const positions: number[] = []
  const indices: number[] = []
  const point = new Vector3()

  for (let i = 0; i <= SURFACE_STEPS_U; i++) {
    for (let j = 0; j <= SURFACE_STEPS_V; j++) {
      evaluate(i / SURFACE_STEPS_U, j / SURFACE_STEPS_V, point)
      positions.push(point.x, point.y, point.z)
    }
  }

  for (let i = 0; i < SURFACE_STEPS_U; i++) {
    for (let j = 0; j < SURFACE_STEPS_V; j++) {
      // 格子の 1 マスを囲む 4 つの頂点。u 方向に 1 つ進むと v の分割数だけ番号が飛ぶ
      const current = i * (SURFACE_STEPS_V + 1) + j
      const next = current + SURFACE_STEPS_V + 1
      indices.push(current, next, current + 1, next, next + 1, current + 1)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** 曲面の上に引く線。u を一定にした線と v を一定にした線を、格子と同じ本数だけ並べる */
const createSurfaceGridGeometry = () => {
  const points: Vector3[] = []

  // 曲がった線なので、細かく刻んだ折れ線としてつなぐ
  const pushCurve = (at: (t: number) => Vector3) => {
    for (let k = 0; k < CURVE_SAMPLES; k++) {
      points.push(at(k / CURVE_SAMPLES), at((k + 1) / CURVE_SAMPLES))
    }
  }

  for (let i = 0; i <= GRID_DIVISIONS; i++) {
    const u = i / GRID_DIVISIONS
    pushCurve((t) => evaluate(u, t, new Vector3()))
  }
  for (let j = 0; j <= GRID_DIVISIONS; j++) {
    const v = j / GRID_DIVISIONS
    pushCurve((t) => evaluate(t, v, new Vector3()))
  }

  return new BufferGeometry().setFromPoints(points)
}

/** 平面上の矩形の領域に引く線。こちらは縦横まっすぐな線でよい */
const createDomainGridGeometry = () => {
  const points: Vector3[] = []

  for (let i = 0; i <= GRID_DIVISIONS; i++) {
    const at = (i / GRID_DIVISIONS) * DOMAIN_SCALE
    points.push(new Vector3(at, 0, 0), new Vector3(at, DOMAIN_SCALE, 0))
    points.push(new Vector3(0, at, 0), new Vector3(DOMAIN_SCALE, at, 0))
  }

  return new BufferGeometry().setFromPoints(points)
}

/** 片方のパラメータを固定して、もう片方を動かしたときに曲面上にできる曲線 */
const createIsoCurve = (color: string) => {
  const positions = new Float32BufferAttribute(new Float32Array((CURVE_SAMPLES + 1) * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const point = new Vector3()

  return {
    object: new Line(geometry, material),
    setCurve: (toPoint: (t: number, target: Vector3) => void) => {
      for (let i = 0; i <= CURVE_SAMPLES; i++) {
        toPoint(i / CURVE_SAMPLES, point)
        positions.setXYZ(i, point.x, point.y, point.z)
      }
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 選んだ点を示す球 */
const createMarker = () => {
  const geometry = new SphereGeometry(MARKER_RADIUS, 16, 12)
  const material = new MeshBasicMaterial({ color: MARKER_COLOR })

  return {
    object: new Mesh(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** Tweakpane に読み取り専用で出す座標の文字列。-0.00 と出ないように 0 付近は丸める */
const formatPoint = (...values: number[]) =>
  `(${values.map((value) => (Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2))).join(", ")})`

/** 左の図。u と v が張る平面と、そこに取った矩形の領域 */
const createDomainPanel = () => {
  const group = new Group()
  // 矩形の中心が左半分の真ん中に来るように置く
  group.position.set(-GROUP_OFFSET - DOMAIN_SCALE / 2, -DOMAIN_SCALE / 2, 0)

  const axes = [
    createAxis("u", X_COLOR, X_DIRECTION, DOMAIN_AXIS_FORWARD, DOMAIN_AXIS_BACK),
    createAxis("v", Y_COLOR, Y_DIRECTION, DOMAIN_AXIS_FORWARD, DOMAIN_AXIS_BACK)
  ]
  group.add(...axes.map((axis) => axis.object))

  // 領域の塗り。PlaneGeometry は原点を中心に作られるので、矩形の中心へずらす
  const fillGeometry = new PlaneGeometry(DOMAIN_SCALE, DOMAIN_SCALE)
  const fillMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: DOMAIN_OPACITY,
    depthWrite: false
  })
  const fill = new Mesh(fillGeometry, fillMaterial)
  fill.position.set(DOMAIN_SCALE / 2, DOMAIN_SCALE / 2, 0)
  group.add(fill)

  const gridGeometry = createDomainGridGeometry()
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  group.add(new LineSegments(gridGeometry, gridMaterial))

  // u を固定した線は縦に、v を固定した線は横に走る。どちらも領域の端から端まで
  const fixedUGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(0, DOMAIN_SCALE, 0)
  ])
  const fixedUMaterial = new LineBasicMaterial({ color: FIXED_U_COLOR })
  const fixedU = new Line(fixedUGeometry, fixedUMaterial)
  group.add(fixedU)

  const fixedVGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(DOMAIN_SCALE, 0, 0)
  ])
  const fixedVMaterial = new LineBasicMaterial({ color: FIXED_V_COLOR })
  const fixedV = new Line(fixedVGeometry, fixedVMaterial)
  group.add(fixedV)

  const marker = createMarker()
  group.add(marker.object)

  return {
    object: group,
    setParameters: (u: number, v: number) => {
      fixedU.position.x = u * DOMAIN_SCALE
      fixedV.position.y = v * DOMAIN_SCALE
      marker.object.position.set(u * DOMAIN_SCALE, v * DOMAIN_SCALE, 0)
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      marker.dispose()
      const disposables = [
        fillGeometry,
        fillMaterial,
        gridGeometry,
        gridMaterial,
        fixedUGeometry,
        fixedUMaterial,
        fixedVGeometry,
        fixedVMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 右の図。領域を写し取った空間中の曲面 */
const createSurfacePanel = () => {
  const group = new Group()
  group.position.x = GROUP_OFFSET
  // 記事と同じ座標の書き方（z が高さ）をそのまま使えるよう、グループごと寝かせて z 軸を上に向ける
  group.rotation.x = -Math.PI / 2

  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, SPACE_AXIS_HALF),
    createAxis("y", Y_COLOR, Y_DIRECTION, SPACE_AXIS_HALF),
    createAxis("z", Z_COLOR, Z_DIRECTION, SPACE_AXIS_HALF)
  ]
  group.add(...axes.map((axis) => axis.object))

  const surfaceGeometry = createSurfaceGeometry()
  const surfaceMaterial = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide,
    transparent: true,
    opacity: SURFACE_OPACITY,
    // 裏側を通る線が透けるよう、深度は比較するが書かない
    depthWrite: false
  })
  group.add(new Mesh(surfaceGeometry, surfaceMaterial))

  const gridGeometry = createSurfaceGridGeometry()
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  group.add(new LineSegments(gridGeometry, gridMaterial))

  const fixedU = createIsoCurve(FIXED_U_COLOR)
  const fixedV = createIsoCurve(FIXED_V_COLOR)
  group.add(fixedU.object, fixedV.object)

  const marker = createMarker()
  group.add(marker.object)

  const point = new Vector3()

  return {
    object: group,
    /** 選んだ u・v に対応する 2 本の曲線と点を置く。戻り値は点の座標 */
    setParameters: (u: number, v: number) => {
      fixedU.setCurve((t, target) => evaluate(u, t, target))
      fixedV.setCurve((t, target) => evaluate(t, v, target))
      marker.object.position.copy(evaluate(u, v, point))
      return point
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      fixedU.dispose()
      fixedV.dispose()
      marker.dispose()
      const disposables = [surfaceGeometry, surfaceMaterial, gridGeometry, gridMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createParametricSurfaceMappingScene = ({ scene, params }: SceneContext) => {
  // 左に u・v が張る平面の領域、右にそれを写し取った空間中の曲面を並べる
  const domainPanel = createDomainPanel()
  const surfacePanel = createSurfacePanel()
  scene.add(domainPanel.object, surfacePanel.object)

  // 曲面のふくらみを陰影でも読み取れるようにする光。向きは固定
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light, new AmbientLight(LIGHT_COLOR, 0.5))

  return {
    update: () => {
      domainPanel.setParameters(params.u, params.v)
      const point = surfacePanel.setParameters(params.u, params.v)

      // Tweakpane 側に読み取り専用で出す値。u と v の組を決めると点が 1 つ決まる
      params.point = formatPoint(point.x, point.y, point.z)
    },
    dispose: () => {
      domainPanel.dispose()
      surfacePanel.dispose()
    }
  }
}
