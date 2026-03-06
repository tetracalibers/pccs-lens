# 技術仕様書

## 1. テクノロジースタック

| カテゴリ | 技術 | バージョン |
|---|---|---|
| フレームワーク | SvelteKit | ^2.x |
| UIライブラリ | Svelte | ^5.x |
| 言語 | TypeScript | ^5.x |
| ビルドツール | Vite | ^7.x |
| テスト（ユニット） | Vitest | ^4.x |
| テスト（ブラウザ） | Playwright | ^1.x |
| Linter | ESLint | ^9.x |
| Formatter | Prettier | ^3.x |

## 2. アーキテクチャ方針

### クライアントサイドレンダリング（CSR）完結

- すべての処理（色距離計算・配色分析）をブラウザ内で完結させる
- サーバーサイドは静的ファイル配信のみ
- バックエンドAPI・データベースは持たない
- デプロイは静的ホスティング（`@sveltejs/adapter-auto` を使用）

### データの扱い

- PCCSカラーデータは JSON ファイルとして `app/src/lib/data/` に配置し、静的インポートで利用する
- ランタイムでのファイル読み込み・パース処理は行わない
- `data/*.csv` はマスターデータとして保持し、`scripts/convert-csv-to-json.mjs` で JSON に変換する
  - 生成した JSON ファイルはリポジトリにコミットする（clone 直後に変換不要）
  - CSV を更新したときのみ手動で変換スクリプトを実行する
- ユーザーの入力状態はすべてクライアントのメモリ上で管理する（永続化なし）
  - 将来的な機能追加時に localStorage を利用する

## 3. 開発ツールと手法

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

### CSV → JSON 変換スクリプト

- スクリプト: `scripts/convert-csv-to-json.mjs`（リポジトリルート）
- 変換対象: `data/pccs_colors.csv`・`data/pccs_colors_full.csv`・`data/jis_colors.csv`
- 出力先: `app/src/lib/data/pccs_colors.json`・`pccs_colors_full.json`・`jis_colors.json`
- 外部依存なし（Node.js 標準モジュール `fs`・`path` のみ使用）
- **実行タイミング**: `data/*.csv` を変更したときのみ手動実行。JSON はリポジトリにコミットするため、通常の開発・ビルドでは不要。

---

## 4. ディレクトリ構成（`app/` 以下）

```
app/
├── src/
│   ├── lib/
│   │   ├── color/              色計算ロジック
│   │   │   ├── ciede2000.ts    CIEDE2000 色差計算
│   │   │   ├── convert.ts      HEX → sRGB → Lab 変換
│   │   │   └── approximate.ts  PCCS近似（最近傍探索）
│   │   ├── analysis/           配色分析ロジック
│   │   │   ├── hue.ts          色相関係・ハーモニー判定
│   │   │   ├── tone.ts         トーン関係判定
│   │   │   └── techniques.ts   配色技法判定
│   │   ├── data/               JSONデータ・型定義
│   │   │   ├── types.ts        型定義（PCCSColor等）
│   │   │   ├── pccs_colors.json         新配色カード199の色
│   │   │   ├── pccs_colors_full.json    全色相の色
│   │   │   └── jis_colors.json          JIS慣用色名データ
│   │   └── components/         共通UIコンポーネント
│   │       ├── ColorPicker.svelte
│   │       ├── HueWheel.svelte
│   │       └── ToneDiagram.svelte
│   ├── routes/
│   │   ├── +layout.svelte      共通レイアウト（ナビゲーション）
│   │   ├── +page.svelte        トップページ
│   │   ├── approximate/
│   │   │   └── +page.svelte    機能1：色のPCCS近似
│   │   └── analyze/
│   │       └── +page.svelte    機能2：配色の分析と調整
│   └── app.css                 グローバルスタイル
├── static/
│   └── favicon.png
├── tests/                      ブラウザテスト（Playwright）
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## 5. PCCSデータのJSON構造

`data/*.csv` をもとに生成するJSONの形式。

```jsonc
// pccs_colors.json / pccs_colors_full.json
[
  {
    "notation": "v2",
    "hex": "#EE0026",
    "toneSymbol": "v",
    "hueNumber": 2,
    "isNeutral": false,
    "achromaticBucket": null
  },
  {
    "notation": "Gy-5.0",
    "hex": "#797979",
    "toneSymbol": null,
    "hueNumber": null,
    "isNeutral": true,
    "achromaticBucket": "mGy"
  }
  // ...
]
```

利用側では静的インポートで読み込む。

```typescript
import pccsColors from '$lib/data/pccs_colors.json';
import pccsColorsFull from '$lib/data/pccs_colors_full.json';
import jisColors from '$lib/data/jis_colors.json';
```

### jis_colors.json

```jsonc
// jis_colors.json
[
  {
    "name": "桜色",
    "reading": "さくらいろ",
    "hex": "#fdeeef",
    "examLevel": 3
  },
  {
    "name": "鴇色",
    "reading": "ときいろ",
    "hex": "#f4b3c2",
    "examLevel": 2
  },
  {
    "name": "茜色",
    "reading": "あかねいろ",
    "hex": "#c0392b",
    "examLevel": null
  }
  // ...
]
```

## 6. 色計算の処理フロー

```
入力HEX (#RRGGBB)
    ↓
sRGB に変換（0〜1 の範囲に正規化）
    ↓
線形RGB に変換（ガンマ補正除去）
    ↓
CIE XYZ に変換（D65 光源基準）
    ↓
CIE L*a*b* に変換
    ↓
CIEDE2000（ΔE₀₀）で全PCCS色と比較
    ↓
ΔE₀₀ 昇順でソート → 上位N件を返す
```

CIEDE2000 は外部ライブラリに依存せず、仕様（CIE 142-2001）に基づいて内部実装する。

## 7. SVG描画方針

色相環・トーン概念図はSvelte コンポーネント内でSVGを直接記述する。

- 外部チャートライブラリは使用しない
- インタラクション（ハイライト・クリック）はSvelteのリアクティビティで管理する
- サイズはレスポンシブ（`viewBox` 指定 + `width: 100%`）

## 8. カラーピッカー

ブラウザ標準の `<input type="color">` を基盤とし、HEXテキスト入力欄を併設する。
外部のカラーピッカーライブラリは使用しない。

```
[■ カラーパレットアイコン]  [#EE0026 テキスト入力]
       ↑                          ↑
  input[type=color]          同期して更新
```

## 9. コーディング規約の概要

詳細は `docs/development-guidelines.md` に記載。ここでは技術的に重要な制約のみを示す。

- TypeScript の `strict` モードを有効にする
- Svelte コンポーネントは `.svelte` ファイル、ロジックは `.ts` ファイルに分離する
- 色計算ロジック（`src/lib/color/`・`src/lib/analysis/`）はUIに依存しない純粋関数として実装し、単体テストを必須とする

## 10. パフォーマンス要件

- PCCS近似計算（最大約160件との比較）：体感遅延なし（< 16ms）
- 配色分析・技法判定（最大6色）：体感遅延なし（< 16ms）
- PCCSデータは静的インポートによりバンドル時に解決し、ランタイムのロードコストをゼロにする
