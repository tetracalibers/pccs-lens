# F3：幾何パターン画像保存ボタンの改良 — 要求内容

## 変更・追加する機能の説明

`GeoPatternSection.svelte` の「PNG保存」ボタンを改良し、モバイル端末でもカメラロールへの保存が可能になるようにする。

## ユーザーストーリー

- スマートフォン・タブレットのユーザーとして、「画像を共有」ボタンをタップして共有シートからカメラロールへ保存したい
- タッチ対応端末のユーザーとして、画像を長押しで保存できることをヘルプテキストで知りたい
- PCユーザーとして、現在の「PNG保存」の挙動（ダウンロード）が変わらないことを期待する

## 受け入れ条件

1. 通常PC（`pointer: fine`, `hover: hover`）ではボタンラベルが「画像を保存」、クリックでPNGダウンロード、ヘルプテキスト非表示
2. スマートフォン・タブレット（`pointer: coarse`, `hover: none`）でWeb Share API利用可能な場合、ラベルが「画像を共有」、タップで共有シートを開く、ヘルプテキスト表示
3. スマートフォン・タブレットでWeb Share API利用不可の場合、ラベルが「画像を保存」、タップでPNGダウンロード、ヘルプテキスト表示
4. タッチ付きノートPC（`pointer: fine`, `hover: hover`, `any-pointer: coarse`）ではラベルが「画像を保存」、クリックでPNGダウンロード、ヘルプテキスト表示
5. SVG再生成中（bauhausLoading / geometricLoading が true）はボタンが disabled になる
6. iOS Safariで共有シートが正常に開く（async/await チェーンによるユーザーアクション維持）

## 制約事項

- `userAgent` や画面幅による端末判定を行わない
- ボタンラベルの判定・ヘルプテキスト表示判定はすべて CSS メディア特性または `navigator.canShare` で行う
- 変更対象ファイルは `app/src/lib/components/patterns/GeoPatternSection.svelte` のみ
