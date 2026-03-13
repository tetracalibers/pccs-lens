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
    base: { suggestedHues: [4, 5, 6], suggestedTones: ["p"] },
    assort: { suggestedHues: [10, 11, 12, 13, 14], suggestedTones: ["b"] }
  },
  classic: {
    base: { suggestedHues: [1, 2, 3], suggestedTones: ["dk", "dkg"] },
    assort: { suggestedHues: [4, 5, 6], suggestedTones: ["g", "dk"] }
  },
  clear: {
    base: { suggestedHues: [14, 15, 16, 17, 18], suggestedTones: ["lt", "p"] },
    assort: { suggestedHues: [], suggestedTones: ["W"] }
  },
  chic: {
    base: { suggestedHues: [], suggestedTones: ["dkGy", "mGy"] },
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
    base: { suggestedHues: [4, 5, 6], suggestedTones: ["ltg"] },
    assort: { suggestedHues: [10, 11, 12], suggestedTones: ["d"] }
  },
  "fresh-natural": {
    base: { suggestedHues: [10, 11, 12, 13, 14, 15, 16], suggestedTones: ["lt", "p"] },
    assort: { suggestedHues: [], suggestedTones: ["W"] }
  },
  modern: {
    base: { suggestedHues: [], suggestedTones: ["ltGy"] },
    assort: { suggestedHues: [16, 17, 18], suggestedTones: ["d", "s", "v"] }
  },
  romantic: {
    base: { suggestedHues: [24, 1], suggestedTones: ["p"] },
    assort: { suggestedHues: [4], suggestedTones: ["p"] }
  }
}
