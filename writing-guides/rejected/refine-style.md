# refine-style（棄却）

## このファイルの位置づけ

`refine-style.md`（修正傾向）の棄却層。保留プール（`pending/refine-style.md`）にあった修正傾向の観察のうち、**記事が増えても解けない理由**で再審査を打ち切ったものを移した記録である。

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

- RS-P004｜型不収束｜段落・改行をどこで割りどこでつなぐかの境界基準：同一記事・同一コミットで分割と結合が同居して方向が定まらず、`.svx` のソフト改行（`\n`→半角空白）による整形の交絡も切り分けられない。連結の向き自体は RS-005 へ昇格済みで、方向が一定しない旨も「修正時の基本方針」へ反映済み。｜再開: 分割と結合の向きを分ける条件（節・図の直前など）が3記事で一貫して確認できたら再開｜支持: /color-theory/color-wheel-and-color-solid, /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing, /color-theory/color-matching-and-grassmanns-law, /cg/transformation/transformation-composition, /cg/transformation/affine-transformation, /cg/transformation/coordinate-systems, /cg/basics/gradient-generation, /color-fields/landscape-color-approach, /color-fields/housing-color-design-process, /color-fields/interior-concept-history, /color-fields/interior-design-basics, /color-theory/color-vision-types, /color-fields/color-universal-design, /cg/image-properties/dynamic-range-and-gradation, /color-theory/optical-illusions, /color-theory/age-related-vision-changes, /color-theory/color-rendering, /color-theory/color-difference-and-uniform-color-space
- RS-P013｜型不収束｜箇条書き項目の文末を圧縮する（体言止め化はその一例）：文末を短くする方向は共通でも、体言止めか動詞止めかは一定せず、各記事1リストずつと薄い。落とした括弧注記が直後の地の文へ再提示される例もあり、既習なら常に落とすのでもない。簡潔な形へそろえる向き自体は本体 RS-003 の「項目の文体」へ反映済み。｜再開: 体言止めと動詞止めの選択基準が3記事で一貫して確認できたら再開｜支持: /cg/basics/gradient-generation, /cg/basics/area-filling, /color-theory/color-vision-types
- RS-P027｜型不収束｜リンクテキストをページタイトルから外し、文の流れに合わせて言い換える・位置を移す：同じ差分の他のリンクはページ名のまま温存され、各例が別々の理由（初出への移動・語句の自然化・文の縮約に伴う移動）で説明できる。リンク先ページ名との一致を崩す方向で、一般化すると害がある。｜再開: 言い換える／温存するの線引きが3記事で一貫して確認できたら再開｜支持: /color-fields/interior-design-basics, /color-fields/color-universal-design, /color-theory/optical-illusions, /color-theory/elderly-vision-characteristics, /color-theory/color-difference-and-uniform-color-space
- RS-P033｜既存ルール｜図版の直前に注記（`:::Note`／`:::Warning`）を置き「次の図はイメージです。」と断る：「次の図はイメージです。」という断り一文自体は本体 RS-032 へ反映済み。残差は注記を置く図の線引きだが、CardGrid 内の小さな図や TermCard の図には注記が付かず、断りを付けない図との線引きを特定できない（図の直後の留保付加は RS-015 が担当）。｜再開: 本体 RS-032 が改訂・廃止される、または注記を置く図の線引きが3記事で特定できたら再開｜支持: /color-theory/age-related-eye-diseases, /color-theory/optical-illusions, /color-theory/color-difference-and-uniform-color-space
- RS-P035｜観点違い｜接続表現の置き換え（「そのため、」→「この場合、」「すると、」、口語の「だから」→「そのため、」）：完成本文の接続表現は `stylistic-quirks.md` の担当。近接する同じ接続語の重複回避とも読めるが、各記事1例ずつで規則化できない。｜再開: 接続表現の置き換えが完成本文側のルールでは説明できない形で3記事に現れたら再開｜支持: /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /cg/transformation/projective-transformation
- RS-P042｜一般技法｜変化をつけるための類義語を排し、記事のキーワード・同語の反復へ寄せる：専門用語の同語反復はテクニカルライティング一般の作法と重なり、支持3記事の差分でも一般技法と区別できない。置換先も一語に収束せず、指示語で受けて語ごと削る箇所もある。前出の具体例を呼び戻す言い方は温存され反復一辺倒でもない（用語統一は RS-014、主語の明示は RS-008 が担当）。｜再開: 一般的な用語統一を超えて類義語を排する判断（一般には言い換えが推奨される箇所での反復）が3記事で確認できたら再開｜支持: /color-theory/color-difference-and-uniform-color-space, /color-theory/photometric-quantities, /color-fields/media-design-concepts
- RS-P073｜媒体規約｜:::Todo に type を付けて自分への疑問（type="text"）とデモ側の残課題（type="fix"）を該当箇所へ書き残し、後続コミットで本文の書き直し・加筆やデモ修正として解消する：`:::Todo`／`type="text"` の用法と公開時の確認手順は `syntax-guide.md` のルール4が既に規定しており、記法規約と切り分けられない。type を付ける用法が確認できるのは3記事中2記事のみ。｜再開: `syntax-guide.md` ルール4 の `:::Todo` の規定が外れる、または規約では説明できない申し送りの型が3記事で確認できたら再開｜支持: /cg/transformation/parallel-projection-types, /cg/transformation/viewing-pipeline-transformations, /color-theory/interference-and-diffraction, /color-theory/reflection-and-refraction
- RS-P074｜型不収束｜未解消の :::Todo ブロックを公開コミットで削除し、図版・デモの残課題を抱えたまま本文だけを整えて公開する：差分を数え直すと、公開コミット自体での削除は2記事のみ（他1記事は公開前の推敲で図を作らないまま外し、残る1記事は公開前に加筆・デモ修正で全て解消）。支持4記事という件数は別の着地を含む。図を作らないまま外す向きは本体 RS-032 の注意へ反映済み。｜再開: 公開コミットでの `:::Todo` 削除が3記事で確認できたら再開｜支持: /color-theory/light-scattering, /color-theory/reflection-and-refraction, /color-theory/interference-and-diffraction, /cg/transformation/viewing-pipeline-transformations
- RS-P075｜媒体規約｜人手編集で :Mark を付与・置換して :Anki と使い分ける（Action の操作対象・UIラベルを :Mark で括り、本文では暗記対象でない具体物・場面語を :Mark にする。公開コミットでの一括付与を含む）：`syntax-guide.md` のルール1が「`:Mark[]` は著者（人間）が判断する領域で、AIの側から選ばない・既存の `:Mark[]` は保持する」と定めているため、執筆側で適用できるルールの形にならない。完成本文側の同じ観察は SQ-P082 が抱えている。｜再開: `syntax-guide.md` ルール1 の `:Mark[]` の扱いが変わり、AI 側が選べるようになったら再開｜支持: /color-theory/reflection-and-refraction, /color-theory/interference-and-diffraction, /color-theory/light-scattering, /cg/transformation/viewing-pipeline-transformations, /cg/transformation/parallel-projection-types, /cg/modeling/shape-model-overview, /cg/rendering/photorealism-and-reality-elements
- RS-P077｜観点違い｜人手編集が完成本文側の表現ルールの形（「〜てしまいます」への言い換え・Action 内箇条書きの常体化・全角？の問いかけ追加・破綻による動機づけの追記）へ寄せる方向で入る：指している型はいずれも完成本文側の SQ-062・SQ-004・SQ-050・TF-061 が担当で、修正傾向としては対応する RS ルールが無い。判定側が refine-style の支持として挙げた分を観点違いとして外したもの。｜再開: 完成本文側のルールでは説明できない修正の向きが3記事で確認できたら、RS のルール候補として再開｜支持: /cg/transformation/viewing-pipeline-transformations, /cg/transformation/parallel-projection-types, /cg/modeling/shape-model-overview, /cg/rendering/photorealism-and-reality-elements
