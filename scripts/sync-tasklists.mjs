#!/usr/bin/env node
/**
 * タスクリスト（OGP 生成 / 文体解析）を、コンテンツ YAML の構成に追随させる。
 *
 *   node scripts/sync-tasklists.mjs           # --check と同じ（差分を報告するだけ）
 *   node scripts/sync-tasklists.mjs --check   # 差分があれば報告して exit 1
 *   node scripts/sync-tasklists.mjs --write   # 差分を書き込んで exit 0
 *
 * 依存（yaml）は scripts/package.json にある。未インストールなら scripts/ で npm install。
 *
 * 両タスクリストは冒頭に「各セクション内の並びはコンテンツ YAML の並び順に忠実に従う」と
 * 明記されている YAML の写像。このスクリプトはその不変条件だけを機械的に維持する。
 *
 * 触るもの（構造）:
 *   - セクション内の行の並び順
 *   - YAML にあってリストに無い行の追加 / YAML から消えた行の削除
 *   - DraftLink（`[ページ未作成] タイトル`）と PageLink（``[状態] `/route` ``）の相互変換
 *   - frontmatter の draft と矛盾する `[draft]` / `[ ]` の付け替え（情報が失われない向きのみ）
 *
 * 触らないもの（記録）:
 *   - `[x]`（OGP 生成済み / 分析済み）は絶対に生成しないし、消さない。
 *     draft のページが `[x]` になっているなど矛盾する場合は警告するだけで書き換えない。
 *   - 見出しに YAML 参照が無いセクション（トップ・ゲーム・慣用色名マップなど手書きの一覧）
 *   - セクション見出しそのものと、その並び順
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT_DIR = path.join(ROOT, "app/src/lib/content-pages")
const ROUTES_DIR = path.join(ROOT, "app/src/routes")

/** 見出しから参照される YAML と、その slug が展開されるルートの先頭 */
const ROUTE_BASE = {
  "color-theory.yaml": "/color-theory",
  "color-fields.yaml": "/color-fields"
}

const TASKLISTS = ["ogimage/OGP-TASKLIST.md", "writing-guides/STYLE-ANALYSIS-TASKLIST.md"]

/** 見出し行の末尾 `（`<yaml>` #<id>）` を拾う。`（nested）` などの前置きは無視される */
const HEADER_REF_RE = /（`([^`]+)`(?:\s+#([A-Za-z0-9_-]+))?）\s*$/
/** `- [状態] `/route`` または `- [状態] タイトル` */
const ITEM_RE = /^- \[([^\]]*)\] (?:`([^`]+)`|(.+))$/

const errors = []
const warnings = []

const fail = (message) => {
  errors.push(message)
}
const warn = (message) => {
  warnings.push(message)
}

// ---------------------------------------------------------------------------
// YAML 読み取り
//
// 必要なのは並び順だけなので、パースした結果を「見出しが指す単位 → links の並び」に
// 落とすところまでをやる。想定外の形のエントリは黙って読み飛ばさずエラーにする
// （並び順を静かに間違えるより落ちた方が安全）。
// ---------------------------------------------------------------------------

const loadYaml = (relPath) => {
  try {
    return parse(readFileSync(path.join(CONTENT_DIR, relPath), "utf8"))
  } catch (error) {
    fail(`${relPath}: YAML として読めない（${error.message}）`)
    return null
  }
}

/** links[] の 1 要素を PageLink（slug）／DraftLink（title）に判別する */
const toLink = (link, routeBase, where) => {
  if (typeof link?.slug === "string" && link.slug !== "")
    return { kind: "page", route: `${routeBase}/${link.slug}` }
  if (typeof link?.title === "string" && link.title !== "")
    return { kind: "draft", title: link.title }
  fail(`${where}: slug も title も持たないエントリ: ${JSON.stringify(link)}`)
  return null
}

/** color-theory.yaml / color-fields.yaml → [{ id, links }]（カテゴリ単位、節をまたいで平坦化） */
const readCategoryYaml = (relPath) => {
  const routeBase = ROUTE_BASE[relPath]
  const categories = loadYaml(relPath)
  if (!Array.isArray(categories)) {
    if (categories !== null) fail(`${relPath}: トップレベルがカテゴリの配列ではない`)
    return []
  }

  return categories.map((category, index) => {
    const where = `${relPath} のカテゴリ[${index}]`
    if (typeof category?.id !== "string") fail(`${where}: id が無い`)
    const links = (category?.sections ?? []).flatMap((section, sectionIndex) =>
      (section?.links ?? []).map((link, linkIndex) =>
        toLink(link, routeBase, `${where}.sections[${sectionIndex}].links[${linkIndex}]`)
      )
    )
    return { id: category?.id, links: links.filter(Boolean) }
  })
}

/** cg/<unit>.yaml → [{ id, links }]（sections[].id 単位） */
const readCgYaml = (relPath) => {
  const routeBase = `/cg/${path.basename(relPath, ".yaml")}`
  const unit = loadYaml(relPath)
  if (!Array.isArray(unit?.sections)) {
    if (unit !== null) fail(`${relPath}: sections が配列ではない`)
    return []
  }

  return unit.sections.map((section, index) => {
    const where = `${relPath} のセクション[${index}]`
    if (typeof section?.id !== "string") fail(`${where}: id が無い`)
    const links = (section?.links ?? []).map((link, linkIndex) =>
      toLink(link, routeBase, `${where}.links[${linkIndex}]`)
    )
    return { id: section?.id, links: links.filter(Boolean) }
  })
}

/** 見出しから参照されうる YAML の全リスト */
const allYamlFiles = () => [
  ...Object.keys(ROUTE_BASE),
  ...readdirSync(path.join(CONTENT_DIR, "cg"))
    .filter((name) => name.endsWith(".yaml"))
    .map((name) => `cg/${name}`)
]

const yamlCache = new Map()

const readYaml = (relPath) => {
  if (!yamlCache.has(relPath)) {
    const groups = relPath.startsWith("cg/") ? readCgYaml(relPath) : readCategoryYaml(relPath)
    yamlCache.set(relPath, groups)
  }
  return yamlCache.get(relPath)
}

/** 見出しが指す YAML グループの links を、YAML の並び順で返す */
const resolveGroup = (yamlRef, id) => {
  const file = path.join(CONTENT_DIR, yamlRef)
  if (!existsSync(file)) return { error: `${yamlRef} が存在しない` }

  const groups = readYaml(yamlRef)
  if (id === undefined) {
    // id 指定なし＝ファイル全体（CG のユニット単位セクション）
    return { links: groups.flatMap((group) => group.links) }
  }
  const group = groups.find((candidate) => candidate.id === id)
  if (!group) return { error: `${yamlRef} に #${id} が無い` }
  return { links: group.links }
}

// ---------------------------------------------------------------------------
// ページの状態
// ---------------------------------------------------------------------------

const pageCache = new Map()

const pageInfo = (route) => {
  if (!pageCache.has(route)) {
    const file = path.join(ROUTES_DIR, route, "+page.svx")
    const info = existsSync(file)
      ? { exists: true, draft: /^draft:\s*true\s*$/m.test(readFileSync(file, "utf8")) }
      : { exists: false, draft: false }
    pageCache.set(route, info)
  }
  return pageCache.get(route)
}

/**
 * 既存の状態マーカーと frontmatter から、あるべき状態を決める。
 * `[x]` を新たに作ることも、消すこともしない。
 */
const resolveState = (previous, route, listFile) => {
  const { exists, draft } = pageInfo(route)
  if (!exists) {
    warn(`${listFile}: ${route} は YAML に slug があるが +page.svx が無い`)
    return previous ?? " "
  }
  if (previous === undefined) return draft ? "draft" : " "
  if (draft) {
    if (previous === "x") {
      warn(`${listFile}: ${route} は draft: true なのに [x]（記録を残すため書き換えない）`)
      return "x"
    }
    return "draft"
  }
  return previous === "draft" ? " " : previous
}

// ---------------------------------------------------------------------------
// タスクリストの照合
// ---------------------------------------------------------------------------

const renderItem = (item) =>
  item.kind === "page" ? `- [${item.state}] \`${item.route}\`` : `- [ページ未作成] ${item.title}`

const keyOf = (item) => (item.kind === "page" ? item.route : `title:${item.title}`)

const syncTasklist = (listFile) => {
  const absolute = path.join(ROOT, listFile)
  const original = readFileSync(absolute, "utf8")
  const lines = original.split("\n")

  /** 見出し行の位置（yaml 参照つきのものだけ処理する） */
  const output = []
  const changes = []
  const seenGroups = new Set()

  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const reference = line.startsWith("## ") ? HEADER_REF_RE.exec(line) : null
    output.push(line)
    index += 1
    if (!reference) continue

    const [, yamlRef, id] = reference
    seenGroups.add(id === undefined ? yamlRef : `${yamlRef}#${id}`)

    // この見出しの本文（次の見出しまで）を切り出す
    const bodyStart = index
    while (index < lines.length && !lines[index].startsWith("## ")) index += 1
    const body = lines.slice(bodyStart, index)

    const before = []
    let unparsable = false
    for (let offset = 0; offset < body.length; offset += 1) {
      const raw = body[offset]
      if (raw.trim() === "") continue
      const item = ITEM_RE.exec(raw)
      if (!item) {
        fail(`${listFile}:${bodyStart + offset + 1}: 一覧行として読み取れない: ${raw}`)
        unparsable = true
        continue
      }
      const [, state, route, title] = item
      before.push(route ? { kind: "page", state, route } : { kind: "draft", state, title })
    }

    const group = resolveGroup(yamlRef, id)
    if (group.error) {
      fail(`${listFile}: 見出し「${line}」の参照を解決できない（${group.error}）`)
    }
    if (unparsable || group.error) {
      output.push(...body)
      continue
    }

    const previousState = new Map(before.map((item) => [keyOf(item), item.state]))
    const after = group.links.map((link) =>
      link.kind === "page"
        ? {
            kind: "page",
            route: link.route,
            state: resolveState(previousState.get(link.route), link.route, listFile)
          }
        : { kind: "draft", title: link.title, state: "ページ未作成" }
    )

    const beforeKeys = before.map(keyOf)
    const afterKeys = after.map(keyOf)
    const beforeSet = new Set(beforeKeys)
    const afterSet = new Set(afterKeys)

    const label = line.replace(/^## /, "")
    for (const item of after) {
      if (!beforeSet.has(keyOf(item))) changes.push(`  [${label}] 追加  ${renderItem(item)}`)
    }
    for (const item of before) {
      if (!afterSet.has(keyOf(item)))
        changes.push(`  [${label}] 削除  ${renderItem({ ...item, state: item.state })}`)
    }
    for (const item of after) {
      const key = keyOf(item)
      const previous = previousState.get(key)
      if (previous !== undefined && previous !== item.state)
        changes.push(`  [${label}] 状態  ${key}: [${previous}] → [${item.state}]`)
    }
    const commonBefore = beforeKeys.filter((key) => afterSet.has(key))
    const commonAfter = afterKeys.filter((key) => beforeSet.has(key))
    if (commonBefore.join(" ") !== commonAfter.join(" "))
      changes.push(`  [${label}] 並び順を YAML に合わせた`)

    output.push("", ...after.map(renderItem))
    if (index < lines.length) output.push("")
  }

  // YAML にあるのに、そもそも見出しが無いグループを検出する（大分類やユニットの新設に気づくため）
  for (const yamlRef of allYamlFiles()) {
    const usesId = [...seenGroups].some((key) => key.startsWith(`${yamlRef}#`))
    if (usesId) {
      for (const group of readYaml(yamlRef)) {
        if (!seenGroups.has(`${yamlRef}#${group.id}`))
          warn(`${listFile}: ${yamlRef} #${group.id} を参照する見出しが無い`)
      }
    } else if (!seenGroups.has(yamlRef)) {
      warn(`${listFile}: ${yamlRef} を参照する見出しが無い`)
    }
  }

  let updated = output.join("\n")
  // 元ファイルの末尾改行を保つ
  updated = updated.replace(/\n*$/, original.endsWith("\n") ? "\n" : "")

  return { listFile, absolute, original, updated, changes }
}

// ---------------------------------------------------------------------------

const mode = process.argv.includes("--write") ? "write" : "check"
const results = TASKLISTS.map(syncTasklist)

if (errors.length > 0) {
  console.error("エラー（書き込みを中止した）:")
  for (const message of errors) console.error(`  ${message}`)
  process.exit(1)
}

for (const warning of warnings) console.warn(`警告: ${warning}`)

const dirty = results.filter((result) => result.original !== result.updated)

if (dirty.length === 0) {
  console.log("タスクリストは YAML と整合している。")
  process.exit(0)
}

for (const result of dirty) {
  console.log(`\n■ ${result.listFile}`)
  for (const change of result.changes) console.log(change)
}

if (mode === "write") {
  for (const result of dirty) writeFileSync(result.absolute, result.updated)
  console.log(`\n${dirty.length} 件のタスクリストを更新した。`)
  process.exit(0)
}

console.log("\n--write で書き込む。")
process.exit(1)
