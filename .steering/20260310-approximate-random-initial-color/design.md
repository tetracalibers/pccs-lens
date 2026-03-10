# 設計：近似ページの初期色ランダム生成

## 実装アプローチ

`app/src/routes/approximate/+page.svelte` の初期色生成ロジックを変更する。

### 変更前

```ts
let inputColor = $state(
  isValidHexColor(urlColorWithHash) ? urlColorWithHash.toUpperCase() : "#EE0026"
)
```

### 変更後

```ts
import randomColor from "randomcolor"

function randomHex(): string {
  return randomColor()
}

let inputColor = $state(
  isValidHexColor(urlColorWithHash) ? urlColorWithHash.toUpperCase() : randomHex()
)
```

## 変更するコンポーネント

- `app/src/routes/approximate/+page.svelte`
  - `randomcolor` のインポートを追加
  - `randomHex()` 関数を追加
  - `inputColor` の初期値フォールバックを `"#EE0026"` から `randomHex()` に変更

## 影響範囲の分析

- 影響範囲は `approximate/+page.svelte` のみ
- URLパラメータによる初期色の挙動は変更なし
- `randomcolor` パッケージはすでに `package.json` に含まれており、追加インストール不要
