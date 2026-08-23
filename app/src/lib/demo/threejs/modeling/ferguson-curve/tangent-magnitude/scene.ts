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
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type TangentMagnitudeParams = {
  /** 両端の接ベクトルの大きさ。向きは固定したまま、この値だけを変える */
  magnitude: number
  /** scene.ts が計算して書き戻す、対応するベジェ曲線の制御点 */
  controls: string
  /** scene.ts が計算して書き戻す、端点から制御点までの距離 */
  offset: string
  /** scene.ts が計算して書き戻す、曲線が自分自身と交わっているか */
  crossing: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: TangentMagnitudeParams
}

/** 両端の点。大きさだけを比べる図なので、横に並べて動かさない */
const ENDPOINTS: [number, number][] = [
  [-1, -0.4],
  [1, -0.4]
]

/**
 * 両端の接ベクトルの向き。長さは params.magnitude で与えるので、ここでは向きだけを決める。
 * 縦 1 に対して横 √3（弦から 30 度）で、始点では右上へ出ていき、終点では右下へ抜けていく。
 * この角度だと、大きさが弦の 3.5 倍（およそ 6.9）を超えたところで曲線が自分自身と交わる
 */
const DIRECTIONS: [number, number][] = [
  [1.732, 1],
  [1.732, -1]
]

/** 両端の点と、対応するベジェ曲線の制御点に付ける名前 */
const ENDPOINT_LABELS = ["P₀", "P₁"]
const CONTROL_LABELS = ["Q₁", "Q₂"]
const TANGENT_LABELS = ["V₀", "V₁"]

/** 両端の点の名前を点から逃がす向きと距離。点は動かないので位置を直に決める */
const ENDPOINT_LABEL_OFFSETS: [number, number][] = [
  [-0.3, -0.22],
  [0, -0.32]
]

/** 制御点と接ベクトルの名前を、接ベクトルに垂直な向き（上側）へ逃がす距離 */
const CONTROL_LABEL_OFFSET = 0.3
const TANGENT_LABEL_OFFSET = 0.34

/** 曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 96

/** 両端の点を示す球と、制御点を示す球の半径 */
const ENDPOINT_RADIUS = 0.1
const CONTROL_RADIUS = 0.08

/** 接ベクトルの矢印の頭（円錐）の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.2

/** 制御多角形の破線の刻み */
const DASH_SIZE = 0.12
const GAP_SIZE = 0.08

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 線分が平行かどうかを判定するときの閾値 */
const EPSILON = 1e-12

/** 円錐は上向きに作られるので、矢印の向きへ回すときの基準にする */
const CONE_UP = new Vector3(0, 1, 0)

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_POLYGON = 0.01
const LAYER_TANGENT = 0.02
const LAYER_CURVE = 0.03
const LAYER_POINT = 0.05
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、曲線・両端の点・制御点・接ベクトルが見分けられる色にする。
// 両端の点は動かない条件なので無彩色に寄せ、動く制御点とは色で分ける
const CURVE_COLOR = "#ffc857"
const ENDPOINT_COLOR = "#e6e8ef"
const CONTROL_COLOR = "#b79cf5"
const TANGENT_COLOR = "#5ec8f2"
const POLYGON_COLOR = "#9aa3b0"

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

/** 始点から終点へ向かう矢印。長さが変わるので、線と円錐の位置を毎回書き換える */
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
      // 大きさを絞りきると矢印の頭が入らないので、そのときは矢印を出さない
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

/** 2 本の線分が端点を除いて交わっているか */
const segmentsCross = (a1: Vector3, a2: Vector3, b1: Vector3, b2: Vector3) => {
  const ax = a2.x - a1.x
  const ay = a2.y - a1.y
  const bx = b2.x - b1.x
  const by = b2.y - b1.y
  const denominator = ax * by - ay * bx
  if (Math.abs(denominator) < EPSILON) return false

  const dx = b1.x - a1.x
  const dy = b1.y - a1.y
  const s = (dx * by - dy * bx) / denominator
  const t = (dx * ay - dy * ax) / denominator

  return s > 0 && s < 1 && t > 0 && t < 1
}

/**
 * 曲線を近似した頂点列が自分自身と交わっているか。
 * 隣り合う線分は端点を共有しているだけなので、1 つ飛ばして先の線分と突き合わせる
 */
const hasSelfCrossing = (points: Vector3[]) => {
  for (let i = 0; i + 1 < points.length; i++) {
    for (let j = i + 2; j + 1 < points.length; j++) {
      if (segmentsCross(points[i], points[i + 1], points[j], points[j + 1])) return true
    }
  }

  return false
}

/** パネルに出す座標の書き方。小数第 2 位まで揃える */
const format = (vector: Vector3) => `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`

export const createTangentMagnitudeScene = ({ scene, params }: SceneContext) => {
  const endpoints = ENDPOINTS.map(([x, y]) => new Vector3(x, y, 0))

  /** 接ベクトルの向き（長さ 1）。大きさをかけて接ベクトルにする */
  const directions = DIRECTIONS.map(([x, y]) => new Vector3(x, y, 0).normalize())

  /** 接ベクトルに垂直な向き（上側）。制御点と接ベクトルの名前を逃がす先に使う */
  const normals = directions.map((direction) => new Vector3(-direction.y, direction.x, 0))

  const tangents = directions.map(() => new Vector3())
  const tips = directions.map(() => new Vector3())

  /**
   * 対応するベジェ曲線の制御点。Q₁ = P₀ + V₀/3、Q₂ = P₁ − V₁/3 なので、
   * 端点から接ベクトルの 3 分の 1 だけ進んだ（戻った）位置になる
   */
  const controls = directions.map(() => new Vector3())

  /** 曲線を決める 4 つの条件。接ベクトルは大きさを変えるたびに書き換わる */
  const conditions = [endpoints[0], endpoints[1], tangents[0], tangents[1]]

  // 制御多角形。P₀ → Q₁ → Q₂ → P₁ の順に結び、曲線と描き分けるため破線にする
  const polygon = createPolyline(4, LAYER_POLYGON)
  const polygonMaterial = new LineDashedMaterial({
    color: POLYGON_COLOR,
    dashSize: DASH_SIZE,
    gapSize: GAP_SIZE
  })
  const polygonLine = new Line(polygon.geometry, polygonMaterial)
  polygonLine.frustumCulled = false
  scene.add(polygonLine)

  // 4 つの条件から求めた曲線
  const curve = createPolyline(CURVE_SEGMENTS + 1, LAYER_CURVE)
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  const curveLine = new Line(curve.geometry, curveMaterial)
  curveLine.frustumCulled = false
  scene.add(curveLine)

  // 両端の接ベクトル。向きは固定で、大きさだけが変わる
  const arrows = directions.map(() => {
    const arrow = createArrow(TANGENT_COLOR)
    scene.add(arrow.object)

    return arrow
  })

  // 両端の点。大きさを比べる図なので動かさない
  const endpointGeometry = new SphereGeometry(ENDPOINT_RADIUS, 16, 12)
  const endpointMaterial = new MeshBasicMaterial({ color: ENDPOINT_COLOR })
  endpoints.forEach((endpoint) => {
    const mesh = new Mesh(endpointGeometry, endpointMaterial)
    mesh.position.set(endpoint.x, endpoint.y, LAYER_POINT)
    scene.add(mesh)
  })

  // 対応するベジェ曲線の制御点。大きさに応じて端点から離れていく
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const controlMeshes = controls.map(() => {
    const mesh = new Mesh(controlGeometry, controlMaterial)
    scene.add(mesh)

    return mesh
  })

  const endpointLabels = ENDPOINT_LABELS.map((text, i) => {
    const label = createLabel(text, ENDPOINT_COLOR, LABEL_HEIGHT)
    const [dx, dy] = ENDPOINT_LABEL_OFFSETS[i]
    label.sprite.position.set(endpoints[i].x + dx, endpoints[i].y + dy, LAYER_LABEL)
    scene.add(label.sprite)

    return label
  })
  const controlLabels = CONTROL_LABELS.map((text) => {
    const label = createLabel(text, CONTROL_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)

    return label
  })
  const tangentLabels = TANGENT_LABELS.map((text) => {
    const label = createLabel(text, TANGENT_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)

    return label
  })

  /** 自己交差の判定に使う、曲線の頂点列 */
  const samples = Array.from({ length: CURVE_SEGMENTS + 1 }, () => new Vector3())

  return {
    update: () => {
      const magnitude = params.magnitude

      directions.forEach((direction, i) => {
        tangents[i].copy(direction).multiplyScalar(magnitude)
        tips[i].addVectors(endpoints[i], tangents[i])
        arrows[i].setEnds(endpoints[i], tips[i])

        // Q₁ は P₀ から V₀ の 3 分の 1 だけ進んだ位置、Q₂ は P₁ から V₁ の 3 分の 1 だけ戻った位置。
        // 始点側は足し、終点側は引くので、向きを 1 本目だけ正にとる
        const sign = i === 0 ? 1 : -1
        controls[i].copy(endpoints[i]).addScaledVector(tangents[i], sign / 3)
        controlMeshes[i].position.set(controls[i].x, controls[i].y, LAYER_POINT)

        controlLabels[i].sprite.position
          .copy(controls[i])
          .addScaledVector(normals[i], CONTROL_LABEL_OFFSET)
          .setZ(LAYER_LABEL)
        tangentLabels[i].sprite.position
          .copy(tips[i])
          .addScaledVector(normals[i], TANGENT_LABEL_OFFSET)
          .setZ(LAYER_LABEL)
      })

      polygon.set(0, endpoints[0])
      polygon.set(1, controls[0])
      polygon.set(2, controls[1])
      polygon.set(3, endpoints[1])
      polygon.commit()
      // 破線の刻みは頂点ごとの「線に沿った距離」で決まるため、頂点を動かすたびに測り直す
      polygonLine.computeLineDistances()

      for (let step = 0; step <= CURVE_SEGMENTS; step++) {
        curve.set(step, fergusonPoint(conditions, step / CURVE_SEGMENTS, samples[step]))
      }
      curve.commit()

      // Tweakpane 側に読み取り専用で出す、制御点の位置・端点からそこまでの距離・自己交差の有無
      params.controls = `Q₁ = ${format(controls[0])}\nQ₂ = ${format(controls[1])}`
      params.offset = (magnitude / 3).toFixed(2)
      params.crossing = hasSelfCrossing(samples) ? "あり" : "なし"
    },
    dispose: () => {
      arrows.forEach((arrow) => arrow.dispose())
      const disposables = [
        polygon.geometry,
        polygonMaterial,
        curve.geometry,
        curveMaterial,
        endpointGeometry,
        endpointMaterial,
        controlGeometry,
        controlMaterial,
        ...[...endpointLabels, ...controlLabels, ...tangentLabels].flatMap((label) => [
          label.texture,
          label.material
        ])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
