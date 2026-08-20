import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type BicubicSurfaceParams = {
  /** 四隅の制御点を上下させる量 */
  cornerHeight: number
  /** 内側 4 点の制御点を上下させる量 */
  innerHeight: number
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: BicubicSurfaceParams
}

/** 縦横の制御点の数。双 3 次なので u 方向・v 方向にそれぞれ 4 点、合わせて 16 点 */
const GRID = 4

/** 制御点を格子状に並べる間隔 */
const SPACING = 1

/**
 * 制御点の高さの基準値。
 * 平らな格子だと曲面がただの平面になるので、縁も内側も高さをずらしておく
 */
const BASE_HEIGHTS = [
  [0.1, 0.55, 0.7, 0.15],
  [0.45, 1.15, 1.3, 0.5],
  [0.3, 0.95, 1.05, 0.25],
  [-0.15, 0.3, 0.45, -0.2]
]

/** 四隅の制御点の添字（u 方向・v 方向のどちらも端） */
const isCorner = (i: number, j: number) =>
  (i === 0 || i === GRID - 1) && (j === 0 || j === GRID - 1)

/** 内側 4 点の制御点の添字（u 方向・v 方向のどちらも端ではない） */
const isInner = (i: number, j: number) => i > 0 && i < GRID - 1 && j > 0 && j < GRID - 1

/** 曲面を三角形に分ける細かさ（u 方向・v 方向とも） */
const SURFACE_STEPS = 24

/** 境界のベジェ曲線を折れ線で近似する分割数 */
const CURVE_SEGMENTS = 32

/** 曲面を塗る濃さ。制御点網が透けて見える程度にとどめる */
const SURFACE_OPACITY = 0.5

/** 制御点を示す球の半径。四隅は曲面の隅と一致する点なので少し大きくする */
const CONTROL_RADIUS = 0.055
const CORNER_RADIUS = 0.08

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.26

/** 四隅のラベルを、格子の中心から見て外向き（水平）に逃がす距離と、持ち上げる高さ */
const CORNER_LABEL_OFFSET = 0.4
const CORNER_LABEL_LIFT = 0.14

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

// 背景（暗めのグレー）の上で、曲面・制御点網・制御点・境界の曲線が見分けられる色にする
const SURFACE_COLOR = "#9db4d0"
const NET_COLOR = "#9aa3b0"
const CONTROL_COLOR = "#b79cf5"
const CORNER_COLOR = "#f57fc4"
const BOUNDARY_COLOR = "#ffc857"
const LIGHT_COLOR = "#ffffff"

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

/** 頂点が動く折れ線。頂点を作り直さず、座標だけ書き換える */
const createPolyline = (count: number, color: string) => {
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(count * 3), 3)
  geometry.setAttribute("position", positions)
  const material = new LineBasicMaterial({ color })
  const line = new Line(geometry, material)
  // 頂点が動くので、あらかじめ計算した範囲に頼らず常に描く
  line.frustumCulled = false

  return {
    object: line,
    set: (index: number, point: Vector3) => positions.setXYZ(index, point.x, point.y, point.z),
    commit: () => {
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 曲面。三角形の並び（インデックス）は 1 度組めば変わらないので、
 * 制御点が動いたときは頂点の座標だけを書き換える
 */
const createSurface = () => {
  const side = SURFACE_STEPS + 1
  const geometry = new BufferGeometry()
  const positions = new Float32BufferAttribute(new Float32Array(side * side * 3), 3)
  geometry.setAttribute("position", positions)

  const index: number[] = []
  for (let i = 0; i < SURFACE_STEPS; i++) {
    for (let j = 0; j < SURFACE_STEPS; j++) {
      const corner = i * side + j
      index.push(corner, corner + side, corner + 1)
      index.push(corner + 1, corner + side, corner + side + 1)
    }
  }
  geometry.setIndex(index)

  const material = new MeshStandardMaterial({
    color: SURFACE_COLOR,
    roughness: 0.6,
    side: DoubleSide,
    transparent: true,
    opacity: SURFACE_OPACITY,
    // 裏側を通る制御点網や、縁に重なる境界の曲線が透けるよう、深度は比較するが書かない
    depthWrite: false
  })

  return {
    object: new Mesh(geometry, material),
    set: (i: number, j: number, point: Vector3) =>
      positions.setXYZ(i * side + j, point.x, point.y, point.z),
    commit: () => {
      positions.needsUpdate = true
      // 陰影が付くように、頂点を動かしたら法線を求め直す
      geometry.computeVertexNormals()
      geometry.computeBoundingSphere()
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 3 次のバーンスタイン基底関数の値を、4 つまとめて求める */
const bernstein = (t: number, target: number[]) => {
  const s = 1 - t
  target[0] = s * s * s
  target[1] = 3 * s * s * t
  target[2] = 3 * s * t * t
  target[3] = t * t * t

  return target
}

export const createBicubicSurfaceScene = ({ scene, params }: SceneContext) => {
  // 16 個の制御点。xz 平面に格子状に並べ、高さ（y）だけをパラメータで動かす
  const controls = Array.from({ length: GRID }, (_, i) =>
    Array.from(
      { length: GRID },
      (_, j) => new Vector3((i - (GRID - 1) / 2) * SPACING, 0, (j - (GRID - 1) / 2) * SPACING)
    )
  )

  const weightsU = [0, 0, 0, 0]
  const weightsV = [0, 0, 0, 0]

  /**
   * 曲面上の点。2 つのパラメータそれぞれのバーンスタイン基底関数をかけ合わせた重みで、
   * 16 個の制御点を混ぜ合わせる
   */
  const surfacePoint = (u: number, v: number, target: Vector3) => {
    bernstein(u, weightsU)
    bernstein(v, weightsV)

    target.set(0, 0, 0)
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        target.addScaledVector(controls[i][j], weightsU[i] * weightsV[j])
      }
    }

    return target
  }

  const surface = createSurface()
  scene.add(surface.object)

  // 制御点を縦横に結んだ制御点網。曲面の細かい網目と混ざらないよう細い線 1 本ずつで描く
  const netLines = [
    ...Array.from({ length: GRID }, () => createPolyline(GRID, NET_COLOR)),
    ...Array.from({ length: GRID }, () => createPolyline(GRID, NET_COLOR))
  ]
  netLines.forEach((line) => scene.add(line.object))

  /**
   * 網の縁に並ぶ 4 点ずつが決める、曲面の境界のベジェ曲線。
   * u = 0・u = 1・v = 0・v = 1 の 4 本で、曲面の 4 辺にそのまま重なる
   */
  const boundaries = Array.from({ length: 4 }, () =>
    createPolyline(CURVE_SEGMENTS + 1, BOUNDARY_COLOR)
  )
  boundaries.forEach((line) => scene.add(line.object))

  // 制御点。四隅は曲面の隅と一致する点なので、色と大きさを変えて示す
  const controlGeometry = new SphereGeometry(CONTROL_RADIUS, 16, 12)
  const cornerGeometry = new SphereGeometry(CORNER_RADIUS, 16, 12)
  const controlMaterial = new MeshBasicMaterial({ color: CONTROL_COLOR })
  const cornerMaterial = new MeshBasicMaterial({ color: CORNER_COLOR })
  const meshes = controls.map((row, i) =>
    row.map((_, j) => {
      const corner = isCorner(i, j)
      const mesh = new Mesh(
        corner ? cornerGeometry : controlGeometry,
        corner ? cornerMaterial : controlMaterial
      )
      scene.add(mesh)
      return mesh
    })
  )

  // 四隅だけ名前を付ける（16 個すべてに付けると図が文字で埋まる）
  const cornerIndices: [number, number][] = [
    [0, 0],
    [0, GRID - 1],
    [GRID - 1, 0],
    [GRID - 1, GRID - 1]
  ]
  const cornerLabels = cornerIndices.map(([i, j]) => {
    const label = createLabel(`P${"₀₁₂₃"[i]}${"₀₁₂₃"[j]}`, CORNER_COLOR, LABEL_HEIGHT)
    scene.add(label.sprite)
    return label
  })

  // 曲面のふくらみを陰影でも読み取れるようにする光。向きは固定
  const light = new DirectionalLight(LIGHT_COLOR, 2.5)
  light.position.set(4, 5, 3)
  scene.add(light, new AmbientLight(LIGHT_COLOR, 0.5))

  const sample = new Vector3()
  const outward = new Vector3()

  return {
    update: () => {
      // 制御点の高さを決める。縁の中間の 8 点は動かさず、四隅と内側 4 点だけを上下させる
      controls.forEach((row, i) =>
        row.forEach((control, j) => {
          const lift = isCorner(i, j) ? params.cornerHeight : isInner(i, j) ? params.innerHeight : 0
          control.y = BASE_HEIGHTS[i][j] + lift
        })
      )

      // 曲面
      for (let i = 0; i <= SURFACE_STEPS; i++) {
        for (let j = 0; j <= SURFACE_STEPS; j++) {
          surface.set(i, j, surfacePoint(i / SURFACE_STEPS, j / SURFACE_STEPS, sample))
        }
      }
      surface.commit()

      // 制御点網。u 方向に並ぶ 4 本と、v 方向に並ぶ 4 本
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          netLines[i].set(j, controls[i][j])
          netLines[GRID + j].set(i, controls[i][j])
        }
      }
      netLines.forEach((line) => line.commit())

      // 境界の 4 本のベジェ曲線。それぞれ網の縁に並ぶ 4 点だけで決まる
      for (let step = 0; step <= CURVE_SEGMENTS; step++) {
        const t = step / CURVE_SEGMENTS
        boundaries[0].set(step, surfacePoint(0, t, sample))
        boundaries[1].set(step, surfacePoint(1, t, sample))
        boundaries[2].set(step, surfacePoint(t, 0, sample))
        boundaries[3].set(step, surfacePoint(t, 1, sample))
      }
      boundaries.forEach((line) => line.commit())

      // 制御点
      controls.forEach((row, i) => row.forEach((control, j) => meshes[i][j].position.copy(control)))

      // 四隅のラベル。格子の中心から見て外向き（水平）へ逃がし、少し持ち上げる
      cornerIndices.forEach(([i, j], index) => {
        const control = controls[i][j]
        outward.set(control.x, 0, control.z).normalize()
        cornerLabels[index].sprite.position
          .copy(control)
          .addScaledVector(outward, CORNER_LABEL_OFFSET)
          .setY(control.y + CORNER_LABEL_LIFT)
      })
    },
    dispose: () => {
      surface.dispose()
      netLines.forEach((line) => line.dispose())
      boundaries.forEach((line) => line.dispose())
      const disposables = [
        controlGeometry,
        cornerGeometry,
        controlMaterial,
        cornerMaterial,
        ...cornerLabels.flatMap((label) => [label.texture, label.material])
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
