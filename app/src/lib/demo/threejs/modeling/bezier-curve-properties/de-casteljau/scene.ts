import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
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
export type DeCasteljauParams = {
  /** 各段で隣り合う 2 点を内分する割合。0 で P₀、1 で P₃ に重なる */
  t: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: DeCasteljauParams
}

/**
 * 4 つの制御点。左右対称にすると各段の点も対称に並んでしまうので、
 * 高さと幅をずらした山形に置く。z は 0 のままにし、この平面に図を重ねていく
 */
const CONTROL_POINTS = [
  new Vector3(-2.7, -1.2, 0),
  new Vector3(-1.7, 1.35, 0),
  new Vector3(1.2, 1.05, 0),
  new Vector3(2.7, -0.75, 0)
]

/** 段ごとの点の数。4 つの制御点から始めて、1 段進むごとに 1 つ減り、最後は 1 つになる */
const LEVEL_SIZES = [4, 3, 2, 1]

/** 制御点に付ける名前。添字は 0 から順に振る */
const CONTROL_LABELS = ["P₀", "P₁", "P₂", "P₃"]

/** C(t) の軌跡を折れ線で近似する分割数 */
const TRACE_SEGMENTS = 64

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** 段ごとの点を示す球の半径。制御点と最後の 1 点は、間の段より少し大きくする */
const LEVEL_RADII = [0.075, 0.055, 0.055, 0.065]

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、制御点の重心から見て外向きに逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.36

/** C(t) のラベルを、最後の線分から曲線の外側へ逃がす距離 */
const MARKER_LABEL_OFFSET = 0.36

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_POLYGON = 0.01
const LAYER_CHORD = 0.02
const LAYER_TRACE = 0.03
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、制御多角形・各段の点・軌跡が見分けられる色にする。
// 段ごとに色を変え、点とその点どうしを結ぶ線分は同じ色にする
const POLYGON_COLOR = "#9aa3b0"
const TRACE_COLOR = "#ffc857"
const LEVEL_COLORS = ["#b79cf5", "#5ec8f2", "#7fd88f", "#f57fc4"]

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

/** 頂点が毎フレーム動く折れ線。頂点を作り直さず、座標だけ書き換える */
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

/** 線形補間。2 点の座標値を 1 − t : t の割合で混ぜる */
const lerp = (from: Vector3, to: Vector3, t: number, target: Vector3) =>
  target
    .copy(from)
    .multiplyScalar(1 - t)
    .addScaledVector(to, t)

// 軌跡を求めるときに使う作業用の点。何度も呼ばれるので、その都度は作らない
const work = CONTROL_POINTS.map(() => new Vector3())

/** 軌跡用に、作図の途中を残さずベジェ曲線上の点だけを求める */
const bezierPoint = (t: number, target: Vector3) => {
  CONTROL_POINTS.forEach((point, i) => work[i].copy(point))

  for (let last = work.length - 1; last > 0; last--) {
    for (let i = 0; i < last; i++) work[i].lerp(work[i + 1], t)
  }

  return target.copy(work[0])
}

export const createDeCasteljauScene = ({ scene, params }: SceneContext) => {
  /** 段ごとの点。0 段目は制御点そのもので、1 段進むごとに 1 つ減る */
  const levels = LEVEL_SIZES.map((size) => Array.from({ length: size }, () => new Vector3()))

  // 制御点を順に結んだ制御多角形。制御点は動かないので 1 度組めばよい。
  // 各段で作る線分と描き分けるため破線にする
  const polygonGeometry = new BufferGeometry().setFromPoints(
    CONTROL_POINTS.map((point) => new Vector3(point.x, point.y, LAYER_POLYGON))
  )
  const polygonMaterial = new LineDashedMaterial({
    color: POLYGON_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const polygonLine = new Line(polygonGeometry, polygonMaterial)
  // 破線の刻みは頂点ごとの「線に沿った距離」で決まるので、置いたあとに測る
  polygonLine.computeLineDistances()
  scene.add(polygonLine)

  // 段ごとの点。同じ段の点はジオメトリとマテリアルを共有する
  const geometries = LEVEL_RADII.map((radius) => new SphereGeometry(radius, 16, 12))
  const materials = LEVEL_COLORS.map((color) => new MeshBasicMaterial({ color }))
  const markers = LEVEL_SIZES.map((size, level) =>
    Array.from({ length: size }, () => {
      const mesh = new Mesh(geometries[level], materials[level])
      scene.add(mesh)
      return mesh
    })
  )

  /**
   * 同じ段の点どうしを結ぶ線分。次の段の点はこの線分の上に乗る。
   * 0 段目は制御多角形として破線で描いてあるので、1 段目以降だけ作る
   */
  const chords = LEVEL_SIZES.map((size, level) =>
    level === 0
      ? []
      : Array.from({ length: size - 1 }, () => {
          const chord = createSegment(LEVEL_COLORS[level], LAYER_CHORD)
          scene.add(chord.object)
          return chord
        })
  )

  // 最後に残る 1 点が 0 から今の t までに通った跡。折れ線で近似する
  const trace = createPolyline(TRACE_SEGMENTS + 1, LAYER_TRACE)
  const traceMaterial = new LineBasicMaterial({ color: TRACE_COLOR })
  const traceLine = new Line(trace.geometry, traceMaterial)
  traceLine.frustumCulled = false
  scene.add(traceLine)

  // 制御点のラベル。重心から見て外向きへ逃がし、破線や曲線に重ならないようにする
  const centroid = new Vector3()
  CONTROL_POINTS.forEach((point) => centroid.add(point))
  centroid.multiplyScalar(1 / CONTROL_POINTS.length)

  const normal = new Vector3()
  const labels = CONTROL_POINTS.map((point, i) => {
    const label = createLabel(CONTROL_LABELS[i], LEVEL_COLORS[0], LABEL_HEIGHT)
    normal.subVectors(point, centroid).normalize()
    label.sprite.position
      .copy(point)
      .addScaledVector(normal, CONTROL_LABEL_OFFSET)
      .setZ(LAYER_LABEL)
    scene.add(label.sprite)
    return label
  })

  // 最後に残る 1 点は曲線上の点なので、C(t) と名前を付ける
  const markerLabel = createLabel("C(t)", LEVEL_COLORS[LEVEL_COLORS.length - 1], LABEL_HEIGHT)
  scene.add(markerLabel.sprite)

  /** 制御多角形の上辺の中点。C(t) のラベルを曲線の側へ逃がすための目印にする */
  const apex = new Vector3().addVectors(CONTROL_POINTS[1], CONTROL_POINTS[2]).multiplyScalar(0.5)

  const sample = new Vector3()
  const toApex = new Vector3()

  return {
    update: () => {
      const t = params.t

      // 0 段目は制御点そのもの
      CONTROL_POINTS.forEach((point, i) => levels[0][i].copy(point))

      // 隣り合う 2 点を t : (1 − t) の比で内分して次の段の点を作る。
      // 段が進むごとに点が 1 つ減り、最後に残った 1 点が曲線上の点になる
      for (let level = 1; level < levels.length; level++) {
        for (let i = 0; i < levels[level].length; i++) {
          lerp(levels[level - 1][i], levels[level - 1][i + 1], t, levels[level][i])
        }
      }

      // 各段の点と、その点どうしを結ぶ線分
      levels.forEach((points, level) => {
        points.forEach((point, i) => markers[level][i].position.set(point.x, point.y, LAYER_POINT))
        chords[level].forEach((chord, i) => chord.set(points[i], points[i + 1]))
      })

      // 最後の 1 点が通った跡。0 から今の t までを等分して求め、折れ線で結ぶ
      for (let i = 0; i <= TRACE_SEGMENTS; i++) {
        trace.set(i, bezierPoint((t * i) / TRACE_SEGMENTS, sample))
      }
      trace.commit()

      // C(t) のラベルは、最後の線分に垂直な向きのうち制御多角形の上辺から遠い側へ逃がす。
      // 曲線はこの線分に接して上辺の反対側にあるので、この側なら作図の線に重ならない
      const [last0, last1] = levels[levels.length - 2]
      const current = levels[levels.length - 1][0]
      normal.set(last1.y - last0.y, last0.x - last1.x, 0).normalize()
      if (normal.dot(toApex.subVectors(apex, current)) > 0) normal.negate()
      markerLabel.sprite.position
        .copy(current)
        .addScaledVector(normal, MARKER_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
    },
    dispose: () => {
      chords.flat().forEach((chord) => chord.dispose())
      const disposables = [
        polygonGeometry,
        polygonMaterial,
        trace.geometry,
        traceMaterial,
        ...geometries,
        ...materials,
        markerLabel.texture,
        markerLabel.material,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
