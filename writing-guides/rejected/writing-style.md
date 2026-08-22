# writing-style（棄却）

## このファイルの位置づけ

`writing-style.md`（文章構成）の棄却層。保留プール（`pending/writing-style.md`）にあった構成上の観察のうち、**記事が増えても解けない理由**で再審査を打ち切ったものを移した記録である。

ここに置かれた項目は **文章生成・推敲時には適用しない**（`author-style-writer` はこのファイルを読まない）。
`author-style-analyzer` も**昇格候補の抽出対象にしない**（`node scripts/style-pending-promote.mjs` が棄却IDを候補から外す）。同じ判断を毎ラウンド作り直さないための層で、読むのは再開条件を検証するときだけである。

棄却は1項目1行で、`棄却ID｜区分｜特徴：棄却の理由｜再開: <条件>｜支持: <slug>, <slug>` の5欄で書く。保留プールの3欄形式とは別のパーサ（`parseRejected`）で読むので、欄数を混ぜない。

区分は次の5語のみ。**記事が増えれば解ける理由（単一シリーズ閉塞・支持記事数の不足）は棄却にしない**。それらは保留プールに残す（棄却層へ流すと、別シリーズで再現する機会が来ても二度と見に行かない死蔵になる）。

| 区分 | 意味 |
| --- | --- |
| 媒体規約 | `syntax-guide.md`・`math-notation-guide.md`・スキル定義に還元できる |
| 一般技法 | 日本語一般・技術文書一般の作法で、著者固有性を主張できない |
| 既存ルール | 実行可能な部分はガイド本体のルールが既に規定している |
| 観点違い | 4観点のうち別のファイルの守備範囲 |
| 型不収束 | 支持記事の観察が1つのルールに収束しない・数え直すと支持が足りない |

`再開` 欄には**反証可能な条件**を書く。「再開しない」と書けない棄却は、誤った棄却を永久に隠す。条件が書けないものは棄却にせず保留へ戻す。

## 棄却項目

- WS-P002｜型不収束｜締めの型（別視点の言い換え／研究物語の結論／適用限界の注意／本質の凝縮文）：締めの型が4種（別視点の言い換え／研究物語の結論／適用限界の注意／本質の凝縮文）に分散して一つに収束しない（まとめ節の不在自体は本体 WS-004 へ格上げ済み）。｜再開: 4種のいずれか1つが単独で3記事以上の支持を得たら、その型に絞って再提出する｜支持: /color-theory/color-wheel-and-color-solid, /color-theory/basic-color-terms, /color-theory/pccs-color-system, /color-theory/munsell-color-system
- WS-P006｜既存ルール｜段落を1〜3文・1段落1論点に保つ（短段落）：本体 WS-040 の「段落も1論点に保つ」「使用量：地の文の段落は1〜3文」が同内容を既に規定しており、支持15記事でも追加ルールにならない。日本語のWeb向け解説記事全般に広く見られる作法でもある。｜再開: 本体 WS-040 が改訂・廃止され、段落長の規定が本体から失われたら再開｜支持: /cg/basics/camera-capture-and-cg, /color-theory/brightness-sensitivity-and-adaptation, /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-theory/adjacent-color-influence, /color-theory/illuminance-and-lighting-design, /color-theory/what-is-lighting, /color-theory/visual-clarity-and-visibility, /color-theory/color-vision-characteristics, /color-theory/color-vision-types, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram, /color-theory/color-difference-and-uniform-color-space
- WS-P011｜媒体規約｜記事内のセクション順は基礎→応用（学年タグ昇順）／級ごとに節を切り基本節の直後に発展節を置くペア構造：grades はプラットフォーム機能で著者判断か機能由来か切り分けられない。学年タグ列が単調昇順になっておらず本文で裏づけられず、ペア構造も2記事中1記事でしか成立しない。｜再開: grade タグを持たない記事で基礎→応用のペア構造が3本確認できたら再開｜支持: /color-theory/light-components-and-reflectance, /color-theory/photoreceptor-types-and-distribution, /color-theory/color-vision-types, /color-theory/color-vision-characteristics, /color-theory/age-related-vision-changes, /color-theory/color-rendering
- WS-P033｜一般技法｜節を時系列・物語順に並べ、時間・因果の接続でつなぐ：3記事とも通史テーマで、時代順配列と時間接続は記事テーマ由来の一般的構成（Evidence 反証で著者固有とは判断できないと判定）。非時系列の概念解説での検証がない。｜再開: 非時系列テーマの記事で節を時系列・物語順に並べる判断が3本確認できたら再開｜支持: /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors
- WS-P056｜一般技法｜節の分量を揃えない（2文で終わる節と図・箇条書きを伴う長い節を同居させる）：扱う内容に応じて節の長さが変わり短い節を水増ししないのは大半の書き手に共通する性質で、反証がほぼ不可能。著者固有の癖として立証する積極的な根拠に乏しい。｜再開: 節の分量を意図的にそろえない判断が、内容量では説明できない形（同量の内容を長短に書き分ける）で確認できたら再開｜支持: /color-theory/optical-illusions, /cg/camera/digital-camera-structure, /color-fields/visual-design-and-color
- WS-P085｜媒体規約｜視覚デモの区画を「本文の説明→:::Action の着眼点→<CanvasWrapper> のデモ→:::Foldable の実装コード」の4点セットに定型化し、節をまたいで反復する（地の文はコードに言及しない）：4点セットのうちデモ以降の並びは `add-threejs-demo` の掲載テンプレートで固定されている。固定が確認できるのは「デモ→畳んだ実装コード」の隣接と地の文がコードに言及しない点までで、デモ前の着眼点提示は本体 WS-065／TF-057 が扱う。｜再開: `add-threejs-demo` の掲載テンプレートが変わる、または着眼点の有無が著者判断だと示せる用例が3本出たら再開｜支持: /cg/transformation/pinhole-camera, /cg/transformation/perspective-and-parallel-projection, /cg/rendering/photorealism-and-reality-elements
- WS-P106｜媒体規約｜デモの直後に :::Foldable でThree.jsの実装コードを畳んで置き、本文の説明はコードを挟まずその後ろで続ける：`add-threejs-demo` の SKILL.md 手順2〜3 が `:::Action` → デモ → `:::Foldable{title="Three.jsによる実装概要"}` をタイトル固定・補足禁止まで含めて規定しており、著者が選び取った構成ではなくツール側のテンプレートに従った結果である。｜再開: `add-threejs-demo` の掲載テンプレートが変わる、または規約に従わない掲載順の記事が3本出たら再開｜支持: /cg/transformation/viewing-pipeline-transformations, /cg/transformation/parallel-projection-types, /cg/modeling/shape-model-overview, /cg/rendering/photorealism-and-reality-elements
- WS-P108｜媒体規約｜デモの提示単位を「:::Action（着眼点）→ デモ本体 → :::Foldable{title="Three.jsによる実装概要"}（実装コード）」の三点セットで閉じ、実装コードはデモの後ろの折りたたみへ置いて解釈文を添えない：デモ後の実装コードの位置は本体 WS-065 が既に規定し、残差は「実装コードに解釈文を添えない」の一点。その掲載形式自体が `add-threejs-demo` の固定テンプレート（`:::Action` → デモ → `:::Foldable`）で決まっている。｜再開: `add-threejs-demo` の掲載テンプレートが変わる、またはテンプレート外で解釈文の有無が選択されている用例が3本出たら再開｜支持: /cg/modeling/curve-surface-equations, /cg/modeling/bezier-curve-surface, /cg/modeling/bezier-curve-properties
