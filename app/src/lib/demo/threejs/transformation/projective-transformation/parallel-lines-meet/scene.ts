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
  /** scene.ts が計算して書き戻す表示用の文字列 */
  intersection: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: ParallelLinesMeetParams
}

/** 変換前の正方形の 1 辺の半分の長さ */
const SQUARE_HALF = 0.9

/** 格子の間隔。1 辺が 6 分割される */
const GRID_STEP = 0.3

/**
 * 1 本の直線を分割する数。
 * 分割した点をすべて個別に変換しても折れないことで、直線が直線のまま写るのが見える
 */
const LINE_SAMPLES = 16

/** 変換前は平行だった 2 辺を、像の直線に沿って伸ばす長さ。図の外まで届く長さにする */
const EXTENSION_LENGTH = 5.5

/** 延長した部分の不透明度。もとの辺と同じ色を薄くして、伸ばした部分だと分かるようにする */
const EXTENSION_OPACITY = 0.45

/** 交点がこれより遠ければ図の外なので描かない（p が 0 に近いほど遠ざかる） */
const VANISHING_LIMIT = 4.5

/** 交点を示す球の半径 */
const POINT_RADIUS = 0.08

// 背景（暗めのグレー）の上で、格子・注目する 2 辺・交点が見分けられる色にする。
// 交点は他のデモの正規化後の点と同じ色にする（無限遠点が写った先の点なので）
const GRID_COLOR = "#8fa3bf"
const EDGE_COLOR = "#e8e8ee"
const VANISHING_COLOR = "#f57fc4"

/** x 方向の無限遠点。同次座標では w が 0 の点 (1, 0, 0) として書ける */
const X_AT_INFINITY = new Vector3(1, 0, 0)

/** 直線を LINE_SAMPLES 個に分割して、同次座標 (x, y, 1) の列として返す */
const sampleLine = (fromX: number, fromY: number, toX: number, toY: number) =>
  Array.from({ length: LINE_SAMPLES + 1 }, (_, index) => {
    const ratio = index / LINE_SAMPLES
    return new Vector3(fromX + (toX - fromX) * ratio, fromY + (toY - fromY) * ratio, 1)
  })

/**
 * 変換前の格子を、線 1 本ずつ「細かく分割した点の列」として組み立てる。
 * 上下の端の 2 辺（変換前は平行）は、延長線を引くので別に返す
 */
const createSourceLines = () => {
  const grid: Vector3[][] = []
  const parallelEdges: Vector3[][] = []

  const lineCount = (SQUARE_HALF * 2) / GRID_STEP
  for (let i = 0; i <= lineCount; i++) {
    const offset = -SQUARE_HALF + i * GRID_STEP
    grid.push(sampleLine(offset, -SQUARE_HALF, offset, SQUARE_HALF))
    const horizontal = sampleLine(-SQUARE_HALF, offset, SQUARE_HALF, offset)
    if (i === 0 || i === lineCount) parallelEdges.push(horizontal)
    else grid.push(horizontal)
  }

  return { grid, parallelEdges }
}

/** 同じ形の点の列を、書き換え用に用意する */
const createTargets = (lines: Vector3[][]) => lines.map((line) => line.map(() => new Vector3()))

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

/** 交点を示す球 */
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
  const gridTargets = createTargets(source.grid)
  const edgeTargets = createTargets(source.parallelEdges)
  // 延長線も、2 点だけの折れ線として同じ仕組みで描く
  const extensionTargets = source.parallelEdges.map(() => [new Vector3(), new Vector3()])

  const gridLines = createPolylines(source.grid, GRID_COLOR)
  const edgeLines = createPolylines(source.parallelEdges, EDGE_COLOR)
  const extensionLines = createPolylines(extensionTargets, EDGE_COLOR, EXTENSION_OPACITY)
  const intersection = createPoint(VANISHING_COLOR, POINT_RADIUS)
  scene.add(gridLines.object, edgeLines.object, extensionLines.object, intersection.mesh)

  const matrix = new Matrix3()
  const direction = new Vector3()
  const vanishing = new Vector3()

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
      projectLines(source.grid, gridTargets)
      projectLines(source.parallelEdges, edgeTargets)
      gridLines.setPoints(gridTargets)
      edgeLines.setPoints(edgeTargets)

      // 変換前は平行だった 2 辺を、像の直線に沿ってそのまま伸ばす。
      // 伸ばす向きは、変換前の x が大きい側にある端の 2 点が向いている向き
      edgeTargets.forEach((points, index) => {
        const end = points[points.length - 1]
        direction.copy(end).sub(points[points.length - 2]).normalize()
        const extension = extensionTargets[index]
        extension[0].copy(end)
        extension[1].copy(direction).multiplyScalar(EXTENSION_LENGTH).add(end)
      })
      extensionLines.setPoints(extensionTargets)

      // 延長した 2 直線が交わる点は、x 方向の無限遠点 (1, 0, 0) を変換して正規化した点。
      // 最下行のはたらきで w' が p になるので、p が 0 でなければ有限の位置に現れる
      project(X_AT_INFINITY, vanishing)

      // p が 0 に近いと交点は図の外へ遠ざかる（p が 0 なら 2 辺は平行のまま交わらない）
      const outside = Math.abs(vanishing.x) > VANISHING_LIMIT
      intersection.mesh.visible = !outside
      if (!outside) intersection.mesh.position.copy(vanishing)

      // Tweakpane 側に読み取り専用で出す交点の座標
      if (p === 0) {
        params.intersection = "なし（平行のまま）"
      } else {
        params.intersection = `(${vanishing.x.toFixed(2)}, 0.00)${outside ? " 図の外" : ""}`
      }
    },
    dispose: () => {
      gridLines.dispose()
      edgeLines.dispose()
      extensionLines.dispose()
      intersection.dispose()
    }
  }
}
