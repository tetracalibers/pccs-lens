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
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type PolarAndCartesianParams = {
  /** 原点からの距離 */
  r: number
  /** x 軸の正の向きから測った角度（度） */
  thetaDeg: number
  /** scene.ts が計算して書き戻す表示用の値 */
  x: number
  y: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: PolarAndCartesianParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 距離・角度・辺のラベルの高さ。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_HEIGHT = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルを、それが指す線分や弧から離す距離 */
const LABEL_GAP = 0.24

/** r のラベルを線分上のどこに置くか（0 が原点、1 が線分の先） */
const RADIUS_LABEL_ALONG = 0.72

/** r のラベルを原点から離す最小距離。r が小さいときに θ のラベルへ寄るのを防ぐ */
const RADIUS_LABEL_MIN_DISTANCE = 0.85

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** 角度を表す扇形の半径 */
const SECTOR_RADIUS = 0.3

/** 扇形の弧の分割数 */
const ARC_SEGMENTS = 48

/** 角度を表す扇形の塗りの不透明度 */
const SECTOR_OPACITY = 0.35

/**
 * 直角三角形の辺を軸より手前に置くための z。
 * 隣辺は x 軸に重なるので、少しだけ前に出して軸の線に負けないようにする
 */
const LEG_Z = 0.002

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、2 軸・距離・角度・直角三角形の 2 辺が見分けられる色にする。
// θ は x 軸から測る回転角なので、球面座標系・円柱座標系のデモと同じピンクにする。
// 直角三角形の 2 辺は、それぞれ沿っている軸と同系にしたうえで、軸の線より淡くする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const RADIUS_COLOR = "#ffc857"
const THETA_COLOR = "#f57fc4"
const ADJACENT_COLOR = "#f7a9a0"
const OPPOSITE_COLOR = "#aee8b8"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * `r cosθ` のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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

/** 1 本の線分。両端を毎フレーム書き換える */
const createSegment = (color: string) => {
  const position = new Float32BufferAttribute(new Float32Array(6), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color })

  return {
    object: new LineSegments(geometry, material),
    setEnds: (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      position.setXYZ(0, x1, y1, z1)
      position.setXYZ(1, x2, y2, z2)
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createPolarAndCartesianScene = ({ scene, params }: SceneContext) => {
  // 平面の図なので、Three.js の既定の向き（x が右・y が上）のまま xy 平面を正面から見る
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  scene.add(xAxis.object, yAxis.object)

  // 極座標と直交座標が同じ 1 点を指していることを見せるための点
  const pointGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0], 3)
  )
  const pointMaterial = new PointsMaterial({ color: RADIUS_COLOR, size: 0.16 })
  const point = new Points(pointGeometry, pointMaterial)
  scene.add(point)

  // 原点から点までの線分。長さが r で、直角三角形の斜辺になる
  const radius = createSegment(RADIUS_COLOR)
  // 隣辺（x 軸に沿う辺）と対辺（y 軸に平行な辺）。長さが x と y になる
  const adjacent = createSegment(ADJACENT_COLOR)
  const opposite = createSegment(OPPOSITE_COLOR)
  scene.add(radius.object, adjacent.object, opposite.object)

  // x 軸から斜辺までの角度 θ
  const thetaSector = createSector(THETA_COLOR)
  scene.add(...thetaSector.objects)

  const radiusLabel = createLabel("r", RADIUS_COLOR, VALUE_LABEL_HEIGHT)
  const thetaLabel = createLabel("θ", THETA_COLOR, VALUE_LABEL_HEIGHT)
  const adjacentLabel = createLabel("r cosθ", ADJACENT_COLOR, VALUE_LABEL_HEIGHT)
  const oppositeLabel = createLabel("r sinθ", OPPOSITE_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(
    radiusLabel.sprite,
    thetaLabel.sprite,
    adjacentLabel.sprite,
    oppositeLabel.sprite
  )

  return {
    update: () => {
      const { r } = params
      const theta = MathUtils.degToRad(params.thetaDeg)

      // 極座標から直交座標への変換。斜辺 r と角度 θ の直角三角形で、
      // x 軸方向の辺（隣辺）が r cosθ、y 軸方向の辺（対辺）が r sinθ になる
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)

      // Tweakpane 側に読み取り専用で出す値。直交座標での表し方が数値でも追える
      params.x = x
      params.y = y

      point.position.set(x, y, 0)

      radius.setEnds(0, 0, 0, x, y, 0)
      adjacent.setEnds(0, 0, LEG_Z, x, 0, LEG_Z)
      opposite.setEnds(x, 0, LEG_Z, x, y, LEG_Z)

      // θ の扇形は、半径を SECTOR_RADIUS に固定した同じ変換式で描ける
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const angle = theta * (i / ARC_SEGMENTS)
        thetaSector.setPoint(i, SECTOR_RADIUS * Math.cos(angle), SECTOR_RADIUS * Math.sin(angle), 0)
      }
      thetaSector.markUpdated()

      // θ のラベルは扇形の中間の向きへ、扇形より少し外に置く
      thetaLabel.sprite.position
        .set(Math.cos(theta / 2), Math.sin(theta / 2), 0)
        .multiplyScalar(SECTOR_RADIUS + LABEL_GAP)

      // r のラベルは斜辺の外寄りに置き、直角三角形と反対側（θ が増える側）へ垂直にずらす。
      // 三角形の内側へ出すと 2 辺やそのラベルと重なる
      radiusLabel.sprite.position.set(
        x * RADIUS_LABEL_ALONG - Math.sin(theta) * LABEL_GAP,
        y * RADIUS_LABEL_ALONG + Math.cos(theta) * LABEL_GAP,
        0
      )
      // r が小さいと斜辺ごと原点付近に収まって θ のラベルに寄るので、外へ押し出す
      if (radiusLabel.sprite.position.length() < RADIUS_LABEL_MIN_DISTANCE) {
        radiusLabel.sprite.position.setLength(RADIUS_LABEL_MIN_DISTANCE)
      }

      // 隣辺のラベルは x 軸の反対側（下）へ、対辺のラベルは原点から遠い側へ置く。
      // どちらも板の幅・高さの半分だけ足して、辺との間隔を文字の外側で測る
      adjacentLabel.sprite.position.set(
        x / 2,
        -(LABEL_GAP + adjacentLabel.sprite.scale.y / 2),
        0
      )
      const oppositeSide = Math.sign(x) || 1
      oppositeLabel.sprite.position.set(
        x + oppositeSide * (LABEL_GAP + oppositeLabel.sprite.scale.x / 2),
        y / 2,
        0
      )
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      thetaSector.dispose()
      radius.dispose()
      adjacent.dispose()
      opposite.dispose()
      const disposables = [
        pointGeometry,
        pointMaterial,
        radiusLabel.texture,
        radiusLabel.material,
        thetaLabel.texture,
        thetaLabel.material,
        adjacentLabel.texture,
        adjacentLabel.material,
        oppositeLabel.texture,
        oppositeLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
