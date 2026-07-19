/** 各ページ系統の main 最大幅。SiteFooter もページに応じてこの値を参照する。 */
export const MAIN_WIDTH = {
  top: "720px",
  analyze: "800px",
  approximate: "600px",
  cgList: "720px",
  cgGuide: "680px",
  colorTheory: "680px",
  colorFields: "680px",
  concept: "680px",
  games: "720px",
  patterns: "720px",
  jisIndex: "720px",
  jisAll: "min(800px, 95cqw)",
  jisFamily: "90cqw"
} as const

/**
 * ルート ID からそのページの main 最大幅を返す。
 * 幅に関する系統分岐はこの1関数に集約し、main も SiteFooter もこの結果（--main-width-current）を参照する。
 */
export function mainWidthForRoute(routeId: string | null): string {
  if (!routeId) return MAIN_WIDTH.top

  if (routeId === "/analyze") return MAIN_WIDTH.analyze
  if (routeId === "/approximate") return MAIN_WIDTH.approximate
  if (routeId === "/concept") return MAIN_WIDTH.concept

  if (routeId === "/cg") return MAIN_WIDTH.cgList
  if (routeId.startsWith("/cg/")) return MAIN_WIDTH.cgGuide

  if (routeId === "/jis-color-map") return MAIN_WIDTH.jisIndex
  if (routeId === "/jis-color-map/all") return MAIN_WIDTH.jisAll
  if (routeId === "/jis-color-map/[family]") return MAIN_WIDTH.jisFamily

  if (routeId.startsWith("/games/")) return MAIN_WIDTH.games
  if (routeId.startsWith("/patterns")) return MAIN_WIDTH.patterns
  if (routeId.startsWith("/color-theory")) return MAIN_WIDTH.colorTheory
  if (routeId.startsWith("/color-fields")) return MAIN_WIDTH.colorFields

  return MAIN_WIDTH.top
}
