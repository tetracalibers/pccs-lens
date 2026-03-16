# トップページのPCCSイメージ解説をモーダル化

- 変更対象：`app/src/lib/components/index/ToneImageDiagram.svelte`
- 参照データセット：
  - `app/src/lib/data/pccs_tone.json`
  - `app/src/lib/data/pccs_colors_full.json`（偶数番号の色相のみ使う）

## 変更内容

- `ToneImageDiagram`の各トーンクリック時に、ツールチップではなくモーダルでトーンのイメージなどを表示するようにする
- View Transition APIを使用し、モーダルがバブルのように揺らぎながら連続的に遷移するようにする

### モーダルの構成

- 上部には色相2〜12の正方形色スウォッチを並べる
- 下部には色相14〜24の正方形色スウォッチを並べる
- `feelings`はこのトーンのうち、それぞれ言葉に合う色相を選んだ色を背景色とするタグクラウドとして表示する
- `categories`も列挙する

```
<色スウォッチ /> x 6

<h2>{{ toneNameEn }}</h2>
<FeelingsTagCloud />
<Categories />

<色スウォッチ /> x 6
```
