import {
  BufferGeometry,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  Scene,
  SRGBColorSpace
} from "three"

/** Tweakpane で操作するパラメータ */
export type ImageResolutionParams = {
  /** 1 辺あたりの画素数 */
  resolution: number
  /** 画素どうしの境目を線で示すか */
  showGrid: boolean
  /** 画素数の表示。scene.ts が組み立てて書き戻すので、初期値は使われない */
  pixelCount: string
}

// _shared の ThreeSceneContext と同じ形をローカルに宣言する（_shared を import しないため）
type SceneContext = {
  scene: Scene
  params: ImageResolutionParams
}

/** 画像として扱う正方形の 1 辺。解像度を変えても、この大きさは変えない */
const IMAGE_SIZE = 2
const HALF_IMAGE = IMAGE_SIZE / 2

/** 1 辺あたりの画素数の上限。格子線の頂点をこの数に合わせて先に確保しておく */
const MAX_RESOLUTION = 128

const GRID_COLOR = "#7d8794"
const FRAME_COLOR = "#c8ccd4"

/**
 * デジタル化するもとの絵。x・y ともに -1 から 1 の範囲で、
 * どの点をとっても 0（暗）から 1（明）までの明るさが定まる
 */
const patternAt = (x: number, y: number) => {
  // 暗い斜めの帯。輪郭がはっきりしているので、解像度によるがたつきが出やすい
  if (Math.abs(x - y - 0.55) < 0.12) return 0.08

  // 明るい円。中心ほど明るく、縁に向かって少しずつ暗くなる
  const radius = Math.hypot(x + 0.3, y - 0.2)
  if (radius < 0.45) return 0.98 - 0.5 * (radius / 0.45) ** 2

  // 背景。左下から右上へゆるやかに明るくなる
  return 0.34 + 0.12 * (x + y)
}

/**
 * 指定した解像度で絵を標本化し、1 画素 1 テクセルのテクスチャに焼く。
 * 拡大しても画素が混ざらないよう、補間なし（NearestFilter）で貼る
 */
const createPixelTexture = (resolution: number) => {
  const data = new Uint8Array(resolution * resolution * 4)
  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      // 画素 1 つ分の真ん中で明るさを読み取る
      const x = -HALF_IMAGE + (IMAGE_SIZE * (column + 0.5)) / resolution
      const y = -HALF_IMAGE + (IMAGE_SIZE * (row + 0.5)) / resolution
      const level = Math.round(patternAt(x, y) * 255)
      data.set([level, level, level, 255], (row * resolution + column) * 4)
    }
  }

  const texture = new DataTexture(data, resolution, resolution)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.needsUpdate = true
  return texture
}

export const createImageResolutionScene = ({ scene, params }: SceneContext) => {
  // 明るさをそのままの濃さで見せたいので、陰影の付かない材質で貼る
  const pictureGeometry = new PlaneGeometry(IMAGE_SIZE, IMAGE_SIZE)
  const pictureMaterial = new MeshBasicMaterial({ side: DoubleSide })
  scene.add(new Mesh(pictureGeometry, pictureMaterial))

  // 画素どうしの境目。解像度が変わるたびに引き直すので、頂点は上限の数だけ先に確保しておく
  const gridPosition = new Float32BufferAttribute(new Float32Array((MAX_RESOLUTION + 1) * 4 * 3), 3)
  const gridGeometry = new BufferGeometry().setAttribute("position", gridPosition)
  const gridMaterial = new LineBasicMaterial({ color: GRID_COLOR })
  const grid = new LineSegments(gridGeometry, gridMaterial)
  grid.position.z = 0.002
  scene.add(grid)

  // 画像の外周。境目を消しても、画像の大きさが変わっていないことが分かるようにする
  const frameGeometry = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      // prettier-ignore
      [
        -HALF_IMAGE, -HALF_IMAGE, 0, HALF_IMAGE, -HALF_IMAGE, 0,
        HALF_IMAGE, -HALF_IMAGE, 0, HALF_IMAGE, HALF_IMAGE, 0,
        HALF_IMAGE, HALF_IMAGE, 0, -HALF_IMAGE, HALF_IMAGE, 0,
        -HALF_IMAGE, HALF_IMAGE, 0, -HALF_IMAGE, -HALF_IMAGE, 0
      ],
      3
    )
  )
  const frameMaterial = new LineBasicMaterial({ color: FRAME_COLOR })
  const frame = new LineSegments(frameGeometry, frameMaterial)
  frame.position.z = 0.003
  scene.add(frame)

  // 解像度が変わったときだけ焼き直す（カメラを動かしただけでは作り直さない）
  let builtResolution = NaN

  return {
    update: () => {
      const { resolution, showGrid } = params
      params.pixelCount = `${resolution} × ${resolution} = ${resolution * resolution}`
      grid.visible = showGrid

      if (resolution === builtResolution) return
      builtResolution = resolution

      pictureMaterial.map?.dispose()
      pictureMaterial.map = createPixelTexture(resolution)
      pictureMaterial.needsUpdate = true

      // 画素の境目は、画像の 1 辺を解像度で等分した位置に引く
      const pitch = IMAGE_SIZE / resolution
      for (let i = 0; i <= resolution; i++) {
        const offset = -HALF_IMAGE + i * pitch
        gridPosition.setXYZ(i * 4, offset, -HALF_IMAGE, 0)
        gridPosition.setXYZ(i * 4 + 1, offset, HALF_IMAGE, 0)
        gridPosition.setXYZ(i * 4 + 2, -HALF_IMAGE, offset, 0)
        gridPosition.setXYZ(i * 4 + 3, HALF_IMAGE, offset, 0)
      }
      gridPosition.needsUpdate = true
      gridGeometry.setDrawRange(0, (resolution + 1) * 4)
    },
    dispose: () => {
      pictureMaterial.map?.dispose()
      const disposables = [
        pictureGeometry,
        pictureMaterial,
        gridGeometry,
        gridMaterial,
        frameGeometry,
        frameMaterial
      ]
      disposables.forEach((disposable) => disposable.dispose())
    }
  }
}
