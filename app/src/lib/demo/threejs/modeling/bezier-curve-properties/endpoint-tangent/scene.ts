import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Plane,
  Raycaster,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three"
import type { PerspectiveCamera, WebGLRenderer } from "three"

/** Tweakpane に読み取り専用で出す、両端の接ベクトルの内訳 */
export type EndpointTangentParams = {
  /** scene.ts が計算して書き戻す、始点での辺のベクトルと接ベクトル */
  start: string
  /** scene.ts が計算して書き戻す、終点での辺のベクトルと接ベクトル */
  end: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  params: EndpointTangentParams
  invalidate: () => void
}

/**
 * 3 次ベジェ曲線の制御点の初期位置。
 * 最初の辺・最後の辺をどちらも横向きに寝かせておく（接ベクトルはその 3 倍の長さで
 * 辺の延長に伸びるので、縦向きの辺だと画面の上下からはみ出す）
 */
const INITIAL_POINTS: [number, number][] = [
  [-3, -1.25],
  [-2.05, -0.95],
  [-0.2, 1],
  [0.8, 1.25]
]

/** 制御点に付ける名前。添字は 0 から順に振る */
const CONTROL_LABELS = ["P₀", "P₁", "P₂", "P₃"]

/** 制御点を動かせる範囲。接ベクトルが伸びる先の余白を残した範囲にとどめる */
const DRAG_MIN_X = -3.2
const DRAG_MAX_X = 1.2
const DRAG_MIN_Y = -1.5
const DRAG_MAX_Y = 1.5

/** ポインタが制御点を掴んだとみなす距離。球の半径より広くとって掴みやすくする */
const PICK_RADIUS = 0.3

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 64

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** 制御多角形を塗る帯の、中心線から縁までの幅 */
const BAND_HALF_WIDTH = 0.075

/**
 * 折れ目で帯を外へ伸ばす量の頭打ち。
 * 折れ角が鋭いほど外側の角は遠くなるので、そのまま伸ばすと帯が尖って飛び出す
 */
const BAND_MITER_LIMIT = 0.3

/** 制御点を示す球の半径 */
const CONTROL_RADIUS = 0.07

/** 矢印の頭（円錐）の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.2

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、制御点の重心から見て外向きに逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.34

/** 接ベクトルのラベルを、矢印の先から横へ逃がす距離 */
const TANGENT_LABEL_OFFSET = 0.32

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 円錐は上向きに作られるので、矢印の向きへ回すときの基準にする */
const CONE_UP = new Vector3(0, 1, 0)

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_BAND = -0.01
const LAYER_POLYGON = 0.01
const LAYER_EDGE = 0.02
const LAYER_TANGENT = 0.03
const LAYER_CURVE = 0.04
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、制御多角形・曲線・制御点・接ベクトルが見分けられる色にする
const BAND_COLOR = "#3f4550"
const POLYGON_COLOR = "#9aa3b0"
const CURVE_COLOR = "#ffc857"
const CONTROL_COLOR = "#b79cf5"
const ACTIVE_COLOR = "#f57fc4"
const TANGENT_COLOR = "#5ec8f2"

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
 * 折れ線に沿って一定の幅で伸びる帯。制御多角形がどこを通っているかを面として示す。
 * 頂点ごとに、その前後の辺に垂直な向きを足した向き（マイター）へ左右に振り分けることで、
 * 折れ目でも帯が途切れず、重なりもしないようにする
 */
const createBand = (count: number, z: number) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(count * 2 * 3), 3)
  geometry.setAttribute("position", positions)

  // 頂点 i の左右 2 点（2i・2i + 1）と、次の頂点の左右 2 点で 1 区間の四角形を作る
  const index: number[] = []
  for (let i = 0; i < count - 1; i++) {
    index.push(2 * i, 2 * i + 1, 2 * i + 3, 2 * i, 2 * i + 3, 2 * i + 2)
  }
  geometry.setIndex(index)

  const material = new MeshBasicMaterial({
    color: BAND_COLOR,
    // 頂点を動かすと表裏が入れ替わりうるので、どちらから見ても塗る
    side: DoubleSide
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false

  const edge = new Vector3()
  const perpBefore = new Vector3()
  const perpAfter = new Vector3()
  const offset = new Vector3()

  /** from → to の辺に垂直な単位ベクトル */
  const setPerpendicular = (target: Vector3, from: Vector3, to: Vector3) => {
    edge.subVectors(to, from).normalize()

    return target.set(-edge.y, edge.x, 0)
  }

  return {
    object: mesh,
    set: (points: Vector3[]) => {
      const last = points.length - 1

      points.forEach((point, i) => {
        // 端の頂点には片側の辺しか無いので、ある側の辺の垂線を前後どちらにも使う
        const before = points[Math.max(i - 1, 0)]
        const after = points[Math.min(i + 1, last)]
        setPerpendicular(perpBefore, before, i === 0 ? after : point)
        setPerpendicular(perpAfter, i === last ? before : point, after)

        // 2 本の垂線を足した向きへ、折れ角で細くならない長さだけ振る
        const spread = Math.max(1 + perpBefore.dot(perpAfter), BAND_MITER_LIMIT)
        offset.addVectors(perpBefore, perpAfter).multiplyScalar(BAND_HALF_WIDTH / spread)

        positions.setXYZ(2 * i, point.x + offset.x, point.y + offset.y, z)
        positions.setXYZ(2 * i + 1, point.x - offset.x, point.y - offset.y, z)
      })
      positions.needsUpdate = true
      geometry.computeBoundingSphere()
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 両端が動く線分。頂点を作り直さず、座標だけ書き換える */
const createSegment = (color: string, z: number) => {
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
      positions.setXYZ(0, from.x, from.y, z)
      positions.setXYZ(1, to.x, to.y, z)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 始点から終点へ向かう矢印。両端が動くので、線と円錐の位置を毎回書き換える */
const createArrow = (color: string) => {
  const shaftPositions = new Float32BufferAttribute(new Float32Array(6), 3)
  const shaftGeometry = new BufferGeometry().setAttribute("position", shaftPositions)
  const shaftMaterial = new LineBasicMaterial({ color })
  const shaft = new LineSegments(shaftGeometry, shaftMaterial)
  shaft.frustumCulled = false

  const headGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const headMaterial = new MeshBasicMaterial({ color })
  const head = new Mesh(headGeometry, headMaterial)

  const group = new Group()
  group.add(shaft, head)

  const direction = new Vector3()
  const shaftEnd = new Vector3()

  return {
    object: group,
    setEnds: (from: Vector3, to: Vector3) => {
      const length = direction.subVectors(to, from).length()
      // 制御点が重なると向きが決まらないので、そのときは矢印を出さない
      group.visible = length > ARROW_HEIGHT
      if (!group.visible) return
      direction.divideScalar(length)

      // 円錐の底面が線の先端に来るよう、矢印の頭の高さのぶん手前で線を止める
      shaftEnd.copy(to).addScaledVector(direction, -ARROW_HEIGHT)
      shaftPositions.setXYZ(0, from.x, from.y, LAYER_TANGENT)
      shaftPositions.setXYZ(1, shaftEnd.x, shaftEnd.y, LAYER_TANGENT)
      shaftPositions.needsUpdate = true

      // ConeGeometry の原点は円錐の中心なので、半分ぶん戻した位置に置く
      head.position.set(to.x, to.y, LAYER_TANGENT).addScaledVector(direction, -ARROW_HEIGHT / 2)
      head.quaternion.setFromUnitVectors(CONE_UP, direction)
    },
    dispose: () => {
      const disposables = [shaftGeometry, shaftMaterial, headGeometry, headMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

// ド・カステリョのアルゴリズムで使う作業用の点。何度も呼ばれるので、その都度は作らない
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

/** パネルに出す座標の書き方。小数第 2 位まで揃える */
const format = (vector: Vector3) => `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`

export const createEndpointTangentScene = ({
  scene,
  camera,
  renderer,
  params,
  invalidate
}: SceneContext) => {
  const controls = INITIAL_POINTS.map(([x, y]) => new Vector3(x, y, 0))

  /** 次数。制御点が n + 1 個なら n 次で、接ベクトルは辺の n 倍になる */
  const degree = controls.length - 1

  // 制御多角形の帯。いちばん奥に敷き、破線と両端の辺がその上に乗るようにする
  const band = createBand(controls.length, LAYER_BAND)
  scene.add(band.object)

  // 制御点を順に結んだ折れ線。曲線と描き分けるため破線にする
  const polygon = createPolyline(controls.length, LAYER_POLYGON)
  const polygonMaterial = new LineDashedMaterial({
    color: POLYGON_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const polygonLine = new Line(polygon.geometry, polygonMaterial)
  polygonLine.frustumCulled = false
  scene.add(polygonLine)

  // 接ベクトルの向きを決めている最初の辺と最後の辺。破線の上に実線で重ねて示す
  const firstEdge = createSegment(TANGENT_COLOR, LAYER_EDGE)
  const lastEdge = createSegment(TANGENT_COLOR, LAYER_EDGE)
  scene.add(firstEdge.object, lastEdge.object)

  // 両端の接ベクトル。辺の延長に、辺の n 倍の長さで伸びる
  const startArrow = createArrow(TANGENT_COLOR)
  const endArrow = createArrow(TANGENT_COLOR)
  scene.add(startArrow.object, endArrow.object)

  // 制御点から求めた曲線。矢印より手前に置き、接している様子が隠れないようにする
  const curve = createPolyline(CURVE_SEGMENTS + 1, LAYER_CURVE)
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  const curveLine = new Line(curve.geometry, curveMaterial)
  curveLine.frustumCulled = false
  scene.add(curveLine)

  // 制御点。どれもドラッグで動かせるので同じ見た目にし、掴んでいる 1 つだけ色を変える
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const activeMaterial = new MeshBasicMaterial({ color: ACTIVE_COLOR })
  const meshes = controls.map(() => {
    const mesh = new Mesh(controlGeometry, controlMaterial)
    scene.add(mesh)
    return mesh
  })

  const labels = controls.map((_, i) => {
    const label = createLabel(CONTROL_LABELS[i], CONTROL_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)
    return label
  })
  const startLabel = createLabel("C′(0)", TANGENT_COLOR, LABEL_HEIGHT)
  const endLabel = createLabel("C′(1)", TANGENT_COLOR, LABEL_HEIGHT)
  scene.add(startLabel.sprite, endLabel.sprite)

  const centroid = new Vector3()
  const normal = new Vector3()
  const toCentroid = new Vector3()
  const startEdge = new Vector3()
  const endEdge = new Vector3()
  const startTangent = new Vector3()
  const endTangent = new Vector3()
  const startTip = new Vector3()
  const endTip = new Vector3()
  const sample = new Vector3()

  /** 接ベクトルのラベルを、矢印の先から横（重心の反対側）へ逃がす */
  const placeTangentLabel = (label: { sprite: Sprite }, tip: Vector3, direction: Vector3) => {
    normal.set(-direction.y, direction.x, 0).normalize()
    if (normal.dot(toCentroid.subVectors(centroid, tip)) > 0) normal.negate()
    label.sprite.position.copy(tip).addScaledVector(normal, TANGENT_LABEL_OFFSET).setZ(LAYER_LABEL)
  }

  /** 制御点の今の位置から、制御多角形（帯と破線）・曲線・接ベクトル・ラベルを引き直す */
  const refresh = () => {
    centroid.set(0, 0, 0)
    controls.forEach((control) => centroid.add(control))
    centroid.multiplyScalar(1 / controls.length)

    controls.forEach((control, i) => {
      polygon.set(i, control)
      meshes[i].position.set(control.x, control.y, LAYER_POINT)
      // ラベルは重心から見て外向きへ逃がし、破線や曲線に重ならないようにする
      normal.subVectors(control, centroid).normalize()
      labels[i].sprite.position
        .copy(control)
        .addScaledVector(normal, CONTROL_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
    })
    polygon.commit()
    band.set(controls)
    // 破線の刻みは頂点ごとの「線に沿った距離」で決まるため、頂点を動かすたびに測り直す
    polygonLine.computeLineDistances()

    const first = controls[0]
    const second = controls[1]
    const beforeLast = controls[degree - 1]
    const last = controls[degree]
    firstEdge.set(first, second)
    lastEdge.set(beforeLast, last)

    // C′(0) = n(P₁ − P₀)、C′(1) = n(Pₙ − Pₙ₋₁)。
    // 辺のベクトルを n 倍しただけなので、向きは辺のまま変わらない
    startEdge.subVectors(second, first)
    endEdge.subVectors(last, beforeLast)
    startTangent.copy(startEdge).multiplyScalar(degree)
    endTangent.copy(endEdge).multiplyScalar(degree)

    // 接ベクトルは、始点では P₀ から、終点では Pₙ から生やす
    startTip.copy(first).add(startTangent)
    endTip.copy(last).add(endTangent)
    startArrow.setEnds(first, startTip)
    endArrow.setEnds(last, endTip)
    placeTangentLabel(startLabel, startTip, startTangent)
    placeTangentLabel(endLabel, endTip, endTangent)

    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
      curve.set(i, bezierPoint(controls, i / CURVE_SEGMENTS, sample))
    }
    curve.commit()

    // Tweakpane 側に読み取り専用で出す、辺のベクトルとその n 倍
    params.start = `P₁ − P₀ = ${format(startEdge)}\nC′(0) = ${format(startTangent)}`
    params.end = `P₃ − P₂ = ${format(endEdge)}\nC′(1) = ${format(endTangent)}`
  }

  refresh()

  // 制御点は Tweakpane ではなく canvas の上で直接ドラッグして動かす。
  // ポインタの位置は、図がすべて載っている z = 0 の平面との交点として求める
  const canvas = renderer.domElement
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const dragPlane = new Plane(new Vector3(0, 0, 1), 0)
  const hit = new Vector3()

  const toScenePoint = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)

    return raycaster.ray.intersectPlane(dragPlane, hit)
  }

  /** ポインタに最も近い制御点の番号。掴める距離に無ければ null */
  const pick = (world: Vector3) => {
    let target: number | null = null
    let nearest = PICK_RADIUS

    for (let index = 0; index < controls.length; index++) {
      const control = controls[index]
      const distance = Math.hypot(world.x - control.x, world.y - control.y)
      if (distance < nearest) {
        nearest = distance
        target = index
      }
    }

    return target
  }

  /** ワールド座標で受け取った位置へ制御点を移し、図を引き直す */
  const move = (index: number, worldX: number, worldY: number) => {
    const x = Math.min(Math.max(worldX, DRAG_MIN_X), DRAG_MAX_X)
    const y = Math.min(Math.max(worldY, DRAG_MIN_Y), DRAG_MAX_Y)
    controls[index].set(x, y, 0)
    refresh()
  }

  const setActive = (index: number, active: boolean) => {
    meshes[index].material = active ? activeMaterial : controlMaterial
  }

  let dragPointer: number | null = null
  let dragging: number | null = null
  let hovered: number | null = null

  const handlePointerDown = (event: PointerEvent) => {
    // 2 本目の指はピンチによるズーム。掴んでいる点は放して OrbitControls に任せる
    if (dragPointer !== null) return

    const world = toScenePoint(event)
    if (!world) return
    const target = pick(world)
    if (target === null) return

    dragPointer = event.pointerId
    dragging = target
    setActive(target, true)
    // canvas の外まで指が出ても動かし続けられるようにする（pointerup で自動的に解ける）
    canvas.setPointerCapture(event.pointerId)
    invalidate()
  }

  const handlePointerMove = (event: PointerEvent) => {
    const world = toScenePoint(event)
    if (!world) return

    if (dragging !== null && event.pointerId === dragPointer) {
      move(dragging, world.x, world.y)
      // 描画は要求されたときだけ走る。Tweakpane や OrbitControls を経由しない操作なので、
      // ここで次のフレームを頼む
      invalidate()

      return
    }

    // 掴める点の上に来たら色を変えて、ドラッグできることを示す
    const target = pick(world)
    if (target === hovered) return
    if (hovered !== null && hovered !== dragging) setActive(hovered, false)
    hovered = target
    if (hovered !== null) setActive(hovered, true)
    invalidate()
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId !== dragPointer) return
    if (dragging !== null && dragging !== hovered) setActive(dragging, false)
    dragging = null
    dragPointer = null
    invalidate()
  }

  const handlePointerLeave = () => {
    if (hovered !== null && hovered !== dragging) setActive(hovered, false)
    hovered = null
    invalidate()
  }

  canvas.addEventListener("pointerdown", handlePointerDown)
  canvas.addEventListener("pointermove", handlePointerMove)
  canvas.addEventListener("pointerup", handlePointerUp)
  canvas.addEventListener("pointercancel", handlePointerUp)
  canvas.addEventListener("pointerleave", handlePointerLeave)

  return {
    dispose: () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerup", handlePointerUp)
      canvas.removeEventListener("pointercancel", handlePointerUp)
      canvas.removeEventListener("pointerleave", handlePointerLeave)

      band.dispose()
      firstEdge.dispose()
      lastEdge.dispose()
      startArrow.dispose()
      endArrow.dispose()
      const disposables = [
        polygon.geometry,
        polygonMaterial,
        curve.geometry,
        curveMaterial,
        controlGeometry,
        controlMaterial,
        activeMaterial,
        startLabel.texture,
        startLabel.material,
        endLabel.texture,
        endLabel.material,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
