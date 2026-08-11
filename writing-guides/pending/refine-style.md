# refine-style（保留）

## このファイルの位置づけ

`refine-style.md`（推敲・修正傾向）の保留プール。根拠が単一コミット・単一記事に閉じる、修正方向が一定しない、一般的な編集技法に還元される、などの理由で、まだ主要ルールに採用していない（または除外した）修正傾向の観察を集めた補助記録である。

ここに置かれた項目は **文章生成・推敲時には適用しない**（`author-style-writer` はこのファイルを読まない）。
`author-style-analyzer` が分析のたびにこのファイルを読み、根拠が増えた項目を `refine-style.md` の主要ルールへ**昇格**する／新たな保留を**追記**する／棄却・除外する対象とする。

保留は1項目1行で、`保留ID｜特徴：保留の理由｜支持: <slug>, <slug>` の3欄で書く（`node scripts/style-pending-promote.mjs` が支持記事数から昇格候補を出す）。

### AI草稿→人手編集の差分が取れない記事

次の記事には `[ai-draft]`（および後方互換の使役形「〜：草稿を書かせた」）コミットが存在せず、refine-style 本来の根拠であるAI草稿→人手編集の差分を取得できない。ここで観察できる編集コミットは著者自身の執筆途上の自己推敲であり、「AIらしさの除去」の根拠にはできない。完成記事だけからの推測もこのファイルの根拠にしない。

/color-theory/adjacent-color-influence, /color-theory/subjective-color, /color-theory/what-is-lighting, /color-theory/illuminance-and-lighting-design, /color-theory/lamp-types, /color-theory/photometric-and-radiometric-quantities, /color-theory/color-roles, /color-theory/visual-clarity-and-visibility, /color-theory/color-sensations, /color-theory/color-association-symbolism, /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-theory/color-contrast, /color-theory/contrast-phenomena, /color-theory/color-vision-characteristics

## 保留項目

- RS-P001｜ページタイトルと重複するH1の削除・小見出しの昇格：1記事のみで、他記事は逆に小見出しを増やす方向。H1を本文で繰り返さない一般慣習とも重なる｜支持: /color-theory/how-to-draw-pccs-color-wheel
- RS-P002｜用語を使う直前に短い定義を差し込む：推敲差分として明確なのは1記事のみ（もう1件は ComingSoon からの初稿執筆で差し込みではない）。普遍的な文章術と切り分けられない｜支持: /color-theory/pccs-color-system
- RS-P003｜冗長な前置き・口語的フィラーの削除／中立化：2記事だが操作が削除と言い換えで別物。一般的な推敲技法で、一人称の砕けた前置きは残る｜支持: /color-theory/basic-color-terms, /color-theory/how-to-draw-pccs-color-wheel
- RS-P004｜段落・改行をどこで割りどこでつなぐかの境界基準：同一記事・同一コミットで分割と結合が同居して方向が定まらず、`.svx` のソフト改行（`\n`→半角空白）による整形の交絡も切り分けられない。連結の向き自体は RS-005 へ昇格済みで、ここに残るのは境界基準と逆向きの分割操作｜支持: /color-theory/color-wheel-and-color-solid, /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing, /color-theory/color-matching-and-grassmanns-law, /cg/transformation/transformation-composition, /cg/transformation/affine-transformation, /cg/transformation/coordinate-systems, /cg/basics/gradient-generation, /color-fields/landscape-color-approach, /color-fields/housing-color-design-process, /color-fields/interior-concept-history, /color-fields/interior-design-basics, /color-theory/color-vision-types, /color-fields/color-universal-design, /cg/image-properties/dynamic-range-and-gradation, /color-theory/optical-illusions, /color-theory/age-related-vision-changes, /color-theory/color-rendering, /color-theory/color-difference-and-uniform-color-space
- RS-P005｜AI草稿の未説明用語へ定義・補足（`:::Note`）を足す：1記事に閉じ、同シリーズのもう1記事は逆に定義を圧縮・削除する方向。新語導入時の定義補足は一般的な編集術でもある｜支持: /cg/basics/camera-capture-and-cg
- RS-P006｜単発の語彙・記法の置き換え（一から→ゼロから／`:::Example`→`:::Note`／括弧併記→定義句／技術→手法）：いずれも各1回で、記法規約・語彙の好みの領域｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing
- RS-P007｜例え・対応づけを「〜のような役割を果たします」で和らげる緩衝表現の追加：単発1例のみ｜支持: /color-theory/eye-structure
- RS-P008｜末尾にまとめた図を該当セクションへ移し、抽象的説明を図の観察・操作の指示へ書き換える：1記事のみで、その記事固有のスペクトル帯デモに強く依存する。図の移動自体は一般的な編集改善で、観察を促す命令形は SQ-072 が担当｜支持: /color-theory/color-mixing-basics
- RS-P009｜説明を因果・積み上げ順へ並べ替える：1記事1セクションのみ｜支持: /color-theory/real-world-color-mixing
- RS-P010｜橋渡しの問い・用語補足を、それが導く説明の直前へ移す：2記事で確認できるが操作の質が異なり（セクション境界を越える遷移問いの移動／補足 Note の例の前への繰り上げ）、単一の並べ替えルールとしては弱い｜支持: /cg/basics/image-quantization, /cg/basics/image-sampling
- RS-P011｜詳細な数値ワークト例を一般式（変数）へ置換し、公式を節先頭のブロック引用へ前置する：1記事のみで公式中心の短い記事という記事タイプ依存が強い（ワークト例の削除自体は RS-029 と同一根拠、ビット→バイトの単位訂正は技術的訂正として分離）｜支持: /cg/basics/grayscale-and-color-images
- RS-P012｜漢字とひらがなの開き閉じ：同一記事内で漢字化（じつは→実は／いまは→今は）とかな化（升目→マス目／創られます→つくられます）の両方向が起き、単一方向のルールにならない。表記の好みは SQ-049 の領域｜支持: /cg/basics/vector-and-raster, /color-fields/media-design-concepts
- RS-P013｜箇条書き項目の文末を圧縮する（体言止め化はその一例）：文末を短くする方向は共通でも、体言止めか動詞止めかは一定せず、各記事1リストずつと薄い。落とした括弧注記が直後の地の文へ再提示される例もあり、既習なら常に落とすのでもない。文末を簡潔な形（体言止め・常体）へそろえる向き自体は本体 RS-003 の「項目の文体」へ反映済みで、ここに残るのは体言止めと動詞止めの選択基準｜支持: /cg/basics/gradient-generation, /cg/basics/area-filling, /color-theory/color-vision-types
- RS-P014｜対比を接続詞「一方」から逆接「〜が」へ畳んで一文化し、通念→主要情報の順に並べ替える：1例のみで一般化不可｜支持: /color-theory/what-is-lighting
- RS-P015｜列挙の一項を削る／語を選び直す自己推敲：各1回（n=1）で、conciseness 志向・語の具体化の兆候はあるが単一例では著者固有の傾向と断定できない｜支持: /color-theory/color-association-symbolism, /color-theory/color-roles
- RS-P016｜定義・分類を専用ブロック（`:::Note`・CardGrid/TermCard）へ切り出す：Note/TermCard/CardGrid はアプリ既存のUIコンポーネントで、一般的な文書設計・記法運用（`syntax-guide.md`）と重なり著者固有の癖と判断できない｜支持: /color-fields/landscape-color-approach, /color-fields/housing-color-design-process
- RS-P017｜ブロック引用（`>`）を地の文の「」付き引用へ畳み込む：1記事2箇所のみで、同シリーズのもう1記事には該当パターン自体が存在しない｜支持: /color-fields/landscape-color-approach
- RS-P018｜節頭に独立していた評価命題を、節末の実務的含意の理由節へ繰り込む：並べ替えと書き換えのどちらが主目的か差分から切り分けられず、同記事の並べ替えはこの1箇所のみ（格下げの向きだけは RS-028 の根拠へ反映済み）｜支持: /color-theory/color-vision-types
- RS-P019｜AIが足した内容の選別基準（解釈・機構の敷衍は削り、素朴な疑問への因果補足は残す）：削除例と残存例が形式上は同種の「理由の補足」で、主題への近さ・読者の疑問への直結という基準では区別できない。反例のほうが説明力を持つ（RS-023 と RS-030 の境界事例）｜支持: /color-theory/color-vision-types
- RS-P020｜「〜にくい」を記事内の「〜づらい」へ揃える：2記事で同形の置換を確認できるが、コーパス全体では「〜にくい」も現役で記事横断の置換規則ではない。一方の記事ではメモ側が「見えにくく」で、メモ回帰（RS-011）とは逆に働く｜支持: /color-theory/color-vision-types, /color-theory/age-related-vision-changes
- RS-P021｜短文を指示語つきの長い文へ書き換える：1例のみで、文を短くする方向とは逆｜支持: /color-theory/color-vision-types
- RS-P022｜地の文に埋め込まれた列挙をリスト化し、順序が意味を持つものは番号リストにする：1記事のみで、対比の叙述が主体のもう1記事ではリスト化自体が起きない。差分外だが順序のない7原則を番号リストで書く反例もある｜支持: /color-fields/interior-design-basics
- RS-P023｜リストの前は短い導入文だけにし、意義・効能の説明はリストの後ろへ回す：1記事内2箇所の局所例で、リストを含まない記事には現れない｜支持: /color-fields/interior-design-basics
- RS-P024｜見出しを本文の用語・正式名称へ揃える：同じ差分でリンク文言は逆に短縮されており、略さない方向と説明的な接尾を落とす方向が同居する。もう1記事は見出しに一切手が入らない（RS-021 の近縁）｜支持: /color-fields/interior-design-basics
- RS-P025｜口語寄り・素朴な言い切りを持ち込む：各記事1件ずつで、他の文末は草稿と同じ丁寧な書き言葉のまま残る。完成本文の語り口は `stylistic-quirks.md` の担当｜支持: /color-fields/interior-design-basics, /color-fields/interior-concept-history
- RS-P026｜時制の変更（「意識されてきました」→「意識されています」）：1箇所のみで文体傾向と切り分けられない｜支持: /color-fields/interior-concept-history
- RS-P027｜リンクテキストをページタイトルから外し、文の流れに合わせて言い換える・位置を移す：同じ差分の他のリンクはページ名のまま温存され、各例が別々の理由（初出への移動・語句の自然化・文の縮約に伴う移動）で説明できる。リンク先ページ名との一致を崩す方向で、一般化すると害がある。導入から外したリンクを初出節へ付け替える操作は本体 RS-020、概念名への短縮は本体 RS-018・RS-019 へ反映済み｜支持: /color-fields/interior-design-basics, /color-fields/color-universal-design, /color-theory/optical-illusions, /color-theory/elderly-vision-characteristics, /color-theory/color-difference-and-uniform-color-space
- RS-P028｜並列の読点を中黒へ変える：1箇所のみで、リード全体の書き換えに伴う副産物とも読める｜支持: /color-fields/interior-concept-history
- RS-P029｜「〜のです」の増減：同一記事内で削除と追加が同居し方向が逆。近接して2回出た「〜のです」を節の締めの1回に絞る例もあるが、コミットメッセージにのみ明示され差分上の該当は1箇所｜支持: /color-fields/interior-design-basics, /cg/transformation/projective-transformation
- RS-P030｜節冒頭の橋渡し文を「〜こともあります」と可能性の提示へ緩める：1記事のみで、他記事では逆に冒頭が断定へ書き換えられる。条件次第で起きたり起きなかったりする現象を扱う記事テーマ固有の事情で説明できる（断定緩和一般は RS-015）｜支持: /color-theory/optical-illusions
- RS-P031｜実況調・語りかけの前置きを削る：「こんどは、」だけを落とす1例で、同じ記事内の他の実況調はそのまま残る｜支持: /color-theory/optical-illusions
- RS-P032｜説明の主体を器官名へ寄せる（「私たちの視覚が」→「私たちの脳は」）：1例のみで、どの説明を器官名の主語へ寄せるかの条件を特定できない｜支持: /color-theory/optical-illusions
- RS-P033｜図版の直前に注記（`:::Note`／`:::Warning`）を置き「次の図はイメージです。」と断る：3記事で同じ向きの並べ替えを確認できるが、どちらも1記事1〜2箇所で、CardGrid 内の小さな図や TermCard の図には注記が付かず、断りを付けない図との線引きを特定できない。「次の図はイメージです。」という断り一文自体は本体 RS-032 へ反映済みで、ここに残るのは注記を置く図の線引き（図の直後の留保付加は RS-015 が担当）｜支持: /color-theory/age-related-eye-diseases, /color-theory/optical-illusions, /color-theory/color-difference-and-uniform-color-space
- RS-P034｜`:::Note` に切り出された補足を本文へ戻す：1記事1箇所のみで、他記事では `:::Note` が維持され、図の注記としてはむしろ積極的に使われる。本体 RS-013 とは逆方向｜支持: /color-theory/elderly-vision-characteristics
- RS-P035｜接続表現の置き換え（「そのため、」→「この場合、」「すると、」、口語の「だから」→「そのため、」）：近接する同じ接続語の重複回避とも読めるが、各記事1例ずつで規則化できない。完成本文の接続表現は `stylistic-quirks.md` の担当｜支持: /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /cg/transformation/projective-transformation
- RS-P036｜既出記事への参照を節の冒頭へ移す並べ替え：1記事1例で、統計→機序→症状という別の並べ替え意図とも解釈できる｜支持: /color-theory/age-related-eye-diseases
- RS-P037｜検定で問われる用語・結論を `:::Note` から本文の主役へ格上げする：明確なのは1記事1事例で、もう1記事の根拠は同一節内という程度の対応でしかない。同記事の別コミットでは逆に留保を `:::Note` へ置いており一方向の格上げにならない｜支持: /color-theory/color-rendering
- RS-P038｜対になる2図を CardGrid + TermCard の横並びへ組み替える：1記事1回のみで、もう1記事の図はいずれも単独配置。図が3つ以上の場合の挙動も未検証（RS-007 は数式限定の別根拠）｜支持: /color-theory/color-rendering
- RS-P039｜覚える数値と参照値で `:Anki` とインラインコードを書き分ける基準：同一文にコードと `:Anki` が混在する例があり、どちらにもならない数値もある。切り分けは推測で、記法規約（`syntax-guide.md`）由来の可能性も排除できない（RS-033 の反例としては記録済み）｜支持: /color-theory/age-related-vision-changes, /color-theory/color-rendering
- RS-P040｜括弧内の補足を「つまり、〜」の独立文へ出す：同じバッチで逆に独立した説明を括弧へ入れる操作も起きており、方向を決められない｜支持: /color-theory/age-related-vision-changes
- RS-P041｜草稿が落とした前提用語を括弧併記で本文へ戻し、記事全体の前提語は導入直後の `:::Note` で定義する：前者は草稿のメモに元から含まれておりメモ回帰（RS-011）で説明がつき、後者は1箇所のみ。第2節では逆に術語を避けて平易語へ寄せており、性質の異なる根拠が同居する｜支持: /color-theory/color-difference-and-uniform-color-space
- RS-P042｜変化をつけるための類義語を排し、記事のキーワード・同語の反復へ寄せる：専門用語の同語反復はテクニカルライティング一般の作法と重なり1記事の差分では区別できない。置換先も一語に収束せず、指示語で受けて語ごと削る箇所もある。前出の具体例を呼び戻す言い方は温存され反復一辺倒でもない（用語統一は RS-014、主語の明示は RS-008 が担当）｜支持: /color-theory/color-difference-and-uniform-color-space, /color-theory/photometric-quantities, /color-fields/media-design-concepts
- RS-P043｜図の直後の段落を「図の読み方」から始め、意外な結果と意味づけを後段へ回す：1節1事例で、同時に図中要素の説明の圧縮と意味づけの追加が起きており、順序変更だけを切り出した根拠にならない｜支持: /color-theory/color-difference-and-uniform-color-space
- RS-P044｜事実の直後に意味づけの一文を足し、「つまり」の再要約を削って節末を結論1文で閉じる：追加と削除という逆方向の操作が同居し、「新しい含意か既述の言い直しか」の判断基準を1記事の差分では確定できない（RS-023 と RS-029 の境界事例）｜支持: /color-theory/color-difference-and-uniform-color-space
- RS-P045｜動詞・語順の微修正：それぞれ1例で、最終稿内に逆順（「見た目の色の違い」）も併存し語順の選好として一般化できない｜支持: /color-theory/color-difference-and-uniform-color-space
- RS-P046｜既出語の呼称を短縮する（「マックアダム楕円」→「楕円」）：1記事内の局所的な省略で、既出語の省略方針として一般化するには例が足りない｜支持: /color-theory/color-difference-and-uniform-color-space
- RS-P047｜定義カードは短い直観的定義にとどめ、仕組みの説明と前節との対比をカードの後ろへ回す：同記事の4節すべてで同じ配置になるが根拠は1記事に閉じ、もう1記事は TermCard を使わないため検証できない。カード形式そのものの構造的な要請とも切り分けられない｜支持: /color-theory/photometric-quantities
- RS-P048｜`:::Example` をブロック化するか地の文へ畳むかの境界：短い例の新設と、箇条書きを含む例の地の文化という相反する2方向が同一コミットに同居し、「短い自己完結例だけブロック化する」は仮説にとどまる（RS-012 と RS-024 の境界事例で、記事カテゴリによる線引きは変更しない）｜支持: /color-theory/photometric-quantities
- RS-P049｜可能表現を「〜することができます」へ開く：1例のみで対応例が他記事にない｜支持: /color-fields/media-design-concepts
- RS-P050｜「近年では、」で書き出す：導入文に新規追加された1例のみで、時期を示す副詞句で書き起こす癖かは判断できない｜支持: /color-fields/media-design-concepts
- RS-P051｜「〜していきます」を避けて要件の言い方へ変える：1例で、同記事に「必要があります」がそのまま残る箇所もあり、進行形の忌避か単なる言い換えか切り分けられない（完成本文の「〜ていく」は SQ-042 が扱う）｜支持: /color-fields/media-design-concepts
- RS-P052｜フロー図のコードブロックの廃止：廃止判断が一度リバートされたのち著者自身が同じ廃止を実施しているが、リバートは記事全体のまとめ直しに対するもので、コードブロック単体への評価を差分から確定できない｜支持: /color-theory/photometric-quantities
- RS-P053｜AI草稿がデモを差し込んだだけの箇所へ、人手で :::Action を後付けして「何を動かして何を観察するか」を明示する：完成本文側の型は TF-057／WS-065 が扱う。後付け自体は複数記事で確認できるが、付与のタイミングが揃わず（一方は公開コミットまで遅れる）、同じ記事内でも状態が切り替わらないデモには付かないため、付ける対象の線引きを差分から特定できない。`:::Action` 自体はサイト共通の記法で、固有性を主張できるのは付与の順序と選別だけ。説明直後への分割配置と着眼点の絞り込みは RS-038 へ昇格済みで、ここに残るのは付与対象の線引きと付与のタイミング｜支持: /cg/transformation/pinhole-camera, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- RS-P054｜並列する定義・条件が散文で続く箇所を「:Mark[ラベル]：説明」形式の箇条書きへ組み替える：本体 RS-003（箇条書き→散文）と逆向きの操作で、同一記事・同一コミット内の3例しかなく、どちらの向きを選ぶかの条件を差分から特定できない｜支持: /cg/transformation/pinhole-camera
- RS-P055｜:::Todo を図版プレースホルダ以外にも使い、本文の語句・デモのラベル・まだ書けていない補足への申し送りをその場に残す：本体 RS-032 は図版の場所確保に限定した用法。拡張的な用法は複数記事で確認できるが、着地の仕方が食い違い（一方は解消と同時に削除、他方は推敲を跨いで持ち越したのち公開コミットで `:::Note` の完成文へ書き下し）、どちらへ着地するかの条件を差分から特定できない。言い回しを決めきれない箇所に候補を複数並べ、後で1本の本文へ書き下す使い方も1記事で確認できるが、著者の推敲手順として一般化するには用例が不足｜支持: /cg/transformation/pinhole-camera, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projection-steps
- RS-P056｜主役の術語1語だけを本文・掲載コードのコメント・デモ実体の scene.ts・ariaLabel・他記事のデモまで波及させて全置換する：1記事のみ。同じ推敲で近義語のゆれ（形状／物体）は見出しを含む複数箇所に残されており、「主役の術語だから全置換する／近義語だから残す」という線引きを差分から確定できない。拾い漏れか意図的な使い分けかも判別できない（本文とデモ側のラベルをそろえる向き自体は RS-014 が担当）｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P057｜対比する2概念それぞれに、評価軸（強み／弱点・特徴とユースケース）をそろえた `###` 小見出しを対称に立てる：1記事のみで、実際には一方が2本・他方が1本と軸が対称になっておらず、橋渡し節はコロン形式でもない。「対称に立てる」という向き自体が実態と食い違う（小見出しへの分割と見出しの具体化は RS-004・RS-021 が担当）｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P058｜節冒頭を「たとえば＋具体場面 → 既存手法の不適合 → そこで〜という〇〇があります」の型へ組み替える：1記事のみで、同じ著者が直前の推敲で自ら足した問いかけ文を次の推敲で撤回しており、一方向の型として読めない（前置きの削除は RS-027、定義文の後置は RS-022 が担当）｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P059｜中立的な事実記述を、読者にとっての評価（デメリット・欠点）へ言い直す：1記事のみで、同じ書き換えに技術的訂正が同居し文体修正と切り分けられない。評価語にヘッジが添えられるため断定の強化でもなく、方向を確定できない（断定緩和は RS-015）｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P060｜日常アナロジーと、それが支える他ページ主題の傍論を段落ごと落とし、要点だけを別の節へ1句で入れ直す：1記事のみで、削除理由が「比喩が過剰」なのか「他ページの主題だから」なのか差分から一意に定まらない。同じ推敲で具体物・具体場面はむしろ追加されている（比喩の平坦化は RS-016、傍論の削除は RS-029）｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P061｜直前の推敲で自分が足した誘導文・言い換えを、次の推敲で撤回する（多段推敲の揺り戻し）：1記事のみ。差分としては確認できるが、推敲の回数に依存する現象で、執筆側で適用できるルールの形にならない｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P062｜思考実験を促す動詞を「考える」から「試す」へ寄せる：1例のみで、その文自体が次の推敲で丸ごと削除されており、傾向として残ったのか一時的な書き換えだったのか判断できない｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P063｜草稿がリンクにしていた語を `:Mark` の強調へ差し替える：1箇所のみで、冒頭で同じページへ既にリンク済みという事情でも説明でき、リンクを外した理由を差分から断定できない（RS-033 には逆方向の記述がある）｜支持: /cg/transformation/perspective-and-parallel-projection
- RS-P064｜節の並べ替え・分割で未出になった語を、その位置で使わない表現へ書き換える（「投影座標系の軸」→「視線の軸」、未出の「消線」を使わず「2点を通って引かれた1本の直線」）：2記事で確認できるが、前方参照を避ける整合性の確保は技術文書一般の執筆規範で、著者固有の癖と切り分けられない。同じ推敲で逆に、既存記事へのリンクを足して定義を委譲する箇所も同居する｜支持: /cg/transformation/projection-steps, /cg/transformation/projective-transformation
- RS-P065｜否定の言い切りを、先に何が起こるかを述べる肯定文へ振り替えてから理由を対比で示す：強調語の削除・断定緩和は RS-015 が担当。同一記事で逆に限定の足場（「アフィン変換が保っていた性質のうち」）を足す操作が同居し、限定・強調の増減が両方向に起きるため、この振り替えだけを型として切り出せない｜支持: /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- RS-P066｜地の文の対比2文を TermCard の並置へ整理し、同じ位置に確保していた図解の `:::Todo` を図を作らずに解消する：1記事1箇所のみで、同記事の他の図解 `:::Todo` は Three.js デモへ置き換えられており、カードが `:::Todo` 解消の標準ルートとは言えない（対になる2図のカード化は RS-P038、並列数式のカード化は RS-007）｜支持: /cg/transformation/projection-steps
- RS-P067｜読み取れない図・デモは作り替えを重ねた末に削除し、地の文は変えない：1記事に集中した観測で、同シリーズのもう1記事では3本のデモがいずれも削除されず残る。読みづらさの原因が描画側の不具合の場合は削除ではなく修正しており、削除する条件を差分から特定できない｜支持: /cg/transformation/projective-transformation
- RS-P068｜デモ直後に、デモに描かれているのに本文が説明していない要素の読み取り文（意味とそう見える理由）を足す：1記事1箇所のみで、同シリーズのもう1記事では同じ位置に処理順序の理由を述べる `:::Note` が置かれ、読み取り文ではない｜支持: /cg/transformation/projective-transformation
- RS-P069｜別ページへ委譲する言及を、地の文のリンクから独立した `:::Info` ブロックへ切り出し、本文には定義だけを残す：1記事1箇所のみで、同記事の他の委譲（広角・望遠レンズ）は `:::Note` にリンクを含めたまま残る。リポジトリ全体でも `:::Info` の使用は5ファイルにとどまり、確立した規約とは言えない｜支持: /cg/transformation/projection-steps
- RS-P070｜数式で示した導出を、最終形で数式を使わない言葉の説明へ差し戻す（範囲・定義を示す数式ブロックは残す）：1記事1往復のみで、追加側が「数式も載せてほしい」という明示の依頼だったため、差し戻しが著者の好みか記事の到達点の再判断かを切り分けられない｜支持: /cg/transformation/projection-steps
- RS-P071｜記事末の橋渡し文を、節の並べ替えに合わせて最後に残る節の末尾へ移す：1例のみで、移した先の節自体が公開コミットで削除されており、移動が定着した判断か確認できない｜支持: /cg/transformation/projection-steps
- RS-P072｜箇条書きのラベル説明に機能の理由を後付けする（「〜外す」→「〜外すために用意」）：1例のみで、理由づけの追加一般は RS-023 と切り分けられない｜支持: /cg/transformation/projection-steps
- RS-P073｜:::Todo に type を付けて自分への疑問（type="text"）とデモ側の残課題（type="fix"）を該当箇所へ書き残し、後続コミットで本文の書き直し・加筆やデモ修正として解消する：4記事で確認できるが、`:::Todo`／`type="text"` の用法と公開時の確認手順は `syntax-guide.md` のルール4が既に規定しており、記法規約と切り分けられない（残るのは申し送りを残すタイミングと解消の仕方だけで、執筆時に適用できるルールの形にならない）。type を付ける用法が確認できるのは3記事で、残る1記事は無印の `:::Todo` のみ。図版の場所確保に限った用法は本体 RS-032、拡張的な用法は RS-P055 が抱えている｜支持: /cg/transformation/parallel-projection-types, /cg/transformation/viewing-pipeline-transformations, /color-theory/interference-and-diffraction, /color-theory/reflection-and-refraction
- RS-P074｜未解消の :::Todo ブロックを公開コミットで削除し、図版・デモの残課題を抱えたまま本文だけを整えて公開する：差分を数え直すと、公開コミット自体での削除は2記事のみ（他1記事は公開前の推敲で図を作らないまま外し、残る1記事は公開前に加筆・デモ修正で全て解消している）。「公開コミットで削除する」という手順の形では支持が足りず、本体 RS-001 へ足せない。図を作らないまま外して本文で完結させる向きは本体 RS-032 の注意へ反映済み。公開時に未解消の Todo をどう畳むか（対応するか外すかを著者に確認する）は `syntax-guide.md` のルール4が規定している｜支持: /color-theory/light-scattering, /color-theory/reflection-and-refraction, /color-theory/interference-and-diffraction, /cg/transformation/viewing-pipeline-transformations
- RS-P075｜人手編集で :Mark を付与・置換して :Anki と使い分ける（Action の操作対象・UIラベルを :Mark で括り、本文では暗記対象でない具体物・場面語を :Mark にする。公開コミットでの一括付与を含む）：5記事で人手編集による付与・置換を確認できるが、`syntax-guide.md` のルール1が「`:Mark[]` は著者（人間）が判断する領域で、AIの側から選ばない・既存の `:Mark[]` は保持する」と定めているため、執筆側で適用できるルールの形にならない。完成本文側の同じ観察は SQ-P082 が抱えている。:Anki の付与対象と範囲は本体 RS-033・RS-034、`:::Action` 内の操作対象の `:Mark[]` 化は本体 RS-038 が担当｜支持: /color-theory/reflection-and-refraction, /color-theory/interference-and-diffraction, /color-theory/light-scattering, /cg/transformation/viewing-pipeline-transformations, /cg/transformation/parallel-projection-types
- RS-P076｜機構の詳しい解説をデモの後ろへ移し、デモ直前は短い前置きと :::Action だけにする：2記事のみで、しかも一方は同じ記事内でいったんデモの前へ移してから後の編集で後ろへ戻す往復が起きており着地の向きが安定しない（Action の位置と着眼点の粒度は本体 RS-038、定義文の後置は RS-022 が担当）｜支持: /color-theory/reflection-and-refraction, /color-theory/interference-and-diffraction
- RS-P077｜人手編集が完成本文側の表現ルールの形（「〜てしまいます」への言い換え・Action 内箇条書きの常体化・全角？の問いかけ追加・破綻による動機づけの追記）へ寄せる方向で入る：2記事で観察できるが、指している型はいずれも完成本文側の SQ-062・SQ-004・SQ-050・TF-061 が担当で、修正傾向としては対応する RS ルールが無い。判定側がこれらを refine-style の支持として挙げたため、観点違いで根拠から外した分をここへ残す｜支持: /cg/transformation/viewing-pipeline-transformations, /cg/transformation/parallel-projection-types
