import {
  BufferGeometry,
  type ColorRepresentation,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3
} from "three"

/** Tweakpane で操作するパラメータ */
export type ParallelLinesMeetParams = {
  /** 射影変換行列の最下行 (p q r) の p */
  p: number
  /** 射影変換行列の最下行 (p q r) の q */
  q: number
  /** scene.ts が計算して書き戻す表示用の文字列。横線の束が集まる消点 */
  horizontalVanishing: string
  /** 同上。縦線の束が集まる消点 */
  verticalVanishing: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: ParallelLinesMeetParams
}

/** 変換前の正方形の 1 辺の半分の長さ */
const SQUARE_HALF = 0.75

/** 格子の間隔。1 辺が 6 分割される */
const GRID_STEP = 0.25

/**
 * 1 本の直線を分割する数。
 * 分割した点をすべて個別に変換しても折れないことで、直線が直線のまま写るのが見える
 */
const LINE_SAMPLES = 16

/** 消点が無い（平行のまま写る）ときに、像の向きへ伸ばす長さ。図の外まで届く長さにする */
const EXTENSION_LENGTH = 6

/** 延長した部分の不透明度。もとの線と同じ色を薄くして、伸ばした部分だと分かるようにする */
const EXTENSION_OPACITY = 0.4

/** 消線（無限遠直線の像）を引く長さの半分 */
const HORIZON_HALF = 8

/** 消線の不透明度。消点より控えめにして、2 つの消点が主役のまま残るようにする */
const HORIZON_OPACITY = 0.5

/** w' がこれより小さければ 0 とみなす（平行のまま＝消点は無限遠にある） */
const ZERO_W = 1e-6

/** 消点を示す球の半径 */
const POINT_RADIUS = 0.07

// 背景（暗めのグレー）の上で、格子・注目する 2 辺・消点が見分けられる色にする。
// 消点は他のデモの正規化後の点と同じ色にする（無限遠点が写った先の点なので）
const GRID_COLOR = "#8fa3bf"
const EDGE_COLOR = "#e8e8ee"
const VANISHING_COLOR = "#f57fc4"

/** x 方向・y 方向の無限遠点。同次座標では w が 0 の点として書ける */
const X_AT_INFINITY = new Vector3(1, 0, 0)
const Y_AT_INFINITY = new Vector3(0, 1, 0)

/** 直線を LINE_SAMPLES 個に分割して、同次座標 (x, y, 1) の列として返す */
const sampleLine = (fromX: number, fromY: number, toX: number, toY: number) =>
  Array.from({ length: LINE_SAMPLES + 1 }, (_, index) => {
    const ratio = index / LINE_SAMPLES
    return new Vector3(fromX + (toX - fromX) * ratio, fromY + (toY - fromY) * ratio, 1)
  })

/**
 * 変換前の格子を、線 1 本ずつ「細かく分割した点の列」として組み立てる。
 * 横線の束と縦線の束は別々の消点へ集まるので、束ごとに分けて返す。
 * 上下の端の 2 辺（本文で注目する「平行だった 2 直線」）は色を変えるので、さらに分ける
 */
const createSourceLines = () => {
  const innerHorizontals: Vector3[][] = []
  const parallelEdges: Vector3[][] = []
  const verticals: Vector3[][] = []

  const lineCount = (SQUARE_HALF * 2) / GRID_STEP
  for (let i = 0; i <= lineCount; i++) {
    const offset = -SQUARE_HALF + i * GRID_STEP
    verticals.push(sampleLine(offset, -SQUARE_HALF, offset, SQUARE_HALF))
    const horizontal = sampleLine(-SQUARE_HALF, offset, SQUARE_HALF, offset)
    if (i === 0 || i === lineCount) parallelEdges.push(horizontal)
    else innerHorizontals.push(horizontal)
  }

  return { innerHorizontals, parallelEdges, verticals }
}

/** 同じ形の点の列を、書き換え用に用意する */
const createTargets = (lines: Vector3[][]) => lines.map((line) => line.map(() => new Vector3()))

/** 延長線を、2 点だけの折れ線として書き換え用に用意する */
const createExtensions = (lines: Vector3[][]) => lines.map(() => [new Vector3(), new Vector3()])

/**
 * 折れ線をまとめて 1 つの LineSegments で描く。隣り合う点を 2 つずつ線分として並べる。
 * 点の位置は毎フレーム書き換えるので、頂点数は渡された形から先に確保しておく
 */
const createPolylines = (lines: Vector3[][], color: ColorRepresentation, opacity = 1) => {
  const segmentCount = lines.reduce((total, points) => total + points.length - 1, 0)
  const position = new Float32BufferAttribute(new Float32Array(segmentCount * 2 * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color, transparent: opacity < 1, opacity })

  return {
    object: new LineSegments(geometry, material),
    setPoints: (updated: Vector3[][]) => {
      let vertex = 0
      updated.forEach((points) => {
        for (let index = 0; index < points.length - 1; index++) {
          const from = points[index]
          const to = points[index + 1]
          position.setXYZ(vertex++, from.x, from.y, from.z)
          position.setXYZ(vertex++, to.x, to.y, to.z)
        }
      })
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** 消点を示す球 */
const createPoint = (color: ColorRepresentation, radius: number) => {
  const geometry = new SphereGeometry(radius, 16, 12)
  const material = new MeshBasicMaterial({ color })

  return {
    mesh: new Mesh(geometry, material),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createParallelLinesMeetScene = ({ scene, params }: SceneContext) => {
  const source = createSourceLines()
  const innerTargets = createTargets(source.innerHorizontals)
  const edgeTargets = createTargets(source.parallelEdges)
  const verticalTargets = createTargets(source.verticals)
  const innerExtensions = createExtensions(source.innerHorizontals)
  const edgeExtensions = createExtensions(source.parallelEdges)
  const verticalExtensions = createExtensions(source.verticals)

  // 内側の横線と縦線は同じ色なので、1 つの LineSegments にまとめて描く。
  // 中身の Vector3 はそのまま書き換えるので、並べた配列は最初に 1 度作れば足りる
  const gridTargets = [...innerTargets, ...verticalTargets]
  const gridExtensionTargets = [...innerExtensions, ...verticalExtensions]
  const horizonPoints = [[new Vector3(), new Vector3()]]

  const gridLines = createPolylines(gridTargets, GRID_COLOR)
  const edgeLines = createPolylines(edgeTargets, EDGE_COLOR)
  const gridExtensionLines = createPolylines(gridExtensionTargets, GRID_COLOR, EXTENSION_OPACITY)
  const edgeExtensionLines = createPolylines(edgeExtensions, EDGE_COLOR, EXTENSION_OPACITY)
  const horizonLine = createPolylines(horizonPoints, VANISHING_COLOR, HORIZON_OPACITY)
  const horizontalPoint = createPoint(VANISHING_COLOR, POINT_RADIUS)
  const verticalPoint = createPoint(VANISHING_COLOR, POINT_RADIUS)

  scene.add(
    gridExtensionLines.object,
    edgeExtensionLines.object,
    horizonLine.object,
    gridLines.object,
    edgeLines.object,
    horizontalPoint.mesh,
    verticalPoint.mesh
  )

  const matrix = new Matrix3()
  const direction = new Vector3()
  const horizontalVanishing = new Vector3()
  const verticalVanishing = new Vector3()
  const horizonCenter = new Vector3()
  const horizonDirection = new Vector3()

  /** 同次座標 (x, y, 1) に行列を掛けて (x', y', w') を得たあと、w' で割って通常の座標へ戻す */
  const project = (homogeneous: Vector3, target: Vector3) => {
    target.copy(homogeneous).applyMatrix3(matrix)
    // 図は平面なので、戻した座標を z = 0 の位置に置く
    target.set(target.x / target.z, target.y / target.z, 0)
    return target
  }

  /** 分割した点をすべて個別に変換する */
  const projectLines = (lines: Vector3[][], targets: Vector3[][]) => {
    lines.forEach((points, lineIndex) => {
      points.forEach((point, index) => project(point, targets[lineIndex][index]))
    })
  }

  /**
   * 無限遠点 (x, y, 0) を変換して正規化した点＝その向きの平行線の束が集まる消点。
   * w' が 0 のままなら無限遠点は無限遠点のまま写るので、束は平行なまま交わらない
   */
  const projectAtInfinity = (atInfinity: Vector3, target: Vector3) => {
    target.copy(atInfinity).applyMatrix3(matrix)
    if (Math.abs(target.z) < ZERO_W) return null
    return target.set(target.x / target.z, target.y / target.z, 0)
  }

  /** 像の直線は消点を通るので、消点に近いほうの端から消点まで結べば延長線になる */
  const extendToVanishing = (
    targets: Vector3[][],
    extensions: Vector3[][],
    vanishing: Vector3 | null
  ) => {
    targets.forEach((points, index) => {
      const start = points[0]
      const end = points[points.length - 1]
      const extension = extensions[index]

      if (vanishing) {
        const near =
          start.distanceToSquared(vanishing) < end.distanceToSquared(vanishing) ? start : end
        extension[0].copy(near)
        extension[1].copy(vanishing)
        return
      }

      // 消点が無いとき（平行のまま）は、像の向きへ一定の長さだけ伸ばす
      direction
        .copy(end)
        .sub(points[points.length - 2])
        .normalize()
      extension[0].copy(end)
      extension[1].copy(direction).multiplyScalar(EXTENSION_LENGTH).add(end)
    })
  }

  /** Tweakpane 側に読み取り専用で出す消点の座標 */
  const describe = (vanishing: Vector3 | null) =>
    vanishing === null
      ? "なし（平行のまま）"
      : `(${vanishing.x.toFixed(2)}, ${vanishing.y.toFixed(2)})`

  return {
    update: () => {
      const { p, q } = params

      // 射影変換の行列。上の 2 行は単位行列のままにして、
      // 最下行 (p q r) がもたらす w' の変化だけが見えるようにする
      // prettier-ignore
      matrix.set(
        1, 0, 0,
        0, 1, 0,
        p, q, 1
      )

      // 射影変換は直線を直線のまま写すので、どれだけ細かく分割しても折れ線は折れない。
      // 一方で点の間隔は w' で割った分だけ変わるので、等間隔だった格子が片側へ詰まる
      projectLines(source.innerHorizontals, innerTargets)
      projectLines(source.parallelEdges, edgeTargets)
      projectLines(source.verticals, verticalTargets)
      gridLines.setPoints(gridTargets)
      edgeLines.setPoints(edgeTargets)

      // 横線の束は x 方向の無限遠点 (1, 0, 0) の像へ、縦線の束は y 方向の無限遠点 (0, 1, 0) の
      // 像へ集まる。最下行のはたらきで w' がそれぞれ p・q になるので、
      // p が 0 でなければ (1/p, 0) に、q が 0 でなければ (0, 1/q) に消点が現れる
      const horizontal = projectAtInfinity(X_AT_INFINITY, horizontalVanishing)
      const vertical = projectAtInfinity(Y_AT_INFINITY, verticalVanishing)

      extendToVanishing(innerTargets, innerExtensions, horizontal)
      extendToVanishing(edgeTargets, edgeExtensions, horizontal)
      extendToVanishing(verticalTargets, verticalExtensions, vertical)
      gridExtensionLines.setPoints(gridExtensionTargets)
      edgeExtensionLines.setPoints(edgeExtensions)

      horizontalPoint.mesh.visible = horizontal !== null
      if (horizontal) horizontalPoint.mesh.position.copy(horizontal)
      verticalPoint.mesh.visible = vertical !== null
      if (vertical) verticalPoint.mesh.position.copy(vertical)

      // 無限遠点をすべて集めた直線（無限遠直線）の像は、p x + q y = 1 という直線になる。
      // どの向きの平行線の束も、その消点はこの直線の上に乗る。遠近法でいう地平線にあたる
      const norm = Math.hypot(p, q)
      horizonLine.object.visible = norm > ZERO_W
      if (horizonLine.object.visible) {
        // 原点にいちばん近い点を通り、(p, q) に垂直な向きへ伸びる直線として引く
        horizonCenter.set(p, q, 0).multiplyScalar(1 / (norm * norm))
        horizonDirection.set(-q, p, 0).multiplyScalar(HORIZON_HALF / norm)
        horizonPoints[0][0].copy(horizonCenter).sub(horizonDirection)
        horizonPoints[0][1].copy(horizonCenter).add(horizonDirection)
        horizonLine.setPoints(horizonPoints)
      }

      params.horizontalVanishing = describe(horizontal)
      params.verticalVanishing = describe(vertical)
    },
    dispose: () => {
      gridLines.dispose()
      edgeLines.dispose()
      gridExtensionLines.dispose()
      edgeExtensionLines.dispose()
      horizonLine.dispose()
      horizontalPoint.dispose()
      verticalPoint.dispose()
    }
  }
}
