# タスクリスト：F2 セクション2（配色プレビュー・色相環・トーン概念図）

## タスク一覧

### T1: ColorEntry 型に `displayedPCCS` を追加

- [ ] `analyze/+page.svelte` の `ColorEntry` 型に `displayedPCCS: PCCSColor` フィールドを追加
- [ ] `makeEntry()` で `displayedPCCS: results[0].color` を設定
- [ ] `onSelectAlternate()` で `displayedPCCS: alternate` を更新

---

### T2: ColorSchemePreview.svelte を作成

- [ ] `app/src/lib/components/ColorSchemePreview.svelte` を新規作成
- [ ] Props: `inputHexList: string[]`, `displayedPCCSList: PCCSColor[]`
- [ ] 「入力色」行：各 `inputHex` の 40×40px スウォッチを横並び
- [ ] 「PCCS近似色」行：各 `displayedPCCS.hex` の 40×40px スウォッチを横並び
- [ ] 各行に左ラベルを表示

---

### T3: HueWheel.svelte を作成

- [ ] `app/src/lib/components/HueWheel.svelte` を新規作成
- [ ] Props: `displayedPCCSList: PCCSColor[]`, `techniqueHighlightHues?: number[] | null`
- [ ] `viewBox="0 0 320 320"`, 中心 (160,160), 外径 R=110, 内径 r=28
- [ ] 色相代表色マップ（vトーン、hue1〜24）を定数として定義
- [ ] 色相名マップ（`1:"pR"` ... `24:"RP"`）を定数として定義
- [ ] 24セクターを SVG arc パスで描画（各15°、hue1が真上=-90°から時計回り）
- [ ] 各セクターを代表色で塗りつぶし、セクター間に薄い境界線
- [ ] 近似色ハイライト：有彩色の `displayedPCCS` に対応するセクターに `stroke="#222" stroke-width="2.5"` を追加
- [ ] 方向線：ハイライトセクターの中央角へ中心からの線を描画（`stroke="white" stroke-width="1.5" opacity="0.8"`）
- [ ] 外周ラベル：偶数色相のみ `h:name` テキストを表示（labelR=135）
- [ ] `pointer-events: none`（インタラクションなし）

---

### T4: ToneDiagram.svelte を作成

- [ ] `app/src/lib/components/ToneDiagram.svelte` を新規作成
- [ ] Props: `displayedPCCSList: PCCSColor[]`, `isCard199: boolean`, `techniqueHighlightTones?: string[] | null`
- [ ] `viewBox="0 0 300 250"` で SVG を定義
- [ ] セル座標定数を定義（段階的 midpoint 配置）:
  - Col0 (achromatic, 正方形): y = 25, 75, 125, 175, 225 / x = 26
  - Col1 (p/ltg/g/dkg, 円): y = 50, 100, 150, 200 / x = 94
  - Col2 (lt/sf/d/dk, 円): y = 50, 100, 150, 200 / x = 154
  - Col3 (b/s/dp, 円): y = 75, 125, 175 / x = 214
  - Col4 (v, 円): y = 125 / x = 274
- [ ] 各セルの `usedColors` を `displayedPCCSList` から計算（有彩色は `toneSymbol` 一致、無彩色は `achromaticBucket` 一致）
- [ ] 未使用セル描画：fill=white, stroke="#ccc" stroke-width="1", ラベル fill="#bbb"
- [ ] 使用中セル描画：fill=usedColors[0].hex, stroke="#333" stroke-width="3", ラベル色は輝度判定で白/黒
- [ ] 輝度判定関数 `isLightColor(hex)` の実装（`0.299R + 0.587G + 0.114B` / 255 > 0.5 で判定）
- [ ] `isCard199=true` のとき sトーンセルに斜線パターン（SVG `<defs>` に `<pattern>` を定義）を適用
- [ ] ツールチップ state と wrapperEl の定義
- [ ] 使用中セルへの `onpointerenter` / `onpointerleave` ハンドラ付与（`touch-action: none`）
- [ ] `$effect` で tooltip.visible 中のみ `document` に `pointerdown` リスナーを登録・クリーンアップ
- [ ] HTML ツールチップオーバーレイ（色スウォッチ＋notation＋hex の一覧）
- [ ] ツールチップの位置調整（右端・下端はみ出し対策）

---

### T5: VisualizationSection を analyze/+page.svelte に追加

- [ ] `ColorSchemePreview`, `HueWheel`, `ToneDiagram` を import
- [ ] `ApproximationSection` の下に `VisualizationSection` を追加
- [ ] `inputHexList` / `displayedPCCSList` の derived 値を `$derived` で計算
- [ ] `.diagrams` を flex で横並び（レスポンシブで縦並び対応）
- [ ] `VisualizationSection` のスタイルを追加

---

## 完了条件

- 受け入れ条件（requirements.md）をすべて満たしている
- `npm run check`（型チェック）がエラーなしで通る
- `npm run lint`（ESLint）がエラーなしで通る
