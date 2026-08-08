import type { PerspectiveCamera, Scene, WebGLRenderer } from "three"

/**
 * `scene.ts` の `createXxxScene` に渡すコンテキスト。
 *
 * `scene.ts` は記事に載せるコードなので、**この型を import しない**。
 * 同じ形の型を `scene.ts` 側でローカルに宣言する（TypeScript は構造的部分型なので、
 * import なしでも `ThreeSceneFactory` に代入できる）。使うものだけ宣言すればよい。
 *
 * ```ts
 * // scene.ts — three にのみ依存する
 * import { PerspectiveCamera, Scene } from "three"
 *
 * type SceneContext = {
 *   scene: Scene
 *   camera: PerspectiveCamera
 *   params: TranslationParams
 * }
 * ```
 */
export type ThreeSceneContext<P> = {
  /** 背景色まで設定済みのシーン。ここに構築したものを足していく */
  scene: Scene
  /**
   * 位置・fov・near・far が適用済みのカメラ。
   * カメラ自体が記事の主題（投影・視錐台など）の場合は `scene.ts` 側で上書きしてよい。
   */
  camera: PerspectiveCamera
  /**
   * renderer。**そのデモに固有で、かつ必須の設定**（クリッピングの有効化など）は
   * `scene.ts` 側で行い、記事に載るコードに含める。それが無いと読者の手元で
   * 同じ絵にならないため。全デモに共通の定型設定は `_shared` の担当。
   */
  renderer: WebGLRenderer
  /** Tweakpane と共有するパラメータ。`update()` の中で読んでシーンに反映する */
  params: P
  /**
   * 次のフレームで 1 回だけ描画させる。
   *
   * 描画は要求されたときだけ走るので、`scene.ts` が独自の入力（canvas のドラッグなど）で
   * シーンを動かす場合は、動かしたあとにこれを呼ぶ。Tweakpane と OrbitControls の操作は
   * `_shared` 側で繋いであるため、そこでは呼ばなくてよい。
   */
  invalidate: () => void
}

/** `createXxxScene` の戻り値 */
export type ThreeSceneHandle = {
  /**
   * 描画の直前に毎フレーム呼ばれる。`ctx.params` の現在値をシーンへ反映する。
   * 描画はパラメータ操作・カメラ操作・リサイズの直後だけ走るので、
   * 経過時間に依存するアニメーションはここに書かない。
   */
  update?: () => void
  /** `scene.ts` が作った geometry・material・texture を破棄する */
  dispose?: () => void
}

/** `scene.ts` が公開する唯一の関数の型 */
export type ThreeSceneFactory<P> = (ctx: ThreeSceneContext<P>) => ThreeSceneHandle
