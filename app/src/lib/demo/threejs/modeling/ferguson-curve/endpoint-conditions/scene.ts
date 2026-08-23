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

/** Tweakpane に読み取り専用で出す、曲線に与えた 4 つの条件 */
export type EndpointConditionsParams = {
  /** scene.ts が計算して書き戻す、両端の位置の条件 */
  endpoints: string
  /** scene.ts が計算して書き戻す、両端の接ベクトルの条件 */
  tangents: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  params: EndpointConditionsParams
  invalidate: () => void
}

/**
 * 両端の点の初期位置。左下から右上へ向かう配置にして、
 * 始点で上へ出ていき終点で下を向いて着く形が、初期表示から読み取れるようにする
 */
const INITIAL_POINTS: [number, number][] = [
  [-2.7, -1],
  [2, 0.7]
]

/**
 * 両端の接ベクトルの初期値。V₀ は始点から右上へ立ち上がる向き、
 * V₁ は終点から右下へ抜けていく向きにとる（どちらも矢印の先が画面に収まる大きさ）
 */
const INITIAL_TANGENTS: [number, number][] = [
  [1.9, 2.4],
  [1.5, -1.5]
]

/** 両端の点と、接ベクトルの先に付ける名前 */
const POINT_LABELS = ["P₀", "P₁"]
const TANGENT_LABELS = ["V₀", "V₁"]

/** 掴んだ点を動かせる範囲。ラベルまで画面に収まる範囲にとどめる */
const DRAG_MIN_X = -3.2
const DRAG_MAX_X = 3.9
const DRAG_MIN_Y = -1.7
const DRAG_MAX_Y = 2.1

/** ポインタが点を掴んだとみなす距離。球の半径より広くとって掴みやすくする */
const PICK_RADIUS = 0.3

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 96

/** 曲線の上に置く、進む向きを示す矢印の位置（パラメータ t） */
const FLOW_MARKER_T = [0.4, 0.75]

/** 両端の点を示す球と、接ベクトルの先を示す球の半径 */
const POINT_RADIUS = 0.09
const TIP_RADIUS = 0.07

/** 接ベクトルの矢印の頭（円錐）の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.2

/** 曲線の上に置く矢印の頭の大きさ。接ベクトルの矢印より小さくする */
const FLOW_RADIUS = 0.05
const FLOW_HEIGHT = 0.16

/** 長さが 0 に潰れた向きを弾くための閾値 */
const EPSILON = 1e-6

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 両端の点の名前を、2 点を結ぶ向きの外側へ逃がす距離 */
const POINT_LABEL_OFFSET = 0.36

/** 接ベクトルの名前を、矢印の先から横へ逃がす距離 */
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
const LAYER_TANGENT = 0.02
const LAYER_CURVE = 0.03
const LAYER_FLOW = 0.04
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、曲線・両端の点・接ベクトルが見分けられる色にする
const CURVE_COLOR = "#ffc857"
const POINT_COLOR = "#b79cf5"
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
      // 接ベクトルの先が端点に重なると向きが決まらないので、そのときは矢印を出さない
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

/** 曲線の上に置く、進む向きを示す矢印の頭だけの印 */
const createFlowMarker = (color: string) => {
  const geometry = new ConeGeometry(FLOW_RADIUS, FLOW_HEIGHT, 16)
  const material = new MeshBasicMaterial({ color })
  const mesh = new Mesh(geometry, material)

  return {
    object: mesh,
    /** direction は長さ 1 に揃えた向きを渡す */
    setAt: (position: Vector3, direction: Vector3) => {
      mesh.position.set(position.x, position.y, LAYER_FLOW)
      mesh.quaternion.setFromUnitVectors(CONE_UP, direction)
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
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

/** それぞれを t で微分したもの。曲線が進む向きを求めるのに使う */
const hermiteDerivative = (t: number) => {
  const square = t * t

  return [6 * square - 6 * t, -6 * square + 6 * t, 3 * square - 4 * t + 1, 3 * square - 2 * t]
}

/**
 * ファーガソン曲線上の点 C(t) = H₀(t)P₀ + H₁(t)P₁ + H₂(t)V₀ + H₃(t)V₁。
 * 与える条件は両端の位置と接ベクトルの 4 つだけで、制御点は現れない
 */
const fergusonPoint = (conditions: Vector3[], t: number, target: Vector3) => {
  const weights = hermite(t)
  target.set(0, 0, 0)
  conditions.forEach((condition, i) => target.addScaledVector(condition, weights[i]))

  return target
}

/** 曲線がその点で進む向き C′(t)。エルミート関数を微分したものを重みに使う */
const fergusonTangent = (conditions: Vector3[], t: number, target: Vector3) => {
  const weights = hermiteDerivative(t)
  target.set(0, 0, 0)
  conditions.forEach((condition, i) => target.addScaledVector(condition, weights[i]))

  return target
}

/** パネルに出す座標の書き方。小数第 2 位まで揃える */
const format = (vector: Vector3) => `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`

export const createEndpointConditionsScene = ({
  scene,
  camera,
  renderer,
  params,
  invalidate
}: SceneContext) => {
  const points = INITIAL_POINTS.map(([x, y]) => new Vector3(x, y, 0))
  const tangents = INITIAL_TANGENTS.map(([x, y]) => new Vector3(x, y, 0))

  /** 接ベクトルの先。P + V の位置にあり、掴むと接ベクトルの向きと大きさが変わる */
  const tips = points.map(() => new Vector3())

  /** 曲線を決める 4 つの条件。この順で H₀ 〜 H₃ の重みがかかる */
  const conditions = [points[0], points[1], tangents[0], tangents[1]]

  // 4 つの条件から求めた曲線。矢印より手前に置き、接している様子が隠れないようにする
  const curve = createPolyline(CURVE_SEGMENTS + 1, LAYER_CURVE)
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  const curveLine = new Line(curve.geometry, curveMaterial)
  curveLine.frustumCulled = false
  scene.add(curveLine)

  // 両端の接ベクトル。始点では曲線が出ていく向き、終点では曲線が向いている向きにあたる
  const arrows = tangents.map(() => {
    const arrow = createArrow(TANGENT_COLOR)
    scene.add(arrow.object)

    return arrow
  })

  // 曲線の上に置く、t が増える向き（始点から終点へ）を示す印
  const flowMarkers = FLOW_MARKER_T.map(() => {
    const marker = createFlowMarker(CURVE_COLOR)
    scene.add(marker.object)

    return marker
  })

  // 両端の点と接ベクトルの先。どちらもドラッグで動かせるので、掴んでいる 1 つだけ色を変える
  const pointGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const tipGeometry = new SphereGeometry(TIP_RADIUS, 16, 12)
  const pointMaterial = new MeshBasicMaterial({ color: POINT_COLOR })
  const tipMaterial = new MeshBasicMaterial({ color: TANGENT_COLOR })
  const activeMaterial = new MeshBasicMaterial({ color: ACTIVE_COLOR })

  const pointMeshes = points.map(() => {
    const mesh = new Mesh(pointGeometry, pointMaterial)
    scene.add(mesh)

    return mesh
  })
  const tipMeshes = tips.map(() => {
    const mesh = new Mesh(tipGeometry, tipMaterial)
    scene.add(mesh)

    return mesh
  })

  /** 掴める点は 4 つ。前半が両端の点、後半が接ベクトルの先 */
  const handles = [...points, ...tips]
  const handleMeshes = [...pointMeshes, ...tipMeshes]
  const handleMaterials = [pointMaterial, pointMaterial, tipMaterial, tipMaterial]

  const pointLabels = POINT_LABELS.map((text) => {
    const label = createLabel(text, POINT_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)

    return label
  })
  const tangentLabels = TANGENT_LABELS.map((text) => {
    const label = createLabel(text, TANGENT_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)

    return label
  })

  const sample = new Vector3()
  const direction = new Vector3()
  const span = new Vector3()
  const midpoint = new Vector3()
  const normal = new Vector3()
  const toMidpoint = new Vector3()

  /** 接ベクトルの名前を、矢印の先から横（2 点の中点の反対側）へ逃がす */
  const placeTangentLabel = (label: { sprite: Sprite }, tip: Vector3, tangent: Vector3) => {
    normal.set(-tangent.y, tangent.x, 0)
    if (normal.lengthSq() < EPSILON) normal.set(0, 1, 0)
    normal.normalize()
    if (normal.dot(toMidpoint.subVectors(midpoint, tip)) > 0) normal.negate()
    label.sprite.position.copy(tip).addScaledVector(normal, TANGENT_LABEL_OFFSET).setZ(LAYER_LABEL)
  }

  /** 両端の点と接ベクトルの今の値から、曲線・矢印・ラベルを引き直す */
  const refresh = () => {
    points.forEach((point, i) => {
      tips[i].addVectors(point, tangents[i])
      pointMeshes[i].position.set(point.x, point.y, LAYER_POINT)
      tipMeshes[i].position.set(tips[i].x, tips[i].y, LAYER_POINT)
      // 接ベクトルは、始点では P₀ から、終点では P₁ から生やす
      arrows[i].setEnds(point, tips[i])
    })

    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
      curve.set(i, fergusonPoint(conditions, i / CURVE_SEGMENTS, sample))
    }
    curve.commit()

    FLOW_MARKER_T.forEach((t, i) => {
      fergusonPoint(conditions, t, sample)
      const length = fergusonTangent(conditions, t, direction).length()
      // 接ベクトルが打ち消し合って向きが決まらない位置では、印を出さない
      flowMarkers[i].object.visible = length > EPSILON
      if (flowMarkers[i].object.visible) {
        flowMarkers[i].setAt(sample, direction.divideScalar(length))
      }
    })

    // 両端の点の名前は、2 点を結ぶ向きの外側へ逃がして曲線に重ならないようにする
    span.subVectors(points[1], points[0])
    if (span.lengthSq() < EPSILON) span.set(1, 0, 0)
    span.normalize()
    pointLabels[0].sprite.position
      .copy(points[0])
      .addScaledVector(span, -POINT_LABEL_OFFSET)
      .setZ(LAYER_LABEL)
    pointLabels[1].sprite.position
      .copy(points[1])
      .addScaledVector(span, POINT_LABEL_OFFSET)
      .setZ(LAYER_LABEL)

    midpoint.addVectors(points[0], points[1]).multiplyScalar(0.5)
    tangentLabels.forEach((label, i) => placeTangentLabel(label, tips[i], tangents[i]))

    // Tweakpane 側に読み取り専用で出す、曲線に与えている 4 つの条件
    params.endpoints = `P₀ = ${format(points[0])}\nP₁ = ${format(points[1])}`
    params.tangents = `V₀ = ${format(tangents[0])}\nV₁ = ${format(tangents[1])}`
  }

  refresh()

  // 点は Tweakpane ではなく canvas の上で直接ドラッグして動かす。
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

  /** ポインタに最も近い掴める点の番号。掴める距離に無ければ null */
  const pick = (world: Vector3) => {
    let target: number | null = null
    let nearest = PICK_RADIUS

    for (let index = 0; index < handles.length; index++) {
      const handle = handles[index]
      const distance = Math.hypot(world.x - handle.x, world.y - handle.y)
      if (distance < nearest) {
        nearest = distance
        target = index
      }
    }

    return target
  }

  /** ワールド座標で受け取った位置へ掴んだ点を移し、図を引き直す */
  const move = (index: number, worldX: number, worldY: number) => {
    const x = Math.min(Math.max(worldX, DRAG_MIN_X), DRAG_MAX_X)
    const y = Math.min(Math.max(worldY, DRAG_MIN_Y), DRAG_MAX_Y)

    if (index < points.length) {
      // 端点を動かす。接ベクトルはそのままなので、矢印は端点に付いて動く
      points[index].set(x, y, 0)
    } else {
      // 接ベクトルの先を動かす。接ベクトルは、先の位置から端点の位置を引いたもの
      const i = index - points.length
      tangents[i].set(x - points[i].x, y - points[i].y, 0)
    }

    refresh()
  }

  const setActive = (index: number, active: boolean) => {
    handleMeshes[index].material = active ? activeMaterial : handleMaterials[index]
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

      arrows.forEach((arrow) => arrow.dispose())
      flowMarkers.forEach((marker) => marker.dispose())
      const disposables = [
        curve.geometry,
        curveMaterial,
        pointGeometry,
        tipGeometry,
        pointMaterial,
        tipMaterial,
        activeMaterial,
        ...[...pointLabels, ...tangentLabels].flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
