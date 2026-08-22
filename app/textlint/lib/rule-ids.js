/**
 * ガイド（`writing-guides/math-notation-guide.md`）のルールIDと、textlint ルールの対応表。
 *
 * ルールIDはガイドの各ルールに1つずつ振った識別子（URLスラッグ風）で、記事を整備するときの
 * 指定単位になる。1つのルールIDを、自動修正する syntax ルールと判断待ちを出す advisory
 * ルールの2本で強制していることがあるため、対応は 1 対 N になる。
 *
 * **選択の仕組み**: 環境変数 `SVX_RULE_IDS`（カンマ区切りのルールID）が設定されているときは、
 * そこに挙がっているルールIDのルールだけが報告する。未設定なら全ルールが有効。
 * `npm run lint:svx:fix -- --rules=<ID>` と `/format-math-notation --rules=<ID>` がこれを使う。
 * 未知のルールIDを渡した場合は、黙って0件になるのを避けるため読み込み時に例外を投げる。
 */

/** ルールID → ガイドの見出しと、それを検査する textlint ルール */
export const RULES = {
  "prefer-inline-code": {
    title: "インライン数式はなるべく使わず、インラインコードで書く",
    syntax: [],
    advisory: ["svx-prefer-inline-code"]
  },
  "block-math-format": {
    title: "ブロック数式は段落全体を `$$...$$` にする",
    syntax: [],
    advisory: []
  },
  "block-math-linebreak": {
    title: "ブロック数式の改行はバックスラッシュ4つ（`\\frac` を含むなら8つ）",
    syntax: ["svx-block-math-linebreak"],
    advisory: []
  },
  "prime-notation": {
    title: "プライム記号は `'` を使わず `^{\\prime}` と書く",
    syntax: ["svx-math-prime"],
    advisory: []
  },
  "action-no-inline-math": {
    title: "`:::Action` のテキストではインライン数式を使わない",
    syntax: ["svx-action-no-inline-math"],
    advisory: ["svx-action-math-rewrite"]
  },
  "numbers-in-inline-code": {
    title: "数字は必ずインラインコードにする",
    syntax: ["svx-number-in-code"],
    advisory: ["svx-code-range-number"]
  },
  "function-names-in-inline-code": {
    title: "数学の関数名もインラインコードにする",
    syntax: ["svx-math-function-in-code"],
    advisory: ["svx-code-range-function"]
  },
  "no-inline-code-in-labels": {
    title: "`:Anki[]`・`:Mark[]` のラベルとリンクのテキストではインラインコードを使わない",
    syntax: ["svx-no-code-in-label"],
    advisory: []
  },
  "no-space-around-inline-code": {
    title: "インラインコードの前後には空白を置かない",
    syntax: ["svx-no-space-around-code"],
    advisory: []
  },
  "space-around-inline-math": {
    title: "インライン数式の前後には半角スペースを置く",
    syntax: ["svx-inline-math-spacing"],
    advisory: []
  },
  "math-enum-comma": {
    title: "記号を並べるときは1つのインライン数式にまとめ、カンマで区切る",
    syntax: ["svx-math-enum-comma"],
    advisory: ["svx-math-enum-comma-manual"]
  },
  "article-symbol-unify": {
    title: "同じ対象を表す記号は、インライン数式とインラインコードを混在させない",
    syntax: ["svx-article-symbol-unify"],
    advisory: []
  },
  "sentence-math-unify": {
    title: "インライン数式を含む文では、数式・変数・関数名をインライン数式に統一する",
    syntax: ["svx-sentence-math-unify"],
    advisory: []
  },
  "block-math-symbol-unify": {
    title: "ブロック数式を説明する文では、その式の記号をインライン数式で書く",
    syntax: ["svx-block-math-symbol-unify"],
    advisory: []
  },
  "math-promotion-style": {
    title: "インラインコードからインライン数式に直すときの書き方",
    syntax: [],
    advisory: ["svx-math-unify-manual"]
  },
  "inline-math-dfrac": {
    title: "インライン数式の分数は `\\dfrac` で書く",
    syntax: ["svx-inline-math-dfrac"],
    advisory: []
  }
}

/** 全ルールID（ガイドの並び順） */
export const RULE_IDS = Object.keys(RULES)

/** 選択を渡す環境変数の名前 */
export const RULE_IDS_ENV = "SVX_RULE_IDS"

/**
 * カンマ区切りのルールIDを検証して集合にする。未知のIDは例外にする。
 * @param {string} value
 * @returns {Set<string>}
 */
export const parseRuleIds = (value) => {
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "")
  const unknown = ids.filter((id) => !(id in RULES))
  if (unknown.length > 0) {
    throw new Error(
      `未知のルールID: ${unknown.join("・")}\n指定できるルールID: ${RULE_IDS.join(", ")}`
    )
  }
  return new Set(ids)
}

/** 環境変数で選択されているルールID（未設定なら null＝全ルール有効） */
const selectedRuleIds = () => {
  const raw = process.env[RULE_IDS_ENV]
  return raw === undefined || raw.trim() === "" ? null : parseRuleIds(raw)
}

/**
 * そのルールIDが有効か（選択されていないルールは何も報告しない）。
 * @param {string} ruleId
 * @returns {boolean}
 */
export const isSelected = (ruleId) => {
  if (!(ruleId in RULES)) throw new Error(`ガイドに無いルールID: ${ruleId}`)
  const selected = selectedRuleIds()
  return selected === null || selected.has(ruleId)
}

/**
 * ルールIDの選択で有効・無効が切り替わる reporter を作る。
 * @param {string} ruleId ガイドのルールID
 * @param {(context: object) => object} reporter
 * @returns {(context: object) => object}
 */
export const forRule = (ruleId, reporter) => (context) =>
  isSelected(ruleId) ? reporter(context) : {}
