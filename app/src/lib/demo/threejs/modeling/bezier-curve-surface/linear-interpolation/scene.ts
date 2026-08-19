import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
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

/** 制御点と、今の t に対応する点を示す球の半径 */
const CONTROL_RADIUS = 0.075
const MARKER_RADIUS = 0.065

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.28

/** 制御点のラベルを、点そのものから離す向き */
const P0_LABEL_OFFSET = new Vector3(-0.36, -0.24, 0)
const P1_LABEL_OFFSET = new Vector3(0.36, 0.24, 0)

/** C(t) のラベルは、線分の下に置く長さのラベルとぶつからないよう上へ逃がす */
const MARKER_LABEL_OFFSET = new Vector3(0, 0.34, 0)

/** t と 1 − t の範囲を示す矢印を線分から下へ離す距離と、そのラベルをさらに離す距離 */
const ARROW_OFFSET = 0.38
const ARROW_LABEL_OFFSET = 0.7

/** 矢じりの長さと太さ */
const ARROW_HEAD_LENGTH = 0.16
const ARROW_HEAD_RADIUS = 0.055

/** 引き出し線を線分の上の点から離す距離と、矢印の外側へはみ出させる長さ */
const LEADER_GAP = 0.12
const LEADER_OVERSHOOT = 0.1

/** 矢印とラベルを出す最小の長さ。短すぎると矢じりだけになって読み取れない */
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
const LAYER_ARROW = 0.01
const LAYER_POINT = 0.02
const LAYER_LABEL = 0.14

// 背景（暗めのグレー）の上で、2 つの制御点・分けられた 2 本の線分・今の点が見分けられる色にする
const CONTROL_COLOR = "#b79cf5"
const MARKER_COLOR = "#f57fc4"
const NEAR_COLOR = "#ffc857"
const FAR_COLOR = "#5ec8f2"
const LEADER_COLOR = "#9aa3b0"

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

/**
 * 区間の広がりを示す両矢印。両端が毎フレーム動くので、頂点も矢じりの向きも都度書き換える。
 * 矢じりの円錐は既定で +y を向いているため、線分の向きへ回してから先端を端点に合わせる
 */
const createMeasureArrow = (color: string) => {
  const group = new Group()

  const shaftGeometry = new BufferGeometry()
  const shaftPositions = new Float32BufferAttribute(new Float32Array(6), 3)
  shaftGeometry.setAttribute("position", shaftPositions)
  const material = new LineBasicMaterial({ color })
  const shaft = new LineSegments(shaftGeometry, material)
  shaft.frustumCulled = false
  group.add(shaft)

  const headGeometry = new ConeGeometry(ARROW_HEAD_RADIUS, ARROW_HEAD_LENGTH, 12)
  const headMaterial = new MeshBasicMaterial({ color })
  const heads = [new Mesh(headGeometry, headMaterial), new Mesh(headGeometry, headMaterial)]
  group.add(heads[0], heads[1])

  const direction = new Vector3()

  return {
    object: group,
    set: (from: Vector3, to: Vector3) => {
      shaftPositions.setXYZ(0, from.x, from.y, LAYER_ARROW)
      shaftPositions.setXYZ(1, to.x, to.y, LAYER_ARROW)
      shaftPositions.needsUpdate = true

      direction.subVectors(to, from).normalize()
      const angle = Math.atan2(direction.y, direction.x)

      heads[0].rotation.z = angle + Math.PI / 2
      heads[0].position
        .copy(from)
        .addScaledVector(direction, ARROW_HEAD_LENGTH / 2)
        .setZ(LAYER_ARROW)
      heads[1].rotation.z = angle - Math.PI / 2
      heads[1].position
        .copy(to)
        .addScaledVector(direction, -ARROW_HEAD_LENGTH / 2)
        .setZ(LAYER_ARROW)
    },
    dispose: () => {
      shaftGeometry.dispose()
      material.dispose()
      headGeometry.dispose()
      headMaterial.dispose()
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

  // 線分に対して下向きの単位ベクトル。矢印・引き出し線・ラベルを線分から逃がす向きに使う
  const below = new Vector3(P1.y - P0.y, P0.x - P1.x, 0).normalize()

  // t と 1 − t の広がりを示す両矢印。線分と平行に、少し下へずらして並べる
  const nearArrow = createMeasureArrow(NEAR_COLOR)
  const farArrow = createMeasureArrow(FAR_COLOR)
  scene.add(nearArrow.object, farArrow.object)

  // 矢印の端を、線分の上の P0・C(t)・P1 に対応づける引き出し線
  const leaderGeometry = new BufferGeometry()
  const leaderPositions = new Float32BufferAttribute(new Float32Array(18), 3)
  leaderGeometry.setAttribute("position", leaderPositions)
  const leaderMaterial = new LineBasicMaterial({ color: LEADER_COLOR })
  const leaders = new LineSegments(leaderGeometry, leaderMaterial)
  leaders.frustumCulled = false
  scene.add(leaders)

  const scratch = new Vector3()
  const setLeader = (index: number, point: Vector3) => {
    scratch.copy(point).addScaledVector(below, LEADER_GAP)
    leaderPositions.setXYZ(index * 2, scratch.x, scratch.y, LAYER_ARROW)
    scratch.copy(point).addScaledVector(below, ARROW_OFFSET + LEADER_OVERSHOOT)
    leaderPositions.setXYZ(index * 2 + 1, scratch.x, scratch.y, LAYER_ARROW)
  }

  // 矢印の両端は、線分の上の点を下へずらした位置に置く
  const nearEnd = new Vector3()
  const farEnd = new Vector3()
  const middleEnd = new Vector3()
  const current = new Vector3()

  return {
    update: () => {
      const t = params.t
      interpolate(t, current)

      marker.position.set(current.x, current.y, LAYER_POINT)
      markerLabel.sprite.position.copy(current).add(MARKER_LABEL_OFFSET).setZ(LAYER_LABEL)

      near.set(P0, current)
      far.set(current, P1)

      // 2 本の矢印は、線分を下へずらした位置に置き、C(t) を境に分ける
      nearEnd.copy(P0).addScaledVector(below, ARROW_OFFSET)
      middleEnd.copy(current).addScaledVector(below, ARROW_OFFSET)
      farEnd.copy(P1).addScaledVector(below, ARROW_OFFSET)
      nearArrow.set(nearEnd, middleEnd)
      farArrow.set(middleEnd, farEnd)

      setLeader(0, P0)
      setLeader(1, current)
      setLeader(2, P1)
      leaderPositions.needsUpdate = true

      // ラベルは矢印の真ん中に置いて、さらに下へ逃がす。
      // 片側が短くなりすぎると矢じりだけが残って読めないので、そのときは矢印ごと隠す
      nearLabel.sprite.position
        .lerpVectors(P0, current, 0.5)
        .addScaledVector(below, ARROW_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
      farLabel.sprite.position
        .lerpVectors(current, P1, 0.5)
        .addScaledVector(below, ARROW_LABEL_OFFSET)
        .setZ(LAYER_LABEL)
      const nearVisible = P0.distanceTo(current) > LENGTH_LABEL_MIN
      const farVisible = current.distanceTo(P1) > LENGTH_LABEL_MIN
      nearLabel.sprite.visible = nearVisible
      farLabel.sprite.visible = farVisible
      nearArrow.object.visible = nearVisible
      farArrow.object.visible = farVisible

      // Tweakpane 側に読み取り専用で出す、2 つの制御点にかかる混合比
      params.mix = `${(1 - t).toFixed(2)} P₀ + ${t.toFixed(2)} P₁`
    },
    dispose: () => {
      near.dispose()
      far.dispose()
      nearArrow.dispose()
      farArrow.dispose()
      const disposables = [
        leaderGeometry,
        leaderMaterial,
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
