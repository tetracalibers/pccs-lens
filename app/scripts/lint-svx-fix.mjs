#!/usr/bin/env node
/**
 * 記事本文（`.svx`）の記法・表記揺れの自動修正を、**変化が無くなるまで**繰り返す。
 *
 *   npm run lint:svx:fix                                  # 全記事（ベースラインが効く）
 *   npm run lint:svx:fix -- src/routes/cg/basics/xxx/+page.svx
 *   npm run lint:svx:fix -- --no-baseline <path>          # ベースラインを無効にする
 *   npm run lint:svx:fix -- --syntax-only                # 表記揺れ（prh）を当てない
 *   npm run lint:svx:fix -- --max-passes 8
 *
 * **1パスでは収束しない。** ルールの自動修正が別のルールの違反を新たに生むためである。
 * 例: `輝度 255 の白` → 数字ルールが `` 輝度 `255` の白 `` にする → インラインコードの前後に
 * スペースが生まれて `svx-no-space-around-code` の違反が4件発生する → 2パス目で
 * `` 輝度`255`の白 `` に収束する。実測では全記事で 665件 → 24件 → 21件（収束）だった。
 *
 * 収束の判定は対象ファイルの中身が変わったかで行う（textlint の残件数ではなく、
 * 「もう書き換わらない」ことを見る）。上限まで振動したら、収束しなかった旨を出して exit 1。
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_GLOB = "src/routes/**/+page.svx"

const argv = process.argv.slice(2)
const options = { baseline: true, notation: true, maxPasses: 5 }
const targets = []
for (let index = 0; index < argv.length; index += 1) {
  const argument = argv[index]
  if (argument === "--no-baseline") options.baseline = false
  else if (argument === "--syntax-only") options.notation = false
  else if (argument === "--max-passes") options.maxPasses = Number(argv[(index += 1)])
  else targets.push(argument)
}
const patterns = targets.length > 0 ? targets : [DEFAULT_GLOB]

/** 対象ファイルの実体を集める（ハッシュを取るため。パターンは textlint 側にもそのまま渡す） */
const collect = (pattern) => {
  const files = []
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === "+page.svx") files.push(path.relative(APP, full))
    }
  }
  // glob なら `**` より前の実在するディレクトリから辿る。ディレクトリ指定もそのまま辿る
  const base = pattern.split("*")[0].replace(/\/[^/]*$/, "")
  const root = path.join(APP, base === "" ? "src/routes" : base)
  try {
    if (statSync(root).isDirectory()) {
      walk(root)
      return files
    }
  } catch {
    /* 実在しないパスは下でそのまま返し、textlint 側のエラーに任せる */
  }
  return [pattern]
}

const files = [...new Set(patterns.flatMap(collect))].filter((file) => {
  try {
    return statSync(path.join(APP, file)).isFile()
  } catch {
    return false
  }
})

if (files.length === 0) {
  console.error(`対象のファイルが見つからない: ${patterns.join(" ")}`)
  process.exit(1)
}

const digest = () => {
  const hash = createHash("sha1")
  for (const file of files.toSorted()) hash.update(readFileSync(path.join(APP, file)))
  return hash.digest("hex")
}

const run = (args) =>
  spawnSync("npx", ["textlint", ...args, ...patterns], { cwd: APP, encoding: "utf8" })

const baselineArgs = options.baseline ? [] : ["--ignore-path", "/dev/null"]

/** 残っている指摘のうち、自動修正できるものの件数 */
const fixableRemaining = (args) => {
  const result = run([...args, "--format", "json"])
  try {
    return JSON.parse(result.stdout)
      .flatMap((file) => file.messages)
      .filter((message) => message.fix).length
  } catch {
    return 0
  }
}

/**
 * 変化が無くなるまで `--fix` を当てる。
 *
 * 収束の判定は「中身が変わらなかった」だけでは足りない。**自動修正できる指摘が残っていない**
 * ことも確かめる（片方だけで打ち切ると、まだ直せる指摘を残したまま「収束した」と報告する）。
 */
const converge = (label, args) => {
  let previous = digest()
  for (let pass = 1; pass <= options.maxPasses; pass += 1) {
    run([...args, "--fix"])
    const current = digest()
    const fixable = fixableRemaining(args)
    if (current === previous && fixable === 0) {
      console.log(`${label}: ${pass}パスで収束した。`)
      return true
    }
    const reason =
      current === previous ? `自動修正できる指摘が${fixable}件残っている` : "書き換えた"
    console.log(`${label}: ${pass}パス目で${reason}。もう1パス当てる。`)
    previous = current
  }
  console.error(`${label}: ${options.maxPasses}パスでも収束しなかった。`)
  return false
}

let converged = converge("記法", ["--rulesdir", "textlint/rules", ...baselineArgs])
if (options.notation)
  converged =
    converge("表記揺れ", ["--config", ".textlintrc.notation.json", "--ignore-path", "/dev/null"]) &&
    converged

// 残件を報告する（自動修正できない指摘が残ることはある）
const remaining = run(["--rulesdir", "textlint/rules", ...baselineArgs])
if (remaining.status !== 0) {
  console.log("\n自動修正で解消しなかった記法の指摘:")
  console.log(remaining.stdout.trim())
}

process.exit(converged && remaining.status === 0 ? 0 : 1)
