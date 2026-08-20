# thinking-flow（棄却）

## このファイルの位置づけ

`thinking-flow.md`（思考フロー）の棄却層。保留プール（`pending/thinking-flow.md`）にあった思考・判断の観察のうち、**記事が増えても解けない理由**で再審査を打ち切ったものを移した記録である。

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

- TF-P001｜媒体規約｜空間関係を図に委ね読者に発見させる：操作可能な図（回転・クリック）はアプリの提供コンポーネントに依存するため、著者の判断か環境要因かを切り分けられない。図の配置順は WS-062、誘い掛けの語尾は SQ-072 の担当。｜再開: 共有コンポーネントを使わない図（静的SVG図版のみ）で空間関係を図に委ねる判断が3記事で確認できたら再開｜支持: /color-theory/pccs-color-system, /color-theory/munsell-color-system, /color-theory/color-wheel-and-color-solid
- TF-P002｜型不収束｜メタに目標・範囲・射程を提示する判断（リードでの宣言を含む）：支持記事の実体が「前記事の復習」「話題紹介」「対象概念の定義の書き換え」と別現象の寄せ集めで、1つのルールに収束しない。個々の型は本体 TF-020・TF-021・TF-040 が既に担当する。｜再開: メタ宣言として同型と言える用例が3記事以上そろったら、その型に絞って再提出する｜支持: /color-theory/color-three-attributes, /color-fields/landscape-color-approach, /color-fields/interior-design-basics, /color-fields/interior-concept-history, /cg/camera/digital-camera-structure, /color-theory/age-related-vision-changes, /color-theory/color-rendering
- TF-P013｜媒体規約｜習熟段階（grade）に応じて説明深度を層化する読者モデル：grade 割当はPCCS検定級という媒体の級構造に規定されており、著者固有の判断と切り分けられない。｜再開: 級構造から独立して説明深度を層化した記事（grade タグを持たない記事での層化）が3本出たら再開｜支持: /color-theory/light-components-and-reflectance, /color-theory/photoreceptor-types-and-distribution, /color-theory/opponent-color-response, /color-theory/color-roles, /color-theory/visual-clarity-and-visibility
- TF-P021｜型不収束｜定義より先に「その概念が必要になる場面・素朴な現象」を置く：概念解説5本中2本が定義先行の反例で拮抗し、色温度と光色も定義先行。起点の型としては本体 TF-001（「Aだけでは足りない」という不足の名指し）と競合する。｜再開: 定義先行の反例を上回る用例が集まり、TF-001 と区別できる起点の型として記述できたら再開｜支持: /color-theory/illuminance-and-lighting-design, /color-theory/photometric-and-radiometric-quantities, /color-theory/adjacent-color-influence
- TF-P033｜一般技法｜専門用語を必要になる直前で最小限だけ定義する（ジャストインタイムの用語補助、用語1つ＝1節の粒度を含む）：用語を初出位置で最小限だけ定義するのは技術文書一般の標準的な書き方で、Evidence 反証でも著者固有とは判断できないと判定された。短い節も内容上の必然で説明でき、同じ節ペアを級タグで説明する競合仮説もある。｜再開: 一般的な初出定義から外れる運用（意図的に定義を遅らせる・先出しする判断）が3記事で確認できたら再開｜支持: /color-fields/housing-color-design-process, /color-fields/landscape-color-approach, /color-theory/color-vision-characteristics
- TF-P045｜観点違い｜定義の二段構え（初出は括弧注や短い言い換えで流れを止めず、主役になる位置で単独に読める一文定義を再提示）：二度目の提示先がいずれも用語カード・小見出しという共有コンポーネントで、Evidence 反証で stylistic-quirks 側の運用習慣として扱う方が実態に近いと判定された。｜再開: stylistic-quirks 側で扱えないと判明したら、担当できない理由とともに再開｜支持: /color-theory/psychological-scaling-method, /color-theory/optical-illusions, /color-fields/color-universal-design
