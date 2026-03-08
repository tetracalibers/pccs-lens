# 設計：URLによるカラーコード共有

## 実装アプローチ

SvelteKit の `page` ストア（`$app/stores`）と `replaceState`（`$app/navigation`）を使い、
`+page.svelte` の `<script>` ブロックのみを変更する。

## 変更するコンポーネント

- `app/src/routes/approximate/+page.svelte`

## 変更内容

### 追加するインポート

```svelte
import { page } from '$app/stores'
import { replaceState } from '$app/navigation'
```

### `inputColor` の初期化変更

**変更前：**
```svelte
let inputColor = $state("#EE0026")
```

**変更後：**
```svelte
const isValidHex6 = (v: string | null): v is string => /^[0-9A-Fa-f]{6}$/.test(v ?? '')

const urlColor = $page.url.searchParams.get('color')
let inputColor = $state(isValidHex6(urlColor) ? `#${urlColor.toUpperCase()}` : '#EE0026')
```

- `#` なし6桁HEX を検証する `isValidHex6` ヘルパーを定義
- URLパラメータが有効なら `#RRGGBB` 形式に変換して初期値に使用
- 大文字統一（`.toUpperCase()`）で既存の表示と統一感を保つ

### URLを更新する `$effect` を追加

```svelte
$effect(() => {
  if (/^#[0-9A-Fa-f]{6}$/.test(inputColor)) {
    const url = new URL($page.url)
    url.searchParams.set('color', inputColor.slice(1).toUpperCase())
    replaceState(url, {})
  }
})
```

- `inputColor` が変わるたびに実行（Svelte 5 のリアクティブ）
- 完成した `#RRGGBB` 形式のときのみ URL を更新（途中入力は無視）
- `inputColor.slice(1)` で `#` を除去してURLに載せる
- `replaceState` でブラウザ履歴スタックに積まない

## データ構造の変更

なし。`inputColor` の型・用途は変わらず、`$derived` による再計算フローも維持される。

## 影響範囲の分析

| ファイル | 変更 | 理由 |
|---|---|---|
| `+page.svelte` | あり | インポート追加・初期化変更・`$effect` 追加 |
| `ColorPicker.svelte` | なし | `bind:value` はそのまま動作 |
| `approximate.ts` | なし | 入力形式は変わらない |
| `docs/product-requirements.md` | あり | 「将来的な追加候補」→ 正式機能へ移動 |

## 注意点

- SSR（サーバーサイドレンダリング）時は `$page.url.searchParams` でアクセス可能なため、初期値の読み取りはSSR/CSRどちらでも機能する
- `$effect` はブラウザ環境のみで動作するため、SSR では実行されない（SvelteKit のデフォルト動作）
