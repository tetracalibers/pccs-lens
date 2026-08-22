import {
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  Group,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type PlanarGradientParams = {
  /** 方向グラデーションの向き、および角度グラデーションで t = 0 になる向き（度） */
  angle: number
  /** t が同じ値になる位置を結んだ線を重ねるか */
  showIsolines: boolean
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: PlanarGradientParams
}

const TAU = Math.PI * 2

/** 2 次元のグラデーションのパターン */
type Pattern = {
  /** 画像の下に出すパターン名 */
  name: string
  /** 何から割合 t を決めるか */
  rule: string
  /** 画像の中心を原点、半辺を 1 とした位置から、割合 t（0〜1）を求める */
  tAt: (x: number, y: number, angle: number) => number
  /** 向きを示す矢を描くか（向きに依らないパターンでは描かない） */
  hasArrow: boolean
}

/**
 * 3 つのパターン。違うのは位置から割合 t をどう求めるかだけで、
 * t から画素の値を決める部分（線形補間）はすべて共通
 */
const PATTERNS: Pattern[] = [
  {
    name: "方向（線形）",
    rule: "直線距離",
    // ある向きに沿って進んだ距離。画像の外へ出ないよう、
    // その向きで測れる最大の長さ（|cos| + |sin|）で 0〜1 に正規化する
    tAt: (x, y, angle) => {
      const span = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))
      return (x * Math.cos(angle) + y * Math.sin(angle) + span) / (2 * span)
    },
    hasArrow: true
  },
  {
    name: "放射（ラジアル）",
    rule: "中心からの距離",
    // 中心からの距離。四隅までの距離（√2）で 0〜1 に正規化する
    tAt: (x, y) => Math.hypot(x, y) / Math.SQRT2,
    hasArrow: false
  },
  {
    name: "角度（コニカル）",
    rule: "中心まわりの角度",
    // 中心まわりの角度を一周（360°）で割る。t = 0 になる向きを angle で回す
    tAt: (x, y, angle) => {
      const turned = Math.atan2(y, x) - angle
      return (((turned % TAU) + TAU) % TAU) / TAU
    },
    hasArrow: false
  }
]

/** 1 枚の画像の 1 辺と、3 枚を並べる間隔 */
const TILE_SIZE = 1.85
const TILE_GAP = 0.3

/** 画像を焼く画素数。格子が目に見えない細かさにとる */
const RESOLUTION = 256

/** 等値線を引く t の刻みと、線の太さ（t の値で測った片側の幅） */
const ISOLINE_STEP = 0.25
const ISOLINE_HALF_WIDTH = 0.006

/**
 * 向きを示す矢の寸法（いずれも画像の半辺に対する割合）。
 * 線（LineBasicMaterial）の太さは環境によらず 1 画素なので、矢は面として組む
 */
const ARROW_LENGTH = 0.78
const ARROW_WIDTH = 0.06
const ARROW_HEAD_LENGTH = 0.2
const ARROW_HEAD_WIDTH = 0.22

/** 中心を示す点の大きさ */
const CENTER_DOT_RADIUS = 0.04

/** 画像に重なる要素を、奥から手前へ振り分ける z */
const LAYER_ISOLINE = 0.01
const LAYER_MARKER = 0.02
const LAYER_FRAME = 0.03

/** 両端の値。黒（0）から白（255）へ補間する */
const START_VALUE = 0
const END_VALUE = 255

/** 画素の濃淡（黒〜白）に混ざらないよう、重ねる印は彩度のある色にする */
const OVERLAY_COLOR = "#f2766a"
/** 等値線はテクスチャに焼くので、OVERLAY_COLOR をバイト値でも持つ */
const OVERLAY_RGB = [0xf2, 0x76, 0x6a]
const FRAME_COLOR = "#c8ccd4"
const LABEL_COLOR = "#c9d2de"
const RULE_LABEL_COLOR = "#9aa3b0"

/** キャプション（パターン名と t の決め方）の文字の大きさと、画像の下に逃がす距離 */
const NAME_HEIGHT = 0.2
const RULE_HEIGHT = 0.17
const NAME_OFFSET = 0.22
const RULE_OFFSET = 0.46

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 図全体を canvas の中央に寄せる量（キャプションのぶん、上へ寄せる） */
const CONTENT_OFFSET_Y = 0.27

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
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)

  return { sprite, texture, material }
}

/** 画素の値をそのままの濃さで貼るためのテクスチャ。テクセルどうしは滑らかに繋ぐ */
const createTexture = (data: Uint8Array) => {
  const texture = new DataTexture(data, RESOLUTION, RESOLUTION)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  return texture
}

export const createPlanarGradientScene = ({ scene, params }: SceneContext) => {
  // 3 枚に共通の外周。暗い部分が背景に溶けても、画像の範囲が分かるようにする
  const half = TILE_SIZE / 2
  const frameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-half, -half, LAYER_FRAME),
    new Vector3(half, -half, LAYER_FRAME),
    new Vector3(half, -half, LAYER_FRAME),
    new Vector3(half, half, LAYER_FRAME),
    new Vector3(half, half, LAYER_FRAME),
    new Vector3(-half, half, LAYER_FRAME),
    new Vector3(-half, half, LAYER_FRAME),
    new Vector3(-half, -half, LAYER_FRAME)
  ])
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })

  // 3 枚に共通の画像の板と、重ねる印の材質
  const tileGeometry = new PlaneGeometry(TILE_SIZE, TILE_SIZE)
  const dotGeometry = new SphereGeometry(CENTER_DOT_RADIUS, 12, 8)
  const markerMaterial = new MeshBasicMaterial({ color: OVERLAY_COLOR })

  // 向きを示す矢。右向きに組んでおき、角度のぶんだけ回す。
  // 軸の長方形（三角形 2 枚）と、先端の三角形 1 枚を並べた面として作る
  const arrowTip = half * ARROW_LENGTH
  const arrowBase = arrowTip - half * ARROW_HEAD_LENGTH
  const halfShaft = (half * ARROW_WIDTH) / 2
  const halfHead = (half * ARROW_HEAD_WIDTH) / 2
  const arrowGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -halfShaft, LAYER_MARKER),
    new Vector3(arrowBase, -halfShaft, LAYER_MARKER),
    new Vector3(arrowBase, halfShaft, LAYER_MARKER),
    new Vector3(0, -halfShaft, LAYER_MARKER),
    new Vector3(arrowBase, halfShaft, LAYER_MARKER),
    new Vector3(0, halfShaft, LAYER_MARKER),
    new Vector3(arrowBase, -halfHead, LAYER_MARKER),
    new Vector3(arrowTip, 0, LAYER_MARKER),
    new Vector3(arrowBase, halfHead, LAYER_MARKER)
  ])

  const labels: { texture: CanvasTexture; material: SpriteMaterial }[] = []

  // 3 枚を横に並べる。中央の 1 枚が原点に来るように、両側へ 1 枚ぶんずらす
  const tiles = PATTERNS.map((pattern, index) => {
    const tile = new Group()
    tile.position.set((index - 1) * (TILE_SIZE + TILE_GAP), CONTENT_OFFSET_Y, 0)
    scene.add(tile)

    // グラデーションそのもの。画素の値を灰色の濃さで表す
    const imageData = new Uint8Array(RESOLUTION * RESOLUTION * 4)
    const imageTexture = createTexture(imageData)
    // 値をそのままの濃さで見せたいので、陰影の付かない材質で貼る
    const imageMaterial = new MeshBasicMaterial({ map: imageTexture })
    tile.add(new Mesh(tileGeometry, imageMaterial))

    // 等値線。グラデーションの濃淡と混ざらないよう、別の板に重ねる
    const isolineData = new Uint8Array(RESOLUTION * RESOLUTION * 4)
    // 線かどうかは透明度だけで切り替えるので、色は全面に置いておく。
    // 透明な画素に色が無いと、滑らかに繋いだ線の縁が濁って見える
    for (let index = 0; index < RESOLUTION * RESOLUTION; index++) {
      isolineData.set(OVERLAY_RGB, index * 4)
    }
    const isolineTexture = createTexture(isolineData)
    const isolineMaterial = new MeshBasicMaterial({
      map: isolineTexture,
      transparent: true,
      depthWrite: false
    })
    const isolines = new Mesh(tileGeometry, isolineMaterial)
    isolines.position.z = LAYER_ISOLINE
    tile.add(isolines)

    tile.add(new LineSegments(frameGeometry, frameMaterial))

    // 方向は矢で向きを示し、中心を基準にするパターンはその中心を点で示す
    let arrow: Mesh | undefined
    if (pattern.hasArrow) {
      arrow = new Mesh(arrowGeometry, markerMaterial)
      tile.add(arrow)
    } else {
      const dot = new Mesh(dotGeometry, markerMaterial)
      dot.position.z = LAYER_MARKER
      tile.add(dot)
    }

    const name = createLabel(pattern.name, LABEL_COLOR, NAME_HEIGHT)
    name.sprite.position.set(0, -half - NAME_OFFSET, LAYER_MARKER)
    tile.add(name.sprite)

    const rule = createLabel(pattern.rule, RULE_LABEL_COLOR, RULE_HEIGHT)
    rule.sprite.position.set(0, -half - RULE_OFFSET, LAYER_MARKER)
    tile.add(rule.sprite)

    labels.push(name, rule)

    return {
      pattern,
      imageData,
      imageTexture,
      imageMaterial,
      isolineData,
      isolineTexture,
      isolineMaterial,
      isolines,
      arrow
    }
  })

  // 角度が変わったときだけ焼き直す（カメラを動かしただけでは作り直さない）
  let builtAngle = NaN

  return {
    update: () => {
      const { angle, showIsolines } = params
      const radians = (angle * Math.PI) / 180

      for (const tile of tiles) {
        tile.isolines.visible = showIsolines
        if (tile.arrow) tile.arrow.rotation.z = radians
      }

      if (angle === builtAngle) return
      builtAngle = angle

      for (const tile of tiles) {
        const { tAt } = tile.pattern

        for (let row = 0; row < RESOLUTION; row++) {
          for (let column = 0; column < RESOLUTION; column++) {
            // 画素 1 つ分の真ん中の位置。画像の中心を原点、半辺を 1 とする。
            // テクスチャの行が増える向きと y 軸の向きは逆になる
            const x = -1 + (2 * (column + 0.5)) / RESOLUTION
            const y = 1 - (2 * (row + 0.5)) / RESOLUTION

            // 位置から割合 t を求め、両端の値（黒と白）を線形補間する
            const t = tAt(x, y, radians)
            const level = Math.round((1 - t) * START_VALUE + t * END_VALUE)

            const offset = (row * RESOLUTION + column) * 4
            tile.imageData.set([level, level, level, 255], offset)

            // t が刻みのちょうど倍数に近い画素だけを、等値線として見せる
            const remainder = t / ISOLINE_STEP - Math.round(t / ISOLINE_STEP)
            const onIsoline = Math.abs(remainder) * ISOLINE_STEP < ISOLINE_HALF_WIDTH
            tile.isolineData[offset + 3] = onIsoline ? 255 : 0
          }
        }

        tile.imageTexture.needsUpdate = true
        tile.isolineTexture.needsUpdate = true
      }
    },
    dispose: () => {
      const disposables = [
        frameGeometry,
        frameMaterial,
        tileGeometry,
        dotGeometry,
        markerMaterial,
        arrowGeometry,
        ...tiles.flatMap((tile) => [
          tile.imageTexture,
          tile.imageMaterial,
          tile.isolineTexture,
          tile.isolineMaterial
        ]),
        ...labels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
