import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type OrthographicParams = {
  /** 形状の奥行き（投影面に垂直な向きの長さ） */
  depth: number
  /** 投射線を表示するか */
  showRays: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: OrthographicParams
}

/**
 * 投影面に平行な断面（`1` 辺 `1` の正方形）の 4 隅。
 * これを投影面に垂直な向き（`z`）へ、奥行きのぶんだけ前後に振り分けて立体にする
 */
const BOX_CORNERS: [number, number][] = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5]
]

/** 稜線 12 本。前半 4 頂点が奥（投影面側）の面、後半 4 頂点が手前の面 */
const BOX_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]

/** 投影面の 1 辺の長さと、形状の向こう側（z の負の側）へ離す距離 */
const PLANE_SIZE = 2.4
const PLANE_Z = -1.6

/** 像の隅に置く点の大きさ（画面上のピクセル数） */
const DOT_SIZE = 7

/** ラベルの高さ（表示上の大きさ）と、投影面の上辺から離す距離 */
const LABEL_HEIGHT = 0.26
const LABEL_GAP = 0.22

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、形状・像・投影面が見分けられる色にする。
// 像は形状と見分けのつく暖色にする
const SHAPE_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const PLANE_COLOR = "#8fa3bf"
const LABEL_COLOR = "#e8e8ee"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 回転させても文字がカメラを向いたままになるので、どの向きからでも読める
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

/** 稜線でつないだ線を、頂点を書き換えられる形で作る */
const createWireframe = (vertexCount: number, edges: number[], color: string) => {
  const vertices = new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", vertices).setIndex(edges)
  const material = new LineBasicMaterial({ color })
  return { object: new LineSegments(geometry, material), vertices, geometry, material }
}

export const createOrthographicScene = ({ scene, params }: SceneContext) => {
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
  scene.add(plane)

  const borderGeometry = new EdgesGeometry(planeGeometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  const border = new LineSegments(borderGeometry, borderMaterial)
  border.position.z = PLANE_Z
  scene.add(border)

  // 投影される立体。奥行きで前後に伸び縮みする
  const shape = createWireframe(BOX_CORNERS.length * 2, BOX_EDGES, SHAPE_COLOR)
  scene.add(shape.object)

  // 投影面に写った像。稜線のつなぎ方（インデックス）は立体と同じ
  const image = createWireframe(BOX_CORNERS.length * 2, BOX_EDGES, IMAGE_COLOR)
  scene.add(image.object)

  // 奥行き方向の稜線が潰れた先。像の隅に点を置いて、辺 1 本が 1 点になったことを示す
  const dotGeometry = new BufferGeometry().setFromPoints(
    BOX_CORNERS.map(([x, y]) => new Vector3(x, y, PLANE_Z))
  )
  const dotMaterial = new PointsMaterial({
    color: IMAGE_COLOR,
    size: DOT_SIZE,
    // 遠近で点の大きさを変えない。像の隅を指す印なので、常に同じ大きさで見せる
    sizeAttenuation: false
  })
  scene.add(new Points(dotGeometry, dotMaterial))

  // 投射線。奥（投影面側）の 4 頂点から 1 本ずつ引く。
  // 手前の頂点から引くと奥行きの稜線をなぞって線が二重になるので、そちらは引かない
  const rayPosition = new Float32BufferAttribute(new Float32Array(BOX_CORNERS.length * 6), 3)
  const rayGeometry = new BufferGeometry().setAttribute("position", rayPosition)
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR })
  const rays = new LineSegments(rayGeometry, rayMaterial)
  scene.add(rays)

  const label = createLabel("投影面に写った像", LABEL_COLOR, LABEL_HEIGHT)
  label.sprite.position.set(0, PLANE_SIZE / 2 + LABEL_GAP, PLANE_Z)
  scene.add(label.sprite)

  return {
    update: () => {
      // 奥行きは投影面に垂直な向きへ前後に振り分ける。
      // 投影面に平行な断面（x・y）は奥行きによらず変わらない
      const half = params.depth / 2

      BOX_CORNERS.forEach(([x, y], i) => {
        shape.vertices.setXYZ(i, x, y, -half)
        shape.vertices.setXYZ(i + BOX_CORNERS.length, x, y, half)

        // 直投影の像は、投影面に垂直な向きの座標（z）を投影面の位置に置き換えるだけ。
        // x・y はそのまま残るので、投影面に平行な断面は形も大きさも変わらずに写る。
        // 奥行きの両端はどちらも同じ 1 点に重なり、奥行き方向の辺は長さを失う
        image.vertices.setXYZ(i, x, y, PLANE_Z)
        image.vertices.setXYZ(i + BOX_CORNERS.length, x, y, PLANE_Z)

        // 投射線は投影面へ垂直に下ろす。どの頂点でも向きは同じ（互いに平行）
        rayPosition.setXYZ(i * 2, x, y, -half)
        rayPosition.setXYZ(i * 2 + 1, x, y, PLANE_Z)
      })
      shape.vertices.needsUpdate = true
      image.vertices.needsUpdate = true
      rayPosition.needsUpdate = true

      rays.visible = params.showRays
    },
    dispose: () => {
      const disposables = [
        planeGeometry,
        planeMaterial,
        borderGeometry,
        borderMaterial,
        shape.geometry,
        shape.material,
        image.geometry,
        image.material,
        dotGeometry,
        dotMaterial,
        rayGeometry,
        rayMaterial,
        label.texture,
        label.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
