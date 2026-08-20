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
 *
 * ## 棄却層の除外
 *
 * `writing-guides/rejected/<観点>.md` に移した観察は候補から外す。棄却は「記事が増えても解けない
 * 理由」で再審査を打ち切った記録なので、閾値を満たしても候補に出す意味がない（毎ラウンド同じ
 * 判断を作り直す原因になっていた）。単一シリーズ閉塞・支持不足は棄却にしないため、保留に残って
 * 候補に出続ける（別シリーズで再現すれば昇格しうる）。
 *
 * 保留と棄却に同じIDが両方あるのは移行漏れなので、警告して候補から外す。
 */

import { readFileSync } from "node:fs"
import {
  ASPECTS,
  aspectOf,
  lintRejected,
  pendingPath,
  readRejected,
  rejectedPath,
  relative
} from "./style-guide-lib.mjs"

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
  const rejected = readRejected(aspect.key)
  const rejectedIds = new Set(rejected.items.map((i) => i.id))
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
  const duplicated = structured.filter((i) => rejectedIds.has(i.id)).map((i) => i.id)
  return {
    aspect,
    structured: structured.filter((i) => !rejectedIds.has(i.id)),
    legacy,
    rejected,
    duplicated
  }
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
    legacy: acc.legacy + r.legacy,
    rejected: acc.rejected + r.rejected.items.length
  }),
  { structured: 0, legacy: 0, rejected: 0 }
)

/** 棄却層の記録が壊れていれば、それ自体が観察の取りこぼしなので報告する。 */
const rejectProblems = targets.flatMap((a) => lintRejected(a.key))
const duplicated = results.flatMap(({ aspect, duplicated }) =>
  duplicated.map((id) => ({ key: aspect.key, id }))
)

if (argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        threshold,
        promotionCandidates: candidates.map((c) => ({ ...c, supportCount: c.slugs.length })),
        unresolvedPending: totals.structured + totals.legacy,
        legacyProsePending: totals.legacy,
        rejectedTotal: totals.rejected,
        rejectedByCategory: results.reduce((acc, r) => {
          for (const it of r.rejected.items) acc[it.category] = (acc[it.category] || 0) + 1
          return acc
        }, {}),
        rejectProblems,
        duplicatedIds: duplicated
      },
      null,
      2
    )
  )
  process.exit(0)
}

for (const { aspect, structured, legacy, rejected } of results) {
  console.log(
    `${aspect.key.padEnd(18)} 保留 ${String(structured.length).padStart(3)}件 / ` +
      `旧形式の散文 ${String(legacy).padStart(3)}件 / ` +
      `棄却 ${String(rejected.items.length).padStart(3)}件  ${relative(pendingPath(aspect.key))}`
  )
}

console.log(`\n■ 昇格候補（支持${threshold}記事以上）${candidates.length}件`)
for (const c of candidates) {
  console.log(`  ${c.id}  [${c.key}]  支持${c.slugs.length}記事  ${c.reason}`)
  console.log(`      ${c.slugs.join(", ")}`)
}
if (!candidates.length) console.log("  なし")

console.log(
  `\n未処理の保留 ${totals.structured + totals.legacy}件（うち旧形式の散文 ${totals.legacy}件）` +
    ` / 棄却済み ${totals.rejected}件（候補から除外）`
)

const byCategory = results.reduce((acc, r) => {
  for (const it of r.rejected.items) acc[it.category] = (acc[it.category] || 0) + 1
  return acc
}, {})
if (totals.rejected) {
  console.log(
    "  棄却の区分: " +
      Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([c, n]) => `${c} ${n}件`)
        .join(" / ")
  )
  console.log(
    "  棄却は記事が増えても解けない理由のみ。単一シリーズ閉塞・支持不足は保留に残るので候補に出続ける。"
  )
}

for (const d of duplicated) {
  console.log(
    `\n⚠ ${d.id} が ${relative(pendingPath(d.key))} と ${relative(rejectedPath(d.key))} の両方にあります（移行漏れ）。候補からは外しました。`
  )
}
if (rejectProblems.length) {
  console.log(`\n⚠ 棄却層の記録に不備 ${rejectProblems.length}件`)
  for (const p of rejectProblems) console.log(`  [${p.key}] ${p.id ?? "-"}  ${p.problem}`)
}
if (totals.legacy) {
  console.log(
    "  旧形式の散文項目は機械的に読めないため、昇格候補の抽出対象に入っていません。" +
      "1行化の移行が済むまでは、発見モードで散文を読んで判断する必要があります。"
  )
}
