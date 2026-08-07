import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
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
export type CylindricalCoordinatesParams = {
  /** xy 平面上での原点からの距離 */
  r: number
  /** xy 平面上での回転角（度） */
  thetaDeg: number
  /** z 軸方向の高さ */
  z: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: CylindricalCoordinatesParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** 座標が指す点を表す球の半径 */
const POINT_RADIUS = 0.05

/** 軸名のラベルの一辺（ワールド座標での大きさ） */
const AXIS_LABEL_SIZE = 0.34

/** 距離・角度・高さのラベルの一辺。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_SIZE = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** 距離・角度・高さのラベルを、それが指す線分や弧から離す距離 */
const LABEL_GAP = 0.24

/** r のラベルを線分上のどこに置くか（0 が原点、1 が線分の先） */
const RADIUS_LABEL_ALONG = 0.72

/** r のラベルを原点から離す最小距離。r が小さいときに θ のラベルへ寄るのを防ぐ */
const RADIUS_LABEL_MIN_DISTANCE = 0.85

/** ラベルの文字を描く canvas の一辺（テクスチャの解像度） */
const LABEL_TEXTURE_SIZE = 128

/** ラベルの書体。canvas の一辺に対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** xy 平面を示す正方形の一辺 */
const PLANE_SIZE = 4

/** 角度を表す扇形の半径 */
const SECTOR_RADIUS = 0.3

/** 扇形の弧の分割数 */
const ARC_SEGMENTS = 48

/** 角度を表す扇形の塗りの不透明度 */
const SECTOR_OPACITY = 0.35

/** 点が θ で描く円の分割数 */
const CIRCLE_SEGMENTS = 64

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const Z_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・距離・角度・高さがそれぞれ見分けられる色にする。
// θ は xy 平面上の回転角なので、球面座標系のデモの φ と同じピンクにして、
// 2 つのデモをまたいで同じ意味の角度が同じ色で出るようにする。
// 高さ z は z 軸に沿う量なので、z 軸と同系の水色にしたうえで、軸の線より淡くする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const RADIUS_COLOR = "#ffc857"
const THETA_COLOR = "#f57fc4"
const HEIGHT_COLOR = "#a3ddf7"
const GUIDE_COLOR = "#9aa3b0"
const PLANE_COLOR = "#8fa3bf"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字の大きさは板の一辺（size）で決まる。テクスチャの解像度は変えない
 */
const createLabel = (text: string, color: string, size: number) => {
  const canvas = document.createElement("canvas")
  canvas.width = LABEL_TEXTURE_SIZE
  canvas.height = LABEL_TEXTURE_SIZE

  const context = canvas.getContext("2d")
  if (context) {
    context.font = LABEL_FONT
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillStyle = color
    context.fillText(text, LABEL_TEXTURE_SIZE / 2, LABEL_TEXTURE_SIZE / 2)
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
  sprite.scale.setScalar(size)

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

  const label = createLabel(name, color, AXIS_LABEL_SIZE)
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

/**
 * 角度を表す扇形。原点と弧の分割点で三角形を敷き詰めた塗りに、外周の弧の線を重ねる。
 * 頂点数を固定しておき、角度が変わるたびに分割点の位置を書き換える。
 */
const createSector = (color: string) => {
  // 塗りの頂点は「原点 + 弧の分割点」。原点（0 番）は動かないので、書き換えるのは分割点だけ
  const fillPosition = new Float32BufferAttribute(new Float32Array((ARC_SEGMENTS + 2) * 3), 3)
  const fillIndex: number[] = []
  for (let i = 0; i < ARC_SEGMENTS; i++) fillIndex.push(0, i + 1, i + 2)
  const fillGeometry = new BufferGeometry().setAttribute("position", fillPosition).setIndex(fillIndex)
  const fillMaterial = new MeshBasicMaterial({
    color,
    side: DoubleSide,
    transparent: true,
    opacity: SECTOR_OPACITY,
    // 塗りが奥の線やラベルを隠さないよう深度は書かない
    depthWrite: false
  })

  // 外周の弧。塗りの縁をはっきりさせる
  const arcPosition = new Float32BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3)
  const arcGeometry = new BufferGeometry().setAttribute("position", arcPosition)
  const arcMaterial = new LineBasicMaterial({ color })

  return {
    objects: [new Mesh(fillGeometry, fillMaterial), new Line(arcGeometry, arcMaterial)],
    /** i 番目の分割点の位置を、塗りと弧の両方へ書き込む */
    setPoint: (i: number, x: number, y: number, z: number) => {
      fillPosition.setXYZ(i + 1, x, y, z)
      arcPosition.setXYZ(i, x, y, z)
    },
    markUpdated: () => {
      fillPosition.needsUpdate = true
      arcPosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [fillGeometry, fillMaterial, arcGeometry, arcMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createCylindricalCoordinatesScene = ({ scene, params }: SceneContext) => {
  // Three.js は既定で +y が画面の上を向く。円柱座標は z 軸を上にとって考えるので、
  // 図全体をまとめた Group を x 軸まわりに -90° 回し、z 軸が上に立つ向きで見せる。
  // この Group の中では x・y・z をそのまま使える（右手系のまま、y 軸が奥へ向く）
  const world = new Group()
  world.rotation.x = -Math.PI / 2
  scene.add(world)

  // xy 平面。r と θ で位置を決める平面（PlaneGeometry は既定で xy 平面にある）
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.07,
    // ごく薄い面なので、奥にあるラベルや線を隠さないよう深度は書かない
    depthWrite: false
  })
  world.add(new Mesh(planeGeometry, planeMaterial))

  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  const zAxis = createAxis("z", Z_COLOR, Z_DIRECTION)
  world.add(xAxis.object, yAxis.object, zAxis.object)

  // 円柱座標が指す点
  const pointGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const pointMaterial = new MeshBasicMaterial({ color: RADIUS_COLOR })
  const point = new Mesh(pointGeometry, pointMaterial)
  world.add(point)

  // xy 平面上で原点から伸びる線分。長さが r になる
  const radiusPosition = new Float32BufferAttribute(new Float32Array(6), 3)
  const radiusGeometry = new BufferGeometry().setAttribute("position", radiusPosition)
  const radiusMaterial = new LineBasicMaterial({ color: RADIUS_COLOR })
  world.add(new LineSegments(radiusGeometry, radiusMaterial))

  // 上の線分の先から点までを結ぶ縦の線分。長さがそのまま高さ z になる
  const heightPosition = new Float32BufferAttribute(new Float32Array(6), 3)
  const heightGeometry = new BufferGeometry().setAttribute("position", heightPosition)
  const heightMaterial = new LineBasicMaterial({ color: HEIGHT_COLOR })
  world.add(new LineSegments(heightGeometry, heightMaterial))

  // xy 平面上の位置を x 成分・y 成分の順にたどる折れ線。線分 2 本なので頂点は 4 個
  const guidePosition = new Float32BufferAttribute(new Float32Array(12), 3)
  const guideGeometry = new BufferGeometry().setAttribute("position", guidePosition)
  const guideMaterial = new LineBasicMaterial({ color: GUIDE_COLOR })
  world.add(new LineSegments(guideGeometry, guideMaterial))

  // θ だけを 1 周させたときに点が描く円。半径 r・高さ z は変わらないので、
  // z 軸を軸とする円柱の断面がそのまま見える
  const circlePosition = new Float32BufferAttribute(new Float32Array((CIRCLE_SEGMENTS + 1) * 3), 3)
  const circleGeometry = new BufferGeometry().setAttribute("position", circlePosition)
  const circleMaterial = new LineBasicMaterial({
    color: RADIUS_COLOR,
    transparent: true,
    opacity: 0.4
  })
  world.add(new Line(circleGeometry, circleMaterial))

  // x 軸から xy 平面上の線分までの角度 θ
  const thetaSector = createSector(THETA_COLOR)
  world.add(...thetaSector.objects)

  const radiusLabel = createLabel("r", RADIUS_COLOR, VALUE_LABEL_SIZE)
  const thetaLabel = createLabel("θ", THETA_COLOR, VALUE_LABEL_SIZE)
  const heightLabel = createLabel("z", HEIGHT_COLOR, VALUE_LABEL_SIZE)
  world.add(radiusLabel.sprite, thetaLabel.sprite, heightLabel.sprite)

  return {
    update: () => {
      const { r, z } = params
      const theta = MathUtils.degToRad(params.thetaDeg)

      // 円柱座標から直交座標への変換。xy 平面の部分は 2 次元の極座標そのままで、
      // 高さ z は測り方が変わらないのでそのまま受け渡される
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)

      point.position.set(x, y, z)

      radiusPosition.setXYZ(0, 0, 0, 0)
      radiusPosition.setXYZ(1, x, y, 0)
      radiusPosition.needsUpdate = true

      heightPosition.setXYZ(0, x, y, 0)
      heightPosition.setXYZ(1, x, y, z)
      heightPosition.needsUpdate = true

      // 原点 →（x だけ進む）→（y だけ進む）= xy 平面上の位置
      guidePosition.setXYZ(0, 0, 0, 0)
      guidePosition.setXYZ(1, x, 0, 0)
      guidePosition.setXYZ(2, x, 0, 0)
      guidePosition.setXYZ(3, x, y, 0)
      guidePosition.needsUpdate = true

      // 円は θ を 0 から 1 周させた軌跡。点の位置と同じ変換式で描ける
      for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
        const angle = (Math.PI * 2 * i) / CIRCLE_SEGMENTS
        circlePosition.setXYZ(i, r * Math.cos(angle), r * Math.sin(angle), z)
      }
      circlePosition.needsUpdate = true

      // θ の扇形は xy 平面上にあるので、半径を SECTOR_RADIUS に固定した同じ変換式で描ける
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const angle = theta * (i / ARC_SEGMENTS)
        thetaSector.setPoint(i, SECTOR_RADIUS * Math.cos(angle), SECTOR_RADIUS * Math.sin(angle), 0)
      }
      thetaSector.markUpdated()

      // θ のラベルは扇形の中間の向きへ、扇形より少し外に置く
      thetaLabel.sprite.position
        .set(Math.cos(theta / 2), Math.sin(theta / 2), 0)
        .multiplyScalar(SECTOR_RADIUS + LABEL_GAP)

      // r のラベルは線分の外寄りに置き、線分の向こう側（xy 平面上で θ が増える側）へ垂直にずらす。
      // 手前側は x 軸へ下ろした垂線（折れ線）が通っているので、そちらへ出すと重なる
      radiusLabel.sprite.position.set(
        x * RADIUS_LABEL_ALONG - Math.sin(theta) * LABEL_GAP,
        y * RADIUS_LABEL_ALONG + Math.cos(theta) * LABEL_GAP,
        0
      )
      // r が小さいと線分ごと原点付近に収まって θ のラベルに寄るので、外へ押し出す
      if (radiusLabel.sprite.position.length() < RADIUS_LABEL_MIN_DISTANCE) {
        radiusLabel.sprite.position.setLength(RADIUS_LABEL_MIN_DISTANCE)
      }

      // z のラベルは縦の線分の中点に置く。z 軸から遠ざかる向き（r の向き）へずらす
      heightLabel.sprite.position.set(
        x + Math.cos(theta) * LABEL_GAP,
        y + Math.sin(theta) * LABEL_GAP,
        z / 2
      )
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      zAxis.dispose()
      thetaSector.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        pointGeometry,
        pointMaterial,
        radiusGeometry,
        radiusMaterial,
        heightGeometry,
        heightMaterial,
        guideGeometry,
        guideMaterial,
        circleGeometry,
        circleMaterial,
        radiusLabel.texture,
        radiusLabel.material,
        thetaLabel.texture,
        thetaLabel.material,
        heightLabel.texture,
        heightLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
