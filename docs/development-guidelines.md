# 開発ガイドライン

## 1. コーディング規約

### TypeScript

- `strict` モードを有効にする（`tsconfig.json` に設定済み）
- 型推論が明確な場合は型注釈を省略してよい。ただし関数のシグネチャ（引数・戻り値）は明示する
- `any` 型の使用を禁止する。型が不明な場合は `unknown` を使い、型ガードで絞り込む
- `null` より `undefined` を優先する（オプショナルプロパティは `?` で表現する）

### Svelte

- Svelte 5 の Runes（`$state`、`$derived`、`$effect` 等）を使用する
- ページ固有のロジックが複雑になる場合は `.svelte.ts` ファイルに切り出す
- コンポーネントのpropsは `$props()` で型付きに定義する

### 関数・モジュール

- `src/lib/color/` と `src/lib/analysis/` のロジックはUIに依存しない純粋関数として実装する
- 副作用（DOM操作・外部状態への書き込み）はコンポーネント層にとどめる
- 1ファイル1責務を原則とする

---

## 2. 命名規則

### ファイル・ディレクトリ

| 種別 | 規則 | 例 |
|---|---|---|
| Svelteコンポーネント | PascalCase | `ColorPicker.svelte`、`HueWheel.svelte` |
| TypeScriptモジュール | camelCase | `ciede2000.ts`、`approximate.ts` |
| SvelteKitルート | SvelteKit規約に従う | `+page.svelte`、`+layout.svelte` |
| JSONデータファイル | snake_case | `pccs_colors.json` |
| ディレクトリ | kebab-case | `color/`、`lib/`、`approximate/` |

### コード内

| 種別 | 規則 | 例 |
|---|---|---|
| 変数・関数 | camelCase | `deltaE`、`findClosestPccs` |
| 型・インターフェース | PascalCase | `PCCSColor`、`ColorEntry` |
| 定数（モジュールスコープ） | UPPER_SNAKE_CASE | `MAX_INPUT_COLORS`、`TONE_COLUMNS` |
| Svelte コンポーネント参照 | PascalCase | `<ColorPicker />`、`<HueWheel />` |
| 色相・トーン関連の型値 | ドメイン用語に従う | `'v'`、`'ltGy'`、`'mGy'` |

---

## 3. フォーマット規約

Prettier の設定（`.prettierrc`）に従う。手動整形は行わず、保存時またはコミット前に自動フォーマットを適用する。

| 設定項目 | 値 |
|---|---|
| インデント | タブ |
| クォート | シングルクォート |
| 末尾カンマ | なし |
| 最大行幅 | 100文字 |

---

## 4. スタイリング規約

- スタイルは各 `.svelte` ファイルの `<style>` ブロックに記述する（スコープCSS）
- グローバルに適用するスタイル（リセット・CSS変数・フォント）のみ `src/app.css` に記述する
- 色やサイズの繰り返し値はCSS変数（`--color-primary` 等）として `app.css` に定義する
- 外部CSSフレームワーク・UIライブラリは使用しない

---

## 5. テスト規約

### ユニットテスト（Vitest）

- `src/lib/color/` と `src/lib/analysis/` のすべての関数にユニットテストを必須とする
- テストファイルはテスト対象と同じディレクトリに `[対象ファイル名].spec.ts` として配置する
  - 例：`ciede2000.ts` → `ciede2000.spec.ts`
- テストケースは境界値・異常値を含めて網羅する
  - 色距離計算：同一色はΔE₀₀ = 0、既知のテストベクタで検証
  - 配色技法判定：各技法の「当てはまる」「当てはまらない」両方をテスト

### ブラウザテスト（Playwright）

- `app/tests/` に配置する
- 主要なユーザーフロー（色入力 → 近似結果表示、配色分析の更新）をカバーする

### 実行コマンド

```bash
# ユニットテスト
npm run test:unit

# 全テスト
npm run test

# 型チェック
npm run check
```

---

## 6. Git規約

### ブランチ戦略

- `main`：常にデプロイ可能な状態を保つ
- 機能開発・バグ修正は作業ブランチを切って作業する
  - 命名例：`feature/approximate-page`、`fix/tone-diagram-highlight`

### コミットメッセージ

Conventional Commits 形式に従う。

```
<type>: <概要（日本語可）>
```

| type | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `refactor` | 機能変更を伴わないリファクタリング |
| `test` | テストの追加・修正 |
| `chore` | ビルド設定・依存関係の更新等 |

例：
```
feat: 色のPCCS近似ページを実装
fix: 補色色相の色相差計算が12を超える場合の不具合を修正
docs: color-analysis-rules にトーン列定義を追記
```

### コミット前チェック

以下を必ず通過させてからコミットする。

```bash
npm run check   # 型チェック
npm run lint    # Lint + フォーマットチェック
npm run test    # テスト
```
