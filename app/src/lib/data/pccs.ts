import pccsV24 from "./pccs_v24.json"
import pccsS12 from "./pccs_s12.json"
import pccsEven12 from "./pccs_even12.json"
import pccsOdd12 from "./pccs_odd12.json"
import pccsNeutral from "./pccs_neutral.json"
import type { PCCSColor } from "./types"

/** vトーン全24色相 */
export const PCCS_V24 = pccsV24 as PCCSColor[]

/** 新配色カード199の収録色（vトーン全色相 + v・s以外の偶数色相 + 無彩色） */
export const PCCS_CARD_199 = [...pccsV24, ...pccsEven12, ...pccsNeutral] as PCCSColor[]

/** PCCSの全トーンの全色相（PCCS_CARD_199 + sトーン全色相 + 奇数色相） */
export const PCCS_ALL = [...PCCS_CARD_199, ...pccsS12, ...pccsOdd12] as PCCSColor[]
export const PCCS_ALL_MAP = new Map(PCCS_ALL.map((color) => [color.notation, color]))

/** Map<notation, hex> */
const PCCS_HEX = new Map(PCCS_ALL.map(({ notation, hex }) => [notation, hex]))
const PCCS_NEUTRAL_TONE_HEX = new Map([
  ["W", PCCS_HEX.get("W")],
  ["ltGy", PCCS_HEX.get("Gy-7.5")],
  ["mGy", PCCS_HEX.get("Gy-5.5")],
  ["dkGy", PCCS_HEX.get("Gy-3.5")],
  ["Bk", PCCS_HEX.get("Bk")]
])
export const PCCS_HEX_MAP = new Map([...PCCS_HEX, ...PCCS_NEUTRAL_TONE_HEX])

const PCCS_HUE = [
  {
    num: 1,
    name: "pR",
    labelEn: "purplish red",
    labelJa: "紫みの赤",
    color: PCCS_HEX_MAP.get("v1")!
  },
  {
    num: 2,
    name: "R",
    labelEn: "red",
    labelJa: "赤",
    color: PCCS_HEX_MAP.get("v2")!
  },
  {
    num: 3,
    name: "yR",
    labelEn: "yellowish red",
    labelJa: "黄みの赤",
    color: PCCS_HEX_MAP.get("v3")!
  },
  {
    num: 4,
    name: "rO",
    labelEn: "reddish orange",
    labelJa: "赤みの橙",
    color: PCCS_HEX_MAP.get("v4")!
  },
  {
    num: 5,
    name: "O",
    labelEn: "orange",
    labelJa: "橙",
    color: PCCS_HEX_MAP.get("v5")!
  },
  {
    num: 6,
    name: "yO",
    labelEn: "yellowish orange",
    labelJa: "黄みの橙",
    color: PCCS_HEX_MAP.get("v6")!
  },
  {
    num: 7,
    name: "rY",
    labelEn: "reddish yellow",
    labelJa: "赤みの黄",
    color: PCCS_HEX_MAP.get("v7")!
  },
  {
    num: 8,
    name: "Y",
    labelEn: "yellow",
    labelJa: "黄",
    color: PCCS_HEX_MAP.get("v8")!
  },
  {
    num: 9,
    name: "gY",
    labelEn: "greenish yellow",
    labelJa: "緑みの黄",
    color: PCCS_HEX_MAP.get("v9")!
  },
  {
    num: 10,
    name: "YG",
    labelEn: "yellow green",
    labelJa: "黄緑",
    color: PCCS_HEX_MAP.get("v10")!
  },
  {
    num: 11,
    name: "yG",
    labelEn: "yellowish green",
    labelJa: "黄みの緑",
    color: PCCS_HEX_MAP.get("v11")!
  },
  {
    num: 12,
    name: "G",
    labelEn: "green",
    labelJa: "緑",
    color: PCCS_HEX_MAP.get("v12")!
  },
  {
    num: 13,
    name: "bG",
    labelEn: "bluish green",
    labelJa: "青みの緑",
    color: PCCS_HEX_MAP.get("v13")!
  },
  {
    num: 14,
    name: "BG",
    labelEn: "blue green",
    labelJa: "青緑",
    color: PCCS_HEX_MAP.get("v14")!
  },
  {
    num: 15,
    name: "BG",
    labelEn: "blue green",
    labelJa: "青緑",
    color: PCCS_HEX_MAP.get("v15")!
  },
  {
    num: 16,
    name: "gB",
    labelEn: "greenish blue",
    labelJa: "緑みの青",
    color: PCCS_HEX_MAP.get("v16")!
  },
  {
    num: 17,
    name: "B",
    labelEn: "blue",
    labelJa: "青",
    color: PCCS_HEX_MAP.get("v17")!
  },
  {
    num: 18,
    name: "B",
    labelEn: "blue",
    labelJa: "青",
    color: PCCS_HEX_MAP.get("v18")!
  },
  {
    num: 19,
    name: "pB",
    labelEn: "purplish blue",
    labelJa: "紫みの青",
    color: PCCS_HEX_MAP.get("v19")!
  },
  {
    num: 20,
    name: "V",
    labelEn: "violet",
    labelJa: "青紫",
    color: PCCS_HEX_MAP.get("v20")!
  },
  {
    num: 21,
    name: "bP",
    labelEn: "bluish purple",
    labelJa: "青みの紫",
    color: PCCS_HEX_MAP.get("v21")!
  },
  {
    num: 22,
    name: "P",
    labelEn: "purple",
    labelJa: "紫",
    color: PCCS_HEX_MAP.get("v22")!
  },
  {
    num: 23,
    name: "rP",
    labelEn: "reddish purple",
    labelJa: "赤みの紫",
    color: PCCS_HEX_MAP.get("v23")!
  },
  {
    num: 24,
    name: "RP",
    labelEn: "red purple",
    labelJa: "赤紫",
    color: PCCS_HEX_MAP.get("v24")!
  }
]

export const PCCS_HUE_MAP = new Map(
  PCCS_HUE.map(({ num, name, ...data }) => [num, { ...data, symbol: [num, name].join(":") }])
)
