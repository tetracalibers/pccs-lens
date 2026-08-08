import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
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
export type ThreeViewsParams = {
  /** 3 枚の投影面を 1 枚へ折り開く度合い。0 で箱のまま、1 で開ききる */
  unfold: number
  /** 投影される立体そのものを表示するか */
  showSolid: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ThreeViewsParams
}

/**
 * L字に切り欠いた断面（xy 平面）。左側だけが高く立ち上がった形にして、
 * 3 方向のどの図も違う形になるようにする
 */
const PROFILE: [number, number][] = [
  [-0.8, -0.6],
  [0.8, -0.6],
  [0.8, -0.1],
  [-0.2, -0.1],
  [-0.2, 0.6],
  [-0.8, 0.6]
]

/** 断面を押し出す奥行きの半分。断面を z = ±SOLID_DEPTH に置く */
const SOLID_DEPTH = 0.5

/** 断面を前後に置いた 12 頂点。前半が手前（z の正の側）、後半が奥 */
const SOLID_VERTICES: [number, number, number][] = [
  ...PROFILE.map(([x, y]): [number, number, number] => [x, y, SOLID_DEPTH]),
  ...PROFILE.map(([x, y]): [number, number, number] => [x, y, -SOLID_DEPTH])
]

/** 稜線 18 本。前後の断面それぞれ 6 本と、前後を結ぶ 6 本 */
const SOLID_EDGES = PROFILE.flatMap((_, i) => {
  const next = (i + 1) % PROFILE.length
  return [i, next, i + PROFILE.length, next + PROFILE.length, i, i + PROFILE.length]
})

/**
 * 立体を囲む箱の半分の大きさ。この箱の手前（`z`）・上（`y`）・右（`x`）の 3 面が投影面になる。
 * 折り開いたとき、平面図と側面図はそれぞれ `2 * BOX_Z` ぶんの幅を占める
 */
const BOX_X = 1.1
const BOX_Y = 0.9
const BOX_Z = 0.8

/** 折り開く前の全体の傾き。3 枚の面が重ならずに見える向きにする */
const FOLDED_TILT_X = 0.3
const FOLDED_TILT_Y = -0.6

/** 折り開く前の全体の拡大率。畳んだ状態は小さいので、開くにつれて等倍へ戻す */
const FOLDED_SCALE = 1.25

/** 対応線が現れはじめる展開の度合い。折り目が立っているうちは位置がそろわないので出さない */
const GUIDE_FADE_START = 0.9

/** 対応線を図から離す隙間と、図の名前を面から離す隙間 */
const GUIDE_MARGIN = 0.04
const LABEL_GAP = 0.2

/** 図の名前のラベルの高さ（表示上の大きさ） */
const LABEL_HEIGHT = 0.26

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、立体・像・投影面が見分けられる色にする。
// 像は立体と見分けのつく暖色にし、対応線は図より目立たない色にする
const SOLID_COLOR = "#e8e8ee"
const IMAGE_COLOR = "#ffc857"
const RAY_COLOR = "#7d8794"
const PLANE_COLOR = "#8fa3bf"
const GUIDE_COLOR = "#667486"
const LABEL_COLOR = "#e8e8ee"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 「正面図」のような複数文字のラベルなので、文字の幅を測って板の横幅を決める
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

/** 半透明の面と輪郭線でできた投影面 1 枚 */
const createPlane = (width: number, height: number) => {
  const group = new Group()

  const geometry = new PlaneGeometry(width, height)
  const material = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.12
  })
  group.add(new Mesh(geometry, material))

  const borderGeometry = new EdgesGeometry(geometry)
  const borderMaterial = new LineBasicMaterial({ color: PLANE_COLOR })
  group.add(new LineSegments(borderGeometry, borderMaterial))

  return { object: group, geometry, material, borderGeometry, borderMaterial }
}

/** 稜線でつないだ線。立体も像も動かないので、頂点はここで決めきる */
const createWireframe = (vertices: number[][], edges: number[], color: string) => {
  const geometry = new BufferGeometry()
    .setFromPoints(vertices.map(([x, y, z]) => new Vector3(x, y, z)))
    .setIndex(edges)
  const material = new LineBasicMaterial({ color })
  return { object: new LineSegments(geometry, material), geometry, material }
}

/** 同じ値を 1 つにまとめて小さい順に並べる。対応線を引く位置を稜線から拾うのに使う */
const distinct = (values: number[]) => [...new Set(values)].sort((a, b) => a - b)

export const createThreeViewsScene = ({ scene, params }: SceneContext) => {
  // 折り開く操作にあわせて、全体の傾き・大きさ・位置を動かす入れもの
  const root = new Group()
  scene.add(root)

  // 上（平面図）と右（側面図）の面は、折り開くときの回転軸まわりに回る。
  // 正面の面と共有する辺を Group の原点に置くと、軸まわりの回転だけで折り開ける
  const topGroup = new Group()
  topGroup.position.set(0, BOX_Y, BOX_Z)
  root.add(topGroup)

  const rightGroup = new Group()
  rightGroup.position.set(BOX_X, 0, BOX_Z)
  root.add(rightGroup)

  // 座標平面に平行な 3 枚の投影面。立体を囲む箱の、手前・上・右の面にあたる
  const frontPlane = createPlane(BOX_X * 2, BOX_Y * 2)
  frontPlane.object.position.z = BOX_Z
  root.add(frontPlane.object)

  const topPlane = createPlane(BOX_X * 2, BOX_Z * 2)
  topPlane.object.rotation.x = Math.PI / 2
  topPlane.object.position.z = -BOX_Z
  topGroup.add(topPlane.object)

  const rightPlane = createPlane(BOX_Z * 2, BOX_Y * 2)
  rightPlane.object.rotation.y = Math.PI / 2
  rightPlane.object.position.z = -BOX_Z
  rightGroup.add(rightPlane.object)

  // 投影される立体
  const solid = createWireframe(SOLID_VERTICES, SOLID_EDGES, SOLID_COLOR)
  root.add(solid.object)

  // 正面図。投影面に垂直な向き（z）の座標を投影面の位置に置き換えると求まる
  const frontVertices = SOLID_VERTICES.map(([x, y]) => [x, y, BOX_Z])
  const frontView = createWireframe(frontVertices, SOLID_EDGES, IMAGE_COLOR)
  root.add(frontView.object)

  // 平面図。真上から見下ろすので y を置き換える。
  // 折り開く Group の中に置くため、共有する辺を原点とした座標にする
  const topVertices = SOLID_VERTICES.map(([x, , z]) => [x, 0, z - BOX_Z])
  const topView = createWireframe(topVertices, SOLID_EDGES, IMAGE_COLOR)
  topGroup.add(topView.object)

  // 側面図。真横から見るので x を置き換える
  const sideVertices = SOLID_VERTICES.map(([, y, z]) => [0, y, z - BOX_Z])
  const sideView = createWireframe(sideVertices, SOLID_EDGES, IMAGE_COLOR)
  rightGroup.add(sideView.object)

  // 投射線。頂点 1 つにつき、3 枚の投影面へ 1 本ずつ引く。
  // 折り開くと像との対応が崩れるので、開くにつれて消す
  const rayGeometry = new BufferGeometry().setFromPoints(
    SOLID_VERTICES.flatMap(([x, y, z]) => [
      new Vector3(x, y, z),
      new Vector3(x, y, BOX_Z),
      new Vector3(x, y, z),
      new Vector3(x, BOX_Y, z),
      new Vector3(x, y, z),
      new Vector3(BOX_X, y, z)
    ])
  )
  const rayMaterial = new LineBasicMaterial({ color: RAY_COLOR, transparent: true })
  const rays = new LineSegments(rayGeometry, rayMaterial)
  root.add(rays)

  /*
   * 折り開いたあとに、3 枚のあいだで位置がそろうことを示す対応線。
   * 正面図と平面図は稜線の x が、正面図と側面図は稜線の y がそろうので、
   * その値のところに図と図のあいだを渡す線を引く。折り開いた面と同じ平面（z = BOX_Z）に置く
   */
  const frontTop = Math.max(...PROFILE.map(([, y]) => y))
  const frontRight = Math.max(...PROFILE.map(([x]) => x))
  const guideGeometry = new BufferGeometry().setFromPoints([
    ...distinct(PROFILE.map(([x]) => x)).flatMap((x) => [
      new Vector3(x, frontTop + GUIDE_MARGIN, BOX_Z),
      new Vector3(x, BOX_Y + BOX_Z - SOLID_DEPTH - GUIDE_MARGIN, BOX_Z)
    ]),
    ...distinct(PROFILE.map(([, y]) => y)).flatMap((y) => [
      new Vector3(frontRight + GUIDE_MARGIN, y, BOX_Z),
      new Vector3(BOX_X + BOX_Z - SOLID_DEPTH - GUIDE_MARGIN, y, BOX_Z)
    ])
  ])
  const guideMaterial = new LineBasicMaterial({ color: GUIDE_COLOR, transparent: true })
  const guides = new LineSegments(guideGeometry, guideMaterial)
  root.add(guides)

  // 図の名前。折り開いたときに、正面図と側面図は下、平面図は上に並ぶ位置へ置く
  const labels = [
    createLabel("正面図", LABEL_COLOR, LABEL_HEIGHT),
    createLabel("平面図", LABEL_COLOR, LABEL_HEIGHT),
    createLabel("側面図", LABEL_COLOR, LABEL_HEIGHT)
  ]
  labels[0].sprite.position.set(0, -BOX_Y - LABEL_GAP, BOX_Z)
  labels[1].sprite.position.set(0, 0, -BOX_Z * 2 - LABEL_GAP)
  labels[2].sprite.position.set(0, -BOX_Y - LABEL_GAP, -BOX_Z)
  root.add(labels[0].sprite)
  topGroup.add(labels[1].sprite)
  rightGroup.add(labels[2].sprite)

  return {
    update: () => {
      // 上の面は共有する辺まわりに起こし、右の面は同じ辺まわりに開く。
      // どちらも 90 度回すと、正面の面と同じ 1 枚の平面に収まる
      const fold = (Math.PI / 2) * params.unfold
      topGroup.rotation.x = fold
      rightGroup.rotation.y = -fold

      // 折り開くにつれて、傾けていた全体を正面向きへ戻す。
      // 開ききったところで 3 枚を真正面から見ることになり、図どうしの位置がそろって見える
      const scale = MathUtils.lerp(FOLDED_SCALE, 1, params.unfold)
      root.rotation.set(FOLDED_TILT_X * (1 - params.unfold), FOLDED_TILT_Y * (1 - params.unfold), 0)
      root.scale.setScalar(scale)
      // 開いた 3 枚は正面の面から上と右へ広がるので、そのぶん中心を戻す
      root.position.setScalar(-BOX_Z * params.unfold * scale)

      solid.object.visible = params.showSolid
      rays.visible = params.showSolid && params.unfold < 1
      rayMaterial.opacity = 1 - params.unfold

      // 折り目が立っているあいだは図の位置がそろわないので、開ききる直前から現す
      guideMaterial.opacity = MathUtils.clamp(
        (params.unfold - GUIDE_FADE_START) / (1 - GUIDE_FADE_START),
        0,
        1
      )
      guides.visible = guideMaterial.opacity > 0
    },
    dispose: () => {
      const disposables = [
        ...[frontPlane, topPlane, rightPlane].flatMap((plane) => [
          plane.geometry,
          plane.material,
          plane.borderGeometry,
          plane.borderMaterial
        ]),
        ...[solid, frontView, topView, sideView].flatMap((wireframe) => [
          wireframe.geometry,
          wireframe.material
        ]),
        rayGeometry,
        rayMaterial,
        guideGeometry,
        guideMaterial,
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
