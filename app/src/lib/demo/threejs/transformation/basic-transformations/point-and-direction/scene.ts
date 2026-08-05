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
  MathUtils,
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
export type PointAndDirectionParams = {
  /** 平行移動の移動量 */
  tx: number
  ty: number
  /** 点 P から点 Q へ向かう向き（度） */
  angle: number
  /** 点 P から点 Q までの距離 */
  length: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  point: string
  direction: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PointAndDirectionParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2.4

/** 矢印の先端（円錐）の大きさ。軸の矢印と、方向ベクトルの矢印で共通にする */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/**
 * w = 1 の平面に置いた矢印の不透明度。
 * 主役は w = 0 の平面に寝た方向ベクトルなので、同じ矢印の置き場所違いだとわかる程度に薄くする
 */
const ARROW_OPACITY = 0.45

/** w = 1 と w = 0 の平面の 1 辺の半分の長さ */
const PLANE_HALF = 2

/** 平面の塗りの不透明度。奥の点や矢印が透けて見える程度に抑える */
const PLANE_OPACITY = 0.12

/**
 * 平行移動する前の点 P の位置。
 * 移動量・向き・距離をどの端に振っても、移動後の 2 点が w = 1 の平面に収まる位置にする
 */
const P_X = -0.5
const P_Y = -0.4

/**
 * 点を表す球の半径。
 * 主役は方向ベクトルの矢印なので、矢じりと張り合わないよう控えめな大きさにする
 */
const POINT_RADIUS = 0.05

/** 原点を示す球の半径。位置そのものではなく矢印の起点なので、点よりさらに小さくする */
const ORIGIN_RADIUS = 0.035

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 点の名前を書いたラベルの高さ。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_HEIGHT = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルを、それが指す点から離す距離 */
const LABEL_GAP = 0.14

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const W_DIRECTION = new Vector3(0, 0, 1)

/** 方向ベクトルを表す矢印の始点 */
const ORIGIN = new Vector3(0, 0, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・2 枚の平面・点・方向ベクトルが見分けられる色にする。
// w は 3 本目の軸なので、他のデモの z 軸と同じ青にする。
// 位置を表す点は中立色、向きを表す方向ベクトルだけを目立つ色にする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const W_COLOR = "#5ec8f2"
const POINT_COLOR = "#e8e8ee"
const DIRECTION_COLOR = "#f57fc4"
const PLANE_COLOR = "#8fa3bf"
const GUIDE_COLOR = "#9aa3b0"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * `Q − P` のような幅の異なるラベルがあるので、文字の幅を測って板の横幅を決める
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

/** 位置を示す球。同じ色・大きさの球はジオメトリとマテリアルを共有する */
const createPoints = (count: number, color: ColorRepresentation, radius: number) => {
  const geometry = new SphereGeometry(radius, 16, 12)
  const material = new MeshBasicMaterial({ color })
  const meshes = Array.from({ length: count }, () => new Mesh(geometry, material))

  return {
    objects: meshes,
    setPositions: (positions: Vector3[]) => {
      meshes.forEach((mesh, index) => mesh.position.copy(positions[index]))
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 始点から終点へ向かう矢印。軸と違って両端が動くので、毎フレーム書き換える */
const createArrow = (color: ColorRepresentation, opacity = 1) => {
  const transparent = opacity < 1

  const shaftPosition = new Float32BufferAttribute(new Float32Array(6), 3)
  const shaftGeometry = new BufferGeometry().setAttribute("position", shaftPosition)
  const shaftMaterial = new LineBasicMaterial({ color, transparent, opacity })

  const headGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const headMaterial = new MeshBasicMaterial({ color, transparent, opacity })
  const head = new Mesh(headGeometry, headMaterial)

  const group = new Group()
  group.add(new LineSegments(shaftGeometry, shaftMaterial), head)

  const direction = new Vector3()
  const shaftEnd = new Vector3()

  return {
    object: group,
    setEnds: (from: Vector3, to: Vector3) => {
      direction.copy(to).sub(from).normalize()

      // 円錐の底面が線の先端に来るよう、矢印の高さのぶん手前で線を止める
      shaftEnd.copy(to).addScaledVector(direction, -ARROW_HEIGHT)
      shaftPosition.setXYZ(0, from.x, from.y, from.z)
      shaftPosition.setXYZ(1, shaftEnd.x, shaftEnd.y, shaftEnd.z)
      shaftPosition.needsUpdate = true

      // ConeGeometry の原点は円錐の中心なので、半分ぶん戻した位置に置く
      head.position.copy(to).addScaledVector(direction, -ARROW_HEIGHT / 2)
      head.quaternion.setFromUnitVectors(CONE_UP, direction)
    },
    dispose: () => {
      const disposables = [shaftGeometry, shaftMaterial, headGeometry, headMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** w の値を書いたラベル付きの平面。奥の点や矢印を隠さないよう、薄く塗って深度は書かない */
const createPlane = (w: number, name: string) => {
  const geometry = new PlaneGeometry(PLANE_HALF * 2, PLANE_HALF * 2)
  const material = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLANE_OPACITY,
    depthWrite: false
  })
  const mesh = new Mesh(geometry, material)
  mesh.position.z = w

  const label = createLabel(name, PLANE_COLOR, VALUE_LABEL_HEIGHT)
  label.sprite.position.set(PLANE_HALF - 0.5, PLANE_HALF + 0.28, w)

  const group = new Group()
  group.add(mesh, label.sprite)

  return {
    object: group,
    dispose: () => {
      const disposables = [geometry, material, label.texture, label.material]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** Tweakpane に読み取り専用で出す座標の文字列。-0.00 と出ないように 0 付近は丸める */
const formatPoint = (...values: number[]) =>
  `(${values.map((value) => (Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2))).join(", ")})`

export const createPointAndDirectionScene = ({ scene, params }: SceneContext) => {
  // 同次座標 (x, y, w) の w を 3 本目の軸として立てる。
  // Three.js の x・y をそのまま平面の x・y にあて、z を w にあてると、
  // w = 1 の平面は x が右・y が上のまま読める板になる
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  const wAxis = createAxis("w", W_COLOR, W_DIRECTION)
  scene.add(xAxis.object, yAxis.object, wAxis.object)

  // 位置を表す点が乗る w = 1 の平面と、向きを表す方向ベクトルが寝ている w = 0 の平面
  const pointPlane = createPlane(1, "w = 1")
  const directionPlane = createPlane(0, "w = 0")
  scene.add(pointPlane.object, directionPlane.object)

  // 方向ベクトルの矢印が発つ原点
  const origin = createPoints(1, GUIDE_COLOR, ORIGIN_RADIUS)
  origin.setPositions([ORIGIN])
  scene.add(...origin.objects)

  // 平行移動したあとの 2 点 P・Q と、P から Q へ向かう矢印。
  // 矢印は方向ベクトルと同じ色にして、同じ矢印を w = 1 の平面に置いたものだと読めるようにする
  const points = createPoints(2, POINT_COLOR, POINT_RADIUS)
  const pointArrow = createArrow(DIRECTION_COLOR, ARROW_OPACITY)
  scene.add(...points.objects, pointArrow.object)

  // 2 点の差として得られる方向ベクトル。w = 0 なので、原点から w = 0 の平面に寝た矢印になる。
  // 先端は矢じりが示すので、点は置かない
  const differenceArrow = createArrow(DIRECTION_COLOR)
  scene.add(differenceArrow.object)

  const pLabel = createLabel("P", POINT_COLOR, VALUE_LABEL_HEIGHT)
  const qLabel = createLabel("Q", POINT_COLOR, VALUE_LABEL_HEIGHT)
  const differenceLabel = createLabel("Q − P", DIRECTION_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(pLabel.sprite, qLabel.sprite, differenceLabel.sprite)

  const matrix = new Matrix3()
  const sourceP = new Vector3(P_X, P_Y, 1)
  const sourceQ = new Vector3()
  const difference = new Vector3()
  const p = new Vector3()
  const q = new Vector3()
  const movedDifference = new Vector3()

  return {
    update: () => {
      const { tx, ty, angle, length } = params

      // 平行移動の行列。移動量は最後の列に置かれ、掛け算のときに w と掛け合わされる
      // prettier-ignore
      matrix.set(
        1, 0, tx,
        0, 1, ty,
        0, 0, 1
      )

      // 平行移動する前の 2 点。どちらも w = 1 の平面上の点で、Q だけを向きと長さで動かす
      const radians = MathUtils.degToRad(angle)
      sourceQ.set(P_X + length * Math.cos(radians), P_Y + length * Math.sin(radians), 1)

      // 2 点の差を取ると、w は 1 どうしで打ち消し合って 0 になる。これが方向ベクトル
      difference.copy(sourceQ).sub(sourceP)

      // 点にも方向ベクトルにも、まったく同じ行列を掛ける
      p.copy(sourceP).applyMatrix3(matrix)
      q.copy(sourceQ).applyMatrix3(matrix)
      // w = 0 の方向ベクトルでは tx・ty に 0 が掛かって消えるので、差はそのまま残る
      movedDifference.copy(difference).applyMatrix3(matrix)

      points.setPositions([p, q])
      pointArrow.setEnds(p, q)
      differenceArrow.setEnds(ORIGIN, movedDifference)

      // ラベルは、それが指す点の上か下に置く。
      // P だけ下に置いて、矢印とぶつからないようにする
      pLabel.sprite.position.set(p.x, p.y - (LABEL_GAP + pLabel.sprite.scale.y / 2), 1)
      qLabel.sprite.position.set(q.x, q.y + LABEL_GAP + qLabel.sprite.scale.y / 2, 1)
      differenceLabel.sprite.position.set(
        movedDifference.x,
        movedDifference.y + LABEL_GAP + differenceLabel.sprite.scale.y / 2,
        0
      )

      // Tweakpane 側に読み取り専用で出す値。
      // 移動量を動かすと上だけが変わり、下は変わらない
      params.point = formatPoint(p.x, p.y, p.z)
      params.direction = formatPoint(movedDifference.x, movedDifference.y, movedDifference.z)
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      wAxis.dispose()
      pointPlane.dispose()
      directionPlane.dispose()
      origin.dispose()
      points.dispose()
      pointArrow.dispose()
      differenceArrow.dispose()
      const disposables = [
        pLabel.texture,
        pLabel.material,
        qLabel.texture,
        qLabel.material,
        differenceLabel.texture,
        differenceLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
