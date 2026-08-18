import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
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
export type GeneratrixRevolutionParams = {
  /** 母線を軸のまわりに回した角度（度） */
  rotationDeg: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: GeneratrixRevolutionParams
}

/** 円錐面の半頂角（度）。軸と母線のなす角。この記事のほかのデモと揃える */
const HALF_ANGLE_DEG = 30

const TAN_HALF_ANGLE = Math.tan((HALF_ANGLE_DEG * Math.PI) / 180)

/** 円錐面を描く範囲。頂点から軸方向へ、上下どちらへもこの長さだけ伸ばす */
const CONE_EXTENT = 2.4

/** 描く範囲の端での円錐面の半径 */
const CONE_RADIUS = CONE_EXTENT * TAN_HALF_ANGLE

/** 軸を、頂点から上下へ伸ばす長さ */
const AXIS_EXTENT = 2.75

/** 掃かれた面を張る、母線の刻み数 */
const SWEEP_SEGMENTS = 120

/** 端に描く輪の分割数 */
const RIM_SEGMENTS = 96

/** 頂点を示す球の半径 */
const APEX_RADIUS = 0.06

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 母線のラベルを、母線の先から軸から遠ざかる向き・上向きへずらす量 */
const GENERATRIX_LABEL_SPREAD = 1.24
const GENERATRIX_LABEL_LIFT = 0.24

/** 軸のラベルを、軸の先からずらす量 */
const AXIS_LABEL_OFFSET = 0.26

// 背景（暗めのグレー）の上で、軸・母線・掃かれた面・端の輪が見分けられる色にする。
// 円錐面と母線の色は、切り口を見せるデモ（ConicSectionDemo）と揃える
const AXIS_COLOR = "#b9c0cc"
const GENERATRIX_COLOR = "#ffc857"
const SURFACE_COLOR = "#8fa3bf"
const SURFACE_OPACITY = 0.22
const RIM_COLOR = "#6d7f96"
const APEX_COLOR = "#f57fc4"

/** 回しはじめの母線を、今の母線と見分けるための薄さ */
const START_OPACITY = 0.4

/**
 * 半頂角 α の母線を軸（y 軸）のまわりに θ だけ回したときの、パラメータ t の点。
 * t は頂点からの軸方向の距離で、負にとると頂点を挟んで反対側の面になる
 */
const generatrixPoint = (theta: number, t: number, target: Vector3) =>
  target.set(t * TAN_HALF_ANGLE * Math.cos(theta), t, t * TAN_HALF_ANGLE * Math.sin(theta))

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字数も書体による字幅も一定でないので、文字の幅を測って板の横幅を決める
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる線がラベルの矩形の形に欠ける
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((LABEL_HEIGHT * canvas.width) / canvas.height, LABEL_HEIGHT, 1)

  return { sprite, texture, material }
}

/** 頂点を通り、パラメータ t が ±CONE_EXTENT まで伸びる母線 1 本 */
const createGeneratrix = (color: string, opacity: number) => {
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  const line = new LineSegments(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  const point = new Vector3()

  return {
    object: line,
    /** 軸のまわりに θ だけ回した位置へ置き直す */
    set: (theta: number) => {
      generatrixPoint(theta, -CONE_EXTENT, point)
      positions.setXYZ(0, point.x, point.y, point.z)
      generatrixPoint(theta, CONE_EXTENT, point)
      positions.setXYZ(1, point.x, point.y, point.z)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 母線が通った跡としての円錐面。母線は直線なので、
 * 刻んだ角度ごとに両端（t = ±CONE_EXTENT）の 2 点を置き、隣り合う母線のあいだを四角形で張る
 */
const createSweptSurface = () => {
  const positions = new Float32BufferAttribute(new Float32Array((SWEEP_SEGMENTS + 1) * 2 * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)

  const indices: number[] = []
  for (let i = 0; i < SWEEP_SEGMENTS; i++) {
    const lower = i * 2
    const upper = i * 2 + 1
    indices.push(lower, upper, upper + 2, lower, upper + 2, lower + 2)
  }
  geometry.setIndex(indices)

  const material = new MeshBasicMaterial({
    color: SURFACE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: SURFACE_OPACITY,
    // 面の向こう側にある母線や軸を隠したくないので、深度は比較するが書かない
    depthWrite: false
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false

  const point = new Vector3()

  return {
    object: mesh,
    /** 0 から θ まで回したぶんの面を張り直す */
    set: (theta: number) => {
      for (let i = 0; i <= SWEEP_SEGMENTS; i++) {
        const angle = (theta * i) / SWEEP_SEGMENTS
        generatrixPoint(angle, -CONE_EXTENT, point)
        positions.setXYZ(i * 2, point.x, point.y, point.z)
        generatrixPoint(angle, CONE_EXTENT, point)
        positions.setXYZ(i * 2 + 1, point.x, point.y, point.z)
      }
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 母線の端（パラメータ t の位置）が通った跡の弧。掃かれた面の縁にあたる */
const createSweptArc = (t: number) => {
  const positions = new Float32BufferAttribute(new Float32Array((RIM_SEGMENTS + 1) * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", positions)
  const material = new LineBasicMaterial({ color: SURFACE_COLOR })
  const line = new Line(geometry, material)
  line.frustumCulled = false

  const point = new Vector3()

  return {
    object: line,
    set: (theta: number) => {
      for (let i = 0; i <= RIM_SEGMENTS; i++) {
        generatrixPoint((theta * i) / RIM_SEGMENTS, t, point)
        positions.setXYZ(i, point.x, point.y, point.z)
      }
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createGeneratrixRevolutionScene = ({ scene, params }: SceneContext) => {
  // 母線を回すもとになる軸
  const axisGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -AXIS_EXTENT, 0),
    new Vector3(0, AXIS_EXTENT, 0)
  ])
  const axisMaterial = new LineBasicMaterial({ color: AXIS_COLOR })
  scene.add(new LineSegments(axisGeometry, axisMaterial))

  // 1 周まで回したときに母線の端が届く輪。掃かれた跡がどこへ向かっているかの目安になる
  const rimPoints: Vector3[] = []
  for (let i = 0; i < RIM_SEGMENTS; i++) {
    const angle = (i / RIM_SEGMENTS) * Math.PI * 2
    rimPoints.push(new Vector3(CONE_RADIUS * Math.cos(angle), 0, CONE_RADIUS * Math.sin(angle)))
  }
  const rimGeometry = new BufferGeometry().setFromPoints(rimPoints)
  const rimMaterial = new LineBasicMaterial({ color: RIM_COLOR })
  for (const y of [CONE_EXTENT, -CONE_EXTENT]) {
    const rim = new LineLoop(rimGeometry, rimMaterial)
    rim.position.y = y
    scene.add(rim)
  }

  // 母線が通った跡としての円錐面と、その縁
  const surface = createSweptSurface()
  const upperArc = createSweptArc(CONE_EXTENT)
  const lowerArc = createSweptArc(-CONE_EXTENT)
  scene.add(surface.object, upperArc.object, lowerArc.object)

  // 回しはじめ（θ = 0）の母線は動かさずに残し、今の母線と見比べられるようにする
  const startGeneratrix = createGeneratrix(GENERATRIX_COLOR, START_OPACITY)
  startGeneratrix.set(0)
  const currentGeneratrix = createGeneratrix(GENERATRIX_COLOR, 1)
  scene.add(startGeneratrix.object, currentGeneratrix.object)

  // 軸と母線が交わる点。円錐面はここを挟んで上下 2 つに分かれる
  const apexGeometry = new SphereGeometry(APEX_RADIUS, 16, 12)
  const apexMaterial = new MeshBasicMaterial({ color: APEX_COLOR })
  scene.add(new Mesh(apexGeometry, apexMaterial))

  const axisLabel = createLabel("軸", AXIS_COLOR)
  axisLabel.sprite.position.set(0, AXIS_EXTENT + AXIS_LABEL_OFFSET, 0)
  const generatrixLabel = createLabel("母線", GENERATRIX_COLOR)
  scene.add(axisLabel.sprite, generatrixLabel.sprite)

  const tip = new Vector3()

  return {
    update: () => {
      const theta = (params.rotationDeg * Math.PI) / 180

      surface.set(theta)
      upperArc.set(theta)
      lowerArc.set(theta)
      currentGeneratrix.set(theta)

      // 母線のラベルは、今の母線の先を軸から遠ざける向きへずらして置く
      generatrixPoint(theta, CONE_EXTENT, tip)
      generatrixLabel.sprite.position.set(
        tip.x * GENERATRIX_LABEL_SPREAD,
        tip.y + GENERATRIX_LABEL_LIFT,
        tip.z * GENERATRIX_LABEL_SPREAD
      )
    },
    dispose: () => {
      const disposables = [
        axisGeometry,
        axisMaterial,
        rimGeometry,
        rimMaterial,
        apexGeometry,
        apexMaterial,
        axisLabel.texture,
        axisLabel.material,
        generatrixLabel.texture,
        generatrixLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
      surface.dispose()
      upperArc.dispose()
      lowerArc.dispose()
      startGeneratrix.dispose()
      currentGeneratrix.dispose()
    }
  }
}
