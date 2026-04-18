# 設計: JIS慣用色へのPCCS近似値追加

## 実装アプローチ

1. **型定義を先に更新**する（`JISColor` に `approximatePccs` を追加）
2. **事前計算スクリプト** `app/scripts/add-pccs-approximations.mjs` を新規作成:
   - 追加依存なし（`.mjs` + `fs` + 既存の `chroma-js`）
   - `PCCS_ALL` 相当のデータを5つのPCCSジャイソンから結合
   - `jis_colors.json` を読み込み、各エントリに `approximatePccs` を計算して付与
   - 結果を同ファイルへ上書き保存
3. **`package.json` に実行用 npm script** を追加（`data:pccs-approx`）
4. スクリプトを実行して `jis_colors.json` を更新
5. `npm run check` / `lint` / `format` / `test` で検証

## アルゴリズム詳細

```
for each JIS entry:
  candidates = PCCS_ALL
    .map(p => ({ notation: p.notation, deltaE: chroma.deltaE(jis.hex, p.hex) }))
    .sort((a, b) => a.deltaE - b.deltaE)

  result = [candidates[0]]  // 1位は無条件採用

  const firstDeltaE = candidates[0].deltaE
  for (let i = 1; i < 3 && i < candidates.length; i++) {
    const c = candidates[i]
    if (c.deltaE > 10) break
    if (c.deltaE > firstDeltaE * 1.5) break
    result.push(c)
  }

  jis.approximatePccs = result.map(r => ({
    notation: r.notation,
    deltaE: Number(r.deltaE.toFixed(2))
  }))
```

## 変更ファイル

### 新規

- **`app/scripts/add-pccs-approximations.mjs`**
  - Node.js ESM スクリプト
  - `fs/promises` で JSON 読み書き
  - `chroma-js` で ΔE 計算
  - `import { readFile, writeFile } from "node:fs/promises"` / `import chroma from "chroma-js"`

### 更新

- **`app/src/lib/data/types.ts`**
  - `JISColor` に `approximatePccs` フィールド追加（タプル型で最低1件を型レベルで保証）

```ts
export type JISColor = {
  name: string
  reading: string
  hex: string
  examLevel: 2 | 3 | null
  munsell: string
  approximatePccs: [
    { notation: string; deltaE: number },
    ...Array<{ notation: string; deltaE: number }>
  ] // 最低1件、最大3件
}
```

- **`app/src/lib/data/jis_colors.json`**
  - 全130エントリに `approximatePccs` が追加される（スクリプトによる自動更新）

- **`app/package.json`**
  - `scripts` に追加:
    ```json
    "data:pccs-approx": "node scripts/add-pccs-approximations.mjs && prettier --write src/lib/data/jis_colors.json"
    ```
  - スクリプト本体は素のJSONを出力し、整形は後段の `prettier --write` に委譲する

## データ構造（出力例）

```json
{
  "name": "桜色",
  "reading": "さくらいろ",
  "hex": "#fdeeef",
  "examLevel": 3,
  "munsell": "10RP 9/2.5",
  "approximatePccs": [
    { "notation": "p24", "deltaE": 2.13 },
    { "notation": "p23", "deltaE": 3.01 }
  ]
}
```

## 影響範囲

`JISColor` 型を参照する既存コードは以下のみ（grep 済み）:

| ファイル | 利用箇所 | 影響 |
| --- | --- | --- |
| `app/src/lib/data/types.ts:13` | 型定義本体 | 変更対象 |
| `app/src/lib/color/approximate.ts:1,21` | `findClosestJis` の引数型 | 互換（構造部分は変更なし、プロパティ追加のみ） |
| `app/src/routes/approximate/+page.svelte:7,15` | `jisColors as JISColor[]` | 互換（JSONに新フィールドが追加されるだけ） |

**影響は破壊的ではない**（フィールド追加のみ）。`findClosestJis` の実装は `color.hex` しか参照しないため、ロジック変更は不要。

## 再利用する既存資産

- 色差計算: `app/src/lib/color/approximate.ts:4` `findClosestPccs` — 実装参考
- PCCS色統合: `app/src/lib/data/pccs.ts:9-13` `PCCS_CARD_199` / `PCCS_ALL` — 結合方法参考
- 型: `app/src/lib/data/types.ts` の `PCCSColor` / `JISColor`

## 冪等性とスクリプトの挙動

- スクリプトは `jis_colors.json` の各エントリの **`approximatePccs` フィールドを毎回上書き**する（既存値の有無にかかわらず再計算）
- 入力となる `hex` と `PCCS_ALL` のデータが変わらない限り、同じ結果が得られる
- 出力は最低限の `JSON.stringify(data)` でファイル書き出し（**整形はスクリプトで行わない**）
- 整形は npm script の後段で `prettier --write src/lib/data/jis_colors.json` が担当する

## エラーハンドリング

- `PCCS_ALL` のロードに失敗したら throw（スクリプトは失敗で終了）
- `chroma.deltaE` が NaN を返すケース（不正なHEX）には、事前に `chroma.valid()` 相当のチェックは入れず、現状の JIS データは全て有効なHEXである前提で進める（既存データの信頼を前提）
