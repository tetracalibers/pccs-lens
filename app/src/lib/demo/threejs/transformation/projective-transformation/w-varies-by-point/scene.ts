import {
  BufferGeometry,
  CanvasTexture,
  type ColorRepresentation,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
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
export type WVariesByPointParams = {
  /** 射影変換行列の最下行 (p q r) の p */
  p: number
  /** 射影変換行列の最下行 (p q r) の q */
  q: number
  /** 注目する入力点の x */
  x: number
  /** 注目する入力点の y */
  y: number
  /** scene.ts が計算して書き戻す、注目する点の w' */
  wAtPoint: string
  /** scene.ts が計算して書き戻す、正方形の中での w' の振れ幅 */
  wRange: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  camera: PerspectiveCamera
  params: WVariesByPointParams
}

/** 各軸を原点から正負どちらへも伸ばす長さ */
const AXIS_LENGTH = 2.4

/** 軸の正の向きを指す矢印の大きさ */
const ARROW_RADIUS = 0.06
const ARROW_HEIGHT = 0.22

/** w = 1 の平面の 1 辺の半分の長さ */
const PLANE_HALF = 1.6

/** 平面の塗りの不透明度。奥の柱や点が透けて見える程度に抑える */
const PLANE_OPACITY = 0.12

/** 変換後の点が並ぶ面の塗りの不透明度。w = 1 の平面と重なるので、さらに薄くする */
const SURFACE_OPACITY = 0.1

/** w' を測る入力点を並べる正方形の 1 辺の半分の長さ */
const LATTICE_HALF = 1.1

/** 正方形を何分割して入力点を取るか。分割数 + 1 が 1 辺に並ぶ点の数 */
const LATTICE_DIVISIONS = 4

/** 入力点どうしの間隔 */
const LATTICE_STEP = (LATTICE_HALF * 2) / LATTICE_DIVISIONS

/**
 * w' を測る入力点。w = 1 の平面上にあるので、同次座標では (x, y, 1) と書ける。
 * 正方形を等間隔に区切った格子にして、位置による w' の違いが並んで見えるようにする
 */
const LATTICE_POINTS = Array.from({ length: (LATTICE_DIVISIONS + 1) ** 2 }, (_, index) => {
  const column = index % (LATTICE_DIVISIONS + 1)
  const row = Math.floor(index / (LATTICE_DIVISIONS + 1))
  return new Vector3(-LATTICE_HALF + column * LATTICE_STEP, -LATTICE_HALF + row * LATTICE_STEP, 1)
})

/** 柱の不透明度。数が多いので、注目する 1 点の柱より控えめにする */
const PILLAR_OPACITY = 0.5

/** 注目する点を示す球の半径 */
const POINT_RADIUS = 0.06

/** 格子の点を示す球の半径。数が多いので、注目する点より小さくする */
const LATTICE_POINT_RADIUS = 0.035

/** 柱の足もと（w = 0）を示す球の半径 */
const BASE_RADIUS = 0.03

/** 軸名のラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const AXIS_LABEL_HEIGHT = 0.34

/** 座標や式を書いたラベルの高さ。図の主役は軸なので、軸名より小さくする */
const VALUE_LABEL_HEIGHT = 0.24

/** 軸ラベルを矢印の先からさらに離す距離 */
const LABEL_OFFSET = 0.32

/** ラベルを、それが指す点から離す距離 */
const LABEL_GAP = 0.14

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

const X_DIRECTION = new Vector3(1, 0, 0)
const Y_DIRECTION = new Vector3(0, 1, 0)
const W_DIRECTION = new Vector3(0, 0, 1)

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

// 背景（暗めのグレー）の上で、3 軸・2 つの面・柱・注目する点が見分けられる色にする。
// w は 3 本目の軸なので、他のデモの z 軸と同じ青にする。
// 変換後の面と柱は、同じ記事のほかのデモと揃えて変換後の色（黄）にし、
// 注目する 1 点だけはその中で埋もれないよう別の色（桃）にする
const X_COLOR = "#f2766a"
const Y_COLOR = "#7fd88f"
const W_COLOR = "#5ec8f2"
const TRANSFORMED_COLOR = "#ffc857"
const PROBE_COLOR = "#f57fc4"
const PLANE_COLOR = "#8fa3bf"
const SOURCE_COLOR = "#e8e8ee"
const GUIDE_COLOR = "#9aa3b0"

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * `w' = px + qy + r` のような長いラベルもあるので、文字の幅を測って板の横幅を決める
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
    setPositions: (positions: Vector3[]) => {
      meshes.forEach((mesh, index) => mesh.position.copy(positions[index]))
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** w = 0 から変換後の点まで立てる柱。両端を毎フレーム書き換える */
const createPillars = (count: number, color: ColorRepresentation, opacity = 1) => {
  const position = new Float32BufferAttribute(new Float32Array(count * 2 * 3), 3)
  const geometry = new BufferGeometry().setAttribute("position", position)
  const material = new LineBasicMaterial({ color, transparent: opacity < 1, opacity })

  return {
    object: new LineSegments(geometry, material),
    setPillar: (index: number, base: Vector3, top: Vector3) => {
      position.setXYZ(index * 2, base.x, base.y, base.z)
      position.setXYZ(index * 2 + 1, top.x, top.y, top.z)
      position.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

export const createWVariesByPointScene = ({ scene, params }: SceneContext) => {
  // 同次座標 (x, y, w) の w を 3 本目の軸として立てる。
  // Three.js の x・y をそのまま平面の x・y にあて、z を w にあてると、
  // w = 1 の平面は x が右・y が上のまま読める板になる
  const xAxis = createAxis("x", X_COLOR, X_DIRECTION)
  const yAxis = createAxis("y", Y_COLOR, Y_DIRECTION)
  const wAxis = createAxis("w", W_COLOR, W_DIRECTION)
  scene.add(xAxis.object, yAxis.object, wAxis.object)

  // 入力の点 (x, y, 1) が並ぶ w = 1 の平面。アフィン変換なら w' はどこでも 1 なので、
  // この平面は「変化しない w'」の目印にもなる。
  // 奥の柱や点を隠さないよう、薄く塗って深度は書かない
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
  planeLabel.sprite.position.set(PLANE_HALF - 0.4, PLANE_HALF + 0.28, 1)
  scene.add(planeLabel.sprite)

  // 変換後の点 (x', y', w') が並ぶ面。入力の正方形と同じ大きさで作り、
  // 4 隅の高さ（w'）だけを update() で書き換えて傾ける
  const surfaceGeometry = new PlaneGeometry(LATTICE_HALF * 2, LATTICE_HALF * 2, 1, 1)
  const surfaceMaterial = new MeshBasicMaterial({
    color: TRANSFORMED_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: SURFACE_OPACITY,
    depthWrite: false
  })
  scene.add(new Mesh(surfaceGeometry, surfaceMaterial))
  const surfacePosition = surfaceGeometry.getAttribute("position")

  const surfaceLabel = createLabel("w' = px + qy + r", TRANSFORMED_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(surfaceLabel.sprite)

  // 各入力点の真上に立てた、高さが w' の柱と、その先端にあたる変換後の点
  const pillars = createPillars(LATTICE_POINTS.length, TRANSFORMED_COLOR, PILLAR_OPACITY)
  const pillarTops = createPoints(LATTICE_POINTS.length, TRANSFORMED_COLOR, LATTICE_POINT_RADIUS)
  scene.add(pillars.object, ...pillarTops.objects)

  // 注目する 1 点。入力の (x, y, 1) と、それを変換した (x', y', w')。
  // 柱は w = 0 から立てるので、柱の長さがそのまま w' の値になる
  const probePillar = createPillars(1, PROBE_COLOR)
  const probeBase = createPoints(1, GUIDE_COLOR, BASE_RADIUS)
  const probeSource = createPoints(1, SOURCE_COLOR, POINT_RADIUS)
  const probeTop = createPoints(1, PROBE_COLOR, POINT_RADIUS)
  scene.add(probePillar.object, ...probeBase.objects, ...probeSource.objects, ...probeTop.objects)

  const sourceLabel = createLabel("(x, y, 1)", SOURCE_COLOR, VALUE_LABEL_HEIGHT)
  const transformedLabel = createLabel("(x', y', w')", PROBE_COLOR, VALUE_LABEL_HEIGHT)
  scene.add(sourceLabel.sprite, transformedLabel.sprite)

  const matrix = new Matrix3()
  const topPositions = LATTICE_POINTS.map(() => new Vector3())
  const sourcePosition = new Vector3()
  const topPosition = new Vector3()
  const basePosition = new Vector3()
  const corner = new Vector3()

  return {
    update: () => {
      const { p, q, x, y } = params

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

      LATTICE_POINTS.forEach((point, index) => {
        // 同次座標 (x, y, 1) に行列を掛けると (x', y', w') が得られる。
        // 上の 2 行が単位行列なので x'・y' は入力のままで、w' だけが
        // w' = p x + q y + r として入力の位置ごとに変わる
        const top = topPositions[index].copy(point).applyMatrix3(matrix)
        pillars.setPillar(index, basePosition.set(top.x, top.y, 0), top)

        minW = Math.min(minW, top.z)
        maxW = Math.max(maxW, top.z)
      })
      pillarTops.setPositions(topPositions)

      // 面の 4 隅も同じ行列で動かす。x'・y' は入力のままなので、高さだけを書き換える
      for (let index = 0; index < surfacePosition.count; index++) {
        corner
          .set(surfacePosition.getX(index), surfacePosition.getY(index), 1)
          .applyMatrix3(matrix)
        surfacePosition.setZ(index, corner.z)
      }
      surfacePosition.needsUpdate = true
      // 頂点を動かしたので、視錐台カリングに使う範囲も計算し直す
      surfaceGeometry.computeBoundingSphere()

      // 面の名前は、面といっしょに上下する隅に付ける。
      // ほかのラベルとぶつからないよう、w = 1 のラベルとは逆の隅を選ぶ
      corner.set(LATTICE_HALF, -LATTICE_HALF, 1).applyMatrix3(matrix)
      surfaceLabel.sprite.position.set(
        corner.x,
        corner.y - (LABEL_GAP + surfaceLabel.sprite.scale.y / 2),
        corner.z
      )

      // 注目する 1 点。入力は w = 1 の平面上にあるので (x, y, 1)
      const source = sourcePosition.set(x, y, 1)
      const transformed = topPosition.copy(source).applyMatrix3(matrix)
      probeSource.setPositions([source])
      probeTop.setPositions([transformed])
      probeBase.setPositions([basePosition.set(x, y, 0)])
      probePillar.setPillar(0, basePosition, transformed)

      // 2 つのラベルは、同じ縦線の上に並ぶ 2 点それぞれの手前と奥へ振り分ける
      sourceLabel.sprite.position.set(x, y - (LABEL_GAP + sourceLabel.sprite.scale.y / 2), 1)
      transformedLabel.sprite.position.set(
        x,
        y + LABEL_GAP + transformedLabel.sprite.scale.y / 2,
        transformed.z
      )

      // Tweakpane 側に読み取り専用で出す値。p・q がどちらも 0 なら、
      // 注目する点をどこへ動かしても w' は 1.00 のままで、振れ幅も 1.00 〜 1.00 になる
      params.wAtPoint = transformed.z.toFixed(2)
      params.wRange = `${minW.toFixed(2)} 〜 ${maxW.toFixed(2)}`
    },
    dispose: () => {
      xAxis.dispose()
      yAxis.dispose()
      wAxis.dispose()
      pillars.dispose()
      pillarTops.dispose()
      probePillar.dispose()
      probeBase.dispose()
      probeSource.dispose()
      probeTop.dispose()
      const disposables = [
        planeGeometry,
        planeMaterial,
        surfaceGeometry,
        surfaceMaterial,
        planeLabel.texture,
        planeLabel.material,
        surfaceLabel.texture,
        surfaceLabel.material,
        sourceLabel.texture,
        sourceLabel.material,
        transformedLabel.texture,
        transformedLabel.material
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
