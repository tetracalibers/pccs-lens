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
  /** 各段で隣り合う 2 点を内分する割合。0 で P₀、1 で最後の制御点に重なる */
  t: number
  /** 作図全体の段数。制御点はこれより 1 つ多く、点が 1 つに減りきるまで内分を繰り返す */
  level: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: DeCasteljauParams
}

/** 段数の下限と上限。下限の 3 が 3 次ベジェ曲線（制御点 4 つ）にあたる */
export const MIN_LEVEL = 3
export const MAX_LEVEL = 6

/**
 * 制御点を並べる弧（左下から山なりに回って右下へ向かう）の半径と中心の高さ。
 * z は 0 のままにし、この平面に図を重ねていく
 */
const ARC_RADIUS_X = 2.7
const ARC_RADIUS_Y = 2.6
const ARC_CENTER_Y = -1.2

/** 弧を左右非対称にする傾き。対称に並べると各段の点も対称に並んでしまう */
const TILT_Y = 0.45

/**
 * 段数から制御点の並びを作る。弧の上に等間隔に置くので、点をいくつ並べても
 * 隣り合う辺が一直線には並ばない（並ぶと、各段で作る線分が制御多角形に重なって読めなくなる）
 */
const createControlPoints = (level: number) =>
  Array.from({ length: level + 1 }, (_, i) => {
    const u = i / level
    const angle = Math.PI * (1 - u)

    return new Vector3(
      ARC_RADIUS_X * Math.cos(angle),
      ARC_CENTER_Y + ARC_RADIUS_Y * Math.sin(angle) + TILT_Y * u,
      0
    )
  })

/** 段数ごとの制御点。毎フレーム作り直さないよう、下限から上限までを先に用意しておく */
const CONTROL_POINT_SETS = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) =>
  createControlPoints(MIN_LEVEL + i)
)

/** 制御点に付ける名前。添字は 0 から順に振る */
const CONTROL_LABELS = ["P₀", "P₁", "P₂", "P₃", "P₄", "P₅", "P₆"]

/** C(t) の軌跡を折れ線で近似する分割数 */
const TRACE_SEGMENTS = 64

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** 段ごとの点を示す球の半径。制御点と最後の 1 点は、間の段より少し大きくする */
const CONTROL_RADIUS = 0.075
const INNER_RADIUS = 0.055
const FINAL_RADIUS = 0.065

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、制御点の重心から見て外向きに逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.36

/** C(t) のラベルを、その点の真下へ逃がす距離 */
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
// 段ごとに色を変え、点とその点どうしを結ぶ線分は同じ色にする。
// 制御点と最後に残る 1 点の色は、段数を変えても動かさない
const POLYGON_COLOR = "#9aa3b0"
const TRACE_COLOR = "#ffc857"
const CONTROL_COLOR = "#b79cf5"
const FINAL_COLOR = "#f57fc4"

/** 間の段の色。1 段目から順に使うので、上限の段数より 1 つ少ない数だけ並べる */
const INNER_COLORS = ["#5ec8f2", "#7fd88f", "#6f9ff5", "#b0d95e", "#5ed8c4"]

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
const work = Array.from({ length: MAX_LEVEL + 1 }, () => new Vector3())

/** 軌跡用に、作図の途中を残さずベジェ曲線上の点だけを求める */
const bezierPoint = (controlPoints: Vector3[], t: number, target: Vector3) => {
  controlPoints.forEach((point, i) => work[i].copy(point))

  for (let last = controlPoints.length - 1; last > 0; last--) {
    for (let i = 0; i < last; i++) work[i].lerp(work[i + 1], t)
  }

  return target.copy(work[0])
}

export const createDeCasteljauScene = ({ scene, params }: SceneContext) => {
  /**
   * 段ごとの点を入れておく場所。上限の段数で用意し、
   * 段数が小さいときは各段の前のほうだけを使う
   */
  const levels = Array.from({ length: MAX_LEVEL + 1 }, (_, step) =>
    Array.from({ length: MAX_LEVEL + 1 - step }, () => new Vector3())
  )

  // 制御点を順に結んだ制御多角形。段数で頂点の数が変わるので、上限の数だけ用意して
  // 座標と描く範囲を書き換える。各段で作る線分と描き分けるため破線にする
  const polygonGeometry = new BufferGeometry()
  const polygonPositions = new Float32BufferAttribute(new Float32Array((MAX_LEVEL + 1) * 3), 3)
  polygonGeometry.setAttribute("position", polygonPositions)
  const polygonMaterial = new LineDashedMaterial({
    color: POLYGON_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const polygonLine = new Line(polygonGeometry, polygonMaterial)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  polygonLine.frustumCulled = false
  scene.add(polygonLine)

  // 段ごとの点。制御点・間の段・最後の 1 点で大きさと色が変わり、
  // どの段が最後になるかは段数で変わるので、ジオメトリとマテリアルは種類ごとに 1 つ作って共有する
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const innerGeometry = new SphereGeometry(INNER_RADIUS, 16, 12)
  const finalGeometry = new SphereGeometry(FINAL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const innerMaterials = INNER_COLORS.map((color) => new MeshBasicMaterial({ color }))
  const finalMaterial = new MeshBasicMaterial({ color: FINAL_COLOR })
  const markers = levels.map((points) =>
    points.map(() => {
      const mesh = new Mesh(innerGeometry, innerMaterials[0])
      scene.add(mesh)
      return mesh
    })
  )

  /**
   * 同じ段の点どうしを結ぶ線分。次の段の点はこの線分の上に乗る。
   * 0 段目は制御多角形として破線で描いてあるので、1 段目以降だけ作る。
   * 最後の 1 点だけが残る段には線分が無いので、色は間の段のぶんで足りる
   */
  const chords = levels.map((points, step) =>
    step === 0
      ? []
      : Array.from({ length: points.length - 1 }, () => {
          const chord = createSegment(INNER_COLORS[step - 1], LAYER_CHORD)
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

  // 制御点のラベル。制御点の位置は段数で変わるので、置き直しは段数が変わったときに行う
  const labels = CONTROL_LABELS.map((text) => {
    const label = createLabel(text, CONTROL_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)
    return label
  })

  // 最後に残る 1 点は曲線上の点なので、C(t) と名前を付ける
  const markerLabel = createLabel("C(t)", FINAL_COLOR, LABEL_HEIGHT)
  scene.add(markerLabel.sprite)

  const centroid = new Vector3()
  const normal = new Vector3()
  const sample = new Vector3()

  /** 制御多角形と制御点のラベルを組み直した段数。これが変わったときだけ組み直す */
  let drawnLevel = -1

  return {
    update: () => {
      const t = params.t
      // スライダーから来る段数を、制御点を用意してある範囲の整数へ丸める
      const level = Math.min(Math.max(Math.round(params.level), MIN_LEVEL), MAX_LEVEL)
      const controlPoints = CONTROL_POINT_SETS[level - MIN_LEVEL]

      // 0 段目は制御点そのもの
      controlPoints.forEach((point, i) => levels[0][i].copy(point))

      // 隣り合う 2 点を t : (1 − t) の比で内分して次の段の点を作る。
      // 段が進むごとに点が 1 つ減り、最後に残った 1 点が曲線上の点になる
      for (let step = 1; step <= level; step++) {
        for (let i = 0; i <= level - step; i++) {
          lerp(levels[step - 1][i], levels[step - 1][i + 1], t, levels[step][i])
        }
      }

      // 制御多角形と制御点のラベルは t では動かないので、段数が変わったときだけ組み直す
      if (level !== drawnLevel) {
        drawnLevel = level

        // 段数で変わる頂点の数に合わせて、描く範囲も書き換える
        // （余った頂点は描く範囲の外に置いたままにする）
        controlPoints.forEach((point, i) =>
          polygonPositions.setXYZ(i, point.x, point.y, LAYER_POLYGON)
        )
        polygonPositions.needsUpdate = true
        polygonGeometry.setDrawRange(0, level + 1)
        // 破線の刻みは頂点ごとの「線に沿った距離」で決まるので、座標を変えたら測り直す
        polygonLine.computeLineDistances()

        // 制御点のラベル。重心から見て外向きへ逃がし、破線や曲線に重ならないようにする
        centroid.set(0, 0, 0)
        controlPoints.forEach((point) => centroid.add(point))
        centroid.multiplyScalar(1 / controlPoints.length)

        labels.forEach((label, i) => {
          label.sprite.visible = i <= level
          if (!label.sprite.visible) return

          normal.subVectors(controlPoints[i], centroid).normalize()
          label.sprite.position
            .copy(controlPoints[i])
            .addScaledVector(normal, CONTROL_LABEL_OFFSET)
            .setZ(LAYER_LABEL)
        })
      }

      // 各段の点。段数によって最後の 1 点になる段が変わるので、大きさと色はここで割り当てる
      markers.forEach((meshes, step) => {
        meshes.forEach((mesh, i) => {
          mesh.visible = step <= level && i <= level - step
          if (!mesh.visible) return

          const point = levels[step][i]
          mesh.position.set(point.x, point.y, LAYER_POINT)
          mesh.geometry =
            step === 0 ? controlGeometry : step === level ? finalGeometry : innerGeometry
          mesh.material =
            step === 0 ? controlMaterial : step === level ? finalMaterial : innerMaterials[step - 1]
        })
      })

      // 同じ段の点どうしを結ぶ線分。最後の 1 点だけが残る段には線分が無い
      chords.forEach((segments, step) => {
        segments.forEach((chord, i) => {
          chord.object.visible = step < level && i < level - step
          if (chord.object.visible) chord.set(levels[step][i], levels[step][i + 1])
        })
      })

      // 最後の 1 点が通った跡。0 から今の t までを等分して求め、折れ線で結ぶ
      for (let i = 0; i <= TRACE_SEGMENTS; i++) {
        trace.set(i, bezierPoint(controlPoints, (t * i) / TRACE_SEGMENTS, sample))
      }
      trace.commit()

      // C(t) のラベルは、その点の真下に置く。作図の線は曲線より上側にあるので重ならない
      const current = levels[level][0]
      markerLabel.sprite.position.set(current.x, current.y - MARKER_LABEL_OFFSET, LAYER_LABEL)
    },
    dispose: () => {
      chords.flat().forEach((chord) => chord.dispose())
      const disposables = [
        polygonGeometry,
        polygonMaterial,
        trace.geometry,
        traceMaterial,
        controlGeometry,
        innerGeometry,
        finalGeometry,
        controlMaterial,
        finalMaterial,
        ...innerMaterials,
        markerLabel.texture,
        markerLabel.material,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
