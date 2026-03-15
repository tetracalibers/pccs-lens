# F3：幾何パターン画像保存ボタンの改良

- 変更対象ファイル：`app/src/lib/components/patterns/GeoPatternSection.svelte`

## 現状の問題

- モバイル端末で「PNG保存」ボタンをクリックしても、カメラロールに保存することができない

## 改善案の概要

- Web Share APIによる共有シートからカメラロールへの保存を選択できるようにする
- 画像を長押しで保存できることを明示する

## 詳細な実装プラン

### ボタンのラベルの変更

「PNG保存」というボタンのラベルを次のように変更する：

- Web Share APIが使えないブラウザでは「画像を保存」とする
- PC（タッチ対応ノートPCや2 in 1 PCを含む）では「画像を保存」とする
  - 判定条件：`(hover: hover) and (pointer: fine)` にマッチ
- Web Share APIが利用可能なスマートフォンやタブレット端末では「画像を共有」とする
  - 判定条件（ANDで組み合わせる）：
    - 指タッチ操作端末：`pointer: coarse` にマッチ
    - ペンやマウスカーソルによる hover ができない：`hover: none` にマッチ（これはタッチ対応ノートPCや2 in 1 PCを除外するための条件）
    - Web Share APIが利用可能：`navigator.canShare({ files: [...] })` が `true`

### 判定条件の組み合わせ一覧

| 端末の例 | `pointer` | `hover` | Web Share API | 表示ラベル | クリック時挙動 | ヘルプテキスト |
|---|---|---|---|---|---|---|
| 通常のPC | `fine` | `hover` | — | 画像を保存 | PNGダウンロード | 非表示 |
| タッチ対応ノートPC・2 in 1 PC | `fine` | `hover` | — | 画像を保存 | PNGダウンロード | 表示 |
| ペン入力端末（Surface等）| `fine` | `none` | — | 画像を保存 | PNGダウンロード | 表示（タッチ併用の場合） |
| スマートフォン・タブレット（Share APIあり） | `coarse` | `none` | 利用可能 | 画像を共有 | 共有シートを開く | 表示 |
| スマートフォン・タブレット（Share APIなし） | `coarse` | `none` | 利用不可 | 画像を保存 | PNGダウンロード | 表示 |

### 判定条件の注意点

- `userAgent` や画面幅の条件で判定することは避ける
- この注意点はボタンラベルの判定・ヘルプテキストの表示判定の両方に適用する

### クリック時の処理の出し分け

- 「画像を保存」ボタンが表示される条件下では、ボタンの挙動は現状のまま変えない。
- 「画像を共有」ボタンが表示される条件下では、クリック時にWeb Share APIで画像の共有シートを開くようにする

#### Web Share APIの呼び出し手順

1. 既存の `downloadPng` のPNG Blob生成ロジックをユーティリティ関数（`generatePngBlob`）として切り出す
   - `generatePngBlob(svgString: string): Promise<Blob>` として実装する
   - `canvas.toBlob` はPromise化し、`async/await` で整理する（後述のiOS Safari制約を参照）
2. 「画像を共有」クリック時は次の手順で処理する：
   - `const blob = await generatePngBlob(svgString)` でBlob取得
   - `const file = new File([blob], 'pattern.png', { type: 'image/png' })` でFileオブジェクトに変換
   - `navigator.canShare({ files: [file] })` で共有可能か事前確認
   - `await navigator.share({ files: [file], title: 'カラーパターン' })` を呼び出す

**注意（iOS Safariのユーザーアクション制約）：**
iOS Safariでは `navigator.share()` はユーザーアクションに直接紐づいたコールスタック内でのみ呼び出せる。`canvas.toBlob` をPromise化して `async/await` でつなぎ、クリックイベントハンドラから `await` のチェーンで処理することでコールスタックを維持する。コールバック方式のまま実装するとiOS Safariで「ユーザージェスチャが必要」エラーになる。

#### エラーハンドリング

- `AbortError`（ユーザーが共有シートをキャンセル）：何もしない
- それ以外のエラー：`console.error` でログ出力のみ

### ボタンの `disabled` 条件

現状の `disabled={!bauhausSvg}` を次のように変更する：

- `disabled={!bauhausSvg || bauhausLoading}`
- ジオメトリックパターンも同様：`disabled={!geometricSvg || geometricLoading}`

SVG再生成中は古い画像が共有されることを防ぐため、ローディング中も `disabled` にする。
再生成の処理時間は短いため、UX上の影響は小さい。

### PNG Blob生成処理の共有

「保存」と「共有」のどちらの処理フローでもPNG Blob生成ロジックは共通である。既存の `downloadPng` 関数からBlob生成部分を `generatePngBlob` として切り出し、保存・共有の両フローで再利用する。

### Svelteでの実装方針

- `pointer: coarse` と `hover: none` の判定は `window.matchMedia('(pointer: coarse) and (hover: none)')` で評価する
- `navigator.canShare` の有無はJavaScriptの実行時チェックで評価する
- これらの条件は `$derived` または `onMount` 内で評価し、リアクティブな変数として保持する

### 長押し保存を促すヘルプの追加

- タッチ対応端末（タッチ対応ノートPCや2 in 1 PCを含む）では、`<h2>幾何パターン</h2>` の直後に「画像を長押しすると保存できます」という文章を1つ表示する
  - 表示位置：`<h2>` の直後、2つのパターンカード（バウハウス・ジオメトリック）を包含するグリッドの上
  - 常時表示（LocalStorage等による表示制御は行わない）
  - 判定条件：`any-pointer: coarse` にマッチ

※ タッチ機能があればタッチ操作による長押し保存は常に可能なため、Web Share APIの有無にかかわらずヘルプを表示する

## 検証シナリオ

| # | 端末条件 | 期待ラベル | 期待クリック挙動 | ヘルプテキスト |
|---|---|---|---|---|
| 1 | `pointer: fine`, `hover: hover`（通常PC） | 画像を保存 | PNGダウンロード | 非表示 |
| 2 | `pointer: coarse`, `hover: none`, `navigator.canShare` あり | 画像を共有 | 共有シートを開く | 表示 |
| 3 | `pointer: coarse`, `hover: none`, `navigator.canShare` なし | 画像を保存 | PNGダウンロード | 表示 |
| 4 | `pointer: fine`, `hover: hover`, `any-pointer: coarse`（タッチ付きノートPC） | 画像を保存 | PNGダウンロード | 表示 |
| 5 | SVG再生成中（`bauhausLoading: true`） | — | ボタンが disabled | — |

- `navigator.share` および `navigator.canShare` はテスト時に `vi.stubGlobal` でモックする
- Playwrightでのポインター条件のシミュレートには `emulateMedia` を使用する
