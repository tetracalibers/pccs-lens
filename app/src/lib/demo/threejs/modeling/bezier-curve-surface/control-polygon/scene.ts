import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  DoubleSide,
  LineDashedMaterial,
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
 * このデモは Tweakpane を持たない（制御点は canvas の上で直接ドラッグして動かす）ため、
 * パネルと共有するパラメータは無い
 */
export type ControlPolygonParams = Record<string, never>

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  invalidate: () => void
}

/** 制御点が 3 つの側と 4 つの側。どちらもすべての点をドラッグで動かせる */
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

/** 制御点に付ける名前。添字は 0 から順に振る */
const CONTROL_LABELS = ["P₀", "P₁", "P₂", "P₃"]

/** 2 つのパネルを左右に振り分ける距離 */
const PANEL_OFFSET = 2.6

/** 制御点を動かせる範囲（パネルの中での座標）。隣のパネルや見出しに重ならない範囲にとどめる */
const DRAG_MIN_X = -2
const DRAG_MAX_X = 2
const DRAG_MIN_Y = -1.6
const DRAG_MAX_Y = 2.1

/** ポインタが制御点を掴んだとみなす距離。球の半径より広くとって掴みやすくする */
const PICK_RADIUS = 0.3

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 64

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** 制御多角形の内側を塗る濃さ。破線だけではどこが多角形なのか掴みにくいので、面でも示す */
const POLYGON_FILL_OPACITY = 0.12

/** 制御点を示す球の半径 */
const CONTROL_RADIUS = 0.07

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28
const TITLE_HEIGHT = 0.32

/** パネルの見出しを置く高さ */
const TITLE_Y = 2.55

/** 制御点のラベルを、その多角形の重心から見て外向きに逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.36

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_FILL = -0.01
const LAYER_POLYGON = 0.01
const LAYER_CURVE = 0.02
const LAYER_POINT = 0.03
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、制御多角形・曲線・制御点が見分けられる色にする
const POLYGON_COLOR = "#9aa3b0"
const CURVE_COLOR = "#ffc857"
const CONTROL_COLOR = "#b79cf5"
const ACTIVE_COLOR = "#f57fc4"
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
 * 制御多角形の内側を塗る面。頂点を 1 番目の制御点から扇状に三角形へ分け、
 * 折れ線と同じ頂点をそのまま使う（頂点が動いても座標を書き換えるだけで済む）
 */
const createPolygonFill = (count: number) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(count * 3), 3)
  geometry.setAttribute("position", positions)
  const index: number[] = []
  for (let i = 1; i < count - 1; i++) index.push(0, i, i + 1)
  geometry.setIndex(index)

  const material = new MeshBasicMaterial({
    color: POLYGON_COLOR,
    transparent: true,
    opacity: POLYGON_FILL_OPACITY,
    // 制御点を動かすと表裏が入れ替わりうるので、どちらから見ても塗る
    side: DoubleSide,
    // 手前に重なる曲線・破線が面の形に欠けないよう、深度は書かない
    depthWrite: false
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false

  return {
    object: mesh,
    set: (i: number, point: Vector3) => positions.setXYZ(i, point.x, point.y, LAYER_FILL),
    commit: () => {
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 制御多角形（破線）とベジェ曲線（実線）を重ねた 1 枚のパネル */
const createPanel = (source: [number, number][], title: string, offsetX: number) => {
  const group = new Group()
  group.position.x = offsetX

  const controls = source.map(([x, y]) => new Vector3(x, y, 0))
  const sample = new Vector3()

  // 制御多角形の内側。破線より奥に敷き、面としての広がりを示す
  const fill = createPolygonFill(controls.length)
  group.add(fill.object)

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

  // 制御点。どれもドラッグで動かせるので同じ見た目にし、
  // 掴んでいる（掴める）1 つだけ色を変えて示す
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const activeMaterial = new MeshBasicMaterial({ color: ACTIVE_COLOR })
  const meshes = controls.map(() => {
    const mesh = new Mesh(controlGeometry, controlMaterial)
    group.add(mesh)
    return mesh
  })

  const labels = controls.map((_, i) => {
    const label = createLabel(CONTROL_LABELS[i], CONTROL_COLOR, LABEL_HEIGHT)
    group.add(label.sprite)
    return label
  })
  const titleLabel = createLabel(title, TITLE_COLOR, TITLE_HEIGHT)
  titleLabel.sprite.position.set(0, TITLE_Y, LAYER_LABEL)
  group.add(titleLabel.sprite)

  const centroid = new Vector3()
  const normal = new Vector3()

  /** 制御点の今の位置から、制御多角形・曲線・ラベルを引き直す */
  const refresh = () => {
    centroid.set(0, 0, 0)
    controls.forEach((control) => centroid.add(control))
    centroid.multiplyScalar(1 / controls.length)

    controls.forEach((control, i) => {
      polygon.set(i, control)
      fill.set(i, control)
      meshes[i].position.set(control.x, control.y, LAYER_POINT)
      // ラベルは多角形の重心から見て外向きへ逃がし、破線や曲線に重ならないようにする
      normal.subVectors(control, centroid).normalize()
      labels[i].sprite.position
        .copy(control)
        .addScaledVector(normal, CONTROL_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
    })
    polygon.commit()
    fill.commit()
    // 破線の刻みは頂点ごとの「線に沿った距離」で決まるため、頂点を動かすたびに測り直す
    polygonLine.computeLineDistances()

    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
      curve.set(i, bezierPoint(controls, i / CURVE_SEGMENTS, sample))
    }
    curve.commit()
  }

  refresh()

  return {
    object: group,
    offsetX,
    controls,
    /** 掴んでいる制御点だけ色を変える */
    setActive: (index: number, active: boolean) => {
      meshes[index].material = active ? activeMaterial : controlMaterial
    },
    /** ワールド座標で受け取った位置へ制御点を移し、多角形と曲線を引き直す */
    move: (index: number, worldX: number, worldY: number) => {
      const x = Math.min(Math.max(worldX - offsetX, DRAG_MIN_X), DRAG_MAX_X)
      const y = Math.min(Math.max(worldY, DRAG_MIN_Y), DRAG_MAX_Y)
      controls[index].set(x, y, 0)
      refresh()
    },
    dispose: () => {
      fill.dispose()
      const disposables = [
        polygon.geometry,
        polygonMaterial,
        curve.geometry,
        curveMaterial,
        controlGeometry,
        controlMaterial,
        activeMaterial,
        titleLabel.texture,
        titleLabel.material,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

type Panel = ReturnType<typeof createPanel>
type Target = { panel: Panel; index: number }

const isSame = (a: Target | null, b: Target | null) =>
  a !== null && b !== null && a.panel === b.panel && a.index === b.index

export const createControlPolygonScene = ({
  scene,
  camera,
  renderer,
  invalidate
}: SceneContext) => {
  // 制御点の数だけを変えた 2 枚を左右に並べ、同じ操作での違いを見比べられるようにする
  const panels = [
    createPanel(QUADRATIC_POINTS, "制御点3つ", -PANEL_OFFSET),
    createPanel(CUBIC_POINTS, "制御点4つ", PANEL_OFFSET)
  ]
  panels.forEach((panel) => scene.add(panel.object))

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

  /** ポインタに最も近い制御点。掴める距離に無ければ null */
  const pick = (world: Vector3): Target | null => {
    let target: Target | null = null
    let nearest = PICK_RADIUS

    for (const panel of panels) {
      for (let index = 0; index < panel.controls.length; index++) {
        const control = panel.controls[index]
        const distance = Math.hypot(world.x - (control.x + panel.offsetX), world.y - control.y)
        if (distance < nearest) {
          nearest = distance
          target = { panel, index }
        }
      }
    }

    return target
  }

  let dragPointer: number | null = null
  let dragging: Target | null = null
  let hovered: Target | null = null

  const handlePointerDown = (event: PointerEvent) => {
    // 2 本目の指はピンチによるズーム。掴んでいる点は放して OrbitControls に任せる
    if (dragPointer !== null) return

    const world = toScenePoint(event)
    if (!world) return
    const target = pick(world)
    if (!target) return

    dragPointer = event.pointerId
    dragging = target
    target.panel.setActive(target.index, true)
    // canvas の外まで指が出ても動かし続けられるようにする（pointerup で自動的に解ける）
    canvas.setPointerCapture(event.pointerId)
    invalidate()
  }

  const handlePointerMove = (event: PointerEvent) => {
    const world = toScenePoint(event)
    if (!world) return

    if (dragging && event.pointerId === dragPointer) {
      dragging.panel.move(dragging.index, world.x, world.y)
      // 描画は要求されたときだけ走る。Tweakpane や OrbitControls を経由しない操作なので、
      // ここで次のフレームを頼む
      invalidate()

      return
    }

    // 掴める点の上に来たら色を変えて、ドラッグできることを示す
    const target = pick(world)
    if (isSame(target, hovered)) return
    if (hovered && !isSame(hovered, dragging)) hovered.panel.setActive(hovered.index, false)
    hovered = target
    if (hovered) hovered.panel.setActive(hovered.index, true)
    invalidate()
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId !== dragPointer) return
    if (dragging && !isSame(dragging, hovered)) dragging.panel.setActive(dragging.index, false)
    dragging = null
    dragPointer = null
    invalidate()
  }

  const handlePointerLeave = () => {
    if (hovered && !isSame(hovered, dragging)) hovered.panel.setActive(hovered.index, false)
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
      panels.forEach((panel) => panel.dispose())
    }
  }
}
