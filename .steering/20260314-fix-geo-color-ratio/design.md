# 設計：アクセントカラー未選択時の幾何パターン配色比率の修正

## 原因分析

`geometric.ts` の `colorPool` は以下の比率でスロットを割り当てている：

```ts
const colorPool = [
  ...Array<string>(5).fill(c0), // 約 50%
  ...Array<string>(3).fill(c1), // 約 30%
  ...Array<string>(2).fill(c2), // 約 20%
]
```

| 引数 | c0 | c1 | c2 | base面積 | assort面積 |
|---|---|---|---|---|---|
| `[base, base, assort]`（修正前） | base | base | assort | 5+3=8スロット（80%） | 2スロット（20%） |
| `[base, assort, assort]`（修正後） | base | assort | assort | 5スロット（50%） | 3+2=5スロット（50%） |

`bauhaus.ts` も同様の3色構造（背景・c1・c2）を持つため、
`[base, assort, assort]` にすることでバウハウスパターンでもアソートカラーが背景以外の全図形に使われ、均等な印象になる。

## 変更するファイル

```
app/src/routes/patterns/[theme]/+page.svelte
```

## 変更内容

```ts
// 修正前
const geoColors = $derived<[string, string, string]>(
  showAccent && accentPCCS
    ? [basePCCS.hex, assortPCCS.hex, accentPCCS.hex]
    : [basePCCS.hex, basePCCS.hex, assortPCCS.hex]
)

// 修正後
const geoColors = $derived<[string, string, string]>(
  showAccent && accentPCCS
    ? [basePCCS.hex, assortPCCS.hex, accentPCCS.hex]
    : [basePCCS.hex, assortPCCS.hex, assortPCCS.hex]
)
```

## 面積比率まとめ

| 状態 | colors引数 | base | assort | accent |
|---|---|---|---|---|
| アクセントなし | `[base, assort, assort]` | 約50% | 約50% | — |
| アクセントあり | `[base, assort, accent]` | 約50% | 約30% | 約20% |
