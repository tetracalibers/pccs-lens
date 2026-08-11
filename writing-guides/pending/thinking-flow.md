# thinking-flow（保留）

## このファイルの位置づけ

`thinking-flow.md`（思考フロー）の保留プール。根拠不足・単一記事偏り・一般技法との切り分け困難などの理由で、まだ主要ルールに採用していない思考・判断の観察を集めた補助記録である。

ここに置かれた項目は **文章生成・推敲時には適用しない**（`author-style-writer` はこのファイルを読まない）。
`author-style-analyzer` が分析のたびにこのファイルを読み、根拠が増えた項目を `thinking-flow.md` の主要ルールへ**昇格**する／新たな保留を**追記**する／棄却する対象とする。

保留は1項目1行で、`保留ID｜特徴：保留の理由｜支持: <slug>, <slug>` の3欄で書く（`node scripts/style-pending-promote.mjs` が支持記事数から昇格候補を出す）。

支持記事が同一シリーズ・同一テーマ・近接時期に偏る項目は、記事数が閾値を超えても他ドメインでの再現が確認できるまで昇格させない（CG・幾何変換シリーズ、ヨーロッパ色彩史シリーズなど）。また級タグ（grades / `:WithGradeTag` / `:Anki`）に依存する観察は、PCCS検定級という媒体の級構造に規定されており、著者固有の判断と切り分けられない。

## 保留項目

- TF-P001｜空間関係を図に委ね読者に発見させる：操作可能な図（回転・クリック）はアプリの提供コンポーネントに依存するため、著者の判断か環境要因かを切り分けられない。図の配置順は WS-062、誘い掛けの語尾は SQ-072 の担当｜支持: /color-theory/pccs-color-system, /color-theory/munsell-color-system, /color-theory/color-wheel-and-color-solid
- TF-P002｜メタに目標・範囲・射程を提示する判断（リードでの宣言を含む）：多くのセクション・記事はメタ宣言なしに本題へ入り、目標提示は一般的な文章技法。除外宣言として機能するのは1例のみで、他は前記事の復習・話題紹介・対象概念の定義の書き換えという別現象。リードを持たない記事もあり、2記事で型が揃わない（対比からの拡張／上位カテゴリからの絞り込み）。リードの有無・内容という構造面は WS-007／WS-013 の担当｜支持: /color-theory/color-three-attributes, /color-fields/landscape-color-approach, /color-fields/interior-design-basics, /color-fields/interior-concept-history, /cg/camera/digital-camera-structure, /color-theory/age-related-vision-changes, /color-theory/color-rendering
- TF-P003｜記事タイプによる読者モデルの切替（概念解説は一人称を排し、手順解説は一人称・個人的検証・道具推奨を前面に出す）：手順記事が1本のみで検証不足。表現面の現れは SQ-073 の担当｜支持: /color-theory/how-to-draw-pccs-color-wheel
- TF-P004｜手順を先に列挙してから用語を後で定義する構成：1記事1箇所のみで検証不足｜支持: /color-theory/pccs-color-system
- TF-P005｜計算・数学の詳細を名前付きブラックボックスに留める：対象2記事はいずれも初学者向け概念導入で、数式回避はこの記事タイプの既定であり著者固有判断と分離できない。実装解説・チュートリアルとの対照が取れるまで保留｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing
- TF-P006｜記事全体を単一の参照枠・対比軸で貫き、新概念を都度そこへ引き戻す：枠がテーマ由来（デジタルカメラモデルはCG教育の標準的枠組み、CGとコンピュータビジョンは文字通り逆写像）で著者判断と切り分けられず、比較記事も1本のみ。構造としての現れは WS-001 の担当｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing
- TF-P007｜説明手段の妥当性をメタに正当化する（カメラになぞらえる方針がなぜ有効かの根拠を添える）：1記事の実質1事象のみ｜支持: /cg/basics/camera-capture-and-cg
- TF-P008｜二者をまず同一視し締めで唯一の差異を明示する簡略化／構成要素を全紹介してから消費処理へ進む分解→再統合のマクロ順序：根拠が実質1記事に偏るか、writing-style と重複する｜支持: /cg/basics/cg-and-image-processing
- TF-P009｜新技法を既習技法の下位分類・変種として接続する（弱い傾向）：確認できるのは配色技法2本のみでいずれもドミナント族への接続に集中し、「追加された制約を理由として述べる」は片方でしか成立しない。既習知識への接続は一般的な教育原則｜支持: /color-theory/dominant-and-tone-on-tone, /color-theory/tonal-color-scheme
- TF-P010｜調和論記事の多層的な積み上げ（観察現象→法則の命名→技法→逆の技法→適用外→表色系での体現）：実質1記事に偏り、思考（なぜ深掘りするか）と構成（どの順で並べるか）の切り分けも要検討｜支持: /color-theory/natural-harmony
- TF-P011｜導入記事で軸概念を先に定義し、後続記事がその語を参照する系列設計：本文のみからは意図的な事前設計と断定できず、記事間の順序も推測に依存する｜支持: /color-theory/unity-and-variety
- TF-P012｜数式・信号処理に直感的な分解イメージ・比喩を添える：数式を含む uc 記事が1件しかなく、もう一方の比喩は非数学的機構への比喩で条件が異なる｜支持: /color-theory/opponent-color-response
- TF-P013｜習熟段階（grade）に応じて説明深度を層化する読者モデル：grade 割当はPCCS検定級という媒体の級構造に強く規定されており、著者固有の自由な判断と切り分けられない。構成面の現れは `pending/writing-style.md` と対応｜支持: /color-theory/light-components-and-reflectance, /color-theory/photoreceptor-types-and-distribution, /color-theory/opponent-color-response, /color-theory/color-roles, /color-theory/visual-clarity-and-visibility
- TF-P014｜本筋から外れる発展・傍論・例外・補助用語を補足枠（`:::Note`・補足見出し・独立小節）へ隔離して読み飛ばしを許す：括弧書きで即時に言い換える処理のほうが圧倒的に多く、いつ外出しするかの判断基準が定まらない。Note を一つも持たない記事もあり、退避が必要そうな補足が本文に書かれる反例もある。器の選択は `writing-style.md` の担当｜支持: /color-theory/rgb-color-system, /color-theory/photometric-and-radiometric-quantities, /color-theory/lamp-types, /color-theory/contrast-phenomena, /color-theory/color-vision-types
- TF-P015｜派生要素を上位カテゴリへ束ねてまとめる（中間混色への統合）：単一記事に偏り、一般的な整理術との区別がつきにくい｜支持: /color-theory/rgb-color-system
- TF-P016｜数式・定理の結論を直感的な理由で開いて見せる（2倍条件＝「1周期に山と谷の2点が要る」）：1記事の1箇所に突出し、他記事は言葉への翻訳にとどまる（翻訳自体は TF-038 が扱う）｜支持: /cg/basics/image-sampling
- TF-P017｜観察可能な現象を先に見せ、機構は道具が揃ってから回収して接続する：成立するのは1例のみで、同シリーズの量子化は機構を先に定義して現象を後で結ぶ逆順という反例｜支持: /cg/basics/image-sampling
- TF-P018｜分類・体系化の前に統一基準と順序原理を立てる（「何を保存するか」で入れ子を作る）：1記事のみで、保存量による階層化は変換分類の数学的な定番でテーマ主導の可能性が高い。構造面は WS-079 の担当｜支持: /cg/transformation/affine-transformation
- TF-P019｜導出を明示的な段階数で予告して分割する（「2段階に分けて導けます」）：2記事のみで、導出の必然性でも説明できる｜支持: /cg/transformation/coordinate-systems, /cg/transformation/basic-transformations
- TF-P020｜締めで適用条件・使い分けを明示し、学んだ手法を万能と受け取らせない：実際に記事の締めに位置するのは1記事のみで、他記事の類似記述は節の導入・注記や中盤にある。手法が単一で比較・選択が生じない記事では成立しない｜支持: /cg/basics/area-filling
- TF-P021｜定義より先に「その概念が必要になる場面・素朴な現象」を置く：概念解説5本中2本が定義先行の反例で拮抗し、色温度と光色も定義先行。本体 TF-001 は「Aだけでは足りない」という不足の名指しを起点にする別型｜支持: /color-theory/illuminance-and-lighting-design, /color-theory/photometric-and-radiometric-quantities, /color-theory/adjacent-color-influence
- TF-P022｜比較記事で基準となる代表例を先に立て、他項目をそれとの差分で説明する：2記事で同型を確認できるが、Evidence 反証ではこの対比構造は比較記事という記事タイプ自体が与えるもので著者固有とは判断できないと判定された｜支持: /color-theory/lamp-types, /color-fields/interior-concept-history
- TF-P023｜分類の全体骨格を図で先に示し、各枝の説明ごとに同じ樹形図を継ぎ足して段階開示する：段階拡張が成立するのは1記事のみ（もう1件は一度に全体を提示する単発の完成図）。構造面は `writing-style.md` の担当｜支持: /color-theory/lamp-types
- TF-P024｜抽象概念に身近な数値スケールで基準点を与え、後の節で再利用する（手元灯100lx／満月0.1lx）：1記事内では強く一貫するが他記事に横断確認できない｜支持: /color-theory/illuminance-and-lighting-design
- TF-P025｜数式を記号表記で示さず言葉と単位で導く：2記事で同型を確認できるが、Evidence 反証では数式回避が著者の一貫した方針か初級・テーマの事情かを本文だけからは切り分けられないと判定された｜支持: /color-theory/photometric-and-radiometric-quantities, /color-theory/photometric-quantities
- TF-P026｜一つの色材・色を時代・セクションを跨いで追跡し、地位の変化として描く：同一色材の歴史を時代順に追うことがテーマそのものの通史3部作で、再登場は題材上ほぼ不可避。Boundary でも単一記事内の執筆判断ではなくシリーズ構成上の一貫性という別レイヤーと指摘された｜支持: /color-theory/medieval-european-colors, /color-theory/modern-european-colors
- TF-P027｜通説・単純化をいったん提示し、直後に「実際には〜」で留保・訂正して誤解を防ぐ：3記事中2記事のみで型も微妙に異なり（単純化モデルの訂正／時代評価への反論）、近代には明確な例がない。反論が思想的スタンスに由来するか事実訂正かも本文からは断定できない。本体 TF-006 は教育上の単純化→補正を扱う別型｜支持: /color-theory/ancient-european-colors, /color-theory/medieval-european-colors
- TF-P028｜歴史叙述の終点を読者の学習目的（PCCS・表色系）へ接続する：1記事のみで、単に時系列の末尾に来た結果とも解釈できる｜支持: /color-theory/modern-european-colors
- TF-P029｜現象は体験・実例で先に触れさせ、道具となる語は使用前に定義する（順序の使い分け）：同一シリーズ内に「見出し直後に用語つき定義を先に置く」反例が複数あり、二分法は支持されない｜支持: /color-theory/contrast-phenomena
- TF-P030｜全体像を俯瞰図（mermaid の分類ツリー）で示してから扱う範囲を明示的に絞り込む：1記事1箇所のみで、同シリーズのもう1記事は俯瞰図なしに個別現象から入る。昇格する場合も thinking-flow 側は「個別知識を全体地図のどこに位置づけるかを先に与える」という読者モデル上の理由だけを保持し、提示手段は `writing-style.md` に一本化する｜支持: /color-theory/color-contrast
- TF-P031｜スコープから外す対象は「なぜ外すか」を根拠づけてから除外する：1記事1箇所のみで、同シリーズの継時対比は除外理由の明文なく俯瞰図とスコープ宣言で処理している｜支持: /color-theory/contrast-phenomena
- TF-P032｜設計対象の範囲を包含／除外で明示的に線引きし、含まれないものをあえて言明する：除外まで言い切る例は1記事に集中し、もう1記事の該当箇所は包含の言明。範囲・制度上の区分を扱う景観というテーマに起因する可能性が高い｜支持: /color-fields/landscape-color-approach
- TF-P033｜専門用語を必要になる直前で最小限だけ定義する（ジャストインタイムの用語補助、用語1つ＝1節の粒度を含む）：用語を初出位置で最小限だけ定義するのは技術文書一般の標準的な書き方で、Evidence 反証でも著者固有とは判断できないと判定された。短い節も内容上の必然で説明でき、同じ節ペアを級タグで説明する競合仮説もある｜支持: /color-fields/housing-color-design-process, /color-fields/landscape-color-approach, /color-theory/color-vision-characteristics
- TF-P034｜プロセス記事の冒頭で全工程を番号リストで俯瞰させてから各工程を順に詳述する：1記事のみで、マニュアル・チュートリアル全般の定石。Boundary でも writing-style のロードマップ先行構成と競合・重複と指摘された｜支持: /color-fields/housing-color-design-process
- TF-P035｜多数派を基準にした相対記述で、欠如ではなく識別の難しさとして書く：アクセシビリティ・インクルーシブライティングの一般規範として広く採用されており（Evidence 反証で著者固有とは判断できないと判定）、テーマが要求する配慮と切り分けられない｜支持: /color-theory/color-vision-characteristics, /color-theory/color-vision-types
- TF-P036｜統計値をスケールの言い換え（20人に1人）へ変換し、そこから実務的含意へ接続する：1記事に限られ、もう1記事では統計値がカード・定義文に含意への接続なしで置かれる反例。構造的事実は `writing-style.md` に一本化し、thinking-flow 側は判断粒度だけに絞る｜支持: /color-theory/color-vision-types
- TF-P037｜二軸の分類を本文で軸ごとに導入し、その交差をカードで提示する構成：1記事のみで確認され、同シリーズのカード群は交差構造を持たない｜支持: /color-theory/color-vision-types
- TF-P038｜視覚的テーマにもかかわらず図・デモを用いない判断：他者の色覚を画面上で再現することへの配慮とも単に未着手とも読めて本文から判別できず、本体 TF-056 の反例にあたるかも確定できない｜支持: /color-theory/color-vision-characteristics, /color-theory/color-vision-types
- TF-P039｜記事後半で対象を隣接領域へ広げるスコープ拡張（色覚→視野・視力・生活支障）：UC級の実務要求に合わせた拡張と推測できるが、比較できる同型記事が分析対象にない｜支持: /color-theory/color-vision-characteristics
- TF-P040｜抽象的な規則を述べた直後に、身近な具体例を「たとえば」で一例だけ置く：抽象→具体の順で例を一つ添えるのは説明的文章一般に極めて広く見られ、Evidence 反証でも著者固有とは判断できないと判定された。例を一つに絞る点を識別点にできる根拠が要る｜支持: /color-fields/interior-design-basics, /color-fields/interior-concept-history
- TF-P041｜説明の終端で店頭・住まい・実務への接地を一文入れる（一般形）：場面への接地と言えるのは1例のみで、他は効能の言い換え。市販品への接地という限定形は本体 TF-027 へ吸収済み｜支持: /color-theory/color-temperature-and-light-color
- TF-P042｜列挙の直後に「これらは〜」で切り口を言語化し、項目の暗記だけで終わらせない：1記事2箇所のみで、同じ記事の他の箇条書きにはこの言い直しがなく記事内でも一貫しない｜支持: /color-fields/interior-design-basics
- TF-P044｜用語の由来のうち事物の起源をさかのぼる側（「原型は寝殿造りにさかのぼります」）：歴史記事の主題そのもので、命名を暗記対象にしないための判断と切り分けられない（名称の字義を添える側は本体 TF-013 へ吸収済み）｜支持: /color-fields/interior-concept-history
- TF-P045｜定義の二段構え（初出は括弧注や短い言い換えで流れを止めず、主役になる位置で単独に読める一文定義を再提示）：二度目の提示先がいずれも用語カード・小見出しという共有コンポーネントで、文章戦略か編集判断かを切り分けられない（Evidence 反証で stylistic-quirks 側の運用習慣として扱う方が実態に近いと判定）｜支持: /color-theory/psychological-scaling-method, /color-theory/optical-illusions, /color-fields/color-universal-design
- TF-P046｜学術的に未確定な機序には留保を付け、未解決であること自体を書く：確定度の管理として成立するのは1記事のみで、もう一方の根拠は学術的機序への留保ではなく実務上のばらつきの記述という別現象｜支持: /color-theory/optical-illusions
- TF-P047｜体験に危険がある内容は本文より前に警告を置き、代替の読み方まで指示したうえで図は削除せず掲載する：1記事1箇所のみで、危険性のある題材が他になく反例で検証できない。本体 TF-058 の反転例｜支持: /color-theory/optical-illusions
- TF-P048｜例示ブロックの用途を「抽象説明の直後に日常で観察できる事例を置く」に限定する：1記事3箇所のみで、他記事には例示ブロックが存在せずブロック記法の運用と切り分けられない｜支持: /cg/image-properties/dynamic-range-and-gradation
- TF-P049｜引用ブロックで理念・原則を一文に凝縮し、直後に「たとえば」で日常例へ落とす：1記事2箇所のみで、記法選択の側面も強い｜支持: /color-fields/color-universal-design
- TF-P050｜人名・年代・国名を「考え方の出発点」として導入する扱い：歴史的経緯を持つ題材が2記事しかなく、著者の癖か題材の要求か切り分けられない｜支持: /color-fields/color-universal-design, /color-theory/psychological-scaling-method
- TF-P051｜数式を提示した直後に記号の意味を言葉で定義し直し、さらに「なぜこの式か」を問い直す：数式を含む記事が1本のみで一般化できない（本体 TF-039／TF-038 と同系だが確度は引き上げない）｜支持: /cg/image-properties/dynamic-range-and-gradation
- TF-P052｜数値指標の解釈を、直前に定義した算出手順へ戻って一段ずつ再導出する：実質1記事1箇所で、もう一方の根拠は原因→数値の提示であり型が合わない。規格・慣習で決まる閾値は導出せず提示する点が適用外｜支持: /color-theory/color-rendering
- TF-P053｜既習の正常機構を節冒頭で1文だけ呼び戻し、直後に逆接で変化を接続する：1記事2箇所に限られ、もう1記事では既習事項がリンクのみで処理されて同型が現れない｜支持: /color-theory/age-related-vision-changes
- TF-P054｜図の役割で扱いを分ける（読み取りが一意でないグラフは単独＋読み取り文、見比べれば伝わる図は2枚並置でラベルのみ）：対比並置側は1記事1箇所のみで、2条件を持つ1つの規則として一般化する材料がない。シミュレーション図が第三の扱いになる点も型を確定できない要因｜支持: /color-theory/color-rendering
- TF-P055｜最終セクションを新事実ではなく既出要因の合成による帰結にする：2記事で合成のメカニズムが揃わない（同一記事内2節の合成／自記事の主題と他記事で既習の概念の合成）。節が並列トピックの列挙で構成される記事では成立しない｜支持: /color-theory/age-related-vision-changes, /color-theory/color-rendering
- TF-P056｜総論節で要因を箇条書きし、直後に「これらが重なることで〜」と合算した帰結を述べる：1記事のみで、もう1記事には対応する総論節がない。列挙5項目のうち2項目が以降で展開されず、列挙と後続構成の対応も崩れている｜支持: /color-theory/age-related-vision-changes
- TF-P057｜用語カードの前置・後置を役割で分ける（後で必要になる語は先に定義、説明し終えた現象への命名は後に置く）：1記事内の2例のみで、もう1記事ではカードが図のラベルとして別用途に使われている｜支持: /color-theory/age-related-vision-changes
- TF-P058｜定義に対して読者が抱く追加の疑問を `###` 小見出しに分解して短く答える：もう1記事には小見出しが一つもなく、記事タイプ差か個別事情かを判定できない｜支持: /color-theory/color-rendering
- TF-P059｜進行度・年齢を軸に軽度から重度へ並べ、読者が現在地を当てはめられるようにする：時間・程度の軸を持つ対象を軽度→重度の順に並べるのは医学・生理の解説で最も自然な順序で、逆順を採る理由が乏しい（Evidence 反証で著者固有とは判断できないと判定）｜支持: /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics
- TF-P060｜測定・検査の手法を独立した節として挟む：検定知識として要るからか、機能低下の説明を客観化するためかを判別する材料が他記事にない｜支持: /color-theory/elderly-vision-characteristics
- TF-P061｜前節末の限界言明と次節冒頭の要件提示を対にして節を渡す形：記事の節が2つしかなく連鎖は1回のみで、第1節の入口は前節ではなく先行記事の到達点を受けている。一般形は本体 TF-026 が扱うため、そこへ確度を積み増さない｜支持: /color-theory/color-difference-and-uniform-color-space
- TF-P062｜期待される理想形を反実仮想として立て、実測との差で図の意味を確定させる：1箇所のみで、他の実験結果・データ図の解説は素直な同定型。本体 TF-002 の代弁型と型が近く、同一判断の図版としての現れの可能性が高い｜支持: /color-theory/color-difference-and-uniform-color-space
- TF-P063｜実務での普及度で列挙を代表1つへ絞る（頻度以外の軸での剪定）：1箇所のみで比較できる場面が他記事になく、絞り込みの根拠も示されないため著者の判断か事実の記載かを切り分けられない。本体 TF-048 は頻度データによる剪定に限る｜支持: /color-theory/color-difference-and-uniform-color-space
- TF-P064｜操作的定義で図形の意味を与える（「基準色を置き、見分けがつかない色の範囲を囲んだもの」）：1箇所のみで他記事の根拠が未確認｜支持: /color-theory/color-difference-and-uniform-color-space
- TF-P065｜条件を1つだけ動かした統制変数型の比較で「新しい量が要る理由」を作る：反復自体は確認できるが、関連する物理量どうしの違いを教える文章ではこの比較形がほぼ必然的に選ばれ、テーマ由来と切り分けられない（Evidence 反証で著者固有とは判断できないと判定）｜支持: /color-theory/photometric-quantities, /color-fields/media-design-concepts
- TF-P066｜用途を示す位置には問い形、定義文には名詞句という書き分け：用例が1記事に集中し、もう1記事には一つもない（問い形で導入すること自体は本体 TF-016 へ吸収済み）｜支持: /color-theory/photometric-quantities
- TF-P067｜定義をカードへ切り出すか本文へ埋め込むかの使い分け：対比・並列する用語が複数あるかで分かれるとも読めるが、記事の整備状況による可能性を排除できず、共有コンポーネントの運用と著者判断を切り分けられない｜支持: /color-theory/photometric-quantities, /color-fields/media-design-concepts
- TF-P068｜例示ブロックを定義の前に置くか後に置くかの規則：同記事内で前後が揺れており、統一仮説を立てるには根拠が1記事3例しかない｜支持: /color-theory/photometric-quantities
- TF-P069｜程度が強まる順に用語を段階配置する型（グレア→不快グレア→減能グレア）：1記事1箇所のみで、同記事の他の分類は進行段階順という別の軸｜支持: /color-theory/photometric-quantities
- TF-P070｜現実の装置の説明と幾何モデルへの置き換えを別々の節に分け、「モデルに置き換える」という抽象化の行為自体を宣言してから抽象化に入る：確認できるのは1記事のみで、単発の構成判断が癖か本記事固有の都合か切り分けられない（TF-006 は理想モデル先出しで向きが逆、TF-026 は節間の橋渡し一文の話で節の分け方そのものは含まない）｜支持: /cg/transformation/pinhole-camera
- TF-P071｜前記事の想起を冒頭1箇所に限らず、新概念を定義するたびに繰り返す（前記事の個別事例を本記事の一般用語へ同定し直す形）：本体 TF-020 の使用量「想起は1文・1箇所」を破るが、根拠は前記事への依存度が特に高い1記事のみで、記事固有の事情を排除できない｜支持: /cg/transformation/perspective-and-parallel-projection
- TF-P072｜手法の限界を用途適合の言葉で言い切り、改良系列ではなく用途分担の代替手法を次節でその応答として導入する：本体 TF-044 は適用範囲をアルゴリズムの改良系列を扱う実装解説に限定しており、代替関係で同型が現れた例は1記事のみ（この記事の連鎖自体は本体 TF-001 で説明できる）｜支持: /cg/transformation/perspective-and-parallel-projection
- TF-P073｜幾何的条件から用途へ降ろすとき「像の上でどう現れるか」という中間段を必ず経由し、対比する2手法に同じ段数の連鎖を敷く：1記事のみで、本体 TF-027・TF-001 の連鎖と重なりが大きく独立した判断として切り出せない。短所側の連鎖は長所側より短く、記事内でも段数が揃わない｜支持: /cg/transformation/perspective-and-parallel-projection
- TF-P074｜本文を数式ゼロで通し、式とその挙動・デモ構成要素の選定理由を折りたたみ内のコード注釈へ隔離する：コード注釈で式の意味・設計意図を書くのは一般的なコーディング作法で著者固有の文章判断と切り分けられず、折りたたみブロックという器もデモ追加の運用手順に依存する。1記事のみ｜支持: /cg/transformation/perspective-and-parallel-projection
- TF-P075｜デモ前の案内の有無を、そのデモが読者の操作を要するかで決める（操作を要さないデモには案内を置かず直前の地の文で読み取り内容を言い切る）：本体 TF-057 は「着眼点を挟むかは記事により半々で一貫しない」としており、操作要否での説明は1記事3例からの推測にとどまる｜支持: /cg/transformation/perspective-and-parallel-projection
- TF-P076｜節の書き起こし方で命名の前後を変える（動機起点なら命名後置、分類文を受けるなら定義先出し）：説明メカニズムが自らの根拠である「投影」節に適合せず（節冒頭に明示的な動機文がない）、本体 TF-015 の「節の主題語は定義先出し」と矛盾する主張を1記事の内部差分だけで支えている｜支持: /cg/transformation/perspective-and-parallel-projection
- TF-P077｜変数を1つだけ動かす対照実験としてデモの観察を設計する（「動かしても変わらない」側の確認と「動かすと変わる」側の確認を別の観察指示に分ける）：不変量の確認が明確なのは1記事1節のみで、もう1記事のデモは複数パラメータの変化を並べて観察させるだけで不変量の確認を欠く｜支持: /cg/transformation/projective-transformation
- TF-P078｜デモの観察指示を本文の主張ごとに分割し、対応する段落の直後へ置く（デモ本体は分割せず後方に1つだけ置き、最初のブロックでデモの居場所を知らせる）：分割構成は1記事1節のみで、もう1記事の3デモはいずれもデモ直前に一括で置く反例。3段階の事実を順に確かめる説明内容に起因する可能性が高い｜支持: /cg/transformation/projective-transformation
- TF-P079｜式の成分の性質→操作的な意味→現実の見え方の3層を通して着地させる：3層の順序が同一記事内でも一定せず（性質→現実の見え方→効果の順になる節がある）、抽象→直感的意味→身近な例という展開自体が技術記事一般の説明構成。本体 TF-038 が具体化の一形態として扱う範囲を超えない｜支持: /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- TF-P080｜反直感的な帰結を「一見不思議な現象」と読者の違和感として言語化してから現実の観察と一致させる：完全な形は1記事の末尾1箇所のみで、もう1記事は違和感の言語化のあと現実観察ではなく処理上の対処で閉じる。現実の見え方との一致確認そのものは本体 TF-038 が扱う｜支持: /cg/transformation/projective-transformation
- TF-P081｜一般ケースを主として厚く説明し、退化ケース（平行投影・アフィン変換）は直後に2〜3文の対比で片付ける：記事の主題である一般ケースに紙幅を割き既習の特殊ケースを短く済ませるのは技術文一般に広く見られる配分で、著者固有の判断と切り分けられない（Evidence 反証で著者固有とは判断できないと判定）。分量差という構造事実は `writing-style.md` の担当｜支持: /cg/transformation/projection-steps, /cg/transformation/projective-transformation
- TF-P082｜処理順序への「なぜこの順序か」を予測し、本筋を進めきった直後の補足ブロックで答える（逆順にした場合の不都合を1文添える）：この用途の補足ブロックを持つのは1記事のみで、もう1記事の補足ブロックは後続記事への接続と用語付与という別用途。処理の順序が主題に現れる記事が現状1本しかない｜支持: /cg/transformation/projection-steps
- TF-P083｜準備節を後続節での用途の予告で閉じ、後続節で節名を挙げて名指しで回収する：予告→名指し回収の対が揃うのは1記事1箇所のみで、もう1記事は次節冒頭の受け直しだけで接続する別形。節間の渡し一般は本体 TF-026 が扱う｜支持: /cg/transformation/projective-transformation
- TF-P084｜計算コスト・処理の重さ（再計算の手間、判定の単純さ）を概念導入の主動機に据える：根拠は実装・処理工程を扱う1記事のみで、もう1記事は用途と現実の見え方で動機づける明確な反例。該当する記事タイプが現状1本しかない（破綻による動機づけは本体 TF-061 が扱う）｜支持: /cg/transformation/projection-steps
- TF-P085｜記事末尾で場合分けの分岐点と合流点を整理して閉じる：根拠は1記事の末尾1箇所のみで、もう1記事は主題の重要性を述べて閉じる別の締め方｜支持: /cg/transformation/projection-steps
- TF-P086｜本筋の理解に必須でない踏み込んだ解釈（無限遠点による平行線の交わり）を、必須部分をすべて終えた後の区分節へ切り出す：1記事にしか現れず、もう1記事には対応する節がないため思考パターンとして一般化できない｜支持: /cg/transformation/projective-transformation
- TF-P087｜折りたたみ内の実装コードのコメントで、実装の選択理由（深度を書かない理由、ラベルを面の手前へ置く理由、格子を敷く理由）まで説明する：両記事に一貫して現れるが、記事本文の説明戦略ではなくコード側の記述習慣であり、思考フローの対象範囲に入るか判断がつかない（TF-P074 と同系）｜支持: /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- TF-P088｜成果物（最終的に得たいもの）を基準にして現在の到達点の不足を測る言い方（「それだけでは1枚の画像にはなりません」）：もう1記事は成果物ではなく行列の形の制約を基準にしており、同一の判断とみなせるか確証がない。不足の名指し一般は本体 TF-001 が扱う｜支持: /cg/transformation/projection-steps
- TF-P089｜「その制約はまだ決めていません」のような自問的な問題提起で節を書き起こす：1記事1箇所のみで、表現の癖（`stylistic-quirks.md` 側）との切り分けもつかない｜支持: /cg/transformation/projection-steps
- TF-P090｜デモに含まれる要素（地平線・消点・視錐台の稜線）のうち、本文で言語化するものと図に委ねるものを選別する：言語化の例が1記事1箇所のみで、選別の基準を復元できるだけの事例数がない｜支持: /cg/transformation/projective-transformation
- TF-P091｜既に置いたデモを後の節から参照させ、2つのデモの同じ表示を見比べて量的な差を確認させる：1記事1箇所のみで、他4記事にデモを跨いだ比較指示は現れない。単一デモ内の着眼点指示は本体 TF-057、観察者としての動員は TF-058 が担当｜支持: /color-theory/interference-and-diffraction
- TF-P092｜座標系や表現の取り方の選択理由を処理コストの語彙（頂点あたりの掛け算の回数・再計算の要否・大小比較で済む判定）へ還元して繰り返し正当化する：1記事3箇所に閉じ、同じ変換シリーズの平行投影記事には同種の正当化が現れない。破綻による動機づけは本体 TF-061、理由まで下ろすこと自体は TF-008 が担当｜支持: /cg/transformation/viewing-pipeline-transformations
