#!/usr/bin/env node
/**
 * ガイド本体4ファイルのルール見出しへ、安定した ID（`### [WS-012] ルール名`）を採番する。
 *
 *   node scripts/style-rule-ids.mjs            # --check と同じ（未採番を報告して exit 1）
 *   node scripts/style-rule-ids.mjs --check
 *   node scripts/style-rule-ids.mjs --write    # 未採番のルールへ ID を振る
 *   node scripts/style-rule-ids.mjs --list     # ルールID一覧（判定エージェントへ渡す材料）
 *   node scripts/style-rule-ids.mjs --list --aspect writing-style
 *
 * ID は「観点略号2文字＋連番3桁」。既にある ID は絶対に振り直さない（ルール名を改名しても ID は
 * 据え置く）。廃止したルールの番号は欠番のまま残し、採番は常に「その観点の最大値＋1」から続ける。
 * 支持記事数の機械集計がこの ID をキーにするため、番号の再利用は追跡を壊す。
 *
 * `--list` の出力は、根拠モードの判定エージェントへ渡すルールID一覧そのもの。ガイド本体を
 * 読ませずに「どのルールIDを支持するか」を判定させるための入力になる。
 */

import { readFileSync, writeFileSync } from "node:fs"
import { ASPECTS, aspectOf, guidePath, readRules, relative } from "./style-guide-lib.mjs"

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const valueOf = (flag) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : null
}

const mode = has("--list") ? "list" : has("--write") ? "write" : "check"
const only = valueOf("--aspect")
const targets = only ? [aspectOf(only)] : ASPECTS

// ---------------------------------------------------------------------------
// 採番
// ---------------------------------------------------------------------------

const nextNumberOf = (rules) =>
  rules.reduce((max, r) => (r.id ? Math.max(max, Number(r.id.slice(3))) : max), 0) + 1

const assign = (aspect, write) => {
  const rules = readRules(aspect.key)
  const missing = rules.filter((r) => !r.id)
  if (!missing.length) return { aspect, assigned: [], total: rules.length }

  let next = nextNumberOf(rules)
  const assigned = missing.map((r) => ({
    ...r,
    id: `${aspect.prefix}-${String(next++).padStart(3, "0")}`
  }))

  if (write) {
    const lines = readFileSync(guidePath(aspect.key), "utf8").split("\n")
    for (const r of assigned) {
      const at = r.line - 1
      if (lines[at] !== `### ${r.name}`) {
        throw new Error(`${aspect.key}:${r.line} の行が見出しと一致しません: ${lines[at]}`)
      }
      lines[at] = `### [${r.id}] ${r.name}`
    }
    writeFileSync(guidePath(aspect.key), lines.join("\n"))
  }
  return { aspect, assigned, total: rules.length }
}

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------

if (mode === "list") {
  // 判定エージェントへ渡す形。節見出しで括り、1ルール1行にする。
  for (const aspect of targets) {
    console.log(`# ${aspect.key}（${aspect.label}）`)
    let section = null
    for (const r of readRules(aspect.key)) {
      if (r.section !== section) {
        section = r.section
        console.log(`\n## ${section}`)
      }
      console.log(`- ${r.id ?? "(未採番)"} ${r.name}`)
    }
    console.log("")
  }
  process.exit(0)
}

const results = targets.map((a) => assign(a, mode === "write"))
const pending = results.filter((r) => r.assigned.length)

for (const r of results) {
  const label = r.assigned.length ? `${r.assigned.length}件を採番` : `全${r.total}件に ID あり`
  console.log(`${r.aspect.key.padEnd(18)} ${label}`)
  for (const a of r.assigned) console.log(`  ${a.id}  ${a.name}`)
}

if (!pending.length) {
  console.log("\nすべてのルールに ID が付いています。")
  process.exit(0)
}

if (mode === "write") {
  const n = pending.reduce((s, r) => s + r.assigned.length, 0)
  console.log(`\n${n}件へ ID を採番しました:`)
  for (const r of pending) console.log(`  ${relative(guidePath(r.aspect.key))}`)
  process.exit(0)
}

console.log("\nID が未採番のルールがあります。`--write` で採番してください。")
process.exit(1)
