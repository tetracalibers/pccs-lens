---
created: 2026/04/19 11:15:49
---

# F4：慣用色名比較マップ（比較セクション）

`app/src/routes/jis-color-map/[family]/+page.svelte` の慣用色名マップの下に、似た色を見分ける練習ができるセクションを追加する。

## 実装上の留意事項

- コンポーネント固有でないロジックやユーティリティは @app/src/lib/jis-color-map 配下にTSファイルとして切り出す
  - 特に、慣用色名マップ（既存）と慣用色名ミニマップ（新規）で重複する処理もTSファイルに切り出す
  - ただし、マンセル値関連のロジックは @app/src/lib/color/munsell.ts に実装する
  - また、データ取得に関するロジックは @app/src/lib/data/jis-colors.ts に実装する
- @app/src/lib/color 配下と @app/src/lib/data 配下の関数を積極的に利用する
- 今回新規実装するsvelteコンポーネントは @app/src/lib/components/jis-color-map 配下に配置する
- このメモの中に書かれたコードはすべて疑似コードであり、変数名、プロパティ名、Props名などは仮称なので、適切な命名を考えて実装する

## コンポーネント

### 新規作成：慣用色比較セクション

```ts
interface Props {
  familyId: ColorSubfamily
  compare: JISCompareSection
}
```

#### 慣用色名ミニマップの表示

次のようにPropsを渡して表示する。

```
<慣用色名ミニマップ groupId={familyId} highlightsJisIds={compare.targets} hintJisIds={compare.hintJIS} hintPCCSHueNums={compare.hintPCCSHue} />
```

#### 慣用色一覧

慣用色名ミニマップの右（モバイルでは下）に、`compare.targets`に含まれる慣用色の一覧を表示する。

```
<div class="横並び">
  {#each targets as jisColor (jisColor.id)}
    <div class="横並び">
      <級タグ />
      <慣用色プレビュー />
      <慣用色の情報 />
    </div>
  {/each}
  <div class="横並び">
    <div>
      {#if マンセル色相が異なる}
        <色み比較図 />
      {/if}
    </div>
    <div>
      {#if マンセル明度が異なる}
        <明度比較図 />
      {/if}
    </div>
    <div>
      {#if マンセル彩度が異なる}
        <彩度比較図 />
      {/if}
    </div>
  </div>
  {#each targets as jisColor (jisColor.id)}
    <慣用色の解説 />
  {/each}
</div>
```

#### 慣用色プレビュー

- 角丸正方形を慣用色のHEXコードで塗りつぶす

#### 慣用色の情報

- `name`・`systematicName`・`munsell`を縦並びで表示
- テキストは中央寄せ
- 文字サイズは`name > systematicName > munsell`

#### 慣用色の解説

- `colorDescription`の内容を表示する
- テキストは中央揃え
- `colorDescription`に空白が含まれる場合は、その空白位置で改行して表示する

#### 色み比較図

マンセル色相が異なる慣用色が含まれる場合に、上下両端がどの色相寄りかを表す図を表示する。

- 色相ラベル・両方向矢印・色相ラベル を縦に並べる
- 両端のラベル含めてコンテナの高さいっぱいに広がるように、矢印の長さを調整する
- 色相ラベルは「赤」「黄」「緑」「青」「紫」のいずれか
- 矢印は両端のラベルに応じた色のグラデーションにする

#### 明度比較図

マンセル明度が異なる慣用色が含まれる場合に、上下両端のどちらが高明度・低明度かを表す図を表示する。

- 明度ラベル・片方向矢印・明度ラベル を縦に並べる
- `compare.targets`の要素数が3以上で、明度の順に並んでいない場合は、中間にも明度ラベルを挟み、明度ラベル・片方向矢印・明度ラベル・片方向矢印・明度ラベル という構成にする
- 両端のラベル含めてコンテナの高さいっぱいに広がるように、矢印の長さを調整する
- 明度ラベルは「低明度」「高明度」のいずれか（相対的に判断する）
- 矢印は高明度に向かう方向に矢をつける
- 矢印は高明度方向に向かって明るくなるグレイのグラデーションにする

#### 彩度比較図

マンセル彩度が異なる慣用色が含まれる場合に、上下両端のどちらが高彩度・低彩度かを表す図を表示する。

- 彩度ラベル・片方向矢印・彩度ラベル を縦に並べる
- `compare.targets`の要素数が3以上で、彩度の順に並んでいない場合は、中間にも彩度ラベルを挟み、彩度ラベル・片方向矢印・彩度ラベル・片方向矢印・彩度ラベル という構成にする
- 両端のラベル含めてコンテナの高さいっぱいに広がるように、矢印の長さを調整する
- 彩度ラベルは「低彩度」「高彩度」のいずれか（相対的に判断する）
- 矢印は高彩度に向かう方向に矢をつける
- 矢印は高彩度方向に向かって鮮やかになる`ColorFamily`色相のグラデーションにする

### 新規作成：慣用色名ミニマップ

```ts
interface Props {
  groupId: ColorSubfamily
  highlightsJisIds: string[]
  hintJisIds?: string[]
  hintPCCSHueNums?: number[]
}
```

@app/src/lib/components/jis-color-map/JisColorMap.svelte と同様に、groupIdに属する慣用色を色相・明度順に並べたマップを描画する。

- ミニマップなので、セルの大きさを小さく設定し、コンパクトな図にする
- groupIdに属する慣用色セルはコンパクト慣用色スウォッチで表示する
- `hintJisIds`に含まれる慣用色名セルは参考慣用色スウォッチで表示する
- PCCS色相セルは既存の @app/src/lib/components/jis-color-map/PccsSwatch.svelte で表示する
- `highlightsJisIds`に含まれない慣用色と`hintPCCSHueNums`に含まれない色相セルは`opacity: 0.2;`で表示する

### 新規作成：コンパクト慣用色スウォッチ

慣用色名ミニマップでは、 @app/src/lib/components/jis-color-map/JisColorSwatch.svelte の代わりにここで定義する新規コンポーネントを使う。

- 慣用色名ラベルは正方形内には表示せず、hover時にツールチップとして表示する
- `nameSegments`が指定されている場合は、その要素ごとに改行して表示する

### 新規作成：参考慣用色スウォッチ

慣用色名ミニマップで、`helpJIS`内の色を表すセルとして使う。

- 正六角形を、その慣用色のHEXコードで塗りつぶす
- 慣用色名ラベルはhover時にツールチップとして表示する
- `nameSegments`が指定されている場合は、その要素ごとに改行して表示する

## ページ

### 変更：慣用色名マップページ（`/jis-color-map/[family]`）

慣用色名マップの下に、subfamilyごとの次のようなセクションを追加する。

- subfamilyの`name`ラベルをセクション見出しとして表示する
- セクション内には、`compareSections`の順に慣用色比較セクションを並べる
