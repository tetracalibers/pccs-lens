import type { PerspectiveCamera, Scene } from "three"

/**
 * `scene.ts` の `createXxxScene` に渡すコンテキスト。
 *
 * `scene.ts` は記事にそのまま抜粋されるコードなので、**この型を import しない**。
 * 同じ形の型を `scene.ts` 側でローカルに宣言する（TypeScript は構造的部分型なので、
 * import なしでも `ThreeSceneFactory` に代入できる）。
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
  /** Tweakpane と共有するパラメータ。`update()` の中で読んでシーンに反映する */
  params: P
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
