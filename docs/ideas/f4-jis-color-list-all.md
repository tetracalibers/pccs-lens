---
created: 2026/04/21 06:08:44
---

# F4：慣用色名一覧リストページ

TODO: このページの目的

## 実装上の留意事項

- コンポーネント固有でないロジックやユーティリティは @app/src/lib/jis-color-map 配下にTSファイルとして切り出す
  - ただし、マンセル値関連のロジックは @app/src/lib/color/munsell.ts に実装する
  - また、データ取得に関するロジックは @app/src/lib/data/jis-colors.ts に実装する
- @app/src/lib/color 配下と @app/src/lib/data 配下の関数を積極的に利用する
- 今回新規実装するsvelteコンポーネントは @app/src/lib/components/jis-color-map 配下に配置する
- このメモの中に書かれたコードはすべて疑似コードであり、変数名、プロパティ名、Props名などは仮称なので、適切な命名を考えて実装する

## データ

### allオプションの廃止

- @app/src/lib/data/jis-colors.ts の`JISColorGroupId`から`"all"`を削除する
- 慣用色名マップコンポーネントやページのスラッグでも`all`は指定できないようにする

## コンポーネント

### 新規作成：慣用色名詳細セクション

TODO

```ts
interface Props {
  familyId: ColorFamily
  jisColors: JISColor[]
}
```

#### 各慣用色名ごとに表示する情報

- 慣用色の名前や表記（`name`・`reading`・`systematicName`・`munsell`）
- 角丸正方形色スウォッチ
- PCCS近似値（`approximatePccs`）
- 由来（`originDescription`）
- イメージに合うアイコン
- `/jis-color-map/[family]`へのリンク

TODO: ざっくりとしたレイアウト

### 新規作成：全慣用色名リストへのリンクカード

TODO

## ページ

### 新規作成：慣用色名一覧リストページ（`/jis-color-map/all`）

TODO

- ページ上部には各慣用色で塗りつぶしたアイコンを並べて表示する
- アイコンをクリックすると、その慣用色名の詳細セクションに飛べる
- アイコン群の下に、慣用色名詳細セクションを並べる
- アイコンも慣用色名詳細セクションも、マンセル色相順に並べる（TODO: 起点を調べる）

### 変更：慣用色名マップトップページ（`/jis-color-map`）

- `FamilyCard`の上に、慣用色名リストへのリンクカードを追加する

```
<h2>一覧で覚える</h2>
<p>由来やPCCS近似値など、色の詳細を学ぼう</p>
<慣用色名リストページへのリンクカード />

<h2>比較して覚える</h2>
<p>似た色ごとに比較して覚えよう</p>
<div class="grid">
  {#each familyCards as card (card.family.id)}
    <FamilyCard {...card} />
  {/each}
</div>
```
