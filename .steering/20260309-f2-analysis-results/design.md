# 設計：F2 セクション3 配色分析結果

## 実装アプローチ

### 新規ファイル

#### `app/src/lib/color/analyze.ts`
配色分析ロジック。`PCCSColor[]` を受け取り、当てはまる `AnalysisCard[]` を返す。

```ts
type AnalysisCard = {
  id: string        // 一意識別子（例: 'hue-relation-same'）
  title: string     // カードタイトル
  description: string  // 解説文
  category: string  // カテゴリタグ（例: '色相の関係'）
}

export function analyzeColors(colors: PCCSColor[]): AnalysisCard[]
```

#### `app/src/lib/components/ColorAnalysisResults.svelte`
カードグリッドUIコンポーネント。

```ts
// Props
{ displayedPCCSList: PCCSColor[] }
```

### 変更ファイル

#### `app/src/routes/analyze/+page.svelte`
`visualization-section` の下に `<ColorAnalysisResults {displayedPCCSList} />` を追加。

---

## データ構造・ロジック設計

### 色相差の計算

```ts
function hueDiff(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2)
  return Math.min(d, 24 - d)  // 0〜12の最短距離
}
```

### トーン明度ランク（harmony判定用）

トーン概念図上のy座標（ROW_STEP単位）に基づく明度ランク（小さいほど明るい）:

| ランク | トーン/無彩色 |
|---|---|
| 0 | W |
| 0.5 | p, lt |
| 1.0 | b, ltGy |
| 1.5 | ltg, sf |
| 2.0 | v, s, mGy |
| 2.5 | g, d |
| 3.0 | dp, dkGy |
| 3.5 | dk, dkg |
| 4.0 | Bk |

```ts
function toneRank(color: PCCSColor): number
```

### トーン8方向隣接マップ

`docs/color-analysis-rules.md` の例と8方向グリッドから導出した隣接マップ（固定値）：

```ts
const TONE_ADJACENCY: Record<string, string[]> = {
  v:   ['b', 'dp'],
  b:   ['v', 'lt', 'sf'],
  lt:  ['p', 'b', 'ltg', 'sf'],
  dp:  ['v', 'd', 'dk'],
  d:   ['sf', 'dk', 'dp', "ltg", "g"],
  dk:  ['d', 'dp', 'g', "dkg"],
  sf:  ['lt', 'b', 'ltg', 'd', 'p', 'g'],
  p:   ['lt', 'ltg', 'sf'],
  ltg: ['p', 'lt', 'sf', 'g', "d"],
  g:   ['ltg', 'sf', 'dkg', "d", "dk"],
  dkg: ['g', "d", "dk"],
}
```

### トーン関係判定

```ts
function toneRelation(t1: string, t2: string): 'same' | 'similar' | 'contrast'
// same: t1 === t2
// similar: TONE_ADJACENCY[t1].includes(t2)
// contrast: それ以外
```

無彩色同士の場合は `achromaticBucket` を用いて同様に判定（W/ltGy/mGy/dkGy/Bk間の隣接は縦1段差を「類似」とする）。

### ハーモニー判定（2色のみ）

```ts
function hueDistTo(h: number, target: number): number {
  const d = Math.abs(h - target)
  return Math.min(d, 24 - d)
}

// hue 8 = 黄、hue 20 = 紫
function isYellowSide(h: number): boolean {
  return hueDistTo(h, 8) < hueDistTo(h, 20)
}
```

- 2色ともに有彩色かつ「一方が黄側・他方が紫側」と明確に分類できる場合のみ判定
- 黄側の色のtoneRank < 紫側の色のtoneRank → ナチュラルハーモニー
- 黄側の色のtoneRank > 紫側の色のtoneRank → コンプレックスハーモニー
- rankが等しい場合は判定しない

### 色相環分割系の判定

有彩色のみを対象に、色相番号を昇順ソートして隣接差分を算出。
各差分が期待値±2の範囲内かを検証する。

スプリットコンプリメンタリーは3色固定構成:
1. 全3色の中で最も他2色との色相差が大きい色を「主色」とする
2. 残り2色（副色）が主色の補色（差11〜12）の両隣（差1〜2）にあるか確認

---

## カードカテゴリとカード一覧

| カテゴリ | ID | タイトル | 表示条件 |
|---|---|---|---|
| 色相の関係 | hue-same | 同一色相 | 2色のみ |
| 色相の関係 | hue-adjacent | 隣接色相 | 2色のみ |
| 色相の関係 | hue-similar | 類似色相 | 2色のみ |
| 色相の関係 | hue-medium | 中差色相 | 2色のみ |
| 色相の関係 | hue-contrast | 対照色相 | 2色のみ |
| 色相の関係 | hue-complement | 補色色相 | 2色のみ |
| トーンの関係 | tone-same | 同一トーン | 2色のみ |
| トーンの関係 | tone-similar | 類似トーン | 2色のみ |
| トーンの関係 | tone-contrast | 対照トーン | 2色のみ |
| 色相の自然連鎖 | harmony-natural | ナチュラルハーモニー | 2色のみ |
| 色相の自然連鎖 | harmony-complex | コンプレックスハーモニー | 2色のみ |
| 配色技法 | tech-dominant-color | ドミナントカラー | 2色以上 |
| 配色技法 | tech-dominant-tone | ドミナントトーン | 2色以上 |
| 配色技法 | tech-tone-on-tone | トーンオントーン | 2色以上 |
| 配色技法 | tech-tonal | トーナル | 2色以上 |
| 配色技法 | tech-camaieu | カマイユ | 2色以上 |
| 配色技法 | tech-faux-camaieu | フォカマイユ | 2色以上 |
| 配色技法 | tech-bicolor | ビコロール | 2色のみ |
| 配色技法 | tech-tricolor | トリコロール | 3色のみ |
| 色相環の分割 | div-dyad | ダイアード | 2色のみ |
| 色相環の分割 | div-triad | トライアド | 3色のみ |
| 色相環の分割 | div-split-comp | スプリットコンプリメンタリー | 3色のみ |
| 色相環の分割 | div-tetrad | テトラード | 4色のみ |
| 色相環の分割 | div-pentad | ペンタード | 5色のみ |
| 色相環の分割 | div-hexad | ヘクサード | 6色のみ |

---

## UIレイアウト（ColorAnalysisResults.svelte）

```
<section>
  <h2>配色の分析</h2>
  <div class="card-grid">
    {#each cards as card}
      <div class="analysis-card">
        <span class="category-tag">{card.category}</span>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>
    {/each}
  </div>
  <!-- cards が空の場合 -->
  <p class="empty">該当なし</p>
</section>
```

- カードグリッドは `auto-fill` の複数列レイアウト
- カテゴリタグは色分けして視覚的に区別する
