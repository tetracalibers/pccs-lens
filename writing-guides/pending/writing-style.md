# writing-style（保留）

## このファイルの位置づけ

`writing-style.md`（文章構成）の保留プール。根拠不足・単一記事偏り・一般技法や媒体様式との切り分け困難などの理由で、まだ主要ルールに採用していない構成上の観察を集めた補助記録である。

ここに置かれた項目は **文章生成・推敲時には適用しない**（`author-style-writer` はこのファイルを読まない）。
`author-style-analyzer` が分析のたびにこのファイルを読み、根拠が増えた項目を `writing-style.md` の主要ルールへ**昇格**する／新たな保留を**追記**する／棄却する対象とする。

保留は1項目1行で、`保留ID｜特徴：保留の理由｜支持: <slug>, <slug>` の3欄で書く（`node scripts/style-pending-promote.mjs` が支持記事数から昇格候補を出す）。

支持記事が同一シリーズ・同一テーマ・近接時期に偏る項目は、記事数が閾値を超えても他タイプ・他ドメインでの再現が確認できるまで昇格させない。ソース上の改行・記法（`:Anki`・`:WithGradeTag`・バッククォート・一文一行）は `syntax-guide.md` の管轄で、構成上の癖としては扱わない。

## 保留項目

- WS-P001｜表色系解説の共通マクロ構成テンプレート（色相環→明度→彩度→色立体→色票集）：節順に記事間のずれがあり「ほぼ同一」とは言えない。この骨格は顕色系・カラーオーダシステムの解説が必然的に含む要素でテーマ由来でも説明できる｜支持: /color-theory/pccs-color-system, /color-theory/munsell-color-system
- WS-P002｜締めの型（別視点の言い換え／研究物語の結論／適用限界の注意／本質の凝縮文）：やや著者的だが型が分散しており一つに収束しない（まとめ節の不在自体は本体 WS-004 へ格上げ済み）｜支持: /color-theory/color-wheel-and-color-solid, /color-theory/basic-color-terms, /color-theory/pccs-color-system, /color-theory/munsell-color-system
- WS-P003｜導入記事の末尾を次記事のテーマへ橋渡しする：明確な前方橋渡しの実例は1例のみで、導入記事という対象自体が1記事しかない｜支持: /cg/basics/camera-capture-and-cg
- WS-P004｜`###` サブセクションを予告済みの並列項目の列挙に用いる：根拠は1記事1インスタンスで、同シリーズのもう1記事は `###` を一切使わない。色の理論では同格要素を並列カードが担い `###` の並列列挙は稀。予告してから小見出しに分けるのは一般的構成術｜支持: /cg/basics/camera-capture-and-cg
- WS-P005｜各節が「接続→機構・状況の説明→用語ラベル→（任意）一覧化や本質の言い換え→締め」という共通の説明ユニット順序を取る：固定テンプレート化を避け、橋渡し・命名後置・凝縮文などの個別ルールに分解して扱うため、統合ルールとしては立てない｜支持: /cg/basics/camera-capture-and-cg, /cg/basics/cg-and-image-processing
- WS-P006｜段落を1〜3文・1段落1論点に保つ（短段落）：日本語の Web 向け技術・解説記事全般に広く見られる一般的な文章作法で、著者固有性と切り分けられない。「1論点」の粒度にも反例があり、文の情報量そのものは本体 WS-040 の範囲にとどまる｜支持: /cg/basics/camera-capture-and-cg, /color-theory/brightness-sensitivity-and-adaptation, /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-theory/adjacent-color-influence, /color-theory/illuminance-and-lighting-design, /color-theory/what-is-lighting, /color-theory/visual-clarity-and-visibility, /color-theory/color-vision-characteristics, /color-theory/color-vision-types, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram, /color-theory/color-difference-and-uniform-color-space
- WS-P007｜並列する用語・技法をカードで横並び比較する：CardGrid／TermCard というサイト固有の媒体機能への依存が大きく、カード化か箇条書きか・横並びか縦一列かが一貫しない｜支持: /color-theory/color-area-proportion, /color-theory/hue-tone-difference
- WS-P008｜純粋な概念導入記事はデモを省き対立概念を箇条書きで示す：1記事のみで、抽象的な導入テーマにデモがないのは示すべき配色サンプルがないという題材必然の面もある｜支持: /color-theory/unity-and-variety
- WS-P009｜多数のサブ技法をプロパティ別に `###` でグループ化し、各群の冒頭に性質の要約文を置く：ほぼ1記事に偏り、他の複数技法記事は逐次列挙でグループ化しない｜支持: /color-theory/hue-tone-difference
- WS-P010｜「暗順応：明るい場所から暗い場所へ」のような term＋補足の「：」連結見出し：見出しが体言止めの話題ラベルであること自体は日本語の解説記事でほぼ普遍的な慣習で固有性を示せない｜支持: /color-theory/brightness-sensitivity-and-adaptation
- WS-P011｜記事内のセクション順は基礎→応用（学年タグ昇順）／級ごとに節を切り基本節の直後に発展節を置くペア構造：学年タグ列が単調昇順になっておらず本文で裏づけられない。grades はプラットフォーム機能で著者判断か機能由来か切り分けられず、ペア構造も2記事中1記事でしか成立しない｜支持: /color-theory/light-components-and-reflectance, /color-theory/photoreceptor-types-and-distribution, /color-theory/color-vision-types, /color-theory/color-vision-characteristics, /color-theory/age-related-vision-changes, /color-theory/color-rendering
- WS-P012｜章の導入記事は全体の枠組みを先に示し、末尾で分類ツリーに統合する：該当タイプ1記事のみで型レベルのルールにできない｜支持: /color-theory/how-color-works
- WS-P013｜説明→図→操作 Example の三段配置：清潔に成立するのは双子コンポーネントの実質1記事1パターンのみで、同シリーズの別記事は Action が図の前にあり順序が逆｜支持: /color-theory/color-mixing-basics
- WS-P014｜問いを立てて記事・節を駆動し末尾で解く（弱い傾向）：清潔に成立するのは1記事のみで、しかも「使われない理由」という反直感的な限界のテーマに限られる。もう1記事は問い→即答で別パターン｜支持: /color-theory/rgb-color-system
- WS-P015｜分類の俯瞰ツリー図（mermaid）を先出しし、記事末で再グルーピングする構成：1記事のみ｜支持: /color-theory/additive-color-mixing-types
- WS-P016｜応用カタログ型記事の並列短節構成（媒体名→混色原理の同定→補足の反復）：1記事のみ｜支持: /color-theory/real-world-color-mixing
- WS-P017｜一つの走る具体例を複数節で再登場させる構成：1記事のみ｜支持: /color-theory/color-matching-and-grassmanns-law
- WS-P018｜比較記事の構成型：3ドメインいずれも比較記事が1本ずつ（n=1）で、型が揃わない（既知の方式→対照方式→統合節／対象ごと1見出し＋属性カード＋末尾の体系分類／同観点の並行叙述＋現代への着地）。比較記事が増えるまで型としての確定を保留する｜支持: /cg/basics/vector-and-raster, /color-theory/lamp-types, /color-fields/interior-concept-history
- WS-P019｜抽象的な定義の直後に「1つは〜もう1つは〜」の要素分解で同内容を別角度から再提示する：1例のみ｜支持: /cg/basics/image-digitization
- WS-P020｜導入の締めにゴールか読み進め順を1文で明示する：5記事中2記事で欠落・1記事で配置違いと反例が優勢で、「この記事では〜を説明します」型は一般的な文章術｜支持: /cg/transformation/basic-transformations, /cg/transformation/transformation-composition
- WS-P021｜一般原則を述べた後、具体例を「確かめてみる」枠として後置する：1記事のみで、比喩を定義に先んじて置く具体→抽象の箇所もあり向きが固定しない｜支持: /cg/transformation/transformation-composition
- WS-P022｜`発展：` プレフィックスで応用・任意の内容を記事末尾の小節に置く：単一例｜支持: /cg/transformation/affine-transformation
- WS-P023｜実装セクションを素朴解→限界→改良の段階的洗練で構成する：3段以上の連鎖が明確なのは1記事のみで、もう1記事は用途に応じた別手法への切り替えという別現象｜支持: /cg/basics/shape-rasterization
- WS-P024｜末尾に次記事への前方リンクを置く配置：導入での後方リンクは4本すべてで一貫するが、末尾の前方リンクは1本のみ｜支持: /cg/basics/shape-rasterization
- WS-P025｜定義先行・主題先行の書き出し：リード文が定義ではなく動機づけの記事、描写→命名の逆順で始まる節があり「各セクションが必ず定義から始まる」とは言い切れない。リード文と各節のどちらで定義が来るかを切り分けて他コーパスで再確認するまで保留｜支持: /color-theory/what-is-lighting, /color-theory/subjective-color
- WS-P026｜抽象→具体の展開順（定義→注意・補足→例・数値・図）：実質2記事・同一コーパスで、抽象的な式の説明で終わり具体例・図に到達しない節もある｜支持: /color-theory/illuminance-and-lighting-design, /color-theory/photometric-and-radiometric-quantities
- WS-P027｜平行構造の対セクション（内部構成をそろえ、締めの一文を区別語だけ差し替えて反復）：同型文の反復が確認できるのは1記事のみで、他は見出しの対称性どまり｜支持: /color-theory/adjacent-color-influence
- WS-P028｜定義直後の誤解先回り（「〜ではないことに注意」）の構造配置：1記事1箇所のみで他5記事に同型構文がなく、混同されやすい指標を扱う記事固有の必要性から生じた可能性が高い｜支持: /color-theory/illuminance-and-lighting-design
- WS-P029｜技術的数値と日常参照物の括弧対応づけ（`1000lx`（雨の屋外程度））：1記事のみで、数値を日常物に対応づける手法自体も一般的な説明技法。照度という抽象的な単位ゆえに必要になった記事テーマ固有の工夫の可能性が高い｜支持: /color-theory/illuminance-and-lighting-design
- WS-P030｜段階的に育てる反復ツリー図（同一の mermaid を枝ごとに反復描画し該当枝をハイライト）：1記事内で5回反復するが n=1 で、階層的分類という題材が生んだ工夫の可能性を排除できない｜支持: /color-theory/lamp-types
- WS-P031｜図解・デモをセクション／カードの末尾に配置する：実質1記事しか主張を支えず、デモが説明文より前・説明→デモ→さらに説明・Icon 画像が先頭という反例が優勢｜支持: /color-theory/visual-clarity-and-visibility
- WS-P032｜H2＝概念カテゴリ／H3＝個別用語の二層見出しを細分が必要なときだけ使う：明確に成立するのは1記事のみで、もう1記事は H2 自体が個別用語で「カテゴリ→個別用語」の構造ではない｜支持: /color-theory/visual-clarity-and-visibility
- WS-P033｜節を時系列・物語順に並べ、時間・因果の接続でつなぐ：3記事とも通史テーマで、時代順配列と時間接続は記事テーマ由来の一般的構成（Evidence 反証で著者固有とは判断できないと判定）。非時系列の概念解説での検証がない｜支持: /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors
- WS-P034｜内容量の多い節のみ `###` で下位分割する：3記事中1記事のみで観測され、9節と相当な分量のある記事が `###` を使わず `##` 増設で対応するため「内容量の多さ」が説明として機能していない｜支持: /color-theory/modern-european-colors
- WS-P035｜一節一現象の細かい分割と並列テンプレート化（定義文→方向条件の箇条書き→Action→デモのカード群）：1記事に限られ、同記事内でもテンプレートを崩す節がある。もう1記事は現象ごとに構成が異なる｜支持: /color-theory/color-contrast
- WS-P036｜全体像を俯瞰図（mermaid 分類ツリー）で示してから「ここでは〜」でスコープを絞り込む：1記事1箇所のみで、同シリーズのもう1記事は俯瞰図もスコープ宣言もなく個別現象へ直接入る（判断層は `pending/thinking-flow.md`、具体記述は本項に一本化）｜支持: /color-theory/color-contrast
- WS-P037｜具体例の前に必要な用語を専用節で先出しする：1記事1箇所のみで、同シリーズのもう1記事には語彙先出し節がない｜支持: /color-theory/color-contrast
- WS-P038｜対になる条件を2項の箇条書きで対照する：1記事内の一部節に限られ、同記事内でも補色対比・色相対比は散文＋カードで示す｜支持: /color-theory/color-contrast
- WS-P039｜例外・傍論・用語の区別を `:::Note` に退避するか本文へ組み込むかが記事で分かれる：同一著者の別記事で正反対の処理がなされており、一貫した退避パターンとは言えない｜支持: /color-theory/contrast-phenomena, /color-theory/color-contrast
- WS-P040｜定義を段階的に精緻化する（粗→精の二段配置）：明確な事例が1箇所に依存し、一文で定義を確定させる節が多数派。もう1記事の例は用語の逐次導入・対比語の弁別に近く性質が異なる｜支持: /color-theory/color-contrast
- WS-P041｜導入の型が記事タイプで分岐する（概念解説はリード段落＋対象語の定義、プロセス解説はリードなしで全工程の番号リストから入る）：各分岐の裏付けが1記事ずつで、分岐という主張自体が各タイプ1例からの外挿にとどまる｜支持: /color-fields/landscape-color-approach, /color-fields/housing-color-design-process
- WS-P042｜全工程の俯瞰を先頭に置くロードマップ先行構成：単一記事のみで、冒頭リスト6工程のうち本文で詳述されるのは前半4工程程度と対応が完全ではない。プロセス解説・マニュアル一般の定石｜支持: /color-fields/housing-color-design-process
- WS-P043｜対象範囲の境界を包含／除外で明示する：「含む／含まない」を両方言い切る強い実例は1箇所のみで、もう1記事は包含の言及にとどまる。景観法・公的／私的領域の区分を扱う記事テーマ由来の可能性が高い｜支持: /color-fields/landscape-color-approach
- WS-P044｜統計を実数へ換算し、規模の評価と実務的含意で締める型：実数換算まで揃う例は3件あるが、規模の評価と実務的含意まで続くのは1箇所のみ。実数換算だけを弱い傾向として扱い、フルパターンは保留｜支持: /color-theory/color-vision-types
- WS-P045｜一言の補足は丸括弧、本筋を止める「なぜ」は `:::Note` へ退避し、Note を節末ではなく話題の途中に挟む：Note の実例は1箇所のみで、もう1記事には `:::Note` が一つもなく、退避が必要そうな機構説明を TermCard 内の本文として書いている｜支持: /color-theory/color-vision-types
- WS-P046｜節末の限定一文が次節との境界づけを兼ねる：境界づけまで果たす例は1件のみで、もう1記事の限定文は節内の焦点絞りにとどまる（節末後置そのものは本体 WS-066 へ反映済み）｜支持: /color-theory/color-vision-characteristics
- WS-P047｜箇条書きの列挙の後に地の文で「実際どれが重要か」を補う流れ：1箇所のみで、CardGrid による列挙では後続の地の文がなく、列挙形式による使い分けか単発かを判別できない｜支持: /color-theory/color-vision-types
- WS-P048｜記事全体を「原因別 → より広い障害へ」と外側に拡張する配列：1記事のみで、同シリーズのもう1記事は「統計 → 分類 → 分類軸の精緻化」という別の配列｜支持: /color-theory/color-vision-characteristics
- WS-P049｜節末に次へつなぐ一文を独立した段落として置く：独立段落として確認できたのは1例のみで、他の候補は同一段落内の2文目または記事全体の結び。もう1記事にはこの種の橋渡し文が一切ない｜支持: /color-fields/interior-design-basics
- WS-P050｜定義文に次の展開の起点（分類の個数・決定要因）を同居させ、定義だけの一文で止めない：2記事各1回で、同一記事内でも定義が2文に分割される箇所があり型が割れる｜支持: /color-fields/interior-design-basics, /color-theory/color-temperature-and-light-color
- WS-P051｜番号付きリストの直後に「なぜその順序か」を書く：1記事2箇所のみで他2記事に該当箇所がない（理由の中身が不可逆性・依存関係に偏る点は本体 TF-049 へ吸収済み）｜支持: /color-fields/interior-design-basics
- WS-P052｜具体値の一覧は本文に書かず図に預け、本文と図で情報を重複させない：図を持つ記事が1本のみで他記事で検証できていない（`thinking-flow.md` から構造面として移送）｜支持: /color-theory/color-temperature-and-light-color
- WS-P053｜図解コンポーネントを節末・記事末に置き、本文から「図のように」と参照しない：図解を含む記事が1本のみ｜支持: /color-theory/color-temperature-and-light-color
- WS-P054｜図解コンポーネントを持つ理論記事では導入文を省略する：意図的な省略か記法規約からの逸脱かを本文だけでは判別できない｜支持: /color-theory/color-temperature-and-light-color
- WS-P055｜関連記事への内部リンクを節末の独立した1文として置く：1記事2例のみで、他2記事はリンクを1つも含まない｜支持: /color-fields/interior-design-basics
- WS-P056｜節の分量を揃えない（2文で終わる節と図・箇条書きを伴う長い節を同居させる）：扱う内容に応じて節の長さが変わり短い節を水増ししないのは大半の書き手に共通する性質で、反証がほぼ不可能。著者固有の癖として立証する積極的な根拠に乏しい｜支持: /color-theory/optical-illusions, /cg/camera/digital-camera-structure, /color-fields/visual-design-and-color
- WS-P057｜図・現象を前の図からの一操作として連鎖導入する：連鎖が成立するのは1記事の6現象中2〜3で、他は前の図を引き継がず独立に始まる。第二の根拠は図が未実装（TODO のプレースホルダのみ）｜支持: /color-theory/optical-illusions
- WS-P058｜観察は断定、機構や学説は非断定で書き分ける（文単位の分離）：書き分けが見えるのは1記事で、同記事内に機構を踏み込んで断定する反証がある。modality の調整そのものは `stylistic-quirks.md` の守備範囲で、残せるのは観察文と機構説明文を別文に分ける配置面だけ｜支持: /color-theory/optical-illusions
- WS-P059｜読者の疑問を一文で代弁し、直後に答えて「だからこそ」で結論を確定させる3手セット：3手が揃うのは1箇所のみで、他記事には自問形式が一切ない｜支持: /cg/image-properties/dynamic-range-and-gradation
- WS-P060｜図のキャプション（TermCard の `title`）を、見えるものを断定する短文にする：図解コンポーネントを多数含む記事が1本しかなく比較対象がない｜支持: /color-theory/optical-illusions
- WS-P061｜`###` 見出しを用語名ではなく動詞句にして概念の系譜を並べる：1記事のみで、他7記事の見出しは名詞句のため単発の可能性が高い｜支持: /color-fields/color-universal-design
- WS-P062｜分野を並列に紹介する記事で、各節を「その分野における色彩の役割」に着地させる：近い動きのあるもう1記事は着地先が節単位ではなく記事単位で、実質1記事の根拠｜支持: /color-fields/visual-design-and-color
- WS-P063｜最後の `##` 節を受け皿にして分類に収まらない項目を集める：1記事のみで、他記事には受け皿節がない｜支持: /color-theory/optical-illusions
- WS-P064｜中心概念を否定で始めて定義に転じる導入：1記事のみで他記事のリードは肯定の定義文・現象提示から入る。否定型の転換を本文中の転換点に限る本体側の方針とも衝突する｜支持: /color-fields/fashion-color-concepts
- WS-P065｜`:::Example` ブロックと地の文の「たとえば」の使い分け（動機づけの例は地の文、定義後の確認例はブロック）：`:::Example` を持つ記事が偏り、同一記事内でも1行の例をブロックへ出す箇所と対比の例を地の文へ埋める箇所が併存して、長さでも役割でも境界を説明できない｜支持: /cg/image-properties/dynamic-range-and-gradation, /color-theory/photometric-quantities
- WS-P066｜リードを上位の一般事実からの絞り込みで書く：2記事の実例が限定と拡張という逆方向で1つの型に収まらず、上位事実から主題へ絞り込む導入は説明文一般に広く見られる｜支持: /color-theory/age-related-vision-changes, /color-theory/color-rendering
- WS-P067｜`##` 見出しに変化の方向を示す語（変化・低下・増大）を含め、記事内の見出しを同じ語形でそろえる：1記事のみで、しかも語形が揺れており「そろえる」という主張自体が完全には成り立たない｜支持: /color-theory/age-related-vision-changes
- WS-P068｜`:::Note` を図・シミュレーションの免責の但し書きに限って使い、本文の断定を後から留保する：実例は1箇所のみで、もう1記事には `:::Note` が一つもない。別記事の同用途 Note は図の前にあり位置が逆で、位置を分ける条件を特定できない｜支持: /color-theory/age-related-vision-changes, /color-theory/age-related-eye-diseases
- WS-P069｜第1セクションで要因を箇条書きし、以降の `##` で同じ順に展開する：1記事のみで、箇条書き5項目のうち2項目に対応する節がなく、逆に箇条書きにない項目が節として挿入されるため対応が完全ではない｜支持: /color-theory/age-related-vision-changes
- WS-P070｜逆接を独立した接続詞文にせず同一文・同一段落内で処理する：例が少なく、方針か偶然か判断できない｜支持: /color-theory/age-related-vision-changes
- WS-P071｜一般化した記述の直後に個人差・不均一性の限定を添える：医学・生理系2記事に限られ、人体・医学を扱う記述で個人差の限定を添えるのは分野の作法として広く行われるため題材由来と切り分けられない｜支持: /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics
- WS-P072｜理論記事の導出を「素朴な期待→否定→方針宣言→定義式→成立の検証→命名→系」の順で組む：担当範囲で数式を含む記事がこの1本のみで、複数記事での裏づけがない｜支持: /color-theory/xy-chromaticity-diagram
- WS-P073｜理論記事は各節の冒頭で前節の結論を言い直し、並列列挙型の記事は節間の接続文を置かない：接続文を置く側の裏づけが1記事のみで、記事タイプへの一般化には理論記事がもう1本必要｜支持: /color-theory/xy-chromaticity-diagram
- WS-P074｜記事末尾をコンポーネント（図）で終える：意図的な締め方か本文の書き足し待ちかを本文だけでは判定できず、同型の例も1件のみ｜支持: /color-theory/age-related-eye-diseases
- WS-P075｜`##` 直下にその節で解く問いだけを置き、答えを `###` に降ろす：もう1記事は `##` 直下が本論で `###` が細部の切り出しになっており、記事タイプ差か単発かを判断できない｜支持: /color-theory/xy-chromaticity-diagram
- WS-P076｜一度命名した用語を後の節で「なぜそう呼ばれるか」の観点から回収して再説明する／同じ内容を2文重ねて言い換える：いずれも1記事の各1箇所のみで、後者は冗長の解消漏れか意図的な反復かを完成本文だけでは判別できない｜支持: /color-theory/xy-chromaticity-diagram
- WS-P077｜記事全体の前提となる用語の定義を、最初の見出しの前（リード直後）の `:::Note` へ切り出す：1記事1箇所のみで、同じ記事のもう1つの Note は節中盤・図の直前にあり位置が固定されていない。前提語がちょうど1語に絞れた題材固有の配置の可能性が高い｜支持: /color-theory/color-difference-and-uniform-color-space
- WS-P078｜読者の素朴な期待を一文立ててから「しかし／ところが」で覆し、直後に「このことが〜を表しています」型の意味づけを置く：1記事内2箇所のうち片方は「しかし」の直後が命名文で、「直後に必ず意味づけを置く」が同一記事内で半分しか成り立たない。文末語形は `stylistic-quirks.md` の管轄｜支持: /color-theory/color-difference-and-uniform-color-space
- WS-P079｜対比される2つの用語に、同形式の丸括弧注釈を対称に付ける：実例は1文のみで、同記事の他の括弧注釈は対称に付ける相手を持たない。対比構造が生じたときにほぼ自動的に発生しうる一般的な文章技巧｜支持: /color-theory/color-difference-and-uniform-color-space
- WS-P080｜短編は「既存手段が成り立たないことを示す節」→「解決概念を導入する節」の2節で構成する：単一記事の観察で分析側も推測にとどまると自己申告しており、節数・階層の薄さは記事の分量や図示できる対象の数にも規定される｜支持: /color-theory/color-difference-and-uniform-color-space
- WS-P081｜`###` の用途を「関係の掘り下げ」と「留保」の2種に限定し、見出しを「AとBの関係」型の名詞句にする：2記事の `###` は合計4個しかなく母数が小さい。うち1つは掘り下げでも留保でもない派生語の整理で、分析側も反例として自認している｜支持: /color-theory/photometric-quantities, /color-fields/media-design-concepts
- WS-P082｜並列概念記事で各 `##` の内部展開まで同型に揃える（動機となる場面→定義文→単位→定義カード→既出概念との位置づけ）：裏づけは1記事のみで、同記事内でも動機となる場面を持たない節があり掘り下げの `###` も一部の節にしかなく列が揃わない｜支持: /color-theory/photometric-quantities
- WS-P083｜本文の定義文と定義カードで同じ定義を二重に提示する：TermCard を使う記事では4節連続で成立するが、同じく用語を定義するもう1記事はカードを一切使わず本文の定義文だけで済ませる。二重提示の有無がコンポーネントの採否に依存する｜支持: /color-theory/photometric-quantities
- WS-P084｜節末を一文の再定義で着地させる：1記事2例のみで、もう1記事に対応する例がない（節末の凝縮そのものは本体 WS-026 が扱う）｜支持: /color-theory/photometric-quantities
- WS-P085｜視覚デモの区画を「本文の説明→:::Action の着眼点→<CanvasWrapper> のデモ→:::Foldable の実装コード」の4点セットに定型化し、節をまたいで反復する（地の文はコードに言及しない）：Three.js デモを持つ記事が限られ、1記事の観察にとどまる。デモ前の着眼点提示は本体 WS-065／TF-057 が扱うため、保留に残るのはデモ後のコード配置を含む区画全体の定型｜支持: /cg/transformation/pinhole-camera
- WS-P086｜見出しに用語を掲げた節では定義文を節末へ置き、節本文は現象の組み立てに充てる（見出し語と定義位置をずらす）：命名後置そのものは本体 WS-052／TF-015 が扱っており、見出しに用語が既出の場合の扱いという上乗せ部分を1記事でしか確認できていない｜支持: /cg/transformation/pinhole-camera
