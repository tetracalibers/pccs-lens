import {
  BufferGeometry,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ConicSectionParams = {
  /** 切る平面の傾き（度）。0 は軸に垂直な切り方 */
  tilt: number
  /** scene.ts が書き戻す表示用の値。母線の傾き（度） */
  generatrixTilt: string
  /** scene.ts が判定して書き戻す、切り口に現れている曲線の名前 */
  curveName: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ConicSectionParams
}

/** 円錐面の半頂角（度）。軸と母線のなす角 */
const HALF_ANGLE_DEG = 30

const TAN_HALF_ANGLE = Math.tan((HALF_ANGLE_DEG * Math.PI) / 180)

/** 母線の傾き（度）。切る平面の傾きはこの値と比べる */
const GENERATRIX_TILT_DEG = 90 - HALF_ANGLE_DEG

/** 円錐面を描く範囲。頂点から軸方向へ、上下どちらへもこの長さだけ伸ばす */
const CONE_EXTENT = 2.4

/** 描く範囲の端での円錐面の半径 */
const CONE_RADIUS = CONE_EXTENT * TAN_HALF_ANGLE

/** 切る平面が軸と交わる高さ。頂点を通ると切り口が退化するので、頂点から離しておく */
const PLANE_HEIGHT = 0.8

/** 切る平面を描く正方形の 1 辺 */
const PLANE_SIZE = 3.4

/** 軸を、頂点から上下へ伸ばす長さ */
const AXIS_EXTENT = 2.75

/** 円錐面の上下の端に描く輪の分割数 */
const RING_SEGMENTS = 64

/** 切り口を求めるために θ を刻む数 */
const SECTION_SEGMENTS = 720

/** 分母がこれより小さいところは、切り口が無限の彼方へ逃げている */
const DENOMINATOR_EPSILON = 1e-3

/** 平面の傾きが母線と一致したとみなす幅（度） */
const TILT_EPSILON = 0.5

// 背景（暗めのグレー）の上で、円錐面・母線・切る平面・切り口が互いに見分けられる色にする。
// 円錐面は線で下書きせず面だけで見せるので、不透明度は面の広がりが追える程度まで上げる
const CONE_COLOR = "#8fa3bf"
const CONE_OPACITY = 0.18
const GENERATRIX_COLOR = "#ffc857"
const AXIS_COLOR = "#b9c0cc"
const PLANE_COLOR = "#5ec8f2"
const PLANE_OPACITY = 0.16
const SECTION_COLOR = "#f57fc4"

/** 切る平面の傾きを母線の傾きと比べて、現れる曲線の名前を決める */
const nameSection = (tiltDeg: number) => {
  if (Math.abs(tiltDeg - GENERATRIX_TILT_DEG) < TILT_EPSILON) return "放物線"
  if (tiltDeg > GENERATRIX_TILT_DEG) return "双曲線"
  if (tiltDeg < TILT_EPSILON) return "円"
  return "楕円"
}

export const createConicSectionScene = ({ scene, params }: SceneContext) => {
  // 円錐面。半頂角 α の母線を軸（y 軸）のまわりに回した面を、頂点を挟んで上下 2 つ置く。
  // ConeGeometry は頂点が +y 側なので、上側は反転させてどちらも頂点を原点に合わせる
  const coneGeometry = new ConeGeometry(CONE_RADIUS, CONE_EXTENT, 48, 1, true)
  const coneMaterial = new MeshBasicMaterial({
    color: CONE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: CONE_OPACITY,
    // 面の内側にある切り口を隠したくないので、深度は比較するが書かない
    depthWrite: false
  })

  const upperCone = new Mesh(coneGeometry, coneMaterial)
  upperCone.rotation.x = Math.PI
  upperCone.position.y = CONE_EXTENT / 2
  scene.add(upperCone)

  const lowerCone = new Mesh(coneGeometry, coneMaterial)
  lowerCone.position.y = -CONE_EXTENT / 2
  scene.add(lowerCone)

  // 円錐面をどこまで描いたかを示す輪。切り口がここで途切れるのは、面の広がりを有限に描いているため
  const ringPoints: Vector3[] = []
  for (let i = 0; i < RING_SEGMENTS; i++) {
    const theta = (i / RING_SEGMENTS) * Math.PI * 2
    ringPoints.push(new Vector3(CONE_RADIUS * Math.cos(theta), 0, CONE_RADIUS * Math.sin(theta)))
  }
  const ringGeometry = new BufferGeometry().setFromPoints(ringPoints)
  const ringMaterial = new LineBasicMaterial({ color: CONE_COLOR })
  for (const y of [CONE_EXTENT, -CONE_EXTENT]) {
    const ring = new LineLoop(ringGeometry, ringMaterial)
    ring.position.y = y
    scene.add(ring)
  }

  // 傾きを比べる母線。切り口を隠さないよう、平面が倒れていく向き（+x 側）の 1 本だけを描く。
  // この母線と平面はどちらも xy 平面に乗るので、角度をそのまま見比べられる
  const generatrixGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-CONE_RADIUS, -CONE_EXTENT, 0),
    new Vector3(CONE_RADIUS, CONE_EXTENT, 0)
  ])
  const generatrixMaterial = new LineBasicMaterial({ color: GENERATRIX_COLOR })
  scene.add(new LineSegments(generatrixGeometry, generatrixMaterial))

  // 母線を回すもとになった軸
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -AXIS_EXTENT, 0),
    new Vector3(0, AXIS_EXTENT, 0)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  // 切る平面。(0, PLANE_HEIGHT, 0) を通り、そこを中心に z 軸まわりへ傾ける
  const planeGroup = new Group()
  planeGroup.position.y = PLANE_HEIGHT
  scene.add(planeGroup)

  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLANE_OPACITY,
    depthWrite: false
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  // PlaneGeometry は xy 平面に作られるので、寝かせて法線を軸の向きに合わせる
  plane.rotation.x = -Math.PI / 2
  planeGroup.add(plane)

  const half = PLANE_SIZE / 2
  const planeEdgeGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-half, 0, -half),
    new Vector3(half, 0, -half),
    new Vector3(half, 0, half),
    new Vector3(-half, 0, half)
  ])
  const planeEdgeMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  planeGroup.add(new LineLoop(planeEdgeGeometry, planeEdgeMaterial))

  // 切り口。線分の本数は刻み数までなので、その分の場所を先に確保しておく
  const sectionPositions = new Float32BufferAttribute(
    new Float32Array(SECTION_SEGMENTS * 2 * 3),
    3
  )
  const sectionGeometry = new BufferGeometry().setAttribute("position", sectionPositions)
  const sectionMaterial = new LineBasicMaterial({ color: SECTION_COLOR })
  scene.add(new LineSegments(sectionGeometry, sectionMaterial))

  // θ ごとに求めた切り口の点と、それが円錐面を描いた範囲に入っているか
  const samples = new Float32Array((SECTION_SEGMENTS + 1) * 3)
  const insideCone = new Uint8Array(SECTION_SEGMENTS + 1)

  // 母線の傾きは変わらないので、パネルに出す値はここで一度だけ書き込む
  params.generatrixTilt = String(GENERATRIX_TILT_DEG)

  return {
    update: () => {
      const tilt = (params.tilt * Math.PI) / 180
      const cosTilt = Math.cos(tilt)
      const sinTilt = Math.sin(tilt)

      planeGroup.rotation.z = tilt

      // 円錐面上の点 (t tanα cosθ, t, t tanα sinθ) を平面の式に入れると、θ ごとに t が 1 つ決まる
      for (let i = 0; i <= SECTION_SEGMENTS; i++) {
        const theta = (i / SECTION_SEGMENTS) * Math.PI * 2
        const denominator = cosTilt - sinTilt * TAN_HALF_ANGLE * Math.cos(theta)
        const t = (cosTilt * PLANE_HEIGHT) / denominator
        samples[i * 3] = t * TAN_HALF_ANGLE * Math.cos(theta)
        samples[i * 3 + 1] = t
        samples[i * 3 + 2] = t * TAN_HALF_ANGLE * Math.sin(theta)
        // 分母が 0 に近いところは、切り口が無限の彼方へ逃げている
        insideCone[i] =
          Math.abs(denominator) > DENOMINATOR_EPSILON && Math.abs(t) <= CONE_EXTENT ? 1 : 0
      }

      // 隣り合う点を結ぶ。分母の符号が変わったところは頂点を挟んで反対側の円錐へ飛んでいるので繋がない
      let segmentCount = 0
      for (let i = 0; i < SECTION_SEGMENTS; i++) {
        const next = i + 1
        if (!insideCone[i] || !insideCone[next]) continue
        if (Math.sign(samples[i * 3 + 1]) !== Math.sign(samples[next * 3 + 1])) continue
        sectionPositions.setXYZ(
          segmentCount * 2,
          samples[i * 3],
          samples[i * 3 + 1],
          samples[i * 3 + 2]
        )
        sectionPositions.setXYZ(
          segmentCount * 2 + 1,
          samples[next * 3],
          samples[next * 3 + 1],
          samples[next * 3 + 2]
        )
        segmentCount++
      }
      sectionPositions.needsUpdate = true
      sectionGeometry.setDrawRange(0, segmentCount * 2)

      params.curveName = nameSection(params.tilt)
    },
    dispose: () => {
      const disposables = [
        coneGeometry,
        coneMaterial,
        ringGeometry,
        ringMaterial,
        generatrixGeometry,
        generatrixMaterial,
        axisGeometry,
        axisMaterial,
        planeGeometry,
        planeMaterial,
        planeEdgeGeometry,
        planeEdgeMaterial,
        sectionGeometry,
        sectionMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
