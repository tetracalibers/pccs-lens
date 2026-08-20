import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
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

/**
 * このデモは Tweakpane を持たない（制御点は canvas の上で直接ドラッグして動かし、
 * 接する向きは常に揃えたままにする）ため、パネルと共有するパラメータは無い
 */
export type SmoothJoinParams = Record<string, never>

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  invalidate: () => void
}

/**
 * 2 本の 3 次ベジェ曲線の制御点の初期位置。
 * 4 番目（添字 3）が 2 本の繋ぎ目で、1 本目の終点と 2 本目の始点を兼ねる。
 * Q₁（添字 4）は P₂ から繋ぎ目へ入ってくる向きの延長上に置き、初期表示から
 * 接する向きが揃った（繋ぎ目に角のない）状態にする
 */
const INITIAL_POINTS: [number, number][] = [
  [-3.2, -0.4],
  [-2.4, 1.1],
  [-1.3, 1.1],
  [-0.2, 0.15],
  [0.78, -0.7],
  [2.1, -0.75],
  [3.2, 0.5]
]

/** 繋ぎ目の制御点の添字。1 本目の P₃ と 2 本目の Q₀ が同じ点になる */
const JOINT_INDEX = 3

/** 制御点に付ける名前。1 本目を P、2 本目を Q とし、繋ぎ目は両方の名前を並べる */
const CONTROL_LABELS = ["P₀", "P₁", "P₂", "P₃ = Q₀", "Q₁", "Q₂", "Q₃"]

/** 制御点を動かせる範囲。ラベルまで画面に収まる範囲にとどめる */
const DRAG_MIN_X = -3.5
const DRAG_MAX_X = 3.5
const DRAG_MIN_Y = -1.7
const DRAG_MAX_Y = 1.7

/** 向きを揃えるときに Q₁ を繋ぎ目から離す最小の距離。0 になると向きが決まらなくなる */
const MIN_HANDLE = 0.35

/** 長さが 0 に潰れた向きを弾くための閾値 */
const EPSILON = 1e-6

/** ポインタが制御点を掴んだとみなす距離。球の半径より広くとって掴みやすくする */
const PICK_RADIUS = 0.3

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 64

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** 制御点を示す球の半径。繋ぎ目は 2 本で共有する点なので少し大きくする */
const CONTROL_RADIUS = 0.07
const JOINT_RADIUS = 0.1

/** 矢印の頭（円錐）の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.2

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、その曲線の制御点の重心から見て外向きに逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.34

/** 繋ぎ目のラベルを、接する向きに垂直な方向へ逃がす距離。名前が長いので広めにとる */
const JOINT_LABEL_OFFSET = 0.44

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
const LAYER_POLYGON = 0.01
const LAYER_DIRECTION = 0.02
const LAYER_CURVE = 0.03
const LAYER_POINT = 0.04
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、2 本の曲線・制御多角形・制御点・接する向きが見分けられる色にする
const POLYGON_COLOR = "#9aa3b0"
const FIRST_CURVE_COLOR = "#ffc857"
const SECOND_CURVE_COLOR = "#7fd88f"
const CONTROL_COLOR = "#b79cf5"
const ACTIVE_COLOR = "#f57fc4"
const DIRECTION_COLOR = "#5ec8f2"

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
      shaftPositions.setXYZ(0, from.x, from.y, LAYER_DIRECTION)
      shaftPositions.setXYZ(1, shaftEnd.x, shaftEnd.y, LAYER_DIRECTION)
      shaftPositions.needsUpdate = true

      // ConeGeometry の原点は円錐の中心なので、半分ぶん戻した位置に置く
      head.position.set(to.x, to.y, LAYER_DIRECTION).addScaledVector(direction, -ARROW_HEIGHT / 2)
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

/** 制御多角形（破線）とベジェ曲線（実線）を組にした 1 本ぶん */
const createStrand = (controls: Vector3[], color: string) => {
  const polygon = createPolyline(controls.length, LAYER_POLYGON)
  const polygonMaterial = new LineDashedMaterial({
    color: POLYGON_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const polygonLine = new Line(polygon.geometry, polygonMaterial)
  polygonLine.frustumCulled = false

  const curve = createPolyline(CURVE_SEGMENTS + 1, LAYER_CURVE)
  const curveMaterial = new LineBasicMaterial({ color })
  const curveLine = new Line(curve.geometry, curveMaterial)
  curveLine.frustumCulled = false

  const group = new Group()
  group.add(polygonLine, curveLine)

  const sample = new Vector3()

  return {
    object: group,
    controls,
    /** 制御点の今の位置から、制御多角形と曲線を引き直す */
    refresh: () => {
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
      const disposables = [polygon.geometry, polygonMaterial, curve.geometry, curveMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createSmoothJoinScene = ({ scene, camera, renderer, invalidate }: SceneContext) => {
  const points = INITIAL_POINTS.map(([x, y]) => new Vector3(x, y, 0))

  // 繋ぎ目の点は 1 本目の終点と 2 本目の始点で共有する（同じ Vector3 を両方に入れる）
  const joint = points[JOINT_INDEX]
  const strands = [
    createStrand(points.slice(0, JOINT_INDEX + 1), FIRST_CURVE_COLOR),
    createStrand(points.slice(JOINT_INDEX), SECOND_CURVE_COLOR)
  ]
  strands.forEach((strand) => scene.add(strand.object))

  // 繋ぎ目に入ってくる向き（P₂ から繋ぎ目へ）と、出ていく向き（繋ぎ目から Q₁ へ）。
  // 接ベクトルはこの辺を次数倍したものなので、揃えるべきなのはこの 2 本の向き
  const incomingArrow = createArrow(DIRECTION_COLOR)
  const outgoingArrow = createArrow(DIRECTION_COLOR)
  scene.add(incomingArrow.object, outgoingArrow.object)

  // 制御点。どれもドラッグで動かせるので同じ見た目にし、掴んでいる 1 つだけ色を変える
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const jointGeometry = new SphereGeometry(JOINT_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const activeMaterial = new MeshBasicMaterial({ color: ACTIVE_COLOR })
  const meshes = points.map((_, i) => {
    const mesh = new Mesh(i === JOINT_INDEX ? jointGeometry : controlGeometry, controlMaterial)
    scene.add(mesh)
    return mesh
  })

  const labels = points.map((_, i) => {
    const label = createLabel(CONTROL_LABELS[i], CONTROL_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)
    return label
  })

  const incoming = new Vector3()
  const outgoing = new Vector3()
  const centroid = new Vector3()
  const normal = new Vector3()
  const toApex = new Vector3()

  /** 繋ぎ目の前後の向き。入ってくる向きは P₂ → 繋ぎ目、出ていく向きは繋ぎ目 → Q₁ */
  const readDirections = () => {
    incoming.subVectors(joint, points[JOINT_INDEX - 1])
    outgoing.subVectors(points[JOINT_INDEX + 1], joint)
  }

  /**
   * 出ていく向きを入ってくる向きに合わせる。
   * Q₁ を、繋ぎ目から入ってくる向きの延長上へ、今の距離のまま置き直す
   */
  const alignDirections = () => {
    const length = incoming.length()
    if (length < EPSILON) return

    const distance = Math.max(outgoing.length(), MIN_HANDLE)
    points[JOINT_INDEX + 1].copy(joint).addScaledVector(incoming.divideScalar(length), distance)
  }

  /** ラベルを、その曲線の制御点の重心から見て外向きへ逃がす */
  const placeLabel = (index: number, from: number, to: number) => {
    centroid.set(0, 0, 0)
    for (let i = from; i <= to; i++) centroid.add(points[i])
    centroid.multiplyScalar(1 / (to - from + 1))

    normal.subVectors(points[index], centroid).normalize()
    labels[index].sprite.position
      .copy(points[index])
      .addScaledVector(normal, CONTROL_LABEL_OFFSET)
      .setZ(LAYER_LABEL)
  }

  /** 制御点の今の位置から、接する向きを揃え直し、2 本の曲線とラベルを引き直す */
  const refresh = () => {
    readDirections()
    // 繋ぎ目の向きは常に揃えたままにする。どの制御点を動かしても Q₁ が延長上へ付いていく
    alignDirections()
    // 置き直した Q₁ で向きを取り直す（2 つの向きのなす角は 0 になる）
    readDirections()

    strands.forEach((strand) => strand.refresh())
    incomingArrow.setEnds(points[JOINT_INDEX - 1], joint)
    outgoingArrow.setEnds(joint, points[JOINT_INDEX + 1])

    points.forEach((point, i) => {
      meshes[i].position.set(point.x, point.y, LAYER_POINT)
    })
    // 1 本目・2 本目それぞれの重心を基準にし、自分の制御多角形から外向きへ逃がす
    for (let i = 0; i < JOINT_INDEX; i++) placeLabel(i, 0, JOINT_INDEX)
    for (let i = JOINT_INDEX + 1; i < points.length; i++) {
      placeLabel(i, JOINT_INDEX, points.length - 1)
    }

    // 繋ぎ目のラベルだけは、2 本の重心のどちらから見ても内側にあるので、
    // 入ってくる向きに垂直な方向のうち P₁ から遠い側へ逃がす
    normal.set(-incoming.y, incoming.x, 0).normalize()
    if (normal.dot(toApex.subVectors(points[1], joint)) > 0) normal.negate()
    labels[JOINT_INDEX].sprite.position
      .copy(joint)
      .addScaledVector(normal, JOINT_LABEL_OFFSET)
      .setZ(LAYER_LABEL)
  }

  refresh()

  // 制御点は canvas の上で直接ドラッグして動かす。
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

    for (let index = 0; index < points.length; index++) {
      const point = points[index]
      const distance = Math.hypot(world.x - point.x, world.y - point.y)
      if (distance < nearest) {
        nearest = distance
        target = index
      }
    }

    return target
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
      // 動かせる範囲に収めて置き直し、図を引き直す
      points[dragging].set(
        Math.min(Math.max(world.x, DRAG_MIN_X), DRAG_MAX_X),
        Math.min(Math.max(world.y, DRAG_MIN_Y), DRAG_MAX_Y),
        0
      )
      refresh()
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

      strands.forEach((strand) => strand.dispose())
      incomingArrow.dispose()
      outgoingArrow.dispose()
      const disposables = [
        controlGeometry,
        jointGeometry,
        controlMaterial,
        activeMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
