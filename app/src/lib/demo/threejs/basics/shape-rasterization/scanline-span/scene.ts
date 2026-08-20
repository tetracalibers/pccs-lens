import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
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
export type ScanlineSpanParams = {
  /** 三角形の上の頂点の x 座標。辺の傾きが変わり、交点の動く量も変わる */
  apexX: number
  /** いま見ているスキャンラインの行 */
  scanline: number
  /** 左の交点。scene.ts が組み立てて書き戻すので、初期値は使われない */
  left: string
  /** 右の交点。scene.ts が組み立てて書き戻すので、初期値は使われない */
  right: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ScanlineSpanParams
}

/** 画素の格子。三角形が収まる広さをとる */
const COLUMNS = 15
const ROWS = 10
const PITCH = 0.24
const PLOT_WIDTH = COLUMNS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/**
 * ラスタ化するポリゴン（三角形）。上の頂点の x だけを操作でき、
 * 底辺は動かさない。画素の格子とは無関係に、小数の座標で置く
 */
const APEX_Y = 0.6
const BASE_Y = 8.4
const BASE_LEFT_X = 2.2
const BASE_RIGHT_X = 12.6

/** ポリゴンの輪郭・スキャンライン・スパンの太さ */
const EDGE_THICKNESS = 0.034
const SCANLINE_THICKNESS = 0.022
const SPAN_THICKNESS = 0.05

/** 交点を示す点の半径 */
const DOT_RADIUS = 0.042

/** 座標軸を格子の外へ逃がす距離と、軸を格子より長く伸ばす分 */
const AXIS_MARGIN = 0.18
const AXIS_OVERSHOOT = 0.26

/** 座標軸の矢じりの大きさ */
const ARROW_HEIGHT = 0.16
const ARROW_RADIUS = 0.06

/** 軸の名前・交点とスパンの注記の文字の高さ（ワールド座標での大きさ） */
const AXIS_LABEL_HEIGHT = 0.24
const NOTE_LABEL_HEIGHT = 0.2

/** 注記を、注記が指す線分や点から逃がす距離 */
const NOTE_MARGIN = 0.18

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_PIXEL = 0.01
const LAYER_CURRENT_PIXEL = 0.015
const LAYER_GRID = 0.02
const LAYER_FRAME = 0.03
const LAYER_AXIS = 0.04
const LAYER_SCANLINE = 0.05
const LAYER_EDGE = 0.06
const LAYER_SPAN = 0.07
const LAYER_DOT = 0.08
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、輪郭・スキャンライン・スパン・塗った画素を見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const EDGE_COLOR = "#6fd8ff"
const PIXEL_COLOR = "#ffc857"
const PAST_PIXEL_OPACITY = 0.45
const SPAN_COLOR = "#f2766a"
const SCANLINE_COLOR = "#aeb6c2"
const AXIS_COLOR = "#9aa3b0"

/** 図全体を canvas の中央に寄せる位置。右のスパンの注記の分だけ左へ寄せる */
const GRAPH_OFFSET = new Vector3(-0.14, 0, 0)

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
 * x（画素の列）と y（画素の行）のワールド座標。小数を渡してもよい。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる
 */
const worldXOf = (x: number) => -HALF_WIDTH + (x + 0.5) * PITCH
const worldYOf = (y: number) => HALF_HEIGHT - (y + 0.5) * PITCH

/** 2 点を結ぶ線分を、細長い長方形として置く */
const placeBar = (
  bar: Mesh,
  from: { x: number; y: number },
  to: { x: number; y: number },
  thickness: number,
  z: number
) => {
  const fromX = worldXOf(from.x)
  const fromY = worldYOf(from.y)
  const toX = worldXOf(to.x)
  const toY = worldYOf(to.y)
  bar.scale.set(Math.hypot(toX - fromX, toY - fromY), thickness, 1)
  bar.rotation.z = Math.atan2(toY - fromY, toX - fromX)
  bar.position.set((fromX + toX) / 2, (fromY + toY) / 2, z)
}

/** スキャンライン y が、点 (x1, y1) と (x2, y2) を結ぶ辺と交わる x */
const intersectionXOf = (y: number, x1: number, y1: number, x2: number, y2: number) =>
  x1 + ((x2 - x1) * (y - y1)) / (y2 - y1)

/**
 * 行 row のスキャンラインが三角形と交わる区間。
 * 上の頂点より上、底辺より下では交わらない
 */
const spanAt = (row: number, apexX: number) => {
  if (row < APEX_Y || row > BASE_Y) return null

  return {
    left: intersectionXOf(row, apexX, APEX_Y, BASE_LEFT_X, BASE_Y),
    right: intersectionXOf(row, apexX, APEX_Y, BASE_RIGHT_X, BASE_Y)
  }
}

/** スキャンラインを 1 行進めるごとに、交点の x が動く量。辺の傾きから決まる */
const stepPerRowOf = (baseX: number, apexX: number) => (baseX - apexX) / (BASE_Y - APEX_Y)

export const createScanlineSpanScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  const barGeometry = new PlaneGeometry(1, 1)

  // すでに走査した行で塗った画素
  const pastPixelMaterial = new MeshBasicMaterial({
    color: PIXEL_COLOR,
    transparent: true,
    opacity: PAST_PIXEL_OPACITY
  })
  const pastPixels = new InstancedMesh(barGeometry, pastPixelMaterial, COLUMNS * ROWS)
  pastPixels.frustumCulled = false
  graph.add(pastPixels)

  // いま見ているスキャンラインで塗る画素
  const currentPixelMaterial = new MeshBasicMaterial({ color: PIXEL_COLOR })
  const currentPixels = new InstancedMesh(barGeometry, currentPixelMaterial, COLUMNS)
  currentPixels.frustumCulled = false
  graph.add(currentPixels)

  // 画素どうしの境目
  const gridPoints: Vector3[] = []
  for (let column = 0; column <= COLUMNS; column++) {
    const x = -HALF_WIDTH + column * PITCH
    gridPoints.push(new Vector3(x, -HALF_HEIGHT, LAYER_GRID), new Vector3(x, HALF_HEIGHT, LAYER_GRID))
  }
  for (let row = 0; row <= ROWS; row++) {
    const y = HALF_HEIGHT - row * PITCH
    gridPoints.push(new Vector3(-HALF_WIDTH, y, LAYER_GRID), new Vector3(HALF_WIDTH, y, LAYER_GRID))
  }
  const gridGeometry = new BufferGeometry().setFromPoints(gridPoints)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  graph.add(new LineSegments(gridGeometry, gridMaterial))

  // 画像の外周
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

  // 画像座標系の軸。左上の原点から、x 軸は右へ、y 軸は下へ伸ばす
  const axisTopY = HALF_HEIGHT + AXIS_MARGIN
  const axisLeftX = -HALF_WIDTH - AXIS_MARGIN
  const axisRightX = HALF_WIDTH + AXIS_OVERSHOOT
  const axisBottomY = -HALF_HEIGHT - AXIS_OVERSHOOT
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(axisLeftX, axisTopY, LAYER_AXIS),
    new Vector3(axisRightX, axisTopY, LAYER_AXIS),
    new Vector3(axisLeftX, axisTopY, LAYER_AXIS),
    new Vector3(axisLeftX, axisBottomY, LAYER_AXIS)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  graph.add(new LineSegments(axisGeometry, axisMaterial))

  // 軸の矢じり。ConeGeometry は +y 向きに尖っているので、向きたい方向へ回す
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const arrowMaterial = new MeshBasicMaterial({ color: AXIS_COLOR })

  const xArrow = new Mesh(arrowGeometry, arrowMaterial)
  xArrow.position.set(axisRightX + ARROW_HEIGHT / 2, axisTopY, LAYER_AXIS)
  xArrow.rotation.z = -Math.PI / 2
  graph.add(xArrow)

  const yArrow = new Mesh(arrowGeometry, arrowMaterial)
  yArrow.position.set(axisLeftX, axisBottomY - ARROW_HEIGHT / 2, LAYER_AXIS)
  yArrow.rotation.z = Math.PI
  graph.add(yArrow)

  // いま見ているスキャンライン。画像の左端から右端まで、水平に走る
  const scanlineMaterial = new MeshBasicMaterial({ color: SCANLINE_COLOR })
  const scanline = new Mesh(barGeometry, scanlineMaterial)
  scanline.scale.set(PLOT_WIDTH, SCANLINE_THICKNESS, 1)
  graph.add(scanline)

  // ラスタ化するポリゴンの輪郭。図の主役なので、格子線に埋もれない太さで描く
  const edgeMaterial = new MeshBasicMaterial({ color: EDGE_COLOR })
  const edges = [0, 1, 2].map(() => {
    const edge = new Mesh(barGeometry, edgeMaterial)
    graph.add(edge)
    return edge
  })

  // スキャンラインとポリゴンの辺が交わる区間（スパン）と、その両端の交点
  const spanMaterial = new MeshBasicMaterial({ color: SPAN_COLOR })
  const span = new Mesh(barGeometry, spanMaterial)
  graph.add(span)

  const dotGeometry = new CircleGeometry(DOT_RADIUS, 16)
  const dotMaterial = new MeshBasicMaterial({ color: SPAN_COLOR })
  const dots = [0, 1].map(() => {
    const dot = new Mesh(dotGeometry, dotMaterial)
    graph.add(dot)
    return dot
  })

  const axisLabels = [
    { text: "x", x: axisRightX + 0.36, y: axisTopY },
    { text: "y", x: axisLeftX - 0.26, y: axisBottomY + 0.3 }
  ].map(({ text, x, y }) => {
    const label = createLabel(text, AXIS_COLOR, AXIS_LABEL_HEIGHT)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  // 交点とスパンの注記。文字は変わらないので作り直さず、位置だけ毎回動かす
  const intersectionLabel = createLabel("交点", SPAN_COLOR, NOTE_LABEL_HEIGHT)
  const spanLabel = createLabel("スパン", SPAN_COLOR, NOTE_LABEL_HEIGHT)
  graph.add(intersectionLabel.sprite, spanLabel.sprite)

  const matrix = new Matrix4()

  return {
    update: () => {
      const apexX = params.apexX
      const scanRow = Math.round(params.scanline)

      const apex = { x: apexX, y: APEX_Y }
      const baseLeft = { x: BASE_LEFT_X, y: BASE_Y }
      const baseRight = { x: BASE_RIGHT_X, y: BASE_Y }

      placeBar(edges[0], apex, baseLeft, EDGE_THICKNESS, LAYER_EDGE)
      placeBar(edges[1], apex, baseRight, EDGE_THICKNESS, LAYER_EDGE)
      placeBar(edges[2], baseLeft, baseRight, EDGE_THICKNESS, LAYER_EDGE)

      // スキャンラインは、いま見ている行の画素の中心を通る
      scanline.position.set(0, worldYOf(scanRow), LAYER_SCANLINE)

      // 上端から今の行まで、1 行ずつ走査してスパンの内側の画素を塗っていく。
      // 画素は、その中心がスパンに入っていれば内部とみなす
      let painted = 0
      let current = 0
      for (let row = 0; row <= scanRow; row++) {
        const rowSpan = spanAt(row, apexX)
        if (!rowSpan) continue

        const from = Math.max(Math.ceil(rowSpan.left), 0)
        const to = Math.min(Math.floor(rowSpan.right), COLUMNS - 1)
        for (let column = from; column <= to; column++) {
          matrix.makeScale(PITCH, PITCH, 1)

          if (row === scanRow) {
            matrix.setPosition(worldXOf(column), worldYOf(row), LAYER_CURRENT_PIXEL)
            currentPixels.setMatrixAt(current++, matrix)
          } else {
            matrix.setPosition(worldXOf(column), worldYOf(row), LAYER_PIXEL)
            pastPixels.setMatrixAt(painted++, matrix)
          }
        }
      }
      pastPixels.count = painted
      pastPixels.instanceMatrix.needsUpdate = true
      currentPixels.count = current
      currentPixels.instanceMatrix.needsUpdate = true

      // いまの行のスパンと、その両端の交点
      const currentSpan = spanAt(scanRow, apexX)
      const inside = currentSpan !== null
      span.visible = inside
      dots.forEach((dot) => (dot.visible = inside))
      intersectionLabel.sprite.visible = inside
      spanLabel.sprite.visible = inside

      if (currentSpan) {
        const { left, right } = currentSpan
        placeBar(
          span,
          { x: left, y: scanRow },
          { x: right, y: scanRow },
          SPAN_THICKNESS,
          LAYER_SPAN
        )
        dots[0].position.set(worldXOf(left), worldYOf(scanRow), LAYER_DOT)
        dots[1].position.set(worldXOf(right), worldYOf(scanRow), LAYER_DOT)

        // 注記はスキャンラインと同じ高さで、スパンの外側（塗る画素と輪郭を避ける側）へ逃がす
        intersectionLabel.sprite.position.set(
          worldXOf(left) - NOTE_MARGIN - intersectionLabel.sprite.scale.x / 2,
          worldYOf(scanRow),
          LAYER_LABEL
        )
        spanLabel.sprite.position.set(
          worldXOf(right) + NOTE_MARGIN + spanLabel.sprite.scale.x / 2,
          worldYOf(scanRow),
          LAYER_LABEL
        )
      }

      // 交点の x は、1 行進むごとに辺の傾きの分だけ動く
      const previousSpan = spanAt(scanRow - 1, apexX)
      const describe = (x: number | undefined, baseX: number) => {
        if (x === undefined) return "—（ポリゴンの外）"
        const step = stepPerRowOf(baseX, apexX)
        const sign = step < 0 ? "-" : "+"
        return previousSpan
          ? `${x.toFixed(2)}（前の行から ${sign}${Math.abs(step).toFixed(2)}）`
          : `${x.toFixed(2)}（走査の開始行）`
      }
      params.left = describe(currentSpan?.left, BASE_LEFT_X)
      params.right = describe(currentSpan?.right, BASE_RIGHT_X)
    },
    dispose: () => {
      const disposables = [
        barGeometry,
        pastPixelMaterial,
        currentPixelMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        axisGeometry,
        axisMaterial,
        arrowGeometry,
        arrowMaterial,
        scanlineMaterial,
        edgeMaterial,
        spanMaterial,
        dotGeometry,
        dotMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pastPixels.dispose()
      currentPixels.dispose()
      const labels = [...axisLabels, intersectionLabel, spanLabel]
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
