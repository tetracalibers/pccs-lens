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

export function renderSVG({ domain, motif, colors, size, seed }) {
  const center = size / 2

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
  <!-- dihedral group D${domain.n} / colors: ${colors.join(' ')} / seed: ${seed} -->
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

export function renderIndexHTML(title, entries) {
  const cards = entries
    .map(
      (e) => `    <figure>
      <img src="./${e.filename}" width="320" height="320" alt="${e.filename}">
      <figcaption>
        <strong>${e.colors.length}色</strong> / D${e.n} / seed ${e.seed}
        <span class="swatches">${e.colors
          .map((c) => `<i style="background:${c}"></i>`)
          .join('')}</span>
      </figcaption>
    </figure>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { margin: 0; padding: 24px; background: #2a2a2a; color: #eee;
         font-family: system-ui, sans-serif; }
  main { display: flex; flex-wrap: wrap; gap: 24px; }
  figure { margin: 0; }
  img { display: block; width: 320px; height: auto; background: #fff; }
  figcaption { margin-top: 8px; font-size: 13px; display: flex;
               align-items: center; gap: 8px; }
  .swatches { display: inline-flex; gap: 2px; }
  .swatches i { width: 12px; height: 12px; display: block; }
</style>
</head>
<body>
<main>
${cards}
</main>
</body>
</html>
`
}
