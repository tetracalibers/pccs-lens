import {
  BoxGeometry,
  CircleGeometry,
  EdgesGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Vector2
} from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import type { ThreeSceneContext } from "$lib/demo/threejs/_shared/types"

/** Tweakpane で操作するパラメータ */
export type FrostedGlassParams = {
  /**
   * ガラスの粗さ。`0` が透明なガラス、上限の `0.8` がすりガラスのように向こう側がぼやける状態。
   * マテリアルの `roughness` へは `ROUGHNESS_SCALE` を掛けてから渡す
   */
  roughness: number
  /** いまの状態が透明なガラスかすりガラスか。scene.ts が計算して書き戻す表示用の値 */
  glassType: string
}

/** 図形を並べる平面の奥行き。板ガラスの裏面から少し離して置く */
const SHAPES_Z = -0.7

/**
 * 板ガラスの寸法。原点に置き、図形群ごと画面の中心に据える。
 *
 * 図形群より一回り大きくとってある。視点を回すと手前のガラスと奥の図形はずれて見えるので、
 * 回せる範囲の端でも図形がガラスの外へはみ出さない余裕をもたせる
 */
const GLASS_WIDTH = 2.5
const GLASS_HEIGHT = 2.4
const GLASS_THICKNESS = 0.5

/** ガラスの屈折率 */
const GLASS_IOR = 1.5

/**
 * スライダーの値をマテリアルの `roughness` へ渡すときの倍率。
 *
 * Three.js は「一度描いた画面を縮小した画像の何段目を読むか」でガラス越しのぼけを作り、
 * その段数が `roughness` に比例する。`roughness` を 1 まで上げると 1 ドットまで潰れて
 * 像が完全に消えるので、スライダーの目盛りには実際の `roughness` より控えめな幅を割り当てる。
 * **ぼけは画面のピクセル単位で効くので、カメラの寄り・引きを変えたらここも見直す**
 */
const ROUGHNESS_SCALE = 0.52

/**
 * ここまでの粗さを透明なガラスとみなす。
 * 案1・案3の「反射の種類」「透過の種類」と同じ目盛りで切り替わるよう、同じ値にしてある
 */
const CLEAR_ROUGHNESS_MAX = 0.15

/** パネルに出すガラスの種類 */
const CLEAR_TYPE = "透明なガラス"
const FROSTED_TYPE = "すりガラス"

// 記事の SVG 図解と同じ役割分担で色を決める（--canvas-pen-* の値をリテラルで踏襲）。
// 板ガラスは水の色。稜線にはこの色をそのまま使う
const GLASS_COLOR = "#24b9ff"

/**
 * 板の面に重ねる塗りの不透明度。
 *
 * 透過のマテリアルは「透った光に色を掛ける」作りなので、板の向こうが暗い背景のところでは
 * 掛けても暗いままで何も変わらない。それだけでは粗さ 0 のとき板の在り処が稜線でしか
 * 分からないので、**面そのものを薄く塗る**。背景の上でも図形の上でも同じだけ色が乗り、
 * 板が 1 枚の面として見える。
 *
 * 案3の板ガラスと同じ作りだが、こちらは板が図の主役で面積が大きいぶん薄くしてある
 */
const GLASS_FILL_OPACITY = 0.1

/**
 * 板の稜線の太さ（CSS ピクセル）。
 *
 * `LineBasicMaterial` の `linewidth` は WebGL では無視されて 1 デバイスピクセル固定になり、
 * Retina では CSS 上 0.5px のヘアラインになる。このデモは板を正面近くから見るので
 * 稜線が画面の縦横とほぼ平行になり、視点を動かすと線が画素の切れ目に落ちて
 * 一部だけ消えたようにちらつく。太さをピクセルで指定できる Line2 系で描き、
 * 案1・案3の光線と同じ直し方をとる。
 * 板は図の主役ではないので、案3の稜線に近い細さに留める
 */
const EDGE_LINE_WIDTH = 1

/**
 * 稜線の濃さ。
 *
 * 上の太さは案3の稜線（1 デバイスピクセル）より太いので、そのままでは線が主張しすぎる。
 * 色そのものは案3と同じ水色に保ったまま濃さだけ落とし、線の重さを近づける
 */
const EDGE_OPACITY = 0.7

const SHAPE_ORANGE = "#ef8c00"
const SHAPE_YELLOW = "#f6ce46"
const SHAPE_PINK = "#eb539f"
const STRIPE_COLOR = "#e8e8ee"

/** ガラスの向こう側に並べる図形。大きさに幅をもたせ、ぼけ方の違いを読ませる */
const CIRCLES = [
  { x: -0.34, y: 0.42, radius: 0.34, color: SHAPE_ORANGE },
  { x: -0.4, y: -0.42, radius: 0.21, color: SHAPE_YELLOW }
]
const SQUARE = { x: 0.36, y: 0.44, size: 0.6, color: SHAPE_PINK }

/** 細い縞。粗さを上げると 1 本ずつの区別が付かなくなり、まとまった 1 つの面に見えてくる */
const STRIPE_COUNT = 6
const STRIPE_WIDTH = 0.032
const STRIPE_HEIGHT = 0.6
const STRIPE_PITCH = 0.086
const STRIPES_X = 0.32
const STRIPES_Y = -0.44

/**
 * ガラスの向こう側に置く図形。
 *
 * ライトを当てず `MeshBasicMaterial` で描くので、指定した色がそのまま出る。
 * 大きさの違う円・四角・細い縞を混ぜて、**細かいものほど早くぼけて消える**ことを読ませる
 */
const createShapes = () => {
  // 単位の大きさで作った geometry を、拡大縮小しながら使い回す
  const circleGeometry = new CircleGeometry(1, 64)
  const planeGeometry = new PlaneGeometry(1, 1)

  const circleMaterials = CIRCLES.map(({ color }) => new MeshBasicMaterial({ color }))
  const squareMaterial = new MeshBasicMaterial({ color: SQUARE.color })
  const stripeMaterial = new MeshBasicMaterial({ color: STRIPE_COLOR })

  const group = new Group()
  group.position.set(0, 0, SHAPES_Z)

  CIRCLES.forEach(({ x, y, radius }, i) => {
    const circle = new Mesh(circleGeometry, circleMaterials[i])
    circle.position.set(x, y, 0)
    circle.scale.setScalar(radius)
    group.add(circle)
  })

  const square = new Mesh(planeGeometry, squareMaterial)
  square.position.set(SQUARE.x, SQUARE.y, 0)
  square.scale.set(SQUARE.size, SQUARE.size, 1)
  group.add(square)

  for (let i = 0; i < STRIPE_COUNT; i++) {
    const stripe = new Mesh(planeGeometry, stripeMaterial)
    stripe.position.set(STRIPES_X + (i - (STRIPE_COUNT - 1) / 2) * STRIPE_PITCH, STRIPES_Y, 0)
    stripe.scale.set(STRIPE_WIDTH, STRIPE_HEIGHT, 1)
    group.add(stripe)
  }

  return {
    object: group,
    dispose: () => {
      const disposables = [
        circleGeometry,
        planeGeometry,
        ...circleMaterials,
        squareMaterial,
        stripeMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/**
 * 板ガラス。`transmission` を使うと、Three.js が一度描いた画面を読み直して
 * 「この面の向こう側に何が見えるか」を計算する。粗さを上げるとその像がぼける。
 *
 * 透った光そのものは無色（`color` は白）にして、色は面の塗りと稜線だけで付ける
 */
const createGlass = () => {
  const geometry = new BoxGeometry(GLASS_WIDTH, GLASS_HEIGHT, GLASS_THICKNESS)
  const material = new MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 0,
    // 実際の値は update() で params から入れ直す
    roughness: 0,
    transmission: 1,
    thickness: GLASS_THICKNESS,
    ior: GLASS_IOR,
    transparent: true,
    // 稜線が板の手前側だけになって厚みが読めなくなるので、深度は書かない
    depthWrite: false
  })

  // 粗さ 0 のガラスは向こう側をほとんどそのまま見せるため、
  // 枠が無いとどこにガラスがあるのか読み取れない。
  //
  // 稜線を transparent にするのは色を薄めるためではない。Three.js が
  // 「ガラス越しの像」を作るときに写し込むのは**不透明な物体だけ**なので、
  // 不透明のままだとこの枠自体が像に混ざり、ぼけた枠が二重に見えてしまう
  const boxEdges = new EdgesGeometry(geometry)
  const edgesGeometry = new LineSegmentsGeometry().fromEdgesGeometry(boxEdges)
  const edgesMaterial = new LineMaterial({
    color: GLASS_COLOR,
    linewidth: EDGE_LINE_WIDTH,
    transparent: true,
    opacity: EDGE_OPACITY
  })

  // 面の塗り。稜線と同じく transparent なので像には写し込まれず、
  // 透過を描いたあとに重なる。粗さを上げてぼけた像の上にも同じ濃さで乗る。
  // 塗り → 稜線の順に並べ、稜線が塗りに沈まないようにする
  const fillMaterial = new MeshBasicMaterial({
    color: GLASS_COLOR,
    transparent: true,
    opacity: GLASS_FILL_OPACITY,
    depthWrite: false
  })

  return {
    objects: [
      new Mesh(geometry, material),
      new Mesh(geometry, fillMaterial),
      new LineSegments2(edgesGeometry, edgesMaterial)
    ],
    setRoughness: (roughness: number) => {
      material.roughness = roughness
    },
    /** 稜線の太さはピクセル指定なので、canvas の実寸を渡す（リサイズにも追従する） */
    setResolution: (width: number, height: number) => {
      edgesMaterial.resolution.set(width, height)
    },
    dispose: () => {
      const disposables = [geometry, material, fillMaterial, boxEdges, edgesGeometry, edgesMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createFrostedGlassScene = ({
  scene,
  renderer,
  params
}: ThreeSceneContext<FrostedGlassParams>) => {
  const shapes = createShapes()
  scene.add(shapes.object)

  const glass = createGlass()
  scene.add(...glass.objects)

  // 毎フレーム使い回す作業用のベクトル
  const viewportSize = new Vector2()

  return {
    update: () => {
      glass.setRoughness(params.roughness * ROUGHNESS_SCALE)

      renderer.getSize(viewportSize)
      glass.setResolution(viewportSize.x, viewportSize.y)

      // パネルの表示は、向こう側がそのまま見えていると言える範囲かどうかで切り替える
      params.glassType = params.roughness <= CLEAR_ROUGHNESS_MAX ? CLEAR_TYPE : FROSTED_TYPE
    },
    dispose: () => {
      shapes.dispose()
      glass.dispose()
    }
  }
}
