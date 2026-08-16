import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MathUtils,
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
export type StandardToGeneralParams = {
  /** 平行移動量 */
  tx: number
  ty: number
  /** 回転角（度） */
  angleDeg: number
  /** scene.ts が計算して書き戻す、一般形の係数 */
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: StandardToGeneralParams
}

/** 標準形の楕円の、x 軸方向・y 軸方向の半径 */
const RADIUS_X = 1.3
const RADIUS_Y = 0.7

/** 楕円を描くときに媒介変数を刻む数 */
const ELLIPSE_SEGMENTS = 180

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2.4

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** 軸に刻む目盛りの位置と、目盛り線が軸からはみ出す長さ */
const TICK_VALUES = [1, 2]
const TICK_SIZE = 0.07

/** 移動後の楕円の中心を表す球の半径 */
const CENTER_RADIUS = 0.055

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/**
 * 標準形の楕円・移動後の楕円を軸より手前に置くための z。
 * どちらも軸と重なる位置を通るので、少しだけ前に出して軸の線に負けないようにする
 */
const STANDARD_Z = 0.001
const MOVED_Z = 0.002

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、2 軸・標準形の楕円・移動後の楕円・その対称軸が見分けられる色にする。
// 軸の色は、この記事のほかのデモや座標系のデモと揃える。
// 標準形の楕円は「移動前の位置」を示す控えめな存在なので、移動後より淡くする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const TICK_COLOR = "#7a8496"
const STANDARD_COLOR = "#8fa3bf"
const MOVED_COLOR = "#ffc857"
const SYMMETRY_COLOR = "#f57fc4"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 書体によって字幅が変わるので、文字の幅を測って板の横幅を決める
 */
const createLabel = (text: string, color: string) => {
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる線が
    // ラベルの矩形の形に欠け、文字に黒い下敷きが付いたように見える
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((AXIS_LABEL_HEIGHT * canvas.width) / canvas.height, AXIS_LABEL_HEIGHT, 1)

  return { sprite, texture, material }
}

/** 1 本の軸を、原点をまたぐ直線・目盛り・正の向きを指す矢印・軸名のラベルでまとめて作る */
const createAxis = (name: string, color: string, direction: Vector3) => {
  const group = new Group()

  const linePoints = [
    direction.clone().multiplyScalar(-AXIS_LENGTH),
    direction.clone().multiplyScalar(AXIS_LENGTH)
  ]
  const lineGeometry = new BufferGeometry().setFromPoints(linePoints)
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  // 目盛り。平行移動量を図の上で読み取る手がかりになる。軸と直交する向きへ短く伸ばす
  const across = new Vector3(-direction.y, direction.x, 0)
  const tickPoints: Vector3[] = []
  for (const value of TICK_VALUES) {
    for (const sign of [1, -1]) {
      const base = direction.clone().multiplyScalar(value * sign)
      tickPoints.push(
        base.clone().addScaledVector(across, TICK_SIZE),
        base.clone().addScaledVector(across, -TICK_SIZE)
      )
    }
  }
  const tickGeometry = new BufferGeometry().setFromPoints(tickPoints)
  const tickMaterial = new LineBasicMaterial({ color: TICK_COLOR })
  group.add(new LineSegments(tickGeometry, tickMaterial))

  // ConeGeometry は +y を向いているので、軸の正の向きへ回してから先端に置く
  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const arrowMaterial = new MeshBasicMaterial({ color })
  const arrow = new Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction).multiplyScalar(AXIS_LENGTH)
  arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
  group.add(arrow)

  const label = createLabel(name, color)
  label.sprite.position.copy(direction).multiplyScalar(AXIS_LENGTH + LABEL_OFFSET)
  group.add(label.sprite)

  return {
    object: group,
    dispose: () => {
      const disposables = [
        lineGeometry,
        lineMaterial,
        tickGeometry,
        tickMaterial,
        arrowGeometry,
        arrowMaterial,
        label.texture,
        label.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createStandardToGeneralScene = ({ scene, params }: SceneContext) => {
  // 平面の図なので、Three.js の既定の向き（x が右・y が上）のまま xy 平面を正面から見る
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  scene.add(xAxis.object, yAxis.object)

  // 標準形の楕円。x 軸方向の半径が RADIUS_X、y 軸方向の半径が RADIUS_Y になる
  const ellipsePoints: Vector3[] = []
  for (let i = 0; i < ELLIPSE_SEGMENTS; i++) {
    const t = (i / ELLIPSE_SEGMENTS) * Math.PI * 2
    ellipsePoints.push(new Vector3(RADIUS_X * Math.cos(t), RADIUS_Y * Math.sin(t), 0))
  }
  const ellipseGeometry = new BufferGeometry().setFromPoints(ellipsePoints)

  // 移動前の位置。動かした楕円と同じ形であることが分かるよう、置いたまま淡く残す
  const standardMaterial = new LineBasicMaterial({ color: STANDARD_COLOR })
  const standardEllipse = new LineLoop(ellipseGeometry, standardMaterial)
  standardEllipse.position.z = STANDARD_Z
  scene.add(standardEllipse)

  // 移動後の楕円。同じ楕円をこのグループごと回して動かす
  const movedGroup = new Group()
  scene.add(movedGroup)

  const movedMaterial = new LineBasicMaterial({ color: MOVED_COLOR })
  movedGroup.add(new LineLoop(ellipseGeometry, movedMaterial))

  // 楕円の対称軸。座標軸に重なっているかどうかで、向きの違いが読み取れる
  const symmetryGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-RADIUS_X, 0, 0),
    new Vector3(RADIUS_X, 0, 0),
    new Vector3(0, -RADIUS_Y, 0),
    new Vector3(0, RADIUS_Y, 0)
  ])
  const symmetryMaterial = new LineBasicMaterial({ color: SYMMETRY_COLOR })
  movedGroup.add(new LineSegments(symmetryGeometry, symmetryMaterial))

  const centerGeometry = new SphereGeometry(CENTER_RADIUS, 16, 12)
  const centerMaterial = new MeshBasicMaterial({ color: SYMMETRY_COLOR })
  movedGroup.add(new Mesh(centerGeometry, centerMaterial))

  return {
    update: () => {
      const angle = MathUtils.degToRad(params.angleDeg)

      // 標準形の楕円を、原点まわりに回してから (tx, ty) だけ動かす
      movedGroup.rotation.z = angle
      movedGroup.position.set(params.tx, params.ty, MOVED_Z)

      // 標準形 x²/A² + y²/B² = 1 の両辺に A²B² を掛けた B²x² + A²y² - A²B² = 0 を出発点に、
      // 移動後の点を標準形の座標へ戻してから代入すると、一般形の 6 つの係数が求まる
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const squareX = RADIUS_X * RADIUS_X
      const squareY = RADIUS_Y * RADIUS_Y

      // 2 次の項の係数は回転だけで決まる。b は sin と cos の積なので、回転させたときだけ 0 でなくなる
      const a = squareY * cos * cos + squareX * sin * sin
      const b = 2 * cos * sin * (squareY - squareX)
      const c = squareY * sin * sin + squareX * cos * cos

      // 1 次の項と定数項には平行移動量が入る。動かさなければ d と e は 0 のまま
      params.a = a
      params.b = b
      params.c = c
      params.d = -2 * a * params.tx - b * params.ty
      params.e = -2 * c * params.ty - b * params.tx
      params.f =
        a * params.tx * params.tx +
        b * params.tx * params.ty +
        c * params.ty * params.ty -
        squareX * squareY
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      const disposables = [
        ellipseGeometry,
        standardMaterial,
        movedMaterial,
        symmetryGeometry,
        symmetryMaterial,
        centerGeometry,
        centerMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
