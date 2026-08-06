#!/usr/bin/env node
/**
 * 保留プール（`writing-guides/pending/<観点>.md`）から昇格候補を抽出する。
 *
 *   node scripts/style-pending-promote.mjs                 # 昇格候補と未処理件数
 *   node scripts/style-pending-promote.mjs --threshold 3
 *   node scripts/style-pending-promote.mjs --aspect stylistic-quirks
 *   node scripts/style-pending-promote.mjs --json
 *
 * 発見モードの前処理はここで候補だけを取り出し、エージェントには候補だけを渡す（保留プール全文を
 * 読ませない）。根拠モードの完了報告に載せる「昇格候補の件数・未処理の保留件数」もここから採る。
 *
 * ## 1行形式
 *
 *   - SQ-P045｜支持2記事のみ・媒体機能への依存が大きい｜支持: /color-theory/color-area-proportion, /color-theory/hue-tone-difference
 *
 * 全角縦棒で「保留ID｜保留の理由｜支持記事」の3欄に分ける。支持記事を機械的に読めることが
 * 昇格判定を機械化できる条件で、散文のままでは1項目ずつ読み直すしかない（追記専用の倉庫になる）。
 *
 * 昇格の既定閾値は**支持3記事以上**。降格の閾値（2記事以下で弱い傾向へ）と1記事ぶん離すことで、
 * 昇格した直後に降格対象へ戻る往復を避ける。
 *
 * 1行化されていない旧形式の散文項目は解析できないため、件数だけを報告する。移行が済むまでは
 * 「未処理の保留件数」にこの数が乗る。
 */

import { readFileSync } from "node:fs"
import { ASPECTS, aspectOf, pendingPath, relative } from "./style-guide-lib.mjs"

const argv = process.argv.slice(2)
const valueOf = (f, fallback) => {
  const i = argv.indexOf(f)
  return i >= 0 ? argv[i + 1] : fallback
}

const threshold = Number(valueOf("--threshold", "3"))
const only = valueOf("--aspect", null)
const targets = only ? [aspectOf(only)] : ASPECTS

/** `- <保留ID>｜<理由>｜支持: <slug>, <slug>` */
const ITEM_RE = /^-\s*([A-Z]{2}-P\d{3})｜([^｜]*)｜\s*支持:\s*(.*)$/

const results = targets.map((aspect) => {
  const text = readFileSync(pendingPath(aspect.key), "utf8")
  const structured = []
  let legacy = 0
  for (const line of text.split("\n")) {
    if (!line.startsWith("- ")) continue
    const m = ITEM_RE.exec(line.trim())
    if (!m) {
      legacy++
      continue
    }
    const slugs = m[3]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    structured.push({ id: m[1], reason: m[2].trim(), slugs })
  }
  return { aspect, structured, legacy }
})

const candidates = results.flatMap(({ aspect, structured }) =>
  structured
    .filter((i) => i.slugs.length >= threshold)
    .map((i) => ({ key: aspect.key, ...i }))
    .sort((a, b) => b.slugs.length - a.slugs.length)
)

const totals = results.reduce(
  (acc, r) => ({
    structured: acc.structured + r.structured.length,
    legacy: acc.legacy + r.legacy
  }),
  { structured: 0, legacy: 0 }
)

if (argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        threshold,
        promotionCandidates: candidates.map((c) => ({ ...c, supportCount: c.slugs.length })),
        unresolvedPending: totals.structured + totals.legacy,
        legacyProsePending: totals.legacy
      },
      null,
      2
    )
  )
  process.exit(0)
}

for (const { aspect, structured, legacy } of results) {
  console.log(
    `${aspect.key.padEnd(18)} 1行形式 ${String(structured.length).padStart(3)}件 / ` +
      `旧形式の散文 ${String(legacy).padStart(3)}件  ${relative(pendingPath(aspect.key))}`
  )
}

console.log(`\n■ 昇格候補（支持${threshold}記事以上）${candidates.length}件`)
for (const c of candidates) {
  console.log(`  ${c.id}  [${c.key}]  支持${c.slugs.length}記事  ${c.reason}`)
  console.log(`      ${c.slugs.join(", ")}`)
}
if (!candidates.length) console.log("  なし")

console.log(
  `\n未処理の保留 ${totals.structured + totals.legacy}件（うち旧形式の散文 ${totals.legacy}件）`
)
if (totals.legacy) {
  console.log(
    "  旧形式の散文項目は機械的に読めないため、昇格候補の抽出対象に入っていません。" +
      "1行化の移行が済むまでは、発見モードで散文を読んで判断する必要があります。"
  )
}
