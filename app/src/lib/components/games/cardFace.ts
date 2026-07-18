/**
 * カード表面の背景を作る。
 *
 * hintHex を渡すと、表面を上下 50/50 のハードエッジで分割し、上半分を実際の色（hex）、
 * 下半分をヒントのグレー（hintHex）で塗る。境界に区切り線は入れない。
 * 渡さなければ従来どおり hex の単色。
 */
export const cardFaceBackground = (hex: string, hintHex?: string): string =>
  hintHex ? `linear-gradient(to bottom, ${hex} 0 50%, ${hintHex} 50% 100%)` : hex
