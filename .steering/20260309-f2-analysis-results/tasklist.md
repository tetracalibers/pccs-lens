# タスクリスト：F2 セクション3 配色分析結果

## タスク一覧

### T1: 分析ロジック実装（`app/src/lib/color/analyze.ts`）

- [x] T1-1: 型定義 `AnalysisCard` を追加
- [x] T1-2: ユーティリティ関数実装
  - `hueDiff(h1, h2)` — 色相差（0〜12）
  - `toneRank(color)` — トーン明度ランク
  - `areTonesAdjacent(t1, t2)` — トーン8方向隣接判定（TONE_ADJACENCY使用）
  - `toneRelation(c1, c2)` — same / similar / contrast
- [x] T1-3: 色相の関係カード生成（2色のみ）
  - 同一・隣接・類似・中差・対照・補色
- [x] T1-4: トーンの関係カード生成（2色のみ）
  - 同一・類似・対照
- [x] T1-5: ハーモニーカード生成（2色のみ）
  - ナチュラル・コンプレックス
- [x] T1-6: 配色技法カード生成
  - ドミナントカラー・ドミナントトーン・トーンオントーン・トーナル・カマイユ・フォカマイユ・ビコロール・トリコロール
- [x] T1-7: 色相環分割カード生成
  - ダイアード・トライアド・スプリットコンプリメンタリー・テトラード・ペンタード・ヘクサード
- [x] T1-8: `analyzeColors(colors)` エントリポイント実装

### T2: ユニットテスト（`app/src/lib/color/analyze.spec.ts`）

- [x] T2-1: `hueDiff` のテスト
- [x] T2-2: `toneRelation` のテスト（隣接マップ含む）
- [x] T2-3: 代表的な配色技法の判定テスト（各技法1〜2ケース）
- [x] T2-4: 色相環分割の判定テスト（各技法1ケース）

### T3: UIコンポーネント実装（`app/src/lib/components/ColorAnalysisResults.svelte`）

- [x] T3-1: カードグリッドレイアウト実装
- [x] T3-2: カテゴリタグのスタイル（カテゴリ別色分け）
- [x] T3-3: 「該当なし」表示

### T4: ページへの組み込み（`app/src/routes/analyze/+page.svelte`）

- [x] T4-1: `ColorAnalysisResults` のインポート・配置（`visualization-section` の下）

## 完了条件

- `analyzeColors` が `docs/color-analysis-rules.md` の全判定条件を正しく実装している
- テストがすべてパスする
- `displayedPCCSList` の変化に応じてカードがリアルタイムで更新される
- `npm run check` でエラーが出ない
