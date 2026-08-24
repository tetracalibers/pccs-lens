/** 基本領域の模様を SVG にする。二面体群の変換は <use> で並べる */

import { BACKGROUND } from './palettes.js'

const num = (x) => String(Math.round(x * 100) / 100)

export function renderElement(el, colors) {
  const color = colors[el.colorIndex]

  if (el.kind === 'circle') {
    return `<circle cx="${num(el.cx)}" cy="${num(el.cy)}" r="${num(el.r)}" fill="${color}"/>`
  }

  if (el.kind === 'stroke') {
    return (
      `<path d="${el.d}" fill="none" stroke="${color}"` +
      ` stroke-width="${num(el.width)}"` +
      ` stroke-linecap="${el.cap ?? 'round'}"` +
      ` stroke-linejoin="${el.join ?? 'round'}"/>`
    )
  }

  // 隣り合うコピーの継ぎ目に出るアンチエイリアスの隙間を、同色のヘアラインで埋める
  const hairline = el.hairline
    ? ` stroke="${color}" stroke-width="0.7" stroke-linejoin="${el.join ?? 'round'}"`
    : ''
  return `<path d="${el.d}" fill="${color}"${hairline}/>`
}

export function renderSVG({ domain, motif, colors, size, seed, exclude }) {
  const center = size / 2

  // 何を消した絵なのかを後から辿れるようにコメントに残す
  const excluded = exclude?.size ? ` / exclude: ${[...exclude].join(',')}` : ''

  const motifBody = motif.elements
    .map((el) => `      ${renderElement(el, colors)}`)
    .join('\n')

  // 二面体群の 2n 個の合同変換で基本領域の模様をコピーする
  const copies = domain.transforms
    .map((t) => `    <use href="#motif" xlink:href="#motif" transform="${t}"/>`)
    .join('\n')

  // 中心は不動点なのでコピーせず 1 個だけ描く
  const centerElement = motif.center
    ? `\n    ${renderElement(motif.center, colors)}`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- dihedral group D${domain.n} / colors: ${colors.join(' ')} / seed: ${seed}${excluded} -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
  <defs>
    <g id="motif">
${motifBody}
    </g>
  </defs>
  <g transform="translate(${num(center)},${num(center)})">
${copies}${centerElement}
  </g>
</svg>
`
}

function renderCard(entry) {
  const swatches = entry.colors
    .map((c) => `<i style="background:${c}"></i>`)
    .join('')
  return `      <figure>
        <img src="./${entry.filename}" alt="${entry.filename}" loading="lazy">
        <figcaption>
          <strong>${entry.colors.length}色</strong> / ${entry.label ?? entry.section} / seed ${entry.seed}
          <span class="swatches">${swatches}</span>
        </figcaption>
      </figure>`
}

export function renderIndexHTML(title, entries) {
  // 節（対称性の次数 D_n や壁紙群）ごとに分ける。
  // 1 回の実行で複数の対称性を出したときに見比べやすくするため。
  const bySection = new Map()
  for (const e of entries) {
    if (!bySection.has(e.section)) bySection.set(e.section, [])
    bySection.get(e.section).push(e)
  }

  const sections = [...bySection.entries()]
    .map(([name, group]) => {
      const heading = bySection.size > 1 ? `    <h2>${name}</h2>\n` : ''
      return `${heading}    <div class="grid">\n${group.map(renderCard).join('\n')}\n    </div>`
    })
    .join('\n')

  // 枚数が多いときはサムネイルを小さくして一覧性を優先する
  const thumb = entries.length > 12 ? 250 : 320

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { margin: 0; padding: 24px; background: #2a2a2a; color: #eee;
         font-family: system-ui, sans-serif; }
  h1 { font-size: 16px; font-weight: 600; margin: 0 0 20px; }
  h1 span { color: #999; font-weight: 400; margin-left: 8px; }
  h2 { font-size: 14px; font-weight: 600; margin: 28px 0 12px;
       padding-bottom: 6px; border-bottom: 1px solid #444; }
  .grid { display: flex; flex-wrap: wrap; gap: 20px; }
  figure { margin: 0; }
  img { display: block; width: ${thumb}px; height: auto; background: #fff; }
  figcaption { margin-top: 6px; font-size: 12px; display: flex;
               flex-wrap: wrap; align-items: center; gap: 6px; }
  .swatches { display: inline-flex; gap: 2px; }
  .swatches i { width: 11px; height: 11px; display: block; }
</style>
</head>
<body>
<main>
    <h1>${title}<span>${entries.length} 枚</span></h1>
${sections}
</main>
</body>
</html>
`
}
