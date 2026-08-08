/**
 * seed 付き擬似乱数。
 * 同じ seed からは同じ模様が再現できるようにするため、Math.random は使わない。
 */

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRandom(seed) {
  const next = mulberry32(seed)

  const rng = {
    next,
    float: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** 重み付きでインデックスを 1 つ選ぶ */
    weightedIndex: (weights) => {
      const total = weights.reduce((a, b) => a + b, 0)
      let t = next() * total
      for (let i = 0; i < weights.length; i++) {
        t -= weights[i]
        if (t <= 0) return i
      }
      return weights.length - 1
    },
    /** -amount 〜 +amount の揺らぎを count 個 */
    wobbles: (count, amount) =>
      Array.from({ length: count }, () => rng.float(-amount, amount)),
  }

  return rng
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

/** 文字列 seed を 32bit 整数に落とす */
export function hashSeed(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
