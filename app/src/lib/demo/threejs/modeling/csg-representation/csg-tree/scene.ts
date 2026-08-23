import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Euler,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  Vector3
} from "three"

/** 同じ形を作る 2 通りのCSG木 */
export type TreeKind = "stackFirst" | "drillFirst"

/** Tweakpane で操作するパラメータ */
export type CsgTreeParams = {
  tree: TreeKind
  /** 葉から根へ向かって適用し終えた演算の数 */
  step: number
  /** 今適用した演算。scene.ts が組み立てて書き戻す */
  current: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: CsgTreeParams
}

type PrimitiveName = "lower" | "upper" | "cylinder"

/** 下の板。上の板と積み上げて階段の 1 段目になる */
const LOWER_CENTER = new Vector3(0, -0.175, 0)
const LOWER_HALF = new Vector3(1, 0.175, 0.6)

/** 上の板。下の板の半分の幅で、右半分の上に載る */
const UPPER_CENTER = new Vector3(0.5, 0.175, 0)
const UPPER_HALF = new Vector3(0.5, 0.175, 0.6)

/** 穴を開ける円柱。上の板が載っていない左半分を貫き、上下に大きく突き出す */
const CYLINDER_CENTER = new Vector3(-0.5, -0.175, 0)
const CYLINDER_RADIUS = 0.28
const CYLINDER_HEIGHT = 1.3

/** 面を切り分ける細かさ。切り口の曲線がなめらかな線に見える程度に分割する */
const LOWER_SEGMENTS: [number, number, number] = [48, 4, 30]
const UPPER_SEGMENTS: [number, number, number] = [8, 4, 8]
const CYLINDER_SEGMENTS = 64
const CYLINDER_RINGS = 6

/** 交点を求める二分探索の回数 */
const CROSSING_STEPS = 24

/**
 * 判定値がこれより大きい頂点を「残る側」として扱う。
 * 直方体の稜線にちょうど乗っている頂点は、隣の面の条件がちょうど 0 になって内外が決まらない。
 * わずかに負の側まで残す側に含めると、稜線に接する三角形が落ちなくなる。
 */
const KEEP_THRESHOLD = -1e-9

/**
 * 面の表裏を調べるときに、そのプリミティブ自身の内外判定値として置く小さな値。
 * 「面のすぐ内側」「面のすぐ外側」を表すだけの目印。
 */
const SURFACE_MARGIN = 1e-4

/**
 * 面の表裏を調べる点を、面からどれだけ離すか。
 * ほかのプリミティブの面とちょうど重なっている面（積み上げた板の接する面など）の
 * 内外を決めるために要る。切り口の位置がこの分だけずれるので、十分小さく取る。
 */
const PROBE_OFFSET = 1e-4

/** プリミティブごとの色。木の葉のアイコンと、そのプリミティブから来た面に同じ色を使う */
const PRIMITIVE_COLORS: Record<PrimitiveName, string> = {
  lower: "#9db4d0",
  upper: "#7fd88f",
  cylinder: "#f57fc4"
}
const GHOST_OPACITY = 0.16

/**
 * 半透明のプリミティブに輪郭線を描く稜線の、隣り合う面のなす角のしきい値（度）。
 * 円柱の側面のように分割の継ぎ目でしかない稜線を線にすると、面ではなく網に見えてしまう。
 * 直方体の稜線や円柱の縁だけが残るように、分割の細かさより十分大きく取る。
 */
const GHOST_EDGE_ANGLE = 30
const LIGHT_COLOR = "#ffffff"

/** CSG木の図の色。適用済み・今適用した演算・未適用で塗り分ける */
const EDGE_COLOR = "#6d7f96"
const DONE_COLOR = "#e8e8ee"
const CURRENT_COLOR = "#ffc857"
const PENDING_COLOR = "#5b6474"

/** 木を描く位置と、立体を置く位置・向き（真正面から見て立体の角が手前を向く向き） */
const TREE_POSITION: [number, number, number] = [-1.6, 0, 0]
const SOLID_POSITION: [number, number, number] = [1.4, 0.05, 0]
const SOLID_ROTATION: [number, number, number] = [0.55, 0.62, 0]

/** 木の節点の間隔 */
const NODE_SPACING_X = 0.66
const NODE_SPACING_Y = 0.78

// ---------------------------------------------------------------------------
// プリミティブ
// ---------------------------------------------------------------------------

/** 点が直方体の内部にあれば正、外部にあれば負を返す（0 がちょうど表面） */
const insideSlab = (center: Vector3, half: Vector3) => (p: Vector3) =>
  Math.min(
    half.x - Math.abs(p.x - center.x),
    half.y - Math.abs(p.y - center.y),
    half.z - Math.abs(p.z - center.z)
  )

/** 点が円柱の内部にあれば正、外部にあれば負を返す */
const insideCylinder = (p: Vector3) =>
  Math.min(
    CYLINDER_RADIUS - Math.hypot(p.x - CYLINDER_CENTER.x, p.z - CYLINDER_CENTER.z),
    CYLINDER_HEIGHT / 2 - Math.abs(p.y - CYLINDER_CENTER.y)
  )

/** 直方体の面の法線。平面なので、元の三角形の法線がそのまま使える */
const slabNormalAt = (_p: Vector3, faceNormal: Vector3) => faceNormal.clone()

/** 円柱の法線。上下の面は元の三角形の法線、側面は軸から外へ向かう向き */
const cylinderNormalAt = (p: Vector3, faceNormal: Vector3) =>
  Math.abs(faceNormal.y) > 0.5
    ? faceNormal.clone()
    : new Vector3(p.x - CYLINDER_CENTER.x, 0, p.z - CYLINDER_CENTER.z).normalize()

/** プリミティブごとの、表示名・内外判定の式・法線 */
const PRIMITIVES: Record<
  PrimitiveName,
  {
    label: string
    inside: (p: Vector3) => number
    normalAt: (p: Vector3, faceNormal: Vector3) => Vector3
  }
> = {
  lower: {
    label: "下の板",
    inside: insideSlab(LOWER_CENTER, LOWER_HALF),
    normalAt: slabNormalAt
  },
  upper: {
    label: "上の板",
    inside: insideSlab(UPPER_CENTER, UPPER_HALF),
    normalAt: slabNormalAt
  },
  cylinder: { label: "円柱", inside: insideCylinder, normalAt: cylinderNormalAt }
}

// ---------------------------------------------------------------------------
// CSG木
// ---------------------------------------------------------------------------

type Operation = "union" | "intersection" | "difference"

/** 木の節点。column・level は木の図を描くときの位置 */
type CsgNode =
  | { kind: "leaf"; primitive: PrimitiveName; column: number; level: number }
  | {
      kind: "op"
      operation: Operation
      left: CsgNode
      right: CsgNode
      column: number
      level: number
    }

const leaf = (primitive: PrimitiveName, column: number, level: number): CsgNode => ({
  kind: "leaf",
  primitive,
  column,
  level
})

const op = (
  operation: Operation,
  left: CsgNode,
  right: CsgNode,
  column: number,
  level: number
): CsgNode => ({ kind: "op", operation, left, right, column, level })

/**
 * 点が木の表す立体の内部にあれば正、外部にあれば負を返す。
 *
 * target を渡すと、その葉の内外判定だけを override に差し替えて評価する。
 * 面の表裏を調べるときに、その面自身を「すぐ内側」「すぐ外側」に固定するために使う。
 */
const signedInside = (node: CsgNode, p: Vector3, target?: PrimitiveName, override = 0): number => {
  if (node.kind === "leaf")
    return node.primitive === target ? override : PRIMITIVES[node.primitive].inside(p)
  const left = signedInside(node.left, p, target, override)
  const right = signedInside(node.right, p, target, override)
  // 和集合は「どちらかの内部」、積集合は「どちらの内部でもある」、差集合は「左の内部かつ右の外部」
  if (node.operation === "union") return Math.max(left, right)
  if (node.operation === "intersection") return Math.min(left, right)
  return Math.min(left, -right)
}

/** 木に含まれる葉を、差集合で引く側にあるか（削り取る側か）とともに集める */
const collectLeaves = (
  node: CsgNode,
  subtracted = false,
  out: { primitive: PrimitiveName; subtracted: boolean }[] = []
) => {
  if (node.kind === "leaf") {
    out.push({ primitive: node.primitive, subtracted })
    return out
  }
  collectLeaves(node.left, subtracted, out)
  // 差集合の右側にある葉は、立体の内と外が入れ替わる
  collectLeaves(node.right, node.operation === "difference" ? !subtracted : subtracted, out)
  return out
}

/** 木に含まれる節点を、葉から根へ適用していく順に並べる */
const collectOperations = (node: CsgNode, out: CsgNode[] = []) => {
  if (node.kind === "leaf") return out
  collectOperations(node.left, out)
  collectOperations(node.right, out)
  out.push(node)
  return out
}

/**
 * 先に板を積み上げて階段にしてから、1 段目に穴を開ける木。
 * (下の板 ∪ 上の板) − 円柱
 */
const createStackFirstTree = () =>
  op(
    "difference",
    op("union", leaf("lower", -1, 2), leaf("upper", 0, 2), -0.5, 1),
    leaf("cylinder", 1, 1),
    0.25,
    0
  )

/**
 * 先に 1 枚目の板へ穴を開けてから、2 枚目を積み上げて階段にする木。
 * (下の板 − 円柱) ∪ 上の板
 */
const createDrillFirstTree = () =>
  op(
    "union",
    op("difference", leaf("lower", -1, 2), leaf("cylinder", 0, 2), -0.5, 1),
    leaf("upper", 1, 1),
    0.25,
    0
  )

/** 木の深さ（根を 0 とした最大の段数） */
const treeDepth = (node: CsgNode): number =>
  node.kind === "leaf" ? node.level : Math.max(treeDepth(node.left), treeDepth(node.right))

/** 節点を置く位置。木ごとに深さが違うので、上下は木の中央で揃える */
const nodePosition = (node: CsgNode, depth: number) =>
  new Vector3(node.column * NODE_SPACING_X, (depth / 2 - node.level) * NODE_SPACING_Y, 0)

const OPERATION_SYMBOLS: Record<Operation, string> = {
  union: "∪",
  intersection: "∩",
  difference: "−"
}

/** 今適用した演算を表す短い式。途中の結果は「途中結果」とまとめる */
const operationLabel = (node: CsgNode) => {
  if (node.kind === "leaf") return PRIMITIVES[node.primitive].label
  // 両側とも途中結果のときは、木のどちらの枝かが分かるように左右を添える
  const bothComposite = node.left.kind === "op" && node.right.kind === "op"
  const name = (child: CsgNode, side: string) =>
    child.kind === "leaf"
      ? PRIMITIVES[child.primitive].label
      : (bothComposite ? side : "") + "途中結果"
  return (
    name(node.left, "左の") +
    " " +
    OPERATION_SYMBOLS[node.operation] +
    " " +
    name(node.right, "右の")
  )
}

/** 何段目まで適用したかで決まる、今画面に置かれる立体の集まり */
const forestAt = (root: CsgNode, order: CsgNode[], step: number) => {
  const applied = new Set(order.slice(0, step))
  const roots: CsgNode[] = []
  const walk = (node: CsgNode) => {
    // 適用済みの節点は、そこまでを 1 つの立体としてまとめて置く
    if (node.kind === "leaf" || applied.has(node)) {
      roots.push(node)
      return
    }
    walk(node.left)
    walk(node.right)
  }
  walk(root)
  return roots
}

// ---------------------------------------------------------------------------
// 面の切り分け
// ---------------------------------------------------------------------------

/** 線分上で判定値が 0 になる点を二分探索で求める */
const findCrossing = (
  positive: Vector3,
  negative: Vector3,
  faceNormal: Vector3,
  value: (p: Vector3, faceNormal: Vector3) => number
) => {
  const lo = positive.clone()
  const hi = negative.clone()
  const mid = new Vector3()
  for (let i = 0; i < CROSSING_STEPS; i++) {
    mid.copy(lo).add(hi).multiplyScalar(0.5)
    if (value(mid, faceNormal) > KEEP_THRESHOLD) lo.copy(mid)
    else hi.copy(mid)
  }
  return lo.add(hi).multiplyScalar(0.5)
}

/**
 * プリミティブの表面を、判定値の符号が変わる辺で切り分け、残る側だけを集めたジオメトリを作る。
 * 判定値が正の部分が残り、辺の途中で符号が変わる三角形は交点で切り分ける。
 */
const clipSurface = (
  source: BufferGeometry,
  value: (p: Vector3, faceNormal: Vector3) => number,
  normalAt: (p: Vector3, faceNormal: Vector3) => Vector3,
  flip: boolean
) => {
  const position = source.getAttribute("position")
  const sourceNormal = source.getAttribute("normal")
  const positions: number[] = []
  const normals: number[] = []

  const faceNormal = new Vector3()
  const corners = [new Vector3(), new Vector3(), new Vector3()]
  const values = [0, 0, 0]

  const emit = (triangle: Vector3[]) => {
    // 削り口の壁は法線とともに表裏（頂点の並び順）も反転させる
    const ordered = flip ? [triangle[0], triangle[2], triangle[1]] : triangle
    for (const point of ordered) {
      const normal = normalAt(point, faceNormal)
      if (flip) normal.negate()
      positions.push(point.x, point.y, point.z)
      normals.push(normal.x, normal.y, normal.z)
    }
  }

  for (let i = 0; i < position.count; i += 3) {
    faceNormal.fromBufferAttribute(sourceNormal, i)
    for (let k = 0; k < 3; k++) {
      corners[k].fromBufferAttribute(position, i + k)
      values[k] = value(corners[k], faceNormal)
    }

    const keptCount = values.filter((v) => v > KEEP_THRESHOLD).length
    if (keptCount === 0) continue
    if (keptCount === 3) {
      emit([corners[0].clone(), corners[1].clone(), corners[2].clone()])
      continue
    }

    // 符号が 1 つだけ違う頂点を先頭に回してから切り分ける
    const odd = values.findIndex((v) =>
      keptCount === 1 ? v > KEEP_THRESHOLD : v <= KEEP_THRESHOLD
    )
    const a = corners[odd]
    const b = corners[(odd + 1) % 3]
    const c = corners[(odd + 2) % 3]

    if (keptCount === 1) {
      // 残るのは a を含む三角形 1 枚
      emit([
        a.clone(),
        findCrossing(a, b, faceNormal, value),
        findCrossing(a, c, faceNormal, value)
      ])
    } else {
      // 残るのは b・c を含む四角形。元の並び順を保ったまま三角形 2 枚に分ける
      const ab = findCrossing(b, a, faceNormal, value)
      const ac = findCrossing(c, a, faceNormal, value)
      emit([ab.clone(), b.clone(), c.clone()])
      emit([ab, c.clone(), ac])
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3))
  return geometry
}

/**
 * プリミティブの表面のうち、木の表す立体の表面として残る部分を正で返す判定値を作る。
 *
 * その面のすぐ内側とすぐ外側で木の内外を調べ、「内側が立体の中・外側が立体の外」に
 * なっているところだけが結果の表面として残る。削り取る側の葉ではこの内と外が入れ替わる。
 *
 * そのプリミティブ自身は判定値を差し替えて内外を表し、ほかのプリミティブは面から
 * わずかに離した点で評価する。離すのは、積み上げた板の接する面のように、面どうしが
 * ちょうど重なっている場合に内外を決めるため。
 */
const boundaryValue = (
  node: CsgNode,
  primitive: PrimitiveName,
  normalAt: (p: Vector3, faceNormal: Vector3) => Vector3,
  subtracted: boolean
) => {
  const probe = new Vector3()
  const solidSide = subtracted ? -SURFACE_MARGIN : SURFACE_MARGIN
  const solidOffset = subtracted ? PROBE_OFFSET : -PROBE_OFFSET
  return (p: Vector3, faceNormal: Vector3) => {
    const normal = normalAt(p, faceNormal)
    const inner = signedInside(
      node,
      probe.copy(p).addScaledVector(normal, solidOffset),
      primitive,
      solidSide
    )
    const outer = signedInside(
      node,
      probe.copy(p).addScaledVector(normal, -solidOffset),
      primitive,
      -solidSide
    )
    return Math.min(inner, -outer)
  }
}

// ---------------------------------------------------------------------------
// 木の図
// ---------------------------------------------------------------------------

/** 集合演算の記号を描いたバッジのテクスチャ */
const createBadgeTexture = (symbol: string) => {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (context) {
    context.fillStyle = "#3b414d"
    context.beginPath()
    context.arc(64, 64, 60, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = "#ffffff"
    context.font = "bold 74px 'Helvetica Neue', Arial, sans-serif"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(symbol, 64, 70)
  }
  return new CanvasTexture(canvas)
}

type NodeState = "done" | "current" | "pending"

export const createCsgTreeScene = ({ scene, camera, params }: SceneContext) => {
  const created: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(item: T) => {
    created.push(item)
    return item
  }

  /** 三角形に分けたプリミティブの表面。ここでの座標がそのままワールド座標になる */
  const buildSurface = (indexed: BufferGeometry) => {
    const surface = indexed.toNonIndexed()
    indexed.dispose()
    return track(surface)
  }

  const surfaces: Record<PrimitiveName, BufferGeometry> = {
    lower: buildSurface(
      new BoxGeometry(
        LOWER_HALF.x * 2,
        LOWER_HALF.y * 2,
        LOWER_HALF.z * 2,
        ...LOWER_SEGMENTS
      ).translate(LOWER_CENTER.x, LOWER_CENTER.y, LOWER_CENTER.z)
    ),
    upper: buildSurface(
      new BoxGeometry(
        UPPER_HALF.x * 2,
        UPPER_HALF.y * 2,
        UPPER_HALF.z * 2,
        ...UPPER_SEGMENTS
      ).translate(UPPER_CENTER.x, UPPER_CENTER.y, UPPER_CENTER.z)
    ),
    cylinder: buildSurface(
      new CylinderGeometry(
        CYLINDER_RADIUS,
        CYLINDER_RADIUS,
        CYLINDER_HEIGHT,
        CYLINDER_SEGMENTS,
        CYLINDER_RINGS
      ).translate(CYLINDER_CENTER.x, CYLINDER_CENTER.y, CYLINDER_CENTER.z)
    )
  }

  // 木の葉に置く、プリミティブそのものを小さくしたアイコン
  const icons: Record<PrimitiveName, BufferGeometry> = {
    lower: track(new BoxGeometry(0.3, 0.06, 0.18)),
    upper: track(new BoxGeometry(0.15, 0.06, 0.18)),
    cylinder: track(new CylinderGeometry(0.06, 0.06, 0.26, 24))
  }

  const materials = {} as Record<PrimitiveName, MeshStandardMaterial>
  // まだ演算されていないプリミティブ用の、半透明のマテリアルと輪郭線。
  // 不透明のままだと、演算でできた立体との区別がつかない
  const ghostMaterials = {} as Record<PrimitiveName, MeshStandardMaterial>
  const ghostEdges = {} as Record<PrimitiveName, BufferGeometry>
  const ghostLineMaterials = {} as Record<PrimitiveName, LineBasicMaterial>
  for (const name of Object.keys(PRIMITIVES) as PrimitiveName[]) {
    materials[name] = track(
      new MeshStandardMaterial({ color: PRIMITIVE_COLORS[name], roughness: 0.65, side: DoubleSide })
    )
    ghostMaterials[name] = track(
      new MeshStandardMaterial({
        color: PRIMITIVE_COLORS[name],
        roughness: 0.65,
        side: DoubleSide,
        transparent: true,
        opacity: GHOST_OPACITY,
        // 奥行きを書かないので、奥にある立体を隠さない
        depthWrite: false
      })
    )
    ghostEdges[name] = track(new EdgesGeometry(surfaces[name], GHOST_EDGE_ANGLE))
    ghostLineMaterials[name] = track(new LineBasicMaterial({ color: PRIMITIVE_COLORS[name] }))
  }

  // 半透明の円柱に残す、側面の母線 2 本。縁の円だけでは柱がどこまで伸びているのか
  // 読み取りにくいので、見た目の輪郭に重なる位置にだけ線を置く。
  // 円柱の中心を原点にして作り、軸まわりの向きは update() で視線に合わせる
  const guideGeometry = track(
    new BufferGeometry().setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          CYLINDER_RADIUS,
          -CYLINDER_HEIGHT / 2,
          0,
          CYLINDER_RADIUS,
          CYLINDER_HEIGHT / 2,
          0,
          -CYLINDER_RADIUS,
          -CYLINDER_HEIGHT / 2,
          0,
          -CYLINDER_RADIUS,
          CYLINDER_HEIGHT / 2,
          0
        ],
        3
      )
    )
  )
  const guides: LineSegments[] = []
  const inverseSolidRotation = new Quaternion().setFromEuler(new Euler(...SOLID_ROTATION)).invert()
  const solidPosition = new Vector3(...SOLID_POSITION)
  const cameraLocal = new Vector3()
  const viewDirection = new Vector3()

  /** 円柱の母線を、いまの視線から見た輪郭の位置に合わせる */
  const alignGuides = () => {
    // 立体は動かして回してあるので、カメラを立体のローカル空間へ持ち込んでから角度を出す
    cameraLocal.copy(camera.position).sub(solidPosition).applyQuaternion(inverseSolidRotation)
    viewDirection.copy(CYLINDER_CENTER).sub(cameraLocal)
    // 側面の法線が視線と直交する向きが、見た目の輪郭に重なる母線の位置
    const angle = -Math.atan2(viewDirection.x, -viewDirection.z)
    for (const guide of guides) guide.rotation.y = angle
  }

  /** 木の表す立体の表面を、葉ごとに切り出して組み立てる */
  const buildSolid = (node: CsgNode) => {
    const group = new Group()
    if (node.kind === "leaf") {
      // まだ演算されていないプリミティブは、半透明の面と輪郭線で置く
      group.add(new Mesh(surfaces[node.primitive], ghostMaterials[node.primitive]))
      group.add(new LineSegments(ghostEdges[node.primitive], ghostLineMaterials[node.primitive]))
      if (node.primitive === "cylinder") {
        const guide = new LineSegments(guideGeometry, ghostLineMaterials.cylinder)
        guide.position.copy(CYLINDER_CENTER)
        guides.push(guide)
        group.add(guide)
      }
      return group
    }
    for (const { primitive, subtracted } of collectLeaves(node)) {
      const geometry = track(
        clipSurface(
          surfaces[primitive],
          boundaryValue(node, primitive, PRIMITIVES[primitive].normalAt, subtracted),
          PRIMITIVES[primitive].normalAt,
          subtracted
        )
      )
      group.add(new Mesh(geometry, materials[primitive]))
    }
    return group
  }

  const badgeTextures = {} as Record<Operation, CanvasTexture>
  const badgeMaterials = {} as Record<Operation, Record<NodeState, MeshBasicMaterial>>
  const edgeMaterials = {} as Record<NodeState, LineBasicMaterial>
  const stateColors: [NodeState, string][] = [
    ["done", DONE_COLOR],
    ["current", CURRENT_COLOR],
    ["pending", PENDING_COLOR]
  ]
  for (const operation of Object.keys(OPERATION_SYMBOLS) as Operation[]) {
    badgeTextures[operation] = track(createBadgeTexture(OPERATION_SYMBOLS[operation]))
    badgeMaterials[operation] = {} as Record<NodeState, MeshBasicMaterial>
    for (const [state, color] of stateColors) {
      badgeMaterials[operation][state] = track(
        new MeshBasicMaterial({ map: badgeTextures[operation], color, transparent: true })
      )
    }
  }
  for (const [state, color] of stateColors) {
    edgeMaterials[state] = track(
      new LineBasicMaterial({ color: state === "pending" ? EDGE_COLOR : color })
    )
  }
  const badgeGeometry = track(new PlaneGeometry(0.28, 0.28))

  type Badge = { mesh: Mesh; edges: LineSegments; operation: Operation }

  /** 木の図。葉には小さなプリミティブそのものを、節点には演算子のバッジを置く */
  const buildDiagram = (root: CsgNode, order: CsgNode[]) => {
    const depth = treeDepth(root)
    const group = new Group()
    group.position.set(...TREE_POSITION)
    const badges = new Map<CsgNode, Badge>()

    const walk = (node: CsgNode) => {
      const position = nodePosition(node, depth)
      if (node.kind === "leaf") {
        const icon = new Mesh(icons[node.primitive], materials[node.primitive])
        icon.position.copy(position)
        icon.rotation.set(...SOLID_ROTATION)
        group.add(icon)
        return
      }

      // この節点から 2 本の子へ伸びる辺。節点と同じ状態で色を変える
      const points: number[] = []
      for (const child of [node.left, node.right]) {
        const to = nodePosition(child, depth)
        points.push(position.x, position.y, 0, to.x, to.y, 0)
      }
      const edgeGeometry = track(new BufferGeometry())
      edgeGeometry.setAttribute("position", new Float32BufferAttribute(points, 3))
      const edges = new LineSegments(edgeGeometry, edgeMaterials.pending)
      group.add(edges)

      const mesh = new Mesh(badgeGeometry, badgeMaterials[node.operation].pending)
      mesh.position.copy(position)
      // バッジは辺より手前に描く
      mesh.renderOrder = 1
      group.add(mesh)

      badges.set(node, { mesh, edges, operation: node.operation })
      walk(node.left)
      walk(node.right)
    }
    walk(root)

    // 適用順に並べ替えておくと、update() で段階と対応づけやすい
    return { group, badges: order.map((node) => badges.get(node) as Badge) }
  }

  /** 木ごとに、図と各段階の立体をあらかじめ作っておく */
  const buildTree = (root: CsgNode) => {
    const order = collectOperations(root)

    const solids = new Group()
    solids.position.set(...SOLID_POSITION)
    solids.rotation.set(...SOLID_ROTATION)
    const steps: Group[] = []
    for (let step = 0; step <= order.length; step++) {
      const stepGroup = new Group()
      for (const node of forestAt(root, order, step)) stepGroup.add(buildSolid(node))
      stepGroup.visible = false
      solids.add(stepGroup)
      steps.push(stepGroup)
    }

    const diagram = buildDiagram(root, order)
    scene.add(diagram.group)
    scene.add(solids)
    return { order, steps, diagram, solids }
  }

  const trees: Record<TreeKind, ReturnType<typeof buildTree>> = {
    stackFirst: buildTree(createStackFirstTree()),
    drillFirst: buildTree(createDrillFirstTree())
  }

  const light = new DirectionalLight(LIGHT_COLOR, 2.2)
  light.position.set(4, 5, 3)
  scene.add(light)
  // 穴の内側が暗く潰れないよう、環境光はやや強めにする
  scene.add(new AmbientLight(LIGHT_COLOR, 0.6))

  return {
    update: () => {
      alignGuides()
      const step = Math.round(params.step)
      for (const kind of Object.keys(trees) as TreeKind[]) {
        const tree = trees[kind]
        const active = kind === params.tree
        tree.diagram.group.visible = active
        tree.solids.visible = active
        tree.steps.forEach((group, index) => {
          group.visible = index === step
        })
        tree.diagram.badges.forEach((badge, index) => {
          const state: NodeState =
            index < step - 1 ? "done" : index === step - 1 ? "current" : "pending"
          badge.mesh.material = badgeMaterials[badge.operation][state]
          badge.edges.material = edgeMaterials[state]
        })
      }
      const order = trees[params.tree].order
      params.current = step === 0 ? "まだ適用していない" : operationLabel(order[step - 1])
    },
    dispose: () => {
      for (const item of created) item.dispose()
    }
  }
}
