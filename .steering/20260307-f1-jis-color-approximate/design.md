# 設計：F1-4 JIS慣用色名の近似表示

## 実装アプローチ

既存の `findClosestPccs` 関数と同パターンで `findClosestJis` 関数を追加し、`/approximate` ページに新セクションを追加する。

## 変更ファイル

### 1. `app/src/lib/data/types.ts`

`JISApproximateResult` 型を追加する。

```ts
export type JISApproximateResult = {
  color: JISColor
  deltaE: number
}
```

### 2. `app/src/lib/color/approximate.ts`

`findClosestJis` 関数を追加する。

```ts
export function findClosestJis(
  inputHex: string,
  colors: JISColor[],
  topN: number
): JISApproximateResult[]
```

- `findClosestPccs` と同じCIEDE2000ベースの実装
- `JISColor` をインポートして処理

### 3. `app/src/routes/approximate/+page.svelte`

- `findClosestJis` をインポート
- `jisColors` データをインポート
- `JIS_TOP_N = 4` 定数を定義
- `$derived` で JIS 近似結果を算出
- 「JIS慣用色名 近似結果（上位4件）」セクションを追加
  - 各カード：スウォッチ・慣用色名・読み・出題級バッジ

## 出題級の表示

| examLevel | 表示 |
|---|---|
| 3 | `3級` |
| 2 | `2級` |
| null | 非表示 |
