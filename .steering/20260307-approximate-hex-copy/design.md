# 設計：近似結果カードのHEXコード表示＋コピーボタン

## 実装アプローチ

コピーボタンを汎用コンポーネント `CopyButton.svelte` として切り出す。
`/approximate` ページでそのコンポーネントを使用し、HEXコードの隣に配置する。

## 変更・追加するコンポーネント

### 新規：`app/src/lib/components/CopyButton.svelte`

#### Props

| prop | 型 | 説明 |
|---|---|---|
| `text` | `string` | コピーするテキスト |

#### 動作

- アイコンのみのボタンを表示する（ラベルテキストなし）
- コピーアイコンは SVG インラインで実装する（外部ライブラリ不使用）
- ボタン押下で `navigator.clipboard.writeText(text)` を実行する
- コピー成功後 1500ms の間、ボタン上に `"Copied!"` ツールチップを表示する
- `aria-label="コードをコピー"` を付与してアクセシビリティを確保する

#### ツールチップの実装方針

- CSS の `position: relative` + `::after` 疑似要素、またはインライン要素でツールチップを実装する
- コピー済み状態（`copied`）を `$state` で管理し、表示を切り替える

### 変更：`app/src/routes/approximate/+page.svelte`

#### テンプレート変更

`.delta-e` の `<span>` を以下の構造に置き換える：

```
<span class="hex-code">{result.color.hex}</span>
<CopyButton text={result.color.hex} />
```

#### スタイル変更

- `.delta-e` スタイルを削除
- `.hex-code` スタイルを追加（monospace・右寄せ・セカンダリカラー）

## データ構造の変更

なし。`result.color.hex` は既存フィールドをそのまま利用する。

## 影響範囲の分析

- 追加ファイル：`app/src/lib/components/CopyButton.svelte`
- 変更ファイル：`app/src/routes/approximate/+page.svelte`
- `docs/functional-design.md` のワイヤフレームにΔE₀₀の記述はなく、設計書との不整合はない
  - ただし PCCSResultCard の説明に「コピーボタン」の記載を追加する必要がある
