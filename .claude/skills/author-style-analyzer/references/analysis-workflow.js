export const meta = {
  name: 'author-style-analysis',
  description: '著者の過去記事とGit履歴から文体ガイドを分析する（根拠モード／発見モード）',
  phases: [
    { title: '判定', detail: '【根拠モード】ルールID一覧と記事本文だけを渡し、どのルールを支持するかを判定する' },
    { title: '分析', detail: '【発見モード】4観点を独立したエージェントで分析し、構造化された特徴を返す' },
    { title: '反証', detail: '各観点の結果を反証的に検証する（観点ごとに独立して流す）' },
    { title: '統合', detail: '【発見モード】観点ごとにガイド本体・evidence・pending を差分Editで更新する' },
    { title: '境界レビュー', detail: '【発見モード】書き上がった4ファイルを読み、重複・配置の誤りを検出する' },
  ],
}

// ---------------------------------------------------------------------------
// このスクリプトは Workflow ツールから scriptPath で実行される正典ハーネス。
// teammate（Agent Teams / SendMessage）を一切使わず、決定論的な制御フローで
// サブエージェントを回す。アイドル待ちが存在しないためハングしない。
//
// ## 2つのモード
//
// | | 根拠モード（既定） | 発見モード（mode: 'discover'） |
// | --- | --- | --- |
// | 目的 | 記事が既存ルールを支持するかを記録する | ガイドそのものを見直す |
// | 書き込み | evidence のみ（スクリプトが機械生成） | 本体・evidence・pending の3層 |
// | ガイド本体 | エージェントに読ませない | 読んで差分更新する |
// | 境界レビュー | 実行しない | 統合の後段で実行する |
// | エージェント数 | 8体（Git履歴なしなら6体） | 10〜13体 |
//
// 根拠モードが安く済むのは、統合ステージを持たないからである。判定結果は構造化出力として
// メインセッションへ返し、`scripts/style-evidence-write.mjs` が evidence を機械生成する
// （Workflow スクリプトはファイルシステムへ触れないため、書き込みはこのスクリプトの外で起きる）。
// これは「ガイド本体を読ませない」を成立させるための設計でもある。`Edit` は同一会話で Read 済み
// のファイルしか編集できないので、エージェントに evidence を書かせるなら本体も読ませることになる。
//
// ## 進行制御
//
// 旧版は「4分析が全部終わる→反証が全部終わる→統合」の3段バリアだった。4観点を揃える必要が
// あるのは境界レビューだけなので、これを統合の後段へ移し、2〜4は観点ごとのパイプラインとして
// 流す。壁時計が「各段の最遅の合計」から「最も遅い観点の合計」へ縮む。
// 代償として、重複・配置誤りの解決は「書く前の事前回避」から「書いた後の事後検出」に変わる。
// 検出結果は報告し、修正は次のラウンドまたは個別の指示で行う。
//
// ## manifest（メインセッションが前処理で組み立てて args として渡す）
//
// args = {
//   mode: 'evidence' | 'discover',            // 既定は 'evidence'（根拠モード）
//   isUpdate: boolean,                        // 既存ガイドの差分更新か新規作成か（発見モードのみ）
//   guidesDir: string,                        // 例: 'writing-guides'
//   ruleIndex: string,                        // ルールID一覧のテキスト（style-rule-ids.mjs --list の出力）
//                                             // 根拠モードの判定エージェントへ渡す唯一のガイド情報。約1万字。
//   targets: [{ path, slug, title, type, commit, reanalysis }],
//                                             // 分析対象記事。slug は evidence のキー（例 '/color-theory/xxx'）、
//                                             // commit は分析時点の記事コミット短縮SHA（git log -1 --format=%h -- <path>）
//   excluded: [string],                       // 除外した記事（任意）
//   gitAnalyzable: [{ title, draftCommit, editCommits: [string] }], // refine-style 用。空なら refine-style 系列を起動しない
//   promotionCandidates: [{ id, key, reason, slugs }],  // pending の昇格候補（発見モードのみ。style-pending-promote.mjs --json）
//   supportCounts: { '<ID>': number },        // ルールごとの支持記事数（発見モードのみ。style-evidence-tally.mjs --json）
//   existingGuides: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle }, // ガイド本体の出力先パス
//   pendingGuides: { ... },                   // 保留プールのパス（任意。省略時は guidesDir/pending/ から導出）
//   evidenceDirs: { ... },                    // 根拠ディレクトリのパス（任意。省略時は guidesDir/evidence/<観点>/ から導出）
//   refs: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle,
//           outputContract, contractByAspect: { ... } },  // 参照プロンプトのパス
// }
// ---------------------------------------------------------------------------

const m = typeof args === 'string' ? JSON.parse(args) : args
const refs = m.refs
const MODE = m.mode === 'discover' ? 'discover' : 'evidence'
const AGENT = 'general-purpose' // Read/Write を確実に持たせる
const CAMEL = {
  'thinking-flow': 'thinkingFlow',
  'writing-style': 'writingStyle',
  'stylistic-quirks': 'stylisticQuirks',
  'refine-style': 'refineStyle',
}
const PREFIX = {
  'thinking-flow': 'TF',
  'writing-style': 'WS',
  'stylistic-quirks': 'SQ',
  'refine-style': 'RS',
}

// ---------------------------------------------------------------------------
// スキーマ
// ---------------------------------------------------------------------------

// 【根拠モード】記事ごとに「どのルールIDを支持するか／反例か」を返す。特徴の抽出はしない。
const JUDGMENT_SCHEMA = {
  type: 'object',
  properties: {
    aspect: { type: 'string' },
    articles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          supports: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' }, // 例 'WS-012'。ルールID一覧に無いIDを作らない
                location: { type: 'string' }, // 本文中の該当箇所を短く。refine-style は 修正前→修正後 のコミット対
              },
              required: ['id'],
            },
          },
          counterexamples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                note: { type: 'string' }, // そのルールが働かなかった箇所、または根拠に数えない理由
              },
              required: ['id', 'note'],
            },
          },
          // 既存ルールのどれにも当てはまらない特徴。pending へ1行で積む材料になる。
          newFeatures: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                claim: { type: 'string' },
                location: { type: 'string' },
                whyNotExisting: { type: 'string' }, // 既存のどのIDとも違うと判断した理由
              },
              required: ['claim'],
            },
          },
        },
        required: ['slug', 'supports'],
      },
    },
  },
  required: ['aspect', 'articles'],
}

// 【発見モード】現行 Stage1 と同じ深さの特徴抽出。
const FEATURE_SCHEMA = {
  type: 'object',
  properties: {
    analysisType: { type: 'string' },
    features: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          existingRuleId: { type: 'string' }, // 既存ルールの補強なら そのID。新規なら空
          claim: { type: 'string' },
          category: { type: 'string' },
          evidenceArticles: { type: 'array', items: { type: 'string' } },
          evidenceLocations: { type: 'string' },
          // 根拠インデックスへ登録するための、記事単位に正規化した根拠。
          evidenceBySlug: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                location: { type: 'string' },
                note: { type: 'string' },
              },
              required: ['slug'],
            },
          },
          counterexamples: { type: 'string' },
          // ルールを実行するために必要な操作的制約（頻度・分量の上限、適用範囲の線引き、
          // 記事タイプによる出入り）。根拠の散文に埋めず、ここへ分けて出す。
          operationalConstraints: { type: 'array', items: { type: 'string' } },
          appliesTypes: { type: 'array', items: { type: 'string' } },
          notAppliesConditions: { type: 'string' },
          confidence: { type: 'string', enum: ['強い傾向', '条件付きの傾向', '弱い傾向'] },
          factOrInference: {
            type: 'string',
            enum: ['直接確認できる事実', '強い推測', '限定的な推測', '検証不足の仮説'],
          },
        },
        required: ['name', 'claim', 'evidenceArticles', 'confidence', 'factOrInference'],
      },
    },
    heldFeatures: { type: 'array', items: { type: 'string' } },
    handoffFeatures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          feature: { type: 'string' },
          suggestedOwner: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },
  required: ['analysisType', 'features'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          featureName: { type: 'string' },
          judgment: {
            type: 'string',
            enum: ['根拠十分', '条件を限定すれば妥当', '根拠不足', '反例が多い', '著者固有とは判断できない', '追加調査が必要'],
          },
          note: { type: 'string' },
          suggestedPlacement: { type: 'string' },
        },
        required: ['featureName', 'judgment'],
      },
    },
  },
  required: ['verdicts'],
}

const BOUNDARY_SCHEMA = {
  type: 'object',
  properties: {
    duplicates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rules: { type: 'array', items: { type: 'string' } }, // 重複しているルールID
          files: { type: 'array', items: { type: 'string' } },
          resolution: { type: 'string' },
        },
      },
    },
    misplacements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ruleId: { type: 'string' },
          currentFile: { type: 'string' },
          suggestedFile: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
    hierarchySplits: {
      type: 'array',
      items: {
        type: 'object',
        properties: { topLevel: { type: 'string' }, note: { type: 'string' } },
      },
    },
  },
}

const FILE_REPORT_SCHEMA = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    action: { type: 'string', enum: ['created', 'updated', 'unchanged'] },
    changes: { type: 'array', items: { type: 'string' } },
    newRules: { type: 'array', items: { type: 'string' } }, // 追加したルール名（IDは採番スクリプトが振る）
    heldItems: { type: 'array', items: { type: 'string' } },
    promoted: { type: 'array', items: { type: 'string' } }, // pending → 本体へ昇格した項目
    pendingPath: { type: 'string' },
    pendingAction: { type: 'string', enum: ['created', 'updated', 'unchanged'] },
    evidenceDir: { type: 'string' },
    evidenceFiles: { type: 'array', items: { type: 'string' } }, // 追加/書き直した記事ファイル（'/slug (sha)' 形式）
    notes: { type: 'string' },
  },
  required: ['path', 'action'],
}

// ---------------------------------------------------------------------------
// プロンプトの共通部品
// ---------------------------------------------------------------------------

// output-contract-analysis.md（分析・反証段階の判断基準の正典）を要約したもの。分析・反証
// エージェントはこれに従い、契約ファイルの全文 Read は行わない。
const ANALYSIS_CRITERIA = [
  '## 分析の品質基準（output-contract-analysis.md の要約。これに従い、契約ファイルの全文 Read は不要）',
  '- 根拠：各特徴は複数記事で確認する。1記事だけの特徴は「弱い傾向」か heldFeatures に回す。引用箇所は主張を実際に支えるものにする。',
  '- 著者固有性：一般的な文章術・技術記事に共通する書き方・記事テーマ固有の専門用語は、著者の癖として採用しない。他の書き手にも当てはまる特徴は除外する。',
  '- 確度：強い傾向＝複数記事・複数タイプで一貫／条件付きの傾向＝特定タイプや文脈に限る／弱い傾向＝少数例または反例あり。',
  '- 事実と推測：本文から直接読み取れる事実か、リバースエンジニアリングした推測かを区別する。推測は推測と明記し、断定しない。',
  '- 反例と適用条件：反例を隠さず記録し、適用しない記事タイプ・条件を必ず添える。記事タイプによる差を一律に一般化しない。',
  '- 用例：本文の転載は最小限にし、特徴が確認できる範囲に切り詰める。',
  '- 根拠の正規化：根拠は記事単位に分けて evidenceBySlug へ出す（slug は下記の分析対象一覧の値をそのまま使う）。「シリーズ10本すべて」のような集約表現にせず、1記事1エントリにする。',
  '- 操作的制約の分離：頻度・分量の上限（「1段落に2回以上重ねない」等）、適用範囲の線引き、記事タイプによる出入りは、根拠の説明文に混ぜず operationalConstraints へ出す。これは執筆側ガイドのルール欄・適用条件欄へ入る情報で、根拠側へ埋めると失われる。',
].join('\n')

// output-contract.md（統合段階の共通規約の正典）を要約したもの。分析側の ANALYSIS_CRITERIA と
// 同じ手法を統合側へ広げる。統合エージェントは、これと担当観点の契約ファイル1本を既定の入力とし、
// 判断がつかない箇所に出会ったときだけ正典の該当節を Read する。4体が毎回全文を読むと約5.5万字。
const SYNTHESIS_CONTRACT = [
  '## 出力契約の要約（output-contract.md の要約。これに従い、正典の全文 Read は不要。判断がつかない節だけ読む）',
  '',
  '### 成果物の3層（この分離が契約の中心）',
  '- ガイド本体（writer が読む）：実行可能なルール・適用条件・確度ラベルだけ。**量はルール数に比例させ、記事数に比例させない。**',
  '- evidence/<観点>/<slug>.md（analyzer 専用）：採用済みルールの根拠。記事1本1ファイル。',
  '- pending/<観点>.md（analyzer 専用）：未採用の観察。1項目1行。',
  '',
  '### ルールの基本形式',
  '`### [WS-012] ルール名` → `- 確度：` / `- 対象：` / `- ルール：` / `- 適用する状況：` / `- 適用しない状況：` / `- 使用量：` / `- 変種：` / `- 注意：` / `- 関連ルール：`',
  '- `確度` は先頭に置き、`強い傾向` / `条件付きの傾向` / `弱い傾向` のラベル1語のみ。判定理由・記事数・シリーズ名・検証状態を書かない。',
  '- `根拠` 欄・`反例・例外` 欄は置かない。一般化できる反例は `適用しない状況` へ、記事固有の反例は evidence の `※` 注記へ。',
  '- `使用量`（頻度・分量の上限）／`変種`（条件による現れ方の違い）／`注意`（運用上の注意）は、ルールを実行するための操作的制約の受け皿。根拠の散文へ埋めない。',
  '- 少なくとも 確度・ルール・適用条件・適用しない条件 は含める。意味のある情報がない項目は省略する。`使用目的` / `使用されやすい文脈` / `構成上の効果` / `前後の要素` はルール欄の言い換えになるなら書かない。',
  '',
  '### ルールID',
  '- **新しいルールに自分でIDを振らない。** 見出しは `### ルール名` のまま書き、採番は後処理の `scripts/style-rule-ids.mjs --write` が行う。手で番号を決めると重複と飛びが出る。',
  '- 既存ルールの見出しにある `[ID]` は消さない。ルール名を改名しても ID は据え置く。',
  '- ルールを廃止したら ID は欠番にする（再利用しない）。',
  '- 本文の `関連ルール` 参照は名前で書く（`→ writing-style.md「◯◯」`）。writer が読むファイルなので、ID だけでは人間が辿れない。',
  '',
  '### 根拠インデックス（evidence/<観点>/<slug>.md）',
  '```',
  '分析時点: `d8bd3563`',
  '記事タイプ: 概念解説',
  '',
  '- WS-004（末尾を結果要約「なめらかに見えるようになります」で閉じる）',
  '  ※ WS-032：限界提示を伴わず並列的に紹介され、限界駆動が弱い',
  '```',
  '- **`- <ルールID>（該当箇所）` の行だけが支持。ルール名は書かない**（短縮形で書かれて機械照合が壊れたのが ID を導入した理由）。',
  '- `※` 行は反例・除外の注記で、支持には数えない。直前の支持行に紐づける。',
  '- `分析時点` と `記事タイプ` は下記で渡す値をそのまま使う。自分で git を叩いて推測しない。',
  '- 記事本文を長く転載しない。差分の生ログは書かない。',
  '- 再分析の記事は、**その記事のファイルだけ**を書き直す。他の記事のファイルには触らない。',
  '- 本体に存在しないIDを evidence へ登録しない（保留の根拠を evidence へ書かない）。',
  '',
  '### pending の形式（1項目1行）',
  '`- SQ-P045｜支持2記事のみ・媒体機能への依存が大きい｜支持: /color-theory/color-area-proportion, /color-theory/hue-tone-difference`',
  '- 全角縦棒で「保留ID｜保留の理由｜支持記事」の3欄。支持記事を機械的に読めることが昇格判定を機械化できる条件。**散文で書かない。**',
  '- 保留IDは `<観点略号>-P<連番3桁>`。既存の最大値の次から振る。',
  '- 先頭の「このファイルの位置づけ」注記は必ず残す。',
  '',
  '### 昇格・追記・棄却',
  '- **昇格**：支持3記事以上が必要条件。ただし3記事あっても単一シリーズに閉じている・一般技法と切り分けられないなら昇格させない。昇格したら本体へルールを加え、pending の当該項目を削除し、evidence の該当記事ファイルへ登録する。',
  '- **追記**：heldFeatures や反証で「根拠不足／反例が多い／著者固有とは判断できない」とされた特徴は、本体ではなく pending へ1行で足す。',
  '- **棄却**：根拠の誤読が判明した保留は pending から削除する。',
  '',
  '### 禁止事項（違反が最も起きやすいもの）',
  '- ガイド本体へ根拠（記事名・シリーズ名・出現件数・本文の引用・コミット）を書く。',
  '- 「ガイドの目的」節や節の前書きへ、分析した記事・シリーズの名称・本数・分析を重ねた経緯を書く。',
  '- 既存ガイドを理由なく全面的に書き直す（全文 Write ではなく差分 Edit を使う）。',
  '- 分析ログや Agent 間の議論を成果物へ含める。',
  '- 頻出表現を機械的に挿入する指示にする／すべての記事を同じ構成へ当てはめる。',
].join('\n')

// 全アナリスト共通の分析対象コンテキスト
const targetLines = m.targets.map(
  (t) =>
    `- ${t.title} [${t.type || '種別不明'}] : ${t.path}` +
    `\n  slug=${t.slug || '(未指定)'} / 分析時点=${t.commit || '(未指定)'}${t.reanalysis ? ' / 再分析（既存ファイルを書き直す）' : ''}`,
)
const excludedBlock =
  m.excluded && m.excluded.length
    ? `\n## 除外記事（分析対象外）\n${m.excluded.map((e) => `- ${e}`).join('\n')}`
    : ''
const gitAnalyzable = m.gitAnalyzable && m.gitAnalyzable.length ? m.gitAnalyzable : []
const gitBlock = gitAnalyzable.length
  ? `\n## Git履歴を利用できる記事（refine-style 用）\n${gitAnalyzable
      .map((g) => `- ${g.title} : 草稿コミット=${g.draftCommit} / 編集コミット=${g.editCommits.join(', ')}`)
      .join('\n')}`
  : ''
const targetBlock = `## 分析対象記事（絶対パス）\n${targetLines.join('\n')}${excludedBlock}${gitBlock}`

const ASPECTS = [
  {
    key: 'thinking-flow',
    role: 'Thinking Flow Analyst',
    ref: refs.thinkingFlow,
    scope: '完成記事から復元する、著者の執筆時の問題認識・判断・説明戦略・読者モデル・思考の遷移',
    out: '担当外：語尾や頻出表現、単なる見出し構成、人手による修正差分',
  },
  {
    key: 'writing-style',
    role: 'Writing Structure Analyst',
    ref: refs.writingStyle,
    scope: '記事・セクション・段落・文の構成上の傾向、情報の配置順、定義/例/理由/注意点の配置、記事タイプによる構成変化',
    out: '担当外：執筆中の内的判断の推測、頻出フレーズの収集、修正履歴の分析',
  },
  {
    key: 'stylistic-quirks',
    role: 'Stylistic Quirks Analyst',
    ref: refs.stylisticQuirks,
    scope: '語彙・言い回し・文末・接続表現・記号や表記など、文やフレーズのレベルに現れる癖と、その使用文脈',
    out: '担当外：記事全体の構成、思考プロセス、Git差分による修正傾向',
  },
  {
    key: 'refine-style',
    role: 'Revision Diff Analyst',
    ref: refs.refineStyle,
    git: true,
    scope: 'AI草稿と人手編集の Git 差分から確認できる修正傾向（追加/削除/並べ替え/書き換え、AIらしい文章の除去）',
    out: '担当外：完成記事だけから推測した特徴、単なる単語頻度、コミット履歴で確認できない意図の断定',
  },
]

// gitAnalyzable が空の回は Revision Diff Analyst の系列を起動しない。旧版は Git 履歴が1本も
// 無くても起動し、「確認できないと明記する」だけの仕事をさせていた。
const activeAspects = ASPECTS.filter((a) => !a.git || gitAnalyzable.length > 0)
const skipped = ASPECTS.filter((a) => !activeAspects.includes(a)).map((a) => a.key)
if (skipped.length) {
  log(`Git 履歴（AI草稿コミット）が無いため ${skipped.join(', ')} は対象外にします`)
}

const pendingOf = (key) =>
  (m.pendingGuides && m.pendingGuides[CAMEL[key]]) ||
  `${m.guidesDir || 'writing-guides'}/pending/${key}.md`
const evidenceDirOf = (key) =>
  (m.evidenceDirs && m.evidenceDirs[CAMEL[key]]) ||
  `${m.guidesDir || 'writing-guides'}/evidence/${key}/`
const guideOf = (key) => m.existingGuides[CAMEL[key]]
const contractOf = (key) =>
  (refs.contractByAspect && refs.contractByAspect[CAMEL[key]]) ||
  `.claude/skills/author-style-analyzer/references/output-contract-${key}.md`

// 記事ブロックへ書く slug と分析時点 SHA。4観点で同じ値を使うため manifest 由来をそのまま渡す。
const evidenceTargets = m.targets.map((t) => ({
  slug: t.slug,
  commit: t.commit,
  type: t.type || '未記録',
  reanalysis: !!t.reanalysis,
  title: t.title,
}))

// ===========================================================================
// 根拠モード：判定 → 反証。統合を持たない（evidence はスクリプトが機械生成する）
// ===========================================================================

if (MODE === 'evidence') {
  if (!m.targets.length) {
    return { error: '根拠モードには分析対象の記事が必要です（記事指定なしの実行は発見モードのみ）。', mode: MODE }
  }
  log(`根拠モード：対象記事 ${m.targets.length} 本 / ${activeAspects.length} 観点を判定`)

  // 観点ごとに 判定 → 反証 を独立して流す（バリアを張らない）。
  const results = await pipeline(
    activeAspects,
    (a) =>
      agent(
        [
          `あなたは ${a.role} です。担当観点は「${a.scope}」。${a.out}`,
          '**あなたの仕事は、新しい特徴を発見することではありません。** 既存のルール一覧を渡すので、対象記事のそれぞれについて「どのルールを支持するか／どのルールの反例になるか」を判定してください。',
          '**ガイド本体・evidence・pending のファイルは読みません（読む必要がありません）。** 下記のルールID一覧が、あなたに与えられるガイドの情報すべてです。ルール名から意図が読み取れない項目は、無理に判定せず飛ばしてください。',
          `判定の観点は ${a.ref} を Read して把握します。品質基準は下記「分析の品質基準」に従います。`,
          ANALYSIS_CRITERIA,
          a.git
            ? 'refine-style の判定は Git 差分に限定します。下記「Git履歴を利用できる記事」のコミットを git show / git diff で確認し、AI草稿から人手編集への変更を見ます。誤字・メタデータ・リンク・整形・技術的訂正・無関係なリファクタは文体修正から分離します。location には修正前後のコミット対（`16758df→78ba48c：変更の要約`）を書きます。'
            : '完成記事の本文のみを根拠にし、Git 差分は使いません。location には本文中の該当箇所を短く書きます。',
          targetBlock,
          `## ${a.key} のルールID一覧\n\n${m.ruleIndex}`,
          '**supports に載せる id は、必ず上記一覧に存在するIDです。** 一覧に無いIDを作らないでください（存在しないIDは後処理で弾かれ、その記事の記帳が失敗します）。',
          '支持は「その記事にそのルールが実際に現れている」ことを確認できた場合だけ載せます。ルール名から想像して当てはめないでください。過剰な当てはめは次段の反証で弾かれます。',
          '既存ルールのどれにも当てはまらない特徴を見つけたら、supports ではなく newFeatures に入れ、既存のどのIDとも違うと判断した理由を whyNotExisting に書きます。',
          'あなたの最終出力は StructuredOutput のスキーマに従う JSON です。人間向けメッセージではありません。',
        ]
          .filter(Boolean)
          .join('\n\n'),
        { label: `judge:${a.key}`, phase: '判定', agentType: AGENT, effort: 'high', schema: JUDGMENT_SCHEMA },
      ),
    (judgment, a) =>
      judgment
        ? agent(
            [
              `あなたは Evidence Reviewer です。${a.key} の判定結果を反証的に検証し、**過剰な当てはめを弾きます。**`,
              '各支持について確認する：その記事に本当にその現象が現れているか／location が主張を実際に支えるか／ルール名から想像で当てはめただけではないか／記事テーマ固有の事情ではないか／一般的な文章術と区別できているか。',
              '疑わしい場合は棄却寄りに判定します。judgment は 根拠十分／条件を限定すれば妥当／根拠不足／反例が多い／著者固有とは判断できない／追加調査が必要 から選びます。featureName にはルールID（`WS-012`）と slug を `WS-012 @ /cg/basics/anti-aliasing` の形で書いてください。',
              '必要なら対象記事を Read で再確認します。新しいルールは提案しません。',
              ANALYSIS_CRITERIA,
              targetBlock,
              `検証対象の判定結果（${a.key}）:\n\n${JSON.stringify(judgment, null, 2)}`,
            ].join('\n\n'),
            { label: `verify:${a.key}`, phase: '反証', agentType: AGENT, model: 'sonnet', effort: 'medium', schema: VERDICT_SCHEMA },
          ).then((verdict) => ({ aspect: a.key, judgment, verdict }))
        : { aspect: a.key, judgment: null, verdict: null },
  )

  const ok = results.filter((r) => r && r.judgment)
  const failed = activeAspects.map((a) => a.key).filter((k) => !ok.some((r) => r.aspect === k))
  if (failed.length) log(`判定に失敗した観点: ${failed.join(', ')}（この観点の evidence は生成しません）`)
  if (!ok.length) {
    return { error: '判定がすべて失敗しました。対象記事のパスや権限を確認してください。', mode: MODE }
  }
  log(`根拠モード完了：${ok.length}/${activeAspects.length} 観点`)

  // メインセッションが scripts/style-evidence-write.mjs へそのまま渡せる形で返す。
  // Workflow スクリプトはファイルシステムへ触れないため、書き込みはここでは行わない。
  const articles = {}
  for (const t of evidenceTargets) articles[t.slug] = { commit: t.commit, type: t.type }

  return {
    mode: MODE,
    articles,
    judgments: ok.map((r) => ({
      aspect: r.aspect,
      articles: (r.judgment.articles || []).map((art) => ({
        slug: art.slug,
        supports: art.supports || [],
        counterexamples: art.counterexamples || [],
      })),
    })),
    verdicts: ok.map((r) => ({ aspect: r.aspect, verdicts: (r.verdict && r.verdict.verdicts) || [] })),
    newFeatures: ok.flatMap((r) =>
      (r.judgment.articles || []).flatMap((art) =>
        (art.newFeatures || []).map((f) => ({ aspect: r.aspect, slug: art.slug, ...f })),
      ),
    ),
    skippedAspects: skipped,
    failedAspects: failed,
    nextSteps: [
      'node scripts/style-evidence-write.mjs <この戻り値のJSON> --write',
      `node scripts/style-evidence-tally.mjs --round ${m.targets.map((t) => t.slug).join(',')}`,
      'node scripts/style-pending-promote.mjs',
    ],
  }
}

// ===========================================================================
// 発見モード：分析 → 反証 → 統合（観点ごとのパイプライン）→ 境界レビュー（後段）
// ===========================================================================

const stocktakeOnly = m.targets.length === 0
if (stocktakeOnly) {
  log('発見モード（棚卸しのみ）：記事を読まず、保留の昇格候補と支持記事数の集計だけを材料にします')
}

const promotionBlock = (key) => {
  const all = m.promotionCandidates || []
  const mine = all.filter((c) => c.key === key || (c.id || '').startsWith(`${PREFIX[key]}-P`))
  return mine.length
    ? `## 昇格候補（${key}。支持3記事以上。メインセッションが ${pendingOf(key)} から抽出済み）\n\n${JSON.stringify(mine, null, 2)}\n\n件数の閾値は必要条件にすぎません。単一シリーズに閉じている・一般技法と切り分けられない候補は昇格させず、pending に残してください。`
    : `## 昇格候補（${key}）\n\n- なし（メインセッションの抽出結果）。**${pendingOf(key)} の全文を読んで候補を探し直す必要はありません。**`
}

const supportBlock = (key) => {
  const counts = m.supportCounts || {}
  const mine = Object.entries(counts).filter(([id]) => id.startsWith(`${PREFIX[key]}-`))
  return mine.length
    ? `## ルールごとの支持記事数（${key}。${evidenceDirOf(key)} を集計した導出値）\n\n${mine
        .map(([id, n]) => `- ${id}: ${n}記事`)
        .join('\n')}\n\n確度ラベルを見直すときはこの値を使います。**支持記事数を数えるために ${evidenceDirOf(key)} を読み直す必要はありません。**`
    : ''
}

// ---- 分析 → 反証 → 統合 を観点ごとに流す（4観点を揃えるのは境界レビューだけ）----

const perAspect = await pipeline(
  activeAspects,
  // 1. 分析
  (a) =>
    stocktakeOnly
      ? { analysisType: a.key, features: [], heldFeatures: [] }
      : agent(
          [
            `あなたは ${a.role} です。他の分析結果を見ず、次の観点だけを独立して分析します：${a.scope}。`,
            a.out,
            `分析手順は ${a.ref} を必ず Read して厳守します。出力の品質基準は下記「分析の品質基準」に従い、output-contract 全文の Read は不要です（執筆側の記述形式は最終Markdownを書く統合段階でのみ使います）。`,
            ANALYSIS_CRITERIA,
            a.git
              ? 'refine-style の根拠は Git 差分に限定します。下記「Git履歴を利用できる記事」のコミットを git show / git diff で確認し、AI草稿から人手編集への変更を分析します。誤字・メタデータ・リンク・整形・技術的訂正・無関係なリファクタは文体修正から分離します。'
              : '完成記事の本文のみを根拠にし、Git 差分は使いません。',
            targetBlock,
            `## ${a.key} の既存ルールID一覧\n\n${m.ruleIndex}`,
            '既存ルールの補強にあたる特徴は existingRuleId にそのIDを入れます（新しいルールとして重複させないため）。既存のどれとも違う特徴は existingRuleId を空にします。',
            '対象記事ファイルを Read で読み、著者固有の特徴を抽出します。一般的な文章術・記事テーマ固有の専門用語・単一記事だけの一般化・AI草稿由来の表現は、著者の特徴として採用しません。記事タイプによる違いを無視して一律に一般化しません。',
            '各特徴には 根拠記事（複数） / 確度（強い傾向・条件付きの傾向・弱い傾向） / 事実か推測か / 反例 / 適用しない条件 を付けます。担当外の特徴を見つけた場合は features に入れず handoffFeatures に記録します。確信が持てない特徴は heldFeatures に回します。',
            '根拠は evidenceBySlug に記事単位で分けて出します（slug は上記一覧の値をそのまま使い、location に該当箇所を短く、その記事で反例・除外があれば note に書く）。また、ルールを実行するために必要な操作的制約（頻度・分量の上限、適用範囲の線引き、記事タイプによる出入り）は operationalConstraints に分けて出します。この2つは統合段階で別のファイルへ振り分けられるため、混ぜて1つの散文にしないでください。',
            'あなたの最終出力は StructuredOutput のスキーマに従う JSON です。人間向けメッセージではありません。',
          ]
            .filter(Boolean)
            .join('\n\n'),
          { label: `analyze:${a.key}`, phase: '分析', agentType: AGENT, effort: 'high', schema: FEATURE_SCHEMA },
        ),
  // 2. 反証
  (analysis, a) =>
    !analysis || !(analysis.features || []).length
      ? { aspect: a.key, analysis, verdict: null }
      : agent(
          [
            `あなたは Evidence Reviewer です。次の分析（${a.key}）の各特徴を反証的に検証します。新しいルールは提案せず、既存の主張の根拠だけを検証します。`,
            '各特徴について確認する：根拠記事が複数あるか／同一シリーズ・同一時期に偏っていないか／引用箇所が主張を実際に支えるか／記事テーマ固有の事情ではないか／反例となる記事はないか／別の説明で同じ現象を説明できないか／一般的な文章術ではなく著者固有か。',
            '疑わしい場合は棄却寄りに判定します。judgment は 根拠十分／条件を限定すれば妥当／根拠不足／反例が多い／著者固有とは判断できない／追加調査が必要 から選びます。',
            '品質基準は下記「分析の品質基準」に従います（output-contract 全文の Read は不要）。必要なら対象記事を Read で再確認します。',
            ANALYSIS_CRITERIA,
            targetBlock,
            `検証対象の特徴一覧（${a.key}）:\n\n${JSON.stringify(analysis.features, null, 2)}`,
          ].join('\n\n'),
          { label: `verify:${a.key}`, phase: '反証', agentType: AGENT, model: 'sonnet', effort: 'medium', schema: VERDICT_SCHEMA },
        ).then((verdict) => ({ aspect: a.key, analysis, verdict })),
  // 3. 統合（自観点の3層だけを更新する）
  (prev, a) =>
    agent(
      [
        `あなたは Synthesis Editor（担当観点：${a.key}）です。この観点の3層、ガイド本体 ${guideOf(a.key)}・根拠 ${evidenceDirOf(a.key)}・保留プール ${pendingOf(a.key)} だけを${m.isUpdate ? '差分更新' : '作成/更新'}します。**他観点のファイルには絶対に触れません。**`,
        m.isUpdate
          ? `まず ${guideOf(a.key)}（本体）と ${pendingOf(a.key)}（保留プール）を Read し、有効な既存記述を保持します。変わる箇所だけを Edit で差分更新してください（全文を Write で書き直さない／既存内容の破棄・全面的な書き直しは禁止）。根拠は記事1本1ファイルなので、**触る記事のファイルだけ**を読み書きします（${evidenceDirOf(a.key)} 配下を全部読まないでください）。`
          : `${m.guidesDir || 'writing-guides'}/ に無ければ作成して ${guideOf(a.key)} を新規に Write します。保留プール ${pendingOf(a.key)} は、既にあれば Read して差分更新し、無ければ位置づけの注記（analyzer 専用／writer は読まない旨）を先頭に付けて Write します。根拠は ${evidenceDirOf(a.key)}<slug>.md へ記事単位で Write します。`,
        SYNTHESIS_CONTRACT,
        `観点固有の規約（扱う対象・追加できる項目・必須要素・根拠の書き方）は ${contractOf(a.key)} を Read して従います。他観点の契約ファイルは読みません。`,
        `今回の記事（slug・分析時点SHA・記事タイプは下記の値をそのまま使い、自分で git を叩いて推測しません）。\`reanalysis: true\` の記事は既存ファイルがあるので、**そのファイルを丸ごと書き直し**、\`分析時点\` を新しい SHA へ更新します（他の記事のファイルには触りません）。書き直しで支持記事が減ったルールは、残りの記事数・記事タイプの幅を数え直して確度ラベルを再評価し、支持記事が0になったルールは廃止候補として扱います:\n\n${JSON.stringify(evidenceTargets, null, 2)}`,
        promotionBlock(a.key),
        supportBlock(a.key),
        `本体に反映するのは ${a.key} に属する特徴だけです。担当外の特徴は handoffFeatures に回っているので、あなたは扱いません（4観点を横断した重複・配置の検証は、あなたの書き込みが終わったあとに Boundary Reviewer が行います）。同じ文を他ファイルと重複させません。`,
        prev && prev.analysis
          ? `今回の分析結果（${a.key}。held＝保留候補を含む）:\n\n${JSON.stringify(
              { features: prev.analysis.features || [], held: prev.analysis.heldFeatures || [] },
              null,
              2,
            )}`
          : `今回は記事の分析を行っていません（棚卸しのみ）。昇格候補と支持記事数の集計だけを材料に、確度ラベルの見直しと保留の整理を行ってください。新しいルールを根拠なく足さないでください。`,
        prev && prev.verdict
          ? `反証の判定（${a.key}）:\n\n${JSON.stringify(prev.verdict.verdicts || [], null, 2)}`
          : '',
        `書き込み後、本体に \`根拠\` 欄・\`反例・例外\` 欄が無いこと、\`確度\` 欄がラベル1語のみであること、記事名・シリーズ名・件数が本体に残っていないことを自分で grep して確認します。`,
        `本体 ${guideOf(a.key)}・根拠 ${evidenceDirOf(a.key)}・保留プール ${pendingOf(a.key)} を実際に書き込み、path・action（本体）／evidenceDir・evidenceFiles（'/slug (sha)' 形式で追加・書き直したファイル）／pendingPath・pendingAction／主な変更点（changes）／追加したルール名（newRules）／昇格した項目（promoted）／新たに保留にした項目（heldItems）を報告します。`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      { label: `synthesize:${a.key}`, phase: '統合', agentType: AGENT, effort: 'high', schema: FILE_REPORT_SCHEMA },
    ),
)

const doneFiles = perAspect.filter(Boolean)
if (doneFiles.length < activeAspects.length) {
  log(`統合：${doneFiles.length}/${activeAspects.length} 観点が完了（残りは失敗の可能性。後処理でファイルを要確認）`)
} else {
  log(`統合完了：${doneFiles.length}観点を差分更新`)
}

// ---- 境界レビュー（後段・4観点を揃える唯一のステージ）----
// 旧版は統合の前に置いていたが、それだと4分析が揃うまで統合を待つバリアが必要になる。
// 書き上がったファイルを読ませる形にすれば、統合を観点ごとに流せる。
phase('境界レビュー')

const boundary = doneFiles.length
  ? await agent(
      [
        'あなたは Boundary Reviewer です。**書き上がったガイド本体4ファイルを読み**、成果物間の責務境界を検証します。あなたは検出だけを行い、ファイルを修正しません。',
        `対象ファイル:\n${ASPECTS.map((a) => `- ${a.key}: ${guideOf(a.key)}`).join('\n')}`,
        '検出する：同一特徴の重複（別ファイルに同じ内容のルールが立っている）／配置先の誤り（thinking-flow・writing-style・stylistic-quirks・refine-style のどれに属すべきか）／思考・構成・表現・修正の混同／上位ルールと下位表現の未分離／因果と相関の混同。',
        '一つの現象が複数階層に現れる場合は重複ではなく抽象度の違いとして扱います（同じ文が複数ファイルへ複製されている場合だけを重複とします）。',
        `判断基準は ${refs.outputContract} の「ファイル間の責務」に従います（この節だけを読めば足ります）。`,
        'ルールは ID（`WS-012`）で指してください。今回のラウンドで追加・変更されたルールを重点的に見ますが、既存ルールとの重複も対象です。',
        `今回のラウンドで各観点が報告した変更:\n\n${JSON.stringify(
          doneFiles.map((r) => ({ path: r.path, changes: r.changes || [], newRules: r.newRules || [] })),
          null,
          2,
        )}`,
        '検出結果は報告に載り、修正は次のラウンドまたは個別の指示で行われます。あなたが直接ファイルを直すことはしません。',
      ].join('\n\n'),
      { label: 'review:boundary', phase: '境界レビュー', agentType: AGENT, model: 'sonnet', effort: 'high', schema: BOUNDARY_SCHEMA },
    )
  : null

return {
  mode: MODE,
  stocktakeOnly,
  files: doneFiles.map((r) => ({ path: r.path, action: r.action, changes: r.changes || [] })),
  newRules: doneFiles.flatMap((r) => r.newRules || []),
  evidenceFiles: doneFiles
    .filter((r) => r.evidenceDir)
    .map((r) => ({ dir: r.evidenceDir, files: r.evidenceFiles || [] })),
  pendingFiles: doneFiles
    .filter((r) => r.pendingPath)
    .map((r) => ({ path: r.pendingPath, action: r.pendingAction || 'unchanged' })),
  promoted: doneFiles.flatMap((r) => r.promoted || []),
  heldItems: doneFiles.flatMap((r) => r.heldItems || []),
  boundary: boundary || {},
  skippedAspects: skipped,
  notes: doneFiles
    .map((r) => r.notes)
    .filter(Boolean)
    .join(' | '),
  nextSteps: [
    'node scripts/style-rule-ids.mjs --write   # 追加されたルールへIDを採番',
    'node scripts/style-evidence-tally.mjs     # 支持記事数と不整合の確認',
  ],
}
