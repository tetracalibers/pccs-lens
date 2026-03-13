import type { SuggestOutput, ThemeId } from "./types"

type CheckerboardRule = {
  base: SuggestOutput
  assort: SuggestOutput
}

export const CHECKERBOARD_RULES: Record<ThemeId, CheckerboardRule> = {
  elegant: {
    base: { suggestedHues: [20, 21, 22, 23], suggestedTones: ["ltg"] },
    assort: { suggestedHues: [24, 1], suggestedTones: ["lt"] }
  },
  casual: {
    base: { suggestedHues: [4, 5, 6], suggestedTones: ["lt"] },
    assort: { suggestedHues: [10, 11, 12, 13, 14, 15, 16, 17, 18], suggestedTones: ["b"] }
  },
  classic: {
    base: { suggestedHues: [1, 2, 3, 4, 5, 6], suggestedTones: ["dk", "dkg"] },
    assort: { suggestedHues: [11, 12, 13, 14, 15, 16], suggestedTones: ["dp"] }
  },
  clear: {
    base: { suggestedHues: [14, 15, 16, 17, 18, 19], suggestedTones: ["lt", "p"] },
    assort: { suggestedHues: [], suggestedTones: ["W"] }
  },
  chic: {
    base: { suggestedHues: [], suggestedTones: ["dkGy"] },
    assort: {
      suggestedHues: [20, 21, 22, 23, 24, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      suggestedTones: ["g", "dk"]
    }
  },
  dynamic: {
    base: { suggestedHues: [], suggestedTones: ["Bk"] },
    assort: { suggestedHues: [2, 5, 8, 12, 18], suggestedTones: ["b", "s", "v"] }
  },
  "warm-natural": {
    base: { suggestedHues: [4, 5, 6, 7], suggestedTones: ["sf", "d"] },
    assort: { suggestedHues: [10, 11, 12], suggestedTones: ["ltg", "sf", "d"] }
  },
  "fresh-natural": {
    base: { suggestedHues: [9, 10, 11, 12, 13, 14, 15, 16], suggestedTones: ["lt", "p"] },
    assort: { suggestedHues: [], suggestedTones: ["W"] }
  },
  modern: {
    base: { suggestedHues: [], suggestedTones: ["ltGy"] },
    assort: { suggestedHues: [16, 17, 18], suggestedTones: ["d", "s", "v"] }
  },
  romantic: {
    base: { suggestedHues: [24, 1], suggestedTones: ["p"] },
    assort: { suggestedHues: [3, 4], suggestedTones: ["lt"] }
  }
}
