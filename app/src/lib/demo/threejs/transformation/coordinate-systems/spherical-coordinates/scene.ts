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
export type SphericalCoordinatesParams = {
  /** 原点から点までの距離 */
  r: number
  /** z 軸からの傾き（度） */
  thetaDeg: number
  /** xy 平面上での回転角（度） */
  phiDeg: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: SphericalCoordinatesParams
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

/** 距離・角度のラベルの一辺。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_SIZE = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** 角度・距離のラベルを、それが指す弧や線分から離す距離 */
const LABEL_GAP = 0.24

/** 軸ラベルの文字を描く canvas の一辺（テクスチャの解像度） */
const LABEL_TEXTURE_SIZE = 128

/** ラベルの書体。canvas の一辺に対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** xy 平面を示す正方形の一辺 */
const PLANE_SIZE = 4

/** 角度を表す扇形の半径。θ と φ で揃える */
const SECTOR_RADIUS = 0.3

/** 弧の分割数 */
const ARC_SEGMENTS = 48

/** 角度を表す扇形の塗りの不透明度 */
const SECTOR_OPACITY = 0.35

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const Z_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・距離・2 つの角度がそれぞれ見分けられる色にする。
// θ は z 軸からの傾きなので、z 軸と同系の水色にして、軸の線より淡くして重なりを見分ける
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const RADIUS_COLOR = "#ffc857"
const THETA_COLOR = "#a3ddf7"
const PHI_COLOR = "#f57fc4"
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
  const material = new SpriteMaterial({ map: texture, transparent: true })
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
  const fillGeometry = new BufferGeometry()
    .setAttribute("position", fillPosition)
    .setIndex(fillIndex)
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

export const createSphericalCoordinatesScene = ({ scene, params }: SceneContext) => {
  // Three.js は既定で +y が画面の上を向く。球面座標は z 軸を上にとって考えるので、
  // 図全体をまとめた Group を x 軸まわりに -90° 回し、z 軸が上に立つ向きで見せる。
  // この Group の中では x・y・z をそのまま使える（右手系のまま、y 軸が奥へ向く）
  const world = new Group()
  world.rotation.x = -Math.PI / 2
  scene.add(world)

  // xy 平面。φ を測る平面であり、点を投影する先でもある（PlaneGeometry は既定で xy 平面にある）
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

  // 球面座標が指す点
  const pointGeometry = new SphereGeometry(POINT_RADIUS, 16, 12)
  const pointMaterial = new MeshBasicMaterial({ color: RADIUS_COLOR })
  const point = new Mesh(pointGeometry, pointMaterial)
  world.add(point)

  // 原点から点までの線分。長さが r になる
  const radiusPosition = new Float32BufferAttribute(new Float32Array(6), 3)
  const radiusGeometry = new BufferGeometry().setAttribute("position", radiusPosition)
  const radiusMaterial = new LineBasicMaterial({ color: RADIUS_COLOR })
  world.add(new LineSegments(radiusGeometry, radiusMaterial))

  // どちらも長さが r sinθ になる 2 本の線分。線分 2 本なので頂点は 4 個。
  // 1 本は上の線分を xy 平面へ落としたもの、もう 1 本は点から z 軸へおろした垂線
  const projectionPosition = new Float32BufferAttribute(new Float32Array(12), 3)
  const projectionGeometry = new BufferGeometry().setAttribute("position", projectionPosition)
  const projectionMaterial = new LineBasicMaterial({
    color: RADIUS_COLOR,
    transparent: true,
    opacity: 0.6
  })
  world.add(new LineSegments(projectionGeometry, projectionMaterial))

  // 原点から点までを x 成分・y 成分・z 成分の順にたどる折れ線。線分 3 本なので頂点は 6 個
  const guidePosition = new Float32BufferAttribute(new Float32Array(18), 3)
  const guideGeometry = new BufferGeometry().setAttribute("position", guidePosition)
  const guideMaterial = new LineBasicMaterial({ color: GUIDE_COLOR })
  world.add(new LineSegments(guideGeometry, guideMaterial))

  // z 軸から線分までの角度 θ と、x 軸から投影した線分までの角度 φ
  const thetaSector = createSector(THETA_COLOR)
  const phiSector = createSector(PHI_COLOR)
  world.add(...thetaSector.objects, ...phiSector.objects)

  const radiusLabel = createLabel("r", RADIUS_COLOR, VALUE_LABEL_SIZE)
  const thetaLabel = createLabel("θ", THETA_COLOR, VALUE_LABEL_SIZE)
  const phiLabel = createLabel("φ", PHI_COLOR, VALUE_LABEL_SIZE)
  world.add(radiusLabel.sprite, thetaLabel.sprite, phiLabel.sprite)

  // r のラベルを線分から少しずらすための作業用ベクトル（毎フレームの確保を避ける）
  const direction = new Vector3()
  const sideways = new Vector3()

  return {
    update: () => {
      const { r } = params
      const theta = MathUtils.degToRad(params.thetaDeg)
      const phi = MathUtils.degToRad(params.phiDeg)

      // 球面座標から直交座標への変換。線分を z 軸方向の成分と xy 平面への投影に分け、
      // 投影した長さ r sinθ をさらに x 方向・y 方向へ分ける
      const x = r * Math.sin(theta) * Math.cos(phi)
      const y = r * Math.sin(theta) * Math.sin(phi)
      const z = r * Math.cos(theta)

      point.position.set(x, y, z)

      radiusPosition.setXYZ(0, 0, 0, 0)
      radiusPosition.setXYZ(1, x, y, z)
      radiusPosition.needsUpdate = true

      // 投影した線分は z 成分を落としただけ
      projectionPosition.setXYZ(0, 0, 0, 0)
      projectionPosition.setXYZ(1, x, y, 0)
      // z 軸へおろした垂線は、点から x 成分・y 成分を落として z 軸上まで戻る。
      // 投影した線分と平行で長さも等しく、どちらも r sinθ になる
      projectionPosition.setXYZ(2, x, y, z)
      projectionPosition.setXYZ(3, 0, 0, z)
      projectionPosition.needsUpdate = true

      // 原点 →（x だけ進む）→（y だけ進む）→（z だけ進む）= 点
      guidePosition.setXYZ(0, 0, 0, 0)
      guidePosition.setXYZ(1, x, 0, 0)
      guidePosition.setXYZ(2, x, 0, 0)
      guidePosition.setXYZ(3, x, y, 0)
      guidePosition.setXYZ(4, x, y, 0)
      guidePosition.setXYZ(5, x, y, z)
      guidePosition.needsUpdate = true

      // θ の扇形は、半径を SECTOR_RADIUS に固定して θ だけを 0 から動かした軌跡で縁取られる。
      // 点の位置と同じ変換式なので、弧はそのまま線分が倒れていく道筋になる
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const angle = theta * (i / ARC_SEGMENTS)
        thetaSector.setPoint(
          i,
          SECTOR_RADIUS * Math.sin(angle) * Math.cos(phi),
          SECTOR_RADIUS * Math.sin(angle) * Math.sin(phi),
          SECTOR_RADIUS * Math.cos(angle)
        )
      }
      thetaSector.markUpdated()

      // φ の扇形は xy 平面上にあるので、2 次元の極座標と同じ式で描ける
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const angle = phi * (i / ARC_SEGMENTS)
        phiSector.setPoint(i, SECTOR_RADIUS * Math.cos(angle), SECTOR_RADIUS * Math.sin(angle), 0)
      }
      phiSector.markUpdated()

      // 角度のラベルは、それぞれの弧の中間の向きへ、弧より少し外に置く
      const halfTheta = theta / 2
      thetaLabel.sprite.position
        .set(
          Math.sin(halfTheta) * Math.cos(phi),
          Math.sin(halfTheta) * Math.sin(phi),
          Math.cos(halfTheta)
        )
        .multiplyScalar(SECTOR_RADIUS + LABEL_GAP)

      const halfPhi = phi / 2
      phiLabel.sprite.position
        .set(Math.cos(halfPhi), Math.sin(halfPhi), 0)
        .multiplyScalar(SECTOR_RADIUS + LABEL_GAP)

      // r のラベルは線分の中点に置く。線分と重ならないよう、線分に垂直な向きへずらす
      direction.set(x, y, z).normalize()
      sideways.crossVectors(direction, Z_DIRECTION)
      // 線分が z 軸に重なっているときは垂線が定まらないので、x 軸方向へ逃がす
      if (sideways.lengthSq() < 1e-6) sideways.copy(X_DIRECTION)
      sideways.normalize().multiplyScalar(LABEL_GAP)
      radiusLabel.sprite.position.set(x / 2, y / 2, z / 2).add(sideways)
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      zAxis.dispose()
      thetaSector.dispose()
      phiSector.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        pointGeometry,
        pointMaterial,
        radiusGeometry,
        radiusMaterial,
        projectionGeometry,
        projectionMaterial,
        guideGeometry,
        guideMaterial,
        radiusLabel.texture,
        radiusLabel.material,
        thetaLabel.texture,
        thetaLabel.material,
        phiLabel.texture,
        phiLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
