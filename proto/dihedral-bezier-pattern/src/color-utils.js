/**
 * 16 進表記の色を扱う小道具。
 *
 * 準結晶版はパレットの色をそのまま塗るのではなく、ファセットの向きに応じて
 * 明るくしたり沈めたりする。線に使うインクもパレットから作るので、
 * 「パレット以外の色を持ち込まない」という約束を保ったまま濃淡を出せる。
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export function parseHex(hex) {
  const body = hex.slice(1)
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

export function toHex(rgb) {
  return (
    '#' +
    rgb
      .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

/** a と b を t : 1-t で混ぜる */
export function mixHex(a, b, t) {
  const ra = parseHex(a)
  const rb = parseHex(b)
  return toHex(ra.map((v, i) => v + (rb[i] - v) * clamp(t, 0, 1)))
}

/** amount > 0 なら白へ、< 0 なら黒へ寄せる */
export function shadeHex(hex, amount) {
  return amount >= 0 ? mixHex(hex, '#FFFFFF', amount) : mixHex(hex, '#000000', -amount)
}

export function luminance(hex) {
  const [r, g, b] = parseHex(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/**
 * 線に使うインク。パレットでいちばん暗い色をさらに沈めて作る。
 * 新しい色を持ち込まずに、面の上でも背景の上でも読める線が引ける。
 */
export function inkOf(colors) {
  const darkest = colors.reduce((a, b) => (luminance(a) <= luminance(b) ? a : b))
  return shadeHex(darkest, -0.4)
}
