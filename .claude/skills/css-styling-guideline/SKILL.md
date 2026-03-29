---
name: css-styling-guideline
description: CSSコーディングガイドライン。CSSコードを書く際に使用。
---

## 配色モードごとのスタイル

- 配色モードによって異なる色は、`light-dark()`関数を使って定義する
- 配色モードによって異なるスタイルは、`:global(.light)`と`:global(.dark)`内でそれぞれ指定する
