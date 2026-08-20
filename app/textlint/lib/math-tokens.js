/**
 * 記法ルールが共有するトークンの辞書と分類。
 *
 * ここに置くのは「語の性質」だけで、記事のどこに現れたか（スコープ）は math-scope.js が見る。
 * 辞書を増やすときは `writing-guides/math-notation-guide.md` の文言に対応があることを確かめる
 * （ガイドに無いルールを textlint 側に持ち込まない）。
 */

/** 数学の関数名。長いものから並べる（`sin` が `sinh` を食わないように） */
export const FUNCTION_NAMES = [
  "arcsin",
  "arccos",
  "arctan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "log",
  "ln",
  "exp",
  "sqrt",
  "det",
  "lim"
]

/** KaTeX に同名のコマンドがある関数名（インライン数式へ昇格するときに `\sin` と書ける） */
const KATEX_FUNCTIONS = new Set([
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "log",
  "ln",
  "exp",
  "det",
  "lim"
])

/**
 * ギリシャ文字（LaTeX コマンド名 → Unicode）。
 * `:::Action` のテキストではインライン数式を使わず、この Unicode をインラインコードに入れる
 * （→ ガイド「`:::Action` のテキストではインライン数式を使わない」）。
 */
export const GREEK = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω"
}

/**
 * ギリシャ文字以外で Unicode の文字に置き換えられる記号（LaTeX コマンド名 → Unicode）。
 * ガイドが `≡`・`×` を挙げているのと同じ扱いにできるものだけを載せる。
 * 添字・分数・行列のように Unicode だけでは書けないものは載せない（日本語への言い換えが必要）。
 */
export const UNICODE_SYMBOLS = {
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  cdot: "・",
  equiv: "≡",
  neq: "≠",
  ne: "≠",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  ll: "≪",
  gg: "≫",
  approx: "≈",
  sim: "∼",
  propto: "∝",
  infty: "∞",
  to: "→",
  rightarrow: "→",
  longrightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  subset: "⊂",
  supset: "⊃",
  in: "∈",
  cap: "∩",
  cup: "∪",
  partial: "∂",
  nabla: "∇",
  sum: "Σ",
  prod: "Π",
  int: "∫",
  circ: "∘",
  degree: "°",
  ldots: "…",
  cdots: "⋯",
  dots: "…"
}

/** 同じ Unicode 文字を指す別名のコマンド。Unicode → コマンドの逆引きでは採らない */
const ALIAS_COMMANDS = new Set(["varepsilon", "vartheta", "varphi", "ne", "leq", "geq", "dots"])

/** Unicode → LaTeX コマンド（インラインコードからインライン数式へ昇格するときに使う） */
export const UNICODE_TO_COMMAND = Object.fromEntries(
  [...Object.entries(GREEK), ...Object.entries(UNICODE_SYMBOLS)]
    .filter(([name]) => !ALIAS_COMMANDS.has(name))
    .map(([name, char]) => [char, `\\${name}`])
)

/**
 * 単位辞書。「単位つきの数値は、単位も含めてインラインコードにします」（ガイド「数字は必ず
 * インラインコードにする」）を機械的に当てるために、単位だけを列挙する。
 *
 * **単位以外は載せない。** 色記号（PCCS トーン `v2`・マンセル `5R`）・固有名詞（`3D`・`3DCG`）・
 * BC 記法（`BC2万年`）は囲む範囲の判断が要るので、advisory パスで判断待ちとして出す。
 *
 * **1文字の単位も、記事で実際に使うもの（`K`）だけにする。** `m`（メートル）・`s`（秒）・`A`・`W` を
 * 入れると、`2s`（`s` 倍）・`2A`（点 A）のような変数との積を単位つきの数値と誤認する。
 * 長いものから並べる（`nm` が `n` に食われないように）。
 */
export const UNITS = [
  "nm",
  "μm",
  "mm",
  "cm",
  "km",
  "kHz",
  "MHz",
  "GHz",
  "Hz",
  "ms",
  "μs",
  "ns",
  "dpi",
  "ppi",
  "fps",
  "bit",
  "byte",
  "KB",
  "MB",
  "GB",
  "TB",
  "px",
  "pt",
  "dB",
  "cd",
  "lm",
  "lx",
  "kW",
  "mW",
  "sr",
  "K"
]

/**
 * 文字列の先頭にある単位を返す（無ければ null）。
 * 単位の直後に英数字が続く形（`600nmX`）は単位と見なさない。
 * @param {string} rest 数値の直後から始まる文字列
 * @returns {string | null}
 */
export const unitAt = (rest) =>
  UNITS.find((unit) => rest.startsWith(unit) && !/[A-Za-z0-9]/.test(rest[unit.length] ?? "")) ??
  null

/** 数値（整数・小数）。`2.5YR` を `` `2`.5YR `` に割らないよう、小数点まで1つの数値として扱う */
export const NUMBER = /[0-9０-９]+(?:[.．][0-9０-９]+)*/g

/** インラインコードの中身が数値と見なせるか（負号・小数・タプル・範囲・単位つきを含む） */
export const isNumberLike = (content) => {
  const trimmed = content.trim()
  if (!/[0-9０-９]/.test(trimmed)) return false
  const withoutUnits = trimmed.replace(new RegExp(`(?:${UNITS.join("|")})\\b`, "g"), "")
  return /^[-+−0-9０-９.,．、\s()（）[\]{}:：/×%°〜~ー–—]*$/.test(withoutUnits)
}

/** ギリシャ文字1文字（Unicode） */
const GREEK_CHAR = /^[Α-Ωα-ω]$/

/** 変数記号1つ（`x`・`C_fg`・`x'`・`θ`）。添字は英数字のみ */
const SYMBOL = /^([A-Za-z]|[Α-Ωα-ω])(?:_\{?([A-Za-z0-9]+)\}?)?('?)$/

/** 式を組み立て直すためのトークン。英字の並びは2文字まで（`ax`・`dy` のような暗黙の積） */
const TOKEN = new RegExp(
  [
    "(?<space>\\s+)",
    "(?<number>[0-9]+(?:\\.[0-9]+)?)",
    `(?<fn>\\b(?:${FUNCTION_NAMES.join("|")})\\b)`,
    "(?<symbol>(?:[A-Za-z]{1,2}|[Α-Ωα-ω])(?:_\\{?[A-Za-z0-9]+\\}?)?'?)",
    "(?<operator>[-+−=<>≤≥×·/*^,.()|])"
  ].join("|"),
  "gu"
)

/** 演算子が1つも無い並び（`RGB`・`dx`）は式と見なさない */
const OPERATOR_TOKEN = /[-+−=<>≤≥×·/*^,()|]/
/** インライン数式へ組み直す判断（`\dfrac`）が要る演算子 */
const NEEDS_REWRITE = /\//

/** 演算子の Unicode → LaTeX */
const OPERATOR_COMMAND = {
  "×": "\\times",
  "·": "\\cdot",
  "≤": "\\le",
  "≥": "\\ge",
  "−": "-",
  "*": "\\times"
}

/** 記号1つをインライン数式の書き方に直す（添字は波括弧、プライムは `^{\prime}`） */
const symbolToMath = (token) => {
  const matched = /^([A-Za-z]{1,2}|[Α-Ωα-ω])(?:_\{?([A-Za-z0-9]+)\}?)?('?)$/.exec(token)
  if (!matched) return null
  const [, head, subscript, prime] = matched
  const headMath = GREEK_CHAR.test(head) ? (UNICODE_TO_COMMAND[head] ?? head) : head
  return `${headMath}${subscript ? `_{${subscript}}` : ""}${prime ? "^{\\prime}" : ""}`
}

/**
 * 記号1つの基底（突き合わせ用）。ギリシャ文字はコマンド名、英字はそのまま。
 * `ax`・`dy` のような暗黙の積は1文字ずつに分ける（ブロック数式の記号と突き合わせるため）。
 */
const symbolBases = (token) => {
  const head = /^([A-Za-z]{1,2}|[Α-Ωα-ω])/.exec(token)?.[1] ?? token
  if (GREEK_CHAR.test(head)) return [(UNICODE_TO_COMMAND[head] ?? head).slice(1)]
  return [...head]
}

/**
 * インラインコードの中身を分類する。
 *
 * - `number` … 数字（ガイドの統一ルールの対象外。インラインコードのままにする）
 * - `symbol` / `function` / `expression` … 数式・変数記号・関数名（昇格の対象）
 * - `other` … それ以外（識別子・型名・コード片など。昇格の対象にしない）
 *
 * `math` は昇格先のインライン数式の中身。決定的に決められないときは null にして、
 * advisory パス（`svx-math-unify-manual`）の判断待ちに回す。
 *
 * **語を式と見誤らないことを優先する。** 英字の並びが3文字以上あるもの（`RGB`・`sRGB`）は、
 * 関数名でなければ式と見なさない。ここを緩めると `` `RGB` `` を `$$RGB$$` に昇格させてしまう。
 *
 * @param {string} content インラインコードの中身
 * @returns {{ kind: string, math: string | null, symbols: string[] }}
 */
export const classifyCode = (content) => {
  const trimmed = content.trim()
  if (trimmed === "") return { kind: "other", math: null, symbols: [] }
  if (isNumberLike(trimmed)) return { kind: "number", math: null, symbols: [] }

  // 3文字以上の英字の並びは語（関数名だけ例外）
  for (const run of trimmed.matchAll(/[A-Za-z]+/g))
    if (run[0].length > 2 && !FUNCTION_NAMES.includes(run[0]))
      return { kind: "other", math: null, symbols: [] }

  const tokens = []
  let consumed = 0
  for (const matched of trimmed.matchAll(TOKEN)) {
    if (matched.index !== consumed) return { kind: "other", math: null, symbols: [] }
    consumed = matched.index + matched[0].length
    tokens.push(matched.groups)
  }
  if (consumed !== trimmed.length) return { kind: "other", math: null, symbols: [] }

  const symbols = new Set()
  for (const token of tokens) {
    if (token.symbol) for (const base of symbolBases(token.symbol)) symbols.add(base)
    if (token.fn) symbols.add(`fn:${token.fn}`)
  }
  if (symbols.size === 0) return { kind: "other", math: null, symbols: [] }

  const hasOperator = tokens.some((token) => token.operator && OPERATOR_TOKEN.test(token.operator))
  if (!hasOperator) {
    if (tokens.length === 1 && tokens[0].fn)
      return {
        kind: "function",
        math: KATEX_FUNCTIONS.has(tokens[0].fn) ? `\\${tokens[0].fn}` : null,
        symbols: [...symbols]
      }
    if (tokens.length === 1 && tokens[0].symbol && SYMBOL.test(tokens[0].symbol))
      return { kind: "symbol", math: symbolToMath(tokens[0].symbol), symbols: [...symbols] }
    return { kind: "other", math: null, symbols: [] }
  }

  const math = tokens
    .map((token) => {
      if (token.space) return token.space
      if (token.number) return token.number
      if (token.fn) return KATEX_FUNCTIONS.has(token.fn) ? `\\${token.fn}` : null
      if (token.symbol) return symbolToMath(token.symbol)
      return OPERATOR_COMMAND[token.operator] ?? token.operator
    })
    .join("")
  const rewrite = tokens.some((token) => token.operator && NEEDS_REWRITE.test(token.operator))
  return {
    kind: "expression",
    math: rewrite || math.includes("null") ? null : math,
    symbols: [...symbols]
  }
}

/** LaTeX コマンド → Unicode（`:::Action` のテキストで使う） */
const COMMAND_TO_UNICODE = { ...GREEK, ...UNICODE_SYMBOLS }

/**
 * インライン数式の中身を、Unicode の文字だけで書けるならその文字列にする（書けなければ null）。
 *
 * `:::Action` のテキストではインライン数式を使わないので、`$$\theta$$` は `` `θ` `` に置き換える。
 * 添字・分数・行列のように Unicode だけでは書けない式は、日本語への言い換えが必要なので
 * ここでは null を返し、advisory パス（`svx-action-math-rewrite`）の判断待ちに回す。
 *
 * @param {string} body `$$` を除いた中身
 * @returns {string | null}
 */
export const toUnicode = (body) => {
  const replaced = body.replace(/\\([A-Za-z]+)/g, (matched, name) =>
    name in COMMAND_TO_UNICODE ? COMMAND_TO_UNICODE[name] : matched
  )
  const trimmed = replaced.trim()
  if (trimmed === "" || /[\\_^{}&]/.test(trimmed)) return null
  return trimmed
}

/**
 * インライン数式の中身が KaTeX でしか表記できないか。
 *
 * バックスラッシュは**英字が続かない形**（`\;`・`\,`）も必須記号として数える。
 * 上付き・下付き（`_`・`^`）、Unicode のギリシャ文字・数学記号、色記号の角括弧表記（`[R]`）も同じ。
 *
 * @param {string} body `$$` を除いた中身
 * @returns {boolean}
 */
export const requiresKatex = (body) =>
  /\\/.test(body) ||
  /[_^]/.test(body) ||
  /[Α-Ωα-ω]/.test(body) ||
  /\[[A-Z]\]/.test(body) ||
  /[≡×÷±∓≠≤≥≪≫≈∼∝∞→←↔⇒⊂⊃∈∩∪∂∇∫∘°⋯…]/.test(body)

/**
 * インライン数式・ブロック数式の中身から、そこに現れる数学的対象の記号を集める。
 *
 * 記号は「1文字の英字」「ギリシャ文字のコマンド名」「色記号の角括弧表記（`[R]`）」
 * 「関数名（`fn:sin`）」に正規化する。添字・上付きは落として基底の記号だけを見るので、
 * `T^{-1}` は `T`、`C_{\text{fg}}` は `C` になる（ガイドの「同じ対象を表す記号」の突き合わせ用）。
 *
 * @param {string} body
 * @returns {Set<string>}
 */
export const baseSymbols = (body) => {
  const found = new Set()
  let rest = body

  // 色記号の慣習表記（`[R]`・`[X]`）は、混色量の `R` とは別の対象として扱う
  for (const matched of rest.matchAll(/\[([A-Z])\]/g)) found.add(`[${matched[1]}]`)
  rest = rest.replace(/\[[A-Z]\]/g, " ")

  // 文字組みのための中身（`\text{fg}`）は記号ではない
  rest = rest.replace(/\\(?:text|mathrm|operatorname|mathbf|mathit)\{[^{}]*\}/g, " ")
  rest = rest.replace(/\\(?:begin|end)\{[^{}]*\}/g, " ")

  // ギリシャ文字・関数名のコマンドを拾ってから、残りのコマンドを落とす
  for (const matched of rest.matchAll(/\\([A-Za-z]+)/g)) {
    const name = matched[1]
    if (name in GREEK) found.add(name)
    else if (FUNCTION_NAMES.includes(name)) found.add(`fn:${name}`)
  }
  rest = rest.replace(/\\[A-Za-z]+/g, " ").replace(/\\[^A-Za-z]/g, " ")

  // 裸の関数名（`sin(x)`）
  for (const name of FUNCTION_NAMES) {
    const pattern = new RegExp(`\\b${name}\\b`, "g")
    if (pattern.test(rest)) {
      found.add(`fn:${name}`)
      rest = rest.replace(pattern, " ")
    }
  }

  for (const char of rest) {
    if (/[A-Za-z]/.test(char)) found.add(char)
    else if (GREEK_CHAR.test(char)) found.add((UNICODE_TO_COMMAND[char] ?? char).slice(1))
  }
  return found
}
