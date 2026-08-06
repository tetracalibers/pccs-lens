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
- SQ-P008｜`:Anki[]` の強調対象の選び方・密度・付与範囲（初出のみ／節・カード単位／検定系は高密度・CG系は初出の専門語のみ）：`:Anki` 自体がプロジェクト共通のコンポーネント記法（`syntax-guide.md` が正）で、媒体強制の記法と著者の選定判断を切り分けられない。密度の系統差も意図的な方針か記事の長さ・用語密度の副産物か本文から確認できない｜支持: /color-theory/dominant-and-tone-on-tone, /color-theory/natural-harmony, /color-theory/light-components-and-reflectance, /color-theory/opponent-color-response, /color-fields/landscape-color-approach, /color-theory/color-vision-characteristics, /color-fields/visual-design-and-color, /color-fields/fashion-color-concepts, /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation
- SQ-P009｜専門用語・送り仮名の表記揺れ（杆体／桿体、よばれます／呼ばれます、読みとる／読み取る）：誤字・不統一か意図的選択か判断できず、反復はするが方向が定まらない｜支持: /color-theory/photoreceptor-types-and-distribution, /color-theory/color-vision-types
- SQ-P010｜番号付き手順の末尾に（？）を置いて不確かさを演出する：1例のみ｜支持: /color-theory/rgb-color-system
- SQ-P011｜強い同一視の文末「〜にほかなりません」：1例のみ｜支持: /cg/basics/vector-and-raster
- SQ-P012｜深掘り予告「もう一歩踏み込んで（見ていきます）」：1例のみで、シリーズ内の深掘り記事に共通するか要検証｜支持: /cg/basics/image-sampling
- SQ-P013｜強調の因果「だからこそ」：単一例のみで、「強調の因果＝だからこそ」という機能的すみ分けは1例では一般化できない｜支持: /cg/basics/image-sampling
- SQ-P014｜技術的な不変条件を「必ず」「つねに」で言い切る：実質1記事1トピックと1例のみで、癖として文書化するには薄い｜支持: /cg/basics/image-quantization, /cg/basics/vector-and-raster
- SQ-P015｜「〜ことになります／ことになる」で論理的帰結を述べる文末：前提から必然的に導かれる結論を観察事実の記述と書き分ける用法だが、出現がいずれも数式による導出を含む記事に限られ、同時に分析した医学系2記事には0件で、導出記事特有か著者の癖か切り分けられない｜支持: /cg/basics/image-sampling, /cg/basics/image-quantization, /color-theory/color-rendering, /color-theory/xy-chromaticity-diagram
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
- SQ-P035｜「決して〜ない」による強調：1件のみ｜支持: /color-theory/color-vision-types
- SQ-P036｜TermCard 内が1文のときの句点の有無／全角コロンによるラベル区切りの記事間差：記法規約が未確定である可能性が高く、句点・区切りの基準として規則化できない｜支持: /color-theory/color-vision-characteristics, /color-theory/color-vision-types
- SQ-P037｜通時的な話題を完了継続「〜てきました」で受ける：もう1記事の該当例は現在への波及を表す別の相で、実質1記事に閉じる｜支持: /color-fields/interior-concept-history
- SQ-P038｜定義を連用中止「〜を:Anki[X]といい、〜」で一文にまとめる：2例のみで、同一記事内でも定義が2文に分かれる箇所があり一貫しない｜支持: /color-fields/interior-design-basics, /color-theory/color-temperature-and-light-color
- SQ-P039｜外来語のカタカナ表記（長音符の有無・記事系統ごとの差）：長音の判断が実際に試される語が少なく、分野をまたぐ語では不統一（ユーザー／ユーザ）で規則化できない。実務上は新規記事の表記をその記事系統の既出表記に合わせる目安としてのみ用いる｜支持: /color-fields/interior-concept-history, /color-fields/fashion-color-concepts, /cg/camera/digital-camera-structure
- SQ-P040｜程度の強調を漢語副詞＋「に」で行う（飛躍的に／明確に／大きく）：4例中3例が1記事に偏り、もう1記事は0件。「とても」「非常に」を避けること自体も落ち着いた解説文一般の規範｜支持: /color-fields/interior-concept-history
- SQ-P041｜例示を「〜といった＋上位語」「〜など」の名詞句へ畳んで閉じる：「といった」は1記事に集中し他は0回と偏りが大きく、名詞句への例示の畳み込みは日本語の説明文で極めて一般的（`syntax-guide.md` も「たとえば」を標準の接続表現として認める）｜支持: /color-fields/interior-concept-history, /color-theory/elderly-vision-characteristics
- SQ-P042｜具体例を先出しする「〜のような、〜」構文（場面を並べてから上位概念を置く）：各記事1例ずつの計2例と薄く、「たとえば」が両記事とも0件という消極的事実だけでは構文の著者性を裏づけられない｜支持: /color-theory/age-related-vision-changes, /color-theory/color-rendering
- SQ-P043｜装置や処理の役割定義を「〜するものです」で締める：実質2記事3例で、同じ記事内でも「〜役割を担います」など別形をとり型として確立していない｜支持: /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation
- SQ-P044｜三点リーダ「…」で余韻・早合点を演出する：図版キャプション2例と本文1例のみで、いずれも1記事に閉じる｜支持: /color-theory/optical-illusions, /color-theory/xy-chromaticity-diagram
- SQ-P045｜箇条書きの最終項目を「...etc.」で閉じる：1例のみ｜支持: /color-fields/visual-design-and-color
- SQ-P046｜可能表現の冗長形「〜ことができます」：日本語の解説文一般に共通し、同記事内に短縮形（表せる・行える）も混在して規則として切り出せない。可能性そのものが論点になる導出記事に偏る｜支持: /color-fields/visual-design-and-color, /color-theory/xy-chromaticity-diagram, /color-theory/photometric-quantities, /color-fields/media-design-concepts
- SQ-P047｜AI草稿由来の表現が残った可能性（「のです」「すると、」「私たち」がAI草稿を経た記事に集中する）：本文のみでは草稿由来か著者本人の癖かを切り分けられず、`refine-style.md` 側の差分分析と突き合わせて再検討する｜支持: /color-theory/optical-illusions, /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation
- SQ-P048｜理由・要因を後置の独立文（「〜ためです。」「〜からです。」）または分裂文（「Bなのは、Aからです」）で文末の焦点に置く：用例は各記事1〜2例で、同時に分析した記事は因果をすべて「〜ため、」の文中接続に畳む反例。分裂文は後置・先出しの両方向に現れる（語形は本体 SQ-026、配置は `writing-style.md` の守備範囲）｜支持: /color-theory/color-rendering, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram, /color-theory/photometric-quantities
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
- SQ-P063｜:::Action の誘導文を「〈操作対象〉を動かして、〈観察してほしい変化〉を、〜てみよう」の3部構成に揃える：語尾の誘い掛けは本体 SQ-072、本文とのレジスター差は SQ-003 が扱い、ここで保留にするのは語順まで含む文型テンプレート。確認できるのは1記事の5例のみで、デモを持つ他記事との比較ができていない｜支持: /cg/transformation/pinhole-camera
