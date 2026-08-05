import {
  BufferGeometry,
  CanvasTexture,
  type ColorRepresentation,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type PointAtInfinityParams = {
  /** 射影変換行列の最下行 (p q r) の p */
  p: number
  /** 射影変換行列の最下行 (p q r) の q */
  q: number
  /** 無限遠点の向き（度）。この向きの無限遠点が (cos, sin, 0) になる */
  angle: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  transformedW: string
  intersection: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PointAtInfinityParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2.4

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** w = 1 の平面の 1 辺の半分の長さ */
const PLANE_HALF = 2

/** 平面に引く目盛りの間隔 */
const PLANE_GRID_STEP = 0.5

/** 平面の塗りと目盛りの不透明度。奥の直線や点が透けて見える程度に抑える */
const PLANE_OPACITY = 0.12
const GRID_OPACITY = 0.45

/**
 * 原点を通る直線を、原点から正負どちらへも伸ばす長さ。
 * 平面の隅に落ちた交点（原点から最も遠くて距離 3）まで届く長さにする
 */
const RAY_HALF = 3.2

/** 平面上に引く平行な 2 直線を、向きに垂直な方向へずらす距離 */
const RAIL_GAP = 0.35

/** 像の直線の向きを求めるために、変換前の直線上で少しだけ進める距離 */
const RAIL_PROBE = 0.1

/**
 * 平面上の直線を、平面の内側にある区間だけ描くために刻む範囲と数。
 * 範囲は平面のどの点からでも平面全体を覆う長さ、刻みは平面の目盛りより細かくとる
 */
const RAIL_REACH = 6
const RAIL_SAMPLES = 240

/** w' の絶対値がこれ以下なら 0 とみなす（変換後も無限遠点のまま） */
const ZERO_W = 0.02

/** 交点を示す球の半径 */
const POINT_RADIUS = 0.07

/** 原点を示す球の半径 */
const ORIGIN_RADIUS = 0.045

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 座標を書いたラベルの高さ。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_HEIGHT = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルを、それが指す点から離す距離 */
const LABEL_GAP = 0.14

/** 直線に付けるラベルを、原点からどれだけ離した位置に置くか */
const LABEL_RADIUS = 2.2

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const W_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

/** 平面上に引く平行な 2 直線の、向きに垂直な方向へのずらし方 */
const RAIL_OFFSETS = [-RAIL_GAP, RAIL_GAP]

// 背景（暗めのグレー）の上で、3 軸・平面・2 本の直線・交点が見分けられる色にする。
// w は 3 本目の軸なので、他のデモの z 軸と同じ青にする。
// 変換前の無限遠点は中立色、変換後の同次座標と交点は他のデモと同じ色にする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const W_COLOR = "#5ec8f2"
const SOURCE_COLOR = "#e8e8ee"
const TRANSFORMED_COLOR = "#ffc857"
const VANISHING_COLOR = "#f57fc4"
const RAIL_COLOR = "#b79cf5"
const PLANE_COLOR = "#8fa3bf"
const GUIDE_COLOR = "#9aa3b0"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * `(x'/w', y'/w', 1)` のような長いラベルもあるので、文字の幅を測って板の横幅を決める
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
  const material = new SpriteMaterial({ map: texture, transparent: true })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/** 1 本の軸を、原点をまたぐ直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る */
const createAxis = (name: string, color: string, direction: Vector3) => {
  const group = new Group()

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-AXIS_LENGTH),
    direction.clone().multiplyScalar(AXIS_LENGTH)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(AXIS_LENGTH)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(AXIS_LENGTH + LABEL_OFFSET)
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

/** 位置を示す球 */
const createPoint = (color: ColorRepresentation, radius: number) => {
  const geometry = new SphereGeometry(radius, 16, 12)
  const material = new MeshBasicMaterial({ color })

  return {
    mesh: new Mesh(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 原点を通る 1 本の直線。両端を毎フレーム書き換える */
const createLineThroughOrigin = (color: ColorRepresentation) => {
  const position = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color })
  const end = new Vector3()

  return {
    object: new LineSegments(geometry, material),
    /** 渡された向きへ、原点から正負どちらへも伸ばす */
    setDirection: (direction: Vector3) => {
      end.copy(direction).normalize().multiplyScalar(RAY_HALF)
      position.setXYZ(0, -end.x, -end.y, -end.z)
      position.setXYZ(1, end.x, end.y, end.z)
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 平面上に描く直線。像が平面の外へ出た区間は描かないので、
 * 毎フレーム書き込んだ分だけを描画範囲に指定する
 */
const createClippedLines = (maxSegments: number, color: ColorRepresentation) => {
  const position = new Float32BufferAttribute(new Float32Array(maxSegments * 2 * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color })
  let vertex = 0

  return {
    object: new LineSegments(geometry, material),
    /** このフレームの書き込みを始める */
    begin: () => {
      vertex = 0
    },
    addSegment: (from: Vector3, to: Vector3) => {
      position.setXYZ(vertex++, from.x, from.y, from.z)
      position.setXYZ(vertex++, to.x, to.y, to.z)
    },
    /** 書き込んだ分だけを描く */
    end: () => {
      position.needsUpdate = true
      geometry.setDrawRange(0, vertex)
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** Tweakpane に読み取り専用で出す値。-0.00 と出ないように 0 付近は丸める */
const formatValue = (value: number) => (Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2))

const formatPoint = (...values: number[]) => `(${values.map(formatValue).join(", ")})`

export const createPointAtInfinityScene = ({ scene, params }: SceneContext) => {
  // 同次座標 (x, y, w) の w を 3 本目の軸として立てる。
  // Three.js の x・y をそのまま平面の x・y にあて、z を w にあてると、
  // w = 1 の平面は x が右・y が上のまま読める板になる
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  const wAxis = createAxis("w", W_COLOR, W_DIRECTION)
  scene.add(xAxis.object, yAxis.object, wAxis.object)

  // 正規化した同次座標が並ぶ w = 1 の平面。
  // 奥の直線や点を隠さないよう、薄く塗って深度は書かない
  const planeGeometry = new PlaneGeometry(PLANE_HALF * 2, PLANE_HALF * 2)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLANE_OPACITY,
    depthWrite: false
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  plane.position.z = 1
  scene.add(plane)

  // 平面の目盛り。交点や直線が平面のどこにあるかを読めるようにする
  const gridPoints: Vector3[] = []
  const gridLineCount = (PLANE_HALF * 2) / PLANE_GRID_STEP
  for (let i = 0; i <= gridLineCount; i++) {
    const offset = -PLANE_HALF + i * PLANE_GRID_STEP
    gridPoints.push(new Vector3(offset, -PLANE_HALF, 1), new Vector3(offset, PLANE_HALF, 1))
    gridPoints.push(new Vector3(-PLANE_HALF, offset, 1), new Vector3(PLANE_HALF, offset, 1))
  }
  const gridGeometry = new BufferGeometry().setFromPoints(gridPoints)
  const gridMaterial = new LineBasicMaterial({
    color: PLANE_COLOR,
    transparent: true,
    opacity: GRID_OPACITY,
    depthWrite: false
  })
  scene.add(new LineSegments(gridGeometry, gridMaterial))

  const planeLabel = createLabel("w = 1", PLANE_COLOR, VALUE_LABEL_HEIGHT)
  planeLabel.sprite.position.set(PLANE_HALF - 0.5, PLANE_HALF + 0.28, 1)
  scene.add(planeLabel.sprite)

  // 同次座標が並ぶ直線は、必ずこの原点を通る
  const origin = createPoint(GUIDE_COLOR, ORIGIN_RADIUS)
  scene.add(origin.mesh)

  // 無限遠点 (x, y, 0) が並ぶ直線と、それに行列を掛けた (x', y', w') が並ぶ直線
  const sourceLine = createLineThroughOrigin(SOURCE_COLOR)
  const transformedLine = createLineThroughOrigin(TRANSFORMED_COLOR)
  scene.add(sourceLine.object, transformedLine.object)

  // 変換後の直線が w = 1 の平面と交わる点。w' が 0 のときは交点が無いので描かない
  const intersectionPoint = createPoint(VANISHING_COLOR, POINT_RADIUS)
  scene.add(intersectionPoint.mesh)

  // 平面上の平行な 2 直線の像。平面の外へ出た区間は描かない
  const rails = createClippedLines(RAIL_OFFSETS.length * RAIL_SAMPLES, RAIL_COLOR)
  scene.add(rails.object)

  const sourceLabel = createLabel("(x, y, 0)", SOURCE_COLOR, VALUE_LABEL_HEIGHT)
  const transformedLabel = createLabel("(x', y', w')", TRANSFORMED_COLOR, VALUE_LABEL_HEIGHT)
  const intersectionLabel = createLabel("(x'/w', y'/w', 1)", VANISHING_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(sourceLabel.sprite, transformedLabel.sprite, intersectionLabel.sprite)

  const matrix = new Matrix3()
  const direction = new Vector3()
  const perpendicular = new Vector3()
  const transformed = new Vector3()
  const vanishing = new Vector3()
  const anchor = new Vector3()
  const labelDirection = new Vector3()
  const railSource = new Vector3()
  const railCenter = new Vector3()
  const railProbe = new Vector3()
  const railStep = new Vector3()
  const railPoint = new Vector3()
  const railPrevious = new Vector3()

  /** 同次座標 (x, y, w) を w で割って、w = 1 の平面上の点に戻す */
  const normalize = (homogeneous: Vector3, target: Vector3) =>
    target.set(homogeneous.x / homogeneous.z, homogeneous.y / homogeneous.z, 1)

  /** 同次座標に行列を掛けて (x', y', w') を得たあと、w' で割って w = 1 の平面へ戻す */
  const project = (homogeneous: Vector3, target: Vector3) => {
    target.copy(homogeneous).applyMatrix3(matrix)
    return normalize(target, target)
  }

  /** w = 1 の平面に収まっているか */
  const isOnPlane = (point: Vector3) =>
    Math.abs(point.x) <= PLANE_HALF && Math.abs(point.y) <= PLANE_HALF

  /** ラベルを、直線上の決まった距離のところへ置く */
  const placeLineLabel = (
    label: ReturnType<typeof createLabel>,
    lineDirection: Vector3,
    verticalSign: number
  ) => {
    anchor.copy(lineDirection).normalize().multiplyScalar(LABEL_RADIUS)
    label.sprite.position.set(
      anchor.x,
      anchor.y + verticalSign * (LABEL_GAP + label.sprite.scale.y / 2),
      anchor.z
    )
  }

  return {
    update: () => {
      const { p, q, angle } = params

      // 射影変換の行列。上の 2 行は単位行列のままにして、
      // 最下行 (p q r) がもたらす w' の変化だけが見えるようにする
      // prettier-ignore
      matrix.set(
        1, 0, 0,
        0, 1, 0,
        p, q, 1
      )

      // 無限遠点は位置ではなく向きで決まる点。向き (dx, dy) の無限遠点は、
      // w を 0 にした (dx, dy, 0) と書ける。
      // この点の定数倍が並ぶ直線は w = 0 の平面に寝ているので、
      // w = 1 の平面と平行で、どこまで伸ばしても交わらない
      const radians = (angle * Math.PI) / 180
      direction.set(Math.cos(radians), Math.sin(radians), 0)
      sourceLine.setDirection(direction)

      // 行列を掛けた (x', y', w')。w' = p dx + q dy なので、
      // 最下行が (0 0 1) のアフィン変換では w' が 0 のままだが、
      // 射影変換では 0 でない値になり、直線が傾いて w = 1 の平面へ届く
      transformed.copy(direction).applyMatrix3(matrix)
      transformedLine.setDirection(transformed)

      // w' が 0 でなければ、w' で割った点が平面上に現れる（無限遠点が写った先の有限の点）
      const hasIntersection = Math.abs(transformed.z) > ZERO_W
      if (hasIntersection) normalize(transformed, vanishing)
      const showsIntersection = hasIntersection && isOnPlane(vanishing)
      intersectionPoint.mesh.visible = showsIntersection
      intersectionLabel.sprite.visible = showsIntersection
      if (showsIntersection) {
        intersectionPoint.mesh.position.copy(vanishing)
        intersectionLabel.sprite.position.set(
          vanishing.x,
          vanishing.y - (LABEL_GAP + intersectionLabel.sprite.scale.y / 2),
          vanishing.z
        )
      }

      // 変換前は平行な 2 直線を、向きに垂直な方向へ ±RAIL_GAP ずらして作る。
      // 像も直線なので、その直線を刻んで平面の内側にある区間だけを結ぶ。
      // 変換前は平行でも、像はどちらも上の交点を通る
      perpendicular.set(-direction.y, direction.x, 0)
      rails.begin()
      RAIL_OFFSETS.forEach((offset) => {
        // 直線が通る点。w = 1 の平面上にあるので、同次座標では (x, y, 1)
        railSource.copy(perpendicular).multiplyScalar(offset).setZ(1)
        project(railSource, railCenter)

        // 少しだけ進めた点の像との差から、像の直線の向きを得る
        railSource.addScaledVector(direction, RAIL_PROBE)
        project(railSource, railProbe)
        railStep.copy(railProbe).sub(railCenter).normalize()

        let previousInside = false
        for (let i = 0; i <= RAIL_SAMPLES; i++) {
          const distance = -RAIL_REACH + (2 * RAIL_REACH * i) / RAIL_SAMPLES
          railPoint.copy(railStep).multiplyScalar(distance).add(railCenter)
          const currentInside = isOnPlane(railPoint)
          if (currentInside && previousInside) rails.addSegment(railPrevious, railPoint)
          railPrevious.copy(railPoint)
          previousInside = currentInside
        }
      })
      rails.end()

      // ラベルは、それぞれの直線の上に置く。w' が 0 に近いと 2 本の直線が重なるので、
      // 変換前は下・変換後は上へずらして読めるようにする
      placeLineLabel(sourceLabel, direction, -1)
      // w' が負のときは直線が下へ向くので、ラベルは w が正の側に置く
      labelDirection.copy(transformed)
      if (transformed.z < 0) labelDirection.negate()
      placeLineLabel(transformedLabel, labelDirection, 1)

      // Tweakpane 側に読み取り専用で出す値
      params.transformedW = formatValue(transformed.z)
      if (!hasIntersection) {
        params.intersection = "なし（無限遠点のまま）"
      } else {
        const outside = isOnPlane(vanishing) ? "" : " 平面の外"
        params.intersection = `${formatPoint(vanishing.x, vanishing.y)}${outside}`
      }
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      wAxis.dispose()
      origin.dispose()
      sourceLine.dispose()
      transformedLine.dispose()
      intersectionPoint.dispose()
      rails.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        gridGeometry,
        gridMaterial,
        planeLabel.texture,
        planeLabel.material,
        sourceLabel.texture,
        sourceLabel.material,
        transformedLabel.texture,
        transformedLabel.material,
        intersectionLabel.texture,
        intersectionLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
