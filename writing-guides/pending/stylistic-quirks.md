# stylistic-quirks（保留）

## このファイルの位置づけ

`stylistic-quirks.md`（表現上の癖）の保留プール。根拠不足・単一記事偏り・一般技法や媒体強制の記法との切り分け困難などの理由で、まだ主要ルールに採用していない（または除外した）表現上の観察を集めた補助記録である。

ここに置かれた項目は **文章生成・推敲時には適用しない**（`author-style-writer` はこのファイルを読まない）。
`author-style-analyzer` が分析のたびにこのファイルを読み、根拠が増えた項目を `stylistic-quirks.md` の主要ルールへ**昇格**する／新たな保留を**追記**する／棄却・除外する対象とする。

保留は1項目1行で、`保留ID｜特徴：保留の理由｜支持: <slug>, <slug>` の3欄で書く（`node scripts/style-pending-promote.mjs` が支持記事数から昇格候補を出す）。

次は**保留ではなく除外**（`syntax-guide.md` の管轄）として扱い、このファイルには項目を置かない。本文中の数字・比率・識別子のインラインコード化、半角の単位・略号、`L\*a\*b\*` のエスケープ、波ダッシュによる数値範囲、段落内の一文一行のソース整形、見出しの語形・階層（→ `writing-style.md`）。出力契約の禁止事項「媒体によって強制された記法を著者固有として扱わない」に該当する。

## 保留項目

- SQ-P001｜冒頭の動機づけ疑問（読者への直接の問いかけ）：実例は2箇所のみで、大半の記事・節は宣言文から入る。冒頭の修辞疑問で興味を喚起する手法は解説記事で広く使われる｜支持: /color-theory/color-three-attributes, /color-theory/basic-color-terms
- SQ-P002｜直感語を「」で仮提示し「〜と呼びたくなるかもしれません」と命名衝動に仮託してから正式用語へつなぐ：完全に成立するのは1記事の隣接2文のみ｜支持: /color-theory/color-three-attributes
- SQ-P003｜体言止め（名詞句・問いの句）を単独文として置く焦点づくり：用例は各記事1件・形も異なる計2件で、焦点づくりの効果は推測。体言止めは一般的技法でもある｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing
- SQ-P004｜読者の身近な経験に訴える口語的挿入（「〜という経験は誰しもあるでしょう」）：3例は性質がばらつき単一の癖として括りにくく、日常経験に訴えるのは汎用的な教育手法でテーマ上も自然｜支持: /cg/basics/camera-capture-and-cg
- SQ-P005｜範囲・含みを調整する副詞「おおまかに」「より広く」：各1件のみで、異なる副詞を1つの癖に束ねる根拠が薄い｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing
- SQ-P006｜矢印・全角記号（↔ → ＝）で対応・変換・状態遷移を示す：記事間で不一致（同シリーズの別記事は全角コロンを使う）で偏在し、記法寄りでもある｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/area-filling
- SQ-P007｜既定ルール＋例外許可「〜が基本ですが、〜ても構いません／よいです」：確認できる3例がすべて1記事に集中し、他記事では別の許可表現が使われる｜支持: /color-theory/dominant-and-tone-on-tone
- SQ-P008｜`:Anki[]` の強調対象の選び方・密度・付与範囲（初出のみ／節・カード単位／検定系は高密度・CG系は初出の専門語のみ）：`:Anki` 自体がプロジェクト共通のコンポーネント記法（`syntax-guide.md` が正）で、媒体強制の記法と著者の選定判断を切り分けられない。密度の系統差も意図的な方針か記事の長さ・用語密度の副産物か本文から確認できない。主要用語へ初出以降も繰り返し付ける記事（透視投影6回・平行投影5回）もあり、初出限定という運用でも一貫しない。同一シリーズの隣接記事間でも密度が3倍近く違い（用語名のみ17箇所／方向語・座標記号・動詞まで47箇所）、選定方針として取り出せない｜支持: /color-theory/dominant-and-tone-on-tone, /color-theory/natural-harmony, /color-theory/light-components-and-reflectance, /color-theory/opponent-color-response, /color-fields/landscape-color-approach, /color-theory/color-vision-characteristics, /color-fields/visual-design-and-color, /color-fields/fashion-color-concepts, /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P009｜専門用語・送り仮名の表記揺れ（杆体／桿体、よばれます／呼ばれます、読みとる／読み取る）：誤字・不統一か意図的選択か判断できず、反復はするが方向が定まらない｜支持: /color-theory/photoreceptor-types-and-distribution, /color-theory/color-vision-types
- SQ-P010｜番号付き手順の末尾に（？）を置いて不確かさを演出する：1例のみ｜支持: /color-theory/rgb-color-system
- SQ-P011｜強い同一視の文末「〜にほかなりません」：1例のみ｜支持: /cg/basics/vector-and-raster
- SQ-P012｜深掘り予告「もう一歩踏み込んで（見ていきます）」：1例のみで、シリーズ内の深掘り記事に共通するか要検証｜支持: /cg/basics/image-sampling
- SQ-P013｜強調の因果「だからこそ」：単一例のみで、「強調の因果＝だからこそ」という機能的すみ分けは1例では一般化できない｜支持: /cg/basics/image-sampling
- SQ-P014｜技術的な不変条件を「必ず」「つねに」で言い切る：実質1記事1トピックと1例のみで、癖として文書化するには薄い｜支持: /cg/basics/image-quantization, /cg/basics/vector-and-raster
- SQ-P015｜「〜ことになります／ことになる」で論理的帰結を述べる文末：前提から必然的に導かれる結論を観察事実の記述と書き分ける用法だが、出現が数式による導出を含む記事に偏り、同時に分析した医学系2記事には0件で、導出記事特有か著者の癖か切り分けられない。数式を含まないCG概念解説にも1例（「別の手がかりから判断することになります」）が出たが、同記事の他の帰結文は「〜になります」で書かれ、分布の偏りを覆すには足りない。CGの変換シリーズにも及ぶが、いずれも同じ記事内で「〜になります」「〜となります」と併用され、論理的帰結だけに割り当てられているとは読み取れない｜支持: /cg/basics/image-sampling, /cg/basics/image-quantization, /color-theory/color-rendering, /color-theory/xy-chromaticity-diagram, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P016｜自問自答「では、〜でしょうか」→「答えは単純で、〜」：「答えは単純で」を伴う完全形は1例のみ｜支持: /cg/transformation/basic-transformations
- SQ-P017｜手法を「考え方」「アイデア」「とらえ方」と抽象名詞で呼ぶ：1記事に集中し記事間の偏りが大きい｜支持: /cg/basics/shape-rasterization
- SQ-P018｜「素朴に考えれば／直感的には」で素朴案・直感を先に示す：各1例で語も異なり、共通の定型句とは言えない（説明の運び方自体は `thinking-flow.md` の判断層）｜支持: /cg/basics/shape-rasterization, /cg/basics/anti-aliasing
- SQ-P019｜かぎ括弧「」で命題・口語的フレーズ・注目語を囲む：単一名詞の強調に使う例が `:Anki` との役割分担（専門語は `:Anki`、命題・口語句は「」）に反する反例となり、境界が厳密でない｜支持: /color-theory/adjacent-color-influence, /color-theory/illuminance-and-lighting-design
- SQ-P020｜「〜が特徴です」で描写・比較を締める：一般的すぎて著者固有性が弱い｜支持: /color-theory/illuminance-and-lighting-design, /color-theory/lamp-types
- SQ-P021｜反直感の現象を「実際には〜ても」「〜が同じでも」で提示してから定義へ入る：1記事のみで、同記事内の別節は反直感型でない導入を使う反例（本体 SQ-070 とは表現形が別）｜支持: /color-theory/color-sensations
- SQ-P022｜変化・普及の文末「〜ようになりました／ようになります」：3記事中2記事のみ（もう1記事は不使用）で、「〜ようになる」は状態変化を表す標準的な日本語文法。いずれも時間経過そのものを主題とする記事でテーマ由来と切り分けられない｜支持: /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-theory/age-related-vision-changes
- SQ-P023｜歴史叙述を受動態＋過去（進行）で語る「〜れていました／用いられていた」：3記事目の該当例は現在形で形式的特徴と一致せず、人物の業績は能動態という反例もある。色彩史という主題自体が受動態を誘発する｜支持: /color-theory/ancient-european-colors, /color-theory/medieval-european-colors
- SQ-P024｜「その後」で時系列を接続する：2記事各1例と薄く、時系列を繋ぐ日本語の最も一般的な接続表現｜支持: /color-theory/medieval-european-colors, /color-theory/modern-european-colors
- SQ-P025｜中立的な語り口（問いかけ・勧誘・一人称・二人称・感嘆符・推量を用いない）：記事タイプ依存の変異で、他タイプの概念解説には二人称・読者巻き込み・節頭の問いかけが現れる。`syntax-guide.md` が「敬体で統一」「読者に語りかけすぎない落ち着いた説明文」を明文で規定しており、不使用は共通の文体規約の帰結としても説明がつく。不使用の側を著者全体の癖として一般化しない｜支持: /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-fields/interior-design-basics, /color-fields/interior-concept-history, /color-theory/color-temperature-and-light-color, /color-fields/landscape-color-approach, /color-fields/housing-color-design-process, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram
- SQ-P026｜年号を文頭に置いて起点化する「XXXX年に〜」：1記事のみで、他2記事は年代を文中・カード内に置く。正確な西暦が判明する時代という主題要因の可能性が高い｜支持: /color-theory/modern-european-colors
- SQ-P027｜一般論・通説を提示した直後に「実際には」「しかし」で留保・訂正する：明確な該当は1記事1箇所のみで、他記事は帰結叙述が主（判断層は `thinking-flow.md`、本体 SQ-070 とは機能が異なる別形）｜支持: /color-theory/ancient-european-colors
- SQ-P028｜錯視の程度を「実際よりも〜見える」で表す：1記事に限られ、色の対比というテーマ上ほぼ必然の言い回しで著者固有の癖と切り分けられない｜支持: /color-theory/color-contrast
- SQ-P029｜平行する見え方の解説を「〜する形で見え方が変化します」で揃える：1記事内3節の局所的な並行構造にとどまり、同シリーズのもう1記事には対応する反復がない｜支持: /color-theory/color-contrast
- SQ-P030｜節の対象範囲を「ここでは、〜」で限定して切り出す：1記事内2例のみで、同シリーズのもう1記事には出現しない｜支持: /color-theory/color-contrast
- SQ-P031｜手順説明での「〜ておきます／ておきたい」：各記事1例のみで、他の手順箇所は「〜します」で言い切るため反例が多い｜支持: /color-fields/landscape-color-approach, /color-fields/housing-color-design-process
- SQ-P032｜疑問形を『』で並べたチェックリスト：1箇所のみで他記事に反復例がない｜支持: /color-fields/landscape-color-approach
- SQ-P033｜並列列挙「〜たり、〜たりする」（3項目まで並べて上位語で受け直す形を含む）：日本語の基本的な並列文型で、症状・対処を箇条書きにせず1文に畳むこと自体も一般的な書き方。理論解説では0件という分布のみ記録する｜支持: /color-theory/color-vision-characteristics, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics
- SQ-P034｜統計の述語に「〜が該当します」を選ぶ／出典を「◯◯によると」で文頭に置く：各2件・1件のみで、同シリーズの他の統計には出典が付かず条件が読み取れない｜支持: /color-theory/color-vision-types, /color-theory/color-vision-characteristics
- SQ-P035｜「決して〜ない」による強調：各記事1件のみで、いずれも定義・数式の説明ではなく具体場面の記述に現れる｜支持: /color-theory/color-vision-types, /cg/transformation/projective-transformation
- SQ-P036｜TermCard 内が1文のときの句点の有無／全角コロンによるラベル区切りの記事間差：記法規約が未確定である可能性が高く、句点・区切りの基準として規則化できない｜支持: /color-theory/color-vision-characteristics, /color-theory/color-vision-types
- SQ-P037｜通時的な話題を完了継続「〜てきました」で受ける：もう1記事の該当例は現在への波及を表す別の相で、実質1記事に閉じる｜支持: /color-fields/interior-concept-history
- SQ-P038｜定義を連用中止「〜を:Anki[X]といい、〜」で一文にまとめる：2例のみで、同一記事内でも定義が2文に分かれる箇所があり一貫しない｜支持: /color-fields/interior-design-basics, /color-theory/color-temperature-and-light-color
- SQ-P039｜外来語のカタカナ表記（長音符の有無・記事系統ごとの差）：長音の判断が実際に試される語が少なく、分野をまたぐ語では不統一（ユーザー／ユーザ）で規則化できない。実務上は新規記事の表記をその記事系統の既出表記に合わせる目安としてのみ用いる｜支持: /color-fields/interior-concept-history, /color-fields/fashion-color-concepts, /cg/camera/digital-camera-structure
- SQ-P040｜程度の強調を漢語副詞＋「に」で行う（飛躍的に／明確に／大きく）：4例中3例が1記事に偏り、もう1記事は0件。「とても」「非常に」を避けること自体も落ち着いた解説文一般の規範｜支持: /color-fields/interior-concept-history
- SQ-P041｜例示を「〜といった＋上位語」「〜など」の名詞句へ畳んで閉じる：「といった」は1記事に集中し他は0回と偏りが大きく、名詞句への例示の畳み込みは日本語の説明文で極めて一般的（`syntax-guide.md` も「たとえば」を標準の接続表現として認める）｜支持: /color-fields/interior-concept-history, /color-theory/elderly-vision-characteristics, /cg/transformation/perspective-and-parallel-projection
- SQ-P042｜具体例を先出しする「〜のような、〜」構文（場面を並べてから上位概念を置く）：各記事1例ずつの計2例と薄く、「たとえば」が両記事とも0件という消極的事実だけでは構文の著者性を裏づけられない｜支持: /color-theory/age-related-vision-changes, /color-theory/color-rendering
- SQ-P043｜装置や処理の役割定義を「〜するものです」で締める：実質2記事3例で、同じ記事内でも「〜役割を担います」など別形をとり型として確立していない｜支持: /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation
- SQ-P044｜三点リーダ「…」で余韻・早合点を演出する：図版キャプション2例と本文1例のみで、いずれも1記事に閉じる｜支持: /color-theory/optical-illusions, /color-theory/xy-chromaticity-diagram
- SQ-P045｜箇条書きの最終項目を「...etc.」で閉じる：1例のみ｜支持: /color-fields/visual-design-and-color
- SQ-P046｜可能表現の冗長形「〜ことができます」：日本語の解説文一般に共通し、同記事内に短縮形（表せる・行える）も混在して規則として切り出せない。可能性そのものが論点になる導出記事に偏る｜支持: /color-fields/visual-design-and-color, /color-theory/xy-chromaticity-diagram, /color-theory/photometric-quantities, /color-fields/media-design-concepts
- SQ-P047｜AI草稿由来の表現が残った可能性（「のです」「すると、」「私たち」がAI草稿を経た記事に集中する）：本文のみでは草稿由来か著者本人の癖かを切り分けられず、`refine-style.md` 側の差分分析と突き合わせて再検討する｜支持: /color-theory/optical-illusions, /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation
- SQ-P048｜理由・要因を後置の独立文（「〜ためです。」「〜からです。」）または分裂文（「Bなのは、Aからです」）で文末の焦点に置く：用例は各記事1〜2例で、同時に分析した記事は因果をすべて「〜ため、」の文中接続に畳む反例。分裂文は後置・先出しの両方向に現れ、結びも「〜からです」だけでなく「〜によります」（「使われるのは、この読み取りやすさによります」）をとる（語形は本体 SQ-026、配置は `writing-style.md` の守備範囲）。後置理由を「〜のは、〜ためです」に一本化し「〜からです」を0件にする記事もあり、結びの語形は本体 SQ-026 の変種として記録した｜支持: /color-theory/color-rendering, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram, /color-theory/photometric-quantities, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P049｜「見えづらい」と「〜にくい」の意味別の書き分け仮説（知覚は「づらい」／機能・動作は「にくい」）：1記事内の読み取りにとどまり、著者が意識しているかは本文から確認できない。対象外の既存記事には「見えにくい」「わかりにくい」が実在して反例が多く、加齢・見え方を扱う一連の記事に「づらい」が集中するという分布にとどめる｜支持: /color-theory/age-related-vision-changes, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram
- SQ-P050｜「〜ことで」による手段・契機の表現：1記事に4件集中し、もう1記事は0件。機構説明という主題に由来する可能性が高い｜支持: /color-theory/age-related-vision-changes
- SQ-P051｜年齢を「〜代」ではなく「〜歳代」と書く表記：2例のみで、検定教材の定型表記を踏襲している可能性があり著者の表記選択と切り分けられない｜支持: /color-theory/age-related-vision-changes
- SQ-P052｜覆した結論を「AではなくBになってしまったのです」で締め、次文を「このことが、〜を表しています」で受ける重ね技：3要素はそれぞれ本体 SQ-066／SQ-062／SQ-059 が個別に扱っており、重ねる形は1箇所のみ。同記事の他の帰結文は淡々と書かれる｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P053｜否定を限定辞つきの部分否定に寄せ、裸の全否定（〜ではありません／できません）を使わない：限定辞つきの部分否定は日本語の技術解説文で広く使われる作法で、語形だけでは著者固有性が立たない。分布の主張は複数記事で否定文を数え直せるまで保留｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P054｜「そのまま」の否定形・肯定形を問題側と解決側に割り振る：中間に二分法へきれいに収まらない要求文があり、短い概念記事で3回反復する密度も昇格材料にならない｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P055｜図とその構成要素の正体を「〜を…たものです」の措定文で説明する：1記事2例のみで、他記事には「次の図はイメージです」のように短く切る予告もあり既定型とはいえない｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P056｜`:::Note` の中身を語義補足（用語先行）と図の断り書きの2文型に限る：記事内の Note は2つで各文型1例のみ｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P057｜「〜と便利です」で要求を述べてから「そこで、〜が作られました」で応える2文の型：「と便利です」は1例のみで、既存の推奨・評価の文末とも系統が異なる｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P058｜連体形の揺れ（「見分けがつかない色の範囲」／「見分けのつかない範囲」）：同一記事内の格助詞の揺れで、許容される表記ゆれか偶発かを判断できない｜支持: /color-theory/color-difference-and-uniform-color-space
- SQ-P059｜「つまり」を文中（同格言い換え）と文頭（前段落の圧縮）の両方に置き、いずれも1記事1回に抑える：2記事×1回という極小サンプルから運用制約は導けない。文中の同格言い換えに「つまり」を当てる点は本体 SQ-033 の使い分けの反例として `evidence/` に記録済み｜支持: /color-theory/photometric-quantities, /color-fields/media-design-concepts
- SQ-P060｜「ただし、」による逆接的な限定の導入：1回のみで、かつAI草稿の同語を著者が残した箇所であるため著者固有の癖と断定できない｜支持: /color-fields/media-design-concepts
- SQ-P061｜「〜の方が」による二者比較：1記事に3例集中し、もう1記事は0件。本体 SQ-063／SQ-064 に吸収すべきか独立させるべきか判断できない｜支持: /color-theory/photometric-quantities
- SQ-P062｜同じ内容を「問いかけ形」と「名詞句形」の2通りで括弧に並置する：確認できるのは1記事の見取り図の箇条書き・カードだけで、もう1記事には同種の並置が一切ない。並列項目の見取り図という限られた位置に従属する部分現象｜支持: /color-theory/photometric-quantities
- SQ-P063｜:::Action の誘導文を「〈操作〉て／ことで、〈観察対象〉を、〜てみよう」の3部構成に揃える：語尾の誘い掛けは本体 SQ-072、本文とのレジスター差は SQ-003 が扱い、ここで保留にするのは語順まで含む文型テンプレート。4記事で語順は一貫するが支持がすべて `/cg/transformation/` シリーズに閉じており、件数の必要条件（3記事）を満たしても単一シリーズのため昇格させない。末尾の知覚動詞は固定されない（見る／見比べる／観察する／確認する／注目する／体感する）ため、テンプレート化できるのは語順と「〜てみよう」まで。観察点が3つ以上のときは箇条書きに割って各項を「〜がどう変わるか」の体言止めでそろえる変種、スクロール誘導のように型から外れるブロックもある｜支持: /cg/transformation/pinhole-camera, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P064｜前提から必然を導く従属節に「〜する以上、」を選ぶ（「立体を平面の画像として表示する以上、〜必要です」）：単一記事の2例のみで、本体 SQ-026 の因果表現（〜ため／〜からです）の変種にとどまる可能性がある｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P065｜極限操作を追う1文の中で「〜ていく」を2回連ねる（「遠ざけていくと、〜小さくなっていき」）：本体 SQ-042 の使用量「1段落に2回以上重ねない」への単発の逸脱で、他記事の極限・連続変化を扱う節で反復が確認できていない｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P066｜小節見出しを「〈対象〉の〈観点〉：〈要約〉」と全角コロンで対にする（「透視投影の強み：写実的な描画」／「透視投影の弱点：形状の把握」）：対になる2見出しのみで、同記事の残り2見出しはコロンを使わない。本体 SQ-052 は箇条書きのラベル区切りを扱っており、見出しへの拡張は1記事の単発ペアでは支えられない｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P067｜欠点の発現を「〜にもなり得ます」で可能性に留める：1例のみで、直後の2文は「読み取ることはできません」「適していないのです」と断定へ強めており、弱点全般をヘッジする方針ではない｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P068｜理解の仕方を「〜と捉えると、〜がわかってきます」で提案する：完全形は1例のみ（本体 SQ-058 の「〜と考えることができます」とは別語形）。補足ブロックに偏る分布も単独記事の少数例からの推測｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P069｜手法を導入する節を「たとえば、」→「このような場合、」→「そこで、」の順で用途から解決へ運ぶ：1例のみで、本体 SQ-020（例は直前の抽象文の直後に1文で置く）に対する反例としても読める。他記事での再現を確認してから構造の見直しを検討する｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P070｜同一記事内で対概念を「大きく`2`種類」の並列としても、「〜の特別な場合と考えることができます」の特殊化としても位置づける併用：本体 SQ-034 の位置づけ構文は使われているが、並列と特殊化を使い分ける運用は1記事の内部不整合としてしか観察できていない｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P071｜:Anki を対比の要になる形容詞・状態語へ広げる（:Anki[遠い]／:Anki[無限]／:Anki[平行]）：明確に形容詞・状態語といえるのは2語で、「間隔」「向き」は通常の名詞への付与と区別できない。本体 SQ-054 の変種（対比が主題の理論記事に限る）を超える根拠にならない。方向語（外・奥）・座標記号・動詞（縮ませる）まで広げる記事もあるが、同時に分析した記事は付与17箇所すべてが用語名相当の名詞で反例になり、空間操作という主題由来と切り分けられない｜支持: /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projection-steps
- SQ-P072｜手法の活躍場面を「〜の出番です」と口語的に言う：1例のみで、本体 SQ-001 のやさしい語り口に吸収されるかも判断できない｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P073｜比例関係を「〜ものほど〜」で書く（「投影中心から:Anki[遠い]ものほど小さく写ります」）：本文は1例のみで、残りの用例はすべて掲載コードのコメント内｜支持: /cg/transformation/perspective-and-parallel-projection
- SQ-P074｜`:::Foldable` 内の掲載コードのコメントを常体で書き、「なぜその値・その処理か」を添える：本文ではなく生成物寄りのテキストで、`add-threejs-demo` スキルの生成物である可能性を排除できない。3記事で常体＋理由付けが共通するが、著者の起草か生成物かを完成記事の本文だけでは切り分けられないため昇格させない｜支持: /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P075｜変数・座標はインラインコード、複数項の等式や記号そのものはインライン数式（$$…$$）と書き分ける：インライン数式側の根拠が1記事に依存し、その記事の同一段落で同じ量が `w'` とインライン数式に混在して運用が一貫しない。もう1記事は地の文のインライン数式が0件｜支持: /cg/transformation/projective-transformation
- SQ-P076｜帰結の文末「〜になります／となります／ことになります」を配色以外（変換・操作の結果）へも同型で当てる：語形自体が日本語の説明文で極めて一般的で、カード・箇条書き内で常体「〜になる」へ落ちる差はレジスター切替（本体 SQ-003／SQ-004）に還元でき、帰結表現の語彙選択そのものに著者固有性が立たない｜支持: /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P077｜目的を文頭で主題化する「〜するには、」：本体 SQ-068（条件・範囲の主題化）の延長だが、目的節の前置は日本語の説明文で広く使われる基本的な統語パターンで、出現数の多さだけでは著者固有性が立たない｜支持: /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P078｜見方の提示に使う語形を1記事のうちで振り替える（捉えられます／みなすことができます／考えるとよいでしょう／思い浮かべると分かりやすいでしょう）：振り替えを確認できるのは1記事4例のみで、もう1記事は1例。同じ言い方の反復を避けるという一般的な文章術と切り分けられない（語形そのものは本体 SQ-058）｜支持: /cg/transformation/projective-transformation
- SQ-P079｜口語寄りの副詞・畳語（なんでもかんでも／まったく／一見）を動機づけ段落と記事の締めに差し込む：各記事1〜2例で、定義文・数式の説明には現れないという分布は確認できるが、意図的な文体操作か自然な語彙選択か数件では判別できない（本体 SQ-005 のオノマトペ・擬態語とは語種が別で、両記事にオノマトペは0件）｜支持: /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P080｜処理の要件を「〜する必要があります」で明示する：3例が1記事に閉じ、もう1記事は0件。一般的な技術文書に広く見られる言い方で著者固有と判断できない｜支持: /cg/transformation/projection-steps
- SQ-P081｜数式ブロックや箇条書きを文の途中に挟んで一文を跨がせる：1例のみで、同時に分析した記事は式の前で文を閉じており記事間で挙動が逆（配置は `writing-style.md` の守備範囲）｜支持: /cg/transformation/projection-steps
- SQ-P082｜:Anki（暗記対象）と :Mark（デモの操作対象・図中の指示対象）を役割で書き分け、Action 内の操作名は :Mark で囲む：既存の強調ルールは :Anki の範囲を扱う SQ-054 だけで役割分担が未記載だが、:Mark は `de7b964b` でディレクティブを分割した際に導入された媒体側の記法で、文体上の選択と記法の仕様を切り分けられない｜支持: /color-theory/reflection-and-refraction, /cg/transformation/viewing-pipeline-transformations
- SQ-P083｜デモが無い記事でも、場面のキーワード（昼間・朝焼け・距離）を :Mark で拾って注目点を作る：このラウンドで唯一デモを持たない記事1本のみの観察で、比較できる同種の記事がない｜支持: /color-theory/light-scattering
- SQ-P084｜:::Action を「操作の指示＋観察すべき変化（または問い）」を一文に畳む定型で書く：4記事で型がそろうが、Action のレジスターと文末形は本体 SQ-003・SQ-072、配置と着眼点の個数は RS-038 が担当しており、残る「一文に畳む」部分が独立したルールとして立つか判断がつかない｜支持: /color-theory/reflection-and-refraction, /color-theory/interference-and-diffraction, /cg/transformation/viewing-pipeline-transformations, /cg/transformation/parallel-projection-types
- SQ-P085｜単調な依存関係を「〜ほど…なります」の比較構文で述べる：3記事で確認できるが、量の共変を表す「〜ほど」は日本語の説明文で広く使われる基本構文で著者固有性を主張できない（二項の対比・対句は本体 SQ-063・SQ-064）｜支持: /color-theory/interference-and-diffraction, /color-theory/light-scattering, /cg/transformation/parallel-projection-types
- SQ-P086｜デモのUIラベル・選択肢名をかぎ括弧「」で引用し、画面上の文字列そのままで本文から参照する：2記事各1〜2箇所で、デモを持つ記事に限られる。処理・概念の動詞句化の用法は本体 SQ-048 が担当｜支持: /color-theory/interference-and-diffraction, /cg/transformation/parallel-projection-types
- SQ-P087｜図・デモ中の要素を丸括弧で見た目（破線・白い円）に言い換えて本文から指し示す：1記事2箇所のみで、用語と平易な説明を対にする括弧グロス（本体 SQ-047）との切り分けも用例が足りない｜支持: /color-theory/reflection-and-refraction
