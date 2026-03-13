# design.md — `/patterns`ページ市松模様の色選択アルゴリズム改良

## 実装アプローチ

### 新ファイル: `app/src/lib/patterns/checkerboard-rules.ts`

市松模様専用の `effectiveRules` を定義する新ファイルを作成する。

- 型は既存の `SuggestOutput` を使用
- `CHECKERBOARD_RULES` として各テーマの `base` / `assort` ルールをマップで定義
- アイデアメモの定義をそのまま反映する

```ts
type CheckerboardRule = {
  base: SuggestOutput
  assort: SuggestOutput
}

export const CHECKERBOARD_RULES: Record<ThemeId, CheckerboardRule> = { ... }
```

### 変更ファイル: `app/src/routes/patterns/+page.svelte`

`getCheckerboardColors` 関数を修正する。

**変更前：**
`computeSuggest` → `pickRandomSuggest` → `lookupPCCSColor`

**変更後：**
`CHECKERBOARD_RULES[themeId]` → `pickRandomSuggest` → `lookupPCCSColor`

`pickRandomSuggest` はそのまま再利用できる（`SuggestOutput` を受け取るため）。

### 同色防止ロジック

不要。`effectiveRules` の設計上、ベースとアソートで同色が選ばれるパターンは存在しない。

- 有彩色同士のテーマは色相範囲が重複しない（elegant, casual, classic, warm-natural, romantic）
- 有彩色 vs 無彩色のテーマは定義で明確に分離されている（clear, chic, dynamic, fresh-natural, modern）

## 変更するコンポーネント・ファイル

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `app/src/lib/patterns/checkerboard-rules.ts` | 新規作成 | 市松模様専用ルール定義 |
| `app/src/routes/patterns/+page.svelte` | 修正 | `getCheckerboardColors` の実装変更 |

## 影響範囲の分析

- **影響なし**: `themes.ts`、`suggest.ts`、`lookup.ts`、`types.ts`
- **影響なし**: `/patterns/[theme]` 個別ページ
- **影響あり**: `/patterns` トップページの市松模様の色（見た目の変化）

## データ構造

アイデアメモで定義された `effectiveRules`（全10テーマ）をそのまま使用。

各テーマのルール内容：

| テーマ | base | assort |
|---|---|---|
| elegant | 色相20-23・ltgトーン | 色相24,1・ltトーン |
| casual | 色相4-6・ltトーン | 色相10-18・bトーン |
| classic | 色相1-6・dk/dkgトーン | 色相11-16・dpトーン |
| clear | 色相14-19・lt/pトーン | 無彩色（W） |
| chic | 無彩色（dkGy） | 色相20-16・g/dkトーン |
| dynamic | 無彩色（Bk） | 色相2,5,8,12,18・b/s/vトーン |
| warm-natural | 色相4-7・sf/dトーン | 色相10-12・ltg/sf/dトーン |
| fresh-natural | 色相9-16・lt/pトーン | 無彩色（W） |
| modern | 無彩色（ltGy） | 色相16-18・d/s/vトーン |
| romantic | 色相24,1・pトーン | 色相3,4・ltトーン |
