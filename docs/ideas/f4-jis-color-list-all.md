---
created: 2026/04/21 06:08:44
---

# F4：慣用色名一覧リストページ

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

```ts
interface Props {
  familyId: ColorFamily
  jisColors: JISColor[]
}
```

#### 各慣用色名ごとに表示する情報

```
<div class="横並び（スマホでは縦並び）">
  <div class="横並び">
    <Icon icon={jisColor.icon} />
    <角丸正方形色スウォッチ />
    <div>
      <h2 id={jisColor.id}>{jisColor.name}</h2>
      <span>{jisColor.reading}</span>
      <div class="横並び">
        {#each jisColor.approximatePccs as pccs (pccs.notation)}
          <PCCSColor pccs={pccs.notation} />
        {/each}
      </div>
    </div>
  </div>
  <div class="横並び">
    <div class="横並び（スマホでは縦並び）">
      <p>{jisColor.originDescription}</p>
      <div>
        <ul>
          <li>系統色名：{jisColor.systematicName}</li>
          <li>マンセル値：{jisColor.munsell}</li>
        </ul>
        <a href={`/jis-color-map/${family.id}/`}>
          {family.name}を比較する
          <Icon icon="リンクっぽいアイコン" />
        </a>
      </div>
    </div>
    <級タグ />
  </div>
</div>
```

- 慣用色の`jisColor.name`表示要素には`id`属性を付与する（ページ上部のアイコン群からこの`id`の要素にリンクする）
- 級タグは @app/src/lib/components/jis-color-map/JisColorCompareSection.svelte と同様のスタイルのものを、コンポーネントとして共通化する

### 新規作成：慣用色名一覧リストページへのリンクカード

- @app/src/lib/components/jis-color-map/FamilyCard.svelte と同様に実装
- `.card-checker`は各familyからランダムに1色ずつ選んだ、7色の模様にする

## ページ

### 新規作成：慣用色名一覧リストページ（`/jis-color-map/all`）

- パンくずリスト・ページ見出しの下に、各慣用色で塗りつぶしたアイコン（アイコンIDは`jisColor.icon`）を並べて表示する
- アイコンをクリックすると、その慣用色名の詳細セクションに飛べる
- アイコン群の下に、慣用色名詳細セクションを並べる
- アイコンも慣用色名詳細セクションも、マンセル色相順（起点は2RP）に並べる

### 変更：慣用色名マップトップページ（`/jis-color-map`）

- `FamilyCard`の上に、慣用色名一覧リストページへのリンクカードを追加する

```
<h2>一覧で覚える</h2>
<p>由来やPCCS近似値など、色の詳細を学ぼう</p>
<慣用色名一覧リストページへのリンクカード />

<h2>比較して覚える</h2>
<p>似た色を比較して覚えよう</p>
<div class="grid">
  {#each familyCards as card (card.family.id)}
    <FamilyCard {...card} />
  {/each}
</div>
```
