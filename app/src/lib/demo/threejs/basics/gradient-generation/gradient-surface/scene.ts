import {
  AmbientLight,
  BufferGeometry,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3
} from "three"

/** グラデーションのパターン */
export type SurfacePattern = "linear" | "radial" | "conical"

/** Tweakpane で操作するパラメータ */
export type GradientSurfaceParams = {
  /** グラデーションのパターン */
  pattern: SurfacePattern
  /** 画素の値を z 軸方向へ持ち上げる高さ */
  height: number
  /** 曲面（と四隅の垂線）を表示するか。外すと下の画像だけになる */
  showSurface: boolean
  /** 曲面の形。scene.ts が書き戻す */
  shape: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: GradientSurfaceParams
}

const TAU = Math.PI * 2

/** 方向グラデーションの向き。1 つ前のデモの初期値と揃える */
const DIRECTION_ANGLE = (30 * Math.PI) / 180

/**
 * パターンごとの、位置から割合 t を求める規則と、それが描く曲面の形。
 * u・v は画像の中心を原点、半辺を 1 とした位置（記事の x・y 軸）
 */
const PATTERNS: Record<SurfacePattern, { shape: string; tAt: (u: number, v: number) => number }> = {
  linear: {
    shape: "斜めに傾いた平面",
    tAt: (u, v) => {
      const span = Math.abs(Math.cos(DIRECTION_ANGLE)) + Math.abs(Math.sin(DIRECTION_ANGLE))
      return (u * Math.cos(DIRECTION_ANGLE) + v * Math.sin(DIRECTION_ANGLE) + span) / (2 * span)
    }
  },
  radial: {
    shape: "すり鉢状の曲面",
    tAt: (u, v) => Math.hypot(u, v) / Math.SQRT2
  },
  conical: {
    shape: "らせん状の斜面",
    tAt: (u, v) => (((Math.atan2(v, u) % TAU) + TAU) % TAU) / TAU
  }
}

/** 画像として扱う正方形の 1 辺 */
const IMAGE_SIZE = 2.4
const HALF_IMAGE = IMAGE_SIZE / 2

/** 画像を焼く画素数。格子が目に見えない細かさにとる */
const RESOLUTION = 256

/** 曲面を張る格子の分割数。画素より粗いが、折れ線に見えない細かさにとる */
const SURFACE_SEGMENTS = 96

/** 画素の値 1（白）を、z 軸方向にどれだけ持ち上げるか */
const HEIGHT_SCALE = 1.4

/** 画像の面のすぐ上に線を置くための持ち上げ量（面と重なってちらつくのを防ぐ） */
const LIFT = 0.004

/** 曲面の色。灰色の濃淡（画素の値）に混ざらないよう、彩度のある色にする */
const SURFACE_COLOR = "#5ec8f2"
const FRAME_COLOR = "#c8ccd4"

/**
 * 光の強さ。Lambert の反射では放射照度を π で割った値が明るさになるので、
 * 曲面の傾きの違いが陰影として出る程度にとる
 */
const AMBIENT_INTENSITY = Math.PI * 0.55
const KEY_LIGHT_INTENSITY = Math.PI * 0.5
const KEY_LIGHT_POSITION: [number, number, number] = [2.5, 5, 3]

export const createGradientSurfaceScene = ({ scene, params }: SceneContext) => {
  // 環境光と、斜め上からの平行光。曲面の傾きが陰影として読めるようにする
  const keyLight = new DirectionalLight("#ffffff", KEY_LIGHT_INTENSITY)
  keyLight.position.set(...KEY_LIGHT_POSITION)
  const ambientLight = new AmbientLight("#ffffff", AMBIENT_INTENSITY)
  scene.add(ambientLight, keyLight)

  // Three.js は y 軸が上なので、記事の x・y 平面を three の xz 平面に、
  // 記事の z 軸（画素の値）を three の y 軸に対応させる
  const imageGeometry = new PlaneGeometry(IMAGE_SIZE, IMAGE_SIZE)
  imageGeometry.rotateX(-Math.PI / 2)

  const imageData = new Uint8Array(RESOLUTION * RESOLUTION * 4)
  const imageTexture = new DataTexture(imageData, RESOLUTION, RESOLUTION)
  imageTexture.colorSpace = SRGBColorSpace
  imageTexture.magFilter = LinearFilter
  imageTexture.minFilter = LinearFilter

  // 画素の値をそのままの濃さで見せたいので、陰影の付かない材質で貼る
  const imageMaterial = new MeshBasicMaterial({ map: imageTexture, side: DoubleSide })
  scene.add(new Mesh(imageGeometry, imageMaterial))

  // 画像の外周。暗い部分が背景に溶けても、画像の範囲が分かるようにする
  const frameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-HALF_IMAGE, LIFT, -HALF_IMAGE),
    new Vector3(HALF_IMAGE, LIFT, -HALF_IMAGE),
    new Vector3(HALF_IMAGE, LIFT, -HALF_IMAGE),
    new Vector3(HALF_IMAGE, LIFT, HALF_IMAGE),
    new Vector3(HALF_IMAGE, LIFT, HALF_IMAGE),
    new Vector3(-HALF_IMAGE, LIFT, HALF_IMAGE),
    new Vector3(-HALF_IMAGE, LIFT, HALF_IMAGE),
    new Vector3(-HALF_IMAGE, LIFT, -HALF_IMAGE)
  ])
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  scene.add(new LineSegments(frameGeometry, frameMaterial))

  // 曲面。細かく分割した平面の頂点を、その位置の画素の値のぶんだけ持ち上げる
  const surfaceGeometry = new PlaneGeometry(
    IMAGE_SIZE,
    IMAGE_SIZE,
    SURFACE_SEGMENTS,
    SURFACE_SEGMENTS
  )
  surfaceGeometry.rotateX(-Math.PI / 2)
  const surfaceMaterial = new MeshLambertMaterial({
    color: SURFACE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: 0.55
  })
  const surface = new Mesh(surfaceGeometry, surfaceMaterial)
  scene.add(surface)

  // 四隅の垂線。画像の上の点と、曲面の上の点が同じ位置であることを示す
  const riserGeometry = new BufferGeometry()
  riserGeometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(8 * 3), 3))
  const riserMaterial = new LineBasicMaterial({ color: SURFACE_COLOR })
  const risers = new LineSegments(riserGeometry, riserMaterial)
  scene.add(risers)

  /** 曲面の頂点の位置（three の xz）から、記事の x・y 軸での位置を求める */
  const toImagePosition = (x: number, z: number) => ({ u: x / HALF_IMAGE, v: -z / HALF_IMAGE })

  // パターンが変わったときだけ画像を焼き直す（高さだけ変えたときは焼き直さない）
  let builtPattern: SurfacePattern | null = null
  let builtHeight = NaN

  return {
    update: () => {
      const { pattern, height, showSurface } = params
      const { shape, tAt } = PATTERNS[pattern]
      params.shape = shape

      // 曲面を外したときは、その四隅へ伸びる垂線も一緒に消す
      surface.visible = showSurface
      risers.visible = showSurface

      const patternChanged = pattern !== builtPattern
      const heightChanged = height !== builtHeight
      if (!patternChanged && !heightChanged) return
      builtPattern = pattern
      builtHeight = height

      if (patternChanged) {
        // 画素 1 つずつ、位置から割合 t を求め、両端の値（黒と白）を線形補間する
        for (let row = 0; row < RESOLUTION; row++) {
          for (let column = 0; column < RESOLUTION; column++) {
            const u = -1 + (2 * (column + 0.5)) / RESOLUTION
            const v = -1 + (2 * (row + 0.5)) / RESOLUTION
            const level = Math.round(tAt(u, v) * 255)
            imageData.set([level, level, level, 255], (row * RESOLUTION + column) * 4)
          }
        }
        imageTexture.needsUpdate = true
      }

      // 曲面：頂点ごとに、その位置の画素の値を高さ（記事の z 軸）に読み替える
      const surfacePosition = surfaceGeometry.getAttribute("position")
      for (let index = 0; index < surfacePosition.count; index++) {
        const { u, v } = toImagePosition(surfacePosition.getX(index), surfacePosition.getZ(index))
        surfacePosition.setY(index, tAt(u, v) * HEIGHT_SCALE * height)
      }
      surfacePosition.needsUpdate = true
      // 傾きが変わると陰影も変わるので、法線を測り直す
      surfaceGeometry.computeVertexNormals()
      surfaceGeometry.computeBoundingSphere()

      // 四隅の垂線
      const riserPosition = riserGeometry.getAttribute("position")
      const corners = [
        [-HALF_IMAGE, -HALF_IMAGE],
        [HALF_IMAGE, -HALF_IMAGE],
        [HALF_IMAGE, HALF_IMAGE],
        [-HALF_IMAGE, HALF_IMAGE]
      ]
      corners.forEach(([x, z], index) => {
        const { u, v } = toImagePosition(x, z)
        riserPosition.setXYZ(index * 2, x, 0, z)
        riserPosition.setXYZ(index * 2 + 1, x, tAt(u, v) * HEIGHT_SCALE * height, z)
      })
      riserPosition.needsUpdate = true
      riserGeometry.computeBoundingSphere()
    },
    dispose: () => {
      const disposables = [
        imageGeometry,
        imageTexture,
        imageMaterial,
        frameGeometry,
        frameMaterial,
        surfaceGeometry,
        surfaceMaterial,
        riserGeometry,
        riserMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
