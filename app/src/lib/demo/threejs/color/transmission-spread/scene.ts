import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
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
export type TransmissionSpreadParams = {
  /** 板の法線から測った入射角（度） */
  incidenceDeg: number
  /** 表面の粗さ。0 が滑らかな透明のガラス、1 が凹凸のあるすりガラス */
  roughness: number
  /** いまの状態が正透過か拡散透過か。scene.ts が計算して書き戻す表示用の値 */
  transmissionType: string
}

/** 板ガラスの寸法。厚みは、中の光路が見え、かつ入射点が上へ行きすぎない範囲で選ぶ */
const PLATE_THICKNESS = 0.4
const PLATE_HEIGHT = 2.4
const PLATE_DEPTH = 2.4
const PLATE_HALF_THICKNESS = PLATE_THICKNESS / 2

/** 光が出入りする面は正方形（高さと奥行きが同じ）。格子と稜線はこの 1 辺で組む */
const PLATE_FACE_SIZE = PLATE_HEIGHT
const PLATE_FACE_HALF = PLATE_FACE_SIZE / 2

/** 板の半透明な塗りの不透明度 */
const PLATE_OPACITY = 0.15

/**
 * 板の分割数。厚み方向は分割せず（x が正の頂点がそのまま出ていく側の面になる）、
 * 凹凸を付ける高さ・奥行き方向だけを細かく分ける
 */
const PLATE_SEGMENTS = 40

/** 出ていく側の面に張る格子線の本数（各方向 GRID_DIVISIONS + 1 本） */
const GRID_DIVISIONS = 12

/** 格子線 1 本を何分割して折れ線にするか。凹凸を滑らかな波として見せるための刻み */
const GRID_SAMPLES = 40

/** 粗さ 1 のときの凹凸の振幅。板の厚みの半分（0.2）に対して読み取れる大きさにする */
const BUMP_AMPLITUDE = 0.07

/** 光線の長さ（入射光・透過光で共通。板の中の光路は厚みと入射角で決まる） */
const RAY_LENGTH = 1.25

/**
 * 光が板から出ていく点。板の裏面に散らし、平行に届いた光が板のあちこちを通り抜ける様子にする。
 * `phase` は光の散らばりの向きを点ごとにずらす値で、同じ形の光束が並ぶのを避ける。
 * 入射角を変えると入射点のほうが上下に動くので、**起点である出射点を固定**して図を安定させる。
 * 先頭の点だけは透過光のラベルを付ける主役なので、光路が真横から読める z = 0 に置く。
 */
const EXIT_POINTS = [
  { y: 0, z: 0, phase: 0 },
  { y: 0.34, z: 0.52, phase: 1.1 },
  { y: -0.3, z: -0.54, phase: 2.3 }
]

/**
 * ラベルを付ける主役の点（出射点の並びの何番目か）。
 * 入射光・透過光のラベルをどちらもこの点に付けることで、
 * カメラからの距離がそろい、遠近による文字の大きさの差が出ない
 */
const MAIN_POINT = 0

/**
 * 1 つの出射点から描く透過光の本数。粗さ 0 では全本が入射方向に重なり、1 本に見える。
 * 出射点が複数あるので、拡散側で線が増えすぎないよう 1 点あたりは少なくする
 */
const TRANSMITTED_RAYS_PER_POINT = 4

const TRANSMITTED_RAY_COUNT = EXIT_POINTS.length * TRANSMITTED_RAYS_PER_POINT

/**
 * 粗さ 1 のときの光束の開き角（度）。
 * 90 にすると板の面すれすれの光線が出て稜線と重なるので、少しだけ手前で止める
 */
const MAX_SPREAD_DEG = 85

/** 黄金角。乱数を使わずに、単位球面上へ方向を偏りなく散らすための刻み */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * 入射光のラベルを、光線の外側の端よりさらに先へ置くための距離。
 * 3 本の入射光は平行で、しかも同じ長さで並んでいるので、
 * 線の脇に寄せるとどれかの線に触れてしまう。全部の端より外側に出す
 */
const INCIDENT_LABEL_GAP = 0.42
const INCIDENT_LABEL_SIDE_GAP = 0.2

/** 透過光のラベルを、光束の外側（正透過の向きの先）に置くための距離 */
const TRANSMITTED_LABEL_GAP = 0.5
const TRANSMITTED_LABEL_SIDE_GAP = 0.12

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * 光線の太さ（ピクセル）。
 * 図の主役なので稜線や弧より太くする。`LineBasicMaterial` の `linewidth` は WebGL では
 * 無視されて 1px になるため、光線だけは太さを指定できる Line2 系で描く
 */
const RAY_LINE_WIDTH = 1.5

/** 光線の進行方向を示す矢じりの大きさ。本数が多いので小さめにする */
const ARROW_RADIUS = 0.035
const ARROW_HEIGHT = 0.12

/** 入射光の矢じりを光線上のどこに置くか */
const INCIDENT_ARROW_ALONG = 0.55

/**
 * ここまでの粗さを正透過とみなす。
 * これを超えると、通り抜けた光の向きがそろっているとは言えなくなる
 */
const STRAIGHT_ROUGHNESS_MAX = 0.15

/** パネルに出す透過の種類 */
const STRAIGHT_TYPE = "正透過"
const DIFFUSE_TYPE = "拡散透過"

// 記事の SVG 図解と同じ役割分担で色を決める（--canvas-pen-* の値をリテラルで踏襲）。
// 背景（暗めのニュートラルグレー）の上でいずれも判別できる
const INCIDENT_COLOR = "#ef8c00"
const TRANSMITTED_COLOR = "#f6ce46"
// 板ガラスは、光線と役割が違うことがはっきりするよう水の色で塗る
const GLASS_COLOR = "#24b9ff"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

/**
 * 粗さ 1 のときの、面のその位置での凹凸の高さ（板の面に垂直な向きへのずれ）。
 * 反射のデモと同じく固定のサイン合成なので、同じ位置なら必ず同じ高さになる
 * （乱数だと操作のたびに凹凸の形が変わってチラつく）。
 * 主役の出射点である原点では必ず 0 になり、そこを通る光の光路が粗さで動かない。
 */
const bumpHeight = (y: number, z: number) =>
  (BUMP_AMPLITUDE *
    (Math.sin(y * 13) * Math.cos(z * 11) + 0.6 * Math.sin(z * 15) * Math.cos(y * 9))) /
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

/** 板の 4 隅を (高さ, 奥行き) の符号で表したもの。稜線を 1 周ぶんつなぐのに使う */
const FACE_CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
] as const

/**
 * 板ガラス。半透明の塗りと稜線で厚みのある板として見せ、
 * 光が出ていく側の面（+x）だけを粗さに比例して凹凸させる。
 * 光が入る側の面は滑らかなまま（片面だけを磨った板と同じ）にして、
 * 入射光が平行に届く様子を保つ
 */
const createPlate = () => {
  const geometry = new BoxGeometry(
    PLATE_THICKNESS,
    PLATE_HEIGHT,
    PLATE_DEPTH,
    1,
    PLATE_SEGMENTS,
    PLATE_SEGMENTS
  )
  const position = geometry.getAttribute("position")
  // 厚み方向を分割していないので、x が正の頂点がそのまま「光が出ていく側の面」になる。
  // その頂点だけを、粗さ 1 のときのずれとあわせて拾っておく
  const bumpVertices: { index: number; bump: number }[] = []
  for (let i = 0; i < position.count; i++) {
    if (position.getX(i) > 0) {
      bumpVertices.push({ index: i, bump: bumpHeight(position.getY(i), position.getZ(i)) })
    }
  }
  const material = new MeshBasicMaterial({
    color: GLASS_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: PLATE_OPACITY,
    // 塗りが板の中の光路や奥の光線を隠さないよう深度は書かない
    depthWrite: false
  })

  // 稜線と、出ていく側の面に張る格子。ライトを使わない図なので、面の凹凸はこの線が
  // 面に垂直な向きへ揺れる様子で読ませる。格子の外周がそのまま出ていく側の面の稜線になる
  const linePoints: { baseX: number; bump: number; y: number; z: number }[] = []
  const addBackPoint = (y: number, z: number) =>
    linePoints.push({ baseX: PLATE_HALF_THICKNESS, bump: bumpHeight(y, z), y, z })
  const addFrontPoint = (y: number, z: number) =>
    linePoints.push({ baseX: -PLATE_HALF_THICKNESS, bump: 0, y, z })

  // 出ていく側の面の格子。波を滑らかに見せるため、1 本の線を GRID_SAMPLES 個の線分に分ける
  for (let axis = 0; axis < 2; axis++) {
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const fixed = -PLATE_FACE_HALF + (i * PLATE_FACE_SIZE) / GRID_DIVISIONS
      for (let s = 0; s < GRID_SAMPLES; s++) {
        for (const step of [s, s + 1]) {
          const along = -PLATE_FACE_HALF + (step * PLATE_FACE_SIZE) / GRID_SAMPLES
          addBackPoint(axis === 0 ? along : fixed, axis === 0 ? fixed : along)
        }
      }
    }
  }

  // 光が入る側の面の 4 辺（滑らかなので直線）と、表と裏をつなぐ 4 本
  FACE_CORNERS.forEach(([cornerY, cornerZ], i) => {
    const [nextY, nextZ] = FACE_CORNERS[(i + 1) % FACE_CORNERS.length]
    addFrontPoint(cornerY * PLATE_FACE_HALF, cornerZ * PLATE_FACE_HALF)
    addFrontPoint(nextY * PLATE_FACE_HALF, nextZ * PLATE_FACE_HALF)
    addFrontPoint(cornerY * PLATE_FACE_HALF, cornerZ * PLATE_FACE_HALF)
    addBackPoint(cornerY * PLATE_FACE_HALF, cornerZ * PLATE_FACE_HALF)
  })

  const linePosition = new Float32BufferAttribute(new Float32Array(linePoints.length * 3), 3)
  // 高さと奥行きは粗さで動かないので先に入れておく（x は setRoughness で書き込む）
  linePoints.forEach(({ y, z }, i) => linePosition.setXYZ(i, 0, y, z))
  const lineGeometry = new BufferGeometry().setAttribute("position", linePosition)
  const lineMaterial = new LineBasicMaterial({ color: GLASS_COLOR })

  return {
    objects: [new Mesh(geometry, material), new LineSegments(lineGeometry, lineMaterial)],
    /** ずれは粗さに比例するので、粗さ 1 でのずれに掛けるだけでよい */
    setRoughness: (roughness: number) => {
      bumpVertices.forEach(({ index, bump }) =>
        position.setX(index, PLATE_HALF_THICKNESS + bump * roughness)
      )
      position.needsUpdate = true
      linePoints.forEach(({ baseX, bump }, i) => linePosition.setX(i, baseX + bump * roughness))
      linePosition.needsUpdate = true
    },
    dispose: () => {
      const disposables = [geometry, material, lineGeometry, lineMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createTransmissionSpreadScene = ({
  scene,
  renderer,
  params
}: ThreeSceneContext<TransmissionSpreadParams>) => {
  const plate = createPlate()
  scene.add(...plate.objects)

  // 入射光と、板の中の光路。屈折は次の節の主題なので、板の中も入射方向のまま直進させる。
  // 同じ色で続けて描くことで、1 本の光が板に入っていく様子として読める
  const incidentRays = createRayLines(EXIT_POINTS.length * 2, INCIDENT_COLOR)
  scene.add(incidentRays.object)

  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const incidentArrowMaterial = new MeshBasicMaterial({ color: INCIDENT_COLOR })
  const incidentArrows = EXIT_POINTS.map(() => {
    const arrow = new Mesh(arrowGeometry, incidentArrowMaterial)
    scene.add(arrow)
    return arrow
  })

  // 透過光。粗さ 0 では全本が入射方向に重なるので、見た目には 1 本になる
  const transmittedRays = createRayLines(TRANSMITTED_RAY_COUNT, TRANSMITTED_COLOR)
  scene.add(transmittedRays.object)

  const transmittedArrowMaterial = new MeshBasicMaterial({ color: TRANSMITTED_COLOR })
  const transmittedArrows = Array.from({ length: TRANSMITTED_RAY_COUNT }, () => {
    const arrow = new Mesh(arrowGeometry, transmittedArrowMaterial)
    scene.add(arrow)
    return arrow
  })

  // 記事の「光の透過」節は角度の関係を扱わないので、法線や入射角は描かない。
  // 光がどう入ってどう出ていくかだけを見せる
  const incidentLabel = createLabel("入射光", INCIDENT_COLOR)
  const transmittedLabel = createLabel("透過光", TRANSMITTED_COLOR)
  const labels = [incidentLabel, transmittedLabel]
  scene.add(incidentLabel.sprite, transmittedLabel.sprite)

  // 出射点が乗る凹凸の高さも粗さに比例するので、粗さ 1 でのずれを先に求めておく
  const exitBumps = EXIT_POINTS.map(({ y, z }) => bumpHeight(y, z))

  // 毎フレーム使い回す作業用のベクトル・クォータニオン
  const direction = new Vector3()
  const offset = new Vector3()
  const axis = new Vector3()
  const axisRotation = new Quaternion()
  const viewportSize = new Vector2()

  /** 板の頂点の更新は粗さが変わったときだけでよい（頂点数が多いので毎フレームは回さない） */
  let appliedRoughness = Number.NaN

  return {
    update: () => {
      const { roughness } = params
      const theta = MathUtils.degToRad(params.incidenceDeg)
      const sin = Math.sin(theta)
      const cos = Math.cos(theta)

      if (roughness !== appliedRoughness) {
        appliedRoughness = roughness
        plate.setRoughness(roughness)
      }

      // 光線の太さはピクセル指定なので、canvas の実寸をマテリアルへ渡す（リサイズにも追従する）
      renderer.getSize(viewportSize)
      incidentRays.setResolution(viewportSize.x, viewportSize.y)
      transmittedRays.setResolution(viewportSize.x, viewportSize.y)

      // 光の進行方向。左上から右下へ、板を斜めに横切る
      const dirX = cos
      const dirY = -sin
      const tan = sin / cos

      // 粗さが上がるほど、光束の中心は入射方向から板の面に垂直な向き（+x）へ寄り、開き角が広がる。
      // 粗さ 1 ではその向きを軸にした半球いっぱい（さまざまな方向）になる。
      // 中心と開き角を同時に動かすことで、どの入射角でも光線が板の中へ戻らない
      const axisAngle = theta * (1 - roughness)
      axis.set(Math.cos(axisAngle), -Math.sin(axisAngle), 0)
      axisRotation.setFromUnitVectors(CONE_UP, axis)

      const spread = MathUtils.degToRad(MAX_SPREAD_DEG * roughness)
      const cosSpread = Math.cos(spread)

      EXIT_POINTS.forEach(({ y, z, phase }, p) => {
        // 出射点は凹凸の上に乗る。粗さ 0 の滑らかな面では板の面ぴったりに戻る
        const exitX = PLATE_HALF_THICKNESS + exitBumps[p] * roughness
        // 入射点は出射点から板の中の光路をさかのぼった位置にあり、入射角を上げるほど上へ動く。
        // 凹凸の分だけ板の中を進む距離も変わるので、さかのぼる量は出射点ごとに異なる
        const entryY = y + (exitX + PLATE_HALF_THICKNESS) * tan

        // 入射光。どの点へも同じ角度で平行に届く
        incidentRays.setPoint(
          p * 2,
          0,
          -PLATE_HALF_THICKNESS - dirX * RAY_LENGTH,
          entryY - dirY * RAY_LENGTH,
          z
        )
        incidentRays.setPoint(p * 2, 1, -PLATE_HALF_THICKNESS, entryY, z)

        // 板の中の光路。屈折させず、入射方向のまま出ていく側の面まで直進する
        incidentRays.setPoint(p * 2 + 1, 0, -PLATE_HALF_THICKNESS, entryY, z)
        incidentRays.setPoint(p * 2 + 1, 1, exitX, y, z)

        direction.set(dirX, dirY, 0)
        incidentArrows[p].position
          .set(-PLATE_HALF_THICKNESS - dirX * RAY_LENGTH, entryY - dirY * RAY_LENGTH, z)
          .addScaledVector(direction, RAY_LENGTH * INCIDENT_ARROW_ALONG)
        incidentArrows[p].quaternion.setFromUnitVectors(CONE_UP, direction)

        for (let i = 0; i < TRANSMITTED_RAYS_PER_POINT; i++) {
          // 開き角の内側を偏りなく埋める。cosSpread が 1（開き角 0）なら全方向が軸に重なる
          const t = (i + 0.5) / TRANSMITTED_RAYS_PER_POINT
          const cosAlpha = 1 - t * (1 - cosSpread)
          const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha))
          // 黄金角に点ごとの位相を足し、同じ形の光束が並んで見えないようにする
          const phi = i * GOLDEN_ANGLE + phase
          direction
            .set(sinAlpha * Math.cos(phi), cosAlpha, sinAlpha * Math.sin(phi))
            .applyQuaternion(axisRotation)

          const ray = p * TRANSMITTED_RAYS_PER_POINT + i
          transmittedRays.setPoint(ray, 0, exitX, y, z)
          transmittedRays.setPoint(
            ray,
            1,
            exitX + direction.x * RAY_LENGTH,
            y + direction.y * RAY_LENGTH,
            z + direction.z * RAY_LENGTH
          )

          // 矢じりの先端が光線の端に来るよう、円錐の高さの半分だけ内側に置く
          transmittedArrows[ray].position
            .copy(direction)
            .multiplyScalar(RAY_LENGTH - ARROW_HEIGHT / 2)
            .add(offset.set(exitX, y, z))
          transmittedArrows[ray].quaternion.setFromUnitVectors(CONE_UP, direction)
        }
      })
      incidentRays.commit()
      transmittedRays.commit()

      const main = EXIT_POINTS[MAIN_POINT]
      const mainExitX = PLATE_HALF_THICKNESS + exitBumps[MAIN_POINT] * roughness
      const mainEntryY = main.y + (mainExitX + PLATE_HALF_THICKNESS) * tan

      // 入射光のラベルは、3 本の光線すべての外側の端よりさらに先へ置く。
      // 光線は平行で同じ長さなので、端より外に出せばどの線とも重ならない。
      // 少しだけ板と反対側（下側）へずらして、光線の延長上に乗らないようにする
      incidentLabel.sprite.position
        .set(-dirX, -dirY, 0)
        .multiplyScalar(RAY_LENGTH + INCIDENT_LABEL_GAP)
        .addScaledVector(offset.set(-sin, -cos, 0), INCIDENT_LABEL_SIDE_GAP)
        .add(offset.set(-PLATE_HALF_THICKNESS, mainEntryY, main.z))

      // 透過光のラベルは、広がった光束の外側になるよう正透過の向きの先に置く。
      // 光束は板に垂直な向き寄り（上側）へ広がるので、ラベルは反対の下側へずらす
      transmittedLabel.sprite.position
        .set(dirX, dirY, 0)
        .multiplyScalar(RAY_LENGTH + TRANSMITTED_LABEL_GAP)
        .addScaledVector(offset.set(-sin, -cos, 0), TRANSMITTED_LABEL_SIDE_GAP)
        .add(offset.set(mainExitX, main.y, main.z))

      // パネルの表示は、光の向きがそろっていると言える範囲かどうかで切り替える
      params.transmissionType = roughness <= STRAIGHT_ROUGHNESS_MAX ? STRAIGHT_TYPE : DIFFUSE_TYPE
    },
    dispose: () => {
      plate.dispose()
      incidentRays.dispose()
      transmittedRays.dispose()
      labels.forEach((label) => label.dispose())
      const disposables = [arrowGeometry, incidentArrowMaterial, transmittedArrowMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
