/**
 * 17 の壁紙群（平面群）の定義。
 *
 * 壁紙群は「格子の種類」と「単位格子を埋める合同変換の集まり」で決まる。
 * 変換は格子座標（基本並進ベクトル t1・t2 を基底とする座標）で書く。
 * この座標なら回転も鏡映も整数行列になり、並進は 1/2 の分数だけで済むので、
 * 浮動小数の誤差を持ち込まずに群を組み立てられる。
 *
 * 変換 {M, t} は格子座標の点 (u, v) を M·(u, v) + t に写す。
 * 格子並進のぶんの自由度があるので、t の成分は [0, 1) に丸めた代表元だけを持つ。
 * 変換の一覧は生成元からの閉包で作る（手で数え上げると取りこぼしやすい）。
 */

/* --- 格子座標での 2×2 行列 --- */

const I2 = [
  [1, 0],
  [0, 1],
]

/** 180 度回転 */
const R2 = [
  [-1, 0],
  [0, -1],
]

/** 直交・正方格子：u 軸の反転（Cartesian では y 軸に関する鏡映） */
const MX = [
  [-1, 0],
  [0, 1],
]

/** 直交・正方格子：v 軸の反転 */
const MY = [
  [1, 0],
  [0, -1],
]

/** 正方格子：90 度回転 */
const R4 = [
  [0, -1],
  [1, 0],
]

/** 正方格子：対角（u = v）に関する鏡映 */
const MD = [
  [0, 1],
  [1, 0],
]

/** 六方格子（t2 は t1 から 120 度）：120 度回転 */
const R3 = [
  [0, -1],
  [1, -1],
]

/** 六方格子：60 度回転 */
const R6 = [
  [1, -1],
  [1, 0],
]

/**
 * 六方格子：t1 に垂直な鏡（Cartesian の y 軸に関する鏡映）。
 * 3 回回転の中心すべてが鏡の上に乗るので、p3m1 と p6m で使う。
 */
const MA = [
  [-1, 1],
  [0, 1],
]

/**
 * 六方格子：t1 を含む鏡（Cartesian の x 軸に関する鏡映）。
 * 3 回回転の中心の一部が鏡から外れるので、p31m で使う。
 */
const MB = [
  [1, -1],
  [0, -1],
]

/** 面心（centered）格子の中心並進 */
const CENTERING = { M: I2, t: [0.5, 0.5] }

/* --- 格子の基本ベクトル（大きさは後で正規化する） --- */

export const LATTICES = {
  // 斜方：形に制約がないことがわかるよう、あえて歪ませる
  oblique: [
    [1, 0],
    [0.34, 0.82],
  ],
  rect: [
    [1, 0],
    [0, 0.78],
  ],
  square: [
    [1, 0],
    [0, 1],
  ],
  hex: [
    [1, 0],
    [-0.5, Math.sqrt(3) / 2],
  ],
}

/* --- 17 群 --- */

const DEFINITIONS = {
  p1: { lattice: 'oblique', order: 1, pointGroup: '1', generators: [] },
  p2: { lattice: 'oblique', order: 2, pointGroup: '2', generators: [{ M: R2, t: [0, 0] }] },

  pm: { lattice: 'rect', order: 2, pointGroup: 'm', generators: [{ M: MX, t: [0, 0] }] },
  pg: { lattice: 'rect', order: 2, pointGroup: 'm', generators: [{ M: MX, t: [0, 0.5] }] },
  cm: {
    lattice: 'rect',
    centered: true,
    order: 4,
    pointGroup: 'm',
    generators: [{ M: MX, t: [0, 0] }, CENTERING],
  },
  pmm: {
    lattice: 'rect',
    order: 4,
    pointGroup: '2mm',
    generators: [
      { M: MX, t: [0, 0] },
      { M: MY, t: [0, 0] },
    ],
  },
  pmg: {
    lattice: 'rect',
    order: 4,
    pointGroup: '2mm',
    generators: [
      { M: R2, t: [0, 0] },
      { M: MX, t: [0.5, 0] },
    ],
  },
  pgg: {
    lattice: 'rect',
    order: 4,
    pointGroup: '2mm',
    generators: [
      { M: R2, t: [0, 0] },
      { M: MX, t: [0.5, 0.5] },
    ],
  },
  cmm: {
    lattice: 'rect',
    centered: true,
    order: 8,
    pointGroup: '2mm',
    generators: [{ M: MX, t: [0, 0] }, { M: MY, t: [0, 0] }, CENTERING],
  },

  p4: { lattice: 'square', order: 4, pointGroup: '4', generators: [{ M: R4, t: [0, 0] }] },
  p4m: {
    lattice: 'square',
    order: 8,
    pointGroup: '4mm',
    generators: [
      { M: R4, t: [0, 0] },
      { M: MD, t: [0, 0] },
    ],
  },
  p4g: {
    lattice: 'square',
    order: 8,
    pointGroup: '4mm',
    generators: [
      { M: R4, t: [0, 0] },
      { M: MD, t: [0.5, 0.5] },
    ],
  },

  p3: { lattice: 'hex', order: 3, pointGroup: '3', generators: [{ M: R3, t: [0, 0] }] },
  p3m1: {
    lattice: 'hex',
    order: 6,
    pointGroup: '3m',
    generators: [
      { M: R3, t: [0, 0] },
      { M: MA, t: [0, 0] },
    ],
  },
  p31m: {
    lattice: 'hex',
    order: 6,
    pointGroup: '3m',
    generators: [
      { M: R3, t: [0, 0] },
      { M: MB, t: [0, 0] },
    ],
  },
  p6: { lattice: 'hex', order: 6, pointGroup: '6', generators: [{ M: R6, t: [0, 0] }] },
  p6m: {
    lattice: 'hex',
    order: 12,
    pointGroup: '6mm',
    generators: [
      { M: R6, t: [0, 0] },
      { M: MA, t: [0, 0] },
    ],
  },
}

/**
 * 一覧に並べる順。
 * 依頼で挙がった 11 群を先に、残る 6 群を後ろに置く。
 */
export const GROUP_NAMES = [
  'p6m',
  'p6',
  'p4m',
  'p4g',
  'p3m1',
  'p3',
  'p2',
  'pm',
  'pg',
  'cm',
  'p1',
  'p4',
  'pmm',
  'cmm',
  'pmg',
  'pgg',
  'p31m',
]

/* --- 群の組み立て --- */

const mulM = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
]

const mulV = (A, v) => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]]

/** 格子並進のぶんを落として [0, 1) に丸める */
const wrap = (x) => {
  const r = x - Math.floor(x)
  return r > 1 - 1e-9 ? 0 : r
}

const compose = (a, b) => {
  const t = mulV(a.M, b.t)
  return { M: mulM(a.M, b.M), t: [wrap(t[0] + a.t[0]), wrap(t[1] + a.t[1])] }
}

// 並進は 1/2 の倍数しか現れないので、24 分の 1 に丸めれば同一判定は厳密になる
const opKey = (op) =>
  `${op.M[0][0]},${op.M[0][1]},${op.M[1][0]},${op.M[1][1]}|` +
  `${Math.round(op.t[0] * 24)},${Math.round(op.t[1] * 24)}`

/** 生成元から閉包を取って、単位格子を埋める変換の一覧を作る */
function expandGroup(generators) {
  const found = new Map()
  const identity = { M: I2, t: [0, 0] }
  found.set(opKey(identity), identity)

  let frontier = [identity, ...generators]
  for (const g of generators) found.set(opKey(g), g)

  while (frontier.length > 0) {
    const next = []
    for (const a of frontier) {
      for (const b of [...found.values()]) {
        for (const product of [compose(a, b), compose(b, a)]) {
          const key = opKey(product)
          if (found.has(key)) continue
          found.set(key, product)
          next.push(product)
        }
      }
    }
    frontier = next
    if (found.size > 64) throw new Error('群が閉じない（生成元が誤っている）')
  }

  return [...found.values()]
}

export function wallpaperGroup(name) {
  const def = DEFINITIONS[name]
  if (!def) throw new Error(`未対応の壁紙群: ${name}`)

  const ops = expandGroup(def.generators)
  if (ops.length !== def.order) {
    throw new Error(`${name} の変換の数が合わない（${ops.length} ≠ ${def.order}）`)
  }

  return {
    name,
    lattice: def.lattice,
    centered: def.centered ?? false,
    pointGroup: def.pointGroup,
    ops,
  }
}
