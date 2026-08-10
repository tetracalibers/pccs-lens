import { Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { DEMO_BACKGROUND, MAX_PIXEL_RATIO } from "./constants"
import type { ThreeSceneFactory, ThreeSceneHandle } from "./types"

export type CameraOptions = {
  fov?: number
  near?: number
  far?: number
  position?: [number, number, number]
}

export type OrbitOptions = {
  /** 注視点 */
  target?: [number, number, number]
  enablePan?: boolean
  enableZoom?: boolean
  enableRotate?: boolean
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  /**
   * 水平方向に回せる範囲（ラジアン）。`0` が初期のカメラ位置ではなく `+z` 軸の向き。
   * 正面から見る構図が前提のデモ（左右の見比べなど）で、回り込みすぎを防ぐために使う。
   */
  minAzimuthAngle?: number
  maxAzimuthAngle?: number
  /**
   * ズームの寄り先を返す関数。寄るほど視野の中心が注視点からこの点へ移り、
   * `minDistance` まで寄ると完全にこの点が中心になる（引き切ると注視点に戻る）。
   * **カメラと注視点を同じだけ動かすので、視線の向きも距離も変わらない。**
   *
   * 「図の一部を大きく見せたい」場合に使う（`minDistance` の指定が前提）。
   * 毎フレーム呼ばれるため、`params` の現在値から寄り先を決めてよい。
   */
  zoomFocus?: () => [number, number, number]
}

export type MountThreeDemoOptions<P> = {
  canvas: HTMLCanvasElement
  /** `scene.ts` が公開する `createXxxScene` */
  createScene: ThreeSceneFactory<P>
  /** Tweakpane と `scene.ts` が共有するパラメータ（プレーンオブジェクト） */
  params: P
  /** 背景色。既定は `DEMO_BACKGROUND` */
  background?: string
  camera?: CameraOptions
  /** `false` で OrbitControls を付けない（カメラを `scene.ts` 側で制御するデモ用） */
  orbit?: OrbitOptions | false
  /** 描画中にコンテキストを失ったときに呼ばれる */
  onContextLost?: () => void
}

export type ThreeDemo = {
  /** 次のフレームで 1 回だけ描画する。同一フレーム内の重複呼び出しはまとめられる */
  invalidate: () => void
  dispose: () => void
}

const CAMERA_FOV = 45
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 100
const CAMERA_POSITION: [number, number, number] = [3, 3, 5]

/**
 * canvas に Three.js のデモをマウントする。記事に載らない定型処理をすべて引き受ける。
 *
 * 描画は**要求されたときだけ**走る（rAF の常時ループは回さない）。
 * `invalidate()` が呼ばれた次のフレームで 1 回描画し、OrbitControls の慣性が
 * 収まるまでは `change` イベント経由で自動的に描画が続く。
 *
 * canvas が画面外にある間はフレームを積まない（1 ページに複数デモが並んでも、
 * 見えているデモだけが描画される）。
 *
 * WebGL のコンテキストが取れない環境では `WebGLRenderer` のコンストラクタが例外を
 * 投げるため、**呼び出し側で捕まえてメッセージを出す**。
 */
export const mountThreeDemo = <P>(options: MountThreeDemoOptions<P>): ThreeDemo => {
  const {
    canvas,
    createScene,
    params,
    background = DEMO_BACKGROUND,
    camera: cameraOptions,
    orbit,
    onContextLost
  } = options

  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

  const scene = new Scene()
  scene.background = new Color(background)

  const camera = new PerspectiveCamera(
    cameraOptions?.fov ?? CAMERA_FOV,
    1, // アスペクト比は初回のリサイズで canvas の実寸から決まる
    cameraOptions?.near ?? CAMERA_NEAR,
    cameraOptions?.far ?? CAMERA_FAR
  )
  camera.position.set(...(cameraOptions?.position ?? CAMERA_POSITION))

  let frame = 0
  let visible = true
  let disposed = false

  const cancelFrame = () => {
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }

  const renderFrame = () => {
    // 先にクリアしておく。この後の controls.update() が慣性で `change` を投げた場合、
    // invalidate() が次のフレームを積めるようにするため。
    frame = 0
    if (disposed) return
    controls?.update()
    handle.update?.()
    // 寄り先は scene.ts が params を書き戻した後に読む（params から寄り先を決めるデモがあるため）
    applyZoomFocus?.()
    renderer.render(scene, camera)
  }

  // 描画ループは scene.ts へ invalidate を渡すために先に組み立てておく。
  // 中で参照している handle・controls は、実際に描画が走る次のフレームには揃っている
  const invalidate = () => {
    if (disposed || !visible || frame) return
    frame = requestAnimationFrame(renderFrame)
  }

  // シーン構築はカメラの初期値を入れたあとに行う。カメラそのものが主題のデモでは
  // scene.ts 側でカメラを上書きでき、その状態で OrbitControls が初期化される。
  const handle: ThreeSceneHandle = createScene({ scene, camera, renderer, params, invalidate })

  let controls: OrbitControls | null = null
  /** ズームの寄り先を視野に反映する。`zoomFocus` を渡したデモでだけ組み立てられる */
  let applyZoomFocus: (() => void) | null = null
  if (orbit !== false) {
    const orbitOptions = orbit ?? {}
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.enablePan = orbitOptions.enablePan ?? false
    controls.enableZoom = orbitOptions.enableZoom ?? true
    controls.enableRotate = orbitOptions.enableRotate ?? true
    if (orbitOptions.target) controls.target.set(...orbitOptions.target)
    if (orbitOptions.minDistance !== undefined) controls.minDistance = orbitOptions.minDistance
    if (orbitOptions.maxDistance !== undefined) controls.maxDistance = orbitOptions.maxDistance
    if (orbitOptions.minPolarAngle !== undefined)
      controls.minPolarAngle = orbitOptions.minPolarAngle
    if (orbitOptions.maxPolarAngle !== undefined)
      controls.maxPolarAngle = orbitOptions.maxPolarAngle
    if (orbitOptions.minAzimuthAngle !== undefined)
      controls.minAzimuthAngle = orbitOptions.minAzimuthAngle
    if (orbitOptions.maxAzimuthAngle !== undefined)
      controls.maxAzimuthAngle = orbitOptions.maxAzimuthAngle
    controls.update()
    controls.addEventListener("change", invalidate)

    const focus = orbitOptions.zoomFocus
    if (focus) {
      // 寄り先へ移る割合は「初期の距離から minDistance までのどこまで寄ったか」で決める。
      // 引き切れば 0 に戻るので、注視点を中心にした初期の構図へ必ず戻ってこられる
      const base = controls.target.clone()
      const baseDistance = camera.position.distanceTo(base)
      const span = baseDistance - controls.minDistance
      const center = new Vector3()
      const shift = new Vector3()

      applyZoomFocus = () => {
        if (!controls || span <= 0) return
        const distance = camera.position.distanceTo(controls.target)
        const progress = Math.min(Math.max((baseDistance - distance) / span, 0), 1)
        center
          .set(...focus())
          .sub(base)
          .multiplyScalar(progress)
          .add(base)
        // カメラと注視点を同じだけ動かす。両者の相対位置が変わらないので、
        // OrbitControls の状態（距離・向き）には手を入れずに視野の中心だけをずらせる
        shift.copy(center).sub(controls.target)
        controls.target.add(shift)
        camera.position.add(shift)
      }
    }
  }

  const resize = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width === 0 || height === 0) return
    // 第 3 引数 false で canvas に inline の width/height を書かせない（大きさは CSS 側の担当）
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    invalidate()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)

  // 画面外に出たデモはフレームを積まない（複数デモが同時に rAF を回すのを防ぐ）
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting)
    if (visible) invalidate()
    else cancelFrame()
  })
  visibilityObserver.observe(canvas)

  const handleContextLost = (event: Event) => {
    // 既定動作を止めてブラウザ側の復帰処理に任せる（このデモ自体は再構築せず、案内を出す）
    event.preventDefault()
    cancelFrame()
    onContextLost?.()
  }
  canvas.addEventListener("webglcontextlost", handleContextLost)

  resize()

  return {
    invalidate,
    dispose: () => {
      disposed = true
      cancelFrame()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      controls?.removeEventListener("change", invalidate)
      controls?.dispose()
      handle.dispose?.()
      renderer.dispose()
    }
  }
}
