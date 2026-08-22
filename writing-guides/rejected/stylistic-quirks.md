# stylistic-quirks（棄却）

## このファイルの位置づけ

`stylistic-quirks.md`（表現の癖）の棄却層。保留プール（`pending/stylistic-quirks.md`）にあった表現上の観察のうち、**記事が増えても解けない理由**で再審査を打ち切ったものを移した記録である。

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

- SQ-P008｜型不収束｜`:Anki[]` の強調対象の選び方・密度・付与範囲（初出のみ／節・カード単位／検定系は高密度・CG系は初出の専門語のみ）：密度が方針として取り出せない。同一シリーズの隣接記事間でも密度が3倍近く違い（用語名のみ17箇所／方向語・座標記号・動詞まで47箇所）、主要用語へ初出以降も繰り返し付ける記事（透視投影6回・平行投影5回）もあって初出限定という運用でも一貫しない。なお `syntax-guide.md` ルール1 が規定しているのは「どの語を囲むか」までで、密度・初出限定は規定していない（媒体規約への還元では説明できない）。｜再開: 記事系統ごとに密度の方針が一貫する（同系統内のばらつきが2倍未満に収まる）ことが3系統で確認できたら再開｜支持: /color-theory/dominant-and-tone-on-tone, /color-theory/natural-harmony, /color-theory/light-components-and-reflectance, /color-theory/opponent-color-response, /color-fields/landscape-color-approach, /color-theory/color-vision-characteristics, /color-fields/visual-design-and-color, /color-fields/fashion-color-concepts, /cg/camera/digital-camera-structure, /cg/image-properties/dynamic-range-and-gradation, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P015｜型不収束｜「〜ことになります／ことになる」で論理的帰結を述べる文末：同一記事内で「〜になります」「〜となります」と併用され、論理的帰結だけに割り当てられているとは読み取れない。出現が数式による導出を含む記事に偏り、医学系2記事では0件。｜再開: 論理的帰結と観察事実の書き分けが同一記事内で一貫する用例が3記事で確認できたら再開｜支持: /cg/basics/image-sampling, /cg/basics/image-quantization, /color-theory/color-rendering, /color-theory/xy-chromaticity-diagram, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P022｜一般技法｜変化・普及の文末「〜ようになりました／ようになります」：「〜ようになる」は状態変化を表す標準的な日本語文法。3記事中2記事のみ（もう1記事は不使用）で、いずれも時間経過そのものを主題とする記事でテーマ由来と切り分けられない。｜再開: 時間経過を主題としない記事で変化・普及の文末として選ばれる用例が3本確認できたら再開｜支持: /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-theory/age-related-vision-changes
- SQ-P025｜媒体規約｜中立的な語り口（問いかけ・勧誘・一人称・二人称・感嘆符・推量を用いない）：`syntax-guide.md` が「敬体で統一」「読者に語りかけすぎない落ち着いた説明文」を明文で規定しており、不使用は共通の文体規約の帰結として説明がつく。記事タイプ依存の変異でもあり、他タイプの概念解説には二人称・読者巻き込み・節頭の問いかけが現れる。｜再開: `syntax-guide.md` の語り口の規定が外れる、または規約に反して問いかけ・一人称を使う記事が3本出たら再開｜支持: /color-theory/ancient-european-colors, /color-theory/medieval-european-colors, /color-theory/modern-european-colors, /color-fields/interior-design-basics, /color-fields/interior-concept-history, /color-theory/color-temperature-and-light-color, /color-fields/landscape-color-approach, /color-fields/housing-color-design-process, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram
- SQ-P033｜一般技法｜並列列挙「〜たり、〜たりする」（3項目まで並べて上位語で受け直す形を含む）：日本語の基本的な並列文型で、症状・対処を箇条書きにせず1文に畳むこと自体も一般的な書き方。理論解説では0件という分布のみ。｜再開: 箇条書きにできる内容を意図的に1文へ畳む判断が、理論解説を含む3記事で確認できたら再開｜支持: /color-theory/color-vision-characteristics, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics
- SQ-P039｜型不収束｜外来語のカタカナ表記（長音符の有無・記事系統ごとの差）：長音の判断が実際に試される語が少なく、分野をまたぐ語では不統一（ユーザー／ユーザ）で規則化できない。実務上は新規記事の表記をその記事系統の既出表記に合わせる目安としてのみ用いる。｜再開: 記事系統ごとの長音表記が系統内で一貫することが3系統で確認できたら再開（表記の統一自体は `app/textlint/prh.yml` の管轄）｜支持: /color-fields/interior-concept-history, /color-fields/fashion-color-concepts, /cg/camera/digital-camera-structure
- SQ-P041｜一般技法｜例示を「〜といった＋上位語」「〜など」の名詞句へ畳んで閉じる：名詞句への例示の畳み込みは日本語の説明文で極めて一般的（`syntax-guide.md` も「たとえば」を標準の接続表現として認める）。「といった」は1記事に集中し他は0回と偏りが大きい。｜再開: 「といった」と「など」の選択に一貫した基準があることが3記事で確認できたら再開｜支持: /color-fields/interior-concept-history, /color-theory/elderly-vision-characteristics, /cg/transformation/perspective-and-parallel-projection
- SQ-P046｜一般技法｜可能表現の冗長形「〜ことができます」：日本語の解説文一般に共通し、同記事内に短縮形（表せる・行える）も混在して規則として切り出せない。可能性そのものが論点になる導出記事に偏る。｜再開: 冗長形と短縮形の選択に一貫した基準がある（同記事内で混在しない）ことが3記事で確認できたら再開｜支持: /color-fields/visual-design-and-color, /color-theory/xy-chromaticity-diagram, /color-theory/photometric-quantities, /color-fields/media-design-concepts
- SQ-P048｜既存ルール｜理由・要因を後置の独立文（「〜ためです。」「〜からです。」）または分裂文（「Bなのは、Aからです」）で文末の焦点に置く：結びの語形は本体 SQ-026 が担当し、その変種欄に「〜のは、〜ためです」一本化の記事と、理由を全部文中接続へ畳む記事の反例をすでに収録済み。配置・焦点の側は `writing-style.md` の守備範囲。｜再開: 本体 SQ-026 が改訂・廃止され、後置理由の語形が本体から失われたら再開｜支持: /color-theory/color-rendering, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram, /color-theory/photometric-quantities, /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P049｜型不収束｜「見えづらい」と「〜にくい」の意味別の書き分け仮説（知覚は「づらい」／機能・動作は「にくい」）：1記事内の読み取りにとどまり、著者が意識しているかは本文から確認できない。対象外の既存記事には「見えにくい」「わかりにくい」が実在して反例が多い。｜再開: 知覚と機能・動作の書き分けが反例なしに成立する記事が3本確認できたら再開｜支持: /color-theory/age-related-vision-changes, /color-theory/age-related-eye-diseases, /color-theory/elderly-vision-characteristics, /color-theory/xy-chromaticity-diagram
- SQ-P074｜媒体規約｜`:::Foldable` 内の掲載コードのコメントを常体で書き、「なぜその値・その処理か」を添える：本文ではなく生成物寄りのテキストで、`add-threejs-demo` スキルの生成物である可能性を排除できない。3記事で常体＋理由付けが共通するが、著者の起草か生成物かを完成記事の本文だけでは切り分けられない。｜再開: Git 差分で人手がコメントを書き換えた例が3記事で確認できたら、`refine-style` 側の観察として再開｜支持: /cg/transformation/perspective-and-parallel-projection, /cg/transformation/projective-transformation, /cg/transformation/projection-steps
- SQ-P085｜一般技法｜単調な依存関係を「〜ほど…なります」の比較構文で述べる：量の共変を表す「〜ほど」は日本語の説明文で広く使われる基本構文で著者固有性を主張できない（二項の対比・対句は本体 SQ-063・SQ-064）。｜再開: 単調な依存関係を述べる他の言い方を退けて「〜ほど」へ寄せる選択が示せたら再開｜支持: /color-theory/interference-and-diffraction, /color-theory/light-scattering, /cg/transformation/parallel-projection-types
- SQ-P091｜媒体規約｜:Anki（暗記対象）と :Mark（暗記対象ではない注目語）を役割で使い分け、初出で :Anki 定義した語の再登場・場合分けの見出し語・デモの操作対象ラベル・試験語ではない一般語を :Mark で受ける：`:Anki` と `:Mark` の分割自体が `syntax-guide.md` の記法規約（Mark ディレクティブを暗記用の Anki と強調専用の Mark に分割）で決まっており、媒体強制の記法と著者固有の運用を切り分けられない。｜再開: `syntax-guide.md` の Anki／Mark の分割規定が変わる、または規約では説明できない使い分け（同一語を文脈で切り替える等）が3記事で確認できたら再開｜支持: /cg/modeling/curve-surface-equations, /cg/modeling/quadratic-curve, /cg/modeling/bezier-curve-properties, /cg/systems/cg-software
- SQ-P092｜一般技法｜概念どうしの対応づけ（別記事・別表現・曲線側と曲面側での同じもの）を「〜にあたる」で結び、上下関係を作らない対等な相当関係として宣言する：「〜にあたる」は日本語の説明文で広く使われる相当表現で、著者固有の選択として一般技法と切り分けられない。SQ-034（上位概念への吸収）とは方向が違うが、方向の違い自体は語の一般的な用法の範囲。｜再開: 対等な相当関係を表す他の言い方（「〜に相当する」「〜と同じ」）を退けて「〜にあたる」へ寄せる選択が示せたら再開｜支持: /cg/modeling/curve-surface-equations, /cg/modeling/quadratic-curve, /cg/modeling/bezier-curve-surface, /cg/modeling/bezier-curve-properties
- SQ-P093｜型不収束｜「〜する必要はありません／要りません」で不要な操作を先に否定し、直後に「〜すればよい（だけです）」で足りる操作を言い切る対で最小手数を示す：反証で2記事は「不要性の否定」と「〜ばよい」が同一箇所で対になっておらず、片方だけの単独出現だと確認された。対の構造として成立するのは実質1記事で、支持3記事という件数は対になっていない出現を含む。十分性強調の側は本体 SQ-044 が担当。｜再開: 否定と十分性が同一箇所で対になる用例が3記事で確認できたら再開｜支持: /cg/modeling/curve-surface-equations, /cg/modeling/bezier-curve-surface, /cg/modeling/bezier-curve-properties
- SQ-P094｜一般技法｜式変形の結果を、項や辺を主語に立てた自動詞（残る・消える・打ち消し合う・効かなくなる・外れる）で述べる：数式の結果を項の自動詞で語るのは数学の解説文で広く使われる書き方で、一般技法と切り分けられない。SQ-039（操作側の誘導句）とは主語の置き方が逆、本体 SQ-062（〜てしまう）とは中立性の点で別だが、いずれも語の一般的な用法の範囲。｜再開: 自動詞の選択（残る・消える・打ち消し合う）に著者固有の偏りがあると示せたら再開｜支持: /cg/modeling/quadratic-curve, /cg/modeling/bezier-curve-surface, /cg/modeling/bezier-curve-properties
