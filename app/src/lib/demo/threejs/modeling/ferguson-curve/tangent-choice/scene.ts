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

/** Tweakpane に読み取り専用で出す、いま与えている接ベクトル */
export type TangentChoiceParams = {
  /** scene.ts が計算して書き戻す、各点での接ベクトル */
  tangents: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  params: TangentChoiceParams
  invalidate: () => void
}

/**
 * 通したい点の並び。この 3 点は動かせない（曲線が 1 本に定まらないのは
 * 点が決まっていても接ベクトルが決まらないから、という筋を保つため）。
 * 折れ線にすると上下に振れる並びにして、繋いだ曲線の形の違いが出やすくしている
 */
const VIA_POINTS: [number, number][] = [
  [-2.4, -0.7],
  [0, 0.8],
  [2.4, -0.5]
]

/**
 * 操作できる曲線の接ベクトルの初期値。
 * 点の並びに素直に沿った、山も谷も浅い形になる選び方にしておく
 */
const INITIAL_TANGENTS: [number, number][] = [
  [1.6, 1],
  [1.9, 0.1],
  [1.4, -0.9]
]

/**
 * 薄く重ねる、もう 1 本の曲線の接ベクトル。
 * 各セグメントの中ほどで操作できる曲線と 0.7 ほど離れるように、
 * 繋ぎ目の接ベクトルだけを大きく下へ、両端を上へ振った選び方にしている
 */
const ALTERNATIVE_TANGENTS: [number, number][] = [
  [1.6, 3.1],
  [1.9, -3.4],
  [1.4, 1.2]
]

/** 通したい点と、接ベクトルに付ける名前 */
const POINT_LABELS = ["P₀", "P₁", "P₂"]
const TANGENT_LABELS = ["V₀", "V₁", "V₂"]

/**
 * 点の名前を点から逃がす向きと距離。点は動かないので、曲線と矢印を避けた位置を直に決める
 * （P₀ は左下、P₁ は右上、P₂ は右上が空いている）
 */
const POINT_LABEL_OFFSETS: [number, number][] = [
  [-0.3, -0.24],
  [0.35, 0.35],
  [0.3, 0.28]
]

/**
 * 接ベクトルの名前を矢印の先から逃がす向き（1 で接ベクトルを +90 度、−1 で −90 度回した側）。
 * V₀ の先は 2 本の曲線に挟まれた位置に来るので、下側へ逃がす
 */
const TANGENT_LABEL_SIDES = [-1, 1, 1]

/** 接ベクトルの名前を矢印の先から逃がす距離 */
const TANGENT_LABEL_OFFSET = 0.34

/** 接ベクトルの先を動かせる範囲。曲線が大きく膨らむ選び方まで試せる広さにとる */
const DRAG_MIN_X = -4
const DRAG_MAX_X = 4.8
const DRAG_MIN_Y = -2.3
const DRAG_MAX_Y = 2.3

/** ポインタが接ベクトルの先を掴んだとみなす距離。球の半径より広くとって掴みやすくする */
const PICK_RADIUS = 0.3

/** セグメント 1 本を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 64

/** 通したい点を示す球と、接ベクトルの先を示す球の半径 */
const POINT_RADIUS = 0.1
const TIP_RADIUS = 0.07

/** 接ベクトルの矢印の頭（円錐）の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.2

/** 長さが 0 に潰れた向きを弾くための閾値 */
const EPSILON = 1e-6

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

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
const LAYER_ALTERNATIVE = 0.01
const LAYER_TANGENT = 0.02
const LAYER_CURVE = 0.03
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、2 本の曲線・通したい点・接ベクトルが見分けられる色にする。
// 通したい点は与えられた条件なので、操作できる接ベクトル（水色）と描き分けて無彩色に寄せる
const CURVE_COLOR = "#ffc857"
const ALTERNATIVE_COLOR = "#7fd88f"
const ALTERNATIVE_OPACITY = 0.6
const POINT_COLOR = "#e6e8ef"
const TANGENT_COLOR = "#5ec8f2"
const ACTIVE_COLOR = "#f57fc4"

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
      // 接ベクトルの先が点に重なると向きが決まらないので、そのときは矢印を出さない
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

/**
 * 4 つのエルミート関数。両端の位置 P₀, P₁ と接ベクトル V₀, V₁ にかかる重みで、
 * H₀ = 2t³ − 3t² + 1、H₁ = −2t³ + 3t²、H₂ = t³ − 2t² + t、H₃ = t³ − t²
 */
const hermite = (t: number) => {
  const square = t * t
  const cube = square * t

  return [2 * cube - 3 * square + 1, -2 * cube + 3 * square, cube - 2 * square + t, cube - square]
}

/** ファーガソン曲線上の点 C(t) = H₀(t)P₀ + H₁(t)P₁ + H₂(t)V₀ + H₃(t)V₁ */
const fergusonPoint = (conditions: Vector3[], t: number, target: Vector3) => {
  const weights = hermite(t)
  target.set(0, 0, 0)
  conditions.forEach((condition, i) => target.addScaledVector(condition, weights[i]))

  return target
}

/** パネルに出す座標の書き方。小数第 2 位まで揃える */
const format = (vector: Vector3) => `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`

export const createTangentChoiceScene = ({
  scene,
  camera,
  renderer,
  params,
  invalidate
}: SceneContext) => {
  const points = VIA_POINTS.map(([x, y]) => new Vector3(x, y, 0))
  const tangents = INITIAL_TANGENTS.map(([x, y]) => new Vector3(x, y, 0))

  /** 接ベクトルの先。P + V の位置にあり、掴むと接ベクトルの向きと大きさが変わる */
  const tips = points.map(() => new Vector3())

  /**
   * セグメントごとの 4 つの条件。繋ぎ目の接ベクトルは前後のセグメントで同じものを使うので、
   * 繋ぎ目では位置も接ベクトルも揃い、角のない繋がりになる
   */
  const segmentConditions = points
    .slice(0, -1)
    .map((_, i) => [points[i], points[i + 1], tangents[i], tangents[i + 1]])

  // 同じ点の並びに別の接ベクトルを与えた曲線。操作しないので作った時点で描き切る
  const alternativeTangents = ALTERNATIVE_TANGENTS.map(([x, y]) => new Vector3(x, y, 0))
  const alternativeMaterial = new LineBasicMaterial({
    color: ALTERNATIVE_COLOR,
    transparent: true,
    opacity: ALTERNATIVE_OPACITY
  })
  const alternativeGeometries = segmentConditions.map((_, i) => {
    const sampled: Vector3[] = []
    const conditions = [
      points[i],
      points[i + 1],
      alternativeTangents[i],
      alternativeTangents[i + 1]
    ]
    for (let step = 0; step <= CURVE_SEGMENTS; step++) {
      const point = fergusonPoint(conditions, step / CURVE_SEGMENTS, new Vector3())
      sampled.push(point.setZ(LAYER_ALTERNATIVE))
    }
    const geometry = new BufferGeometry().setFromPoints(sampled)
    scene.add(new Line(geometry, alternativeMaterial))

    return geometry
  })

  // 操作できる曲線。セグメントごとに 1 本の折れ線として引き直す
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  const segments = segmentConditions.map(() => {
    const polyline = createPolyline(CURVE_SEGMENTS + 1, LAYER_CURVE)
    const line = new Line(polyline.geometry, curveMaterial)
    line.frustumCulled = false
    scene.add(line)

    return polyline
  })

  // 各点で与えている接ベクトル。繋ぎ目の 1 本は前後のセグメントが共有している
  const arrows = tangents.map(() => {
    const arrow = createArrow(TANGENT_COLOR)
    scene.add(arrow.object)

    return arrow
  })

  // 通したい点。与えられた条件なので動かせない
  const pointGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const pointMaterial = new MeshBasicMaterial({ color: POINT_COLOR })
  points.forEach((point) => {
    const mesh = new Mesh(pointGeometry, pointMaterial)
    mesh.position.set(point.x, point.y, LAYER_POINT)
    scene.add(mesh)
  })

  // 接ベクトルの先。ドラッグで動かせるので、掴んでいる 1 つだけ色を変える
  const tipGeometry = new SphereGeometry(TIP_RADIUS, 16, 12)
  const tipMaterial = new MeshBasicMaterial({ color: TANGENT_COLOR })
  const activeMaterial = new MeshBasicMaterial({ color: ACTIVE_COLOR })
  const tipMeshes = tips.map(() => {
    const mesh = new Mesh(tipGeometry, tipMaterial)
    scene.add(mesh)

    return mesh
  })

  const pointLabels = POINT_LABELS.map((text, i) => {
    const label = createLabel(text, POINT_COLOR, LABEL_HEIGHT)
    const [dx, dy] = POINT_LABEL_OFFSETS[i]
    label.sprite.position.set(points[i].x + dx, points[i].y + dy, LAYER_LABEL)
    scene.add(label.sprite)

    return label
  })
  const tangentLabels = TANGENT_LABELS.map((text) => {
    const label = createLabel(text, TANGENT_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)

    return label
  })

  const sample = new Vector3()
  const normal = new Vector3()

  /** 各点と接ベクトルの今の値から、操作できる曲線・矢印・接ベクトルの名前を引き直す */
  const refresh = () => {
    points.forEach((point, i) => {
      tips[i].addVectors(point, tangents[i])
      tipMeshes[i].position.set(tips[i].x, tips[i].y, LAYER_POINT)
      arrows[i].setEnds(point, tips[i])

      // 接ベクトルの名前は、矢印の先から決めた側へ横に逃がす
      normal.set(-tangents[i].y, tangents[i].x, 0)
      if (normal.lengthSq() < EPSILON) normal.set(0, 1, 0)
      normal.normalize().multiplyScalar(TANGENT_LABEL_SIDES[i])
      tangentLabels[i].sprite.position
        .copy(tips[i])
        .addScaledVector(normal, TANGENT_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
    })

    segments.forEach((segment, i) => {
      for (let step = 0; step <= CURVE_SEGMENTS; step++) {
        segment.set(step, fergusonPoint(segmentConditions[i], step / CURVE_SEGMENTS, sample))
      }
      segment.commit()
    })

    // Tweakpane 側に読み取り専用で出す、いま与えている接ベクトル
    params.tangents = tangents
      .map((tangent, i) => `${TANGENT_LABELS[i]} = ${format(tangent)}`)
      .join("\n")
  }

  refresh()

  // 接ベクトルの先は canvas の上で直接ドラッグして動かす。
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

  /** ポインタに最も近い接ベクトルの先の番号。掴める距離に無ければ null */
  const pick = (world: Vector3) => {
    let target: number | null = null
    let nearest = PICK_RADIUS

    for (let index = 0; index < tips.length; index++) {
      const distance = Math.hypot(world.x - tips[index].x, world.y - tips[index].y)
      if (distance < nearest) {
        nearest = distance
        target = index
      }
    }

    return target
  }

  /** ワールド座標で受け取った位置へ接ベクトルの先を移し、図を引き直す */
  const move = (index: number, worldX: number, worldY: number) => {
    const x = Math.min(Math.max(worldX, DRAG_MIN_X), DRAG_MAX_X)
    const y = Math.min(Math.max(worldY, DRAG_MIN_Y), DRAG_MAX_Y)
    // 接ベクトルは、先の位置から点の位置を引いたもの。点そのものは動かさない
    tangents[index].set(x - points[index].x, y - points[index].y, 0)
    refresh()
  }

  const setActive = (index: number, active: boolean) => {
    tipMeshes[index].material = active ? activeMaterial : tipMaterial
  }

  let dragPointer: number | null = null
  let dragging: number | null = null
  let hovered: number | null = null

  const handlePointerDown = (event: PointerEvent) => {
    // 2 本目の指はピンチによるズーム。掴んでいる先は放して OrbitControls に任せる
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

    // 掴める先の上に来たら色を変えて、ドラッグできることを示す
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

      arrows.forEach((arrow) => arrow.dispose())
      const disposables = [
        alternativeMaterial,
        curveMaterial,
        pointGeometry,
        pointMaterial,
        tipGeometry,
        tipMaterial,
        activeMaterial,
        ...alternativeGeometries,
        ...segments.map((segment) => segment.geometry),
        ...[...pointLabels, ...tangentLabels].flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
