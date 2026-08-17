import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
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
export type CircleParameterFormParams = {
  /** 円の半径 */
  r: number
  /** 円周上の点を選ぶ角度。操作しやすさのため度で持ち、シーンの中でラジアンに直す */
  thetaDeg: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  thetaRad: string
  point: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: CircleParameterFormParams
}

/** 軸を原点から正負どちらへも伸ばす長さ。この範囲が初期表示で収まるようにカメラを置く */
const AXIS_HALF_X = 3.9
const AXIS_HALF_Y = 3.2

/** 格子の間隔と、原点から数えた本数。1 目盛りが 1 */
const GRID_STEP = 1
const GRID_COUNT = 3

/** 格子の線の薄さ。座標の目安であって主役ではない */
const GRID_OPACITY = 0.3

/** 円周を描く折れ線の分割数 */
const CIRCLE_SEGMENTS = 128

/** 掃いた円弧を描く折れ線の分割数。θ の大きさによらず頂点数は同じで、間隔だけ変わる */
const ARC_SEGMENTS = 96

/** 角度 θ を示す弧の半径と、その弧の分割数 */
const ANGLE_ARC_RADIUS = 0.55
const ANGLE_ARC_SEGMENTS = 32

/** θ を刻んで点を並べる間隔（度）。360 を割り切る値にして、1 周ぶんが等間隔に並ぶようにする */
const DOT_STEP_DEG = 15

/** 刻んだ点を示す球の半径 */
const DOT_RADIUS = 0.045

/** 今の θ に対応する点を示す球の半径 */
const POINT_RADIUS = 0.085

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.3
const ANNOTATION_LABEL_HEIGHT = 0.26

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** 半径のラベルを、半径の線に垂直な向きへずらす距離 */
const RADIUS_LABEL_OFFSET = 0.26

/** θ のラベルを置く、原点からの距離。角度を示す弧より少し外側 */
const ANGLE_LABEL_RADIUS = 0.88

/** 今の θ に対応する点のラベルを、円の外側へ離す距離 */
const MARKER_LABEL_GAP = 0.42

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、奥から手前へ少しだけ振り分ける z。
 * とくに円周と掃いた円弧は同じ曲線上に重なるので、前後を決めないと描画が競合する。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_GRID = -0.02
const LAYER_AXIS = -0.01
const LAYER_LINE = 0
const LAYER_TRACE = 0.01
const LAYER_RADIUS = 0.02
const LAYER_POINT = 0.03
/** ラベルは点を示す球（半径 POINT_RADIUS）より手前に置く */
const LAYER_LABEL = 0.13

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・格子・円周・掃いた円弧・点列が見分けられる色にする。
// 軸の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const GRID_COLOR = "#9aa3b0"
const LINE_COLOR = "#6d7f96"
const TRACE_COLOR = "#ffc857"
const DOT_COLOR = "#c9d2de"
const RADIUS_COLOR = "#b79cf5"
const ANGLE_COLOR = "#5ec8f2"
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

/** 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string, color: string, direction: Vector3, half: number) => {
  const group = new Group()
  group.position.z = LAYER_AXIS

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-half),
    direction.clone().multiplyScalar(half)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(half)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(half + LABEL_OFFSET)
  group.add(label.sprite)

  return {
    object: group,
    dispose: () => {
      const disposables = [
        lineGeometry,
        lineMaterial,
        arrowGeometry,
        arrowMaterial,
        label.texture,
        label.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 座標を読み取る目安になる格子。軸を伸ばした範囲いっぱいに引く */
const createGrid = () => {
  const points: Vector3[] = []

  for (let i = -GRID_COUNT; i <= GRID_COUNT; i++) {
    const line = i * GRID_STEP
    points.push(
      new Vector3(line, -AXIS_HALF_Y, LAYER_GRID),
      new Vector3(line, AXIS_HALF_Y, LAYER_GRID),
      new Vector3(-AXIS_HALF_X, line, LAYER_GRID),
      new Vector3(AXIS_HALF_X, line, LAYER_GRID)
    )
  }

  const geometry = new BufferGeometry().setFromPoints(points)
  const material = new LineBasicMaterial({
    color: GRID_COLOR,
    transparent: true,
    opacity: GRID_OPACITY
  })

  return {
    object: new LineSegments(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 半径を変えても、掃く範囲を変えても使い回せる円弧。
 * 頂点数は固定して、角度の刻み幅だけを毎フレーム変える
 */
const createArc = (color: string, segments: number, z: number) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array((segments + 1) * 3), 3)
  geometry.setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new Line(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    /** 半径 `radius` の円弧を、角度 `from` から `to` まで張る */
    set: (radius: number, from: number, to: number) => {
      for (let i = 0; i <= segments; i++) {
        const angle = from + (to - from) * (i / segments)
        positions.setXYZ(i, radius * Math.cos(angle), radius * Math.sin(angle), z)
      }
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 原点から今の点へ引く半径の線。両端が動くので、座標だけ書き換える */
const createRadiusLine = (color: string) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  geometry.setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new LineSegments(geometry, material)
  line.frustumCulled = false
  positions.setXYZ(0, 0, 0, LAYER_RADIUS)

  return {
    object: line,
    set: (to: Vector3) => {
      positions.setXYZ(1, to.x, to.y, LAYER_RADIUS)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * θ を一定の刻みで動かして得られる点。1 周ぶんをあらかじめ作っておき、
 * 今の θ までに到達したものだけを見せる
 */
const createDots = () => {
  const geometry = new SphereGeometry(DOT_RADIUS, 12, 8)
  const material = new MeshBasicMaterial({ color: DOT_COLOR })
  const degrees: number[] = []
  const meshes: Mesh[] = []

  for (let deg = 0; deg < 360; deg += DOT_STEP_DEG) {
    degrees.push(deg)
    meshes.push(new Mesh(geometry, material))
  }

  return {
    objects: meshes,
    /** 半径 `radius` の円周上へ並べ直し、`thetaDeg` を超えたものは隠す */
    setPositions: (radius: number, thetaDeg: number) => {
      meshes.forEach((mesh, index) => {
        const deg = degrees[index]
        mesh.visible = deg <= thetaDeg
        if (!mesh.visible) return
        const angle = (deg * Math.PI) / 180
        mesh.position.set(radius * Math.cos(angle), radius * Math.sin(angle), LAYER_POINT)
      })
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createCircleParameterFormScene = ({ scene, params }: SceneContext) => {
  const grid = createGrid()
  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, AXIS_HALF_X),
    createAxis("y", Y_COLOR, Y_DIRECTION, AXIS_HALF_Y)
  ]
  scene.add(grid.object, ...axes.map((axis) => axis.object))

  // θ を 0 から 2π まで動かしたときに得られる円周。半径 1 で作って、r の値で拡大する
  const circlePoints: Vector3[] = []
  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2
    circlePoints.push(new Vector3(Math.cos(angle), Math.sin(angle), LAYER_LINE))
  }
  const circleGeometry = new BufferGeometry().setFromPoints(circlePoints)
  const circleMaterial = new LineBasicMaterial({ color: LINE_COLOR })
  const circle = new LineLoop(circleGeometry, circleMaterial)
  scene.add(circle)

  // θ = 0 から今の θ までに描かれた円弧
  const arc = createArc(TRACE_COLOR, ARC_SEGMENTS, LAYER_TRACE)
  scene.add(arc.object)

  const dots = createDots()
  scene.add(...dots.objects)

  // 原点から今の点へ引く半径と、x 軸から測った角度 θ
  const radiusLine = createRadiusLine(RADIUS_COLOR)
  const angleArc = createArc(ANGLE_COLOR, ANGLE_ARC_SEGMENTS, LAYER_RADIUS)
  scene.add(radiusLine.object, angleArc.object)

  // 今の θ に対応する点
  const markerGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  scene.add(marker)

  const radiusLabel = createLabel("r", RADIUS_COLOR, ANNOTATION_LABEL_HEIGHT)
  const angleLabel = createLabel("θ", ANGLE_COLOR, ANNOTATION_LABEL_HEIGHT)
  const markerLabel = createLabel("(x, y)", MARKER_COLOR, ANNOTATION_LABEL_HEIGHT)
  scene.add(radiusLabel.sprite, angleLabel.sprite, markerLabel.sprite)

  const current = new Vector3()

  return {
    update: () => {
      const { r } = params
      const theta = (params.thetaDeg * Math.PI) / 180
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)

      // パラメータ表示 x = r cosθ, y = r sinθ
      current.set(r * cos, r * sin, LAYER_POINT)
      marker.position.copy(current)

      circle.scale.setScalar(r)
      arc.set(r, 0, theta)
      dots.setPositions(r, params.thetaDeg)
      radiusLine.set(current)
      angleArc.set(ANGLE_ARC_RADIUS, 0, theta)

      // 半径のラベルは線の中ほどに置き、線と重ならないよう垂直な向きへずらす
      radiusLabel.sprite.position.set(
        (r / 2) * cos - sin * RADIUS_LABEL_OFFSET,
        (r / 2) * sin + cos * RADIUS_LABEL_OFFSET,
        LAYER_LABEL
      )

      // θ のラベルは、角度を示す弧の中ほどの少し外側に置く
      const half = theta / 2
      angleLabel.sprite.position.set(
        Math.cos(half) * ANGLE_LABEL_RADIUS,
        Math.sin(half) * ANGLE_LABEL_RADIUS,
        LAYER_LABEL
      )

      // 今の点のラベルは、円の外側へ向かって離す
      markerLabel.sprite.position.set(
        cos * (r + MARKER_LABEL_GAP),
        sin * (r + MARKER_LABEL_GAP),
        LAYER_LABEL
      )

      // Tweakpane 側に読み取り専用で出す値。θ は記事の式と同じラジアンでも示す
      params.thetaRad = `${theta.toFixed(2)}`
      params.point = `(${current.x.toFixed(2)}, ${current.y.toFixed(2)})`
    },
    dispose: () => {
      grid.dispose()
      axes.forEach((axis) => axis.dispose())
      arc.dispose()
      dots.dispose()
      radiusLine.dispose()
      angleArc.dispose()
      const disposables = [
        circleGeometry,
        circleMaterial,
        markerGeometry,
        markerMaterial,
        radiusLabel.texture,
        radiusLabel.material,
        angleLabel.texture,
        angleLabel.material,
        markerLabel.texture,
        markerLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
