# F3：幾何パターン画像保存ボタンの改良 — 設計

## 実装アプローチ

### 端末判定ロジック

`onMount` 内で以下を評価し、リアクティブな変数として保持する。

```
// onMount 内のローカル変数（リアクティブ不要）
const isTouchPrimary = window.matchMedia('(pointer: coarse) and (hover: none)').matches
const canShareFiles  = typeof navigator.canShare === 'function' && navigator.canShare({ files: [dummyFile] })
// テンプレートで使用するため $state（onMount 後に再レンダリングが必要）
useShareApi = isTouchPrimary && canShareFiles
```

- `isTouchPrimary`, `canShareFiles`: `onMount` 内のローカル変数。テンプレートから参照しないためリアクティブ不要
- `useShareApi`: テンプレートで参照するため `$state`。初期値 `false`、`onMount` で確定値をセット

ヘルプテキストの表示判定は CSS のみで行う（JS 不要）：
```css
/* any-pointer: coarse にマッチする端末でのみ表示 */
.touch-hint { display: none; }
@media (any-pointer: coarse) {
  .touch-hint { display: block; }
}
```

### PNG Blob 生成の切り出し

既存の `downloadPng` からBlob生成部分を `generatePngBlob` として切り出す。

```ts
async function generatePngBlob(svgString: string): Promise<Blob> {
  const blob = new Blob([svgString], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  img.src = url
  await new Promise<void>((resolve) => { img.onload = () => resolve() })

  const canvas = document.createElement("canvas")
  canvas.width = 300
  canvas.height = 300
  canvas.getContext("2d")!.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error("toBlob failed"))
    }, "image/png")
  })
}
```

`canvas.toBlob` をコールバックではなく Promise に変換することで、`async/await` チェーンを維持し、iOS Safari のユーザーアクション制約を満たす。

### downloadPng の変更

`generatePngBlob` を利用して実装し直す。

```ts
async function downloadPng(svgString: string, filename: string) {
  const pngBlob = await generatePngBlob(svgString)
  const a = document.createElement("a")
  a.href = URL.createObjectURL(pngBlob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
```

### sharePng の追加

```ts
async function sharePng(svgString: string, filename: string, title: string) {
  try {
    const pngBlob = await generatePngBlob(svgString)
    const file = new File([pngBlob], filename, { type: "image/png" })
    if (!navigator.canShare({ files: [file] })) return
    await navigator.share({ files: [file], title })
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return
    console.error(e)
  }
}
```

### ボタン disabled 条件の変更

| 対象 | 変更前 | 変更後 |
|---|---|---|
| バウハウス保存ボタン | `disabled={!bauhausSvg}` | `disabled={!bauhausSvg \|\| bauhausLoading}` |
| ジオメトリック保存ボタン | `disabled={!geometricSvg}` | `disabled={!geometricSvg \|\| geometricLoading}` |

### ボタンラベルの出し分け

```svelte
{useShareApi ? "画像を共有" : "画像を保存"}
```

### クリック時ハンドラの出し分け

バウハウス例：
```svelte
onclick={() =>
  useShareApi
    ? sharePng(bauhausSvg, `${themeId}-bauhaus.png`, `${themeName}なバウハウス風パターン`)
    : downloadPng(bauhausSvg, `${themeId}-bauhaus.png`)
}
```

※ `themeName` は Props として受け取る（詳細は変更するコンポーネントを参照）

### ヘルプテキストの追加

`<h2>幾何パターン</h2>` の直後、`.patterns-grid` の前に配置：
```svelte
<p class="touch-hint">画像を長押しすると保存できます</p>
```

CSS で `any-pointer: coarse` の端末のみ表示。

## 変更するコンポーネント

### `GeoPatternSection.svelte`

**Props の追加**
- `themeName: string` — 共有タイトル生成に使用（例：「シック」「エレガント」）

**追加する状態変数**
- `let useShareApi = $state(false)` — 初期値 `false`、`onMount` 内で確定値をセット。`isTouchPrimary` / `canShareFiles` は `onMount` 内のローカル変数として扱う

**追加する関数**
- `generatePngBlob(svgString)` — Blob生成ユーティリティ
- `sharePng(svgString, filename, title)` — Web Share API 呼び出し

**変更する関数**
- `downloadPng` — `generatePngBlob` を使って実装し直す

**テンプレート変更**
- `<h2>幾何パターン</h2>` 直後に `<p class="touch-hint">` を追加
- 保存ボタン2つのラベル・クリックハンドラ・disabled 条件を更新

**スタイル追加**
- `.touch-hint` スタイルと `@media (any-pointer: coarse)` による表示制御

## 影響範囲の分析

- 変更ファイルは `GeoPatternSection.svelte` 1ファイルのみ
- Props に `themeName` を追加するため、呼び出し元（親コンポーネント）への変更が必要
