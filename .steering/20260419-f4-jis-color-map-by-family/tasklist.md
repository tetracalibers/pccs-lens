# タスクリスト: F4 慣用色名比較マップ（色みごとのページ）

## 凡例

- `[ ]` 未着手
- `[x]` 完了

## タスク

### 1. データアクセサ拡張

- [x] `app/src/lib/data/jis-colors.ts` に `isColorFamily(value: string): value is ColorFamily` 型ガードを追加
  - 完了条件: `FAMILY_IDS` を経由して判定でき、既存の `getSubfamiliesByGroup` も型エラーなくビルドできる

### 2. ロジック: 市松模様用2色ランダム選出

- [x] `app/src/lib/jis-color-map/family-checker.ts` を新規作成
  - `pickCheckerboardColors(familyId: ColorFamily): [string, string]` を export
  - `JIS_COLORS_BY_GROUP` を参照してランダムに2色（重複なし）を選び HEX タプルを返す
  - 色数 0 → フォールバック `["#cccccc", "#aaaaaa"]`、色数 1 → 同じ色を2つ返す
  - 完了条件: 関数単体で型チェックが通り、後続のページから利用できる

### 3. ロジック: ファミリー説明文辞書

- [x] `app/src/lib/jis-color-map/family-copy.ts` を新規作成
  - `FAMILY_DESCRIPTIONS: Record<ColorFamily, string>` を export
  - 7つのファミリーすべてに短い説明文を定義
  - 完了条件: 全 `ColorFamily` のキーが埋まっており型チェックが通る

### 4. コンポーネント: FamilyCard

- [x] `app/src/lib/components/jis-color-map/FamilyCard.svelte` を新規作成
  - Props: `family: JISColorFamily`, `labelEn: string`, `description: string`, `checkerColors: [string, string]`
  - `/patterns/+page.svelte` の `.card` 系スタイルを踏襲した市松模様 + テキストのリンクカード
  - リンク先: `resolve("/jis-color-map/[family]", { family: family.id })`
  - 完了条件: `/jis-color-map` に配置して視覚的に `/patterns` と同じトンマナで表示される

### 5. 一覧ページの改修

- [x] `app/src/routes/jis-color-map/+page.svelte` を改修
  - 既存の `JisColorMap` 描画を削除
  - `JIS_COLOR_FAMILIES` から `FamilyCard` のグリッドを生成
  - `FAMILY_DESCRIPTIONS` / `pickCheckerboardColors` を利用
  - `/patterns` と同じ `.grid`（`repeat(auto-fill, minmax(250px, 1fr))`）スタイル
  - `main` の `max-width: 720px` を設定
  - 既存 `Heading1` はそのまま維持
  - 完了条件: 7枚のカードが並び、それぞれクリックで `/jis-color-map/[family]` に遷移できる

### 6. 動的ルート: load 関数

- [x] `app/src/routes/jis-color-map/[family]/+page.ts` を新規作成
  - `@sveltejs/kit` の `error` を使い、`isColorFamily` で妥当性検証
  - 不正値なら `error(404, "Unknown color family")`
  - 妥当なら `{ family: params.family }` を返す（型は `ColorFamily`）
  - 完了条件: `/jis-color-map/unknown` で 404、`/jis-color-map/red` などで正常ロード

### 7. 動的ルート: ページ本体

- [x] `app/src/routes/jis-color-map/[family]/+page.svelte` を新規作成
  - `data.family` から対応する `JISColorFamily` を取得
  - `Breadcrumb` で `慣用色名マップ > 〜系`（category=`"contents"`）
  - `Heading1` で「〜系の慣用色名マップ」
  - `JisColorMap` に `groupId={data.family}` を渡して描画
  - `<svelte:head>` で `<title>` 設定
  - 完了条件: 各ファミリーページでパンくず / 見出し / マップが期待どおり表示される

### 8. 動作確認

- [x] `npm run dev` で起動し、以下のフローを目視で確認
  - [x] `/jis-color-map` で7枚のリンクカードが並ぶ
  - [x] 各カードから `/jis-color-map/[family]` に遷移できる
  - [x] 各ファミリーページのパンくず「慣用色名マップ」リンクで一覧に戻れる
  - [x] `/jis-color-map/unknown` で 404
  - [x] ダークモード切り替えで表示が破綻しない

### 9. 静的検証

- [x] `npm run check`（型チェック）をパス
- [x] `npm run lint`（リント）をパス
- [x] `npm run format`（フォーマット）を実行

### 10. ドキュメント更新（必要時のみ）

- [x] `docs/repository-structure.md` に、追加したファイル・ディレクトリ構造の変化を反映
  - 新規: `lib/jis-color-map/family-checker.ts`, `lib/jis-color-map/family-copy.ts`, `lib/components/jis-color-map/FamilyCard.svelte`, `routes/jis-color-map/[family]/...`
  - 必要に応じて他のドキュメントも確認（基本は構造定義書のみの更新で十分と予想）

## 完了条件（全体）

- [x] requirements.md のすべての受け入れ条件を満たす
- [x] `npm run check` / `npm run lint` がパスしている
- [x] `npm run format` が実行済み
