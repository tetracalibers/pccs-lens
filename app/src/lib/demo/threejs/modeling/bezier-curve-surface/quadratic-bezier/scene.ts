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
  /** 3 つの制御点の位置。動かすと曲線の形が変わる */
  p0: { x: number; y: number }
  p1: { x: number; y: number }
  p2: { x: number; y: number }
  /** scene.ts が計算して書き戻す、混合の内訳を表す文字列 */
  mix: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: QuadraticBezierParams
}

/** 2 本の線分をいくつに分けるか。同じ番号の分点どうしを結んだ線分の束が、曲線を浮かび上がらせる */
const DIVISION_COUNT = 10

/** 束の線分の薄さ。1 本ずつではなく、重なりの縁を見るためのもの */
const FAMILY_OPACITY = 0.55

/** C(t) の軌跡を折れ線で近似する分割数 */
const TRACE_SEGMENTS = 64

/** 制御点・分けている点・今の点を示す球の半径 */
const CONTROL_RADIUS = 0.075
const KNOT_RADIUS = 0.055
const MARKER_RADIUS = 0.065

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、3 点の重心から見て外向きに逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.42

/** 分けている点のラベルを、それぞれの線分から内側へ逃がす距離 */
const KNOT_LABEL_OFFSET = 0.3

/** C(t) のラベルを、今の線分から曲線の外側へ逃がす距離 */
const MARKER_LABEL_OFFSET = 0.36

/** 内分の比率を示す矢印を線分から外側へ離す距離と、そのラベルをさらに離す距離 */
const ARROW_OFFSET = 0.34
const ARROW_LABEL_OFFSET = 0.66

/** 矢じりの長さと太さ */
const ARROW_HEAD_LENGTH = 0.16
const ARROW_HEAD_RADIUS = 0.055

/** 矢印とラベルを出す最小の長さ。短すぎると矢じりだけになって読み取れない */
const ARROW_MIN_LENGTH = 0.7

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
const LAYER_ARROW = 0.04
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、制御点・2 本の線分・束・軌跡・今の点が見分けられる色にする
const CONTROL_COLOR = "#b79cf5"
const EDGE_COLOR = "#9aa3b0"
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

/** 頂点が毎フレーム動く折れ線・線分の束。頂点を作り直さず、座標だけ書き換える */
const createPolyline = (count: number, z: number) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(count * 3), 3)
  geometry.setAttribute("position", positions)

  return {
    geometry,
    set: (index: number, point: Vector3) => positions.setXYZ(index, point.x, point.y, z),
    commit: () => {
      positions.needsUpdate = true
    }
  }
}

/**
 * 区間の広がりを示す両矢印。両端が毎フレーム動くので、頂点も矢じりの向きも都度書き換える。
 * 矢じりの円錐は既定で +y を向いているため、線分の向きへ回してから先端を端点に合わせる
 */
const createMeasureArrow = (color: string) => {
  const group = new Group()
  const shaft = createSegment(color, LAYER_ARROW)
  group.add(shaft.object)

  const headGeometry = new ConeGeometry(ARROW_HEAD_RADIUS, ARROW_HEAD_LENGTH, 12)
  const headMaterial = new MeshBasicMaterial({ color })
  const heads = [new Mesh(headGeometry, headMaterial), new Mesh(headGeometry, headMaterial)]
  group.add(heads[0], heads[1])

  const direction = new Vector3()

  return {
    object: group,
    set: (from: Vector3, to: Vector3) => {
      shaft.set(from, to)

      direction.subVectors(to, from).normalize()
      const angle = Math.atan2(direction.y, direction.x)

      heads[0].rotation.z = angle + Math.PI / 2
      heads[0].position
        .copy(from)
        .addScaledVector(direction, ARROW_HEAD_LENGTH / 2)
        .setZ(LAYER_ARROW)
      heads[1].rotation.z = angle - Math.PI / 2
      heads[1].position
        .copy(to)
        .addScaledVector(direction, -ARROW_HEAD_LENGTH / 2)
        .setZ(LAYER_ARROW)
    },
    dispose: () => {
      shaft.dispose()
      headGeometry.dispose()
      headMaterial.dispose()
    }
  }
}

/** 線形補間。2 点の座標値を 1 − t : t の割合で混ぜる */
const lerp = (from: Vector3, to: Vector3, t: number, target: Vector3) =>
  target
    .copy(from)
    .multiplyScalar(1 - t)
    .addScaledVector(to, t)

/**
 * 線分 from → to に垂直な単位ベクトルのうち、reference から遠い側（外向き）のもの。
 * 束が張られるのは線分の内側なので、矢印はこの向きへ逃がす
 */
const outwardNormal = (from: Vector3, to: Vector3, reference: Vector3, target: Vector3) => {
  target.set(to.y - from.y, from.x - to.x, 0).normalize()

  // 中点から reference へ向かうベクトルと同じ側を向いていたら、反対側へ返す
  const towardX = reference.x - (from.x + to.x) / 2
  const towardY = reference.y - (from.y + to.y) / 2

  return target.x * towardX + target.y * towardY > 0 ? target.negate() : target
}

export const createQuadraticBezierScene = ({ scene, params }: SceneContext) => {
  // Tweakpane で動かす 3 つの制御点。毎フレーム params の値を写して使う
  const p0 = new Vector3()
  const p1 = new Vector3()
  const p2 = new Vector3()

  // 制御点を順に結んだ 2 本の線分
  const edge = createPolyline(3, LAYER_EDGE)
  const edgeMaterial = new LineBasicMaterial({ color: EDGE_COLOR })
  const edgeLine = new Line(edge.geometry, edgeMaterial)
  edgeLine.frustumCulled = false
  scene.add(edgeLine)

  // 2 本の線分を同じ数に分け、同じ番号の分点どうしを結ぶ。この束の縁に曲線が浮かび上がる
  const family = createPolyline((DIVISION_COUNT + 1) * 2, 0)
  const familyMaterial = new LineBasicMaterial({
    color: CHORD_COLOR,
    transparent: true,
    opacity: FAMILY_OPACITY
  })
  const familyLines = new LineSegments(family.geometry, familyMaterial)
  familyLines.frustumCulled = false
  scene.add(familyLines)

  // 束のうち、今の t にあたる 1 本
  const chord = createSegment(CHORD_COLOR, LAYER_CHORD)
  scene.add(chord.object)

  // C が 0 から今の t までに通った跡。折れ線で近似する
  const trace = createPolyline(TRACE_SEGMENTS + 1, LAYER_TRACE)
  const traceMaterial = new LineBasicMaterial({ color: TRACE_COLOR })
  const traceLine = new Line(trace.geometry, traceMaterial)
  traceLine.frustumCulled = false
  scene.add(traceLine)

  // 2 本の線分がどちらも t : 1 − t に分けられていることを示す矢印
  const arrows = [
    createMeasureArrow(EDGE_COLOR),
    createMeasureArrow(EDGE_COLOR),
    createMeasureArrow(EDGE_COLOR),
    createMeasureArrow(EDGE_COLOR)
  ]
  arrows.forEach((arrow) => scene.add(arrow.object))

  // 自分で置いた 3 つの制御点
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const controlPoints = [p0, p1, p2]
  const controls = controlPoints.map(() => {
    const mesh = new Mesh(controlGeometry, controlMaterial)
    scene.add(mesh)
    return mesh
  })

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
  // 矢印に添える比率。P0 側から Q0 までが t、Q0 から P1 までが 1 − t。P1P2 も同じ並び
  const arrowLabels = [
    createLabel("t", EDGE_COLOR, LABEL_HEIGHT),
    createLabel("1 − t", EDGE_COLOR, LABEL_HEIGHT),
    createLabel("t", EDGE_COLOR, LABEL_HEIGHT),
    createLabel("1 − t", EDGE_COLOR, LABEL_HEIGHT)
  ]
  const allLabels = [...Object.values(labels), ...arrowLabels]
  allLabels.forEach((label) => scene.add(label.sprite))
  const controlLabels = [labels.p0, labels.p1, labels.p2]

  const first = new Vector3()
  const second = new Vector3()
  const current = new Vector3()
  const sample = new Vector3()
  // C(t) を求める途中の 2 点。毎フレーム何度も呼ばれるので、その都度は作らない
  const qa = new Vector3()
  const qb = new Vector3()
  const centroid = new Vector3()
  const normal = new Vector3()
  const outward = new Vector3()
  const toApex = new Vector3()
  const from = new Vector3()
  const to = new Vector3()

  /** 制御点 3 つと t から C(t) を求める。2 段の線形補間を重ねるだけでよい */
  const quadraticPoint = (t: number, target: Vector3) =>
    lerp(lerp(p0, p1, t, qa), lerp(p1, p2, t, qb), t, target)

  /** 矢印 1 本とそのラベルを、線分の外側へずらして置く */
  const setArrow = (index: number, start: Vector3, end: Vector3) => {
    from.copy(start).addScaledVector(outward, ARROW_OFFSET)
    to.copy(end).addScaledVector(outward, ARROW_OFFSET)
    arrows[index].set(from, to)
    arrowLabels[index].sprite.position
      .lerpVectors(start, end, 0.5)
      .addScaledVector(outward, ARROW_LABEL_OFFSET)
      .setZ(LAYER_LABEL)

    const visible = start.distanceTo(end) > ARROW_MIN_LENGTH
    arrows[index].object.visible = visible
    arrowLabels[index].sprite.visible = visible
  }

  return {
    update: () => {
      const t = params.t
      p0.set(params.p0.x, params.p0.y, 0)
      p1.set(params.p1.x, params.p1.y, 0)
      p2.set(params.p2.x, params.p2.y, 0)

      // 2 本の線分を同じ割合で分ける 2 点と、そのあいだをさらに同じ割合で分けた点
      lerp(p0, p1, t, first)
      lerp(p1, p2, t, second)
      lerp(first, second, t, current)

      edge.set(0, p0)
      edge.set(1, p1)
      edge.set(2, p2)
      edge.commit()

      // 2 本の線分を同じ数に分け、同じ番号の分点どうしを結ぶ
      for (let i = 0; i <= DIVISION_COUNT; i++) {
        const ratio = i / DIVISION_COUNT
        family.set(i * 2, lerp(p0, p1, ratio, sample))
        family.set(i * 2 + 1, lerp(p1, p2, ratio, sample))
      }
      family.commit()

      chord.set(first, second)
      controls.forEach((mesh, i) => {
        const point = controlPoints[i]
        mesh.position.set(point.x, point.y, LAYER_POINT)
      })
      knot0.position.set(first.x, first.y, LAYER_POINT)
      knot1.position.set(second.x, second.y, LAYER_POINT)
      marker.position.set(current.x, current.y, LAYER_POINT)

      // C が通った跡。0 から今の t までを等分して求め、折れ線で結ぶ
      for (let i = 0; i <= TRACE_SEGMENTS; i++) {
        trace.set(i, quadraticPoint((t * i) / TRACE_SEGMENTS, sample))
      }
      trace.commit()

      // 制御点のラベルは、3 点の重心から見て外向きへ逃がす
      centroid
        .copy(p0)
        .add(p1)
        .add(p2)
        .multiplyScalar(1 / 3)
      controlLabels.forEach((label, i) => {
        const point = controlPoints[i]
        normal.subVectors(point, centroid).normalize()
        label.sprite.position
          .copy(point)
          .addScaledVector(normal, CONTROL_LABEL_OFFSET)
          .setZ(LAYER_LABEL)
      })

      // 内分の比率を示す矢印。線分ごとに、束の張られていない外側へ逃がす
      outwardNormal(p0, p1, p2, outward)
      labels.q0.sprite.position
        .copy(first)
        .addScaledVector(outward, -KNOT_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
      setArrow(0, p0, first)
      setArrow(1, first, p1)

      outwardNormal(p1, p2, p0, outward)
      labels.q1.sprite.position
        .copy(second)
        .addScaledVector(outward, -KNOT_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
      setArrow(2, p1, second)
      setArrow(3, second, p2)

      // C(t) のラベルは、今の線分に垂直な向きのうち P1 から遠い側へ逃がす。
      // 曲線は線分に接して P1 の反対側にあるので、この側なら束の線に重ならない
      normal.set(second.y - first.y, first.x - second.x, 0).normalize()
      if (normal.dot(toApex.subVectors(p1, current)) > 0) normal.negate()
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
      arrows.forEach((arrow) => arrow.dispose())
      const disposables = [
        edge.geometry,
        edgeMaterial,
        family.geometry,
        familyMaterial,
        trace.geometry,
        traceMaterial,
        controlGeometry,
        controlMaterial,
        knotGeometry,
        knotMaterial,
        markerGeometry,
        markerMaterial,
        ...allLabels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
