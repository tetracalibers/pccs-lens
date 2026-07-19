import { resolve } from "$app/paths"

export interface NavItem {
  /** resolve 済みリンク先 */
  href: string
  /** ルートパス（route id 相当。現在ページ判定・順序に使う） */
  path: string
  label: string
}

export interface NavSection {
  label: string
  accent: string
  gradient: string
  items: NavItem[]
}

/** ヘッダーのメインナビ定義。SiteHeader の表示と SiteFooter の循環 Prev/Next の単一ソース。 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "色を学ぶ",
    accent: "#c77dff",
    gradient: "linear-gradient(135deg,#4d96ff,#c77dff,#6bcb77)",
    items: [
      { href: resolve("/color-theory"), path: "/color-theory", label: "色の理論" },
      { href: resolve("/color-fields"), path: "/color-fields", label: "色の活用分野" },
      { href: resolve("/jis-color-map"), path: "/jis-color-map", label: "慣用色名マップ" }
    ]
  },
  {
    label: "色を見分ける",
    accent: "#e64980",
    gradient: "linear-gradient(135deg,#f783ac,#e64980)",
    items: [
      {
        href: resolve("/games/lightness-match"),
        path: "/games/lightness-match",
        label: "明度比較クイズ"
      },
      { href: resolve("/games/tone-hunt"), path: "/games/tone-hunt", label: "清色・濁色の見極め" },
      { href: resolve("/games/tone-match"), path: "/games/tone-match", label: "トーン当てクイズ" }
    ]
  },
  {
    label: "色を使う",
    accent: "#ff6b6b",
    gradient: "linear-gradient(135deg,#ff6b6b,#ffd93d)",
    items: [
      { href: resolve("/approximate"), path: "/approximate", label: "色の近似" },
      { href: resolve("/analyze"), path: "/analyze", label: "配色の分析" },
      { href: resolve("/patterns"), path: "/patterns", label: "配色シミュレータ" }
    ]
  },
  {
    label: "色と関わる",
    accent: "#4dabf7",
    gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
    items: [{ href: resolve("/cg"), path: "/cg", label: "CGと画像処理" }]
  }
]

/**
 * フッターの循環 Prev/Next 用一覧。
 * ヘッダー表示順にフラット化し、「CGと画像処理」(/cg) を除外する。
 */
export const FOOTER_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items).filter(
  (item) => item.path !== "/cg"
)
