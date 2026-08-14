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
  /** 法線ベクトルと視点方向ベクトルを添える面。createCubeFaces が返す順の番号 */
  targetFace: number
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
 * 表裏を判定する視点の位置。**立方体の 6 面がちょうど表 3 枚・裏 3 枚に分かれる**位置に固定する。
 * 立方体の対角の方向（方位 45 度）に置いたうえで高さを持たせると、
 * 上面が表・下面が裏に定まり、どの面のなす角も直角から離れる。
 * 法線ベクトルと視点方向ベクトルが真逆に並ぶこともなくなるので、なす角の扇が必ず開く。
 *
 * **`BackfaceTestDemo.svelte` の選択肢のラベル（表を向いた面／裏を向いた面）は、
 * この位置から決まる表裏に依存している。** 動かすときは向こうも直す
 */
const EYE_AZIMUTH = Math.PI / 4
const EYE_HEIGHT = 1.5
const EYE_DISTANCE = 3.4

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
 * 面の不透明度。
 * 立体の内部を貫く視点方向ベクトルが透けて見える程度に薄くする
 */
const FACE_OPACITY = 0.5

/**
 * 扇の不透明度。
 * 扇と法線ベクトルの矢印は同じ色なので、扇をわずかに透かして矢印と見分けられるようにする
 */
const SECTOR_OPACITY = 0.72

/** ラベルを、矢印の先からさらに離す距離 */
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
 * 稜線と矢印は不透明なので、半透明なものより先に描かれる。
 * 扇は既定の 0 のままなので面より先に描かれ、立体の内部に入り込んだ部分も面越しに透ける。
 * ラベルは最後に描き、深度テストも外して必ず読めるようにする
 */
const FACE_ORDER = 1
const LABEL_ORDER = 2

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

/** 表裏を判定する視点。観察するカメラとは別の点なので、回り込んで外側から眺められる */
const EYE = new Vector3(
  EYE_DISTANCE * Math.sin(EYE_AZIMUTH),
  EYE_HEIGHT,
  EYE_DISTANCE * Math.cos(EYE_AZIMUTH)
)

/**
 * 立方体の 6 面を、外から見て反時計回りに並べた頂点として返す。
 * 並びは +z・−z・+x・−x・+y・−y の順。
 * **この順番が `BackfaceTestDemo.svelte` の選択肢の番号になる**ので、入れ替えるときは向こうも直す
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
    // 扇の縁は法線ベクトルの矢印と重なる。扇をわずかに奥へずらして z ファイティングを避ける
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  })
  const mesh = new Mesh(geometry, material)

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

  // 注目する 1 面にだけ、法線ベクトル n・視点方向ベクトル e・なす角の扇を添える。
  // どの面に添えるかは操作で切り替わるので、位置は毎フレーム決め直す
  const normalArrow = createArrow(FRONT_ACCENT)
  const eyeArrow = createArrow(EYE_COLOR)
  const sector = createSector(FRONT_ACCENT)
  const normalLabel = createLabel("n", FRONT_ACCENT)
  const eyeVectorLabel = createLabel("e", EYE_COLOR)
  scene.add(
    normalArrow.object,
    eyeArrow.object,
    sector.object,
    normalLabel.sprite,
    eyeVectorLabel.sprite
  )

  const toEye = new Vector3()
  const eyeDirection = new Vector3()
  const normalEnd = new Vector3()

  return {
    update: () => {
      for (const face of faces) {
        // 面から視点へ向かう視点方向ベクトル e
        toEye.subVectors(EYE, face.center)

        // n と e の内積。負なら、なす角が鈍角＝裏を向いた面
        const isBack = face.normal.dot(toEye) < 0

        face.material.color.set(isBack ? BACK_FACE_COLOR : FRONT_FACE_COLOR)
        face.mesh.visible = !(isBack && params.cullBackFaces)
      }

      // 注目する面のなす角。裏を向いた面では e が立体の内部を貫く
      const target = faces[params.targetFace]
      toEye.subVectors(EYE, target.center)
      const dot = target.normal.dot(toEye)
      const accent = dot < 0 ? BACK_ACCENT : FRONT_ACCENT

      normalEnd.copy(target.center).addScaledVector(target.normal, NORMAL_LENGTH)
      normalArrow.setEnds(target.center, normalEnd)
      normalArrow.setColor(accent)
      normalLabel.sprite.position.copy(normalEnd).addScaledVector(target.normal, LABEL_GAP)

      eyeDirection.copy(toEye).normalize()
      // 矢印の先が視点そのもの。n と同じく、ラベルは矢じりの少し先に置く
      eyeArrow.setEnds(target.center, EYE)
      eyeVectorLabel.sprite.position.copy(EYE).addScaledVector(eyeDirection, LABEL_GAP)

      sector.setAngle(target.center, target.normal, eyeDirection)
      sector.setColor(accent)

      params.measure = formatMeasure(dot / toEye.length(), dot)
    },
    dispose: () => {
      for (const face of faces) {
        face.geometry.dispose()
        face.material.dispose()
      }
      edgeGeometry.dispose()
      edgeMaterial.dispose()
      normalArrow.dispose()
      eyeArrow.dispose()
      sector.dispose()
      for (const label of [normalLabel, eyeVectorLabel]) {
        label.texture.dispose()
        label.material.dispose()
      }
    }
  }
}
