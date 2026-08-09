import {
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import type { ThreeSceneContext } from "$lib/demo/threejs/_shared/types"

/** Tweakpane で操作するパラメータ */
export type ReflectionSpreadParams = {
  /** 法線から測った入射角（度） */
  incidenceDeg: number
  /** 表面の粗さ。0 が鏡のような滑らかな面、1 が凹凸のあるマットな面 */
  roughness: number
  /** いまの状態が正反射か拡散反射か。scene.ts が計算して書き戻す表示用の値 */
  reflectionType: string
}

/** 反射面（水平な正方形）の 1 辺の長さ */
const SURFACE_SIZE = 4
const SURFACE_HALF = SURFACE_SIZE / 2

/** 格子線の本数（各方向 GRID_DIVISIONS + 1 本） */
const GRID_DIVISIONS = 24

/** 格子線 1 本を何分割して折れ線にするか。凹凸を滑らかな波として見せるための刻み */
const GRID_SAMPLES = 64

/** 半透明の面の分割数。凹凸に沿って縁が波打つようにする */
const SURFACE_SEGMENTS = 48

/** 粗さ 1 のときの凹凸の振幅 */
const BUMP_AMPLITUDE = 0.09

/** 光線の長さ（入射光・反射光で共通） */
const RAY_LENGTH = 1.25

/**
 * 反射点。面の中央寄りに散らし、平行に届いた光が面のあちこちで跳ね返る様子にする。
 * `phase` は光の散らばりの向きを点ごとにずらす値で、同じ形の光束が並ぶのを避ける。
 * 先頭の点だけは法線・入射角・反射角を描く主役なので、凹凸の高さが必ず 0 になる原点に置く。
 */
const REFLECTION_POINTS = [
  { x: 0, z: 0, phase: 0 },
  { x: -0.62, z: 0.4, phase: 1.1 },
  { x: 0.7, z: -0.28, phase: 2.3 }
]

/** 法線・入射角・反射角を描く点（反射点の並びの何番目か） */
const MAIN_POINT = 0

/** 入射光のラベルを付ける点。光束の外側になるよう、いちばん左の点を選ぶ */
const INCIDENT_LABEL_POINT = 1

/**
 * 1 つの反射点から描く反射光の本数。粗さ 0 では全本が鏡面反射の向きに重なり、1 本に見える。
 * 反射点が複数あるので、拡散側で線が増えすぎないよう 1 点あたりは少なくする
 */
const REFLECTED_RAYS_PER_POINT = 4

const REFLECTED_RAY_COUNT = REFLECTION_POINTS.length * REFLECTED_RAYS_PER_POINT

/**
 * 粗さ 1 のときの光束の開き角（度）。
 * 90 にすると面すれすれの光線が出て格子線と重なるので、少しだけ手前で止める
 */
const MAX_SPREAD_DEG = 85

/** 黄金角。乱数を使わずに、単位球面上へ方向を偏りなく散らすための刻み */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** 法線の長さ。光線より高く伸ばして、ラベルが光束に埋もれないようにする */
const NORMAL_LENGTH = 1.6

/** 入射角・反射角を表す弧の半径と分割数 */
const ARC_RADIUS = 0.42
const ARC_SEGMENTS = 40

/** 角度のラベルを角の二等分線上のどこに置くか */
const ANGLE_LABEL_RADIUS = 0.72

/**
 * 角度のラベルを法線から最低限離す距離。
 * 入射角が小さいと二等分線が法線に寄り、入射角と反射角のラベルが重なってしまう
 */
const MIN_ANGLE_LABEL_X = 0.4

/** 入射光のラベルを光線上のどこに置くか（0 が反射点、1 が光線の端） */
const RAY_LABEL_ALONG = 0.85

/** ラベルを、それが指す光線から垂直に離す距離 */
const RAY_LABEL_GAP = 0.22

/** 反射光のラベルを、光束の外側（鏡面反射の向きの先）に置くための距離 */
const REFLECTED_LABEL_GAP = 0.62
const REFLECTED_LABEL_SIDE_GAP = 0.12

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24

/** 法線のラベルの下端を、線の上端から離す距離 */
const NORMAL_LABEL_GAP = 0.06

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * 光線の太さ（ピクセル）。
 * 図の主役なので格子や弧より太くする。`LineBasicMaterial` の `linewidth` は WebGL では
 * 無視されて 1px になるため、光線だけは太さを指定できる Line2 系で描く
 */
const RAY_LINE_WIDTH = 2

/** 光線の進行方向を示す矢じりの大きさ。本数が多いので小さめにする */
const ARROW_RADIUS = 0.035
const ARROW_HEIGHT = 0.12

/** 入射光の矢じりを光線上のどこに置くか */
const INCIDENT_ARROW_ALONG = 0.55

/**
 * 反射角の表示が消えるまでの粗さ。
 * 拡散側では反射光の向きが定まらないので、粗さを上げると反射角の弧とラベルが薄れて消える
 */
const SPECULAR_FADE_END = 0.15

/** パネルに出す反射の種類。表示が消えるのと同じ境目で切り替える */
const SPECULAR_TYPE = "正反射"
const DIFFUSE_TYPE = "拡散反射"

/** 面の半透明な塗りの不透明度 */
const SURFACE_OPACITY = 0.2

/** 入射角・反射角を表す扇形の塗りの不透明度。記事の SVG 図解と同じ濃さにする */
const SECTOR_OPACITY = 0.32

// 記事の SVG 図解と同じ役割分担で色を決める（--canvas-pen-* の値をリテラルで踏襲）。
// 背景（暗めのニュートラルグレー）の上でいずれも判別できる
const INCIDENT_COLOR = "#ef8c00"
const REFLECTED_COLOR = "#f6ce46"
const NORMAL_COLOR = "#bfbfbf"
// 面（格子と半透明の塗り）は、光線・法線と役割が違うことがはっきりするよう青寄りのグレーにする
const SURFACE_COLOR = "#7d9cc9"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

const HALF_PI = Math.PI / 2

/**
 * 粗さ 1 のときの面の高さ。固定のサイン合成なので、同じ位置なら必ず同じ高さになる
 * （乱数だと操作のたびに凹凸の形が変わってチラつく）。
 * 主役の反射点である原点では必ず 0 になり、法線の根元が面から浮かない。
 */
const bumpHeight = (x: number, z: number) =>
  (BUMP_AMPLITUDE *
    (Math.sin(x * 11) * Math.cos(z * 9) + 0.6 * Math.sin(z * 13) * Math.cos(x * 7))) /
  1.6

/**
 * 文字を描いた canvas をテクスチャにして、常にカメラを向く板（Sprite）にする。
 * 文字の幅を測って板の横幅を決めるので、文字数の違うラベルでも字の大きさがそろう
 */
const createLabel = (text: string, color: string) => {
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
    // 文字のない透明な余白まで深度を書いてしまうと、あとから描かれる半透明の面や線が
    // ラベルの矩形の形に欠け、文字に黒い下敷きが付いたように見える
    depthWrite: false
  })
  const sprite = new Sprite(material)
  // 高さを指定の値に揃え、幅は canvas の縦横比から決める
  sprite.scale.set((LABEL_HEIGHT * canvas.width) / canvas.height, LABEL_HEIGHT, 1)

  return {
    sprite,
    material,
    dispose: () => {
      texture.dispose()
      material.dispose()
    }
  }
}

/**
 * 太さを指定できる光線の束。`count` 本の線分をまとめて 1 つのオブジェクトとして描く。
 *
 * 太さはピクセル単位で、そのために canvas の実寸をマテリアルへ渡す必要がある
 * （`setResolution`）。奥行きによらず画面上の太さが一定になるので、
 * 光線が四方に散っても手前と奥で見え方がぶれない。
 */
const createRayLines = (count: number, color: string) => {
  const positions = new Float32Array(count * 2 * 3)
  const geometry = new LineSegmentsGeometry()
  const material = new LineMaterial({ color, linewidth: RAY_LINE_WIDTH })

  return {
    object: new LineSegments2(geometry, material),
    /** segment 番目の線分の端点を書き込む（end は 0 が始点、1 が終点） */
    setPoint: (segment: number, end: number, x: number, y: number, z: number) => {
      const offset = (segment * 2 + end) * 3
      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = z
    },
    /** 書き込んだ座標をジオメトリへ反映する */
    commit: () => {
      geometry.setPositions(positions)
    },
    setResolution: (width: number, height: number) => {
      material.resolution.set(width, height)
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 角度を表す扇形。反射点と弧の分割点で三角形を敷き詰めた塗りに、外周の弧の線を重ねる。
 * 半径は固定で、開始角と終了角を毎フレーム書き換える
 */
const createSector = (color: string) => {
  // 塗りの頂点は「反射点 + 弧の分割点」。反射点（0 番）は原点のまま動かない
  const fillPosition = new Float32BufferAttribute(new Float32Array((ARC_SEGMENTS + 2) * 3), 3)
  const fillIndex: number[] = []
  for (let i = 0; i < ARC_SEGMENTS; i++) fillIndex.push(0, i + 1, i + 2)
  const fillGeometry = new BufferGeometry()
    .setAttribute("position", fillPosition)
    .setIndex(fillIndex)
  const fillMaterial = new MeshBasicMaterial({
    color,
    side: DoubleSide,
    transparent: true,
    opacity: SECTOR_OPACITY,
    // 塗りが奥の光線やラベルを隠さないよう深度は書かない
    depthWrite: false
  })

  // 外周の弧。塗りの縁をはっきりさせる
  const arcPosition = new Float32BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3)
  const arcGeometry = new BufferGeometry().setAttribute("position", arcPosition)
  const arcMaterial = new LineBasicMaterial({ color, transparent: true })

  const fill = new Mesh(fillGeometry, fillMaterial)
  const arc = new Line(arcGeometry, arcMaterial)

  return {
    objects: [fill, arc],
    /** xy 平面上に、from から to まで（いずれも +x 方向から測った角度）の扇形を描く */
    setSweep: (from: number, to: number) => {
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const angle = from + (to - from) * (i / ARC_SEGMENTS)
        const x = ARC_RADIUS * Math.cos(angle)
        const y = ARC_RADIUS * Math.sin(angle)
        fillPosition.setXYZ(i + 1, x, y, 0)
        arcPosition.setXYZ(i, x, y, 0)
      }
      fillPosition.needsUpdate = true
      arcPosition.needsUpdate = true
    },
    setOpacity: (opacity: number) => {
      fillMaterial.opacity = SECTOR_OPACITY * opacity
      arcMaterial.opacity = opacity
      fill.visible = opacity > 0
      arc.visible = opacity > 0
    },
    dispose: () => {
      const disposables = [fillGeometry, fillMaterial, arcGeometry, arcMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 面（半透明の塗りと格子線）。粗さに比例して各頂点の高さを上下させる */
const createSurface = () => {
  // 塗りは水平に寝かせた平面。rotateX で回転を頂点に焼き込み、以降は y をそのまま高さとして扱える
  const fillGeometry = new PlaneGeometry(
    SURFACE_SIZE,
    SURFACE_SIZE,
    SURFACE_SEGMENTS,
    SURFACE_SEGMENTS
  ).rotateX(-HALF_PI)
  const fillPosition = fillGeometry.getAttribute("position")
  const fillBase = new Float32Array(fillPosition.count)
  for (let i = 0; i < fillPosition.count; i++) {
    fillBase[i] = bumpHeight(fillPosition.getX(i), fillPosition.getZ(i))
  }
  const fillMaterial = new MeshBasicMaterial({
    color: SURFACE_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: SURFACE_OPACITY,
    // 塗りが奥の光線や格子線を隠さないよう深度は書かない
    depthWrite: false
  })

  // 格子線。ライトを使わない図なので、面の凹凸はこの線の高さの変化で読ませる。
  // 波を滑らかに見せるため、1 本の線を GRID_SAMPLES 個の線分に分けて折れ線にする
  const points: number[] = []
  const gridBase: number[] = []
  for (let axis = 0; axis < 2; axis++) {
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const fixed = -SURFACE_HALF + (i * SURFACE_SIZE) / GRID_DIVISIONS
      for (let s = 0; s < GRID_SAMPLES; s++) {
        for (const step of [s, s + 1]) {
          const along = -SURFACE_HALF + (step * SURFACE_SIZE) / GRID_SAMPLES
          const x = axis === 0 ? along : fixed
          const z = axis === 0 ? fixed : along
          points.push(x, 0, z)
          gridBase.push(bumpHeight(x, z))
        }
      }
    }
  }
  const gridPosition = new Float32BufferAttribute(new Float32Array(points), 3)
  const gridGeometry = new BufferGeometry().setAttribute("position", gridPosition)
  const gridMaterial = new LineBasicMaterial({ color: SURFACE_COLOR })

  return {
    objects: [new Mesh(fillGeometry, fillMaterial), new LineSegments(gridGeometry, gridMaterial)],
    /** 高さは粗さに比例するので、粗さ 1 での高さに掛けるだけでよい */
    setRoughness: (roughness: number) => {
      for (let i = 0; i < fillBase.length; i++) fillPosition.setY(i, fillBase[i] * roughness)
      fillPosition.needsUpdate = true
      for (let i = 0; i < gridBase.length; i++) gridPosition.setY(i, gridBase[i] * roughness)
      gridPosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [fillGeometry, fillMaterial, gridGeometry, gridMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createReflectionSpreadScene = ({
  scene,
  renderer,
  params
}: ThreeSceneContext<ReflectionSpreadParams>) => {
  const surface = createSurface()
  scene.add(...surface.objects)

  // 法線・入射角・反射角は、反射点をひとつ選んでそこにだけ描く（すべての点に描くと図が埋まる）。
  // まとめて 1 つの Group に入れ、その点の位置へ移動させる
  const annotations = new Group()
  scene.add(annotations)

  // 法線。反射点から面に垂直に立てる
  const normalGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(0, NORMAL_LENGTH, 0)
  ])
  const normalMaterial = new LineBasicMaterial({ color: NORMAL_COLOR, transparent: true })
  const normalLine = new Line(normalGeometry, normalMaterial)
  annotations.add(normalLine)

  // 入射光。平行に届いた光が、それぞれの反射点に当たる
  const incidentRays = createRayLines(REFLECTION_POINTS.length, INCIDENT_COLOR)
  scene.add(incidentRays.object)

  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const incidentArrowMaterial = new MeshBasicMaterial({ color: INCIDENT_COLOR })
  const incidentArrows = REFLECTION_POINTS.map(() => {
    const arrow = new Mesh(arrowGeometry, incidentArrowMaterial)
    scene.add(arrow)
    return arrow
  })

  // 反射光。粗さ 0 では全本が鏡面反射の向きに重なるので、見た目には 1 本になる
  const reflectedRays = createRayLines(REFLECTED_RAY_COUNT, REFLECTED_COLOR)
  scene.add(reflectedRays.object)

  const reflectedArrowMaterial = new MeshBasicMaterial({ color: REFLECTED_COLOR })
  const reflectedArrows = new Group()
  const arrows = Array.from({ length: REFLECTED_RAY_COUNT }, () => {
    const arrow = new Mesh(arrowGeometry, reflectedArrowMaterial)
    reflectedArrows.add(arrow)
    return arrow
  })
  scene.add(reflectedArrows)

  const incidentSector = createSector(INCIDENT_COLOR)
  const reflectedSector = createSector(REFLECTED_COLOR)
  annotations.add(...incidentSector.objects, ...reflectedSector.objects)

  const incidentLabel = createLabel("入射光", INCIDENT_COLOR)
  const reflectedLabel = createLabel("反射光", REFLECTED_COLOR)
  const normalLabel = createLabel("法線", NORMAL_COLOR)
  const incidentAngleLabel = createLabel("入射角", INCIDENT_COLOR)
  const reflectedAngleLabel = createLabel("反射角", REFLECTED_COLOR)
  const labels = [
    incidentLabel,
    reflectedLabel,
    normalLabel,
    incidentAngleLabel,
    reflectedAngleLabel
  ]
  // 入射光のラベルだけは主役以外の点に付くので、Group ではなくシーンに直接置く
  scene.add(incidentLabel.sprite)
  annotations.add(
    reflectedLabel.sprite,
    normalLabel.sprite,
    incidentAngleLabel.sprite,
    reflectedAngleLabel.sprite
  )

  // 法線のラベルだけは入射角にも粗さにも動かされない。
  // 線の真上に、文字の下端が線の上端に触れない高さで置く
  normalLabel.sprite.position.set(0, NORMAL_LENGTH + LABEL_HEIGHT / 2 + NORMAL_LABEL_GAP, 0)

  // 反射点の高さも粗さに比例するので、粗さ 1 での高さを先に求めておく
  const pointBaseHeights = REFLECTION_POINTS.map(({ x, z }) => bumpHeight(x, z))

  // 毎フレーム使い回す作業用のベクトル・クォータニオン
  const direction = new Vector3()
  const offset = new Vector3()
  const axis = new Vector3()
  const axisRotation = new Quaternion()
  const viewportSize = new Vector2()

  /** 面の高さの更新は粗さが変わったときだけでよい（頂点数が多いので毎フレームは回さない） */
  let appliedRoughness = Number.NaN

  /**
   * 角度のラベルを角の二等分線上に置く。
   * 入射角が小さいと 2 つのラベルが法線の上で重なるので、左右へ最低限だけ引き離す
   */
  const placeAngleLabel = (sprite: Sprite, bisector: number, side: number) => {
    const x = ANGLE_LABEL_RADIUS * Math.cos(bisector)
    sprite.position.set(
      side * Math.max(Math.abs(x), MIN_ANGLE_LABEL_X),
      ANGLE_LABEL_RADIUS * Math.sin(bisector),
      0
    )
  }

  return {
    update: () => {
      const { roughness } = params
      const theta = MathUtils.degToRad(params.incidenceDeg)
      const sin = Math.sin(theta)
      const cos = Math.cos(theta)

      if (roughness !== appliedRoughness) {
        appliedRoughness = roughness
        surface.setRoughness(roughness)
      }

      // 法線と角度の表示は、主役の反射点に乗せたまま凹凸と一緒に上下する
      const main = REFLECTION_POINTS[MAIN_POINT]
      annotations.position.set(main.x, pointBaseHeights[MAIN_POINT] * roughness, main.z)

      // 光線の太さはピクセル指定なので、canvas の実寸をマテリアルへ渡す（リサイズにも追従する）
      renderer.getSize(viewportSize)
      incidentRays.setResolution(viewportSize.x, viewportSize.y)
      reflectedRays.setResolution(viewportSize.x, viewportSize.y)

      // 粗さが上がるほど、光束の中心は鏡面反射の向きから法線の向きへ寄り、開き角が広がる。
      // 粗さ 1 では法線を軸にした半球いっぱい（あらゆる方向）になる。
      // 中心と開き角を同時に動かすことで、どの入射角でも光線が面の下へ潜らない
      const axisAngle = theta * (1 - roughness)
      axis.set(Math.sin(axisAngle), Math.cos(axisAngle), 0)
      axisRotation.setFromUnitVectors(CONE_UP, axis)

      const spread = MathUtils.degToRad(MAX_SPREAD_DEG * roughness)
      const cosSpread = Math.cos(spread)

      REFLECTION_POINTS.forEach(({ x, z, phase }, p) => {
        // 反射点は凹凸の上に乗る。粗さ 0 の平らな面ではすべて高さ 0 に戻る
        const y = pointBaseHeights[p] * roughness

        // 入射光は左上から来て反射点に当たる。どの点へも同じ角度で平行に届く
        incidentRays.setPoint(p, 0, x - RAY_LENGTH * sin, y + RAY_LENGTH * cos, z)
        incidentRays.setPoint(p, 1, x, y, z)

        direction.set(sin, -cos, 0)
        incidentArrows[p].position
          .set(x - RAY_LENGTH * sin, y + RAY_LENGTH * cos, z)
          .addScaledVector(direction, RAY_LENGTH * INCIDENT_ARROW_ALONG)
        incidentArrows[p].quaternion.setFromUnitVectors(CONE_UP, direction)

        for (let i = 0; i < REFLECTED_RAYS_PER_POINT; i++) {
          // 開き角の内側を偏りなく埋める。cosSpread が 1（開き角 0）なら全方向が軸に重なる
          const t = (i + 0.5) / REFLECTED_RAYS_PER_POINT
          const cosAlpha = 1 - t * (1 - cosSpread)
          const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha))
          // 黄金角に点ごとの位相を足し、同じ形の光束が並んで見えないようにする
          const phi = i * GOLDEN_ANGLE + phase
          direction
            .set(sinAlpha * Math.cos(phi), cosAlpha, sinAlpha * Math.sin(phi))
            .applyQuaternion(axisRotation)

          const ray = p * REFLECTED_RAYS_PER_POINT + i
          reflectedRays.setPoint(ray, 0, x, y, z)
          reflectedRays.setPoint(
            ray,
            1,
            x + direction.x * RAY_LENGTH,
            y + direction.y * RAY_LENGTH,
            z + direction.z * RAY_LENGTH
          )

          // 矢じりの先端が光線の端に来るよう、円錐の高さの半分だけ内側に置く
          arrows[ray].position
            .copy(direction)
            .multiplyScalar(RAY_LENGTH - ARROW_HEIGHT / 2)
            .add(offset.set(x, y, z))
          arrows[ray].quaternion.setFromUnitVectors(CONE_UP, direction)
        }
      })
      incidentRays.commit()
      reflectedRays.commit()

      // 入射角・反射角は、どちらも法線（+y 方向）から測る
      incidentSector.setSweep(HALF_PI, HALF_PI + theta)
      reflectedSector.setSweep(HALF_PI, HALF_PI - theta)

      // 拡散側では反射光の向きが定まらず、入射角と反射角が等しいという関係も成り立たなくなる。
      // 粗さを上げると、その関係を示していた法線・入射角・反射角の表示がまとめて消える
      const specularOpacity = MathUtils.clamp(1 - roughness / SPECULAR_FADE_END, 0, 1)
      const specularVisible = specularOpacity > 0
      // パネルの表示も同じ境目で切り替え、図と食い違わないようにする
      params.reflectionType = specularVisible ? SPECULAR_TYPE : DIFFUSE_TYPE
      incidentSector.setOpacity(specularOpacity)
      reflectedSector.setOpacity(specularOpacity)
      normalMaterial.opacity = specularOpacity
      normalLine.visible = specularVisible
      const fadedLabels = [normalLabel, incidentAngleLabel, reflectedAngleLabel]
      fadedLabels.forEach((label) => {
        label.material.opacity = specularOpacity
        label.sprite.visible = specularVisible
      })

      // 入射光のラベルは、いちばん左の光線をはさんで法線と反対側（面寄り）に置く
      const labeled = REFLECTION_POINTS[INCIDENT_LABEL_POINT]
      incidentLabel.sprite.position
        .set(-sin, cos, 0)
        .multiplyScalar(RAY_LENGTH * RAY_LABEL_ALONG)
        .addScaledVector(offset.set(-cos, -sin, 0), RAY_LABEL_GAP)
        .add(offset.set(labeled.x, pointBaseHeights[INCIDENT_LABEL_POINT] * roughness, labeled.z))

      // 反射光のラベルは、広がった光束の外側になるよう鏡面反射の向きの先に置く
      reflectedLabel.sprite.position
        .set(sin, cos, 0)
        .multiplyScalar(RAY_LENGTH + REFLECTED_LABEL_GAP)
        .addScaledVector(offset.set(cos, -sin, 0), REFLECTED_LABEL_SIDE_GAP)

      placeAngleLabel(incidentAngleLabel.sprite, HALF_PI + theta / 2, -1)
      placeAngleLabel(reflectedAngleLabel.sprite, HALF_PI - theta / 2, 1)
    },
    dispose: () => {
      surface.dispose()
      incidentSector.dispose()
      reflectedSector.dispose()
      incidentRays.dispose()
      reflectedRays.dispose()
      labels.forEach((label) => label.dispose())
      const disposables = [
        normalGeometry,
        normalMaterial,
        arrowGeometry,
        incidentArrowMaterial,
        reflectedArrowMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
