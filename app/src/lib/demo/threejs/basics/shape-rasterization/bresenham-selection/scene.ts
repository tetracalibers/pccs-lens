import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Group,
  InstancedMesh,
  Line,
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
export type BresenhamSelectionParams = {
  /** 線分の終点の高さ dy（画素数）。dx は格子の幅で固定なので、これが傾きを決める */
  dy: number
  /** x をいくつ進めたか。この列まで塗り進めた状態を見せる */
  step: number
  /** 判定変数の符号と、そこから決まる次の画素。scene.ts が書き戻すので初期値は使われない */
  judgement: string
  /** 判定変数の更新。scene.ts が書き戻すので初期値は使われない */
  update: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: BresenhamSelectionParams
}

/**
 * 画素の格子。候補となる 2 つの画素を見比べられるよう、画素を大きめにとる。
 * 線分は左上の画素の中心から始まり、右端の列まで dx = COLUMNS - 1 だけ進む
 */
const COLUMNS = 9
const ROWS = 6
const PITCH = 0.4
const PLOT_WIDTH = COLUMNS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/** x 方向の変化量。線分の始点と終点は、両端の列の画素の中心にとる */
const DX = COLUMNS - 1

/** 描きたい線分の太さ。線材の線幅は WebGL では 1 ドット固定なので、細長い長方形として描く */
const LINE_THICKNESS = 0.034

/** 座標軸を格子の外へ逃がす距離と、軸を格子より長く伸ばす分 */
const AXIS_MARGIN = 0.18
const AXIS_OVERSHOOT = 0.26

/** 座標軸の矢じりの大きさ */
const ARROW_HEIGHT = 0.16
const ARROW_RADIUS = 0.06

/** 軸の名前・候補の注記の文字の高さ（ワールド座標での大きさ） */
const AXIS_LABEL_HEIGHT = 0.24
const NOTE_LABEL_HEIGHT = 0.2

/** 候補の注記を、候補の画素から右へ逃がす距離 */
const NOTE_MARGIN = 0.14

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
const LAYER_CANDIDATE_FILL = 0.045
const LAYER_CANDIDATE = 0.05
const LAYER_LINE = 0.06
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、塗った画素・線分・2 つの候補を互いに見分けられる色にする
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const LINE_COLOR = "#6fd8ff"
const PIXEL_COLOR = "#ffc857"
const PAST_PIXEL_OPACITY = 0.45
const CHOSEN_FILL_OPACITY = 0.3
const REJECTED_COLOR = "#aeb6c2"
const AXIS_COLOR = "#9aa3b0"

/** 図全体を canvas の中央に寄せる位置。右の候補の注記の分だけ左へ寄せる */
const GRAPH_OFFSET = new Vector3(-0.1, 0, 0)

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
 * x（画素の列）と y（画素の行）のワールド座標。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる
 */
const worldXOf = (x: number) => -HALF_WIDTH + (x + 0.5) * PITCH
const worldYOf = (y: number) => HALF_HEIGHT - (y + 0.5) * PITCH

export const createBresenhamSelectionScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  const squareGeometry = new PlaneGeometry(1, 1)

  // すでに塗った画素。いま塗った画素と見分けるため、控えめな濃さにする
  const pastPixelMaterial = new MeshBasicMaterial({
    color: PIXEL_COLOR,
    transparent: true,
    opacity: PAST_PIXEL_OPACITY
  })
  const pastPixels = new InstancedMesh(squareGeometry, pastPixelMaterial, COLUMNS)
  pastPixels.frustumCulled = false
  graph.add(pastPixels)

  // いま塗っている画素
  const currentPixelMaterial = new MeshBasicMaterial({ color: PIXEL_COLOR })
  const currentPixel = new Mesh(squareGeometry, currentPixelMaterial)
  currentPixel.scale.set(PITCH, PITCH, 1)
  graph.add(currentPixel)

  // 判定変数の符号で選ばれた側の候補。次に塗る画素を薄く塗って示す
  const chosenFillMaterial = new MeshBasicMaterial({
    color: PIXEL_COLOR,
    transparent: true,
    opacity: CHOSEN_FILL_OPACITY
  })
  const chosenFill = new Mesh(squareGeometry, chosenFillMaterial)
  chosenFill.scale.set(PITCH, PITCH, 1)
  graph.add(chosenFill)

  // 2 つの候補の枠。選ばれた側は塗る色、選ばれなかった側は控えめな色で囲む
  const outlineGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-0.5, -0.5, 0),
    new Vector3(0.5, -0.5, 0),
    new Vector3(0.5, 0.5, 0),
    new Vector3(-0.5, 0.5, 0),
    new Vector3(-0.5, -0.5, 0)
  ])
  const chosenOutlineMaterial = new LineBasicMaterial({ color: PIXEL_COLOR })
  const rejectedOutlineMaterial = new LineBasicMaterial({ color: REJECTED_COLOR })
  const candidateOutlines = [0, 1].map(() => {
    const outline = new Line(outlineGeometry, rejectedOutlineMaterial)
    outline.scale.set(PITCH, PITCH, 1)
    graph.add(outline)
    return outline
  })

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

  // 描きたい線分。始点と終点は、両端の列の画素の中心にとる
  const lineMaterial = new MeshBasicMaterial({ color: LINE_COLOR })
  const segment = new Mesh(squareGeometry, lineMaterial)
  graph.add(segment)

  const axisLabels = [
    { text: "x", x: axisRightX + 0.36, y: axisTopY },
    { text: "y", x: axisLeftX - 0.26, y: axisBottomY + 0.3 }
  ].map(({ text, x, y }) => {
    const label = createLabel(text, AXIS_COLOR, AXIS_LABEL_HEIGHT)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  // 候補の注記。上の候補は d ≦ 0 のとき、下の候補は d > 0 のときに選ばれる
  const candidateLabels = ["d ≦ 0", "d > 0"].map((text) => {
    const label = createLabel(text, REJECTED_COLOR, NOTE_LABEL_HEIGHT)
    graph.add(label.sprite)
    return label
  })

  const matrix = new Matrix4()

  return {
    update: () => {
      const dy = Math.round(params.dy)
      const step = Math.round(params.step)

      // 線分は左上の画素の中心から、右端の列の高さ dy の画素の中心まで
      const startX = worldXOf(0)
      const startY = worldYOf(0)
      const endX = worldXOf(DX)
      const endY = worldYOf(dy)
      segment.scale.set(Math.hypot(endX - startX, endY - startY), LINE_THICKNESS, 1)
      segment.rotation.z = Math.atan2(endY - startY, endX - startX)
      segment.position.set((startX + endX) / 2, (startY + endY) / 2, LAYER_LINE)

      // ブレゼンハムのアルゴリズム。判定変数 d の符号だけで次の画素を決め、
      // d の更新も整数の加算だけで済む
      let y = 0
      let d = 2 * dy - DX

      matrix.makeScale(PITCH, PITCH, 1)
      matrix.setPosition(worldXOf(0), worldYOf(0), LAYER_PIXEL)
      pastPixels.setMatrixAt(0, matrix)

      for (let x = 0; x < step; x++) {
        if (d > 0) {
          y += 1
          d += 2 * (dy - DX)
        } else {
          d += 2 * dy
        }

        matrix.makeScale(PITCH, PITCH, 1)
        matrix.setPosition(worldXOf(x + 1), worldYOf(y), LAYER_PIXEL)
        pastPixels.setMatrixAt(x + 1, matrix)
      }
      pastPixels.count = step + 1
      pastPixels.instanceMatrix.needsUpdate = true

      // いま塗っている画素を、濃い色で重ねる
      currentPixel.position.set(worldXOf(step), worldYOf(y), LAYER_CURRENT_PIXEL)

      // 次の列の候補は、いまと同じ行と、その 1 つ下の行の 2 つだけ
      const hasNext = step < DX
      const goesDown = d > 0
      const nextX = worldXOf(step + 1)

      candidateOutlines.forEach((outline, index) => {
        outline.visible = hasNext
        outline.position.set(nextX, worldYOf(y + index), LAYER_CANDIDATE)
        // 選ばれた側だけ、塗る色で囲む
        outline.material =
          goesDown === (index === 1) ? chosenOutlineMaterial : rejectedOutlineMaterial
      })
      candidateLabels.forEach(({ sprite }, index) => {
        sprite.visible = hasNext
        sprite.position.set(
          nextX + PITCH / 2 + NOTE_MARGIN + sprite.scale.x / 2,
          worldYOf(y + index),
          LAYER_LABEL
        )
      })
      chosenFill.visible = hasNext
      chosenFill.position.set(nextX, worldYOf(goesDown ? y + 1 : y), LAYER_CANDIDATE_FILL)

      // 判定変数の符号と更新を、整数の計算のまま追えるようにする
      const initial = step === 0 ? `2dy - dx = 2 × ${dy} - ${DX} = ` : ""
      params.judgement = hasNext
        ? `d = ${initial}${d}` + (goesDown ? " > 0 → yを1増やす" : " ≦ 0 → yはそのまま")
        : `終点に到達（これ以上進む列はない）`
      params.update = hasNext
        ? goesDown
          ? `d + 2(dy - dx) = ${d} + ${2 * (dy - DX)} = ${d + 2 * (dy - DX)}`
          : `d + 2dy = ${d} + ${2 * dy} = ${d + 2 * dy}`
        : "—"
    },
    dispose: () => {
      const disposables = [
        squareGeometry,
        pastPixelMaterial,
        currentPixelMaterial,
        chosenFillMaterial,
        outlineGeometry,
        chosenOutlineMaterial,
        rejectedOutlineMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        axisGeometry,
        axisMaterial,
        arrowGeometry,
        arrowMaterial,
        lineMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pastPixels.dispose()
      const labels = [...axisLabels, ...candidateLabels]
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
