import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type CrossingParityParams = {
  /** 走査線の位置。走査線は行の中心（行 + 0.5）を通る */
  row: number
  /** 左端からたどった位置（画素を単位とした x） */
  traveled: number
  /** いまいる位置が領域の外か内か。scene.ts が組み立てて書き戻すので、初期値は使われない */
  side: string
  /** 左端からここまでに越えた交点の個数。scene.ts が組み立てて書き戻すので、初期値は使われない */
  passed: string
  /** 外と内をたどってきた順。scene.ts が組み立てて書き戻すので、初期値は使われない */
  sequence: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: CrossingParityParams
}

/** 画像の広さ。スキャンライン塗りつぶしのデモと同じ大きさにとる */
const COLUMNS = 24
const ROWS = 16
const PITCH = 0.15
const PLOT_WIDTH = COLUMNS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/**
 * 塗りつぶす閉領域。本文の例に合わせて、山が 2 つ並んだ形をとる。
 * 走査線は行の中心（行 + 0.5）を通るので、頂点の y を整数にとっておけば、
 * 走査線が頂点の高さにちょうど重なることがない
 */
const POLYGON: [number, number][] = [
  [2.5, 13],
  [7.5, 2],
  [11, 8],
  [14, 8],
  [17.5, 3],
  [21.5, 13]
]

/**
 * 輪郭・走査線・たどった区間の太さ。線材（LineBasicMaterial）の線幅は WebGL では
 * 常に 1 ドットに固定されるため、これらは細長い長方形として描く
 */
const OUTLINE_THICKNESS = 0.03
const SCANLINE_THICKNESS = 0.02
const TRAIL_THICKNESS = 0.055

/** 走査線を画像の外へ伸ばす分。画像を横切る 1 本の線であることが分かるようにする */
const SCANLINE_OVERSHOOT = 0.14

/** 交点を示す点と、いまいる位置を示す点の半径 */
const DOT_RADIUS = 0.046
const MARKER_RADIUS = 0.075

/** 交点に振る番号の文字の高さと、走査線からの持ち上げ */
const CROSSING_LABEL_HEIGHT = 0.17
const CROSSING_LABEL_LIFT = 0.17

/** 凡例を並べる位置（画像の右）と、色見本の長さ・文字までの間隔・項目どうしの間隔 */
const LEGEND_X = 2.0
const LEGEND_SWATCH = 0.26
const LEGEND_TEXT_GAP = 0.12
const LEGEND_GAP = 0.34

/** 凡例の文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_FRAME = 0.01
const LAYER_SCANLINE = 0.02
const LAYER_TRAIL = 0.03
const LAYER_OUTLINE = 0.05
const LAYER_DOT = 0.07
const LAYER_MARKER = 0.08
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、輪郭・走査線・交点・たどった区間を互いに見分けられる色にする。
// 内側をたどった区間は、このあと実際に塗られる区間なので、塗った画素と同じ色にする
const FRAME_COLOR = "#7d8794"
const OUTLINE_COLOR = "#6fd8ff"
const SCANLINE_COLOR = "#5e6672"
const OUTSIDE_COLOR = "#c8ccd4"
const INSIDE_COLOR = "#ffc857"
const CROSSING_COLOR = "#f5f8fc"
const MARKER_COLOR = "#f2766a"
const LABEL_COLOR = "#c9d2de"

/** 図全体を canvas の中央に寄せる位置。右の凡例の分だけ左へ寄せる */
const GRAPH_OFFSET = new Vector3(-1.15, 0, 0)

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

/**
 * 画素を単位とした位置を、ワールド座標へ移す。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる。
 * 整数が画素どうしの境目、+0.5 が画素の中心に当たる
 */
const worldXOf = (x: number) => -HALF_WIDTH + x * PITCH
const worldYOf = (y: number) => HALF_HEIGHT - y * PITCH

/**
 * 走査線の高さ y で、ポリゴンの辺と交わる点の x を左から順に並べる。
 * 水平な辺は走査線と交点を作らないので飛ばし、辺の上端を含み下端を含まない
 * 範囲で数えることで、頂点の高さでも交点を二重に数えないようにする
 */
const crossingsAt = (y: number) => {
  const xs: number[] = []

  for (let i = 0; i < POLYGON.length; i++) {
    const [x1, y1] = POLYGON[i]
    const [x2, y2] = POLYGON[(i + 1) % POLYGON.length]
    if (y1 === y2) continue
    if (y < Math.min(y1, y2) || y >= Math.max(y1, y2)) continue

    xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1))
  }

  return xs.sort((a, b) => a - b)
}

/** 細長い長方形を、2 点を結ぶ線分に重ねる */
const placeBar = (
  bar: Mesh,
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  thickness: number,
  z: number
) => {
  const ax = worldXOf(x1)
  const ay = worldYOf(y1)
  const bx = worldXOf(x2)
  const by = worldYOf(y2)

  bar.scale.set(Math.hypot(bx - ax, by - ay), thickness, 1)
  bar.rotation.z = Math.atan2(by - ay, bx - ax)
  bar.position.set((ax + bx) / 2, (ay + by) / 2, z)
}

export const createCrossingParityScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  const barGeometry = new PlaneGeometry(1, 1)
  const dotGeometry = new CircleGeometry(DOT_RADIUS, 16)
  const markerGeometry = new CircleGeometry(MARKER_RADIUS, 24)

  // 画像の外周。走査線がどこから入ってどこへ抜けるかの目印になる
  const frameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(-HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(-HALF_WIDTH, -HALF_HEIGHT, LAYER_FRAME),
    new Vector3(-HALF_WIDTH, HALF_HEIGHT, LAYER_FRAME)
  ])
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  graph.add(new LineSegments(frameGeometry, frameMaterial))

  // 塗りつぶす閉領域の輪郭。切れ目なく閉じた線
  const outlineMaterial = new MeshBasicMaterial({ color: OUTLINE_COLOR })
  POLYGON.forEach((vertex, index) => {
    const edge = new Mesh(barGeometry, outlineMaterial)
    placeBar(edge, vertex, POLYGON[(index + 1) % POLYGON.length], OUTLINE_THICKNESS, LAYER_OUTLINE)
    graph.add(edge)
  })

  // 走査線そのもの。まだたどっていない部分は控えめな色で置いておく
  const scanlineMaterial = new MeshBasicMaterial({ color: SCANLINE_COLOR })
  const scanline = new Mesh(barGeometry, scanlineMaterial)
  scanline.scale.set(PLOT_WIDTH + SCANLINE_OVERSHOOT * 2, SCANLINE_THICKNESS, 1)
  graph.add(scanline)

  // 左端からいまいる位置までを、交点で区切って外と内に塗り分けた区間。
  // 交点は辺の数だけしかできないので、区間はその数 + 1 に収まる
  const trailCapacity = POLYGON.length + 1
  const outsideMaterial = new MeshBasicMaterial({ color: OUTSIDE_COLOR })
  const outsideTrail = new InstancedMesh(barGeometry, outsideMaterial, trailCapacity)
  outsideTrail.frustumCulled = false
  graph.add(outsideTrail)

  const insideMaterial = new MeshBasicMaterial({ color: INSIDE_COLOR })
  const insideTrail = new InstancedMesh(barGeometry, insideMaterial, trailCapacity)
  insideTrail.frustumCulled = false
  graph.add(insideTrail)

  // 走査線と輪郭の交点。ここを越えるたびに外と内が入れ替わる
  const crossingMaterial = new MeshBasicMaterial({ color: CROSSING_COLOR })
  const crossingDots = new InstancedMesh(dotGeometry, crossingMaterial, POLYGON.length)
  crossingDots.frustumCulled = false
  graph.add(crossingDots)

  // 交点に左から順に振る番号。本文の「奇数番目の交点から次の偶数番目の交点まで」に対応する
  const crossingLabels = Array.from({ length: POLYGON.length }, (_, index) =>
    createLabel(`${index + 1}`, CROSSING_COLOR, CROSSING_LABEL_HEIGHT)
  )
  crossingLabels.forEach(({ sprite }) => {
    sprite.visible = false
    graph.add(sprite)
  })

  // 走査線を左からたどっている、いまの位置
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  graph.add(marker)

  // 凡例。色見本は、輪郭とたどった区間は線、交点といまいる位置は点で示す
  const legendItems = [
    {
      text: "ポリゴンの輪郭",
      geometry: barGeometry,
      material: outlineMaterial,
      scale: [LEGEND_SWATCH, OUTLINE_THICKNESS]
    },
    { text: "交点", geometry: dotGeometry, material: crossingMaterial, scale: [1, 1] },
    {
      text: "外側をたどった区間",
      geometry: barGeometry,
      material: outsideMaterial,
      scale: [LEGEND_SWATCH, TRAIL_THICKNESS]
    },
    {
      text: "内側をたどった区間",
      geometry: barGeometry,
      material: insideMaterial,
      scale: [LEGEND_SWATCH, TRAIL_THICKNESS]
    },
    { text: "いまいる位置", geometry: markerGeometry, material: markerMaterial, scale: [1, 1] }
  ]
  const legendTop = ((legendItems.length - 1) * LEGEND_GAP) / 2
  const legendLabels = legendItems.map(({ text, geometry, material, scale }, index) => {
    const y = legendTop - index * LEGEND_GAP

    const swatch = new Mesh(geometry, material)
    swatch.scale.set(scale[0], scale[1], 1)
    swatch.position.set(LEGEND_X + LEGEND_SWATCH / 2, y, LAYER_LABEL)
    graph.add(swatch)

    // 文字の左端を色見本のうしろに揃える。中央寄せの板なので、測った幅の半分だけ右へずらす
    const label = createLabel(text, LABEL_COLOR, LABEL_HEIGHT)
    label.sprite.position.set(
      LEGEND_X + LEGEND_SWATCH + LEGEND_TEXT_GAP + label.sprite.scale.x / 2,
      y,
      LAYER_LABEL
    )
    graph.add(label.sprite)

    return label
  })

  const matrix = new Matrix4()

  /** 水平な区間 [left, right] を、走査線の高さ y に細長い長方形として置く */
  const setSpan = (trail: InstancedMesh, index: number, left: number, right: number, y: number) => {
    const ax = worldXOf(left)
    const bx = worldXOf(right)
    matrix.makeScale(Math.max(bx - ax, 0), TRAIL_THICKNESS, 1)
    matrix.setPosition((ax + bx) / 2, y, LAYER_TRAIL)
    trail.setMatrixAt(index, matrix)
  }

  return {
    update: () => {
      const row = Math.round(params.row)
      const scanY = worldYOf(row + 0.5)
      const traveled = params.traveled
      const crossings = crossingsAt(row + 0.5)

      scanline.position.set(0, scanY, LAYER_SCANLINE)
      marker.position.set(worldXOf(traveled), scanY, LAYER_MARKER)

      // 交点とその番号。走査線が領域と交わらない高さでは 1 つも出ない
      crossings.forEach((x, index) => {
        matrix.identity()
        matrix.setPosition(worldXOf(x), scanY, LAYER_DOT)
        crossingDots.setMatrixAt(index, matrix)
      })
      crossingDots.count = crossings.length
      crossingDots.instanceMatrix.needsUpdate = true

      crossingLabels.forEach(({ sprite }, index) => {
        sprite.visible = index < crossings.length
        if (sprite.visible) {
          sprite.position.set(worldXOf(crossings[index]), scanY + CROSSING_LABEL_LIFT, LAYER_LABEL)
        }
      })

      // 左端からいまいる位置までを、越えてきた交点で区切る。
      // はじめは領域の外側にいて、交点を越えるたびに外と内が入れ替わる
      const passed = crossings.filter((x) => x < traveled)
      const bounds = [0, ...passed, traveled]
      let outsideCount = 0
      let insideCount = 0

      for (let i = 0; i + 1 < bounds.length; i++) {
        // 区切りを越えた回数が偶数なら外側、奇数なら内側
        if (i % 2 === 0) {
          setSpan(outsideTrail, outsideCount++, bounds[i], bounds[i + 1], scanY)
        } else {
          setSpan(insideTrail, insideCount++, bounds[i], bounds[i + 1], scanY)
        }
      }
      outsideTrail.count = outsideCount
      outsideTrail.instanceMatrix.needsUpdate = true
      insideTrail.count = insideCount
      insideTrail.instanceMatrix.needsUpdate = true

      // 外と内の行き来を、数と言葉でも追えるようにする
      params.side = passed.length % 2 === 0 ? "領域の外側" : "領域の内側"
      params.passed = `${passed.length}個`
      params.sequence = ["外", ...passed.map((_, index) => (index % 2 === 0 ? "内" : "外"))].join(
        " → "
      )
    },
    dispose: () => {
      const disposables = [
        barGeometry,
        dotGeometry,
        markerGeometry,
        frameGeometry,
        frameMaterial,
        outlineMaterial,
        scanlineMaterial,
        outsideMaterial,
        insideMaterial,
        crossingMaterial,
        markerMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      outsideTrail.dispose()
      insideTrail.dispose()
      crossingDots.dispose()

      const labels = [...crossingLabels, ...legendLabels]
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
