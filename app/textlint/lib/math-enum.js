/**
 * 「記号を並べるときは1つのインライン数式にまとめ、カンマで区切る」
 * （writing-guides/math-notation-guide.md）の検出を、syntax パスと advisory パスで共有する。
 *
 * 中黒 `・` で直接繋がれたインライン数式の並び（`$$P_0$$・$$P_1$$`）を集め、
 * **自動修正してよいものだけ**に印を付ける。
 *
 * 記号の並列（`$$P_0$$・$$P_1$$ と、`）と語句の並列（`$$x$$ 方向に $$a$$・$$y$$ 方向に $$b$$ 進む`）は
 * 字面が同じで、後者はまとめてはいけない（ガイドの例外）。並びの**直後**を見て、助詞・約物・行末が
 * 続くときだけ自動修正の対象にする。語句の並列では、中黒のあとの記号に続くのが「方向に」のような
 * 自立語になるので、この条件で振り分けられる。自立語が続くものは判断待ちとして advisory が報告する。
 *
 * 取りこぼす側に倒している。`$$R$$・$$G$$・$$B$$ 各成分` は記号の並列だが、自立語（`各成分`）が
 * 続くので自動修正せず advisory に回る。本文を壊すより取りこぼすほうを選ぶ。
 */

import { isSpaceExemptChar } from "./svx.js"

/** 中黒で繋がれたインライン数式の並び（2つ以上） */
const MATH_ENUM_CHAIN = /\$\$[^\n$]+\$\$(?:[ ]?・[ ]?\$\$[^\n$]+\$\$)+/g

/** 中黒とその前後のスペース（並びを項に割るための区切り） */
const SEPARATOR = /[ ]?・[ ]?/

/**
 * 並びの直後に来てよい助詞の先頭文字。
 * これらが続くなら、並び全体が1つの句として扱われている（＝記号の並列）と見なせる。
 */
const PARTICLE_HEAD = /[はがをのにへとでもやかよ]/

/**
 * 中黒で繋がれたインライン数式の並びを集める。
 * @param {string} text 元のテキスト（直後の文字を読むため、マスク前のものを渡す）
 * @param {string} masked マスク済みのテキスト（コード・見出しなどを潰したもの）
 * @returns {Array<{ start: number, end: number, source: string, items: string[], fixable: boolean, fixed: string }>}
 */
export const collectMathEnumerations = (text, masked) => {
  const enumerations = []

  for (const matched of masked.matchAll(MATH_ENUM_CHAIN)) {
    const start = matched.index
    const end = start + matched[0].length
    const items = matched[0].split(SEPARATOR).map((item) => item.replace(/^\$\$|\$\$$/g, "").trim())

    // 直後の文字（スペース1つは読み飛ばす）
    const next = text[end] === " " ? text[end + 1] : text[end]
    const followedByParticle = next !== undefined && PARTICLE_HEAD.test(next)

    const fixable =
      items.every((item) => item !== "" && !item.includes(",")) &&
      (followedByParticle || isSpaceExemptChar(next))

    enumerations.push({
      start,
      end,
      source: matched[0],
      items,
      fixable,
      fixed: `$$${items.join(", ")}$$`
    })
  }

  return enumerations
}
