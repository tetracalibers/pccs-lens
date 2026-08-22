// 走査結果をターミナルで確認するための補助コマンド。
//
//   npm run scan            … 集計サマリを表示
//   npm run scan -- --json  … グラフデータ（JSON）をそのまま出力

import { scanGraph } from "./index.mjs"

const graph = scanGraph()

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(graph, null, 2)}\n`)
} else {
  const { stats } = graph
  const lines = [
    `対象ページ            ${stats.pages}`,
    `  本文なし（赤）      ${stats.empty}`,
    `  draft（黄）         ${stats.draft}`,
    `  公開済              ${stats.published}`,
    `  孤立                ${stats.isolated}`,
    `リンク切れ            ${stats.broken}`,
    `所属不明              ${stats.unresolvedUnits}`,
    `ユニット（囲み）      ${graph.units.length}`,
    `リンク（束ねる前）    ${stats.rawLinks}`,
    `ユニークなリンク先    ${stats.uniqueTargets}`,
    `自己リンク            ${stats.selfLinks.length}`,
    `エッジ（束ねた後）    ${stats.edges}`,
    "",
    ...graph.groups.map(
      (group) =>
        `${group.label}（${group.pageCount}）  本文なし ${stats.byGroup[group.id].empty} / draft ${stats.byGroup[group.id].draft} / 公開済 ${stats.byGroup[group.id].published}`
    )
  ]
  process.stdout.write(`${lines.join("\n")}\n`)
}
