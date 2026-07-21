# nested-fig 図版の白背景ノックアウト（透過）オプション

nested-fig の OGP 画像で、白背景の図版を埋め込む前に **背景の白を透過（ノックアウト）** してから埋め込むオプションを追加する。透過するかどうかはスキル `generate-ogp-image` がユーザーに確認し、透過済みの PNG を `ogimage/data/assets/` に保存して、一括再生成時はそれをそのまま使う。

## 目的・背景

- nested-fig の OGP で白背景の図版をそのまま埋め込むと、白い矩形が装飾背景（白ベース＋淡いにじみ）の上に「箱」として浮いて見える。
- 図版の白背景を透過してから埋め込み、装飾背景に馴染ませたい。
- 対象は白背景の図版のみ。透過の要否はスキルがユーザーに確認する（黒背景など不適な図版への誤適用を防ぐ）。

## スコープ

### やること

- render の payload に、有効化フラグ `knockoutWhite` と可変パラメータ `magickFuzz` を追加。
- `knockoutWhite: true` のとき、手渡し PNG に ImageMagick で「背景に繋がった白」を flood-fill 透過し、**透過 PNG を埋め込み＆ `ogimage/data/assets/<route>/figure.png` に保存**。
- スキル `generate-ogp-image` が nested-fig 図版について透過の要否を確認し、確定値を payload に載せる。
- README に「透過オプションは生成時に ImageMagick が必要」を明記。

### やらないこと

- 黒・その他色の背景除去（白のみ）。
- アルファ比例のきれいな縁抜き（2 値 flood-fill のみ。縁ハロは許容し `magickFuzz` で調整）。
- 内部の白（白抜き文字・白い塗り）の除去（背景に繋がった白だけ消す＝内部白は残す）。
- 白背景の原本の保持（regenerate に不要。再調整は図版を再エクスポートして再生成）。
- PNG 以外（JPEG / WebP / SVG）への適用。
- CI での透過処理（生成は手動・ローカルのみ。regenerate・CI は magick 非依存）。

## ユーザーストーリー・主要ユースケース

- 開発者が白背景の図版で nested-fig の OGP を作る。スキルが「白背景を透過する？」と確認 → yes なら透過して埋め込み、装飾背景に馴染んだ OGP になる。
- 後日リデザインで一括再生成しても、保存済みの透過 PNG がそのまま使われ、magick 無しで同結果になる。

## 機能要件

- payload（render.mjs / regenerate 共有の確定値 JSON）に追加：
  - `knockoutWhite: boolean`（省略時 `false`）。`variation: "nested-fig"` かつ `figure` が PNG のときのみ有効。
  - `magickFuzz: string`（省略時 `"5%"`）。ImageMagick の `-fuzz` に渡す値。`knockoutWhite: true` のときだけ意味を持つ。
- 処理フロー（`knockoutWhite: true` 時）：
  1. 手渡し PNG を入力に、次を実行して透過 PNG（一時ファイル）を得る：

     ```
     magick <in.png> -bordercolor white -border 1x1 -alpha set -channel RGBA \
       -fuzz <magickFuzz> -fill none -floodfill +0+0 white -shave 1x1 <out.png>
     ```

     - `-bordercolor white -border 1x1`: 外周に白 1px を足し、`-floodfill +0+0` の種を必ず白にする（図版が角まで描かれていても背景から flood できる）。
     - `-fuzz <magickFuzz>`: アンチエイリアスや微妙な off-white を吸収。
     - `-fill none -floodfill +0+0 white`: 左上から白を flood-fill で透過。背景に繋がった白のみ消え、内部の白は残る。
     - `-shave 1x1`: 足した枠を除去。
  2. 得た透過 PNG を figure として、既存の埋め込み（`buildFigure`）と永続コピー（`copyFigureIntoData` → `ogimage/data/assets/<route>/figure.png`）に渡す。
  3. 一時ファイルは処理後に削除。
- ImageMagick はサブプロセスで呼ぶ（引数配列渡し。shell を介さない）。
- スキル側：nested-fig 図版で透過の要否を確認し、`knockoutWhite`（必要なら `magickFuzz`）を payload に載せる。既定 fuzz は `"5%"`。

## 既存機能との関係・整合

- `spec/ogp-image-generation.md`（生成）・`spec/ogp-image-regeneration.md`（記録・一括再生成）の拡張。
- `buildFigure`（`ogimage/lib/build-svg.mjs`）は無改修：渡された PNG のバイト列をそのまま data URI 化して埋め込む（透過アルファは保持される）。
- `copyFigureIntoData`（`ogimage/lib/record.mjs`）も無改修：透過 PNG が `ogimage/data/assets/<route>/figure.png` として保存される。
- **記録（record）には透過フラグ・fuzz を持たせない**。regenerate は保存済み透過アセットをそのまま埋め込み、magick を再実行しない → regenerate・CI は magick 非依存のまま。
- マニフェスト（`app/src/lib/meta/og-manifest.json`）更新への影響なし。

## ドメインルール上の考慮

- 色理論ドメインには影響しない（図版の見た目のみ。透過で図版の色そのものは変えない）。

## データ・状態

- 記録スキーマ（`OgRecord`）に追加フィールドなし（透過フラグは持たせない方針）。
- `ogimage/data/assets/<route>/figure.png` の中身が「透過済み PNG」になる（従来は手渡しそのまま）。
- 白背景の原本はどこにも保持しない。

## エッジケース・異常系

- **ImageMagick 未インストール**（ENOENT）：明確なエラーで停止（fail-fast）。「knockoutWhite には ImageMagick が必要」の旨を伝える。
- **magick が非 0 終了**：エラー内容を出して停止。
- **`magickFuzz` が不正値**：想定書式でバリデーションし、不正なら描画前に停止。
- **figure が PNG でない**（jpg/webp/svg）のに `knockoutWhite: true`：エラーで停止（PNG 限定）。
- **背景と繋がらない白ポケット**（内部で囲まれた白）：flood-fill の仕様上残る＝内部白は保持（意図通り）。
- **白背景でない図版に誤って有効化**：magick は白が無ければ実質何も消さない。誤適用の一次防御はスキルの可否確認。
- **既に透過済みの PNG に適用**：外周の白／透過を再度透過にするだけで概ね無害（運用上は `knockoutWhite` を付けない）。

## 非機能要件

- **セキュリティ**：サブプロセスは `execFile` 系で引数配列渡し（shell を介さない）。`magickFuzz`・ファイルパスをコマンド文字列に展開しない。fuzz はバリデーションする。
- **依存**：ImageMagick 7（`magick`）を「生成時のローカル依存」として追加。CI・regenerate は非依存。README に前提を明記。
- **パフォーマンス**：1 図版につき magick 1 プロセス（生成時のみ・少数）。無視できる範囲。

## 制約

- ImageMagick 7 の `magick` を前提とする。
- 透過処理は PNG 入力のみ。出力も PNG。
- 生成は手動・ローカルのみ（CI では走らせない）。

## 受け入れ条件

- 白背景の PNG 図版に `knockoutWhite: true` を付けて nested-fig を生成すると、背景が透過され装飾背景に馴染んで埋め込まれる。内部の白は残る。
- `magickFuzz` を変えると縁の抜け具合が変わる（省略時 5%）。
- 生成後、`ogimage/data/assets/<route>/figure.png` が透過 PNG になっている。記録に透過フラグは無い。
- `regenerate.mjs` を実行すると、magick 無しで同じ透過結果の OGP が再生成される。
- PNG 以外や magick 未導入では、明確なエラーで停止する。
- スキルが nested-fig 図版で透過の要否を確認し、payload に `knockoutWhite`（必要なら `magickFuzz`）を反映する。

## 未確定・保留事項

- `magick` v6（`convert`）環境の扱い（現状 v7 前提。必要になれば後で吸収）。
- 一時ファイルの置き場所（scratchpad か ogimage 配下の tmp か）は実装時に決める。
- fuzz バリデーションの正規表現の厳密さは実装時に確定。
