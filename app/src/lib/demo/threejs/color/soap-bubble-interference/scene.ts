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
  SphereGeometry,
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
  desaturateToGamut,
  colorMatching,
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
export type SoapBubbleInterferenceParams = {
  /** 膜の厚み（nm）。むらを掛ける前の基準値 */
  thicknessNm: number
  /** 厚みのむら。`0` で膜全体が同じ厚みになり、上げるほど上が薄く下が厚い分布に近づく */
  unevenness: number
  /** 注目点での光路差。scene.ts が計算して書き戻す表示用の値 */
  opticalPathDifference: string
  /** 注目点でいちばん強め合っている波長。scene.ts が計算して書き戻す表示用の値 */
  reinforcedWavelength: string
}

/** 膜の厚みとして選べる範囲（nm）。パネルの上限・下限もこれに合わせる */
export const MIN_THICKNESS_NM = 80
export const MAX_THICKNESS_NM = 800

/** シャボン膜（石けん水）の屈折率 */
const FILM_IOR = 1.33

/**
 * 厚みのむらの強さ。
 * `DRAIN` は重力で下に溜まるぶんの偏り（上ほど薄い）、`SWIRL` は面内のゆるやかなゆらぎ。
 * 乱数を使わず固定の式にしてあるので、操作しても模様の形は変わらない
 */
const DRAIN_STRENGTH = 0.55
const SWIRL_STRENGTH = 0.18

/** むらを最大にしたとき、厚みが基準値の何倍まで増えるか */
const MAX_THICKNESS_FACTOR = 1 + DRAIN_STRENGTH + SWIRL_STRENGTH

/** 色を引く表（LUT）が覆う光路差の範囲（nm）と、その分割数 */
const MAX_OPD_NM = 2 * FILM_IOR * MAX_THICKNESS_NM * MAX_THICKNESS_FACTOR
const LUT_SIZE = 1024

/** 球（シャボン玉）の半径。シーンの寸法はすべてこれを基準にしている */
const SPHERE_RADIUS = 1

/** 球の分割数。色は画素ごとに求めるので、輪郭が滑らかに見える程度あればよい */
const SPHERE_SEGMENTS = 96
const SPHERE_RINGS = 64

/**
 * 注目点。球面に固定した 1 点で、ここに届く光を拡大断面とスペクトルの帯で分解して見せる。
 * 視点を回すとこの点を見る角度が変わるので、断面の光路も帯も色も一緒に変わる
 */
const MARKED_POINT = new Vector3(0.45, 0.35, 0.82).normalize()

/** 注目点に置く輪の大きさと、球面から浮かせる量（面と重なってちらつくのを防ぐ） */
const MARKER_INNER_RADIUS = 0.055
const MARKER_OUTER_RADIUS = 0.075
const MARKER_LIFT = 1.01

/**
 * 解説パネル（拡大断面・スペクトルの帯）を置く奥行き。
 *
 * パネルはカメラの子にして視点を回しても画面上の位置が動かないようにする。
 * カメラからこの距離の平面は、傾きのない正面の平面なので、そこに置いた図は歪まない。
 * 球の中心までの距離と同じにして、球と同じ縮尺で並ぶようにする
 */
const PANEL_DISTANCE = 5.2

/**
 * 解説パネルを置く平面での、球の見かけの半径。
 * 輪郭は球の中心を通る断面ではなく、少し手前にある円として映るので、半径そのものより大きくなる
 */
const SPHERE_APPARENT_RADIUS =
  SPHERE_RADIUS / Math.sqrt(1 - (SPHERE_RADIUS / PANEL_DISTANCE) ** 2)

/**
 * 視錐台を横へずらす量（画面の幅に対する割合）。
 *
 * 球は視点を回す中心なので、そのままでは必ず画面の中央に来る。カメラの向きを変えずに
 * 視錐台だけを右へずらすことで、球を左に、解説パネルを右に置く場所を作る
 */
const VIEW_SHIFT = 0.2

/**
 * 視錐台を縦へずらす量（画面の高さに対する割合）。
 * 球が上に寄り、下に置くグラフとの間、およびグラフと画面の下端との間に余白ができる
 */
const VIEW_SHIFT_Y = 0.11

/** 拡大断面を画面の右端から離す量と、その中心の高さ */
const DIAGRAM_RIGHT_MARGIN = 1.95
const DIAGRAM_CENTER_Y = -0.1

/**
 * 拡大断面の表示倍率。狭い画面でも図が読めるよう、球と同じくらいの大きさまで拡大する。
 * ラベルも一緒に拡大されるので、文字の読みやすさもこの値で決まる
 */
const DIAGRAM_SCALE = 1.5

/** 拡大断面の寸法（ローカル座標。膜の上面が y = 0、光の入射点が原点） */
const DIAGRAM_RAY_LENGTH = 0.6
const DIAGRAM_FILM_HALF_WIDTH = 0.78
const DIAGRAM_MIN_FILM_THICKNESS = 0.09
const DIAGRAM_MAX_FILM_THICKNESS = 0.26
const DIAGRAM_NORMAL_TOP = 0.56
const DIAGRAM_NORMAL_BOTTOM_GAP = 0.06

/**
 * 断面に描く角度の下限（度）。
 * 真正面から見た点では 2 本の反射光が完全に重なって図が潰れるので、
 * 断面だけはここで止める（色・光路差の計算には実際の角度を使う）
 */
const DIAGRAM_MIN_ANGLE_DEG = 8

/** ラベルが断面からはみ出さないよう、横位置を止める値 */
const DIAGRAM_MAX_LABEL_X = 1.15

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
const ARROW_RADIUS = 0.028
const ARROW_HEIGHT = 0.09
const ARROW_ALONG = 0.55

// 記事の SVG 図解と同じ役割分担で色を決める（--canvas-pen-* の値をリテラルで踏襲）。
// 背景（暗めのニュートラルグレー）の上でいずれも判別できる
const INCIDENT_COLOR = "#e8e8ee"
const OUTER_REFLECTION_COLOR = "#f6ce46"
const INNER_REFLECTION_COLOR = "#7fbcf0"
const FILM_COLOR = "#7d9cc9"
const NORMAL_COLOR = "#bfbfbf"
const FRAME_COLOR = "#8a8a92"
// グラフの曲線。色のついた塗りの上でも輪郭が追えるよう、明るい無彩色にする
const CURVE_COLOR = "#dcdce2"

/** 膜（半透明の塗り）の不透明度 */
const FILM_OPACITY = 0.25

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

/**
 * 場所ごとの厚みの倍率。重力で下に溜まるぶんと、面内のゆらぎを重ねる。
 *
 * **同じ式をフラグメントシェーダ側にも書いてある**（`thicknessFactor`）。
 * 球面の色は画素ごとにシェーダで、注目点の光路差はここで求めるので、どちらかを変えたら両方直す
 */
const thicknessFactorAt = (point: Vector3, unevenness: number) => {
  const drain = DRAIN_STRENGTH * -point.y
  const swirl = SWIRL_STRENGTH * Math.sin(3 * point.x + 2 * point.y) * Math.cos(2.5 * point.z)
  return 1 + unevenness * (drain + swirl)
}

/**
 * 光路差が `opdNm` のときに、波長 `nm` の光がどれだけ強め合うか（`0`〜`1`）。
 *
 * 外側の面（空気→膜）での反射では波の位相が半波長ぶんずれ、内側の面（膜→空気）ではずれない。
 * そのため、光路差が `0` に近いほど 2 つの反射光は打ち消し合って暗くなる。
 */
const interferenceIntensity = (opdNm: number, nm: number) => {
  const amplitude = Math.sin((Math.PI * opdNm) / nm)
  return amplitude * amplitude
}

/** 数値を GLSL の float リテラルとして埋め込む（`1` のような整数表記は型が合わない） */
const glslFloat = (value: number) => value.toFixed(4)

/**
 * 光路差ごとの色。白色光（すべての波長が同じ強さ）が膜で干渉した結果の色が並ぶ。
 *
 * 画素ごとに可視域を積分するのは重いので、光路差を刻んで色を先に求めておく。
 * 球面はこれをテクスチャとして引き、注目点の色は同じ表から直接読む
 */
const buildInterferenceColors = () => {
  const linear = Array.from({ length: LUT_SIZE }, (_, i) => {
    const opdNm = (i / (LUT_SIZE - 1)) * MAX_OPD_NM
    return desaturateToGamut(
      xyzToLinearSrgb(spectrumToXyz((nm) => interferenceIntensity(opdNm, nm)))
    )
  })

  // どの波長も元の白色光より強くはならないので、そのままでは全体が暗く沈む。
  // いちばん明るい成分が 1 になるよう一律に引き伸ばし、暗い色との明暗差は保つ
  const peak = Math.max(...linear.flat())
  const normalized = linear.map(
    ([r, g, b]): Tristimulus => [r / peak, g / peak, b / peak]
  )

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
  const colorAt = (opdNm: number) => {
    const index = Math.round(MathUtils.clamp(opdNm / MAX_OPD_NM, 0, 1) * (LUT_SIZE - 1))
    return normalized[index]
  }

  return { texture, colorAt }
}

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vToEye;
  varying vec3 vLocalPosition;

  void main() {
    // 厚みのむらは球に貼り付いた模様なので、回転しても動かないローカル座標で決める
    vLocalPosition = position;
    vNormal = normalize(normalMatrix * normal);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    // 視点座標系ではカメラが原点にいるので、面から視点へ向かうベクトルはこれで求まる
    vToEye = -viewPosition.xyz;

    gl_Position = projectionMatrix * viewPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uInterferenceColor;
  uniform float uThicknessNm;
  uniform float uUnevenness;

  varying vec3 vNormal;
  varying vec3 vToEye;
  varying vec3 vLocalPosition;

  // 場所ごとの厚みの倍率。TypeScript 側の thicknessFactorAt と同じ式にしてある
  float thicknessFactor(vec3 localPosition) {
    float drain = ${glslFloat(DRAIN_STRENGTH)} * -localPosition.y;
    float swirl = ${glslFloat(SWIRL_STRENGTH)} *
      sin(3.0 * localPosition.x + 2.0 * localPosition.y) * cos(2.5 * localPosition.z);
    return 1.0 + uUnevenness * (drain + swirl);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 toEye = normalize(vToEye);

    // 膜に入るときの角度（法線から測る）。膜の中では屈折して角度が浅くなる
    float cosIncidence = abs(dot(normal, toEye));
    float sinIncidence = sqrt(max(0.0, 1.0 - cosIncidence * cosIncidence));
    float sinRefraction = sinIncidence / ${glslFloat(FILM_IOR)};
    float cosRefraction = sqrt(max(0.0, 1.0 - sinRefraction * sinRefraction));

    // 内側の面で反射した光は、膜の中を往復するぶんだけ余計に進む（＝光路差）。
    // 斜めから見るほど膜の中を斜めに横切るので、同じ厚みでも光路差が変わる
    float thickness = uThicknessNm * thicknessFactor(vLocalPosition);
    float opd = 2.0 * ${glslFloat(FILM_IOR)} * thickness * cosRefraction;

    float lookup = clamp(opd / ${glslFloat(MAX_OPD_NM)}, 0.0, 1.0);
    gl_FragColor = vec4(texture2D(uInterferenceColor, vec2(lookup, 0.5)).rgb, 1.0);
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
 * 注目点の膜を厚み方向に大きく拡大した断面。
 *
 * 白色光が 1 本入り、外側の面で跳ね返る光と、膜を通り抜けて内側の面で跳ね返る光に分かれる。
 * 2 本は平行になって視点へ向かい、そこで重なり合う。
 * 実際の膜は数百 nm しかないので、厚みは何万倍にも誇張してある
 */
const createFilmDiagram = () => {
  const group = new Group()
  // 図の中身はすべてこの倍率で拡大される（線の太さだけはピクセル指定なので変わらない）
  group.scale.setScalar(DIAGRAM_SCALE)

  // 膜。半透明の塗りに上下の面の線を重ね、2 つの反射がどこで起きるかを見せる
  const filmGeometry = new PlaneGeometry(1, 1)
  const filmMaterial = new MeshBasicMaterial({
    color: FILM_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: FILM_OPACITY,
    depthWrite: false
  })
  const film = new Mesh(filmGeometry, filmMaterial)
  group.add(film)

  // 上面と下面の 2 本。反射が起きる境目をはっきりさせる
  const surfacePosition = new Float32BufferAttribute(new Float32Array(4 * 3), 3)
  const surfaceGeometry = new BufferGeometry().setAttribute("position", surfacePosition)
  const surfaceMaterial = new LineBasicMaterial({ color: FILM_COLOR })
  group.add(new LineSegments(surfaceGeometry, surfaceMaterial))

  // 法線。入射角がどこから測った角度かを示す
  const normalPosition = new Float32BufferAttribute(new Float32Array(2 * 3), 3)
  const normalGeometry = new BufferGeometry().setAttribute("position", normalPosition)
  const normalMaterial = new LineBasicMaterial({ color: NORMAL_COLOR })
  group.add(new Line(normalGeometry, normalMaterial))

  const incidentRay = createRayLines(1, INCIDENT_COLOR)
  const outerRay = createRayLines(1, OUTER_REFLECTION_COLOR)
  // 内側で反射する光は、膜へ入る・膜の中を往復する・膜から出る の 3 本に分かれる
  const innerRay = createRayLines(3, INNER_REFLECTION_COLOR)
  group.add(incidentRay.object, outerRay.object, innerRay.object)

  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const arrowMaterials = [INCIDENT_COLOR, OUTER_REFLECTION_COLOR, INNER_REFLECTION_COLOR].map(
    (color) => new MeshBasicMaterial({ color })
  )
  const arrows = arrowMaterials.map((material) => {
    const arrow = new Mesh(arrowGeometry, material)
    group.add(arrow)
    return arrow
  })

  // 入射する光には矢じりで向きが示されるので、ラベルは付けない
  // （反射光の 2 つのラベルと重なって読めなくなる）
  const labels = {
    outer: createLabel("外側の反射光", OUTER_REFLECTION_COLOR),
    inner: createLabel("内側の反射光", INNER_REFLECTION_COLOR),
    round: createLabel("膜の中を往復する分", FILM_COLOR)
  }
  const labelList = Object.values(labels)
  group.add(...labelList.map(({ sprite }) => sprite))

  /** ラベルが断面の外へ出ないよう、横位置だけ内側へ寄せる */
  const clampLabelX = (x: number, halfWidth: number) =>
    MathUtils.clamp(x, -DIAGRAM_MAX_LABEL_X + halfWidth, DIAGRAM_MAX_LABEL_X - halfWidth)

  /** 矢じりの向きを組み立てるのに使い回す */
  const arrowDirection = new Vector3()

  return {
    group,
    /**
     * 見る角度（法線から測ったラジアン）と、厚みの割合（`0`〜`1`）から描き直す。
     * 膜の中では屈折して角度が浅くなるので、往復する道のりは厚みと角度の両方で決まる
     */
    setState: (incidenceRad: number, thicknessRatio: number) => {
      const theta = Math.max(incidenceRad, MathUtils.degToRad(DIAGRAM_MIN_ANGLE_DEG))
      const sin = Math.sin(theta)
      const cos = Math.cos(theta)
      const filmThickness =
        DIAGRAM_MIN_FILM_THICKNESS +
        (DIAGRAM_MAX_FILM_THICKNESS - DIAGRAM_MIN_FILM_THICKNESS) * thicknessRatio

      const sinRefraction = sin / FILM_IOR
      const cosRefraction = Math.sqrt(Math.max(0, 1 - sinRefraction * sinRefraction))
      // 膜の底で反射した光が、上面へ戻ってくるまでに横へずれる量
      const shift = filmThickness * (sinRefraction / cosRefraction)

      film.scale.set(DIAGRAM_FILM_HALF_WIDTH * 2, filmThickness, 1)
      film.position.set(0, -filmThickness / 2, 0)

      surfacePosition.setXYZ(0, -DIAGRAM_FILM_HALF_WIDTH, 0, 0)
      surfacePosition.setXYZ(1, DIAGRAM_FILM_HALF_WIDTH, 0, 0)
      surfacePosition.setXYZ(2, DIAGRAM_FILM_HALF_WIDTH, -filmThickness, 0)
      surfacePosition.setXYZ(3, -DIAGRAM_FILM_HALF_WIDTH, -filmThickness, 0)
      surfacePosition.needsUpdate = true

      normalPosition.setXYZ(0, 0, -filmThickness - DIAGRAM_NORMAL_BOTTOM_GAP, 0)
      normalPosition.setXYZ(1, 0, DIAGRAM_NORMAL_TOP, 0)
      normalPosition.needsUpdate = true

      // 入射する白色光。左上から来て、膜の上面（原点）に当たる
      const incidentStartX = -sin * DIAGRAM_RAY_LENGTH
      const incidentStartY = cos * DIAGRAM_RAY_LENGTH
      incidentRay.setPoint(0, 0, incidentStartX, incidentStartY)
      incidentRay.setPoint(0, 1, 0, 0)
      incidentRay.commit()

      // 外側の面で跳ね返る光。入射角と同じ角度で右上へ出ていく
      const outerEndX = sin * DIAGRAM_RAY_LENGTH
      const outerEndY = cos * DIAGRAM_RAY_LENGTH
      outerRay.setPoint(0, 0, 0, 0)
      outerRay.setPoint(0, 1, outerEndX, outerEndY)
      outerRay.commit()

      // 膜を通り抜けて内側の面で跳ね返る光。往復したぶん右へずれた位置から出ていく
      innerRay.setPoint(0, 0, 0, 0)
      innerRay.setPoint(0, 1, shift, -filmThickness)
      innerRay.setPoint(1, 0, shift, -filmThickness)
      innerRay.setPoint(1, 1, shift * 2, 0)
      innerRay.setPoint(2, 0, shift * 2, 0)
      innerRay.setPoint(2, 1, shift * 2 + outerEndX, outerEndY)
      innerRay.commit()

      // 矢じりは光線の途中に置き、先端を進む向きへ合わせる
      const place = (arrow: Mesh, x: number, y: number, dirX: number, dirY: number) => {
        arrow.position.set(x, y, 0)
        arrow.quaternion.setFromUnitVectors(CONE_UP, arrowDirection.set(dirX, dirY, 0).normalize())
      }
      place(arrows[0], incidentStartX * (1 - ARROW_ALONG), incidentStartY * (1 - ARROW_ALONG), sin, -cos)
      place(arrows[1], outerEndX * ARROW_ALONG, outerEndY * ARROW_ALONG, sin, cos)
      place(arrows[2], shift * 2 + outerEndX * ARROW_ALONG, outerEndY * ARROW_ALONG, sin, cos)

      labels.outer.sprite.position.set(
        clampLabelX(outerEndX - labels.outer.halfWidth, labels.outer.halfWidth),
        outerEndY + LABEL_HEIGHT,
        0
      )
      labels.inner.sprite.position.set(
        clampLabelX(shift * 2 + outerEndX + labels.inner.halfWidth, labels.inner.halfWidth),
        outerEndY + LABEL_HEIGHT * 2.2,
        0
      )
      labels.round.sprite.position.set(0, -filmThickness - LABEL_HEIGHT * 1.6, 0)
    },
    setResolution: (width: number, height: number) => {
      incidentRay.setResolution(width, height)
      outerRay.setResolution(width, height)
      innerRay.setResolution(width, height)
    },
    dispose: () => {
      incidentRay.dispose()
      outerRay.dispose()
      innerRay.dispose()
      labelList.forEach((label) => label.dispose())
      arrowMaterials.forEach((material) => material.dispose())
      const disposables = [
        filmGeometry,
        filmMaterial,
        surfaceGeometry,
        surfaceMaterial,
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
 * 山になっている波長は 2 つの反射光が強め合っていて、谷（高さ 0）の波長は打ち消し合っている。
 * 山として残った波長を混ぜたものが、右の小片（＝注目点に見える色）になる。
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

  // 球面全体ではなく注目点 1 つぶんの分布なので、ラベルでその範囲をはっきりさせる。
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

/** 強め合った波長を混ぜた結果の色を出す小片。球面の注目点に出ている色と一致する */
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
 * 強め合うのは光路差が半波長の奇数倍になる波長なので、その候補を次数ごとに求め、
 * 可視域に入っているもののうち、眼がいちばん明るく感じる（等色関数の Y が大きい）ものを選ぶ
 */
const findReinforcedWavelength = (opdNm: number) => {
  let best = 0
  let bestWeight = 0
  for (let order = 0; ; order++) {
    const nm = opdNm / (order + 0.5)
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

export const createSoapBubbleInterferenceScene = ({
  scene,
  camera,
  renderer,
  params
}: ThreeSceneContext<SoapBubbleInterferenceParams>) => {
  const { texture, colorAt } = buildInterferenceColors()

  const sphereGeometry = new SphereGeometry(SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_RINGS)
  // 干渉で決まった色をそのまま画面に出したいので、ライトも陰影も使わない
  const sphereMaterial = new ShaderMaterial({
    uniforms: {
      uInterferenceColor: { value: texture },
      uThicknessNm: { value: params.thicknessNm },
      uUnevenness: { value: params.unevenness }
    },
    vertexShader,
    fragmentShader
  })
  scene.add(new Mesh(sphereGeometry, sphereMaterial))

  // 注目点の輪。球面から少し浮かせて、面と重なってちらつくのを防ぐ
  const markerGeometry = new RingGeometry(MARKER_INNER_RADIUS, MARKER_OUTER_RADIUS, 32)
  const markerMaterial = new MeshBasicMaterial({ color: INCIDENT_COLOR, side: DoubleSide })
  const marker = new Mesh(markerGeometry, markerMaterial)
  marker.position.copy(MARKED_POINT).multiplyScalar(MARKER_LIFT)
  marker.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), MARKED_POINT)
  scene.add(marker)

  // 解説パネルはカメラの子にする。視点を回しても画面上の位置が動かず、図が歪まない。
  // カメラの子を描くにはカメラ自身がシーングラフに載っている必要がある
  const panel = new Group()
  camera.add(panel)
  scene.add(camera)

  // カメラの向きは変えず、視錐台だけを右と上へずらす。
  // 球（視点を回す中心）が画面の左上に寄り、右が拡大断面、下がグラフの場所になる。
  // 縦横は切り取らないので、視野の広さも図の歪みも変わらない
  camera.setViewOffset(1, 1, VIEW_SHIFT, VIEW_SHIFT_Y, 1, 1)

  const diagram = createFilmDiagram()
  const graph = createSpectrumGraph()
  const swatch = createResultSwatch()
  panel.add(diagram.group, graph.group, swatch.group)

  // 注目点と拡大断面を結ぶ引き出し線。球に隠れないよう、常に手前に描く
  const leaderPosition = new Float32BufferAttribute(new Float32Array(2 * 3), 3)
  const leaderGeometry = new BufferGeometry().setAttribute("position", leaderPosition)
  const leaderMaterial = new LineBasicMaterial({ color: FRAME_COLOR, depthTest: false })
  const leader = new Line(leaderGeometry, leaderMaterial)
  leader.renderOrder = 1
  panel.add(leader)

  // 毎フレーム使い回す作業用のベクトル
  const toEye = new Vector3()
  const markerInView = new Vector3()
  const viewportSize = new Vector2()

  return {
    update: () => {
      const { thicknessNm, unevenness } = params
      sphereMaterial.uniforms.uThicknessNm.value = thicknessNm
      sphereMaterial.uniforms.uUnevenness.value = unevenness

      // 注目点を見る角度。球面上の点なので、法線はその点の位置ベクトルそのもの
      camera.updateMatrixWorld()
      toEye.copy(camera.position).sub(MARKED_POINT).normalize()
      const cosIncidence = MathUtils.clamp(toEye.dot(MARKED_POINT), 0.02, 1)
      const sinRefraction = Math.sqrt(Math.max(0, 1 - cosIncidence * cosIncidence)) / FILM_IOR
      const cosRefraction = Math.sqrt(Math.max(0, 1 - sinRefraction * sinRefraction))

      const thicknessAtPoint = thicknessNm * thicknessFactorAt(MARKED_POINT, unevenness)
      const opdNm = 2 * FILM_IOR * thicknessAtPoint * cosRefraction

      diagram.setState(
        Math.acos(cosIncidence),
        MathUtils.clamp(thicknessAtPoint / MAX_THICKNESS_NM, 0, 1)
      )
      graph.setOpticalPathDifference(opdNm)
      swatch.setColor(colorAt(opdNm))

      const reinforced = findReinforcedWavelength(opdNm)
      params.opticalPathDifference = `${opdNm.toFixed(0)} nm`
      params.reinforcedWavelength = reinforced > 0 ? `${reinforced.toFixed(0)} nm` : "なし（暗い）"

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
      // 左端（塗りの始まり）は球の左端にそろえる
      const graphBaseline = bottomEdge + GRAPH_BOTTOM_GAP + GRAPH_BELOW_ZONE
      graph.group.position.set(-SPHERE_APPARENT_RADIUS, graphBaseline, -PANEL_DISTANCE)
      // 小片は、中央を拡大断面の法線（光が膜に入る点）に、下端をグラフの塗りの下端にそろえる
      swatch.group.position.set(diagramX - SWATCH_SIZE / 2, graphBaseline, -PANEL_DISTANCE)

      // 引き出し線は、球面上の注目点から拡大断面の左端まで引く
      markerInView.copy(MARKED_POINT).multiplyScalar(MARKER_LIFT)
      camera.worldToLocal(markerInView)
      leaderPosition.setXYZ(0, markerInView.x, markerInView.y, markerInView.z)
      leaderPosition.setXYZ(
        1,
        diagram.group.position.x - DIAGRAM_FILM_HALF_WIDTH * DIAGRAM_SCALE,
        diagram.group.position.y,
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
        sphereGeometry,
        sphereMaterial,
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
