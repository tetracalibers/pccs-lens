import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type QuadraticBezierParams = {
  /** 2 本の線分を分ける割合。0 で P0、1 で P2 に重なる */
  t: number
  /** scene.ts が計算して書き戻す、混合の内訳を表す文字列 */
  mix: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: QuadraticBezierParams
}

/**
 * 3 つの制御点。P0 → P1 → P2 と辿る 2 本の線分の内側に曲線が現れる。
 * z は 0 のままにし、この平面より手前に他の要素を重ねていく
 */
const P0 = new Vector3(-2.6, -1.1, 0)
const P1 = new Vector3(0, 1.7, 0)
const P2 = new Vector3(2.6, -1.1, 0)

/** 2 本の線分をいくつに分けるか。同じ番号の分点どうしを結んだ線分の束が、曲線を浮かび上がらせる */
const DIVISION_COUNT = 10

/** 束の線分の薄さ。1 本ずつではなく、重なりの縁を見るためのもの */
const FAMILY_OPACITY = 0.35

/** C(t) の軌跡を折れ線で近似する分割数 */
const TRACE_SEGMENTS = 64

/** 分点・制御点・分けている点・今の点を示す球の半径 */
const DIVISION_RADIUS = 0.045
const CONTROL_RADIUS = 0.11
const KNOT_RADIUS = 0.075
const MARKER_RADIUS = 0.095

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、点そのものから離す向き */
const P0_LABEL_OFFSET = new Vector3(-0.38, -0.24, 0)
const P1_LABEL_OFFSET = new Vector3(0, 0.38, 0)
const P2_LABEL_OFFSET = new Vector3(0.38, -0.24, 0)

/** 分けている点のラベルを、それぞれの線分から外側へ逃がす向き */
const Q0_LABEL_OFFSET = new Vector3(-0.3, 0.27, 0)
const Q1_LABEL_OFFSET = new Vector3(0.3, 0.27, 0)

/** C(t) のラベルを、今の線分から曲線の外側へ逃がす距離 */
const MARKER_LABEL_OFFSET = 0.36

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、束の線分（z = 0）より手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_EDGE = 0.01
const LAYER_CHORD = 0.02
const LAYER_TRACE = 0.03
const LAYER_DIVISION = 0.04
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、制御点・2 本の線分・束・軌跡・今の点が見分けられる色にする
const CONTROL_COLOR = "#b79cf5"
const EDGE_COLOR = "#9aa3b0"
const DIVISION_COLOR = "#e8e8ee"
const CHORD_COLOR = "#5ec8f2"
const TRACE_COLOR = "#ffc857"
const MARKER_COLOR = "#f57fc4"

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

/** 両端が毎フレーム動く線分。頂点を作り直さず、座標だけ書き換える */
const createSegment = (color: string) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  geometry.setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new LineSegments(geometry, material)
  // 端点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    set: (from: Vector3, to: Vector3, z: number) => {
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

/** 線形補間。2 点の座標値を 1 − t : t の割合で混ぜる */
const lerp = (from: Vector3, to: Vector3, t: number, target: Vector3) =>
  target
    .copy(from)
    .multiplyScalar(1 - t)
    .addScaledVector(to, t)

// C(t) を求める途中の 2 点。毎フレーム何度も呼ばれるので、その都度は作らない
const q0 = new Vector3()
const q1 = new Vector3()

/**
 * 2 次ベジェ曲線上の点 C(t)。
 * P0P1 上の点 Q0(t) と P1P2 上の点 Q1(t) を、同じ t でもう一度線形補間して求める
 */
const quadraticPoint = (t: number, target: Vector3) =>
  lerp(lerp(P0, P1, t, q0), lerp(P1, P2, t, q1), t, target)

export const createQuadraticBezierScene = ({ scene, params }: SceneContext) => {
  // 制御点を順に結んだ 2 本の線分
  const edgeGeometry = new BufferGeometry().setFromPoints(
    [P0, P1, P2].map((point) => new Vector3(point.x, point.y, LAYER_EDGE))
  )
  const edgeMaterial = new LineBasicMaterial({ color: EDGE_COLOR })
  scene.add(new Line(edgeGeometry, edgeMaterial))

  // 2 本の線分を同じ数に分け、同じ番号の分点どうしを結ぶ。この束の縁に曲線が浮かび上がる
  const familyPoints: Vector3[] = []
  for (let i = 0; i <= DIVISION_COUNT; i++) {
    const t = i / DIVISION_COUNT
    familyPoints.push(lerp(P0, P1, t, new Vector3()), lerp(P1, P2, t, new Vector3()))
  }
  const familyGeometry = new BufferGeometry().setFromPoints(familyPoints)
  const familyMaterial = new LineBasicMaterial({
    color: CHORD_COLOR,
    transparent: true,
    opacity: FAMILY_OPACITY
  })
  scene.add(new LineSegments(familyGeometry, familyMaterial))

  // 分点。2 本の線分がどこで分けられているかを示す
  const divisionGeometry = new SphereGeometry(DIVISION_RADIUS, 12, 8)
  const divisionMaterial = new MeshBasicMaterial({ color: DIVISION_COLOR })
  familyPoints.forEach((point) => {
    const dot = new Mesh(divisionGeometry, divisionMaterial)
    dot.position.set(point.x, point.y, LAYER_DIVISION)
    scene.add(dot)
  })

  // 束のうち、今の t にあたる 1 本
  const chord = createSegment(CHORD_COLOR)
  scene.add(chord.object)

  // C が 0 から今の t までに通った跡。折れ線で近似する
  const traceGeometry = new BufferGeometry()
  const tracePositions = new Float32BufferAttribute(new Float32Array((TRACE_SEGMENTS + 1) * 3), 3)
  traceGeometry.setAttribute("position", tracePositions)
  const traceMaterial = new LineBasicMaterial({ color: TRACE_COLOR })
  const trace = new Line(traceGeometry, traceMaterial)
  trace.frustumCulled = false
  scene.add(trace)

  // 自分で置いた 3 つの制御点
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  for (const point of [P0, P1, P2]) {
    const mesh = new Mesh(controlGeometry, controlMaterial)
    mesh.position.set(point.x, point.y, LAYER_POINT)
    scene.add(mesh)
  }

  // 今の t が 2 本の線分を分けている点と、そのあいだをさらに分けた点
  const knotGeometry = new SphereGeometry(KNOT_RADIUS, 16, 12)
  const knotMaterial = new MeshBasicMaterial({ color: CHORD_COLOR })
  const knot0 = new Mesh(knotGeometry, knotMaterial)
  const knot1 = new Mesh(knotGeometry, knotMaterial)
  const markerGeometry = new SphereGeometry(MARKER_RADIUS, 16, 12)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  scene.add(knot0, knot1, marker)

  const labels = {
    p0: createLabel("P₀", CONTROL_COLOR, LABEL_HEIGHT),
    p1: createLabel("P₁", CONTROL_COLOR, LABEL_HEIGHT),
    p2: createLabel("P₂", CONTROL_COLOR, LABEL_HEIGHT),
    q0: createLabel("Q₀", CHORD_COLOR, LABEL_HEIGHT),
    q1: createLabel("Q₁", CHORD_COLOR, LABEL_HEIGHT),
    marker: createLabel("C(t)", MARKER_COLOR, LABEL_HEIGHT)
  }
  labels.p0.sprite.position.copy(P0).add(P0_LABEL_OFFSET).setZ(LAYER_LABEL)
  labels.p1.sprite.position.copy(P1).add(P1_LABEL_OFFSET).setZ(LAYER_LABEL)
  labels.p2.sprite.position.copy(P2).add(P2_LABEL_OFFSET).setZ(LAYER_LABEL)
  Object.values(labels).forEach((label) => scene.add(label.sprite))

  const first = new Vector3()
  const second = new Vector3()
  const current = new Vector3()
  const sample = new Vector3()
  const normal = new Vector3()
  const toApex = new Vector3()

  return {
    update: () => {
      const t = params.t

      // 2 本の線分を同じ割合で分ける 2 点と、そのあいだをさらに同じ割合で分けた点
      lerp(P0, P1, t, first)
      lerp(P1, P2, t, second)
      lerp(first, second, t, current)

      chord.set(first, second, LAYER_CHORD)
      knot0.position.set(first.x, first.y, LAYER_POINT)
      knot1.position.set(second.x, second.y, LAYER_POINT)
      marker.position.set(current.x, current.y, LAYER_POINT)

      // C が通った跡。0 から今の t までを等分して求め、折れ線で結ぶ
      for (let i = 0; i <= TRACE_SEGMENTS; i++) {
        quadraticPoint((t * i) / TRACE_SEGMENTS, sample)
        tracePositions.setXYZ(i, sample.x, sample.y, LAYER_TRACE)
      }
      tracePositions.needsUpdate = true

      labels.q0.sprite.position.copy(first).add(Q0_LABEL_OFFSET).setZ(LAYER_LABEL)
      labels.q1.sprite.position.copy(second).add(Q1_LABEL_OFFSET).setZ(LAYER_LABEL)

      // C(t) のラベルは、今の線分に垂直な向きのうち P1 から遠い側へ逃がす。
      // 曲線は線分に接して P1 の反対側にあるので、この側なら束の線に重ならない
      normal.set(second.y - first.y, first.x - second.x, 0).normalize()
      if (normal.dot(toApex.subVectors(P1, current)) > 0) normal.negate()
      labels.marker.sprite.position
        .copy(current)
        .addScaledVector(normal, MARKER_LABEL_OFFSET)
        .setZ(LAYER_LABEL)

      // Tweakpane 側に読み取り専用で出す、3 つの制御点にかかる混合比
      const w0 = (1 - t) * (1 - t)
      const w1 = 2 * t * (1 - t)
      const w2 = t * t
      params.mix = `${w0.toFixed(2)} P₀ + ${w1.toFixed(2)} P₁ + ${w2.toFixed(2)} P₂`
    },
    dispose: () => {
      chord.dispose()
      const disposables = [
        edgeGeometry,
        edgeMaterial,
        familyGeometry,
        familyMaterial,
        divisionGeometry,
        divisionMaterial,
        traceGeometry,
        traceMaterial,
        controlGeometry,
        controlMaterial,
        knotGeometry,
        knotMaterial,
        markerGeometry,
        markerMaterial,
        ...Object.values(labels).flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
