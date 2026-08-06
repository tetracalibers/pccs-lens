#!/usr/bin/env node
/**
 * 判定エージェントの構造化出力から `evidence/<観点>/<slug>.md` を機械生成する。
 *
 *   node scripts/style-evidence-write.mjs judgments.json           # 差分を報告するだけ
 *   node scripts/style-evidence-write.mjs judgments.json --write   # 書き込む
 *   cat judgments.json | node scripts/style-evidence-write.mjs - --write
 *
 * 根拠モードの手順4（記帳）はこのスクリプトが担う。統合エージェントを起動しないのは、
 * 「ガイド本体を読ませない」という根拠モードの制約を成立させるためである（`Edit` は同一会話で
 * Read 済みのファイルしか編集できないので、エージェントに書かせるなら本体を読ませることになる。
 * 記事単位の新規 Write に落とせば、その必要がなくなる）。
 *
 * Workflow スクリプトはファイルシステムへ触れないため、これはメインセッションが Workflow の
 * 戻り値を受けてから実行する。
 *
 * 入力の形（Workflow の戻り値をそのまま渡せる）:
 *
 *   {
 *     "articles": {
 *       "/cg/basics/anti-aliasing": { "commit": "d8bd3563", "type": "概念解説" }
 *     },
 *     "judgments": [
 *       {
 *         "aspect": "writing-style",
 *         "articles": [
 *           {
 *             "slug": "/cg/basics/anti-aliasing",
 *             "supports": [{ "id": "WS-004", "location": "末尾を結果要約で閉じる" }],
 *             "counterexamples": [{ "id": "WS-032", "note": "限界提示を伴わない" }]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * `commit`（分析時点のSHA）と `type`（記事タイプ）はメインセッションが前処理で確定した値を使う。
 * エージェントに git を叩かせて推測させない。
 */

import { existsSync, readFileSync } from "node:fs"
import {
  ASPECT_KEYS,
  buildRuleIndex,
  evidenceFileOf,
  parseEvidenceArticle,
  relative,
  writeEvidenceArticle
} from "./style-guide-lib.mjs"

const argv = process.argv.slice(2)
const write = argv.includes("--write")
const source = argv.find((a) => !a.startsWith("--")) ?? "-"

const raw = source === "-" ? readFileSync(0, "utf8") : readFileSync(source, "utf8")
const input = JSON.parse(raw)

const index = buildRuleIndex()
const errors = []
const planned = []

const articleMeta = input.articles ?? {}

for (const judgment of input.judgments ?? []) {
  const key = judgment.aspect
  if (!ASPECT_KEYS.includes(key)) {
    errors.push(`未知の観点: ${key}`)
    continue
  }
  for (const art of judgment.articles ?? []) {
    const meta = articleMeta[art.slug]
    if (!meta) {
      errors.push(`${key}: articles に ${art.slug} のメタ情報（commit / type）がありません`)
      continue
    }
    if (!meta.commit) {
      errors.push(`${key} ${art.slug}: commit（分析時点のSHA）が未指定です`)
      continue
    }

    // 反例は、それが指すルールの支持行へ付ける。支持していないルールの反例は末尾の支持行へ
    // 寄せず、独立した注記として最後の支持行に付く（旧形式と同じ扱い）。
    const entries = []
    const byId = new Map()
    for (const s of art.supports ?? []) {
      if (!index.byId.has(s.id) || index.byId.get(s.id).key !== key) {
        errors.push(`${key} ${art.slug}: ${s.id} は ${key} の本体に存在しません`)
        continue
      }
      const entry = { id: s.id, location: s.location ?? "", notes: [] }
      entries.push(entry)
      byId.set(s.id, entry)
    }
    for (const c of art.counterexamples ?? []) {
      if (!entries.length) {
        errors.push(`${key} ${art.slug}: 支持が0件のため反例 ${c.id ?? ""} を記録できません`)
        continue
      }
      const note = { id: c.id ?? null, text: c.note ?? "" }
      ;(byId.get(c.id) ?? entries[entries.length - 1]).notes.push(note)
    }

    if (!entries.length) {
      errors.push(`${key} ${art.slug}: 支持ルールが0件です（判定の失敗を疑う）`)
      continue
    }

    const file = evidenceFileOf(key, art.slug)
    const before = existsSync(file) ? parseEvidenceArticle(readFileSync(file, "utf8")) : null
    planned.push({
      key,
      slug: art.slug,
      file,
      data: { commit: meta.commit, type: meta.type ?? "未記録", entries },
      reanalysis: !!before,
      beforeIds: before ? before.entries.map((e) => e.id) : []
    })
  }
}

// ---------------------------------------------------------------------------
// 報告
// ---------------------------------------------------------------------------

for (const p of planned) {
  const afterIds = p.data.entries.map((e) => e.id)
  const lost = p.beforeIds.filter((id) => !afterIds.includes(id))
  const gained = afterIds.filter((id) => !p.beforeIds.includes(id))
  console.log(
    `${p.reanalysis ? "書き直し" : "新規    "} ${relative(p.file)}  ` +
      `分析時点=${p.data.commit} 記事タイプ=${p.data.type} 支持=${afterIds.length}`
  )
  if (gained.length) console.log(`    + ${gained.join(", ")}`)
  if (lost.length) console.log(`    - ${lost.join(", ")}（支持を落としたので確度の再評価対象）`)
}

// 4観点そろっているかを記事ごとに確かめる。refine-style は Git 履歴が無い記事では欠けてよい。
const bySlug = new Map()
for (const p of planned) {
  if (!bySlug.has(p.slug)) bySlug.set(p.slug, new Set())
  bySlug.get(p.slug).add(p.key)
}
for (const [slug, keys] of bySlug) {
  const missing = ASPECT_KEYS.filter((k) => !keys.has(k))
  if (missing.length) console.log(`\n注意 ${slug}: ${missing.join(", ")} の根拠が生成されません`)
  const commits = new Set(planned.filter((p) => p.slug === slug).map((p) => p.data.commit))
  if (commits.size > 1)
    errors.push(`${slug}: 分析時点のSHAが観点間で食い違っています（${[...commits].join(", ")}）`)
}

if (errors.length) {
  console.error(`\n■ エラー ${errors.length}件`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}

if (!write) {
  console.log(`\n${planned.length}ファイルを書き込めます。--write を付けてください。`)
  process.exit(0)
}

for (const p of planned) writeEvidenceArticle(p.key, p.slug, p.data)
console.log(`\n${planned.length}ファイルを書き込みました。`)
