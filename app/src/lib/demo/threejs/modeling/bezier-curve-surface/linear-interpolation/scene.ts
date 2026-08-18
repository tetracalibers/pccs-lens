import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  LineBasicMaterial,
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
export type LinearInterpolationParams = {
  /** 線分上の点を 1 つ選ぶパラメータ。0 で P0、1 で P1 に重なる */
  t: number
  /** scene.ts が計算して書き戻す、混合の内訳を表す文字列 */
  mix: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: LinearInterpolationParams
}

/**
 * 2 つの制御点。座標の値そのものは主題ではないので、傾いた線分になる位置に固定で置く。
 * z は 0 のままにし、この平面より手前に他の要素を重ねていく
 */
const P0 = new Vector3(-2.2, -1.25, 0)
const P1 = new Vector3(2.2, 1.25, 0)

/** t を等分する数。分点を球で示し、線分の間が点で埋まっていく様子を見せる */
const TICK_COUNT = 10
const TICK_RADIUS = 0.05

/** 制御点と、今の t に対応する点を示す球の半径 */
const CONTROL_RADIUS = 0.11
const MARKER_RADIUS = 0.095

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、点そのものから離す向き */
const P0_LABEL_OFFSET = new Vector3(-0.36, -0.24, 0)
const P1_LABEL_OFFSET = new Vector3(0.36, 0.24, 0)

/** C(t) のラベルは、線分の下に置く長さのラベルとぶつからないよう上へ逃がす */
const MARKER_LABEL_OFFSET = new Vector3(0, 0.34, 0)

/** 長さのラベルを線分から下へ離す距離と、ラベルを出す最小の長さ */
const LENGTH_LABEL_OFFSET = 0.34
const LENGTH_LABEL_MIN = 0.75

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * xy 平面に重なる要素を、線分（z = 0）より手前へ少しずつ振り分ける z。
 * 正面から見る構図に固定しているため、この厚みは絵には出ない
 */
const LAYER_TICK = 0.01
const LAYER_POINT = 0.02
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、2 つの制御点・分けられた 2 本の線分・今の点が見分けられる色にする
const CONTROL_COLOR = "#b79cf5"
const MARKER_COLOR = "#f57fc4"
const NEAR_COLOR = "#ffc857"
const FAR_COLOR = "#5ec8f2"
const TICK_COLOR = "#c9d2de"

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

/** 両端が毎フレーム動く線分。頂点を作り直さず、座標だけ書き換える */
const createSegment = (color: string) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(6), 3)
  geometry.setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new LineSegments(geometry, material)
  // 端点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    set: (from: Vector3, to: Vector3) => {
      positions.setXYZ(0, from.x, from.y, from.z)
      positions.setXYZ(1, to.x, to.y, to.z)
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** C(t) = (1 − t)P0 + tP1。座標値を 1 − t : t の割合で混ぜ合わせる */
const interpolate = (t: number, target: Vector3) =>
  target
    .copy(P0)
    .multiplyScalar(1 - t)
    .addScaledVector(P1, t)

export const createLinearInterpolationScene = ({ scene, params }: SceneContext) => {
  // 線分を等分する点。t を 1 つ決めるごとに線分上の点が 1 つ決まることを示す
  const tickGeometry = new SphereGeometry(TICK_RADIUS, 12, 8)
  const tickMaterial = new MeshBasicMaterial({ color: TICK_COLOR })
  for (let i = 1; i < TICK_COUNT; i++) {
    const tick = new Mesh(tickGeometry, tickMaterial)
    interpolate(i / TICK_COUNT, tick.position).setZ(LAYER_TICK)
    scene.add(tick)
  }

  // 線分は C(t) を境に 2 つに分かれる。P0 側の長さが t、P1 側の長さが 1 − t にあたる
  const near = createSegment(NEAR_COLOR)
  const far = createSegment(FAR_COLOR)
  scene.add(near.object, far.object)

  // 自分で置いた 2 つの制御点と、t から計算で決まる点
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const start = new Mesh(controlGeometry, controlMaterial)
  const end = new Mesh(controlGeometry, controlMaterial)
  start.position.set(P0.x, P0.y, LAYER_POINT)
  end.position.set(P1.x, P1.y, LAYER_POINT)
  const markerGeometry = new SphereGeometry(MARKER_RADIUS, 16, 12)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR })
  const marker = new Mesh(markerGeometry, markerMaterial)
  scene.add(start, end, marker)

  const startLabel = createLabel("P₀", CONTROL_COLOR, LABEL_HEIGHT)
  const endLabel = createLabel("P₁", CONTROL_COLOR, LABEL_HEIGHT)
  const markerLabel = createLabel("C(t)", MARKER_COLOR, LABEL_HEIGHT)
  const nearLabel = createLabel("t", NEAR_COLOR, LABEL_HEIGHT)
  const farLabel = createLabel("1 − t", FAR_COLOR, LABEL_HEIGHT)
  startLabel.sprite.position.copy(P0).add(P0_LABEL_OFFSET).setZ(LAYER_LABEL)
  endLabel.sprite.position.copy(P1).add(P1_LABEL_OFFSET).setZ(LAYER_LABEL)
  scene.add(
    startLabel.sprite,
    endLabel.sprite,
    markerLabel.sprite,
    nearLabel.sprite,
    farLabel.sprite
  )

  // 線分に対して下向きの単位ベクトル。長さのラベルを線分から逃がす向きに使う
  const below = new Vector3(P1.y - P0.y, P0.x - P1.x, 0)
    .normalize()
    .multiplyScalar(LENGTH_LABEL_OFFSET)

  const current = new Vector3()

  return {
    update: () => {
      const t = params.t
      interpolate(t, current)

      marker.position.set(current.x, current.y, LAYER_POINT)
      markerLabel.sprite.position.copy(current).add(MARKER_LABEL_OFFSET).setZ(LAYER_LABEL)

      near.set(P0, current)
      far.set(current, P1)

      // 長さのラベルは、線分の真ん中に置いて下へ逃がす。
      // 片側が短くなりすぎるとラベルが線分からはみ出すので、そのときは隠す
      nearLabel.sprite.position.lerpVectors(P0, current, 0.5).add(below).setZ(LAYER_LABEL)
      farLabel.sprite.position.lerpVectors(current, P1, 0.5).add(below).setZ(LAYER_LABEL)
      nearLabel.sprite.visible = P0.distanceTo(current) > LENGTH_LABEL_MIN
      farLabel.sprite.visible = current.distanceTo(P1) > LENGTH_LABEL_MIN

      // Tweakpane 側に読み取り専用で出す、2 つの制御点にかかる混合比
      params.mix = `${(1 - t).toFixed(2)} P₀ + ${t.toFixed(2)} P₁`
    },
    dispose: () => {
      near.dispose()
      far.dispose()
      const disposables = [
        tickGeometry,
        tickMaterial,
        controlGeometry,
        controlMaterial,
        markerGeometry,
        markerMaterial,
        startLabel.texture,
        startLabel.material,
        endLabel.texture,
        endLabel.material,
        markerLabel.texture,
        markerLabel.material,
        nearLabel.texture,
        nearLabel.material,
        farLabel.texture,
        farLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
