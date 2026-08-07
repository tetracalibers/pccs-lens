#!/usr/bin/env node
/**
 * 根拠インデックスからルールごとの支持記事数を数え、確度の見直し候補を洗い出す。
 *
 *   node scripts/style-evidence-tally.mjs                    # 要約（各観点の分布と候補件数）
 *   node scripts/style-evidence-tally.mjs --aspect writing-style
 *   node scripts/style-evidence-tally.mjs --full             # 全ルールの支持記事数を並べる
 *   node scripts/style-evidence-tally.mjs --json             # 機械可読（メインセッションの前処理用）
 *   node scripts/style-evidence-tally.mjs --round /cg/basics/anti-aliasing,/color-theory/hue
 *   node scripts/style-evidence-tally.mjs --demote-threshold 2
 *
 * 確度は導出値である。ガイド本体の `確度` 欄はラベル3語しか持たないため、「何記事が支持している
 * か」はこのスクリプトが唯一の正となる。
 *
 * 機械化するのは**降格だけ**。昇格と「条件付きの傾向」の判定は記事タイプの幅を見る意味の判断で
 * あり、引き続きエージェント・著者が行う（`--demote-threshold 0` で降格検出を止められる）。
 *
 * ## `--round` を付ける／付けない の違い
 *
 * 降格の対象は「支持が閾値以下に**落ちた**ルール」であって、「閾値以下であるルール」ではない。
 * この2つは移行直後に大きく食い違う。移行した根拠インデックスは意図的に不完全で（集約表現で
 * 書かれていた根拠は個別記事へ展開できず、名指しされた記事にしか登録していない）、閾値以下の
 * ルールを一括で降格させると、根拠が未登録なだけのルールまで巻き込む。
 *
 *   - `--round <slug,...>` … そのラウンドで書き直した記事に関係するルールだけを候補にする。
 *     ラウンド前（`git show HEAD:`）とラウンド後（作業ツリー）の両方を見て、支持を失った
 *     ルールを拾う。**根拠モードの手順5はこちらを使う。**
 *   - `--round` なし … 現時点で閾値以下の全ルールを並べる棚卸し。移行直後は過剰に出るため、
 *     そのまま降格させず、根拠の登録漏れかどうかを1件ずつ見る材料として使う。
 *
 * 支持0のルールは降格ではなく**廃止候補**として別に報告する。自動削除はしない。
 */

import { execFileSync } from "node:child_process"
import {
  ASPECTS,
  aspectOf,
  buildRuleIndex,
  evidenceFileOf,
  parseEvidenceArticle,
  readConfidence,
  readRules,
  relative,
  ROOT,
  tallySupport
} from "./style-guide-lib.mjs"

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const valueOf = (f, fallback) => {
  const i = argv.indexOf(f)
  return i >= 0 ? argv[i + 1] : fallback
}

const only = valueOf("--aspect", null)
const demoteThreshold = Number(valueOf("--demote-threshold", "2"))
const roundSlugs = (valueOf("--round", "") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
const targets = only ? [aspectOf(only)] : ASPECTS

const index = buildRuleIndex()
const { support, unknownIds, articles } = tallySupport(index)

/**
 * `--round` のとき、そのラウンドで書き直した記事が「ラウンド前に支持していたルール」を
 * git から読む。ラウンドで支持を落としたルールを拾うために必要（今の作業ツリーには残らない）。
 */
const rulesTouchedByRound = () => {
  const touched = new Set()
  for (const { key } of ASPECTS) {
    for (const slug of roundSlugs) {
      const rel = relative(evidenceFileOf(key, slug))
      let before = ""
      try {
        before = execFileSync("git", ["show", `HEAD:${rel}`], { cwd: ROOT, encoding: "utf8" })
      } catch {
        before = "" // ラウンドで新規に作られた記事。ラウンド前の支持は無い
      }
      for (const e of parseEvidenceArticle(before).entries) touched.add(e.id)
      for (const e of support.keys()) {
        if ((support.get(e) ?? []).includes(slug)) touched.add(e)
      }
    }
  }
  return touched
}

const touchedByRound = roundSlugs.length ? rulesTouchedByRound() : null

const report = []

for (const aspect of targets) {
  const rules = readRules(aspect.key)
  const confidence = readConfidence(aspect.key)
  const rows = rules.map((r) => ({
    id: r.id,
    name: r.name,
    section: r.section,
    confidence: confidence.get(r.id) ?? "(未記載)",
    slugs: support.get(r.id) ?? []
  }))
  report.push({ aspect, rows, articles: articles.filter((a) => a.key === aspect.key).length })
}

const flat = report.flatMap((r) => r.rows.map((x) => ({ key: r.aspect.key, ...x })))
const abolish = flat.filter((r) => r.slugs.length === 0)
const demote = flat.filter(
  (r) =>
    demoteThreshold > 0 &&
    r.slugs.length > 0 &&
    r.slugs.length <= demoteThreshold &&
    r.confidence !== "弱い傾向" &&
    (!touchedByRound || touchedByRound.has(r.id))
)

if (has("--json")) {
  console.log(
    JSON.stringify(
      {
        demoteThreshold,
        round: roundSlugs,
        aspects: report.map((r) => ({
          key: r.aspect.key,
          articles: r.articles,
          rules: r.rows.map((x) => ({
            id: x.id,
            confidence: x.confidence,
            supportCount: x.slugs.length,
            support: x.slugs
          }))
        })),
        demoteCandidates: demote.map((r) => ({ ...r, supportCount: r.slugs.length })),
        abolishCandidates: abolish.map((r) => ({ key: r.key, id: r.id, name: r.name })),
        unknownIds
      },
      null,
      2
    )
  )
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 人間向けの報告
// ---------------------------------------------------------------------------

const median = (ns) => {
  if (!ns.length) return 0
  const s = [...ns].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

for (const { aspect, rows, articles: n } of report) {
  console.log(`\n=== ${aspect.key}（${aspect.label}）: ルール${rows.length} / 記事${n}`)
  for (const label of ["強い傾向", "条件付きの傾向", "弱い傾向", "(未記載)"]) {
    const g = rows.filter((r) => r.confidence === label)
    if (!g.length) continue
    const counts = g.map((r) => r.slugs.length)
    console.log(
      `  ${label.padEnd(8)} ${String(g.length).padStart(3)}件   ` +
        `支持 min=${Math.min(...counts)} 中央値=${median(counts)} max=${Math.max(...counts)}`
    )
  }
  if (has("--full")) {
    for (const r of [...rows].sort((a, b) => b.slugs.length - a.slugs.length)) {
      console.log(`    ${String(r.slugs.length).padStart(3)}  ${r.id}  ${r.confidence}  ${r.name}`)
    }
  }
}

if (abolish.length) {
  console.log(`\n■ 廃止候補（支持0記事）${abolish.length}件 — 自動削除はしない`)
  for (const r of abolish) console.log(`  ${r.id}  [${r.key}]  ${r.name}`)
}

if (demote.length) {
  const scope = touchedByRound
    ? `今回のラウンドで書き直した ${roundSlugs.length} 記事に関係するルールのみ`
    : "全ルールの棚卸し（登録漏れを含みうるので、そのまま降格させない）"
  console.log(`\n■ 確度の降格候補（支持${demoteThreshold}記事以下・弱い傾向へ）${demote.length}件`)
  console.log(`  対象範囲: ${scope}`)
  for (const r of demote) {
    console.log(`  ${r.id}  ${r.confidence} → 弱い傾向  支持${r.slugs.length}記事  ${r.name}`)
    console.log(`      ${r.slugs.join(", ")}`)
  }
}

if (unknownIds.length) {
  console.log(
    `\n■ 本体に存在しないIDが根拠に残っています ${unknownIds.length}件 — 自動削除はしない`
  )
  const seen = new Set()
  for (const u of unknownIds) {
    const k = `${u.key} ${u.id}`
    if (seen.has(k)) continue
    seen.add(k)
    console.log(`  ${u.id}  [${u.key}]  例: ${u.slug}`)
  }
}

if (!abolish.length && !demote.length && !unknownIds.length) {
  console.log("\n確度の見直し候補・不整合はありません。")
}
