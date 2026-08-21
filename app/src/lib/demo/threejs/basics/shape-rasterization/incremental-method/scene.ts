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
export type IncrementalMethodParams = {
  /** 直線の傾き a。x を 1 進めたときに y が増える量 */
  slope: number
  /** x をいくつ進めたか。この回数だけ増分を足した状態を見せる */
  step: number
  /** 増分法での計算。scene.ts が組み立てて書き戻すので、初期値は使われない */
  incremental: string
  /** 直線の式からの計算。scene.ts が組み立てて書き戻すので、初期値は使われない */
  direct: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: IncrementalMethodParams
}

/**
 * 画素の格子。x は 0 から COLUMNS - 1 までの整数をとる。
 * 列と行をともに奇数にとると、格子の中心（直線が回る軸）が画素の中心に重なり、
 * 切片 b が傾きと同じ桁数の小数で収まる
 */
const COLUMNS = 13
const ROWS = 9
const PITCH = 0.28
const PLOT_WIDTH = COLUMNS * PITCH
const PLOT_HEIGHT = ROWS * PITCH
const HALF_WIDTH = PLOT_WIDTH / 2
const HALF_HEIGHT = PLOT_HEIGHT / 2

/** 描きたい直線の太さ。線材の線幅は WebGL では 1 ドット固定なので、細長い長方形として描く */
const LINE_THICKNESS = 0.034

/** 増分をたどる階段の太さと、求めた y を示す点の半径 */
const PATH_THICKNESS = 0.026
const DOT_RADIUS = 0.045

/** 座標軸を格子の外へ逃がす距離と、軸を格子より長く伸ばす分 */
const AXIS_MARGIN = 0.18
const AXIS_OVERSHOOT = 0.26

/** 座標軸の矢じりの大きさ */
const ARROW_HEIGHT = 0.16
const ARROW_RADIUS = 0.06

/** 軸の名前・増分の注記の文字の高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.24
const STEP_LABEL_HEIGHT = 0.22

/**
 * 増分の注記を、注記が添う線分から逃がす距離。
 * +1 は横線の上（下）に載るので、接するくらいまで近づけて、わずかに間を空ける
 */
const STEP_LABEL_MARGIN_X = 0.09
const STEP_LABEL_MARGIN_Y = 0.19

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = 0.01
const LAYER_FRAME = 0.02
const LAYER_AXIS = 0.03
const LAYER_LINE = 0.04
const LAYER_PATH = 0.05
const LAYER_DOT = 0.06
const LAYER_LABEL = 0.1

// 背景（暗めのグレー）の上で、格子・直線・増分の階段を互いに見分けられる色にする。
// 増分は x 方向へ進む分（+1）と y 方向へ増える分（+a）で色を分ける
const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"
const LINE_COLOR = "#6fd8ff"
const DOT_COLOR = "#ffc857"
const STEP_X_COLOR = "#b48cf2"
const STEP_Y_COLOR = "#f2766a"
const PAST_STEP_OPACITY = 0.4
const AXIS_COLOR = "#9aa3b0"

/** 図全体を canvas の中央に寄せる位置。左の軸名と右へ伸ばした x 軸の分だけ寄せる */
const GRAPH_OFFSET = new Vector3(-0.13, 0, 0)

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
 * x（画素の列）と y（画素の行を単位とした小数）のワールド座標。
 * 画像座標系は画像の左上を原点とし、x 軸を右向き、y 軸を下向きにとる
 */
const worldXOf = (x: number) => -HALF_WIDTH + (x + 0.5) * PITCH
const worldYOf = (y: number) => HALF_HEIGHT - (y + 0.5) * PITCH

/** 切片 b（x = 0 のときの y）。直線は格子の中心を通り、傾きを変えるとそこを軸に回る */
const interceptOf = (slope: number) => (ROWS - 1) / 2 - (slope * (COLUMNS - 1)) / 2

export const createIncrementalMethodScene = ({ scene, params }: SceneContext) => {
  const graph = new Group()
  graph.position.copy(GRAPH_OFFSET)
  scene.add(graph)

  // 画素どうしの境目。x を 1 進めることが、1 列ぶん右へ移ることに当たる
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

  // 描きたい直線 y = ax + b。図の主役なので、格子線に埋もれない太さで描く
  const barGeometry = new PlaneGeometry(1, 1)
  const lineMaterial = new MeshBasicMaterial({ color: LINE_COLOR })
  const straightLine = new Mesh(barGeometry, lineMaterial)
  straightLine.position.z = LAYER_LINE
  graph.add(straightLine)

  // 通り過ぎた増分。x 方向へ 1、y 方向へ a の 2 本ずつで階段になる。
  // InstancedMesh はマテリアルを 1 つしか持てないので、向きごとに分けて色を変える
  const pastStepAlongXMaterial = new MeshBasicMaterial({
    color: STEP_X_COLOR,
    transparent: true,
    opacity: PAST_STEP_OPACITY
  })
  const pastStepAlongYMaterial = new MeshBasicMaterial({
    color: STEP_Y_COLOR,
    transparent: true,
    opacity: PAST_STEP_OPACITY
  })
  const pastStepsAlongX = new InstancedMesh(barGeometry, pastStepAlongXMaterial, COLUMNS - 1)
  const pastStepsAlongY = new InstancedMesh(barGeometry, pastStepAlongYMaterial, COLUMNS - 1)
  pastStepsAlongX.frustumCulled = false
  pastStepsAlongY.frustumCulled = false
  graph.add(pastStepsAlongX, pastStepsAlongY)

  // いま足した増分。x 方向へ 1 進める分と、y 方向へ a 増える分
  const stepAlongXMaterial = new MeshBasicMaterial({ color: STEP_X_COLOR })
  const stepAlongYMaterial = new MeshBasicMaterial({ color: STEP_Y_COLOR })
  const stepAlongX = new Mesh(barGeometry, stepAlongXMaterial)
  const stepAlongY = new Mesh(barGeometry, stepAlongYMaterial)
  graph.add(stepAlongX, stepAlongY)

  // 求めた y。小数のまま、直線の上に乗る
  const dotGeometry = new CircleGeometry(DOT_RADIUS, 16)
  const dotMaterial = new MeshBasicMaterial({ color: DOT_COLOR })
  const dots = new InstancedMesh(dotGeometry, dotMaterial, COLUMNS)
  dots.frustumCulled = false
  graph.add(dots)

  const axisLabels = [
    { text: "x", x: axisRightX + 0.36, y: axisTopY },
    { text: "y", x: axisLeftX - 0.26, y: axisBottomY + 0.3 }
  ].map(({ text, x, y }) => {
    const label = createLabel(text, AXIS_COLOR, AXIS_LABEL_HEIGHT)
    label.sprite.position.set(x, y, LAYER_LABEL)
    graph.add(label.sprite)
    return label
  })

  // 増分の注記。文字は変わらないので作り直さず、位置だけ毎回動かす
  const alongXLabel = createLabel("+1", STEP_X_COLOR, STEP_LABEL_HEIGHT)
  const alongYLabel = createLabel("+a", STEP_Y_COLOR, STEP_LABEL_HEIGHT)
  graph.add(alongXLabel.sprite, alongYLabel.sprite)

  const matrix = new Matrix4()

  return {
    update: () => {
      const { slope } = params
      const step = Math.round(params.step)
      const intercept = interceptOf(slope)

      // 直線は格子の左端から右端まで引く。格子の中心を通るので、位置は動かさず傾きだけ変える
      straightLine.scale.set(PLOT_WIDTH * Math.hypot(1, slope), LINE_THICKNESS, 1)
      // 傾きの分だけ回す（y 軸が下向きなので回転は逆向き）
      straightLine.rotation.z = Math.atan(-slope)

      // 増分法。はじめに 1 回だけ式から y を求め、あとは前の y に傾き a を足していく
      let y = intercept
      matrix.identity()
      matrix.setPosition(worldXOf(0), worldYOf(y), LAYER_DOT)
      dots.setMatrixAt(0, matrix)

      for (let x = 1; x <= step; x++) {
        const previousY = y
        y += slope

        // x を 1 進める分。どのステップでも 1 列ぶんの長さになる
        matrix.makeScale(PITCH, PATH_THICKNESS, 1)
        matrix.setPosition((worldXOf(x - 1) + worldXOf(x)) / 2, worldYOf(previousY), LAYER_PATH)
        pastStepsAlongX.setMatrixAt(x - 1, matrix)

        // y が a だけ増える分。傾きが急なほど長くなる
        matrix.makeScale(PATH_THICKNESS, Math.abs(slope) * PITCH, 1)
        matrix.setPosition(worldXOf(x), (worldYOf(previousY) + worldYOf(y)) / 2, LAYER_PATH)
        pastStepsAlongY.setMatrixAt(x - 1, matrix)

        // 求めた y。小数のまま、直線の上に乗る
        matrix.identity()
        matrix.setPosition(worldXOf(x), worldYOf(y), LAYER_DOT)
        dots.setMatrixAt(x, matrix)
      }

      dots.count = step + 1
      dots.instanceMatrix.needsUpdate = true
      pastStepsAlongX.count = step
      pastStepsAlongX.instanceMatrix.needsUpdate = true
      pastStepsAlongY.count = step
      pastStepsAlongY.instanceMatrix.needsUpdate = true

      // いま足した増分を、階段の最後の 1 段に重ねて強調する
      const showStep = step > 0
      stepAlongX.visible = showStep
      stepAlongY.visible = showStep
      alongXLabel.sprite.visible = showStep
      alongYLabel.sprite.visible = showStep

      if (showStep) {
        const previousY = y - slope
        const midX = (worldXOf(step - 1) + worldXOf(step)) / 2
        const midY = (worldYOf(previousY) + worldYOf(y)) / 2

        stepAlongX.scale.set(PITCH, PATH_THICKNESS, 1)
        stepAlongX.position.set(midX, worldYOf(previousY), LAYER_DOT)

        stepAlongY.scale.set(PATH_THICKNESS, Math.abs(slope) * PITCH, 1)
        stepAlongY.position.set(worldXOf(step), midY, LAYER_DOT)

        // 注記は、増分の階段が伸びる側とは反対側へ逃がす
        const labelSide = slope >= 0 ? 1 : -1
        alongXLabel.sprite.position.set(
          midX,
          worldYOf(previousY) + labelSide * STEP_LABEL_MARGIN_X,
          LAYER_LABEL
        )
        alongYLabel.sprite.position.set(worldXOf(step) + STEP_LABEL_MARGIN_Y, midY, LAYER_LABEL)
      }

      // 増分を足した結果と、式から直接求めた場合の対比。
      // かけ算を 1 度もしていないのに、同じ y が得られることを数字で確かめられるようにする
      params.incremental = showStep
        ? `${(y - slope).toFixed(2)} + ${slope.toFixed(2)} = ${y.toFixed(2)}`
        : `${y.toFixed(2)}（式から1回だけ計算）`
      params.direct = `${slope.toFixed(2)} × ${step} + ${intercept.toFixed(2)} = ${(slope * step + intercept).toFixed(2)}`
    },
    dispose: () => {
      const disposables = [
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial,
        axisGeometry,
        axisMaterial,
        arrowGeometry,
        arrowMaterial,
        barGeometry,
        lineMaterial,
        pastStepAlongXMaterial,
        pastStepAlongYMaterial,
        stepAlongXMaterial,
        stepAlongYMaterial,
        dotGeometry,
        dotMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
      pastStepsAlongX.dispose()
      pastStepsAlongY.dispose()
      dots.dispose()
      const labels = [...axisLabels, alongXLabel, alongYLabel]
      labels.forEach(({ texture, material }) => {
        texture.dispose()
        material.dispose()
      })
    }
  }
}
