# 要求内容

## 概要

HueSelectorとToneSelectorの表示ロジックを簡素化する。

## 変更内容

### 1. HueSelector：全色相の扇形を塗りつぶし表示に変更

- **変更前**：サジェストされた色相のみ扇形を塗りつぶし、それ以外は `fill="transparent"` で枠線のみ表示
- **変更後**：全24色相の扇形を塗りつぶし表示する

### 2. HueSelector / ToneSelector：opacity を3段階から2段階に簡素化

- **変更前（3段階）**：
  - suggested → opacity 1.0（濃い）
  - allowed（許可だが推奨外） → opacity 0.5〜0.55（中間）
  - その他 → opacity 0.2（薄い）
- **変更後（2段階）**：
  - suggested → opacity 1.0（濃い）
  - それ以外 → opacity 0.2（薄い）

## 背景・理由

- allowedHues/allowedTones（テーマ全体の許可範囲）とsuggestedHues/suggestedTones（ロール・選択色に応じた動的推奨値）という2つの概念があったが、UI上では推奨されるものだけを濃く表示すれば十分
- 中間の "allowed だが suggested でない" 状態を視覚的に区別する必要がないと判断

## 受け入れ条件

- 全24色相の扇形が塗りつぶしで表示される
- suggested に含まれる色相・トーンは opacity 1.0 で濃く表示される
- それ以外の色相・トーンは opacity 0.2 で薄く表示される
- 型エラーが発生しない
