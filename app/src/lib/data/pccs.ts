import pccsV24 from "./pccs_v24.json"
import pccsS12 from "./pccs_s12.json"
import pccsEven12 from "./pccs_even12.json"
import pccsOdd12 from "./pccs_odd12.json"
import pccsNeutral from "./pccs_neutral.json"
import type { PCCSColor } from "./types"

/** 新配色カード199の収録色（vトーン全色相 + v・s以外の偶数色相 + 無彩色） */
export const PCCS_CARD_199 = [...pccsV24, ...pccsEven12, ...pccsNeutral] as PCCSColor[]

/** PCCSの全トーンの全色相（PCCS_CARD_199 + sトーン全色相 + 奇数色相） */
export const PCCS_ALL = [...PCCS_CARD_199, ...pccsS12, ...pccsOdd12]
