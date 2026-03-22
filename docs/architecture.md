# 技術仕様書

## テクノロジースタック

- フレームワーク：SvelteKit + Svelte 5 runes
- 言語：TypeScript
- ビルドツール：Vite
- テスト：Vitest

## アーキテクチャ方針

### クライアントサイドレンダリング（CSR）完結

- すべての処理をブラウザ内で完結させる
- サーバーサイドは静的ファイル配信のみ
- バックエンドAPI・データベースは持たない
- デプロイは静的ホスティング

### データの扱い

- `app/src/lib/data/`配下のJSONデータは静的インポートによりバンドル時に解決し、ランタイムのロードコストをゼロにする
- ランタイムでのファイル読み込み・パース処理は行わない
- ユーザーの入力状態はすべてクライアントのメモリ上で管理する（永続化なし）
  - 将来的な機能追加時に localStorage を利用する

## 開発ツールと手法

### 主要コマンド（`app/` ディレクトリで実行）

| コマンド | 内容 |
|---|---|
| `npm run dev` | Vite 開発サーバー起動（HMR 有効、デフォルト: http://localhost:5173） |
| `npm run build` | 本番用静的ファイル生成（出力先: `app/.svelte-kit/output/`） |
| `npm run preview` | ビルド結果をローカルでプレビュー |
| `npm run convert` | `data/*.csv` → `app/src/lib/data/*.json` 変換（CSVを更新したときのみ実行） |
| `npm run check` | Svelte の型チェック |
| `npm run lint` | Prettier + ESLint によるコードチェック |
| `npm run format` | Prettier によるコード整形 |
| `npm run test` | Vitest ユニットテスト実行 |

## コーディング規約の概要

詳細は `docs/development-guidelines.md` に記載。ここでは技術的に重要な制約のみを示す。

- TypeScript の `strict` モードを有効にする
- Svelte コンポーネントは `.svelte` ファイル、ロジックは `.ts` ファイルに分離する
- 色計算などのロジックはUIに依存しない純粋関数として実装し、単体テストを必須とする
