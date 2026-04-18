# タスクリスト: F4 慣用色名比較マップ（全色）

## フェーズ1: 基盤ユーティリティ拡張

### T1-1: マンセル色相ランク関数を追加

- [ ] `app/src/lib/color/munsell.ts` に `munsellHueRank(hue: string): number` を追加
- [ ] ファミリーオフセット定数を内部に持つ（R:0, YR:10, Y:20, GY:30, G:40, BG:50, B:60, PB:70, P:80, RP:90）
- [ ] ランク算出: `(familyOffset + hueNumber) mod 100`、`10RP = 0` が得られる
- [ ] 不正な色相文字列は `null` を返す（もしくは例外）

**完了条件**: `munsellHueRank("10RP") === 0`, `munsellHueRank("4R") === 4`, `munsellHueRank("2.5YR") === 12.5`

### T1-2: JIS色グループアクセッサを追加

- [ ] `app/src/lib/data/jis-colors.ts` に `getJisColorsByGroup(groupId: ColorFamily | ColorSubfamily | "all"): JISColor[]` を追加
- [ ] `"all"` の場合は `JIS_COLORS`、それ以外は `JIS_COLORS_BY_GROUP.get(groupId) ?? []` を返す
- [ ] `getSubfamiliesByGroup(groupId): JISSubfamily[]` を追加
  - `"all"` → 全 subfamily フラット化
  - family → その family の `subfamilies`
  - subfamily → その subfamily 単体の配列

**完了条件**: `getJisColorsByGroup("all").length === 130`、`getSubfamiliesByGroup("red").length === 2`

### T1-3: PCCS_V24 を export

- [ ] `app/src/lib/data/pccs.ts` に `export const PCCS_V24 = pccsV24 as PCCSColor[]` を追加

**完了条件**: `PCCS_V24.length === 24`、全要素が `munsell` を持つ

## フェーズ2: マップ構築ロジック

### T2-1: 型定義を作成

- [ ] `app/src/lib/jis-color-map/types.ts` を新規作成
- [ ] `MapHueColumn`, `MapValueRow`, `MapJisCell`, `MapPccsCell`, `MapCell`, `JisColorMapData` を export

### T2-2: マップ構築本体を実装

- [ ] `app/src/lib/jis-color-map/build-map.ts` を新規作成
- [ ] `buildJisColorMap(groupId): JisColorMapData` をエクスポート
- [ ] Step 1: 描画対象JIS色・helpPCCSList の取得
- [ ] Step 2: `parseMunsell` で全色をパース（null は除外）
- [ ] Step 3: 明度範囲（minValue は 0.5 を下回らなければ 0.5 に拡張）・values 配列生成（0.5 刻み）
- [ ] Step 4: 色相列（rank 昇順）
- [ ] Step 5: 各 value の彩度集合（昇順）
- [ ] Step 6: マンセル値キーでセルを集約（JIS 同値 → colors 配列、PCCS 同値 → pccsHint 併記）
- [ ] Step 7: セル座標（hueRank / chroma / value）割り当て

**完了条件**: `buildJisColorMap("all")` が `valueRows` / `hueColumns` / `cells` を持つ妥当な構造を返す

## フェーズ3: スウォッチコンポーネント

### T3-1: ValueSwatch.svelte を実装

- [ ] `app/src/lib/components/jis-color-map/ValueSwatch.svelte` を新規作成
- [ ] Props: `value: number`, `scale?: number`（デフォルト1）
- [ ] スタイル: 角丸・塗りなし・枠線 `var(--color-body)`・文字色 `var(--color-body)`
- [ ] `aspect-ratio: 1 / ${scale}` で縦伸縮
- [ ] 中央に `明度${value.toFixed(1)}` を表示

### T3-2: JisColorSwatch.svelte を実装

- [ ] `app/src/lib/components/jis-color-map/JisColorSwatch.svelte` を新規作成
- [ ] Props: `colors: JISColor[]`, `pccsSymbol?: string`
- [ ] 背景色は `colors[0].hex`
- [ ] 文字色は `isLightColor(hex)` で `var(--color-body)` / `#fff` 分岐
- [ ] 各色名は `nameSegments` があれば改行、複数色名は縦並び
- [ ] `pccsSymbol` があれば正方形の上に小さく表示
- [ ] `computeFontSize(colors)` でフォントサイズ調整（最長名文字数 × 色名個数から算出）
- [ ] `title` 属性にマンセル値・色名を表示

### T3-3: PccsSwatch.svelte を実装

- [ ] `app/src/lib/components/jis-color-map/PccsSwatch.svelte` を新規作成
- [ ] Props: `pccs: PCCSColor`
- [ ] `border-radius: 50%` で円形、背景 `pccs.hex`
- [ ] 中央に `"${hueNumber}:${name}"` 形式の色相記号（`PCCS_HUE_MAP` から取得）
- [ ] 文字色は `isLightColor(pccs.hex)` で分岐
- [ ] 文字数に応じたフォントサイズ調整

## フェーズ4: マップコンポーネント

### T4-1: JisColorMap.svelte を実装

- [ ] `app/src/lib/components/jis-color-map/JisColorMap.svelte` を新規作成
- [ ] Props: `groupId: ColorFamily | ColorSubfamily | "all"`
- [ ] `buildJisColorMap(groupId)` で描画データ取得（`$derived`）
- [ ] CSS Grid レイアウト
  - 列数: `1 + hueColumns.length`（最左列 = 明度スケール）
  - 行数: 各 value の最大 chroma 数 + 1（value=0.5 のときは等明度軸として最低1行）
- [ ] セル配置:
  - 明度スケール列: 各 value に `ValueSwatch`（`scale` = chroma 数）
  - 無彩色 JIS セル: 明度スケール列で対応 value 位置を置き換え
  - 非無彩色 JIS セル: `(hueColumnIndex + 1, valueRowStart + chromaSubIndex)` に配置
  - PCCS セル: 同じ座標ロジック
  - 等明度軸（value=0.5 行）: 色がなければ各 hue 列に `ValueSwatch`
- [ ] 横スクロール: `.map-scroll { overflow-x: auto }` + `.map { width: max-content }`

### T4-2: マップのスタイリング調整

- [ ] セルサイズのカスタムプロパティ（`--cell-size`）を設定
- [ ] デスクトップ（64px）とモバイル（48px）のメディアクエリ
- [ ] `@css-styling-guideline` に準拠

## フェーズ5: ページ・ルーティング

### T5-1: `/jis-color-map` ページを作成

- [ ] `app/src/routes/jis-color-map/+page.svelte` を新規作成
- [ ] `<svelte:head><title>` を設定（例: "慣用色名マップ — PCCS Lens"）
- [ ] `Heading1` コンポーネントで見出し（`patterns/+page.svelte` と同様のデザイン）
- [ ] `JisColorMap` に `groupId="all"` を渡して表示
- [ ] `<main>` に `max-width` は指定しない（マップが広いため）

### T5-2: トップページに導線を追加

- [ ] `app/src/routes/+page.svelte` の `contents` 配列に `/jis-color-map` エントリを追加
- [ ] タイトル: 「慣用色名マップ」、説明: 簡潔な1〜2文、tag: 「調べる」か「見る」
- [ ] グラデーションとグロー色は既存カードと調和する組み合わせ

## フェーズ6: 検証

### T6-1: 型チェック・リント・フォーマット

- [ ] `npm run check`（型エラーなし）
- [ ] `npm run lint`
- [ ] `npm run format`

### T6-2: ブラウザでの動作確認

- [ ] `npm run dev` で開発サーバー起動
- [ ] `/jis-color-map` にアクセスし以下を確認:
  - 全130色が格子状に表示される
  - 明度スケール（左端）が正しく伸縮する
  - 等明度軸（value=0.5 の行）が描画される
  - 参考PCCS色（円形スウォッチ）が hintPCCSHue 範囲に表示される
  - 同一マンセル値の慣用色が1セルにまとまって表示される
  - PCCS併記（慣用色スウォッチ上のPCCS記号）が機能する
  - 無彩色が明度スケール上に配置される
  - 画面幅を狭めると横スクロールが出る
  - モバイルサイズでも破綻なく表示される
- [ ] `/` のコンテンツセクションに `/jis-color-map` へのリンクがあり、クリックで遷移できる

### T6-3: ドキュメント整備（必要時のみ）

- [ ] `docs/repository-structure.md` に新規ディレクトリ（`lib/jis-color-map/`, `lib/components/jis-color-map/`, `routes/jis-color-map/`）を追記
  - 実装完了後に `@repository-structure` スキルで更新判断
- [ ] `docs/domains/glossary.md` に新規用語があれば追記（例: 「慣用色名マップ」「明度スケール」「等明度軸」「参考PCCS色」）

## 進捗メモ

- 各フェーズ完了時に `npm run check` を実行し、型エラーを早期に検知する
- フェーズ3のスウォッチは単体で視認確認できるため、必要なら `+page.svelte` で一時的に配置して見た目を検証する
- フェーズ4のレイアウトは最も複雑なため、小さな `groupId` (例: "red") で先に検証してから "all" に切り替えるのも可
