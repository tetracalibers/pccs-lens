---
name: css-styling-guideline
description: CSSコーディングガイドライン。CSSコードを書く際に使用。
---

## 配色モードごとのスタイル

- 配色モードによって異なる色は、`light-dark()`関数を使って定義する
- 配色モードによって異なるスタイルは、`@media (prefers-color-scheme: light)`と`@media (prefers-color-scheme: dark)`内でそれぞれ指定する
