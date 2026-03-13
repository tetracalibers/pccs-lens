# タスクリスト：F3-5 幾何パターン画像の生成・プレビュー・保存

## タスク一覧

### T1. ブラウザ互換ジェネレーターの作成

#### T1-1. `app/src/lib/patterns/generators/bauhaus.ts` を作成する
- protoの `generateBauhaus` ロジックを移植
- `createCanvas` をブラウザ用（`SVG().size(300, 300)`）に置き換え
- `rand` / `pick` は `Math.random()` ベースのまま（ファイルローカルに定義）
- CLIエントリーポイント（`process.argv` 以降）は含めない
- `export function generateBauhaus(colors: [string, string, string]): string`

#### T1-2. `app/src/lib/patterns/generators/geometric.ts` を作成する
- protoの `generateGeometric` ロジックを移植（T1-1 と同様の方針）
- `export function generateGeometric(colors: [string, string, string]): string`

### T2. SVG 色置換ユーティリティの実装

#### T2-1. `updateSvgColors` 関数を `GeoPatternSection.svelte` またはジェネレーターと同じディレクトリに実装する
- 単一パス正規表現置換（`/#[0-9a-f]{6}/gi`）
- `export function updateSvgColors(svg: string, oldColors: [string, string, string], newColors: [string, string, string]): string`
- 実装場所：`app/src/lib/patterns/generators/utils.ts`（T1-1, T1-2 からも import できるよう共有）

### T3. `GeoPatternSection.svelte` の作成

#### T3-1. Props・状態・ジェネレーター呼び出しを実装する
- Props: `colors: [string, string, string]`, `themeId: string`
- 状態：`bauhausSvg`, `bauhausColors`, `bauhausLoading`, `geometricSvg`, `geometricColors`, `geometricLoading`
- `$effect` + `browser` ガード：初回フル生成 / 色変更時 `updateSvgColors()` 置換
- 再生成関数：`regenerateBauhaus()` / `regenerateGeometric()`

#### T3-2. PNG 保存機能を実装する
- `downloadPng(svgString: string, filename: string): Promise<void>`
- SVG文字列 → Blob → `<img>` → `<canvas>` → `toBlob` → `<a download>` の流れ
- ファイル名: `{themeId}-bauhaus.png` / `{themeId}-geometric.png`

#### T3-3. HTML テンプレートとスタイルを実装する
- バウハウス・ジオメトリックそれぞれのパターンカード
- ローディングオーバーレイ（パターン部分のみ）
- 「画像を再生成」ボタン（ローディング中は `disabled`）
- 「PNG保存」ボタン（SVG未生成中は `disabled`）
- レイアウト：2カードを横並び（レスポンシブ考慮）

### T4. テーマページへの組み込み

#### T4-1. `[theme]/+page.svelte` に `GeoPatternSection` を追加する
- `geoColors` を `$derived` で計算（アクセントあり/なしで引数切り替え）
- `<GeoPatternSection>` を配色プレビューセクションの直後に配置
- import 文を追加

### T5. 動作確認

#### T5-1. 初期表示の確認
- テーマページを開いたとき、初期色でバウハウス・ジオメトリック両パターンが表示されることを確認

#### T5-2. 色変更時の確認
- 色相・トーンを変更したとき、パターンの形状を保ったまま色のみ更新されることを確認

#### T5-3. 再生成の確認
- 「画像を再生成」ボタンで新しい模様が生成されることを確認
- 再生成中はローディング表示・ボタン disabled になることを確認
- 再生成中に色を変更し、完了後に最新の色が反映されることを確認

#### T5-4. PNG保存の確認
- PNG保存ボタンで正しいファイル名（例: `elegant-bauhaus.png`）でダウンロードされることを確認
- 画像サイズ（300×300）と配色が正しいことを確認

#### T5-5. 型チェック・リントの実施
- `cd app && yarn check` で型エラーがないことを確認
- `yarn lint` でリントエラーがないことを確認

## 完了条件

- すべての受け入れ条件（requirements.md）を満たしている
- 型チェック・リストが通る
- ブラウザで動作確認済み
