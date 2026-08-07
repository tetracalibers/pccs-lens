/**
 * 文体ガイド（writing-guides/）を機械的に扱うための共通モジュール。
 *
 * `author-style-analyzer` の各スクリプトが共有する読み書きの規約をここに集約する。
 * 扱う対象は次の3層。
 *
 *   - ガイド本体      writing-guides/<観点>.md          … `### [WS-012] ルール名` の見出しがルールの単位
 *   - 根拠インデックス writing-guides/evidence/<観点>/<slug>.md … 1記事1ファイル。支持ルールIDの一覧
 *   - 保留プール      writing-guides/pending/<観点>.md   … 未採用の観察（このモジュールは読み書きしない）
 *
 * ルールIDは「観点略号2文字＋連番3桁」。ルール名を改名しても ID は変えず、廃止したら欠番にする
 * （採番の再利用はしない）。ID を安定キーにすることで、支持記事数を機械集計できる。
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const GUIDES_DIR = path.join(ROOT, "writing-guides")
export const EVIDENCE_DIR = path.join(GUIDES_DIR, "evidence")
export const PENDING_DIR = path.join(GUIDES_DIR, "pending")

/** 4観点。prefix はルールIDの略号、camel は manifest のキー名。 */
export const ASPECTS = [
  { key: "thinking-flow", prefix: "TF", camel: "thinkingFlow", label: "思考フロー" },
  { key: "writing-style", prefix: "WS", camel: "writingStyle", label: "文章構成" },
  { key: "stylistic-quirks", prefix: "SQ", camel: "stylisticQuirks", label: "表現の癖" },
  { key: "refine-style", prefix: "RS", camel: "refineStyle", label: "修正傾向" }
]

export const ASPECT_KEYS = ASPECTS.map((a) => a.key)

export const aspectOf = (key) => {
  const a = ASPECTS.find((x) => x.key === key)
  if (!a) throw new Error(`未知の観点キー: ${key}`)
  return a
}

export const guidePath = (key) => path.join(GUIDES_DIR, `${key}.md`)
export const evidenceDirOf = (key) => path.join(EVIDENCE_DIR, key)
export const pendingPath = (key) => path.join(PENDING_DIR, `${key}.md`)

/** slug（`/cg/basics/anti-aliasing`）→ 根拠ファイルの絶対パス */
export const evidenceFileOf = (key, slug) =>
  path.join(evidenceDirOf(key), `${slug.replace(/^\/+/, "")}.md`)

/** 根拠ファイルの絶対パス → slug */
export const slugOfEvidenceFile = (key, file) =>
  "/" + path.relative(evidenceDirOf(key), file).replace(/\.md$/, "").split(path.sep).join("/")

export const RULE_ID_RE = /^([A-Z]{2})-(\d{3})$/
/** ガイド本体のルール見出し。ID は移行前は付いていないので任意扱い。 */
const HEADING_RE = /^### (?:\[([A-Z]{2}-\d{3})\]\s*)?(.+?)\s*$/

// ---------------------------------------------------------------------------
// ガイド本体
// ---------------------------------------------------------------------------

/**
 * ガイド本体のルール見出しを文書順に読む。
 * @returns {{ id: string|null, name: string, line: number, section: string }[]}
 */
export const readRules = (key) => {
  const text = readFileSync(guidePath(key), "utf8")
  const rules = []
  let section = ""
  text.split("\n").forEach((raw, i) => {
    if (raw.startsWith("## ")) section = raw.slice(3).trim()
    const m = HEADING_RE.exec(raw)
    if (m) rules.push({ id: m[1] || null, name: m[2], line: i + 1, section })
  })
  return rules
}

export const CONFIDENCE_LABELS = ["強い傾向", "条件付きの傾向", "弱い傾向"]

/**
 * ガイド本体の `- 確度：強い傾向` 行を読み、ルールID → 確度ラベルの対応を返す。
 * 確度そのものは導出値だが、本体に書かれた現在のラベルは降格判定の起点になる。
 */
export const readConfidence = (key) => {
  const lines = readFileSync(guidePath(key), "utf8").split("\n")
  const out = new Map()
  for (const rule of readRules(key)) {
    for (let i = rule.line; i < lines.length && !lines[i].startsWith("### "); i++) {
      const m = new RegExp(`^-\\s*確度[：:]\\s*(${CONFIDENCE_LABELS.join("|")})`).exec(lines[i])
      if (m) {
        out.set(rule.id, m[1])
        break
      }
    }
  }
  return out
}

/**
 * 4観点のルールを読み、ID・名前の双方向インデックスを作る。
 * 同名ルールが観点をまたいで存在しうるため、名前引きは観点ごとに持つ。
 */
export const buildRuleIndex = () => {
  const byId = new Map() // id -> { key, name }
  const byAspect = new Map() // key -> { byName: Map<name, id>, rules: [...] }
  for (const { key } of ASPECTS) {
    const rules = readRules(key)
    const byName = new Map()
    for (const r of rules) {
      if (r.id) {
        if (byId.has(r.id)) throw new Error(`ルールIDが重複: ${r.id}`)
        byId.set(r.id, { key, name: r.name })
      }
      byName.set(r.name, r.id)
    }
    byAspect.set(key, { byName, rules })
  }
  return { byId, byAspect }
}

/**
 * evidence の行に書かれたルール名（短縮形を含む）を、ガイド本体のルールIDへ解決する。
 *
 * SKILL.md は「ルール名は本体の `###` 見出しと一字一句一致させる」と規定しているが、実態は
 * `ヘッジ文末` のような短縮形で書かれている。ID へ移行したあとは表記ゆれが起きないが、移行時
 * だけはこの解決が必要になる。alias は呼び出し側が渡す手当て表（短縮形 → 正式名）。
 *
 * @returns {{ id: string, name: string, matchedBy: string } | { error: string, candidates?: string[] }}
 */
export const resolveRuleName = (rawName, key, index, alias = {}) => {
  const { byName, rules } = index.byAspect.get(key)
  const names = rules.map((r) => r.name)
  const idOf = (name) => ({ id: byName.get(name), name })

  const tries = [rawName, rawName.replace(/（弱い傾向）\s*$/, "").trim()]
  for (const name of tries) {
    if (!name) continue
    if (alias[name] && byName.has(alias[name])) return { ...idOf(alias[name]), matchedBy: "alias" }
    if (byName.has(name)) return { ...idOf(name), matchedBy: "exact" }
  }
  for (const name of tries) {
    if (!name) continue
    const hit = names.filter((h) => h.startsWith(name))
    if (hit.length === 1) return { ...idOf(hit[0]), matchedBy: "prefix" }
    if (hit.length > 1) return { error: "ambiguous", candidates: hit }
  }
  return { error: "unresolved" }
}

// ---------------------------------------------------------------------------
// 根拠インデックス（記事単位）
// ---------------------------------------------------------------------------

/**
 * 記事1本の根拠ファイルの形。
 *
 *   分析時点: `d8bd3563`
 *   記事タイプ: 概念解説
 *
 *   - WS-012（末尾を結果要約「なめらかに見えるようになります」で閉じる）
 *   - WS-034（前提記事へリンクし前回の欠落を述べてから問いへ）
 *     ※ WS-041：スーパーサンプリングは前手法の限界提示を伴わず、限界駆動が弱い
 *
 * `- ` 行だけが支持である。`※` 行は反例・除外の注記で、支持には数えない。
 */
export const parseEvidenceArticle = (text) => {
  const commit = /^分析時点:\s*`?([0-9a-f]{7,40})`?\s*$/m.exec(text)?.[1] ?? null
  const type = /^記事タイプ:\s*(.+?)\s*$/m.exec(text)?.[1] ?? null
  const entries = []
  for (const raw of text.split("\n")) {
    const support = /^- ([A-Z]{2}-\d{3})(?:（([\s\S]*)）)?\s*$/.exec(raw)
    if (support) {
      entries.push({ kind: "support", id: support[1], location: support[2] ?? "", notes: [] })
      continue
    }
    const note = /^\s+※\s*(.+?)\s*$/.exec(raw)
    if (note && entries.length) {
      const m = /^([A-Z]{2}-\d{3})：([\s\S]*)$/.exec(note[1])
      entries[entries.length - 1].notes.push(
        m ? { id: m[1], text: m[2] } : { id: null, text: note[1] }
      )
    }
  }
  return { commit, type, entries }
}

export const formatEvidenceArticle = ({ commit, type, entries }) => {
  const head = [`分析時点: \`${commit}\``, `記事タイプ: ${type || "未記録"}`, ""]
  const body = []
  for (const e of entries) {
    body.push(e.location ? `- ${e.id}（${e.location}）` : `- ${e.id}`)
    for (const n of e.notes || []) body.push(`  ※ ${n.id ? `${n.id}：${n.text}` : n.text}`)
  }
  return [...head, ...body, ""].join("\n")
}

export const writeEvidenceArticle = (key, slug, data) => {
  const file = evidenceFileOf(key, slug)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, formatEvidenceArticle(data))
  return file
}

/** 観点配下の記事ファイルを再帰的に列挙する（`_README.md` などの `_` 始まりは除く）。 */
export const listEvidenceFiles = (key) => {
  const root = evidenceDirOf(key)
  if (!existsSync(root)) return []
  const out = []
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(full)
      else if (ent.name.endsWith(".md") && !ent.name.startsWith("_")) out.push(full)
    }
  }
  walk(root)
  return out
}

export const readEvidenceArticles = (key) =>
  listEvidenceFiles(key).map((file) => ({
    file,
    slug: slugOfEvidenceFile(key, file),
    ...parseEvidenceArticle(readFileSync(file, "utf8"))
  }))

/**
 * ルールIDごとの支持記事を数える。`※` 注記は支持に数えない。
 * @returns {{ support: Map<string, string[]>, unknownIds: {id, slug, key}[], articles: object[] }}
 */
export const tallySupport = (index) => {
  const support = new Map()
  const unknownIds = []
  const articles = []
  for (const { key } of ASPECTS) {
    for (const art of readEvidenceArticles(key)) {
      articles.push({ key, ...art })
      for (const e of art.entries) {
        const known = index.byId.get(e.id)
        if (!known || known.key !== key) unknownIds.push({ id: e.id, slug: art.slug, key })
        if (!support.has(e.id)) support.set(e.id, [])
        support.get(e.id).push(art.slug)
      }
    }
  }
  for (const [, slugs] of support) slugs.sort()
  return { support, unknownIds, articles }
}

// ---------------------------------------------------------------------------
// 出力ヘルパ
// ---------------------------------------------------------------------------

export const relative = (p) => path.relative(ROOT, p)

/** 標準出力へ見出し付きの一覧を出す（各スクリプトの報告で共通に使う） */
export const printList = (title, lines) => {
  if (!lines.length) return
  console.log(`\n${title}`)
  for (const l of lines) console.log(`  ${l}`)
}
