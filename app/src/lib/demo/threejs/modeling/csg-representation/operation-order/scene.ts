import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3
} from "three"

/** 順序を入れ替えて比べる集合演算 */
export type Operation = "union" | "intersection" | "difference"

/** Tweakpane で操作するパラメータ */
export type OperationOrderParams = {
  operation: Operation
  /** 左右それぞれの演算を表す式。scene.ts が組み立てて書き戻す */
  left: string
  right: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: OperationOrderParams
}

/** 球のパラメータ。直方体の 1 つの角をくわえこむ位置に置く */
const SPHERE_CENTER = new Vector3(0.85, 0.85, 0.85)
const SPHERE_RADIUS = 0.75

/** 直方体のパラメータ（原点を中心とした各辺の半分の長さ） */
const BOX_HALF = new Vector3(0.8, 0.8, 0.8)

/** 結果の外接範囲の中心。左右に並べるとき、各々をこの点で中心に揃える */
const RESULT_CENTER = new Vector3(0.4, 0.4, 0.4)

/** 左右に離す距離 */
const COPY_OFFSET = 1.75

/** 真正面から見たときに立体の角が手前を向く回転角（ラジアン） */
const BASE_ROTATION = 0.88

/** 面を切り分ける細かさ。切り口の曲線がなめらかな線に見える程度に分割する */
const SPHERE_SEGMENTS = 96
const SPHERE_RINGS = 64
const BOX_SEGMENTS = 48

/** 交点を求める二分探索の回数 */
const CROSSING_STEPS = 24

const SPHERE_COLOR = "#f57fc4"
const BOX_COLOR = "#9db4d0"
const LIGHT_COLOR = "#ffffff"

/** 点が球の内部にあれば正、外部にあれば負を返す（0 がちょうど表面） */
const insideSphere = (p: Vector3) => SPHERE_RADIUS - p.distanceTo(SPHERE_CENTER)

/** 点が直方体の内部にあれば正、外部にあれば負を返す */
const insideBox = (p: Vector3) =>
  Math.min(BOX_HALF.x - Math.abs(p.x), BOX_HALF.y - Math.abs(p.y), BOX_HALF.z - Math.abs(p.z))

/** プリミティブの表面のうち、結果の表面として残る部分の決め方 */
type SurfaceRule = {
  /** 相手の立体の内側を残すなら true、外側を残すなら false */
  keepInside: boolean
  /** 残った面が削り取った側の壁になるなら true（立体の外を向くよう法線と表裏を反転させる） */
  flip: boolean
}

/**
 * 集合演算ごとの、A ∘ B の規則。first が A の面に、second が B の面に当たる。
 * first と second が同じ規則なら、A と B を入れ替えても同じ形になる。
 */
const OPERATION_RULES: Record<Operation, { first: SurfaceRule; second: SurfaceRule }> = {
  // 和集合：どちらの面も、相手の外側に出ている部分だけが残る（対称）
  union: {
    first: { keepInside: false, flip: false },
    second: { keepInside: false, flip: false }
  },
  // 積集合：どちらの面も、相手の内側に入っている部分だけが残る（対称）
  intersection: {
    first: { keepInside: true, flip: false },
    second: { keepInside: true, flip: false }
  },
  // 差集合：引かれる側は相手の外側、引く側は相手の内側が残り、後者が削り口の壁になる（非対称）
  difference: {
    first: { keepInside: false, flip: false },
    second: { keepInside: true, flip: true }
  }
}

/** 内外判定の式から、「残す側が正」になる判定値を作る */
const keepValue = (inside: (p: Vector3) => number, keepInside: boolean) =>
  keepInside ? inside : (p: Vector3) => -inside(p)

/** 球面上の点の法線（中心から外へ向かう向き） */
const sphereNormalAt = (p: Vector3) => p.clone().sub(SPHERE_CENTER).normalize()

/** 直方体の面の法線。平面なので、元の三角形の法線がそのまま使える */
const boxNormalAt = (_p: Vector3, faceNormal: Vector3) => faceNormal.clone()

/** 線分上で判定値が 0 になる点（相手の表面との交点）を二分探索で求める */
const findCrossing = (positive: Vector3, negative: Vector3, value: (p: Vector3) => number) => {
  const lo = positive.clone()
  const hi = negative.clone()
  const mid = new Vector3()
  for (let i = 0; i < CROSSING_STEPS; i++) {
    mid.copy(lo).add(hi).multiplyScalar(0.5)
    if (value(mid) > 0) lo.copy(mid)
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
  value: (p: Vector3) => number,
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
      values[k] = value(corners[k])
    }

    const keptCount = values.filter((v) => v > 0).length
    if (keptCount === 0) continue
    if (keptCount === 3) {
      emit([corners[0].clone(), corners[1].clone(), corners[2].clone()])
      continue
    }

    // 符号が 1 つだけ違う頂点を先頭に回してから切り分ける
    const odd = values.findIndex((v) => (keptCount === 1 ? v > 0 : v <= 0))
    const a = corners[odd]
    const b = corners[(odd + 1) % 3]
    const c = corners[(odd + 2) % 3]

    if (keptCount === 1) {
      // 残るのは a を含む三角形 1 枚
      emit([a.clone(), findCrossing(a, b, value), findCrossing(a, c, value)])
    } else {
      // 残るのは b・c を含む四角形。元の並び順を保ったまま三角形 2 枚に分ける
      const ab = findCrossing(b, a, value)
      const ac = findCrossing(c, a, value)
      emit([ab.clone(), b.clone(), c.clone()])
      emit([ab, c.clone(), ac])
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3))
  return geometry
}

/** 左右に並べたときに中心が揃うよう、結果の外接範囲の中心を原点へ持ってくる */
const center = (geometry: BufferGeometry) =>
  geometry.translate(-RESULT_CENTER.x, -RESULT_CENTER.y, -RESULT_CENTER.z)

/** 三角形に分けたプリミティブの表面を作る。ここでの座標がそのままワールド座標になる */
const createPrimitiveSurfaces = () => {
  const sphereIndexed = new SphereGeometry(SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_RINGS).translate(
    SPHERE_CENTER.x,
    SPHERE_CENTER.y,
    SPHERE_CENTER.z
  )
  const boxIndexed = new BoxGeometry(
    BOX_HALF.x * 2,
    BOX_HALF.y * 2,
    BOX_HALF.z * 2,
    BOX_SEGMENTS,
    BOX_SEGMENTS,
    BOX_SEGMENTS
  )
  const sphere = sphereIndexed.toNonIndexed()
  const box = boxIndexed.toNonIndexed()
  sphereIndexed.dispose()
  boxIndexed.dispose()
  return { sphere, box }
}

/** 演算式に使う記号 */
const OPERATION_SYMBOLS: Record<Operation, string> = {
  union: "∪",
  intersection: "∩",
  difference: "−"
}

export const createOperationOrderScene = ({ scene, camera, params }: SceneContext) => {
  const surfaces = createPrimitiveSurfaces()

  const sphereMaterial = new MeshStandardMaterial({
    color: SPHERE_COLOR,
    roughness: 0.65,
    side: DoubleSide
  })
  const boxMaterial = new MeshStandardMaterial({
    color: BOX_COLOR,
    roughness: 0.65,
    side: DoubleSide
  })

  /** プリミティブごとの、内外判定の式・法線・分割した表面・マテリアル */
  const PRIMITIVES = {
    sphere: {
      inside: insideSphere,
      normalAt: sphereNormalAt,
      surface: surfaces.sphere,
      material: sphereMaterial
    },
    box: {
      inside: insideBox,
      normalAt: boxNormalAt,
      surface: surfaces.box,
      material: boxMaterial
    }
  }
  type PrimitiveName = keyof typeof PRIMITIVES

  /** 先に置く立体 A と後から組み合わせる立体 B を指定して、A ∘ B を組み立てる */
  const buildResult = (
    operation: Operation,
    firstName: PrimitiveName,
    secondName: PrimitiveName
  ) => {
    const rule = OPERATION_RULES[operation]
    const first = PRIMITIVES[firstName]
    const second = PRIMITIVES[secondName]
    // A の面は B の内外で、B の面は A の内外で切り分ける
    const firstGeometry = center(
      clipSurface(
        first.surface,
        keepValue(second.inside, rule.first.keepInside),
        first.normalAt,
        rule.first.flip
      )
    )
    const secondGeometry = center(
      clipSurface(
        second.surface,
        keepValue(first.inside, rule.second.keepInside),
        second.normalAt,
        rule.second.flip
      )
    )
    const group = new Group()
    group.add(new Mesh(firstGeometry, first.material))
    group.add(new Mesh(secondGeometry, second.material))
    return group
  }

  /**
   * 左右に離して置いた立体は、透視投影では別々の角度から見ることになる。
   * 見比べられるよう、カメラから見える向きが左右で揃うように回転を補正する
   */
  const facingRotation = (offsetX: number) =>
    BASE_ROTATION + Math.atan2(camera.position.x - offsetX, camera.position.z)

  // 演算を切り替えるたびに計算し直さずに済むよう、3 演算 × 2 通りの順序を先に作っておく。
  // 左は A ∘ B（球に直方体を組み合わせる）、右は B ∘ A（直方体に球を組み合わせる）
  const pairs = new Map<Operation, Group[]>()
  for (const operation of Object.keys(OPERATION_RULES) as Operation[]) {
    const left = buildResult(operation, "sphere", "box")
    left.position.x = -COPY_OFFSET
    left.rotation.y = facingRotation(-COPY_OFFSET)
    const right = buildResult(operation, "box", "sphere")
    right.position.x = COPY_OFFSET
    right.rotation.y = facingRotation(COPY_OFFSET)
    for (const group of [left, right]) {
      group.visible = false
      scene.add(group)
    }
    pairs.set(operation, [left, right])
  }

  const light = new DirectionalLight(LIGHT_COLOR, 2.2)
  light.position.set(4, 5, 3)
  scene.add(light)
  // 削り口の内側が暗く潰れないよう、環境光はやや強めにする
  scene.add(new AmbientLight(LIGHT_COLOR, 0.55))

  return {
    update: () => {
      for (const [operation, groups] of pairs) {
        for (const group of groups) group.visible = operation === params.operation
      }
      const symbol = OPERATION_SYMBOLS[params.operation]
      params.left = "球 " + symbol + " 直方体"
      params.right = "直方体 " + symbol + " 球"
    },
    dispose: () => {
      surfaces.sphere.dispose()
      surfaces.box.dispose()
      for (const groups of pairs.values()) {
        for (const group of groups) {
          for (const child of group.children) {
            if (child instanceof Mesh) child.geometry.dispose()
          }
        }
      }
      sphereMaterial.dispose()
      boxMaterial.dispose()
    }
  }
}
