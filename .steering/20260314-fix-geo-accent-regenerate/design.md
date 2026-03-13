# 設計：アクセントカラー追加・削除時の幾何パターン再生成

## 問題の構造

`GeoPatternSection` は `colors: [string, string, string]` だけを受け取っていたため、
アクセントの追加・削除による「配色構造の変化」と「色相・トーンの変更」を区別できなかった。

- 色相・トーンの変更 → `colors` の値だけが変わる → 色置換（文字列置換）で対応できる
- アクセント追加・削除 → `colors` の値が変わる + 配色構造が変わる → 再生成が必要

## 実装アプローチ

`accentActive: boolean` prop を追加し、`$effect` 内でその変化を検知して再生成に切り替える。

### 判定ロジック

```ts
const accentChanged = _accentActive !== null && _accentActive !== accent

if (_bauhausColors === null || accentChanged) {
  // 初回 or アクセント変化 → 再生成
  setBauhaus(generateBauhaus(c), c)
} else if (!bauhausLoading) {
  // 色変更のみ → 文字列置換
  setBauhaus(updateSvgColors(_bauhausSvg, _bauhausColors, c), c)
}
_accentActive = accent
```

- `_accentActive` は plain 変数（`$effect` の依存に含めない）で前回値を保持
- 初回（`_accentActive === null`）は `accentChanged = false` となり、再生成は `_bauhausColors === null` の条件で行われる

## 変更するファイル

```
app/src/lib/components/patterns/GeoPatternSection.svelte
app/src/routes/patterns/[theme]/+page.svelte
```

## 変更内容

### `GeoPatternSection.svelte`

Props に `accentActive: boolean` を追加：

```ts
interface Props {
  colors: [string, string, string]
  themeId: string
  accentActive: boolean   // 追加
}
```

内部追跡用 plain 変数を追加：

```ts
let _accentActive: boolean | null = null
```

`$effect` にアクセント変化の検知と再生成トリガーを追加（上記ロジック参照）。

### `[theme]/+page.svelte`

```svelte
<GeoPatternSection
  colors={geoColors}
  themeId={theme.id}
  accentActive={showAccent && !!accentPCCS}
/>
```

## 影響範囲

| 操作 | 変更前 | 変更後 |
|---|---|---|
| 色相・トーン変更 | 文字列置換 | 文字列置換（変更なし） |
| アクセントカラー追加 | 文字列置換 | 再生成 |
| アクセントカラー削除 | 文字列置換 | 再生成 |
| 「画像を再生成」ボタン | 再生成 | 再生成（変更なし） |
