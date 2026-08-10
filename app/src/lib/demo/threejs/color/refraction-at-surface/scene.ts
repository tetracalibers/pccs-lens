import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
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
export type RefractionAtSurfaceParams = {
  /** 法線から測った入射角（度） */
  incidenceDeg: number
  /** 法線から測った屈折角。scene.ts が計算して書き戻す表示用の値 */
  refractionDeg: string
}

/** 水の屈折率。空気は 1 とする */
const WATER_IOR = 1.33

/** 水の寸法。上面が水面（y = 0）になるよう、箱の中心を高さの半分だけ下げて置く */
const TANK_WIDTH = 4.6
const TANK_HEIGHT = 1.9
const TANK_DEPTH = 1.7

/** 水の半透明な塗りの不透明度 */
const WATER_OPACITY = 0.15

/** 光線の長さ。入射光は原点（水面に当たる点）へ向かって伸ばす */
const INCIDENT_LENGTH = 1.3
const REFRACTED_LENGTH = 1.25

/**
 * 屈折せずに直進した場合の道すじの長さ。
 * 入射角を大きくするとこの線は寝て右へ長く伸びるので、屈折光より短くしておく
 */
const STRAIGHT_LENGTH = 1.15

/** 法線を水面の上下へ伸ばす長さ。入射角・屈折角はどちらもこの線から測る */
const NORMAL_ABOVE = 1.5
const NORMAL_BELOW = 1.35

/** 入射角・屈折角を表す扇形の半径と分割数 */
const ARC_RADIUS = 0.42
const ARC_SEGMENTS = 40

/** 角度のラベルを角の二等分線上のどこに置くか */
const ANGLE_LABEL_RADIUS = 0.72

/**
 * 角度のラベルを法線から最低限離す距離。
 * 入射角が小さいと二等分線が法線に重なり、ラベルが法線の上に乗ってしまう
 */
const MIN_ANGLE_LABEL_X = 0.4

/** 光線のラベルを光線上のどこに置くか（0 が水面、1 が光線の端） */
const INCIDENT_LABEL_ALONG = 0.95
const REFRACTED_LABEL_ALONG = 0.85

/** ラベルを、それが指す光線から垂直に離す距離 */
const INCIDENT_LABEL_GAP = 0.24
const REFRACTED_LABEL_GAP = 0.3

/** 直進した場合のラベルを、破線の端からさらに先へ離す距離 */
const STRAIGHT_LABEL_GAP = 0.3

/** 法線のラベルの下端を、線の上端から離す距離 */
const NORMAL_LABEL_GAP = 0.06

/** 空気・水のラベルを置く位置。図の左端に固定し、水面をはさんで上下に並べる */
const AIR_LABEL_POSITION = new Vector3(-1.95, 0.72, 0)
const WATER_LABEL_POSITION = new Vector3(-1.95, -0.5, 0)

/** ラベルの高さ（ワールド座標での大きさ）。幅は文字数に応じて決まる */
const LABEL_HEIGHT = 0.24

/** ラベルの文字を描く canvas の高さ（テクスチャの解像度）と左右の余白 */
const LABEL_TEXTURE_HEIGHT = 128
const LABEL_TEXTURE_PADDING = 12

/** ラベルの書体。canvas の高さに対して十分大きくとる */
const LABEL_FONT = "bold 92px sans-serif"

/**
 * 光線の太さ（ピクセル）。
 * 図の主役なので法線や弧より太くする。`LineBasicMaterial` の `linewidth` は WebGL では
 * 無視されて 1px になるため、光線だけは太さを指定できる Line2 系で描く
 */
const RAY_LINE_WIDTH = 2

/** 光線の進行方向を示す矢じりの大きさ */
const ARROW_RADIUS = 0.035
const ARROW_HEIGHT = 0.12

/** 矢じりを光線上のどこに置くか（0 が始点、1 が終点） */
const ARROW_ALONG = 0.55

/** 直進した場合の道すじを示す破線の刻み */
const GUIDE_DASH_SIZE = 0.08
const GUIDE_GAP_SIZE = 0.06

/** 入射角・屈折角を表す扇形の塗りの不透明度。記事の SVG 図解と同じ濃さにする */
const SECTOR_OPACITY = 0.32

// 記事の SVG 図解と同じ役割分担で色を決める（--canvas-pen-* の値をリテラルで踏襲）。
// 同じ記事の反射・透過のデモと同じく、入射光を橙、向きが変わったあとの光を黄にする
const INCIDENT_COLOR = "#ef8c00"
const REFRACTED_COLOR = "#f6ce46"
/** 屈折せずに直進した場合の道すじ。実際には光が通らない道なので別の色にする */
const STRAIGHT_COLOR = "#eb539f"
const NORMAL_COLOR = "#bfbfbf"
const WATER_COLOR = "#24b9ff"

/** ConeGeometry が既定で向いている方向 */
const CONE_UP = new Vector3(0, 1, 0)

const HALF_PI = Math.PI / 2

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
    dispose: () => {
      texture.dispose()
      material.dispose()
    }
  }
}

/**
 * 太さを指定できる光線。
 *
 * 太さはピクセル単位で、そのために canvas の実寸をマテリアルへ渡す必要がある
 * （`setResolution`）。奥行きによらず画面上の太さが一定になるので、
 * 視点を回しても手前と奥で太さがぶれない。
 */
const createRay = (color: string) => {
  const positions = new Float32Array(2 * 3)
  const geometry = new LineSegmentsGeometry()
  const material = new LineMaterial({ color, linewidth: RAY_LINE_WIDTH })

  return {
    object: new LineSegments2(geometry, material),
    /** 端点を書き込む（end は 0 が始点、1 が終点） */
    setPoint: (end: number, x: number, y: number, z: number) => {
      const offset = end * 3
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
 * 屈折せずに直進した場合の道すじを示す破線。実際に光が通る道ではないので、実線の光線と描き分ける。
 *
 * 破線の刻みは頂点ごとの「線に沿った距離」で決まるため、端点を動かすたびに
 * その距離も入れ直す（入れ直さないと線の向きが変わったときに模様が崩れる）。
 */
const createGuideLine = (color: string) => {
  const positions = new Float32BufferAttribute(new Float32Array(2 * 3), 3)
  const distances = new Float32BufferAttribute(new Float32Array(2), 1)
  const geometry = new BufferGeometry()
    .setAttribute("position", positions)
    .setAttribute("lineDistance", distances)
  const material = new LineDashedMaterial({
    color,
    dashSize: GUIDE_DASH_SIZE,
    gapSize: GUIDE_GAP_SIZE
  })

  return {
    object: new LineSegments(geometry, material),
    setSegment: (from: Vector3, to: Vector3) => {
      positions.setXYZ(0, from.x, from.y, from.z)
      positions.setXYZ(1, to.x, to.y, to.z)
      distances.setX(0, 0)
      distances.setX(1, from.distanceTo(to))
      positions.needsUpdate = true
      distances.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    }
  }
}

/**
 * 角度を表す扇形。水面に当たる点と弧の分割点で三角形を敷き詰めた塗りに、外周の弧の線を重ねる。
 * 半径は固定で、開始角と終了角を毎フレーム書き換える
 */
const createSector = (color: string) => {
  // 塗りの頂点は「水面に当たる点 + 弧の分割点」。水面に当たる点（0 番）は原点のまま動かない
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
  const arcMaterial = new LineBasicMaterial({ color })

  return {
    objects: [new Mesh(fillGeometry, fillMaterial), new Line(arcGeometry, arcMaterial)],
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
    dispose: () => {
      const disposables = [fillGeometry, fillMaterial, arcGeometry, arcMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

/** 水。半透明の塗りと稜線で、奥行きのある水のかたまりとして見せる */
const createWater = () => {
  const geometry = new BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH)
  const material = new MeshBasicMaterial({
    color: WATER_COLOR,
    side: DoubleSide,
    transparent: true,
    opacity: WATER_OPACITY,
    // 塗りが水中の光路やラベルを隠さないよう深度は書かない
    depthWrite: false
  })
  const fill = new Mesh(geometry, material)
  // 半透明のものの中でいちばん先に描く。あとから描かれるラベルに水の色が乗らない
  fill.renderOrder = -1

  const edgesGeometry = new EdgesGeometry(geometry)
  const edgesMaterial = new LineBasicMaterial({ color: WATER_COLOR })
  const edges = new LineSegments(edgesGeometry, edgesMaterial)

  // 上面が水面（y = 0）に来るように、高さの半分だけ下げる
  fill.position.y = -TANK_HEIGHT / 2
  edges.position.y = -TANK_HEIGHT / 2

  return {
    objects: [fill, edges],
    dispose: () => {
      const disposables = [geometry, material, edgesGeometry, edgesMaterial]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}

export const createRefractionAtSurfaceScene = ({
  scene,
  renderer,
  params
}: ThreeSceneContext<RefractionAtSurfaceParams>) => {
  const water = createWater()
  scene.add(...water.objects)

  // 法線。水面に当たる点から、空気側と水中側の両方へ伸ばす。
  // 入射角も屈折角もこの線から測るので、上下に伸ばさないと水中側の角が読めない
  const normalGeometry = new BufferGeometry().setFromPoints([
    new Vector3(0, -NORMAL_BELOW, 0),
    new Vector3(0, NORMAL_ABOVE, 0)
  ])
  const normalMaterial = new LineBasicMaterial({ color: NORMAL_COLOR })
  scene.add(new Line(normalGeometry, normalMaterial))

  // 空気中を進んで水面に当たる光と、水中へ入って向きを変えた光。
  // 色を変えることで、水面で向きが変わったことが線の切り替わりとして読める
  const incidentRay = createRay(INCIDENT_COLOR)
  const refractedRay = createRay(REFRACTED_COLOR)
  scene.add(incidentRay.object, refractedRay.object)

  // 屈折せずにそのまま直進した場合の道すじ。屈折光とのひらきが、曲がった量になる
  const straightGuide = createGuideLine(STRAIGHT_COLOR)
  scene.add(straightGuide.object)

  const arrowGeometry = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 12)
  const incidentArrowMaterial = new MeshBasicMaterial({ color: INCIDENT_COLOR })
  const refractedArrowMaterial = new MeshBasicMaterial({ color: REFRACTED_COLOR })
  const incidentArrow = new Mesh(arrowGeometry, incidentArrowMaterial)
  const refractedArrow = new Mesh(arrowGeometry, refractedArrowMaterial)
  scene.add(incidentArrow, refractedArrow)

  const incidentSector = createSector(INCIDENT_COLOR)
  const refractedSector = createSector(REFRACTED_COLOR)
  scene.add(...incidentSector.objects, ...refractedSector.objects)

  const incidentLabel = createLabel("入射光", INCIDENT_COLOR)
  const refractedLabel = createLabel("屈折光", REFRACTED_COLOR)
  const straightLabel = createLabel("直進した場合", STRAIGHT_COLOR)
  const normalLabel = createLabel("法線", NORMAL_COLOR)
  const incidentAngleLabel = createLabel("入射角", INCIDENT_COLOR)
  const refractedAngleLabel = createLabel("屈折角", REFRACTED_COLOR)
  const airLabel = createLabel("空気", NORMAL_COLOR)
  const waterLabel = createLabel("水", WATER_COLOR)
  const labels = [
    incidentLabel,
    refractedLabel,
    straightLabel,
    normalLabel,
    incidentAngleLabel,
    refractedAngleLabel,
    airLabel,
    waterLabel
  ]
  scene.add(...labels.map((label) => label.sprite))

  // 入射角に動かされないラベルは、ここで置いたまま動かさない
  normalLabel.sprite.position.set(0, NORMAL_ABOVE + LABEL_HEIGHT / 2 + NORMAL_LABEL_GAP, 0)
  airLabel.sprite.position.copy(AIR_LABEL_POSITION)
  waterLabel.sprite.position.copy(WATER_LABEL_POSITION)

  // 毎フレーム使い回す作業用のベクトル
  const origin = new Vector3()
  const straightEnd = new Vector3()
  const offset = new Vector3()
  const viewportSize = new Vector2()

  /**
   * 角度のラベルを角の二等分線上に置く。
   * 入射角が小さいと二等分線が法線に重なるので、法線から左右へ最低限だけ引き離す
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
      const incidence = MathUtils.degToRad(params.incidenceDeg)
      const sin = Math.sin(incidence)
      const cos = Math.cos(incidence)

      // スネルの法則。空気から水へ入るときは sin(入射角) = n_水 × sin(屈折角)。
      // 屈折率の大きい水のほうが角度が小さくなる、つまり光は法線へ寄る向きに折れる
      const refraction = Math.asin(sin / WATER_IOR)
      const sinRefraction = Math.sin(refraction)
      const cosRefraction = Math.cos(refraction)

      // 光線の太さはピクセル指定なので、canvas の実寸をマテリアルへ渡す（リサイズにも追従する）
      renderer.getSize(viewportSize)
      incidentRay.setResolution(viewportSize.x, viewportSize.y)
      refractedRay.setResolution(viewportSize.x, viewportSize.y)

      // 入射光は左上から来て、水面上の原点に当たる
      incidentRay.setPoint(0, -INCIDENT_LENGTH * sin, INCIDENT_LENGTH * cos, 0)
      incidentRay.setPoint(1, 0, 0, 0)
      incidentRay.commit()

      // 屈折光は原点から水中へ。入射角より小さい角度で、法線側に寄って進む
      refractedRay.setPoint(0, 0, 0, 0)
      refractedRay.setPoint(
        1,
        REFRACTED_LENGTH * sinRefraction,
        -REFRACTED_LENGTH * cosRefraction,
        0
      )
      refractedRay.commit()

      // 曲がらなかった場合の道すじは、入射光をそのまま水中へ伸ばしたもの
      straightEnd.set(STRAIGHT_LENGTH * sin, -STRAIGHT_LENGTH * cos, 0)
      straightGuide.setSegment(origin, straightEnd)

      // 矢じりは、それぞれの光線の進む向きに立てる
      offset.set(sin, -cos, 0)
      incidentArrow.position
        .set(-INCIDENT_LENGTH * sin, INCIDENT_LENGTH * cos, 0)
        .addScaledVector(offset, INCIDENT_LENGTH * ARROW_ALONG)
      incidentArrow.quaternion.setFromUnitVectors(CONE_UP, offset)

      offset.set(sinRefraction, -cosRefraction, 0)
      refractedArrow.position.copy(offset).multiplyScalar(REFRACTED_LENGTH * ARROW_ALONG)
      refractedArrow.quaternion.setFromUnitVectors(CONE_UP, offset)

      // 入射角は法線の上向き（+y）から、屈折角は下向き（-y）から測る
      incidentSector.setSweep(HALF_PI, HALF_PI + incidence)
      refractedSector.setSweep(-HALF_PI, -HALF_PI + refraction)

      // 入射光のラベルは、光線をはさんで法線と反対側（左上）に置く
      incidentLabel.sprite.position
        .set(-sin, cos, 0)
        .multiplyScalar(INCIDENT_LENGTH * INCIDENT_LABEL_ALONG)
        .addScaledVector(offset.set(cos, sin, 0), INCIDENT_LABEL_GAP)

      // 屈折光のラベルは、破線とぶつからないよう光線の左側に置く
      refractedLabel.sprite.position
        .set(sinRefraction, -cosRefraction, 0)
        .multiplyScalar(REFRACTED_LENGTH * REFRACTED_LABEL_ALONG)
        .addScaledVector(offset.set(-cosRefraction, -sinRefraction, 0), REFRACTED_LABEL_GAP)

      // 直進した場合のラベルは、破線の延長上に置く。入射角 0 でも屈折光のラベルと重ならない
      straightLabel.sprite.position
        .set(sin, -cos, 0)
        .multiplyScalar(STRAIGHT_LENGTH + STRAIGHT_LABEL_GAP)

      placeAngleLabel(incidentAngleLabel.sprite, HALF_PI + incidence / 2, -1)
      placeAngleLabel(refractedAngleLabel.sprite, -HALF_PI + refraction / 2, 1)

      // 入射角のスライダーと同じ目盛りで読めるよう、度に直して書き戻す
      params.refractionDeg = `${MathUtils.radToDeg(refraction).toFixed(0)}°`
    },
    dispose: () => {
      water.dispose()
      incidentRay.dispose()
      refractedRay.dispose()
      straightGuide.dispose()
      incidentSector.dispose()
      refractedSector.dispose()
      labels.forEach((label) => label.dispose())
      const disposables = [
        normalGeometry,
        normalMaterial,
        arrowGeometry,
        incidentArrowMaterial,
        refractedArrowMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
