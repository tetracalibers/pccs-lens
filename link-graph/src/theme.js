// グラフと UI で共有する色・サイズの定義。
//
// ここが唯一の情報源。Cytoscape のスタイル（graph.js）と CSS（styles.css）の双方から参照する。
// CSS 側には main.js が起動時にカスタムプロパティとして流し込む。

/** ページの状態ごとのノード色。 */
export const STATE_COLORS = {
  /** リンク切れ。本文なし（赤）より強い異常として、色相ごと変えて目立たせる。 */
  broken: "#ff4fd8",
  /** 本文なし（雛形のまま）。 */
  empty: "#f2543d",
  /** 本文はあるが draft。 */
  draft: "#e8b93c",
  /** 公開済。 */
  published: "#7d8ca6"
}

/** エッジの警告レベルごとの色。ノード色より彩度を落として、点が埋もれないようにする。 */
export const EDGE_COLORS = {
  broken: "#c8339f",
  empty: "#b8412f",
  draft: "#9c7c26",
  none: "#454e5d"
}

/** 状態ごとのノードの直径。異常なものを大きくして、点の海から浮かせる。 */
export const NODE_SIZES = {
  broken: 20,
  empty: 17,
  draft: 14,
  published: 11
}

/** UI の基本色。 */
export const UI_COLORS = {
  background: "#12141a",
  surface: "#191c23",
  surfaceRaised: "#20242d",
  border: "#2c313c",
  text: "#dde3ec",
  textMuted: "#8d97a8",
  accent: "#5fb3d4",
  compoundFill: "rgba(126, 145, 178, 0.07)",
  compoundBorder: "#3a414f",
  compoundLabel: "#7d879a"
}

/** ゴースト（OFF の大分類にあるリンク先）の不透明度。 */
export const GHOST_OPACITY = 0.32

/** このズーム倍率以上でラベルを常時表示する。 */
export const LABEL_ZOOM_THRESHOLD = 1.35

/** レイアウトの乱数シード。走査のたびに配置が変わらないよう固定する。 */
export const LAYOUT_SEED = 20260822

/** サイドパネルの「記事を開く」リンクが指す先（app の dev サーバー）。 */
export const APP_DEV_ORIGIN = "http://localhost:5173"
