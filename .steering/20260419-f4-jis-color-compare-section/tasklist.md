# タスクリスト: F4 慣用色名比較セクション

## 凡例

- `[ ]` 未着手
- `[x]` 完了

## タスク

### 1. 共通レイアウト計算の抽出

- [ ] `app/src/lib/jis-color-map/layout.ts` を新規作成
  - `buildMapLayout(data: JisColorMapData): MapLayout` を export
  - 型 `MapLayout` / `MapPlacement` / `MapValueScale` / `MapEquiAxis` を export
  - 既存 `JisColorMap.svelte` 内の `$derived.by(() => { ... })` のロジックを移植（`SvelteMap`/`SvelteSet` → `Map`/`Set`）
  - 完了条件: 単体で型チェックが通る
- [ ] `app/src/lib/components/jis-color-map/JisColorMap.svelte` を更新
  - レイアウト計算部分を `buildMapLayout` 呼び出しに差し替え
  - 完了条件: `/jis-color-map/red` などで見た目が従前と完全に一致

### 2. マンセル比較ユーティリティ

- [ ] `app/src/lib/color/munsell.ts` に以下を追加
  - `munsellHueFamily(hue: string): string | null`
  - `MunsellPrimaryHueLabel` 型と `munsellPrimaryHueLabel(hue: string): MunsellPrimaryHueLabel | null`
  - 5 原色（赤/黄/緑/青/紫）への最近傍丸め（境界は R=10, Y=30, G=50, B=70, P=90 相当、循環距離で判定）
  - 完了条件: 代表的な色相（`2R`, `5YR`, `10Y`, `10RP` 等）で期待どおりのラベルが返る

### 3. データアクセサ追加

- [ ] `app/src/lib/data/jis-colors.ts` に以下を追加
  - `JIS_COLOR_BY_ID: Map<string, JISColor>`
  - `getJisColorById(id: string): JISColor | undefined`
  - `getJisColorsByIds(ids: string[]): JISColor[]`（undefined を除外）
  - `getCompareSectionsBySubfamily(subfamilyId: ColorSubfamily): JISCompareSection[]`
  - 完了条件: `npm run check` で型エラーなし

### 4. 比較処理ロジック

- [ ] `app/src/lib/jis-color-map/compare.ts` を新規作成
  - `hasHueDifference(targets: JISColor[]): boolean`
  - `hasValueDifference(targets: JISColor[]): boolean`
  - `hasChromaDifference(targets: JISColor[]): boolean`
  - `HueCompareDiagramData` 型と `buildHueCompareDiagram(targets): HueCompareDiagramData | null`
  - `ValueCompareDiagramData` 型と `buildValueCompareDiagram(targets): ValueCompareDiagramData | null`
  - `ChromaCompareDiagramData` 型と `buildChromaCompareDiagram(targets): ChromaCompareDiagramData | null`
  - 中間ラベル判定（3 要素以上で単調でない場合に挿入）を含む
  - 完了条件: 単体で型チェックが通り、境界値（`targets.length === 1`、全無彩色など）で null を返す

### 5. ファミリー代表色辞書

- [ ] `app/src/lib/jis-color-map/family-copy.ts` に以下を追加
  - `FAMILY_PRIMARY_HEX: Record<ColorFamily, string>` — 彩度比較図のグラデーション終端用の代表色 HEX
  - 完了条件: 7 family すべてのキーが埋まる

### 6. 色名ポップオーバー

- [ ] `app/src/lib/components/jis-color-map/JisColorNameTooltip.svelte` を新規作成
  - Props: `colors: JISColor[]`, `anchorName: string`, `popoverId: string`
  - `popover="manual"` + `style="position-anchor: {anchorName};"` + `id={popoverId}`
  - `colors` を縦並びで表示、`nameSegments` を `<br>` で改行、`reading` を併記
  - 複数色はセパレータで区切る
  - 完了条件: 表示イメージがアクセシビリティ的に破綻しない（スクリーンリーダーで名前が読まれる）
- [ ] 共通 util `lib/jis-color-map/tooltip-id.ts`（必要なら）で `buildAnchorName(id)` / `buildPopoverId(id)` を統一

### 7. コンパクト慣用色スウォッチ

- [ ] `app/src/lib/components/jis-color-map/CompactJisColorSwatch.svelte` を新規作成
  - Props: `colors: JISColor[]`
  - 角丸正方形を `colors[0].hex` で塗りつぶし
  - `tabindex="0"` + `role="button"`
  - `anchor-name` をインラインスタイルで付与
  - `JisColorNameTooltip` を配置
  - `pointerenter` / `focusin` で `showPopover()`、`pointerleave` / `focusout` で `hidePopover()`
  - 完了条件: マウス hover / キーボードフォーカス双方で色名が表示され、それ以外では表示されない

### 8. 参考慣用色スウォッチ（正六角形）

- [ ] `app/src/lib/components/jis-color-map/HintJisColorSwatch.svelte` を新規作成
  - Props: `color: JISColor`
  - SVG `<polygon>` で正六角形を描画（viewBox 100×100、頂点は `50,5 93.3,27.5 93.3,72.5 50,95 6.7,72.5 6.7,27.5`）
  - `<polygon>` を `fill={color.hex}` で塗り、`tabindex="0"` + `role="button"` を付与
  - `anchor-name` を `<polygon>` のインラインスタイルで付与（ブラウザ非対応なら SVG ルート or 絶対配置不可視アンカーにフォールバック）
  - `JisColorNameTooltip` を配置
  - `pointerenter` / `pointerleave` / `focusin` / `focusout` で開閉
  - 完了条件: 六角形の色の付いた領域のみがホバーに反応し、矩形コンテナの外側（視覚的に透明な角）では反応しない

### 9. 慣用色名ミニマップ

- [ ] `app/src/lib/components/jis-color-map/JisMiniColorMap.svelte` を新規作成
  - Props: `groupId: ColorSubfamily`, `highlightsJisIds: string[]`, `hintJisIds?: string[]`, `hintPCCSHueNums?: number[]`
  - `buildJisColorMap(groupId)` + `buildMapLayout(data)` を利用
  - セルごとに分岐:
    - `kind === "jis"` で `colors[0].id` が `highlightsJisIds` 内 → `CompactJisColorSwatch`（通常不透明）
    - `kind === "jis"` で `colors[0].id` が `hintJisIds` 内 → `HintJisColorSwatch`（通常不透明）
    - `kind === "jis"` で上記どちらでもない → `CompactJisColorSwatch`（親ラッパ `.dim` で opacity 0.2）
    - `kind === "pccs"` で `hintPCCSHueNums` が未指定 or `pccs.hueNumber` が含まれる → `PccsSwatch`（通常不透明）
    - `kind === "pccs"` で含まれない → `PccsSwatch`（親ラッパ `.dim` で opacity 0.2）
  - `--cell-size` はデスクトップ 32px / モバイル 28px、`--map-font-*` も比例縮小
  - 完了条件: 既存マップと同じレイアウト規則で、強調/減光が正しく反映される

### 10. 比較図 3 種

- [ ] `app/src/lib/components/jis-color-map/HueCompareDiagram.svelte` を新規作成
  - Props: `data: HueCompareDiagramData`
  - SVG で両方向矢印 + 上下ラベル、両端のラベルに対応する色の `linearGradient`
  - 完了条件: コンテナ高さに追従し、色相違いが視覚的に判別できる
- [ ] `app/src/lib/components/jis-color-map/ValueCompareDiagram.svelte` を新規作成
  - Props: `data: ValueCompareDiagramData`
  - `middleLabel` null の場合は 2 ラベル + 1 片方向矢印、非 null の場合は 3 ラベル + 2 片方向矢印
  - 矢印は常に「高明度方向」に向く
  - グラデーションはグレイ（低明度→高明度）
  - 完了条件: 3 要素以上で不揃いの case で中間ラベルが入る
- [ ] `app/src/lib/components/jis-color-map/ChromaCompareDiagram.svelte` を新規作成
  - Props: `data: ChromaCompareDiagramData`, `familyHex: string`
  - 矢印は「高彩度方向」に向く
  - グラデーションはグレイ→`familyHex`
  - 完了条件: 明度比較図と対称な見た目になる

### 11. 比較セクション本体

- [ ] `app/src/lib/components/jis-color-map/JisColorCompareSection.svelte` を新規作成
  - Props: `subfamilyId: ColorSubfamily`, `section: JISCompareSection`
  - `section.targets` を `getJisColorsByIds` で解決
  - ミニマップ + 慣用色一覧（級タグ・プレビュー・情報）+ 比較図群 + 解説 をレイアウト
  - デスクトップは横並び、モバイル（~640px）は縦並び
  - 解説は `colorDescription` を空白で分割して `<br>` 改行
  - 完了条件: `compareSections` の 1 エントリが期待どおりに描画される

### 12. ページへの組み込み

- [ ] `app/src/routes/jis-color-map/[family]/+page.svelte` を更新
  - 既存の `JisColorMap` の下に subfamily ごとの比較セクション群を描画
  - subfamily 見出し（`<h2>{sub.name}</h2>`）と `JisColorCompareSection` のループ
  - `compareSections` が空の subfamily は見出しごとスキップ
  - `main` のレイアウトを調整（比較セクション用の上下余白など）
  - 完了条件: 各 family ページで既存マップに加えて比較セクションが表示される

### 13. 動作確認

- [ ] `npm run dev` で起動し、以下を目視確認
  - [ ] `/jis-color-map/red` で既存マップ＋比較セクション群が表示される
  - [ ] ミニマップの強調 / 減光表示が正しい
  - [ ] コンパクト慣用色スウォッチを hover / フォーカスすると色名ポップオーバーが開き、離れると閉じる
  - [ ] 参考慣用色スウォッチの六角形の外側（矩形の角）をホバーしても反応しない
  - [ ] `nameSegments` 付きの色（例: `ベビー/ピンク`）がポップオーバー内で改行表示される
  - [ ] 比較図（色み / 明度 / 彩度）が targets の差分に応じて表示・非表示される
  - [ ] `targets` 3 件以上で明度 or 彩度が単調でない case に中間ラベルが入る
  - [ ] モバイル幅でミニマップと慣用色一覧が縦並びになる
  - [ ] ダークモード切り替えで表示が破綻しない
  - [ ] 他 family（`brown` / `yellow` / `green` / `blue` / `purple` / `neutral`）も描画できる

### 14. 静的検証

- [ ] `npm run check`（型チェック）をパス
- [ ] `npm run lint`（リント）をパス
- [ ] `npm run format`（フォーマット）を実行

### 15. ドキュメント更新

- [ ] `docs/repository-structure.md` に追加したファイル・ディレクトリ構造の変化を反映
  - 新規: `lib/jis-color-map/layout.ts`, `lib/jis-color-map/compare.ts`, `lib/components/jis-color-map/{JisColorCompareSection,JisMiniColorMap,CompactJisColorSwatch,HintJisColorSwatch,JisColorNameTooltip,HueCompareDiagram,ValueCompareDiagram,ChromaCompareDiagram}.svelte`

## 完了条件（全体）

- [ ] requirements.md のすべての受け入れ条件を満たす
- [ ] `npm run check` / `npm run lint` がパスしている
- [ ] `npm run format` が実行済み
