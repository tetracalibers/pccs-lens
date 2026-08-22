// ユニット（囲みの単位）の定義を app の YAML から読み込む。
//
// 色系（色の理論・色の活用分野）はルートがフラット（`/color-theory/<slug>/`）なので、
// どのユニットに属するかは YAML のカテゴリから引くしかない。
// CG はルート自体が `/cg/<unit>/<slug>/` と階層になっているので、パスから決まる。

import fs from "node:fs"
import path from "node:path"
import { parse as parseYaml } from "yaml"
import { CG_UNITS_DIR, CONTENT_PAGES_DIR } from "./config.mjs"

/**
 * @typedef {object} UnitDef
 * @property {string} id 大分類をまたいで一意な id（`"cg:modeling"`）。囲み（compound node）の id になる
 * @property {string} group 大分類 id
 * @property {string} unitId 大分類内での id（YAML のカテゴリ `id`、または CG のユニット slug）
 * @property {string} label 表示名
 */

/** 大分類とユニット内 id から、グラフ上で一意な囲み id を作る。 */
export const unitKey = (group, unitId) => `${group}:${unitId}`

/**
 * 色系の YAML（カテゴリの配列）を読む。
 *
 * @param {string} group 大分類 id（`"color-theory"` / `"color-fields"`）
 * @returns {{ units: UnitDef[], unitBySlug: Map<string, string> }} `unitBySlug` は slug → 囲み id
 */
const readCategoryUnits = (group) => {
  const file = path.join(CONTENT_PAGES_DIR, `${group}.yaml`)
  const categories = parseYaml(fs.readFileSync(file, "utf8")) ?? []

  /** @type {UnitDef[]} */
  const units = []
  /** @type {Map<string, string>} */
  const unitBySlug = new Map()

  for (const category of categories) {
    const id = unitKey(group, category.id)
    units.push({ id, group, unitId: category.id, label: category.title })

    for (const section of category.sections ?? []) {
      for (const link of section.links ?? []) {
        // `slug` を持つものが実ページ。`title` + `grades` は一覧上の下書きリンクなので無視する。
        if (typeof link?.slug === "string") unitBySlug.set(link.slug, id)
      }
    }
  }

  return { units, unitBySlug }
}

/**
 * CG のユニット YAML（1 ファイル = 1 ユニット）を読む。ファイル名がルートのセグメントと一致する。
 *
 * @returns {UnitDef[]}
 */
const readCgUnits = () =>
  fs
    .readdirSync(CG_UNITS_DIR)
    .filter((name) => name.endsWith(".yaml"))
    .sort()
    .map((name) => {
      const unitId = name.replace(/\.yaml$/, "")
      const data = parseYaml(fs.readFileSync(path.join(CG_UNITS_DIR, name), "utf8")) ?? {}
      return { id: unitKey("cg", unitId), group: "cg", unitId, label: data.title ?? unitId }
    })

/**
 * 全ユニット定義と、色系の slug → ユニットの対応表を読み込む。
 *
 * ここで返すのは「YAML に定義されている全ユニット」。ページが 0 件のユニットを落とすのは
 * ページを数えたあと（index.mjs）で行う。
 *
 * @returns {{ units: Map<string, UnitDef>, unitBySlug: Map<string, Map<string, string>> }}
 */
export const loadUnits = () => {
  const colorTheory = readCategoryUnits("color-theory")
  const colorFields = readCategoryUnits("color-fields")
  const cg = readCgUnits()

  /** @type {Map<string, UnitDef>} */
  const units = new Map()
  for (const unit of [...colorTheory.units, ...colorFields.units, ...cg]) {
    units.set(unit.id, unit)
  }

  return {
    units,
    unitBySlug: new Map([
      ["color-theory", colorTheory.unitBySlug],
      ["color-fields", colorFields.unitBySlug]
    ])
  }
}
