# 要求内容：GeoPatternSection の XSS 警告修正

## 背景

`GeoPatternSection.svelte` で使用していた `{@html}` ディレクティブに対して、
Svelte の lint ルール（`svelte/no-at-html-tags`）が XSS 攻撃のリスクとして警告を出していた。

## 変更・追加する機能の説明

`{@html svgString}` によるインライン SVG レンダリングを、XSS リスクのない代替方式に変更する。

## 受け入れ条件

1. `{@html}` を使わずにパターン SVG を表示できる
2. lint 警告が解消される
3. 型チェックが通る
4. パターンの見た目・アスペクト比が変わらない
5. PNG 保存機能に影響しない

## 制約事項

- SVG ジェネレーターは自前生成のため実質的な XSS リスクはないが、lint ルールへの準拠と将来的な安全性のために修正する
