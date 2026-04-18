---
created: 2026/04/19 05:32:40
---

# F4：慣用色名比較マップ（色みごとのページ）

## 実装上の留意事項

- コンポーネント固有でないロジックやユーティリティは @app/src/lib/jis-color-map 配下にTSファイルとして切り出す
  - ただし、マンセル値関連のロジックは @app/src/lib/color/munsell.ts に実装する
  - また、データ取得に関するロジックは @app/src/lib/data/jis-colors.ts に実装する
- @app/src/lib/color 配下と @app/src/lib/data 配下の関数を積極的に利用する
- 今回新規実装するページで使うsvelteコンポーネントは @app/src/lib/components/jis-color-map 配下に配置する
- このメモの中に書かれたコードはすべて疑似コードであり、変数名、プロパティ名、Props名などは仮称なので、適切な命名を考えて実装する

## ページ

### 変更：慣用色名マップ一覧ページ（`/jis-color-map`）

- 現在の @app/src/routes/jis-color-map/+page.svelte に掲載された慣用色名マップは削除する
- 代わりに、`/jis-color-map/[family]`へのリンクを @app/src/routes/patterns/+page.svelte と同様のデザインで配置する
- リンクの市松模様に使われる色は、そのfamilyの色の中からランダムに選択する

### 新規作成：慣用色名マップページ（`/jis-color-map/[family]`）

- `[family]`の部分には`ColorFamily`型の文字列が入る
- `family`の値に応じた慣用色名マップを表示する
- ページ冒頭には「〜系の慣用色名マップ」という見出しと、 @app/src/lib/components/Breadcrumb.svelte によるパンくずリストを表示する
  - パンくずリストの表示内容：「慣用色名マップ > 〜系」
