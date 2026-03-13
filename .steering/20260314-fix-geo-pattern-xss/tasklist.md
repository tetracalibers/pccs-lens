# タスクリスト：GeoPatternSection の XSS 警告修正

## タスク一覧

### T1. `GeoPatternSection.svelte` を修正する ✅

#### T1-1. data URI 生成用 `$derived` を追加する ✅
- `bauhausSrc`：`bauhausSvg` → `data:image/svg+xml;charset=utf-8,...`
- `geometricSrc`：`geometricSvg` → `data:image/svg+xml;charset=utf-8,...`

#### T1-2. `{@html}` を `<img>` に置き換える ✅
- バウハウス：`{@html bauhausSvg}` → `<img src={bauhausSrc} alt="バウハウスパターン" />`
- ジオメトリック：`{@html geometricSvg}` → `<img src={geometricSrc} alt="ジオメトリックパターン" />`

#### T1-3. スタイルを更新する ✅
- `.svg-wrapper :global(svg)` → `.svg-wrapper img`

### T2. 型チェックで確認する ✅
- `npx svelte-check` でエラー 0・XSS 警告なしを確認

## 完了条件

- [x] `{@html}` の使用箇所がゼロになっている
- [x] lint 警告が解消されている
- [x] 型チェックが通る
