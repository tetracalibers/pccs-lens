import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type AxonometricParams = {
  /** 投影面に垂直な向きの方位角（度）。形状の座標系で、z 軸から y 軸まわりに測る */
  azimuthDeg: number
  /** 投影面に垂直な向きの仰角（度）。形状の座標系で、zx 平面から起こす角 */
  elevationDeg: number
  /** 3 軸の縮み率。scene.ts が計算して書き戻す表示用の値 */
  scales: string
  /** 像の上で軸どうしがなす角。同じく書き戻す表示用の値 */
  angles: string
  /** 縮み率の揃い方で決まる軸測投影の種類。同じく書き戻す表示用の値 */
  kind: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: AxonometricParams
}

/** 1 辺 1 の立方体の 8 頂点。原点の隅から +x・+y・+z の側へ伸ばす */
const CUBE_VERTICES: [number, number, number][] = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1]
]

/** 立方体の稜線 12 本。結ぶ 2 頂点の番号を並べる */
const CUBE_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/**
 * 原点から伸びる 3 辺（0-1・0-3・0-4）を除いた 9 本。
 * この 3 辺は座標軸と同じ場所にあるので、軸の線を重ねて描く側ではこちらを使う
 */
const CUBE_EDGES_EXCEPT_AXES = [1, 2, 2, 3, 4, 5, 5, 6, 6, 7, 7, 4, 1, 5, 2, 6, 3, 7]

/** 座標軸の向き。順に x・y・z */
const AXIS_DIRECTIONS: [number, number, number][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]

const AXIS_NAMES = ["x", "y", "z"]

/** 軸を原点から伸ばす長さ。立方体の 1 辺（1）より少し長くして、稜線の先に軸名を出す */
const AXIS_LENGTH = 1.15

/** 投影面の 1 辺の長さと、形状の向こう側（z の負の側）へ離す距離 */
const PLANE_SIZE = 2.8
const PLANE_Z = -1.5

/** 左右 2 面の中心を、原点からどれだけ離して置くか */
const PANEL_OFFSET = 2

/**
 * 左の面（空間のようす）の見せ方。
 * 投影面と投射線を含む立体なので、右の面よりかさばる。縮めたうえで、
 * 投射線が真後ろを向いて点に見えないように斜めから見る向きへ回す
 */
const SETUP_SCALE = 0.62
const SETUP_TILT_X = 0.28
const SETUP_TILT_Y = -0.75

/** 矢印の大きさ */
const ARROW_RADIUS = 0.05
const ARROW_HEIGHT = 0.16

/** 軸名のラベルの高さ（表示上の大きさ）と、矢印の先からさらに離す距離 */
const AXIS_LABEL_HEIGHT = 0.26
const LABEL_OFFSET = 0.2

/** 見出しのラベルの高さと、2 つの見出しを置く高さ */
const TITLE_HEIGHT = 0.3
const TITLE_Y = 1.85

/** 縮まなかったときの軸の先を示す円の分割数 */
const CIRCLE_SEGMENTS = 96

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・形状・像・投影面が見分けられる色にする。
// 軸の色はほかの座標系のデモと揃え、像は形状と見分けのつく暖色にする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const Z_COLOR = "#5ec8f2"
const AXIS_COLORS = [X_COLOR, Y_COLOR, Z_COLOR]
const SHAPE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const PLANE_COLOR = "#8fa3bf"
const GUIDE_COLOR = "#667486"
const TITLE_COLOR = "#e8e8ee"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「投影面に写った像」のような複数文字のラベルもあるので、文字の幅を測って板の横幅を決める
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる半透明の面や線が
    // ラベルの矩形の形に欠け、文字に黒い下敷きが付いたように見える
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/**
 * 原点から 1 点へ伸ばす軸。向きは操作のたびに変わるので、先端を渡して作り直せるようにする。
 * `labelHeight` に 0 を渡すと、矢印と軸名を付けない線だけの軸になる
 */
const createAxis = (name: string, color: string, labelHeight: number) => {
  const group = new Group()

  const linePosition = new Float32BufferAttribute(new Float32Array(6), 3)
  const lineGeometry = new BufferGeometry().setAttribute("position", linePosition)
  const lineMaterial = new LineBasicMaterial({ color })
  group.add(new LineSegments(lineGeometry, lineMaterial))

  const decorated = labelHeight > 0

  // ConeGeometry は +y を向いているので、軸の向きへ回してから先端に置く
  const arrowGeometry = decorated ? new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16) : null
  const arrowMaterial = decorated ? new MeshBasicMaterial({ color }) : null
  const arrow = arrowGeometry && arrowMaterial ? new Mesh(arrowGeometry, arrowMaterial) : null
  if (arrow) group.add(arrow)

  const label = decorated ? createLabel(name, color, labelHeight) : null
  if (label) group.add(label.sprite)

  const direction = new Vector3()

  return {
    object: group,
    setTip: (tip: Vector3) => {
      linePosition.setXYZ(0, 0, 0, 0)
      linePosition.setXYZ(1, tip.x, tip.y, tip.z)
      linePosition.needsUpdate = true

      direction.copy(tip).normalize()
      if (arrow) {
        arrow.position.copy(tip)
        arrow.quaternion.setFromUnitVectors(CONE_UP, direction)
      }
      if (label) label.sprite.position.copy(tip).addScaledVector(direction, LABEL_OFFSET)
    },
    dispose: () => {
      lineGeometry.dispose()
      lineMaterial.dispose()
      arrowGeometry?.dispose()
      arrowMaterial?.dispose()
      label?.texture.dispose()
      label?.material.dispose()
    }
  }
}

/** 稜線でつないだ線を、頂点を書き換えられる形で作る */
const createWireframe = (vertexCount: number, edges: number[], color: string) => {
  const vertices = new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", vertices).setIndex(edges)
  const material = new LineBasicMaterial({ color })
  return { object: new LineSegments(geometry, material), vertices, geometry, material }
}

export const createAxonometricScene = ({ scene, params }: SceneContext) => {
  // 左は空間のようす（立方体・座標軸・投影面・投射線・投影面に写った像）。
  // 投影面が画面と平行なままなので、傾けているのは形状の側に見える
  const setup = new Group()
  setup.position.x = -PANEL_OFFSET
  setup.rotation.set(SETUP_TILT_X, SETUP_TILT_Y, 0)
  setup.scale.setScalar(SETUP_SCALE)
  scene.add(setup)

  // 右は投影面に写った像だけを正面から見たもの。ここで軸のなす角と縮み率を読み取る
  const panel = new Group()
  panel.position.x = PANEL_OFFSET
  scene.add(panel)

  // 投影面。xy 平面に平行な正方形を、形状の向こう側（z の負の側）に置く
  const planeGeometry = new PlaneGeometry(PLANE_SIZE, PLANE_SIZE)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  plane.position.z = PLANE_Z
  setup.add(plane)

  const borderGeometry = new EdgesGeometry(planeGeometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  const border = new LineSegments(borderGeometry, borderMaterial)
  border.position.z = PLANE_Z
  setup.add(border)

  // 投影される立方体。原点から伸びる 3 辺は座標軸と重なるので、稜線からは外す
  const shape = createWireframe(CUBE_VERTICES.length, CUBE_EDGES_EXCEPT_AXES, SHAPE_COLOR)
  setup.add(shape.object)

  // 投射線。頂点 1 つにつき 1 本（2 頂点）、頂点から投影面へ垂直に下ろす
  const rayPosition = new Float32BufferAttribute(new Float32Array(CUBE_VERTICES.length * 6), 3)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  setup.add(new LineSegments(rayGeometry, rayMaterial))

  // 投影面に写った像。こちらは軸の線を重ねないので、稜線を 12 本とも描く
  const planeImage = createWireframe(CUBE_VERTICES.length, CUBE_EDGES, IMAGE_COLOR)
  setup.add(planeImage.object)

  // 右の面に写す像。軸の像を重ねるので、稜線は 9 本にする
  const panelImage = createWireframe(CUBE_VERTICES.length, CUBE_EDGES_EXCEPT_AXES, IMAGE_COLOR)
  panel.add(panelImage.object)

  // 縮まなかったときの軸の先。像の上の軸がどれだけ内側に収まるかの目安になる
  const circleGeometry = new BufferGeometry().setFromPoints(
    Array.from({ length: CIRCLE_SEGMENTS }, (_, i) => {
      const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2
      return new Vector3(Math.cos(angle) * AXIS_LENGTH, Math.sin(angle) * AXIS_LENGTH, 0)
    })
  )
  const circleMaterial = new LineBasicMaterial({ color: GUIDE_COLOR })
  panel.add(new LineLoop(circleGeometry, circleMaterial))

  // 空間の 3 軸・投影面に写った軸の像・右の面に写した軸の像。
  // 左の面は縮めて置くので、軸名だけは縮んだぶんを打ち消して同じ大きさに見せる
  const spaceAxes = AXIS_NAMES.map((name, i) =>
    createAxis(name, AXIS_COLORS[i], AXIS_LABEL_HEIGHT / SETUP_SCALE)
  )
  const planeAxes = AXIS_NAMES.map((name, i) => createAxis(name, AXIS_COLORS[i], 0))
  const panelAxes = AXIS_NAMES.map((name, i) => createAxis(name, AXIS_COLORS[i], AXIS_LABEL_HEIGHT))
  spaceAxes.forEach((axis) => setup.add(axis.object))
  planeAxes.forEach((axis) => {
    axis.object.position.z = PLANE_Z
    setup.add(axis.object)
  })
  panelAxes.forEach((axis) => panel.add(axis.object))

  const titles = [
    createLabel("立方体と投影面", TITLE_COLOR, TITLE_HEIGHT),
    createLabel("投影面に写った像", TITLE_COLOR, TITLE_HEIGHT)
  ]
  titles[0].sprite.position.set(-PANEL_OFFSET, TITLE_Y, 0)
  titles[1].sprite.position.set(PANEL_OFFSET, TITLE_Y, 0)
  titles.forEach((title) => scene.add(title.sprite))

  const orientation = new Matrix4()
  const yRotation = new Matrix4()
  const point = new Vector3()
  const tip = new Vector3()
  // 像の上での 3 軸の向き。縮み率と、軸どうしがなす角をここから求める
  const projectedAxes = AXIS_DIRECTIONS.map(() => new Vector3())

  return {
    update: () => {
      const azimuth = MathUtils.degToRad(params.azimuthDeg)
      const elevation = MathUtils.degToRad(params.elevationDeg)

      // 投影面に垂直な向き（方位角と仰角で決まる）が z 軸に重なるように形状を回す。
      // 投影面を傾けるかわりに形状の側を回しているが、両者の関係は変わらない。
      // 投影面が画面と平行なままになるので、そこに写った像を正面から読み取れる
      orientation.makeRotationX(elevation).multiply(yRotation.makeRotationY(-azimuth))

      CUBE_VERTICES.forEach(([x, y, z], i) => {
        point.set(x, y, z).applyMatrix4(orientation)
        shape.vertices.setXYZ(i, point.x, point.y, point.z)

        // 直投影の像は、投影面に垂直な向きの座標（z）を落とすだけで求まる。
        // 投影面までの距離が変わっても像は動かない
        planeImage.vertices.setXYZ(i, point.x, point.y, PLANE_Z)
        panelImage.vertices.setXYZ(i, point.x, point.y, 0)

        // 投射線は頂点から投影面へまっすぐ下ろす。どの頂点でも向きは同じ（互いに平行）
        rayPosition.setXYZ(i * 2, point.x, point.y, point.z)
        rayPosition.setXYZ(i * 2 + 1, point.x, point.y, PLANE_Z)
      })
      shape.vertices.needsUpdate = true
      planeImage.vertices.needsUpdate = true
      panelImage.vertices.needsUpdate = true
      rayPosition.needsUpdate = true

      AXIS_DIRECTIONS.forEach(([x, y, z], i) => {
        point.set(x, y, z).applyMatrix4(orientation).multiplyScalar(AXIS_LENGTH)
        spaceAxes[i].setTip(point)
        planeAxes[i].setTip(tip.set(point.x, point.y, 0))
        panelAxes[i].setTip(tip.set(point.x, point.y, 0))
        projectedAxes[i].set(point.x, point.y, 0)
      })

      // 長さ 1 の軸が像の上で何倍になるかが縮み率。
      // 表示に出す桁でそろえた値から種類を決め、数値と種類が食い違わないようにする
      const scales = projectedAxes.map((axis) => Math.round((axis.length() / AXIS_LENGTH) * 100))
      const matched =
        (scales[0] === scales[1] ? 1 : 0) +
        (scales[1] === scales[2] ? 1 : 0) +
        (scales[2] === scales[0] ? 1 : 0)

      params.scales = scales.map((scale) => (scale / 100).toFixed(2)).join(" / ")
      params.angles = projectedAxes
        .map((axis, i) => {
          const angle = MathUtils.radToDeg(axis.angleTo(projectedAxes[(i + 1) % 3]))
          return `${Math.round(angle)}°`
        })
        .join(" / ")
      params.kind = matched === 3 ? "等測投影" : matched > 0 ? "二等測投影" : "不等測投影"
    },
    dispose: () => {
      const disposables = [
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        shape.geometry,
        shape.material,
        rayGeometry,
        rayMaterial,
        planeImage.geometry,
        planeImage.material,
        panelImage.geometry,
        panelImage.material,
        circleGeometry,
        circleMaterial,
        ...titles.flatMap((title) => [title.texture, title.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
      ;[...spaceAxes, ...planeAxes, ...panelAxes].forEach((axis) => axis.dispose())
    }
  }
}
