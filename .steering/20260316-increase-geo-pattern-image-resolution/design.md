# 設計：幾何パターン画像の保存・共有解像度向上

## 実装アプローチ

`GeoPatternSection.svelte` の `generatePngBlob` 関数内で固定値になっている canvas サイズを変更する。

### 変更前
```ts
canvas.width = 300
canvas.height = 300
```

### 変更後
```ts
canvas.width = 1200
canvas.height = 1200
canvas.getContext("2d")!.drawImage(img, 0, 0, 1200, 1200)
```

> **注意点：** `drawImage(img, 0, 0)` のように描画先サイズを省略すると、SVG の自然サイズ（300×300）でそのまま描画され、残りの領域が空白になる。描画先の幅・高さを明示してキャンバス全体にスケールする必要がある。

## 解像度選定の根拠

| 解像度 | 評価 |
|--------|------|
| 300×300 | 現状。Retina環境で粗い |
| 600×600 | 改善されるが SNS 共有では物足りない |
| **1200×1200** | **採用。モバイル画面等倍（1080〜1440px）をカバー。PNG 200〜400KB 程度で共有に問題なし** |
| 2400×2400 | オーバースペック。低スペック端末で `canvas.toBlob` が重くなるリスクあり |

## 変更するコンポーネント

- `app/src/lib/components/patterns/GeoPatternSection.svelte`
  - `generatePngBlob` 関数（104〜126行目）の canvas 生成部分のみ

## 影響範囲の分析

- **通常操作への影響なし**：`generatePngBlob` はボタンクリック時にのみ呼ばれる
- **表示用 data URI への影響なし**：`bauhausSrc` / `geometricSrc` は SVG のまま
- **バウハウス風・ジオメトリックの両方に適用**：どちらも同じ `generatePngBlob` を経由する
