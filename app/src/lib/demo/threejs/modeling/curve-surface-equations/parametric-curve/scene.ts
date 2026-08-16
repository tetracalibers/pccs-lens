import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** 曲線の種類。らせんは、円と同じ x・y に z を足したもの */
type CurveKind = "circle" | "helix"

/** Tweakpane で操作するパラメータ */
export type ParametricCurveParams = {
  curve: CurveKind
  /** パラメータ t の下限・上限（ラジアン） */
  tStart: number
  tEnd: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  endPoint: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ParametricCurveParams
}

const TWO_PI = Math.PI * 2

/** 円・らせんの半径 */
const RADIUS = 1

/** らせんが t = 2π までに上がる高さ */
const HELIX_RISE = 1.6

/** t が 1 増えるあたりの上がり幅 */
const HELIX_PITCH = HELIX_RISE / TWO_PI

/** t を刻む数。この数だけ区間を作るので、点は 1 つ多くなる */
const SAMPLE_COUNT = 72

/** 点の大きさと、t の上限での点を示す球の半径 */
const POINT_SIZE = 0.07
const MARKER_RADIUS = 0.075

/** x 軸・y 軸を、原点から正負どちらへも伸ばす長さ */
const PANEL_HALF = 1.5

/** z 軸を、xy 平面から上へ伸ばす長さと、下へ出す長さ */
const HEIGHT_AXIS_UP = 2
const HEIGHT_AXIS_DOWN = 0.25

/** xy 平面を示す正方形の 1 辺と、その塗りの不透明度 */
const GROUND_SIZE = PANEL_HALF * 2
const GROUND_OPACITY = 0.14

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.055
const ARROW_HEIGHT = 0.2

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.3

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.28

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const Z_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、軸・曲線の点・t の上限での点が見分けられる色にする。
// 軸の色は、この記事のほかのデモと揃える
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const CURVE_COLOR = "#ffc857"
const MARKER_COLOR = "#f57fc4"
const PLANE_COLOR = "#8fa3bf"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 軸名は 1 文字だが、書体によって字幅が変わるので、文字の幅を測って板の横幅を決める
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる半透明の面や線が
    // ラベルの矩形の形に欠け、文字に黒い下敷きが付いたように見える
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/**
 * 1 本の軸を、直線・正の向きを指す矢印・軸名のラベルの 3 点セットで作る。
 * z 軸は下へ伸ばす意味が薄いので、正負で長さを変えられるようにしておく
 */
const createAxis = (
  name: string,
  color: string,
  direction: Vector3,
  forward: number,
  backward = forward
) => {
  const group = new Group()

  const lineGeometry = new BufferGeometry().setFromPoints([
    direction.clone().multiplyScalar(-backward),
    direction.clone().multiplyScalar(forward)
  ])
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(forward)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color, AXIS_LABEL_HEIGHT)
  label.sprite.position.copy(direction).multiplyScalar(forward + LABEL_OFFSET)
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

/** パラメータ t を代入して、曲線上の点を求める。らせんは円と同じ x・y に z を足したもの */
const evaluate = (curve: CurveKind, t: number, target: Vector3) => {
  const x = RADIUS * Math.cos(t)
  const y = RADIUS * Math.sin(t)
  const z = curve === "helix" ? HELIX_PITCH * t : 0
  return target.set(x, y, z)
}

/** Tweakpane に読み取り専用で出す座標の文字列。-0.00 と出ないように 0 付近は丸める */
const formatPoint = (...values: number[]) =>
  `(${values.map((value) => (Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2))).join(", ")})`

export const createParametricCurveScene = ({ scene, params }: SceneContext) => {
  // 記事と同じ座標の書き方（z が高さ）をそのまま使えるよう、グループごと寝かせて z 軸を上に向ける
  const group = new Group()
  group.rotation.x = -Math.PI / 2
  scene.add(group)

  const axes = [
    createAxis("x", X_COLOR, X_DIRECTION, PANEL_HALF),
    createAxis("y", Y_COLOR, Y_DIRECTION, PANEL_HALF),
    createAxis("z", Z_COLOR, Z_DIRECTION, HEIGHT_AXIS_UP, HEIGHT_AXIS_DOWN)
  ]
  group.add(...axes.map((axis) => axis.object))

  // xy 平面。円がこの平面に収まること、らせんがここから離れていくことを読み取る足場になる
  const groundGeometry = new PlaneGeometry(GROUND_SIZE, GROUND_SIZE)
  const groundMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: GROUND_OPACITY,
    // 面より奥にあるものを薄く覆いたいだけなので、深度は比較するが書かない
    depthWrite: false
  })
  group.add(new Mesh(groundGeometry, groundMaterial))

  // t を等間隔に刻んで代入した点。曲線の種類が変わっても点の数は同じなので、座標だけ書き換える
  const positions = new Float32BufferAttribute(new Float32Array((SAMPLE_COUNT + 1) * 3), 3)
  const curveGeometry = new BufferGeometry().setAttribute("position", positions)
  const curveMaterial = new PointsMaterial({ color: CURVE_COLOR, size: POINT_SIZE })
  group.add(new Points(curveGeometry, curveMaterial))

  // t の上限を代入して得られる点。刻みに乗っていない t でも、計算だけで求まる
  const markerGeometry = new SphereGeometry(MARKER_RADIUS, 16, 12)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  group.add(marker)

  const point = new Vector3()

  // 曲線の種類が変わったときだけ点を作り直す（範囲を変えただけでは作り直さない）
  let builtCurve: CurveKind | null = null

  return {
    update: () => {
      if (params.curve !== builtCurve) {
        builtCurve = params.curve
        for (let i = 0; i <= SAMPLE_COUNT; i++) {
          evaluate(builtCurve, (i / SAMPLE_COUNT) * TWO_PI, point)
          positions.setXYZ(i, point.x, point.y, point.z)
        }
        positions.needsUpdate = true
      }

      // 下限と上限を入れ替えても壊れないよう、小さいほうを始まりとして扱う
      const lower = Math.min(params.tStart, params.tEnd)
      const upper = Math.max(params.tStart, params.tEnd)

      // 刻んだ点のうち、範囲に入るものだけを描く
      const first = Math.ceil((lower / TWO_PI) * SAMPLE_COUNT)
      const last = Math.floor((upper / TWO_PI) * SAMPLE_COUNT)
      curveGeometry.setDrawRange(first, Math.max(0, last - first + 1))

      evaluate(builtCurve, upper, point)
      marker.position.copy(point)

      // Tweakpane 側に読み取り専用で出す値。t を 1 つ決めれば座標が 1 つ決まる
      params.endPoint = formatPoint(point.x, point.y, point.z)
    },
    dispose: () => {
      axes.forEach((axis) => axis.dispose())
      const disposables = [
        groundGeometry,
        groundMaterial,
        curveGeometry,
        curveMaterial,
        markerGeometry,
        markerMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
