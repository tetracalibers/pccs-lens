// @ts-check
import { visit } from "unist-util-visit"

/**
 * @typedef {import("mdast").Root} Root
 * @typedef {import("mdast").Code} Code
 */

/**
 * @typedef {object} Options
 * @property {(code: string, lang: string) => Promise<string | null>} [highlight]
 *   ハイライト済みの HTML を返す関数。対応していない言語のときは null を返す。
 */

/**
 * Svelte のテンプレートに素の HTML として置くためのエスケープ。
 * `{}` を残すと Svelte が式として解釈してしまうため、実体参照にする。
 * @param {string} str
 */
function escapeForSvelte(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;")
}

/**
 * `{@html `...`}` のテンプレートリテラルに埋め込むためのエスケープ。
 * @param {string} str
 */
function escapeTemplateLiteral(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")
}

/**
 * remark plugin: ` ```{lang}:{title} ` 形式のコードブロックを
 * <figure> でラップした「タイトル付きコードブロック」の HTML ノードに置換する。
 *
 * 例:
 *   ```ts:Three.js
 *   const scene = new Scene()
 *   ```
 *
 * 出力:
 *   <figure class="code-with-title is-code">
 *     <figcaption>Three.js</figcaption>
 *     {@html `<pre class="shiki">…</pre>`}
 *   </figure>
 *
 * mdsvex は remark プラグインを走らせたあとに `highlight_blocks` を掛けるため、
 * ここで `html` ノードへ置換したブロックは後段のハイライトの対象外になる。
 * そのため options.highlight を受け取り、このプラグイン自身でハイライトする。
 * shiki が知らない言語（`math` など）は null が返るので、素の <pre> にフォールバックする。
 *
 * mdsvex 内部の `escape_code` はハイライタ指定時にコードブロックを素通しするため
 * （`blocks: !!highlight`）、`<>{}` のエスケープもこのプラグインの責務。
 *
 * @param {Options} [options]
 */
export default function remarkCodeTitle(options = {}) {
  const highlight = options.highlight
  return async (/** @type {Root} */ tree) => {
    /** @type {Code[]} */
    const targets = []
    visit(tree, "code", (node) => {
      if (node.lang && node.lang.includes(":")) targets.push(node)
    })

    for (const node of targets) {
      const rawLang = /** @type {string} */ (node.lang)
      const sepIndex = rawLang.indexOf(":")
      const lang = rawLang.slice(0, sepIndex)
      const title = escapeForSvelte(rawLang.slice(sepIndex + 1))
      const highlighted = lang && highlight ? await highlight(node.value, lang) : null

      let body
      if (highlighted) {
        body = `{@html \`${escapeTemplateLiteral(highlighted)}\`}`
      } else {
        const langClass = lang ? ` class="language-${lang}"` : ""
        body = `<pre${langClass}><code${langClass}>${escapeForSvelte(node.value)}</code></pre>`
      }

      // 1 対 1 の置換なので、ノードの型と値を差し替えるだけでよい
      const htmlNode = /** @type {import("mdast").Html} */ (/** @type {unknown} */ (node))
      htmlNode.type = "html"
      htmlNode.value =
        `<figure class="code-with-title${highlighted ? " is-code" : ""}">` +
        `<figcaption>${title}</figcaption>` +
        body +
        `</figure>`
    }
  }
}
