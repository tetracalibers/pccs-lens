---
name: svelte-component-guideline
description: Svelteコンポーネントの実装時に使用するガイドライン。
---

## ロジックの記述

- ロジックは TypeScript + Svelte 5 Runes で記述する

## Propsの定義

- Propsの型は `interface Props` として定義する
- `$props()` で分割代入する

```ts
import type { Snippet } from "svelte"

interface Props {
  children: Snippet
  maxW?: number
}

let { children, maxW }: Props = $props()
```
