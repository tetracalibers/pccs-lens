#!/usr/bin/env node
/**
 * writer が読むスタイルガイドの肥大化率を測る。
 *
 * `author-style-analyzer` は分析のたびにガイド本体へ追記する。ガイド本体は
 * `author-style-writer` が毎回全文を読むファイルなので、増えた分はそのまま
 * 執筆側のコンテキスト負荷になる。ラウンドごとに「何%太ったか」を出して、
 * 「量はルール数に比例させ、記事数に比例させない」という契約が守られているかを見る。
 *
 * 使い方:
 *   node scripts/style-guide-size.mjs                # HEAD → 作業ツリー（コミット前の測定）
 *   node scripts/style-guide-size.mjs --ref HEAD~1   # 直前のコミット → HEAD（コミット後の測定）
 *   node scripts/style-guide-size.mjs --json         # 機械可読
 *
 * 比較の基準は git の任意のリビジョン。作業ツリーに差分が無ければコミット後だと分かるので、
 * その場合は `--ref HEAD~1` を使うよう促す。
 */

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import {
  ASPECTS,
  GUIDES_DIR,
  ROOT,
  guidePath,
  parseRuleHeadings,
  relative
} from "./style-guide-lib.mjs"

const argv = process.argv.slice(2)
const asJson = argv.includes("--json")
const refFlag = argv.indexOf("--ref")
const ref = refFlag >= 0 ? argv[refFlag + 1] : "HEAD"

if (refFlag >= 0 && !ref) {
  console.error("--ref にリビジョンを渡してください（例: --ref HEAD~1）")
  process.exit(2)
}

/**
 * 測定対象は writer が実際に読むファイル。
 * syntax-guide.md と math-notation-guide.md（数式の記法を切り出したもの）は
 * 記法の正典で analyzer は書き換えないが、writer が読む総量には効くので合計へ含める
 * （ルール見出しの形式が本体4ファイルと違うため、ルール数は数えない）。
 */
const TARGETS = [
  ...ASPECTS.map((a) => ({
    name: `${a.key}.md`,
    label: a.label,
    file: guidePath(a.key),
    countRules: true,
    owned: true
  })),
  {
    name: "syntax-guide.md",
    label: "記法",
    file: path.join(GUIDES_DIR, "syntax-guide.md"),
    countRules: false,
    owned: false
  },
  {
    name: "math-notation-guide.md",
    label: "数式",
    file: path.join(GUIDES_DIR, "math-notation-guide.md"),
    countRules: false,
    owned: false
  }
]

const chars = (text) => [...text].length

/** 指定リビジョン時点の本文。そのリビジョンにファイルが無ければ null（＝新規作成）。 */
const showAt = (rev, file) => {
  try {
    return execFileSync("git", ["show", `${rev}:${relative(file)}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"]
    })
  } catch {
    return null
  }
}

const rows = TARGETS.map((t) => {
  const after = existsSync(t.file) ? readFileSync(t.file, "utf8") : null
  const before = showAt(ref, t.file)
  const beforeChars = before === null ? 0 : chars(before)
  const afterChars = after === null ? 0 : chars(after)
  const beforeRules = t.countRules && before !== null ? parseRuleHeadings(before).length : null
  const afterRules = t.countRules && after !== null ? parseRuleHeadings(after).length : null
  return {
    name: t.name,
    label: t.label,
    owned: t.owned,
    isNew: before === null,
    missing: after === null,
    beforeChars,
    afterChars,
    deltaChars: afterChars - beforeChars,
    growthPercent: beforeChars ? ((afterChars - beforeChars) / beforeChars) * 100 : null,
    beforeRules,
    afterRules,
    deltaRules: beforeRules === null || afterRules === null ? null : afterRules - beforeRules
  }
})

const sum = (pick) => rows.reduce((n, r) => n + (pick(r) || 0), 0)
const total = {
  beforeChars: sum((r) => r.beforeChars),
  afterChars: sum((r) => r.afterChars),
  beforeRules: sum((r) => r.beforeRules),
  afterRules: sum((r) => r.afterRules)
}
total.deltaChars = total.afterChars - total.beforeChars
total.growthPercent = total.beforeChars ? (total.deltaChars / total.beforeChars) * 100 : null
total.deltaRules = total.afterRules - total.beforeRules
// 1ルールあたりの平均文字数。ルールを増やさずに本文だけ太っていれば、この値が上がる。
total.charsPerRuleBefore = total.beforeRules ? total.beforeChars / total.beforeRules : null
total.charsPerRuleAfter = total.afterRules ? total.afterChars / total.afterRules : null

// ルールが増えていないのに本文が膨らんだファイルは、根拠・確度の説明が本体へ漏れている疑いがある。
const BLOAT_PERCENT = 5
const warnings = rows
  .filter((r) => r.owned && r.deltaRules === 0 && (r.growthPercent || 0) >= BLOAT_PERCENT)
  .map(
    (r) =>
      `${r.name}：ルール数が変わらないまま ${r.growthPercent.toFixed(1)}% 増えている（根拠・確度の説明が本体へ漏れていないか確認する）`
  )

if (asJson) {
  console.log(JSON.stringify({ ref, rows, total, warnings }, null, 2))
  process.exit(0)
}

// 全角文字は端末上で2桁分の幅を取るので、桁を揃えるには表示幅で詰める必要がある。
// 漢字（CJK統合漢字 U+4E00-U+9FFF）を落とすと「合計」のような見出しだけ2桁ずれる。
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/
const width = (s) => [...s].reduce((w, c) => w + (WIDE.test(c) ? 2 : 1), 0)
const padEnd = (s, n) => s + " ".repeat(Math.max(0, n - width(s)))
const padStart = (s, n) => " ".repeat(Math.max(0, n - width(s))) + s

const n = (v) => v.toLocaleString("en-US")
const signed = (v) => (v > 0 ? `+${n(v)}` : v < 0 ? n(v) : "±0")
const pct = (v) =>
  v === null ? "新規" : v > 0 ? `+${v.toFixed(1)}%` : v < 0 ? `${v.toFixed(1)}%` : "±0%"
const ruleCol = (r) =>
  r.beforeRules === null
    ? "—"
    : r.deltaRules === 0
      ? `${r.afterRules}`
      : `${r.beforeRules} → ${r.afterRules}`

const line = (name, size, delta, growth, rules, suffix = "") =>
  `  ${padEnd(name, 24)}${padStart(size, 20)}${padStart(delta, 11)}${padStart(growth, 10)}${padStart(rules, 12)}${suffix}`

console.log(
  `=== writer が読むガイドの肥大化（${ref} → ${ref === "HEAD" ? "作業ツリー" : "HEAD"}）\n`
)
console.log(line("ファイル", "文字数", "増減", "肥大化", "ルール数"))
for (const r of rows) {
  if (r.missing) {
    console.log(`  ${padEnd(r.name, 24)}（ファイルが見つかりません）`)
    continue
  }
  const size = r.isNew ? `${n(r.afterChars)}（新規）` : `${n(r.beforeChars)} → ${n(r.afterChars)}`
  console.log(
    line(
      r.name,
      size,
      signed(r.deltaChars),
      pct(r.growthPercent),
      ruleCol(r),
      r.owned ? "" : "   ※analyzer 非対象"
    )
  )
}
console.log(
  line(
    "合計",
    `${n(total.beforeChars)} → ${n(total.afterChars)}`,
    signed(total.deltaChars),
    pct(total.growthPercent),
    total.deltaRules === 0 ? `${total.afterRules}` : `${total.beforeRules} → ${total.afterRules}`
  )
)

if (total.charsPerRuleBefore && total.charsPerRuleAfter) {
  const d = total.charsPerRuleAfter - total.charsPerRuleBefore
  console.log(
    `\n■ 1ルールあたりの平均文字数（本体4ファイル）: ${Math.round(total.charsPerRuleBefore)}字 → ${Math.round(total.charsPerRuleAfter)}字（${d > 0 ? "+" : ""}${Math.round(d)}字）`
  )
}

if (warnings.length) {
  console.log(`\n■ 肥大化の注意（${BLOAT_PERCENT}%以上）`)
  for (const w of warnings) console.log(`  ${w}`)
}

if (total.deltaChars === 0) {
  console.log(
    `\n${ref} との差分がありません。すでにコミット済みなら \`--ref ${ref}~1\` で直前のコミットと比べてください。`
  )
}
