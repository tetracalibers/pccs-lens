import {
  BufferGeometry,
  CanvasTexture,
  Color,
  type ColorRepresentation,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type NormalizationAfterTransformParams = {
  /** 射影変換行列の最下行 (p q r) の p */
  p: number
  /** 射影変換行列の最下行 (p q r) の q */
  q: number
  /** 正規化の進み具合。0 で変換直後の (x', y', w')、1 で正規化後の (x'/w', y'/w', 1) */
  t: number
  /** scene.ts が計算して書き戻す表示用の文字列 */
  wRange: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: NormalizationAfterTransformParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2.4

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** w = 1 の平面の 1 辺の半分の長さ */
const PLANE_HALF = 2

/** 平面の塗りの不透明度。奥の直線や点が透けて見える程度に抑える */
const PLANE_OPACITY = 0.12

/**
 * 変換前の正方形の 1 辺の半分の長さ。
 * p・q をどの端に振っても、正規化後の 4 隅が w = 1 の平面に収まる大きさにする
 */
const SQUARE_HALF = 0.6

/**
 * 変換前の正方形の 4 隅。w = 1 の平面上の点なので、同次座標では (x, y, 1) と書ける。
 * 閉じた線で四辺形として結ぶため、外周をたどる順に並べる
 */
const SQUARE_CORNERS = [
  new Vector3(-SQUARE_HALF, SQUARE_HALF, 1),
  new Vector3(SQUARE_HALF, SQUARE_HALF, 1),
  new Vector3(SQUARE_HALF, -SQUARE_HALF, 1),
  new Vector3(-SQUARE_HALF, -SQUARE_HALF, 1)
]

/** 原点を通る直線を、変換後の点と正規化後の点の遠いほうからさらに伸ばす倍率 */
const RAY_MARGIN = 1.18

/** 動く四辺形が発つ位置・着く位置に残す四辺形の不透明度 */
const STATION_OPACITY = 0.4

/** t がこの範囲まで端に近ければ、動く四辺形と重なる側の四辺形は描かない */
const SAME_POSITION_RANGE = 0.02

/** 四辺形の隅を示す球の半径 */
const POINT_RADIUS = 0.06

/** 原点を示す球の半径 */
const ORIGIN_RADIUS = 0.045

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 座標を書いたラベルの高さ。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_HEIGHT = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルを、それが指す隅から離す距離 */
const LABEL_GAP = 0.14

/** ラベルを付ける隅。3 つのラベルが重ならないよう、別々の隅を選ぶ */
const SOURCE_LABEL_CORNER = 2
const TRANSFORMED_LABEL_CORNER = 1
const NORMALIZED_LABEL_CORNER = 3

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const W_DIRECTION = new Vector3(0, 0, 1)

/** 原点を通る直線の始点 */
const ORIGIN = new Vector3(0, 0, 0)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・平面・3 つの四辺形が見分けられる色にする。
// w は 3 本目の軸なので、他のデモの z 軸と同じ青にする。
// 変換前の正方形は中立色、変換直後の同次座標と正規化後の座標は色を分ける
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const W_COLOR = "#5ec8f2"
const TRANSFORMED_COLOR = "#ffc857"
const NORMALIZED_COLOR = "#f57fc4"
const PLANE_COLOR = "#8fa3bf"
const SOURCE_COLOR = "#e8e8ee"
const GUIDE_COLOR = "#9aa3b0"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * `(x'/w', y'/w', 1)` のような長いラベルもあるので、文字の幅を測って板の横幅を決める
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

/** 位置を示す球。同じ大きさ・色の球はジオメトリとマテリアルを共有する */
const createPoints = (count: number, color: ColorRepresentation, radius: number) => {
  const geometry = new SphereGeometry(radius, 16, 12)
  const material = new MeshBasicMaterial({ color })
  const meshes = Array.from({ length: count }, () => new Mesh(geometry, material))

  return {
    objects: meshes,
    material,
    setPositions: (positions: Vector3[]) => {
      meshes.forEach((mesh, index) => mesh.position.copy(positions[index]))
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 4 隅を順に結ぶ閉じた四辺形。頂点は毎フレーム書き換える。
 * LineLoop は最後の頂点と最初の頂点も結ぶので、4 頂点だけで四辺形になる
 */
const createQuad = (color: ColorRepresentation, opacity = 1) => {
  const position = new Float32BufferAttribute(new Float32Array(SQUARE_CORNERS.length * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color, transparent: opacity < 1, opacity })

  return {
    object: new LineLoop(geometry, material),
    material,
    setCorners: (corners: Vector3[]) => {
      corners.forEach((corner, index) => position.setXYZ(index, corner.x, corner.y, corner.z))
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 原点から各隅へ伸ばす直線。両端を毎フレーム書き換える */
const createRays = (count: number, color: ColorRepresentation) => {
  const position = new Float32BufferAttribute(new Float32Array(count * 2 * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color })

  return {
    object: new LineSegments(geometry, material),
    setRay: (index: number, from: Vector3, to: Vector3) => {
      position.setXYZ(index * 2, from.x, from.y, from.z)
      position.setXYZ(index * 2 + 1, to.x, to.y, to.z)
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createNormalizationAfterTransformScene = ({ scene, params }: SceneContext) => {
  // 同次座標 (x, y, w) の w を 3 本目の軸として立てる。
  // Three.js の x・y をそのまま平面の x・y にあて、z を w にあてると、
  // w = 1 の平面は x が右・y が上のまま読める板になる
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  const wAxis = createAxis("w", W_COLOR, W_DIRECTION)
  scene.add(xAxis.object, yAxis.object, wAxis.object)

  // 正規化した同次座標が並ぶ w = 1 の平面。
  // 奥の直線や点を隠さないよう、薄く塗って深度は書かない
  const planeGeometry = new PlaneGeometry(PLANE_HALF * 2, PLANE_HALF * 2)
  const planeMaterial = new MeshBasicMaterial({
    color: PLANE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLANE_OPACITY,
    depthWrite: false
  })
  const plane = new Mesh(planeGeometry, planeMaterial)
  plane.position.z = 1
  scene.add(plane)

  const planeLabel = createLabel("w = 1", PLANE_COLOR, VALUE_LABEL_HEIGHT)
  planeLabel.sprite.position.set(PLANE_HALF - 0.5, PLANE_HALF + 0.28, 1)
  scene.add(planeLabel.sprite)

  // 変換前の正方形。w = 1 の平面上にあるので、同次座標では (x, y, 1) と書ける
  const sourceQuad = createQuad(SOURCE_COLOR)
  sourceQuad.setCorners(SQUARE_CORNERS)
  scene.add(sourceQuad.object)

  // 変換後の隅と正規化後の隅は、必ずこの原点を通る 1 本の直線の上に並ぶ
  const origin = createPoints(1, GUIDE_COLOR, ORIGIN_RADIUS)
  scene.add(...origin.objects)

  // 各隅が正規化で滑っていく、原点を通る直線
  const rays = createRays(SQUARE_CORNERS.length, GUIDE_COLOR)
  scene.add(rays.object)

  // 行列を掛けた直後の (x', y', w') と、w' で割った (x'/w', y'/w', 1)。
  // 動く四辺形が着いている側は重なってしまうので、update() で描き分ける
  const transformedQuad = createQuad(TRANSFORMED_COLOR, STATION_OPACITY)
  const normalizedQuad = createQuad(NORMALIZED_COLOR, STATION_OPACITY)
  scene.add(transformedQuad.object, normalizedQuad.object)

  // 正規化の途中の四辺形と、その 4 隅
  const movingQuad = createQuad(TRANSFORMED_COLOR)
  const movingPoints = createPoints(SQUARE_CORNERS.length, TRANSFORMED_COLOR, POINT_RADIUS)
  scene.add(movingQuad.object, ...movingPoints.objects)

  // 変換前の正方形は動かないので、そのラベルの位置もここで決めてしまう
  const sourceLabel = createLabel("(x, y, 1)", SOURCE_COLOR, VALUE_LABEL_HEIGHT)
  const sourceAnchor = SQUARE_CORNERS[SOURCE_LABEL_CORNER]
  sourceLabel.sprite.position.set(
    sourceAnchor.x,
    sourceAnchor.y - (LABEL_GAP + sourceLabel.sprite.scale.y / 2),
    sourceAnchor.z
  )
  const transformedLabel = createLabel("(x', y', w')", TRANSFORMED_COLOR, VALUE_LABEL_HEIGHT)
  const normalizedLabel = createLabel("(x'/w', y'/w', 1)", NORMALIZED_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(sourceLabel.sprite, transformedLabel.sprite, normalizedLabel.sprite)

  const matrix = new Matrix3()
  const transformedCorners = SQUARE_CORNERS.map(() => new Vector3())
  const normalizedCorners = SQUARE_CORNERS.map(() => new Vector3())
  const movingCorners = SQUARE_CORNERS.map(() => new Vector3())
  const rayEnd = new Vector3()
  const movingColor = new Color()
  const transformedRgb = new Color(TRANSFORMED_COLOR)
  const normalizedRgb = new Color(NORMALIZED_COLOR)

  return {
    update: () => {
      const { p, q, t } = params

      // 射影変換の行列。上の 2 行は単位行列のままにして、
      // 最下行 (p q r) がもたらす w' の変化だけが見えるようにする
      // prettier-ignore
      matrix.set(
        1, 0, 0,
        0, 1, 0,
        p, q, 1
      )

      let minW = Infinity
      let maxW = -Infinity

      SQUARE_CORNERS.forEach((corner, index) => {
        // 同次座標 (x, y, 1) に行列を掛けると (x', y', w') が得られる。
        // w' = p x + q y + r なので、隅の位置によって値が変わる
        const transformed = transformedCorners[index].copy(corner).applyMatrix3(matrix)

        // x' と y' を w' で割ると、w = 1 の平面上の点に戻る
        normalizedCorners[index].set(
          transformed.x / transformed.z,
          transformed.y / transformed.z,
          1
        )

        // 同次座標は定数倍しても同じ点を指す。縮尺を 1 から 1/w' へ動かすと、
        // 隅は原点を通る直線の上を滑って w = 1 の平面へ降りる
        movingCorners[index].copy(transformed).multiplyScalar(1 - t + t / transformed.z)

        // 直線は、変換後の点と正規化後の点のうち原点から遠いほうより先まで伸ばす
        rays.setRay(
          index,
          ORIGIN,
          rayEnd.copy(transformed).multiplyScalar(Math.max(1, 1 / transformed.z) * RAY_MARGIN)
        )

        minW = Math.min(minW, transformed.z)
        maxW = Math.max(maxW, transformed.z)
      })

      transformedQuad.setCorners(transformedCorners)
      normalizedQuad.setCorners(normalizedCorners)
      movingQuad.setCorners(movingCorners)
      movingPoints.setPositions(movingCorners)

      // 動く四辺形が着いている側は、その四辺形とぴったり重なるので描かない
      transformedQuad.object.visible = t > SAME_POSITION_RANGE
      normalizedQuad.object.visible = t < 1 - SAME_POSITION_RANGE

      // 正規化が進むほど、変換直後の色から正規化後の色へ近づける
      movingColor.lerpColors(transformedRgb, normalizedRgb, t)
      movingQuad.material.color.copy(movingColor)
      movingPoints.material.color.copy(movingColor)

      // 変換後と正規化後のラベルは、それぞれ決まった隅に付いて動く
      const transformedAnchor = transformedCorners[TRANSFORMED_LABEL_CORNER]
      transformedLabel.sprite.position.set(
        transformedAnchor.x,
        transformedAnchor.y + LABEL_GAP + transformedLabel.sprite.scale.y / 2,
        transformedAnchor.z
      )
      const normalizedAnchor = normalizedCorners[NORMALIZED_LABEL_CORNER]
      normalizedLabel.sprite.position.set(
        normalizedAnchor.x,
        normalizedAnchor.y - (LABEL_GAP + normalizedLabel.sprite.scale.y / 2),
        normalizedAnchor.z
      )

      // Tweakpane 側に読み取り専用で出す値。p・q がどちらも 0 なら 4 隅とも 1.00 になる
      params.wRange = `${minW.toFixed(2)} 〜 ${maxW.toFixed(2)}`
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      wAxis.dispose()
      sourceQuad.dispose()
      origin.dispose()
      rays.dispose()
      transformedQuad.dispose()
      normalizedQuad.dispose()
      movingQuad.dispose()
      movingPoints.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        planeLabel.texture,
        planeLabel.material,
        sourceLabel.texture,
        sourceLabel.material,
        transformedLabel.texture,
        transformedLabel.material,
        normalizedLabel.texture,
        normalizedLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
