import {
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  ConeGeometry,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LinearFilter,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  RingGeometry,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import {
  colorMatching,
  desaturateToGamut,
  encodeSrgb,
  spectrumToXyz,
  VISIBLE_MAX_NM,
  VISIBLE_MIN_NM,
  wavelengthToLinearSrgb,
  xyzToLinearSrgb,
  type Tristimulus
} from "$lib/color/spectrum"
import type { ThreeSceneContext } from "$lib/demo/threejs/_shared/types"

/** Tweakpane で操作するパラメータ */
export type CompactDiscDiffractionParams = {
  /** ディスクの傾き（度）。`0` で記録面が視点の正面を向き、上げるほど上端が手前へ倒れる */
  tiltDeg: number
  /** 光を当てる向き（度）。`0` で視点の側から、`90` で真横から当たる */
  lightAngleDeg: number
  /** ピット（トラック）の間隔（nm）。回折格子としての周期 */
  pitchNm: number
  /** 注目点での光路差。scene.ts が計算して書き戻す表示用の値 */
  opticalPathDifference: string
  /** 注目点でいちばん強め合っている波長。scene.ts が計算して書き戻す表示用の値 */
  reinforcedWavelength: string
}

/** ディスクの傾きとして選べる範囲（度）。パネルの上限・下限もこれに合わせる */
export const MIN_TILT_DEG = 0
export const MAX_TILT_DEG = 45

/**
 * 光を当てる向きとして選べる範囲（度）。
 *
 * 下限を `0`（視点と同じ向きから当てる）まで下げない。真後ろから当てると光が
 * 記録面で跳ね返ってそのまま視点へ戻り、どの波長も揃って強め合う正反射に近づく。
 * その付近では色が出ず記録面がほぼ暗くなるので、そこへ入らない範囲で止める
 */
export const MIN_LIGHT_ANGLE_DEG = 30
export const MAX_LIGHT_ANGLE_DEG = 70

/**
 * カメラの位置。解説パネルの奥行きをここから決めるので、記事側ではなくこちらで持つ。
 * 注視点は原点（ディスクの中心）。
 */
export const CAMERA_POSITION: [number, number, number] = [0, 1.2, 5.0]

/** カメラから注視点までの距離 */
const CAMERA_DISTANCE = Math.hypot(...CAMERA_POSITION)

/**
 * CD のトラックの間隔（nm）。規格値 1.6μm。パネルの初期値がこれになる。
 * 記録面のピットは同心円状のトラックに沿って並ぶので、
 * 「溝が規則正しく並ぶ向き」＝半径方向の周期がこの値になる
 */
export const CD_PITCH_NM = 1600

/**
 * ピットの間隔として選べる範囲（nm）。
 *
 * 狭くしすぎると、光路差が可視域の波長に届かなくなって記録面が暗く沈む
 * （間隔が波長より狭いと、1 次の回折そのものが可視域から外れる）。
 * 広くしすぎると次数がいくつも重なり、混ざって色が濁る。
 * どちらの手前も観察として意味があるので、その入り口までを範囲にしてある
 */
export const MIN_PITCH_NM = 700
export const MAX_PITCH_NM = 2400

/**
 * 同時に効くトラックの本数。
 *
 * 実際には照らされた範囲に何百本ものトラックが入るが、本数を増やすほど山が鋭くなり
 * 可視域の刻み（5nm）では拾いきれなくなる。8 本でも十分に鮮やかな色になる
 */
const COHERENT_TRACKS = 8

/**
 * 光路差ごとの色を引く表（LUT）が覆う範囲（nm）と、その分割数。
 *
 * 光路差は最も広い間隔のときに最大（間隔の 2 倍）になるので、そこまでを覆っておけば
 * 間隔を変えても表を作り直さずに済む（表は光路差だけの関数で、間隔には依存しない）
 */
const MAX_OPD_NM = 2 * MAX_PITCH_NM
const LUT_SIZE = 4096

/**
 * 露出を合わせる基準にする光路差の範囲（nm）。
 * 1 次の回折だけが可視域に入る範囲なので、いちばん色の澄んだ帯がここに出る
 */
const EXPOSURE_MIN_OPD_NM = VISIBLE_MIN_NM
const EXPOSURE_MAX_OPD_NM = VISIBLE_MAX_NM

/**
 * 光路差がこれより小さいと、可視域のどの波長も揃って強め合う（＝正反射の白）。
 * 山の幅が `1 / COHERENT_TRACKS` 程度なので、いちばん短い波長でも山から外れない範囲
 */
const SPECULAR_OPD_NM = VISIBLE_MIN_NM / COHERENT_TRACKS

/** ディスクの寸法。CD の外径 120mm・中心孔 15mm・記録領域の内径 50mm を外径 1 に縮めた比 */
const DISC_RADIUS = 1
const HOLE_RADIUS = 0.25
const DATA_INNER_RADIUS = 0.42

/** ディスクの分割数。色は画素ごとに求めるので、輪郭と半径方向が滑らかに見える程度あればよい */
const DISC_SEGMENTS = 192

/**
 * 注目点。記録面に固定した 1 点で、ここに届く光を拡大断面とグラフで分解して見せる。
 *
 * 記録領域の中ほどで、かつ右上（引き出し線が右の拡大断面へ素直に伸びる側）に置く。
 * 光を横から当てているので、傾きをどこにしてもこの付近は暗く沈まない
 */
const MARKED_RADIUS = 0.72
const MARKED_ANGLE_DEG = 40

/** 注目点の印（輪）の大きさと、記録面から浮かせる量（面と重なってちらつくのを防ぐ） */
const MARKER_INNER_RADIUS = 0.05
const MARKER_OUTER_RADIUS = 0.07
const MARKER_LIFT = 0.006

/**
 * 解説パネル（拡大断面・グラフ・色の小片）を置く奥行き。
 *
 * パネルはカメラの子にして視点を動かしても画面上の位置が変わらないようにする。
 * カメラからこの距離の平面は傾きのない正面の平面なので、そこに置いた図は歪まない。
 * ディスクの中心までの距離と同じにして、ディスクと同じ縮尺で並ぶようにする
 */
const PANEL_DISTANCE = CAMERA_DISTANCE

/**
 * 解説パネルを置く平面での、ディスクの見かけの半径。
 *
 * パネルの奥行きをカメラからディスクまでの距離と同じにしてあるので、視線と直角な向きに
 * ある左右の端はそのままの半径で映る。グラフの左端をそろえるための目安に使う
 */
const DISC_APPARENT_RADIUS = DISC_RADIUS

/**
 * 視錐台を横・縦へずらす量（画面の幅・高さに対する割合）。
 *
 * ディスクは視点を回す中心なので、そのままでは必ず画面の中央に来る。カメラの向きを
 * 変えずに視錐台だけをずらすことで、ディスクを左上に、右に拡大断面・下にグラフを置く
 * 場所を作る
 */
const VIEW_SHIFT = 0.2
const VIEW_SHIFT_Y = 0.11

/** 拡大断面を画面の右端から離す量と、その中心の高さ */
const DIAGRAM_RIGHT_MARGIN = 1.6
const DIAGRAM_CENTER_Y = 0.15

/**
 * 拡大断面の表示倍率。狭い画面でも図が読めるよう、ディスクと同じくらいの大きさまで拡大する。
 * ラベルも一緒に拡大されるので、文字の読みやすさもこの値で決まる
 */
const DIAGRAM_SCALE = 1.3

/** 拡大断面の寸法（ローカル座標。記録面が y = 0、真ん中のピットの中心が原点） */
const DIAGRAM_HALF_WIDTH = 0.95
const DIAGRAM_PIT_RADIUS = 0.075
const DIAGRAM_SUBSTRATE_DEPTH = 0.2
const DIAGRAM_RAY_LENGTH = 0.62
const DIAGRAM_NORMAL_TOP = 0.5
const DIAGRAM_NORMAL_BOTTOM = 0.05

/**
 * 断面の縮尺（ローカル座標の長さ ÷ nm）。
 *
 * CD の間隔（1.6μm）がちょうど `0.44` になる縮尺。**ピットの間隔を変えると、
 * 断面のピットの間隔もこの縮尺どおりに広がる／狭まる。** ピット自体の大きさは
 * 変えない（間隔だけを効かせて見せたいので、そこは固定した図として扱う）。
 * 上限の間隔でも、外側のピットが断面の端に収まる縮尺にしてある
 */
const DIAGRAM_NM_SCALE = 0.44 / CD_PITCH_NM

/** 断面に並べるピットの数。「規則正しく並んでいる」ことが読み取れる最小限 */
const DIAGRAM_PIT_COUNT = 3

/** 光線をつなぐ高さ（ピットの頂点） */
const PIT_APEX_Y = DIAGRAM_PIT_RADIUS

/** ピット 1 つを半円で描くときの分割数 */
const PIT_ARC_SEGMENTS = 16

/** ピットの間隔を示す寸法線の高さと、その端に付ける短い線の長さ */
const DIMENSION_Y = -0.1
const DIMENSION_TICK = 0.035

/**
 * 断面に描く角度の上限（度）と、2 本の光線を離しておく最小の角度差（度）。
 *
 * 真横に近い角度は図がはみ出し、入射光と回折光が重なると光路差が読めなくなるので、
 * **図の見やすさのためだけに**角度を丸める（色と光路差は実際の 3 次元の向きから求める）
 */
const DIAGRAM_MAX_ANGLE_DEG = 72
const DIAGRAM_MIN_SEPARATION_DEG = 16

/** ラベルが断面からはみ出さないよう、横位置を止める値 */
const DIAGRAM_MAX_LABEL_X = DIAGRAM_HALF_WIDTH

/** 波長ごとの強め合いのグラフ。描画領域の寸法と、波長の刻み数 */
const GRAPH_WIDTH = 3.0
const GRAPH_HEIGHT = 0.55
const GRAPH_SAMPLES = 140

/** 横軸の下に置くもの（目盛りの数値・タイトル）の下端を、画面の下端から離す量 */
const GRAPH_BOTTOM_GAP = 0.22

/** 横軸の目盛りを付ける波長（nm）と、目盛り線の長さ */
const TICK_WAVELENGTHS = [400, 500, 600, 700]
const TICK_LENGTH = 0.05

/** 重なった光の色を出す小片の大きさ。横位置は拡大断面の法線にそろえる */
const SWATCH_SIZE = 0.44

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.115

/** グラフまわりのラベルは、狭い画面でも読めるよう断面のラベルより大きくする */
const GRAPH_TITLE_HEIGHT = 0.16
/** 軸の意味と色の小片の見出し。タイトルと同じ大きさにそろえる */
const AXIS_LABEL_HEIGHT = GRAPH_TITLE_HEIGHT
const TICK_LABEL_HEIGHT = 0.13

/** 目盛りの数値とタイトルの間隔 */
const GRAPH_TITLE_GAP = 0.05

/** 横軸の下に目盛り線・数値・タイトルが占める高さ。グラフを画面の下端からどれだけ上げるかに使う */
const GRAPH_BELOW_ZONE =
  TICK_LENGTH + TICK_LABEL_HEIGHT * 1.25 + GRAPH_TITLE_GAP + GRAPH_TITLE_HEIGHT

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白、書体 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12
const LABEL_FONT = "bold 92px sans-serif"

/** 光線の太さ（ピクセル）。`LineBasicMaterial` の `linewidth` は WebGL では効かないので Line2 系で描く */
const RAY_LINE_WIDTH = 1.6

/** 光の進む向きを示す矢じりの大きさと、光線上のどこに置くか */
const ARROW_RADIUS = 0.024
const ARROW_HEIGHT = 0.08
const ARROW_ALONG = 0.55

/**
 * 次数の矢印（視点以外の向きへ出ていく回折光）を描くときの基準の波長（nm）。
 *
 * 強め合う向きは波長ごとに違うので、1 つの波長を決めないと矢印が引けない。
 * 可視域の真ん中あたりの緑を選び、間隔や入射の向きを変えたときに
 * 「向きの本数と広がりがどう変わるか」を追えるようにしてある
 */
const ORDER_REFERENCE_NM = 550

/** 次数の矢印として確保する本数。間隔が上限のとき可視域の緑で存在しうる本数（9）に余裕を持たせた値 */
const MAX_ORDER_COUNT = 12

/** 次数の矢印の長さと矢じりの大きさ。視点へ向かう回折光より控えめにして主役を譲る */
const ORDER_RAY_LENGTH = DIAGRAM_RAY_LENGTH * 0.8
const ORDER_ARROW_RADIUS = ARROW_RADIUS * 0.8
const ORDER_ARROW_HEIGHT = ARROW_HEIGHT * 0.8

/**
 * 視点へ向かう回折光と次数の矢印が重なったとみなす角度差（度）。
 * この範囲に入った次数は矢印を描かない（明るい 1 本がその次数そのものになる）
 */
const ORDER_MERGE_DEG = 5

// 記事の SVG 図解と同じ役割分担で色を決める（--canvas-pen-* の値をリテラルで踏襲）。
// 回折前の光をオレンジ、回折後の光をイエローにするのは、同じ記事の回折の図と揃えるため
const INCIDENT_COLOR = "#ef8c00"
const DIFFRACTED_COLOR = "#f6ce46"
// 視点以外の向きへ出ていく回折光。回折光と同じ系統の色を落として、
// 「同じ光の、眼に入らない向き」だと分かるようにする
const OTHER_ORDER_COLOR = "#96803c"
const DISC_COLOR = "#7d9cc9"
const NORMAL_COLOR = "#bfbfbf"
const FRAME_COLOR = "#8a8a92"
const MARKER_COLOR = "#e8e8ee"
// グラフの曲線。色のついた塗りの上でも輪郭が追えるよう、明るい無彩色にする
const CURVE_COLOR = "#dcdce2"
// 記録されていない内周（クランプ部）。図の色の見えを変えないよう無彩色にする
const CLAMP_AREA_COLOR = "#8e939b"

/** 記録面（半透明の塗り）の不透明度 */
const SUBSTRATE_OPACITY = 0.25

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

/** ディスクのローカル座標での、注目点の位置・溝が並ぶ向き（半径方向）・法線 */
const RADIAL_LOCAL = new Vector3(
  Math.cos(MathUtils.degToRad(MARKED_ANGLE_DEG)),
  Math.sin(MathUtils.degToRad(MARKED_ANGLE_DEG)),
  0
)
const NORMAL_LOCAL = new Vector3(0, 0, 1)
const MARKED_LOCAL = RADIAL_LOCAL.clone().multiplyScalar(MARKED_RADIUS)

/**
 * 光路差が `opdNm` のときに、隣り合うトラックで回折した光が波長 `nm` でどれだけ強め合うか（`0`〜`1`）。
 *
 * 回折した光は 1 本のトラックからだけでなく、並んだ何本ものトラックから重なって届く。
 * 光路差が波長の整数倍になる波長ではすべてのトラックの波が揃って強め合い、
 * そこから外れた波長は打ち消し合って消える。本数が多いほど強め合う波長が絞られる
 */
const interferenceIntensity = (opdNm: number, nm: number) => {
  const phase = (Math.PI * opdNm) / nm
  const sinPhase = Math.sin(phase)
  // 光路差が波長の整数倍の点は 0/0 になる。すべてのトラックが揃って強め合う点なので 1
  if (Math.abs(sinPhase) < 1e-6) return 1
  const amplitude = Math.sin(COHERENT_TRACKS * phase) / (COHERENT_TRACKS * sinPhase)
  return amplitude * amplitude
}

/** 数値を GLSL の float リテラルとして埋め込む（`1` のような整数表記は型が合わない） */
const glslFloat = (value: number) => value.toFixed(4)

/**
 * `#rrggbb` を GLSL の vec3 リテラルにする。
 * このシーンのフラグメントシェーダは色空間の変換を挟まず画面へ出すので、
 * 指定した見た目のまま出したい色は sRGB の値をそのまま渡す
 */
const glslSrgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  return `vec3(${channels.map((channel) => (channel / 255).toFixed(4)).join(", ")})`
}

/**
 * 光路差ごとの色。白色光（すべての波長が同じ強さ）がトラックの列で回折した結果の色が並ぶ。
 *
 * 画素ごとに可視域を積分するのは重いので、光路差を刻んで色を先に求めておく。
 * 記録面はこれをテクスチャとして引き、注目点の色は同じ表から直接読む
 */
const buildDiffractionColors = () => {
  const opdAt = (index: number) => (index / (LUT_SIZE - 1)) * MAX_OPD_NM

  const linear = Array.from({ length: LUT_SIZE }, (_, i) => {
    const opdNm = opdAt(i)
    return desaturateToGamut(
      xyzToLinearSrgb(spectrumToXyz((nm) => interferenceIntensity(opdNm, nm)))
    )
  })

  // 露出は「1 次の回折だけが見える範囲」に合わせる。光路差 0（正反射）はすべての波長が
  // 揃うのでいちばん明るいが、そこを基準にすると色のついた帯がまとめて暗く沈んでしまう。
  // 正反射のあたりは白く飛ぶが、実物のディスクでもそこは白いつやになる
  let peak = 0
  linear.forEach((color, i) => {
    const opdNm = opdAt(i)
    if (opdNm < EXPOSURE_MIN_OPD_NM || opdNm > EXPOSURE_MAX_OPD_NM) return
    peak = Math.max(peak, ...color)
  })
  const normalized = linear.map(([r, g, b]): Tristimulus => [r / peak, g / peak, b / peak])

  const data = new Uint8Array(LUT_SIZE * 4)
  normalized.forEach((color, i) => {
    color.forEach((value, channel) => {
      data[i * 4 + channel] = Math.round(encodeSrgb(value) * 255)
    })
    data[i * 4 + 3] = 255
  })

  const texture = new DataTexture(data, LUT_SIZE, 1, RGBAFormat)
  // 光路差は連続に変わるので、表の隣り合う色をなめらかに補間する
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.needsUpdate = true

  /** 光路差（nm）に対応する色を線形 sRGB で返す。テクスチャと同じ表を CPU 側から引く */
  const colorAt = (opdNm: number): Tristimulus => {
    const index = Math.round(MathUtils.clamp(opdNm / MAX_OPD_NM, 0, 1) * (LUT_SIZE - 1))
    // テクスチャ側は 8bit に丸める段で 1 を超えたぶんが切り落ちるので、こちらも同じに揃える
    const [r, g, b] = normalized[index]
    return [Math.min(r, 1), Math.min(g, 1), Math.min(b, 1)]
  }

  return { texture, colorAt }
}

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldRadial;
  varying float vLocalRadius;

  void main() {
    // RingGeometry は XY 平面にある。トラックは同心円なので、
    // 溝が並ぶ向き（回折格子として周期を持つ向き）は面内の半径方向になる
    vLocalRadius = length(position.xy);
    vec3 localRadial = vec3(position.xy / max(vLocalRadius, 0.00001), 0.0);
    // ディスクは回転させるだけなので、modelMatrix の 3x3 部分をそのまま向きの変換に使える
    vWorldRadial = normalize(mat3(modelMatrix) * localRadial);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uDiffractionColor;
  uniform vec3 uLightDirection;
  uniform float uPitchNm;

  varying vec3 vWorldPosition;
  varying vec3 vWorldRadial;
  varying float vLocalRadius;

  void main() {
    // ピットが刻まれていない内周は回折を起こさない。ここだけ無彩色で塗る
    if (vLocalRadius < ${glslFloat(DATA_INNER_RADIUS)}) {
      gl_FragColor = vec4(${glslSrgb(CLAMP_AREA_COLOR)}, 1.0);
      return;
    }

    vec3 toEye = normalize(cameraPosition - vWorldPosition);
    // 頂点間で補間されたぶん長さが 1 から外れるので、ここで単位ベクトルに戻す
    vec3 radial = normalize(vWorldRadial);

    // 隣り合うトラックで回折した光の光路差。
    // 溝が並ぶ向き（半径方向）に射影した分だけが差になるので、その成分だけを取る
    float opd = uPitchNm * dot(radial, toEye + uLightDirection);

    float lookup = clamp(abs(opd) / ${glslFloat(MAX_OPD_NM)}, 0.0, 1.0);
    gl_FragColor = vec4(texture2D(uDiffractionColor, vec2(lookup, 0.5)).rgb, 1.0);
  }
`

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字の幅を測って板の横幅を決めるので、文字数の違うラベルでも字の大きさがそろう
 */
const createLabel = (text: string, color: string, height = LABEL_HEIGHT) => {
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
  const width = (height * canvas.width) / canvas.height
  sprite.scale.set(width, height, 1)

  return {
    sprite,
    halfWidth: width / 2,
    dispose: () => {
      texture.dispose()
      material.dispose()
    }
  }
}

/**
 * 太さを指定できる光線。`count` 本の線分をまとめて 1 つのオブジェクトとして描く。
 *
 * 太さはピクセル単位なので、canvas の実寸をマテリアルへ渡す必要がある（`setResolution`）
 */
const createRayLines = (count: number, color: string) => {
  const positions = new Float32Array(count * 2 * 3)
  const geometry = new LineSegmentsGeometry()
  const material = new LineMaterial({ color, linewidth: RAY_LINE_WIDTH })

  return {
    object: new LineSegments2(geometry, material),
    /** segment 番目の線分の端点を書き込む（end は 0 が始点、1 が終点） */
    setPoint: (segment: number, end: number, x: number, y: number) => {
      const offset = (segment * 2 + end) * 3
      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = 0
    },
    commit: () => geometry.setPositions(positions),
    setResolution: (width: number, height: number) => material.resolution.set(width, height),
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 記録面の断面線。ピットのぶんだけ半円状に持ち上がった 1 本の折れ線として書き込む。
 *
 * ピットの間隔は操作で変わるので、頂点の数だけ先に確保しておいて毎回書き直す
 * （半円 1 つあたり「左の付け根 + 弧の分割数 + 1」点、両端に平らな面の端点が付く）
 */
const SURFACE_POINT_COUNT = 2 + DIAGRAM_PIT_COUNT * (PIT_ARC_SEGMENTS + 2)

const writeSurfacePoints = (
  position: Float32BufferAttribute,
  pitCenterX: readonly number[]
) => {
  let index = 0
  const put = (x: number, y: number) => position.setXYZ(index++, x, y, 0)

  put(-DIAGRAM_HALF_WIDTH, 0)
  pitCenterX.forEach((centerX) => {
    put(centerX - DIAGRAM_PIT_RADIUS, 0)
    for (let i = 0; i <= PIT_ARC_SEGMENTS; i++) {
      const angle = Math.PI - (i / PIT_ARC_SEGMENTS) * Math.PI
      put(centerX + DIAGRAM_PIT_RADIUS * Math.cos(angle), DIAGRAM_PIT_RADIUS * Math.sin(angle))
    }
  })
  put(DIAGRAM_HALF_WIDTH, 0)
  position.needsUpdate = true
}

/**
 * 断面に描く 2 本の角度を、図として読める範囲に丸める。
 *
 * 真横に近い角度は図からはみ出し、入射光と回折光が重なると 2 本の道のりの違いが読めない。
 * **色と光路差は実際の 3 次元の向きから求めている**ので、この調整は図の見やすさにだけ効く
 */
const layoutAngles = (incidentRad: number, diffractedRad: number): [number, number] => {
  const limit = MathUtils.degToRad(DIAGRAM_MAX_ANGLE_DEG)
  const incident = MathUtils.clamp(incidentRad, -limit, limit)
  const diffracted = MathUtils.clamp(diffractedRad, -limit, limit)

  const separation = MathUtils.degToRad(DIAGRAM_MIN_SEPARATION_DEG)
  const gap = diffracted - incident
  if (Math.abs(gap) >= separation) return [incident, diffracted]

  // 2 本の真ん中を動かさずに、必要なだけ左右へ開く
  const center = (incident + diffracted) / 2
  const half = (separation / 2) * (gap < 0 ? -1 : 1)
  return [
    MathUtils.clamp(center - half, -limit, limit),
    MathUtils.clamp(center + half, -limit, limit)
  ]
}

/**
 * 回折光が出ていく向き（法線から測ったラジアン）を、次数ごとにすべて求める。
 *
 * 1 つのピットは光を四方へ広げるが、隣のピットから来た光と重なったときに残るのは、
 * 道のりの差がちょうど波長の整数倍になる向きだけ。その向きが「次数」で、
 * `間隔 × (出ていく向きの正弦 + 入る向きの正弦) = 次数 × 波長` を満たす。
 *
 * - 次数 `0` は出ていく向きが入射の反対側の同じ角度、つまり**正反射**（どの波長も同じ向き）
 * - 正弦が ±1 を超える次数は面から出られないので存在しない。
 *   **間隔が狭いほど次数の間隔が開き、存在できる本数が減る**
 */
const diffractionOrderAngles = (incidentRad: number, pitchNm: number) => {
  const sinIncident = Math.sin(incidentRad)
  // 次数が 1 つ上がるごとに、出ていく向きの正弦がこれだけずれる
  const step = ORDER_REFERENCE_NM / pitchNm
  const angles: number[] = []
  for (let order = Math.ceil((sinIncident - 1) / step); angles.length < MAX_ORDER_COUNT; order++) {
    const sinDiffracted = order * step - sinIncident
    if (sinDiffracted > 1) break
    angles.push(Math.asin(MathUtils.clamp(sinDiffracted, -1, 1)))
  }
  return angles
}

/**
 * 注目点の記録面を大きく拡大した断面。
 *
 * 規則正しく並んだピットに白色光が当たり、それぞれのピットで回折した光が視点へ向かう。
 * 隣のピットを通った光は道のりが少しだけ違うので、その差（光路差）が波長の整数倍になる
 * 波長だけが強め合う。実際のピットの間隔は 1.6μm しかないので、寸法は大きく誇張してある。
 *
 * 断面は、溝が並ぶ向きと面の法線が張る平面への**射影**として描く。光や視点はこの平面から
 * 外れた向きにもあるので、図の角度はその平面に落とした見かけの角度になる
 * （光路差は射影ではなく実際の 3 次元の向きから求めている）
 */
const createPitDiagram = () => {
  const group = new Group()
  // 図の中身はすべてこの倍率で拡大される（線の太さだけはピクセル指定なので変わらない）
  group.scale.setScalar(DIAGRAM_SCALE)

  // 記録面。半透明の塗りに断面線を重ね、ピットが面の一部であることを見せる
  const substrateGeometry = new PlaneGeometry(DIAGRAM_HALF_WIDTH * 2, DIAGRAM_SUBSTRATE_DEPTH)
  const substrateMaterial = new MeshBasicMaterial({
    color: DISC_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: SUBSTRATE_OPACITY,
    depthWrite: false
  })
  const substrate = new Mesh(substrateGeometry, substrateMaterial)
  substrate.position.set(0, -DIAGRAM_SUBSTRATE_DEPTH / 2, 0)
  group.add(substrate)

  // 記録面の断面線。間隔が変わると形も変わるので、頂点を確保しておいて毎回書き直す
  const surfacePosition = new Float32BufferAttribute(
    new Float32Array(SURFACE_POINT_COUNT * 3),
    3
  )
  const surfaceGeometry = new BufferGeometry().setAttribute("position", surfacePosition)
  const surfaceMaterial = new LineBasicMaterial({ color: DISC_COLOR })
  const surface = new Line(surfaceGeometry, surfaceMaterial)
  // 頂点を毎回書き直すので、最初に求めた境界球で視野外と判定されないようにする
  surface.frustumCulled = false
  group.add(surface)

  // ピットの間隔を示す寸法線（両端に短い線を立てる）。長さが操作で変わる
  const dimensionPosition = new Float32BufferAttribute(new Float32Array(6 * 3), 3)
  const dimensionGeometry = new BufferGeometry().setAttribute("position", dimensionPosition)
  const dimensionMaterial = new LineBasicMaterial({ color: NORMAL_COLOR })
  const dimension = new LineSegments(dimensionGeometry, dimensionMaterial)
  dimension.frustumCulled = false
  group.add(dimension)

  // 法線。入射角・回折角がどこから測った角度かを示す
  const normalGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -DIAGRAM_NORMAL_BOTTOM, 0),
    new Vector3(0, DIAGRAM_NORMAL_TOP, 0)
  ])
  const normalMaterial = new LineBasicMaterial({ color: NORMAL_COLOR })
  group.add(new Line(normalGeometry, normalMaterial))

  const incidentRays = createRayLines(DIAGRAM_PIT_COUNT, INCIDENT_COLOR)
  const diffractedRays = createRayLines(DIAGRAM_PIT_COUNT, DIFFRACTED_COLOR)
  group.add(incidentRays.object, diffractedRays.object)

  // 視点以外の向きへ出ていく回折光。存在する次数の数が操作で変わるので、
  // 上限ぶんの頂点を確保しておき、描く本数だけを毎回切り替える
  const orderPosition = new Float32BufferAttribute(new Float32Array(MAX_ORDER_COUNT * 2 * 3), 3)
  const orderGeometry = new BufferGeometry().setAttribute("position", orderPosition)
  const orderMaterial = new LineBasicMaterial({ color: OTHER_ORDER_COLOR })
  const orderLines = new LineSegments(orderGeometry, orderMaterial)
  orderLines.frustumCulled = false
  group.add(orderLines)

  const orderArrowGeometry = new ConeGeometry(ORDER_ARROW_RADIUS, ORDER_ARROW_HEIGHT, 10)
  const orderArrowMaterial = new MeshBasicMaterial({ color: OTHER_ORDER_COLOR })
  const orderArrows = Array.from({ length: MAX_ORDER_COUNT }, () => {
    const arrow = new Mesh(orderArrowGeometry, orderArrowMaterial)
    arrow.visible = false
    group.add(arrow)
    return arrow
  })

  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const arrowMaterials = [INCIDENT_COLOR, DIFFRACTED_COLOR].map(
    (color) => new MeshBasicMaterial({ color })
  )
  const createArrows = (material: MeshBasicMaterial) =>
    Array.from({ length: DIAGRAM_PIT_COUNT }, () => {
      const arrow = new Mesh(arrowGeometry, material)
      group.add(arrow)
      return arrow
    })
  const incidentArrows = createArrows(arrowMaterials[0])
  const diffractedArrows = createArrows(arrowMaterials[1])

  const labels = {
    incident: createLabel("入射光", INCIDENT_COLOR),
    diffracted: createLabel("回折光", DIFFRACTED_COLOR),
    // 間隔の数値はパネルのスライダーに出るので、ここでは寸法線が何の長さかだけを示す
    pitch: createLabel("ピットの間隔", NORMAL_COLOR),
    order: createLabel("他の向きの回折光", OTHER_ORDER_COLOR)
  }
  const labelList = Object.values(labels)
  group.add(...labelList.map(({ sprite }) => sprite))

  /** ラベルが断面の外へ出ないよう、横位置だけ内側へ寄せる */
  const clampLabelX = (x: number, halfWidth: number) =>
    MathUtils.clamp(x, -DIAGRAM_MAX_LABEL_X + halfWidth, DIAGRAM_MAX_LABEL_X - halfWidth)

  // 入射光は必ず右側から来る向きに収まるので、次数のラベルは空いている左上に固定で置く。
  // 高さは次数の矢印がいちばん高く届く位置より上にして、矢印と重ならないようにする
  labels.order.sprite.position.set(
    -DIAGRAM_MAX_LABEL_X + labels.order.halfWidth,
    PIT_APEX_Y + ORDER_RAY_LENGTH + LABEL_HEIGHT * 0.8,
    0
  )

  /** ピットの中心の横位置。真ん中のピットが原点に来るように並べる */
  const pitCenterX = new Array<number>(DIAGRAM_PIT_COUNT).fill(0)

  /** 矢じりの向きを組み立てるのに使い回す */
  const arrowDirection = new Vector3()
  const placeArrow = (arrow: Mesh, x: number, y: number, dirX: number, dirY: number) => {
    arrow.position.set(x, y, 0)
    arrow.quaternion.setFromUnitVectors(CONE_UP, arrowDirection.set(dirX, dirY, 0).normalize())
  }

  return {
    group,
    /**
     * 入射光の来る向きと回折光の出ていく向き（どちらも法線から測ったラジアン。
     * 符号が法線のどちら側かを表す）と、ピットの間隔（nm）から描き直す
     */
    setState: (incidentRad: number, diffractedRad: number, pitchNm: number) => {
      const inX = Math.sin(incidentRad)
      const inY = Math.cos(incidentRad)
      const outX = Math.sin(diffractedRad)
      const outY = Math.cos(diffractedRad)

      // 間隔は実際の値を断面の縮尺で引き伸ばして描く
      const pitch = pitchNm * DIAGRAM_NM_SCALE
      for (let i = 0; i < DIAGRAM_PIT_COUNT; i++) {
        pitCenterX[i] = (i - (DIAGRAM_PIT_COUNT - 1) / 2) * pitch
      }
      writeSurfacePoints(surfacePosition, pitCenterX)

      dimensionPosition.setXYZ(0, 0, DIMENSION_Y, 0)
      dimensionPosition.setXYZ(1, pitch, DIMENSION_Y, 0)
      dimensionPosition.setXYZ(2, 0, DIMENSION_Y - DIMENSION_TICK, 0)
      dimensionPosition.setXYZ(3, 0, DIMENSION_Y + DIMENSION_TICK, 0)
      dimensionPosition.setXYZ(4, pitch, DIMENSION_Y - DIMENSION_TICK, 0)
      dimensionPosition.setXYZ(5, pitch, DIMENSION_Y + DIMENSION_TICK, 0)
      dimensionPosition.needsUpdate = true

      labels.pitch.sprite.position.set(
        clampLabelX(pitch / 2, labels.pitch.halfWidth),
        DIMENSION_Y - DIMENSION_TICK - LABEL_HEIGHT,
        0
      )

      // 回折光が出ていける向きを次数ごとに描く。真ん中のピットを起点にして扇状に並べる。
      // 視点へ向かう向きと重なる次数は描かない（明るい 1 本がその次数そのものになる）
      const orderAngles = diffractionOrderAngles(incidentRad, pitchNm)
      const mergeRad = MathUtils.degToRad(ORDER_MERGE_DEG)
      let drawn = 0
      orderAngles.forEach((angle) => {
        if (Math.abs(angle - diffractedRad) < mergeRad) return
        const dirX = Math.sin(angle)
        const dirY = Math.cos(angle)
        orderPosition.setXYZ(drawn * 2, 0, PIT_APEX_Y, 0)
        orderPosition.setXYZ(
          drawn * 2 + 1,
          dirX * ORDER_RAY_LENGTH,
          PIT_APEX_Y + dirY * ORDER_RAY_LENGTH,
          0
        )
        // 矢じりは線の先端に置く（円錐の先が線の終点に来るよう半分ぶん手前を中心にする）
        const tip = ORDER_RAY_LENGTH - ORDER_ARROW_HEIGHT / 2
        placeArrow(orderArrows[drawn], dirX * tip, PIT_APEX_Y + dirY * tip, dirX, dirY)
        orderArrows[drawn].visible = true
        drawn++
      })
      orderPosition.needsUpdate = true
      orderGeometry.setDrawRange(0, drawn * 2)
      for (let i = drawn; i < MAX_ORDER_COUNT; i++) orderArrows[i].visible = false

      pitCenterX.forEach((centerX, i) => {
        // 入射光。どのピットにも同じ向きから平行に届く
        incidentRays.setPoint(
          i,
          0,
          centerX + inX * DIAGRAM_RAY_LENGTH,
          PIT_APEX_Y + inY * DIAGRAM_RAY_LENGTH
        )
        incidentRays.setPoint(i, 1, centerX, PIT_APEX_Y)

        // 回折光。ピットは四方へ光を広げるが、そのうち視点へ向かう 1 本だけを描く
        diffractedRays.setPoint(i, 0, centerX, PIT_APEX_Y)
        diffractedRays.setPoint(
          i,
          1,
          centerX + outX * DIAGRAM_RAY_LENGTH,
          PIT_APEX_Y + outY * DIAGRAM_RAY_LENGTH
        )

        // 矢じりは光線の途中に置き、先端を進む向きへ合わせる
        const inAlong = DIAGRAM_RAY_LENGTH * (1 - ARROW_ALONG)
        placeArrow(
          incidentArrows[i],
          centerX + inX * inAlong,
          PIT_APEX_Y + inY * inAlong,
          -inX,
          -inY
        )
        const outAlong = DIAGRAM_RAY_LENGTH * ARROW_ALONG
        placeArrow(
          diffractedArrows[i],
          centerX + outX * outAlong,
          PIT_APEX_Y + outY * outAlong,
          outX,
          outY
        )
      })
      incidentRays.commit()
      diffractedRays.commit()

      // ラベルは、それぞれの光線の束の外側の端に置く。
      // 入射光と回折光が同じ側に出たときも重ならないよう、高さをずらしてある
      const incidentEnd = pitCenterX[inX < 0 ? 0 : DIAGRAM_PIT_COUNT - 1]
      labels.incident.sprite.position.set(
        clampLabelX(
          incidentEnd + inX * DIAGRAM_RAY_LENGTH + Math.sign(inX || 1) * labels.incident.halfWidth,
          labels.incident.halfWidth
        ),
        PIT_APEX_Y + inY * DIAGRAM_RAY_LENGTH + LABEL_HEIGHT * 0.8,
        0
      )
      const diffractedEnd = pitCenterX[outX < 0 ? 0 : DIAGRAM_PIT_COUNT - 1]
      labels.diffracted.sprite.position.set(
        clampLabelX(
          diffractedEnd +
            outX * DIAGRAM_RAY_LENGTH +
            Math.sign(outX || 1) * labels.diffracted.halfWidth,
          labels.diffracted.halfWidth
        ),
        PIT_APEX_Y + outY * DIAGRAM_RAY_LENGTH + LABEL_HEIGHT * 2.1,
        0
      )
    },
    setResolution: (width: number, height: number) => {
      incidentRays.setResolution(width, height)
      diffractedRays.setResolution(width, height)
    },
    dispose: () => {
      incidentRays.dispose()
      diffractedRays.dispose()
      labelList.forEach((label) => label.dispose())
      arrowMaterials.forEach((material) => material.dispose())
      const disposables = [
        substrateGeometry,
        substrateMaterial,
        surfaceGeometry,
        surfaceMaterial,
        dimensionGeometry,
        dimensionMaterial,
        orderGeometry,
        orderMaterial,
        orderArrowGeometry,
        orderArrowMaterial,
        normalGeometry,
        normalMaterial,
        arrowGeometry
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/**
 * 注目点での、波長ごとの強め合いの強さを表すグラフ。
 *
 * 横軸が波長（nm の目盛りつき）、縦軸が強め合いの強さ。曲線の下はその波長の色で塗ってある。
 * 山になっている波長は隣り合うトラックからの光が強め合っていて、谷（高さ 0）の波長は
 * 打ち消し合っている。山として残った波長を混ぜたものが、右の小片（＝注目点に見える色）になる。
 *
 * グループの原点は描画領域の左下（横軸と縦軸の交点）
 */
const createSpectrumGraph = () => {
  const group = new Group()

  const wavelengths = Array.from(
    { length: GRAPH_SAMPLES },
    (_, i) => VISIBLE_MIN_NM + ((i + 0.5) / GRAPH_SAMPLES) * (VISIBLE_MAX_NM - VISIBLE_MIN_NM)
  )
  // 塗りはその波長そのものの色にする。強さは高さで示すので、色の明るさは落とさない
  const baseColors = wavelengths.map(wavelengthToLinearSrgb)

  const columnX = (index: number) => (index / GRAPH_SAMPLES) * GRAPH_WIDTH

  const fillPosition = new Float32BufferAttribute(new Float32Array(GRAPH_SAMPLES * 4 * 3), 3)
  const fillColor = new Float32BufferAttribute(new Float32Array(GRAPH_SAMPLES * 4 * 3), 3)
  const fillIndex: number[] = []
  wavelengths.forEach((_, i) => {
    const [r, g, b] = baseColors[i]
    // 下の 2 頂点は横軸の上に固定し、上の 2 頂点だけを強さに応じて上下させる
    fillPosition.setXYZ(i * 4, columnX(i), 0, 0)
    fillPosition.setXYZ(i * 4 + 1, columnX(i + 1), 0, 0)
    for (let corner = 0; corner < 4; corner++) fillColor.setXYZ(i * 4 + corner, r, g, b)
    fillIndex.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3)
  })
  const fillGeometry = new BufferGeometry()
    .setAttribute("position", fillPosition)
    .setAttribute("color", fillColor)
  fillGeometry.setIndex(fillIndex)
  const fillMaterial = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide })
  group.add(new Mesh(fillGeometry, fillMaterial))

  // 曲線。塗りが暗くなる紫や赤の端でも、山と谷の形を追えるようにする
  const curvePosition = new Float32BufferAttribute(new Float32Array(GRAPH_SAMPLES * 3), 3)
  const curveGeometry = new BufferGeometry().setAttribute("position", curvePosition)
  const curveMaterial = new LineBasicMaterial({ color: CURVE_COLOR })
  group.add(new Line(curveGeometry, curveMaterial))

  // 横軸と、波長の目盛り
  const axisPoints = [new Vector3(0, 0, 0), new Vector3(GRAPH_WIDTH, 0, 0)]
  const tickX = (nm: number) =>
    ((nm - VISIBLE_MIN_NM) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)) * GRAPH_WIDTH
  const tickPoints = TICK_WAVELENGTHS.flatMap((nm) => [
    new Vector3(tickX(nm), 0, 0),
    new Vector3(tickX(nm), -TICK_LENGTH, 0)
  ])
  const axisGeometry = new BufferGeometry().setFromPoints(axisPoints)
  const tickGeometry = new BufferGeometry().setFromPoints(tickPoints)
  const axisMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  group.add(new Line(axisGeometry, axisMaterial), new LineSegments(tickGeometry, axisMaterial))

  const tickLabels = TICK_WAVELENGTHS.map((nm) => {
    const label = createLabel(`${nm}`, NORMAL_COLOR, TICK_LABEL_HEIGHT)
    label.sprite.position.set(tickX(nm), -TICK_LENGTH - TICK_LABEL_HEIGHT * 0.75, 0)
    return label
  })
  const unitLabel = createLabel("nm", NORMAL_COLOR, TICK_LABEL_HEIGHT)
  unitLabel.sprite.position.set(
    GRAPH_WIDTH - unitLabel.halfWidth,
    -TICK_LENGTH - TICK_LABEL_HEIGHT * 0.75,
    0
  )

  // 縦軸の意味は目盛りではなく言葉で示す。上端が強め合い、下端（高さ 0）が打ち消し合い
  const topLabel = createLabel("強め合う", NORMAL_COLOR, AXIS_LABEL_HEIGHT)
  topLabel.sprite.position.set(-topLabel.halfWidth - TICK_LENGTH, GRAPH_HEIGHT, 0)
  const bottomLabel = createLabel("打ち消し合う", NORMAL_COLOR, AXIS_LABEL_HEIGHT)
  bottomLabel.sprite.position.set(-bottomLabel.halfWidth - TICK_LENGTH, 0, 0)

  // ディスク全体ではなく注目点 1 つぶんの分布なので、ラベルでその範囲をはっきりさせる。
  // 目盛りの数値の下に、末尾が横軸の右端にそろう位置で置く
  const title = createLabel("注目点で強め合っている波長", NORMAL_COLOR, GRAPH_TITLE_HEIGHT)
  title.sprite.position.set(
    GRAPH_WIDTH - title.halfWidth,
    -(GRAPH_BELOW_ZONE - GRAPH_TITLE_HEIGHT / 2),
    0
  )

  const labels = [...tickLabels, unitLabel, topLabel, bottomLabel, title]
  group.add(...labels.map(({ sprite }) => sprite))

  return {
    group,
    /** 光路差から、波長ごとの強め合いの強さを曲線の高さに反映する */
    setOpticalPathDifference: (opdNm: number) => {
      wavelengths.forEach((nm, i) => {
        const height = interferenceIntensity(opdNm, nm) * GRAPH_HEIGHT
        fillPosition.setXYZ(i * 4 + 2, columnX(i + 1), height, 0)
        fillPosition.setXYZ(i * 4 + 3, columnX(i), height, 0)
        curvePosition.setXYZ(i, (columnX(i) + columnX(i + 1)) / 2, height, 0)
      })
      fillPosition.needsUpdate = true
      curvePosition.needsUpdate = true
    },
    dispose: () => {
      labels.forEach((label) => label.dispose())
      const disposables = [
        fillGeometry,
        fillMaterial,
        curveGeometry,
        curveMaterial,
        axisGeometry,
        tickGeometry,
        axisMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 強め合った波長を混ぜた結果の色を出す小片。記録面の注目点に出ている色と一致する */
const createResultSwatch = () => {
  const group = new Group()

  const geometry = new PlaneGeometry(SWATCH_SIZE, SWATCH_SIZE)
  const material = new MeshBasicMaterial({ side: DoubleSide })
  const swatch = new Mesh(geometry, material)
  swatch.position.set(SWATCH_SIZE / 2, SWATCH_SIZE / 2, 0)
  group.add(swatch)

  const frameGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(SWATCH_SIZE, 0, 0),
    new Vector3(SWATCH_SIZE, SWATCH_SIZE, 0),
    new Vector3(0, SWATCH_SIZE, 0),
    new Vector3(0, 0, 0)
  ])
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  group.add(new Line(frameGeometry, frameMaterial))

  const title = createLabel("注目点に見える色", NORMAL_COLOR, AXIS_LABEL_HEIGHT)
  title.sprite.position.set(SWATCH_SIZE / 2, -AXIS_LABEL_HEIGHT * 0.75, 0)
  group.add(title.sprite)

  return {
    group,
    setColor: ([r, g, b]: Tristimulus) => material.color.setRGB(r, g, b),
    dispose: () => {
      title.dispose()
      const disposables = [geometry, material, frameGeometry, frameMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/**
 * 注目点で最も強め合っている波長（nm）。
 *
 * 強め合うのは光路差が波長の整数倍になる波長なので、その候補を次数ごとに求め、
 * 可視域に入っているもののうち、眼がいちばん明るく感じる（等色関数の Y が大きい）ものを選ぶ
 */
const findReinforcedWavelength = (opdNm: number) => {
  let best = 0
  let bestWeight = 0
  for (let order = 1; ; order++) {
    const nm = opdNm / order
    if (nm < VISIBLE_MIN_NM) break
    if (nm > VISIBLE_MAX_NM) continue
    const weight = colorMatching(nm)[1]
    if (weight > bestWeight) {
      bestWeight = weight
      best = nm
    }
  }
  return best
}

export const createCompactDiscDiffractionScene = ({
  scene,
  camera,
  renderer,
  params
}: ThreeSceneContext<CompactDiscDiffractionParams>) => {
  const { texture, colorAt } = buildDiffractionColors()

  // ディスク。傾きはこのグループの回転で与える（注目点の印も一緒に傾く）
  const disc = new Group()
  scene.add(disc)

  const discGeometry = new RingGeometry(HOLE_RADIUS, DISC_RADIUS, DISC_SEGMENTS, 1)
  // 回折で決まった色をそのまま画面に出したいので、ライトも陰影も使わない
  const discMaterial = new ShaderMaterial({
    uniforms: {
      uDiffractionColor: { value: texture },
      uLightDirection: { value: new Vector3() },
      uPitchNm: { value: params.pitchNm }
    },
    vertexShader,
    fragmentShader
  })
  disc.add(new Mesh(discGeometry, discMaterial))

  // 注目点の輪。記録面から少し浮かせて、面と重なってちらつくのを防ぐ
  const markerGeometry = new RingGeometry(MARKER_INNER_RADIUS, MARKER_OUTER_RADIUS, 32)
  const markerMaterial = new MeshBasicMaterial({ color: MARKER_COLOR, side: DoubleSide })
  const marker = new Mesh(markerGeometry, markerMaterial)
  marker.position.set(MARKED_LOCAL.x, MARKED_LOCAL.y, MARKER_LIFT)
  disc.add(marker)

  // 解説パネルはカメラの子にする。視点を動かしても画面上の位置が変わらず、図が歪まない。
  // カメラの子を描くにはカメラ自身がシーングラフに載っている必要がある
  const panel = new Group()
  camera.add(panel)
  scene.add(camera)

  // カメラの向きは変えず、視錐台だけを右と上へずらす。
  // ディスク（視点を回す中心）が画面の左上に寄り、右が拡大断面、下がグラフの場所になる。
  // 縦横は切り取らないので、視野の広さも図の歪みも変わらない
  camera.setViewOffset(1, 1, VIEW_SHIFT, VIEW_SHIFT_Y, 1, 1)

  const diagram = createPitDiagram()
  const graph = createSpectrumGraph()
  const swatch = createResultSwatch()
  panel.add(diagram.group, graph.group, swatch.group)

  // 注目点と拡大断面を結ぶ引き出し線。ディスクに隠れないよう、常に手前に描く
  const leaderPosition = new Float32BufferAttribute(new Float32Array(2 * 3), 3)
  const leaderGeometry = new BufferGeometry().setAttribute("position", leaderPosition)
  const leaderMaterial = new LineBasicMaterial({ color: FRAME_COLOR, depthTest: false })
  const leader = new Line(leaderGeometry, leaderMaterial)
  leader.renderOrder = 1
  panel.add(leader)

  // 毎フレーム使い回す作業用のベクトル
  const lightDirection = new Vector3()
  const markedPoint = new Vector3()
  const radial = new Vector3()
  const normal = new Vector3()
  const toEye = new Vector3()
  const markerInView = new Vector3()
  const viewportSize = new Vector2()

  return {
    update: () => {
      disc.rotation.x = MathUtils.degToRad(params.tiltDeg)

      // 光を当てる向き。横（視点から見て右）から差す光で、ディスクではなく空間に
      // 固定した向きなので、傾けると記録面に対する角度が変わる
      const lightAngle = MathUtils.degToRad(params.lightAngleDeg)
      lightDirection.set(Math.sin(lightAngle), 0, Math.cos(lightAngle))
      discMaterial.uniforms.uLightDirection.value.copy(lightDirection)

      const { pitchNm } = params
      discMaterial.uniforms.uPitchNm.value = pitchNm

      disc.updateMatrixWorld()
      camera.updateMatrixWorld()

      // 注目点での、溝が並ぶ向き（半径方向）と面の法線
      markedPoint.copy(MARKED_LOCAL).applyMatrix4(disc.matrixWorld)
      radial.copy(RADIAL_LOCAL).transformDirection(disc.matrixWorld)
      normal.copy(NORMAL_LOCAL).transformDirection(disc.matrixWorld)
      toEye.copy(camera.position).sub(markedPoint).normalize()

      // 隣のピットまでの道のりの差。半径方向へ射影した分だけが差になる
      const radialLight = radial.dot(lightDirection)
      const radialEye = radial.dot(toEye)
      const opdNm = Math.abs(pitchNm * (radialEye + radialLight))

      // 断面に描く角度。法線から測り、符号が法線のどちら側かを表す。
      // 溝の向きと法線の 2 成分だけを使うので、断面の平面へ射影した見かけの角度になる
      const [incidentRad, diffractedRad] = layoutAngles(
        Math.atan2(radialLight, Math.max(normal.dot(lightDirection), 0.001)),
        Math.atan2(radialEye, Math.max(normal.dot(toEye), 0.001))
      )
      diagram.setState(incidentRad, diffractedRad, pitchNm)
      graph.setOpticalPathDifference(opdNm)
      swatch.setColor(colorAt(opdNm))

      params.opticalPathDifference = `${opdNm.toFixed(0)} nm`
      const reinforced = findReinforcedWavelength(opdNm)
      if (opdNm < SPECULAR_OPD_NM) {
        // 道のりの差がほとんど無いので、どの波長も揃って強め合う（正反射のつや）
        params.reinforcedWavelength = "すべて（白）"
      } else {
        params.reinforcedWavelength =
          reinforced > 0 ? `${reinforced.toFixed(0)} nm` : "なし（暗い）"
      }

      // 光線の太さはピクセル指定なので、canvas の実寸をマテリアルへ渡す（リサイズにも追従する）
      renderer.getSize(viewportSize)
      diagram.setResolution(viewportSize.x, viewportSize.y)

      // パネルの各要素を画面の端に合わせて置く。canvas の縦横比が変わっても端から一定の余白を保つ。
      // 視錐台を右へずらしてあるので、画面に映る範囲もそのぶん右へ寄っている
      const halfHeight = Math.tan(MathUtils.degToRad(camera.fov / 2)) * PANEL_DISTANCE
      const halfWidth = halfHeight * camera.aspect
      const rightEdge = halfWidth + VIEW_SHIFT * 2 * halfWidth
      const bottomEdge = -halfHeight - VIEW_SHIFT_Y * 2 * halfHeight
      const diagramX = rightEdge - DIAGRAM_RIGHT_MARGIN
      diagram.group.position.set(diagramX, DIAGRAM_CENTER_Y, -PANEL_DISTANCE)
      // グラフは原点が描画領域の左下。下端からは目盛りの数値ぶんと余白ぶんだけ持ち上げ、
      // 左端（塗りの始まり）はディスクの左端にそろえる
      const graphBaseline = bottomEdge + GRAPH_BOTTOM_GAP + GRAPH_BELOW_ZONE
      graph.group.position.set(-DISC_APPARENT_RADIUS, graphBaseline, -PANEL_DISTANCE)
      // 小片は、中央を拡大断面の法線（真ん中のピット）に、下端をグラフの塗りの下端にそろえる
      swatch.group.position.set(diagramX - SWATCH_SIZE / 2, graphBaseline, -PANEL_DISTANCE)

      // 引き出し線は、記録面上の注目点から拡大断面の左端まで引く
      markerInView.copy(markedPoint)
      camera.worldToLocal(markerInView)
      leaderPosition.setXYZ(0, markerInView.x, markerInView.y, markerInView.z)
      leaderPosition.setXYZ(
        1,
        diagramX - DIAGRAM_HALF_WIDTH * DIAGRAM_SCALE,
        DIAGRAM_CENTER_Y,
        -PANEL_DISTANCE
      )
      leaderPosition.needsUpdate = true
    },
    dispose: () => {
      camera.remove(panel)
      camera.clearViewOffset()
      diagram.dispose()
      graph.dispose()
      swatch.dispose()
      const disposables = [
        discGeometry,
        discMaterial,
        texture,
        markerGeometry,
        markerMaterial,
        leaderGeometry,
        leaderMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
