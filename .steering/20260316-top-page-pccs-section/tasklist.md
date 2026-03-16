# タスクリスト：トップページにPCCSの解説セクションを追加

## タスク

### 1. ディレクトリ作成
- [ ] `app/src/lib/components/index/` ディレクトリを作成する

### 2. `ToneAreaDiagram.svelte` を作成
- [ ] ToneDiagram.svelte の CELLS・座標定数を流用してレイアウト構築
- [ ] `s` トーンの特別扱いを排除（他と同様に描画）
- [ ] `highlights: string[]` props を実装
- [ ] ハイライト判定ロジック（`"Gy"` → ltGy/mGy/dkGy、その他はそのまま）
- [ ] ハイライトセルの fill: 色相12の hex（無彩色は固定色）
- [ ] 非ハイライトセルを opacity: 0.25 で薄く表示
- [ ] 彩度横軸・明度縦軸を描画（セル群の幅・高さ全体）
  - 横軸: 左端「薄い」、中央下「彩度」、右端「鮮やか」
  - 縦軸: 下端「暗い」、中央左「明度」（縦書き）、上端「明るい」

### 3. `ToneImageDiagram.svelte` を作成
- [ ] ToneDiagram.svelte のセル配置を踏襲しつつ大きめのサイズで座標定数を定義
- [ ] `pccs_colors_full.json` から各 toneSymbol × 偶数 hueNumber のカラーマップを構築
- [ ] chromatic セル: 偶数色相12枚のドーナツ型パイチャートを SVG `<path>` で描画
- [ ] パイスライスの外周に色相番号ラベルを表示（font-size: 8px）
- [ ] セル中央に toneSymbol + toneNameEn を表示
- [ ] achromatic セル（W/Gy/Bk）: 矩形 + 中央テキスト
- [ ] 彩度横軸・明度縦軸を描画（ToneAreaDiagram と同仕様）
- [ ] hover ツールチップ: `pccs_tone.json` の feelings をカンマ区切りで表示

### 4. `+page.svelte` に解説セクションを追加
- [ ] `<nav>` 直後に `<section class="pccs-guide">` を追加
- [ ] `ToneImageDiagram` と `ToneAreaDiagram` を import
- [ ] 解説テキスト・見出し・各 ToneAreaDiagram（純色・明清色・暗清色・中間色・無彩色）を配置
- [ ] セクション用スタイルを追加（text-align: left、max-width など）

### 5. 品質チェック
- [ ] `npm run check`（型チェック）でエラーがないことを確認
- [ ] `npm run lint` でリントエラーがないことを確認
