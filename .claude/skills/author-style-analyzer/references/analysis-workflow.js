export const meta = {
  name: 'author-style-analysis',
  description: '著者の過去記事とGit履歴から文体ガイド4種を分析・差分更新する（決定論オーケストレーション）',
  phases: [
    { title: '独立分析', detail: '4観点を独立したエージェントで並行分析し、構造化された特徴を返す' },
    { title: '反証・境界レビュー', detail: '各分析を反証的に検証し、4ファイル間の責務境界を横断確認する' },
    { title: '統合', detail: '各観点ごとにガイド本体・evidence 根拠インデックス・pending 保留ファイルを読み、ルールの更新と根拠の登録を差分Editで反映する' },
  ],
}

// ---------------------------------------------------------------------------
// このスクリプトは Workflow ツールから scriptPath で実行される正典ハーネス。
// teammate（Agent Teams / SendMessage）を一切使わず、決定論的な制御フローで
// サブエージェントを回す。アイドル待ちが存在しないためハングしない。
//
// メインセッション（スキル本体）が前処理でスコープを解決し、次の形の manifest を
// args として渡す。エージェントはパスから記事本文・参照プロンプトを自分で Read する。
//
// args = {
//   isUpdate: boolean,                       // 既存ガイドの差分更新か新規作成か
//   guidesDir: string,                       // 例: 'writing-guides'
//   targets: [{ path, slug, title, type, commit, reanalysis }],
//                                            // 分析対象記事。slug は evidence インデックスのキー（例 '/color-theory/xxx'）、
//                                            // commit は分析時点の記事コミット短縮SHA（git log -1 --format=%h -- <path>）、
//                                            // reanalysis: true なら既に evidence にブロックがある記事（ブロックを消して書き直す）
//   excluded: [string],                      // 除外した記事（任意）
//   gitAnalyzable: [{ title, draftCommit, editCommits: [string] }], // refine-style 用
//   existingGuides: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle }, // ガイド本体の出力先パス
//   pendingGuides: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle }, // 保留プールのパス（任意。省略時は guidesDir/pending/ から導出）
//   evidenceIndexes: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle }, // 根拠インデックスのパス（任意。省略時は guidesDir/evidence/ から導出）
//   refs: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle, outputContract }, // 参照プロンプトのパス
// }
//
// 成果物は2層に分かれる。ガイド本体（writer が読む）には実行可能なルール・適用条件・確度ラベル
// 3語だけを置き、根拠・確度の判定理由・記事単位の記録は evidence/<観点>.md へ登録する。
// 執筆側の量をルール数に比例させ、記事数に比例させないための分離（根拠欄を復活させない）。
// ---------------------------------------------------------------------------

const m = typeof args === 'string' ? JSON.parse(args) : args
const refs = m.refs
const AGENT = 'general-purpose' // Read/Write を確実に持たせる

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
          claim: { type: 'string' },
          category: { type: 'string' },
          evidenceArticles: { type: 'array', items: { type: 'string' } },
          evidenceLocations: { type: 'string' },
          // 根拠インデックス（evidence/<観点>.md）へ登録するための、記事単位に正規化した根拠。
          // slug は manifest の targets[].slug をそのまま使う（記事名ではない）。
          evidenceBySlug: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                location: { type: 'string' }, // 本文中の該当箇所を短く。refine-style は 修正前→修正後 のコミット対
                note: { type: 'string' }, // その記事での反例・除外があれば書く
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
          feature: { type: 'string' },
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
          feature: { type: 'string' },
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

// 統合はファイル単位に分割・並列化するため、per-file の報告スキーマを使う。
const FILE_REPORT_SCHEMA = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    action: { type: 'string', enum: ['created', 'updated', 'unchanged'] },
    changes: { type: 'array', items: { type: 'string' } },
    heldItems: { type: 'array', items: { type: 'string' } },
    promoted: { type: 'array', items: { type: 'string' } }, // pending → 本体へ昇格した項目
    pendingPath: { type: 'string' }, // 更新した保留プールのパス
    pendingAction: { type: 'string', enum: ['created', 'updated', 'unchanged'] }, // 保留プールの更新結果
    evidencePath: { type: 'string' }, // 更新した根拠インデックスのパス
    evidenceAction: { type: 'string', enum: ['created', 'updated', 'unchanged'] },
    evidenceBlocks: { type: 'array', items: { type: 'string' } }, // 追加/書き直した記事ブロック（'/slug (sha)' 形式）
    notes: { type: 'string' },
  },
  required: ['path', 'action'],
}

// output-contract-analysis.md（分析・反証段階の判断基準の正典）を要約したもの。分析・反証
// エージェントはこれに従い、契約ファイルの全文 Read は行わない。記述形式・ルールの基本形式・
// ファイル別必須要素など「統合側」の規約は output-contract.md にあり、最終Markdownを書く統合段階でのみ使う。
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

// 全アナリスト共通の分析対象コンテキスト
const targetLines = m.targets.map(
  (t) =>
    `- ${t.title} [${t.type || '種別不明'}] : ${t.path}` +
    `\n  slug=${t.slug || '(未指定)'} / 分析時点=${t.commit || '(未指定)'}${t.reanalysis ? ' / 再分析（既存ブロックを書き直す）' : ''}`,
)
const excludedBlock = (m.excluded && m.excluded.length)
  ? `\n## 除外記事（分析対象外）\n${m.excluded.map((e) => `- ${e}`).join('\n')}`
  : ''
const gitBlock = (m.gitAnalyzable && m.gitAnalyzable.length)
  ? `\n## Git履歴を利用できる記事（refine-style 用）\n${m.gitAnalyzable
      .map((g) => `- ${g.title} : 草稿コミット=${g.draftCommit} / 編集コミット=${g.editCommits.join(', ')}`)
      .join('\n')}`
  : '\n## Git履歴を利用できる記事\n- （なし。refine-style は Git 差分が無い場合、確認できないと明記する）'
const targetBlock = `## 分析対象記事（絶対パス）\n${targetLines.join('\n')}${excludedBlock}${gitBlock}`

const ANALYSTS = [
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

// 各ガイドに対応する保留プール（writing-guides/pending/<同名>.md）。主要ルールに満たない
// 観察はガイド本体ではなくこの pending ファイルに置き、根拠が増えた項目を本体へ昇格させる。
// writer は pending を読まない（分析専用）。manifest.pendingGuides があればそれを、無ければ
// ガイドパスの basename の前に pending/ を差し込んで導出する。
const CAMEL = { 'thinking-flow': 'thinkingFlow', 'writing-style': 'writingStyle', 'stylistic-quirks': 'stylisticQuirks', 'refine-style': 'refineStyle' }
const pendingOf = (guidePath, key) =>
  (m.pendingGuides && m.pendingGuides[CAMEL[key]]) || guidePath.replace(/([^/]+)$/, 'pending/$1')

// 各ガイドに対応する根拠インデックス（writing-guides/evidence/<同名>.md）。ガイド本体のルール欄に
// 根拠を書かず、記事 slug をキーにこちらへ登録する。writer は読まない（analyzer 専用）。
const evidenceOf = (guidePath, key) =>
  (m.evidenceIndexes && m.evidenceIndexes[CAMEL[key]]) || guidePath.replace(/([^/]+)$/, 'evidence/$1')

// 統合ステージの出力ファイル（分析キー → ガイド本体／根拠インデックス／保留プールのパス）。
// 4成果物は責務が独立するため、ファイル単位に分割して並列に差分更新する。各エージェントは自分の
// 観点の「本体＋evidence＋pending」の3ファイルだけを編集する（他観点のファイルには触れない）。
const OUTPUT_FILES = [
  { key: 'thinking-flow', path: m.existingGuides.thinkingFlow, pendingPath: pendingOf(m.existingGuides.thinkingFlow, 'thinking-flow'), evidencePath: evidenceOf(m.existingGuides.thinkingFlow, 'thinking-flow') },
  { key: 'writing-style', path: m.existingGuides.writingStyle, pendingPath: pendingOf(m.existingGuides.writingStyle, 'writing-style'), evidencePath: evidenceOf(m.existingGuides.writingStyle, 'writing-style') },
  { key: 'stylistic-quirks', path: m.existingGuides.stylisticQuirks, pendingPath: pendingOf(m.existingGuides.stylisticQuirks, 'stylistic-quirks'), evidencePath: evidenceOf(m.existingGuides.stylisticQuirks, 'stylistic-quirks') },
  { key: 'refine-style', path: m.existingGuides.refineStyle, pendingPath: pendingOf(m.existingGuides.refineStyle, 'refine-style'), evidencePath: evidenceOf(m.existingGuides.refineStyle, 'refine-style') },
]

// ---- Stage 1: 独立分析（barrier — 境界レビューが4分析すべてを必要とする）----
phase('独立分析')
log(`独立分析を開始：対象記事 ${m.targets.length} 本 / 4観点を並行分析`)

const rawAnalyses = await parallel(
  ANALYSTS.map((a) => () =>
    agent(
      [
        `あなたは ${a.role} です。他の分析結果を見ず、次の観点だけを独立して分析します：${a.scope}。`,
        a.out,
        `分析手順は ${a.ref} を必ず Read して厳守します。出力の品質基準は下記「分析の品質基準」に従い、output-contract 全文の Read は不要です（執筆側の記述形式は最終Markdownを書く統合段階でのみ使います）。`,
        ANALYSIS_CRITERIA,
        a.git
          ? 'refine-style の根拠は Git 差分に限定します。下記「Git履歴を利用できる記事」のコミットを git show / git diff で確認し、AI草稿から人手編集への変更を分析します。誤字・メタデータ・リンク・整形・技術的訂正・無関係なリファクタは文体修正から分離します。'
          : '完成記事の本文のみを根拠にし、Git 差分は使いません。',
        targetBlock,
        '対象記事ファイルを Read で読み、著者固有の特徴を抽出します。一般的な文章術・記事テーマ固有の専門用語・単一記事だけの一般化・AI草稿由来の表現は、著者の特徴として採用しません。記事タイプによる違いを無視して一律に一般化しません。',
        '各特徴には 根拠記事（複数） / 確度（強い傾向・条件付きの傾向・弱い傾向） / 事実か推測か / 反例 / 適用しない条件 を付けます。担当外の特徴を見つけた場合は features に入れず handoffFeatures に記録します。確信が持てない特徴は heldFeatures に回します。',
        '根拠は evidenceBySlug に記事単位で分けて出します（slug は上記一覧の値をそのまま使い、location に該当箇所を短く、その記事で反例・除外があれば note に書く）。また、ルールを実行するために必要な操作的制約（頻度・分量の上限、適用範囲の線引き、記事タイプによる出入り）は operationalConstraints に分けて出します。この2つは統合段階で別のファイルへ振り分けられるため、混ぜて1つの散文にしないでください。',
        'あなたの最終出力は StructuredOutput のスキーマに従う JSON です。人間向けメッセージではありません。',
      ]
        .filter(Boolean)
        .join('\n\n'),
      { label: `analyze:${a.key}`, phase: '独立分析', agentType: AGENT, effort: 'high', schema: FEATURE_SCHEMA },
    ),
  ),
)

const analyses = rawAnalyses
  .map((r, i) => (r ? { key: ANALYSTS[i].key, role: ANALYSTS[i].role, ...r } : null))
  .filter(Boolean)

if (analyses.length === 0) {
  return { error: '独立分析がすべて失敗しました。対象記事のパスや権限を確認してください。', files: [] }
}
log(`独立分析完了：${analyses.length}/4 観点が特徴を抽出`)

// ---- Stage 2: 反証・境界レビュー ----
phase('反証・境界レビュー')

// Evidence 反証（各分析を独立に検証）と Boundary 境界（4分析を横断）は、いずれも analyses だけに
// 依存し互いに独立。Boundary を Evidence の後に直列実行すると評価待ちが critパスに丸ごと乗る
// （synthesis 開始 = evidence_max + boundary）。両者を同一 barrier に入れて同時に走らせることで、
// synthesis 開始を max(evidence_max, boundary) まで前倒しする（どちらも analyses が揃えば実行可能）。
const evidenceThunks = analyses.map((a) => () =>
  agent(
    [
      `あなたは Evidence Reviewer です。次の分析（${a.key}）の各特徴を反証的に検証します。新しいルールは提案せず、既存の主張の根拠だけを検証します。`,
      '各特徴について確認する：根拠記事が複数あるか／同一シリーズ・同一時期に偏っていないか／引用箇所が主張を実際に支えるか／記事テーマ固有の事情ではないか／反例となる記事はないか／別の説明で同じ現象を説明できないか／一般的な文章術ではなく著者固有か。',
      '疑わしい場合は棄却寄りに判定します。judgment は 根拠十分／条件を限定すれば妥当／根拠不足／反例が多い／著者固有とは判断できない／追加調査が必要 から選びます。',
      '品質基準は下記「分析の品質基準」に従います（output-contract 全文の Read は不要）。必要なら対象記事を Read で再確認します。',
      ANALYSIS_CRITERIA,
      targetBlock,
      `検証対象の特徴一覧（${a.key}）:\n\n${JSON.stringify(a.features, null, 2)}`,
    ].join('\n\n'),
    { label: `verify:${a.key}`, phase: '反証・境界レビュー', agentType: AGENT, model: 'sonnet', effort: 'medium', schema: VERDICT_SCHEMA },
  ),
)

const boundaryThunk = () =>
  agent(
    [
      'あなたは Boundary Reviewer です。4つの分析結果を横断し、成果物間の責務境界を検証します。',
      '検出する：同一特徴の重複／配置先の誤り（thinking-flow・writing-style・stylistic-quirks・refine-style のどれに属すべきか）／思考・構成・表現・修正の混同／上位ルールと下位表現の未分離／因果と相関の混同。',
      `一つの現象が複数階層に現れる場合は重複ではなく抽象度の違いとして分解します（同じ文を複数ファイルへ複製するのは不可）。判断基準は ${refs.outputContract} の「ファイル間の責務」に従います。`,
      `4分析の特徴:\n\n${JSON.stringify(
        analyses.map((a) => ({ key: a.key, features: a.features })),
        null,
        2,
      )}`,
    ].join('\n\n'),
    { label: 'verify:boundary', phase: '反証・境界レビュー', agentType: AGENT, model: 'sonnet', effort: 'high', schema: BOUNDARY_SCHEMA },
  )

// Evidence(×N) と Boundary(×1) を同一 barrier で同時実行。末尾要素が Boundary の結果。
const stage2 = await parallel([...evidenceThunks, boundaryThunk])
const rawEvidence = stage2.slice(0, analyses.length)
const boundary = stage2[analyses.length] // 失敗時は null（synthesis 側で boundary || {} を渡す）
const evidence = rawEvidence
  .map((r, i) => (r ? { key: analyses[i].key, ...r } : null))
  .filter(Boolean)
log('反証・境界レビュー完了')

// ---- Stage 3: 統合（4観点を並列に、本体＋evidence＋pending を差分 Edit で書き込む）----
// 4成果物は責務が独立し、Boundary が横断的な重複・配置を解決済みなので、観点単位に
// 分割して並列化する。各エージェントは自分の観点の「ガイド本体＋根拠インデックス＋pending
// 保留ファイル」の3ファイルだけを編集し、更新時は全文 Write ではなく差分 Edit を使う（巨大
// ガイドの全書き換えを避け、出力トークンと壁時計を大幅に削減）。根拠は本体ではなく evidence
// に、保留（held）は本体ではなく pending に置き、根拠が増えた保留は pending から本体へ昇格させる。
phase('統合')

// 4分析の特徴（保留含む）。各エージェントは自ファイル分＋Boundaryで移送指定された分だけを反映する。
const allFeatures = analyses.map((a) => ({
  key: a.key,
  features: a.features || [],
  held: a.heldFeatures || [],
}))

// 根拠インデックスへ書く記事ブロックの一覧（slug と分析時点 SHA）。4観点で同じ値を使うため、
// manifest 由来の値をそのまま渡す（エージェントに SHA を推測させない）。
const evidenceTargets = m.targets.map((t) => ({
  slug: t.slug,
  commit: t.commit,
  reanalysis: !!t.reanalysis,
  title: t.title,
}))

const perFile = await parallel(
  OUTPUT_FILES.map((f) => () =>
    agent(
      [
        `あなたは Synthesis Editor（担当観点：${f.key}）です。この観点の3ファイル、ガイド本体 ${f.path}・根拠インデックス ${f.evidencePath}・保留プール ${f.pendingPath} だけを${m.isUpdate ? '差分更新' : '作成/更新'}します。他観点のファイルには絶対に触れません。`,
        m.isUpdate
          ? `まず ${f.path}（本体）・${f.evidencePath}（根拠インデックス）・${f.pendingPath}（保留プール）を Read し、有効な既存記述を保持します。変わる箇所だけを Edit で差分更新してください（全文を Write で書き直さない／既存内容の破棄・全面的な書き直しは禁止）。本体への反映は、加筆・適用条件の追加・例外の追加・確度ラベルの変更・新規ルールの追加・根拠不足ルールの削除として行います。`
          : `${m.guidesDir}/ ディレクトリが無ければ作成して ${f.path} を新規に Write します。根拠インデックス ${f.evidencePath} と保留プール ${f.pendingPath} は、既にあれば Read して差分更新し、無ければ位置づけの注記（analyzer 専用／writer は読まない旨）を先頭に付けて Write します。`,
        `【成果物の2層分離：この契約が最優先です】ガイド本体 ${f.path} は writer が執筆時に読むファイルで、量をルール数に比例させ、記事数に比例させません。本体に置くのは実行可能なルール・適用条件・確度ラベルだけです。次を本体に書いてはいけません：根拠（記事名・シリーズ名・出現件数・本文の引用・コミット）、\`根拠\` 欄、\`反例・例外\` 欄、確度の判定理由（「〜記事で確認」「一般的技法とも重なる」「単一シリーズに偏る」等）、分析経緯。\`確度\` 欄は \`強い傾向\` / \`条件付きの傾向\` / \`弱い傾向\` のラベル1語のみとし、ルール定義の先頭に置きます。`,
        `根拠は ${f.evidencePath} へ、記事 slug をキーとして登録します。形式：\`## /<slug>\` 見出し → 直下に \`分析時点: \\\`<短縮SHA>\\\`\` 行 → その記事から採れた支持ルール名の箇条書き（括弧内に本文中の該当箇所を短く。${f.key === 'refine-style' ? '修正前後のコミット対を書く' : '該当箇所を書く'}）→ 反例・除外は \`※\` で注記。\`##\` の階層は slug の予約なので注記に使いません。ルール名は本体の \`###\` 見出しと一字一句一致させます（揺れると追跡できません）。分析の生ログ・長い転載は書きません。`,
        `今回の記事ブロック（slug と分析時点 SHA は下記の値をそのまま使い、自分で git を叩いて推測しません）。\`reanalysis: true\` の記事は既存ブロックがあるので、**そのブロックを丸ごと消して書き直し**、\`分析時点\` を新しい SHA へ更新します（他の記事のエントリには触りません）。書き直しで支持記事が減ったルールは、残りの記事数・記事タイプの幅を数え直して確度ラベルを再評価し、支持記事が0になったルールは廃止候補として扱います:\n\n${JSON.stringify(evidenceTargets, null, 2)}`,
        `各特徴の operationalConstraints（頻度・分量の上限、適用範囲の線引き、記事タイプによる出入り）は、根拠側ではなく**本体のルール欄・適用条件欄**へ入れます。受け皿は \`ルール\` / \`適用する状況\` / \`適用しない状況\` に加え、\`使用量\`（頻度・分量）／\`変種\`（条件による現れ方の違い）／\`注意\`（運用上の注意）です。これらを根拠の散文として ${f.evidencePath} 側へ流すと、執筆側から判断材料が失われます。逆に \`使用目的\` / \`使用されやすい文脈\` / \`構成上の効果\` / \`前後の要素\` は、ルール欄の言い換えになるなら書きません。`,
        `本体 ${f.path} には主要ルール（強い傾向・条件付きの傾向・弱い傾向）だけを置きます。保留プール ${f.pendingPath} には、根拠不足・単一記事偏り・一般技法との切り分け困難などで主要ルールに満たない観察（保留）だけを置きます。3ファイルの役割を混在させません（本体＝ルール、evidence＝採用済みルールの根拠、pending＝未採用の観察とその根拠）。保留の根拠は pending の項目内に書き、${f.evidencePath} へは登録しません（インデックスのルール名は本体に存在するものだけを指します）。保留プール先頭の「このファイルの位置づけ」注記は必ず残します。`,
        `保留の扱いは次のとおり。① 昇格：${f.pendingPath} の既存保留のうち、今回の分析で根拠が増え Evidence反証も通ったものは、本体 ${f.path} の主要ルールへ移し、pending 側の当該項目は削除します（report.promoted に記録）。あわせて ${f.evidencePath} の該当記事ブロックへ、そのルール名を登録します。② 追記：今回 heldFeatures に入った、または Evidence反証で「根拠不足／反例が多い／著者固有とは判断できない」とされた特徴は、本体ではなく ${f.pendingPath} に追記・更新します。③ 棄却：根拠の誤読が判明した等で不要になった保留は pending から削除します。本体からルールを削除した場合は、${f.evidencePath} の全記事ブロックからもそのルール名を外します。`,
        `Markdown の記述形式・ルールの基本形式（確度／対象／ルール／適用する状況／適用しない状況／使用量／変種／注意／関連ルール）・${f.key} の必須要素・「根拠の記載方法」・「記事単位の再分析（撤回）」・「廃止と保留の扱い」・「禁止事項」は ${refs.outputContract} を Read して従います。固定テンプレートではなく条件付きの判断として記述し、頻出表現の機械的な挿入指示にはしません。Agent間の議論ログや分析の生ログは成果物に含めません。`,
        `本体に反映するのは ${f.key} に属する特徴だけです。Boundary が ${f.key} へ移すべきとした特徴は、対応する分析の features から内容を取り込みます。逆に ${f.key} から他ファイルへ移す／重複削除とされた特徴は削除します。同じ文を他ファイルと重複させません。関連ルール参照は裸の参照（\`→ writing-style.md「◯◯」\`）だけを書き、保留項目（\`pending/<観点>.md\`）への参照は本体に書きません（writer はたどれないためノイズになります）。`,
        `4分析の採用候補（held＝保留候補を含む。反映するのは ${f.key} 分＋Boundaryで移送指定された分のみ）:\n\n${JSON.stringify(allFeatures, null, 2)}`,
        `Evidence反証の判定（全分析）:\n\n${JSON.stringify(evidence, null, 2)}`,
        `Boundary境界の判定:\n\n${JSON.stringify(boundary || {}, null, 2)}`,
        `書き込み後、本体に \`根拠\` 欄・\`反例・例外\` 欄が無いこと、\`確度\` 欄がラベル1語のみであること、記事名・シリーズ名・件数が本体に残っていないことを自分で grep して確認します。`,
        `本体 ${f.path}・根拠インデックス ${f.evidencePath}・保留プール ${f.pendingPath} を実際に書き込み、path・action（本体）／evidencePath・evidenceAction・evidenceBlocks（'/slug (sha)' 形式で追加・書き直したブロック）／pendingPath・pendingAction（保留プール）／主な変更点（changes）／昇格した項目（promoted）／新たに保留にした項目（heldItems）を報告します。`,
      ].join('\n\n'),
      { label: `synthesize:${f.key}`, phase: '統合', agentType: AGENT, effort: 'high', schema: FILE_REPORT_SCHEMA },
    ),
  ),
)

const doneFiles = perFile.filter(Boolean)
if (doneFiles.length < OUTPUT_FILES.length) {
  log(`統合：${doneFiles.length}/${OUTPUT_FILES.length} ファイルが完了（残りは失敗の可能性。後処理でファイルを要確認）`)
} else {
  log('統合完了：4ファイルを差分更新')
}

return {
  files: doneFiles.map((r) => ({ path: r.path, action: r.action, changes: r.changes || [] })),
  evidenceFiles: doneFiles
    .filter((r) => r.evidencePath)
    .map((r) => ({ path: r.evidencePath, action: r.evidenceAction || 'unchanged', blocks: r.evidenceBlocks || [] })),
  pendingFiles: doneFiles
    .filter((r) => r.pendingPath)
    .map((r) => ({ path: r.pendingPath, action: r.pendingAction || 'unchanged' })),
  promoted: doneFiles.flatMap((r) => r.promoted || []),
  heldItems: doneFiles.flatMap((r) => r.heldItems || []),
  notes: doneFiles.map((r) => r.notes).filter(Boolean).join(' | '),
}
