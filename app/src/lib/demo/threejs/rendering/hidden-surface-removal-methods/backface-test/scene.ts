import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
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
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"

/** Tweakpane で操作するパラメータ */
export type BackfaceTestParams = {
  /** 視点を置く方位（度）。物体の周りを水平に回る */
  eyeAzimuth: number
  /** 裏を向いた面を取り除く */
  cullBackFaces: boolean
  /** scene.ts が計算して書き戻す表示用の文字列 */
  measure: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: BackfaceTestParams
}

/** 立方体の 1 辺の半分 */
const CUBE_HALF = 0.9

/**
 * 視点を置く高さと、中心軸からの距離。
 * 視点に高さを持たせると、上面が表・下面が裏に定まり、なす角も直角から離れる。
 * 法線ベクトルと視点方向ベクトルが真逆に並ぶこともなくなるので、なす角の扇が必ず開く
 */
const EYE_HEIGHT = 1.5
const EYE_DISTANCE = 3.4

/** 視点を表す球の半径 */
const EYE_RADIUS = 0.1

/** 法線ベクトルの矢印の長さ。立方体の外へ十分に伸ばして、面から立つ向きを読みやすくする */
const NORMAL_LENGTH = 1.35

/** 矢印の軸の太さ（ピクセル）と、先端（円錐）の大きさ */
const LINE_WIDTH = 4
const ARROW_RADIUS = 0.09
const ARROW_HEIGHT = 0.28

/** なす角を示す扇の半径と分割数。法線ベクトルの矢印より内側に収める */
const SECTOR_RADIUS = 0.45
const SECTOR_SEGMENTS = 36

/**
 * 面と扇の不透明度。
 * 立体の内部を貫く視点方向ベクトルが透けて見える程度に薄くする
 */
const FACE_OPACITY = 0.5
const SECTOR_OPACITY = 0.5

/** e のラベルを、面の中心から視点までの何割の位置に置くか */
const E_LABEL_RATIO = 0.55

/** ラベルを、それが指す点から離す距離 */
const LABEL_GAP = 0.16

const LABEL_HEIGHT = 0.26
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、表を向いた面と裏を向いた面が一目で分かれる色にする。
// 面は「残る／外れる」を明暗で、ベクトルと扇は「鋭角／鈍角」を色相で示す
const FRONT_FACE_COLOR = "#b9cde4"
const BACK_FACE_COLOR = "#6b7280"
const FRONT_ACCENT = "#5ec8f2"
const BACK_ACCENT = "#f2766a"
const EYE_COLOR = "#f5d97f"
const EDGE_COLOR = "#ccd3df"

/**
 * 半透明なものの描画順。数が小さいほど先に描かれ、あとから描いたものが上に重なる。
 * 扇を面より先に描くと、立体の内部に入り込んだ部分も面越しに透けて見える。
 * ラベルは最後に描き、深度テストも外して必ず読めるようにする
 */
const SECTOR_ORDER = 1
const FACE_ORDER = 2
const LABEL_ORDER = 3

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

/**
 * 立方体の 6 面を、外から見て反時計回りに並べた頂点として返す。
 * 先頭は +z の面。この面だけに法線ベクトルと視点方向ベクトルを添える
 */
const createCubeFaces = () => {
  const h = CUBE_HALF
  const faces: number[][][] = [
    [
      [-h, -h, h],
      [h, -h, h],
      [h, h, h],
      [-h, h, h]
    ],
    [
      [h, -h, -h],
      [-h, -h, -h],
      [-h, h, -h],
      [h, h, -h]
    ],
    [
      [h, -h, h],
      [h, -h, -h],
      [h, h, -h],
      [h, h, h]
    ],
    [
      [-h, -h, -h],
      [-h, -h, h],
      [-h, h, h],
      [-h, h, -h]
    ],
    [
      [-h, h, h],
      [h, h, h],
      [h, h, -h],
      [-h, h, -h]
    ],
    [
      [-h, -h, -h],
      [h, -h, -h],
      [h, -h, h],
      [-h, -h, h]
    ]
  ]

  return faces.map((face) => face.map(([x, y, z]) => new Vector3(x, y, z)))
}

/** 多角形の面を、先頭の頂点から扇状に三角形へ分割し、頂点の座標を並べる */
const createFacePositions = (vertices: Vector3[]) => {
  const positions: number[] = []
  for (let index = 1; index < vertices.length - 1; index++) {
    positions.push(
      ...vertices[0].toArray(),
      ...vertices[index].toArray(),
      ...vertices[index + 1].toArray()
    )
  }
  return new Float32Array(positions)
}

/** 面を囲む頂点から、面の中心と、外を向く法線ベクトル n を求める */
const measureFace = (vertices: Vector3[]) => {
  const center = new Vector3()
  for (const vertex of vertices) center.add(vertex)
  center.divideScalar(vertices.length)

  // 隣り合う 2 辺の外積は面に垂直になる。頂点を外から見て反時計回りに並べてあるので、
  // 得られる向きは物体の外側、つまり面の表側を指す
  const normal = new Vector3()
    .subVectors(vertices[1], vertices[0])
    .cross(new Vector3().subVectors(vertices[2], vertices[1]))
    .normalize()

  return { center, normal }
}

/** 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする */
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
    depthTest: false,
    // 文字のない透明な余白まで深度を書くと、あとから描く半透明の面が矩形の形に欠ける
    depthWrite: false
  })
  const sprite = new Sprite(material)
  sprite.renderOrder = LABEL_ORDER
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((LABEL_HEIGHT * canvas.width) / canvas.height, LABEL_HEIGHT, 1)

  return { sprite, texture, material }
}

/** 始点から終点へ向かう矢印。表裏で色を変えるので、色をあとから差し替えられるようにする */
const createArrow = (color: string) => {
  // 線の太さをピクセルで指定できるようにする。素の Line では太さが常に 1 px になる
  const shaftPositions = new Float32Array(6)
  const shaftGeometry = new LineSegmentsGeometry()
  const shaftMaterial = new LineMaterial({ color, alphaToCoverage: true })
  shaftMaterial.linewidth = LINE_WIDTH
  const shaft = new LineSegments2(shaftGeometry, shaftMaterial)

  const headGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16)
  const headMaterial = new MeshBasicMaterial({ color })
  const head = new Mesh(headGeometry, headMaterial)

  const group = new Group()
  group.add(shaft, head)

  const direction = new Vector3()
  const shaftEnd = new Vector3()

  return {
    object: group,
    setEnds: (from: Vector3, to: Vector3) => {
      direction.copy(to).sub(from).normalize()

      // 円錐の底面が線の先端に来るよう、矢印の高さのぶん手前で線を止める
      shaftEnd.copy(to).addScaledVector(direction, -ARROW_HEIGHT)
      shaftPositions.set([from.x, from.y, from.z, shaftEnd.x, shaftEnd.y, shaftEnd.z])
      shaftGeometry.setPositions(shaftPositions)

      // ConeGeometry の原点は円錐の中心なので、半分ぶん戻した位置に置く
      head.position.copy(to).addScaledVector(direction, -ARROW_HEIGHT / 2)
      head.quaternion.setFromUnitVectors(CONE_UP, direction)
    },
    setColor: (next: string) => {
      shaftMaterial.color.set(next)
      headMaterial.color.set(next)
    },
    dispose: () => {
      const disposables = [shaftGeometry, shaftMaterial, headGeometry, headMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/**
 * `2`つの向きがなす角を、塗りつぶした扇で示す。
 * 角の大小がそのまま扇の広さになるので、鋭角か鈍角かを面積で読み取れる
 */
const createSector = (color: string) => {
  // 要（かなめ）と弧の両端で 1 枚の三角形。それを分割数だけ並べて扇にする
  const position = new Float32BufferAttribute(new Float32Array(SECTOR_SEGMENTS * 3 * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new MeshBasicMaterial({
    color,
    side: DoubleSide,
    transparent: true,
    opacity: SECTOR_OPACITY,
    depthWrite: false
  })
  const mesh = new Mesh(geometry, material)
  mesh.renderOrder = SECTOR_ORDER

  const axis = new Vector3()
  const current = new Vector3()
  const next = new Vector3()

  return {
    object: mesh,
    /** from・to は単位ベクトル。from を to まで回した範囲が扇になる */
    setAngle: (center: Vector3, from: Vector3, to: Vector3) => {
      // 2 つの向きが張る平面に垂直な向きが回転軸
      axis.crossVectors(from, to).normalize()
      const angle = Math.acos(MathUtils.clamp(from.dot(to), -1, 1))

      for (let index = 0; index < SECTOR_SEGMENTS; index++) {
        current
          .copy(from)
          .applyAxisAngle(axis, (angle * index) / SECTOR_SEGMENTS)
          .multiplyScalar(SECTOR_RADIUS)
          .add(center)
        next
          .copy(from)
          .applyAxisAngle(axis, (angle * (index + 1)) / SECTOR_SEGMENTS)
          .multiplyScalar(SECTOR_RADIUS)
          .add(center)

        position.setXYZ(index * 3, center.x, center.y, center.z)
        position.setXYZ(index * 3 + 1, current.x, current.y, current.z)
        position.setXYZ(index * 3 + 2, next.x, next.y, next.z)
      }
      position.needsUpdate = true
    },
    setColor: (nextColor: string) => material.color.set(nextColor),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** なす角と内積を、Tweakpane に読み取り専用で出す 1 行の文字列にする */
const formatMeasure = (cosine: number, dot: number) => {
  const degrees = Math.round(MathUtils.radToDeg(Math.acos(MathUtils.clamp(cosine, -1, 1))))
  return `${degrees}°（n・e = ${dot >= 0 ? "+" : ""}${dot.toFixed(2)}）`
}

export const createBackfaceTestScene = ({ scene, params }: SceneContext) => {
  // 面ごとに 1 つの Mesh を作る。表裏で色を変え、外した面だけを消すため、面ごとに独立させる。
  // 深度を書かない半透明にして、立体の内部を通るベクトルが透けて見えるようにする
  const faces = createCubeFaces().map((vertices) => {
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", new Float32BufferAttribute(createFacePositions(vertices), 3))
    const material = new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      opacity: FACE_OPACITY,
      depthWrite: false
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = FACE_ORDER
    scene.add(mesh)

    return { ...measureFace(vertices), geometry, material, mesh }
  })

  // 面を外しても立方体の形が読めるよう、稜線は常に残す
  const boxGeometry = new BoxGeometry(CUBE_HALF * 2, CUBE_HALF * 2, CUBE_HALF * 2)
  const edgeGeometry = new EdgesGeometry(boxGeometry)
  boxGeometry.dispose()
  const edgeMaterial = new LineBasicMaterial({ color: EDGE_COLOR })
  scene.add(new LineSegments(edgeGeometry, edgeMaterial))

  // 表裏を判定する視点。観察するカメラとは別の点なので、回り込んで外側から眺められる
  const eyeGeometry = new SphereGeometry(EYE_RADIUS, 16, 12)
  const eyeMaterial = new MeshBasicMaterial({ color: EYE_COLOR })
  const eyeMarker = new Mesh(eyeGeometry, eyeMaterial)
  const eyeLabel = createLabel("視点", EYE_COLOR)
  scene.add(eyeMarker, eyeLabel.sprite)

  // 注目する 1 面（+z の面）にだけ、法線ベクトル n・視点方向ベクトル e・なす角の扇を添える
  const target = faces[0]
  const normalArrow = createArrow(FRONT_ACCENT)
  normalArrow.setEnds(
    target.center,
    target.center.clone().addScaledVector(target.normal, NORMAL_LENGTH)
  )
  const eyeArrow = createArrow(EYE_COLOR)
  const sector = createSector(FRONT_ACCENT)
  const normalLabel = createLabel("n", FRONT_ACCENT)
  normalLabel.sprite.position
    .copy(target.center)
    .addScaledVector(target.normal, NORMAL_LENGTH + LABEL_GAP)
  const eyeVectorLabel = createLabel("e", EYE_COLOR)
  scene.add(
    normalArrow.object,
    eyeArrow.object,
    sector.object,
    normalLabel.sprite,
    eyeVectorLabel.sprite
  )

  const eye = new Vector3()
  const toEye = new Vector3()
  const eyeDirection = new Vector3()
  const arrowEnd = new Vector3()

  return {
    update: () => {
      const azimuth = MathUtils.degToRad(params.eyeAzimuth)
      eye.set(EYE_DISTANCE * Math.sin(azimuth), EYE_HEIGHT, EYE_DISTANCE * Math.cos(azimuth))
      eyeMarker.position.copy(eye)
      eyeLabel.sprite.position.set(
        eye.x,
        eye.y + EYE_RADIUS + LABEL_GAP + eyeLabel.sprite.scale.y / 2,
        eye.z
      )

      for (const face of faces) {
        // 面から視点へ向かう視点方向ベクトル e
        toEye.subVectors(eye, face.center)

        // n と e の内積。負なら、なす角が鈍角＝裏を向いた面
        const isBack = face.normal.dot(toEye) < 0

        face.material.color.set(isBack ? BACK_FACE_COLOR : FRONT_FACE_COLOR)
        face.mesh.visible = !(isBack && params.cullBackFaces)
      }

      // 注目する面のなす角。裏を向いたときは e が立体の内部を貫く
      toEye.subVectors(eye, target.center)
      const dot = target.normal.dot(toEye)
      const accent = dot < 0 ? BACK_ACCENT : FRONT_ACCENT
      normalArrow.setColor(accent)
      sector.setColor(accent)

      eyeDirection.copy(toEye).normalize()
      // 矢じりが視点の球に食い込まないよう、少し手前で止める
      arrowEnd.copy(eye).addScaledVector(eyeDirection, -(EYE_RADIUS + 0.03))
      eyeArrow.setEnds(target.center, arrowEnd)
      sector.setAngle(target.center, target.normal, eyeDirection)
      eyeVectorLabel.sprite.position.copy(target.center).addScaledVector(toEye, E_LABEL_RATIO)

      params.measure = formatMeasure(dot / toEye.length(), dot)
    },
    dispose: () => {
      for (const face of faces) {
        face.geometry.dispose()
        face.material.dispose()
      }
      edgeGeometry.dispose()
      edgeMaterial.dispose()
      eyeGeometry.dispose()
      eyeMaterial.dispose()
      normalArrow.dispose()
      eyeArrow.dispose()
      sector.dispose()
      for (const label of [eyeLabel, normalLabel, eyeVectorLabel]) {
        label.texture.dispose()
        label.material.dispose()
      }
    }
  }
}
