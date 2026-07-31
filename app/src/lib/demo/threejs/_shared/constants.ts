/**
 * デモの背景色。**ライト／ダーク共通の固定色**とする。
 *
 * サイトの配色モードに追従させない理由は 2 つある。
 * - 軸・線・ラベルの色を、両モードで可読な 1 色に決められる
 * - `scene.ts` にテーマの分岐が入らないため、記事に抜粋したコードの見え方が読者の手元と一致する
 *
 * ニュートラルな暗めグレー。彩度のある図形も、白に近い補助線も、この上で判別できる。
 */
export const DEMO_BACKGROUND = "#26282d"

/**
 * `devicePixelRatio` の上限。
 * 3 倍以上の端末で描画ピクセル数が増えすぎるのを防ぐ（Retina 相当までで見た目は足りる）。
 */
export const MAX_PIXEL_RATIO = 2

/** WebGL のコンテキストが取れなかったときのメッセージ */
export const WEBGL_UNSUPPORTED_MESSAGE =
  "このデモは WebGL で描画しています。WebGL に対応したブラウザ（Chrome・Edge・Firefox・Safari の最新版）で、ハードウェアアクセラレーションを有効にすると表示されます。"

/** 描画中に WebGL のコンテキストを失ったときのメッセージ */
export const WEBGL_CONTEXT_LOST_MESSAGE =
  "WebGL のコンテキストが失われたため、デモの描画を中断しました。ページを再読み込みすると復帰します。ほかのタブや同じページの別のデモを閉じてから読み込むと安定します。"
