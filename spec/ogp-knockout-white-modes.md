# nested-fig 白背景透過のモード選択

nested-fig の OGP 画像で白背景の図版を透過（ノックアウト）する際、**「背景に繋がった白だけを透過する」か「全ての白を透過する」か**を図版ごとに選べるようにする。既存の白背景ノックアウト（`spec/ogp-figure-white-knockout.md`）の拡張。

## 目的・背景

- nested-fig の白背景ノックアウトは現状「背景に繋がった白」だけを flood-fill で透過する（内部で囲まれた白は残す＝意図通り）。
- だが背景白が図版内で**分断されている**と、要素の隙間・囲まれた白ポケットが flood-fill に届かず「白い箱」として残ってしまう。
- これを一掃できる**全白透過モード**を追加し、図版ごとに 2 モードから選べるようにする。
- 全白モードを使う主動機は「分断された白ポケットの残存を消したい」ケース。前提として、消えて困る内部白（白抜き文字・白い塗り）が無い図版に使う。

## スコープ

### やること

- render の payload に `knockoutMode: "background" | "all"`（省略時 `"background"`）を追加。`knockoutWhite: true` のときだけ意味を持つ。
- `knockoutMode: "all"` のとき、手渡し PNG に ImageMagick で**全ての白**（fuzz 閾値内）を透過し、透過後の外周余白を `-trim` で切り詰めて、透過 PNG を埋め込み＆ `ogimage/data/assets/<route>/figure.png` に保存する。
- 全白モードの省略時 fuzz 既定を **`"2%"`** にする（background モードは従来どおり `"5%"`）。
- スキル `generate-ogp-image` が、白背景 PNG の透過を行うと決めたときにモードも確認し、確定値を payload に載せる。
- README・スキル・関連ドキュメントにモードの違いを明記する。

### やらないこと

- 白以外の色の背景除去、アルファ比例のきれいな縁抜き（2 値 flood-fill / 2 値透過のまま。縁ハロは許容し `magickFuzz` で調整）。
- 残存する白ポケットの自動検出（どちらのモードを使うかはユーザーが選ぶ）。
- 記録スキーマの拡張（モード・透過フラグは記録に持たせない）。
- CI・regenerate での magick 実行（生成は手動・ローカルのみ。regenerate・CI は magick 非依存のまま）。
- PNG 以外（JPEG / WebP / SVG）への適用。

## ユーザーストーリー・主要ユースケース

- 開発者が白背景の図版で nested-fig の OGP を作る。スキルが「白背景を透過する？」→ yes なら続けて「背景に繋がった白だけ／全ての白、どちらを透過する？（既定は背景連結）」を確認する。
- background モードで生成したが、要素の隙間に白い箱が残る図版だった場合、`knockoutMode: "all"` で作り直すと分断された白ポケットも含めて透過され、装飾背景に馴染む。
- 後日リデザインで一括再生成しても、保存済みの（選んだモードで透過済みの）PNG がそのまま使われ、magick 無しで同結果になる。

## 機能要件

### スキーマ

- payload（render.mjs / regenerate 共有の確定値 JSON）に追加：
  - `knockoutMode: "background" | "all"`（省略時 `"background"`）。`knockoutWhite: true` のときだけ意味を持つ。
- 既存フィールドは据え置き：
  - `knockoutWhite: boolean`（省略時 `false`）。透過の on/off。`variation: "nested-fig"` かつ `figure` が PNG のときのみ有効。
  - `magickFuzz: string`。ImageMagick の `-fuzz` に渡す値。**省略時の既定がモード別**：
    - `knockoutMode: "background"` → `"5%"`（従来どおり）
    - `knockoutMode: "all"` → `"2%"`
    - `magickFuzz` を明示指定した場合は、モードにかかわらずその値が優先される。

### 処理フロー（`knockoutWhite: true` 時）

- **`knockoutMode: "background"`（既定・現状維持）**: 外周に白 1px ボーダーを足して `-floodfill +0+0` の種を必ず白にし、背景に繋がった白のみを透過してから枠を除去、`-trim +repage` で余白を切り詰める。内部で囲まれた白は残る。コマンド・`-channel RGBA`・ボーダーは無改修。

  ```
  magick <in.png> -bordercolor white -border 1x1 -alpha set -channel RGBA \
    -fuzz <magickFuzz> -fill none -floodfill +0+0 white -shave 1x1 -trim +repage <out.png>
  ```

- **`knockoutMode: "all"`（新規）**: 次のコマンドをそのまま使う。`-transparent` は全画素対象なので flood の種が不要で、`-channel RGBA` や外周ボーダーは付けない。fuzz 閾値内の白を**背景・内部を問わず一律**透過する（白抜き文字・白い塗り・要素間の白も消える）。

  ```
  magick <in.png> -alpha set -fuzz <magickFuzz> -transparent white -trim +repage <out.png>
  ```

- どちらのモードでも、得た透過 PNG を figure として既存の埋め込み（`buildFigure`）と永続コピー（`copyFigureIntoData` → `ogimage/data/assets/<route>/figure.png`）に渡す。一時ファイルは処理後（例外時も）に削除する。
- ImageMagick はサブプロセスで呼ぶ（`execFile` 系で引数配列渡し。shell を介さない）。

### スキル側

- 白背景 PNG の透過を行うと決めたとき、続けて**モードを確認**する。既定は `"background"`。
  - ラベル: 「背景と繋がった白だけ」＝ `background` / 「全ての白」＝ `all`。
  - 目視確認はユーザーが行う（AI は結果画像を見られない）ため、後から気づいての二度手間を避けるべく、最初に意図を確認する方針。
  - 全白モードは内部白も消える旨を添える（消えて困る内部白が無い図版に使う）。
- 確定した `knockoutMode`（必要なら `magickFuzz`）を payload に載せる。

## 既存機能との関係・整合

- `spec/ogp-figure-white-knockout.md`（background 透過）の拡張。`spec/ogp-image-generation.md`（生成）・`spec/ogp-image-regeneration.md`（記録・一括再生成）とも整合。
- 記録・regenerate の思想を**そのまま踏襲**：透過は生成時のローカル処理、**記録にはモード・透過フラグを持たせない**、regenerate は保存済み透過アセットをそのまま埋め込み magick を再実行しない（regenerate・CI は magick 非依存）。
- `buildFigure`（`ogimage/lib/build-svg.mjs`）・`copyFigureIntoData`（`ogimage/lib/record.mjs`）は無改修。
- マニフェスト（`app/src/lib/meta/og-manifest.json`）更新への影響なし。
- 実装の触点（想定）：
  - `ogimage/lib/knockout.mjs` — all モードの経路を追加。
  - `ogimage/lib/render-core.mjs` — `knockoutMode` の検証、モード分岐、モード別の既定 fuzz。
  - `ogimage/render.mjs` — ヘッダのフィールド説明。
  - `ogimage/README.md` — 2 モードの説明。
  - `.claude/skills/generate-ogp-image/SKILL.md` — 確認ダイアログ、JSON フィールド表、例、エラー節。

## ドメインルール上の考慮

- 色理論ドメインには影響しない（図版の見た目のみ。透過で図版の色そのものは変えない）。

## データ・状態

- 記録スキーマ（`OgRecord`）に追加フィールドなし（モード・透過フラグは持たせない方針）。
- `ogimage/data/assets/<route>/figure.png` の中身が「選ばれたモードで透過済みの PNG」になる。
- 白背景の原本はどこにも保持しない（再調整は図版を再エクスポートして再生成）。

## エッジケース・異常系（検証は描画前に fail-fast）

- **`knockoutMode` が `"background"`/`"all"` 以外**：想定書式でバリデーションし、不正なら描画前にエラーで停止。
- **`knockoutWhite` が true でないのに `knockoutMode` を指定**：意味を持たない指定として**エラーで停止**（既存の fail-fast 思想に合わせ、黙って無視しない）。
- **`knockoutMode` 省略**：`"background"` として扱う（後方互換・現状と同一結果）。
- **all モードで fuzz が淡色を巻き込む**：既定を `"2%"` に下げて緩和。必要なら `magickFuzz` で調整。
- **縁のアンチエイリアス**：2 値透過ゆえ、細い白ハロが残りうる（`magickFuzz` で調整）。
- **all モードを内部白のある図版に誤適用**：内部白も消える。一次防御はスキルの確認（内部白が消える旨を伝える）。
- **既存（据え置き）**：`knockoutWhite: true` で figure 無し／非 PNG／`magickFuzz` 不正／ImageMagick 未導入（ENOENT）→ 明確なエラーで停止。

## 非機能要件

- **セキュリティ**：サブプロセスは `execFile` 系で引数配列渡し（shell を介さない）。`magickFuzz`・ファイルパスをコマンド文字列に展開しない。fuzz・mode はバリデーションする。
- **依存**：ImageMagick 7（`magick`）を「生成時のローカル依存」として据え置き（両モード共通）。CI・regenerate は非依存。
- **パフォーマンス**：1 図版につき magick 1 プロセス（生成時のみ・少数）。無視できる範囲。

## 制約

- ImageMagick 7 の `magick` を前提とする。
- 透過処理は PNG 入力のみ。出力も PNG。
- 生成は手動・ローカルのみ（CI では走らせない）。

## 受け入れ条件

- 白背景 PNG に `knockoutWhite: true` + `knockoutMode: "all"` を付けて nested-fig を生成すると、分断された白ポケットも内部白も透過され、装飾背景に馴染んで埋め込まれる。保存アセットも透過 PNG になり、記録にモード/フラグは無い。
- `knockoutMode` を省略／`"background"` にすると、現状と同一の結果になる。
- all モードで `magickFuzz` を省略すると `"2%"`、明示するとその値が優先される（background の省略時は `"5%"` のまま）。
- 不正な `knockoutMode`／`knockoutWhite` 無しでの `knockoutMode` 指定は、描画前にエラーで停止する。
- `regenerate.mjs` を実行すると、magick 無しで同じ透過結果の OGP が再生成される。
- スキルが、白背景 PNG の透過時にモード（既定 `background`、ラベル「背景と繋がった白だけ」/「全ての白」）を確認し、payload に反映する。

## 未確定・保留事項

- all モードの既定 fuzz `"2%"` は、目視確認後に微調整の余地あり。
- 残存する白ポケットの自動検出は将来課題（今回スコープ外）。
