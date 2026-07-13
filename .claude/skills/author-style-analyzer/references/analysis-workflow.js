export const meta = {
  name: 'author-style-analysis',
  description: '著者の過去記事とGit履歴から文体ガイド4種を分析・差分更新する（決定論オーケストレーション）',
  phases: [
    { title: '独立分析', detail: '4観点を独立したエージェントで並行分析し、構造化された特徴を返す' },
    { title: '反証・境界レビュー', detail: '各分析を反証的に検証し、4ファイル間の責務境界を横断確認する' },
    { title: '統合', detail: '既存ガイドを読み、4ファイルを並列に差分Editで更新する' },
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
//   targets: [{ path, title, type }],        // 分析対象記事（絶対パス・タイトル・記事タイプ）
//   excluded: [string],                      // 除外した記事（任意）
//   gitAnalyzable: [{ title, draftCommit, editCommits: [string] }], // refine-style 用
//   existingGuides: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle }, // 出力先パス
//   refs: { thinkingFlow, writingStyle, stylisticQuirks, refineStyle, outputContract }, // 参照プロンプトのパス
// }
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
          counterexamples: { type: 'string' },
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
    notes: { type: 'string' },
  },
  required: ['path', 'action'],
}

// output-contract の「分析側」要点のみを抜き出したもの。分析・反証エージェントは
// これに従い、24.7KB の output-contract 全文 Read は行わない（Markdown の記述形式・
// ルールの基本形式・ファイル別必須要素など「執筆側」の規約は最終Markdownを書く統合段階でのみ使う）。
const ANALYSIS_CRITERIA = [
  '## 分析の品質基準（output-contract の分析側要点。これに従い、output-contract 全文の Read は不要）',
  '- 根拠：各特徴は複数記事で確認する。1記事だけの特徴は「弱い傾向」か heldFeatures に回す。引用箇所は主張を実際に支えるものにする。',
  '- 著者固有性：一般的な文章術・技術記事に共通する書き方・記事テーマ固有の専門用語は、著者の癖として採用しない。他の書き手にも当てはまる特徴は除外する。',
  '- 確度：強い傾向＝複数記事・複数タイプで一貫／条件付きの傾向＝特定タイプや文脈に限る／弱い傾向＝少数例または反例あり。',
  '- 事実と推測：本文から直接読み取れる事実か、リバースエンジニアリングした推測かを区別する。推測は推測と明記し、断定しない。',
  '- 反例と適用条件：反例を隠さず記録し、適用しない記事タイプ・条件を必ず添える。記事タイプによる差を一律に一般化しない。',
  '- 用例：本文の転載は最小限にし、特徴が確認できる範囲に切り詰める。',
].join('\n')

// 全アナリスト共通の分析対象コンテキスト
const targetLines = m.targets.map((t) => `- ${t.title} [${t.type || '種別不明'}] : ${t.path}`)
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

// 統合ステージの出力ファイル（分析キー → 出力先パス）。4成果物は責務が独立するため、
// ファイル単位に分割して並列に差分更新する。
const OUTPUT_FILES = [
  { key: 'thinking-flow', path: m.existingGuides.thinkingFlow },
  { key: 'writing-style', path: m.existingGuides.writingStyle },
  { key: 'stylistic-quirks', path: m.existingGuides.stylisticQuirks },
  { key: 'refine-style', path: m.existingGuides.refineStyle },
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
        'あなたの最終出力は StructuredOutput のスキーマに従う JSON です。人間向けメッセージではありません。',
      ]
        .filter(Boolean)
        .join('\n\n'),
      { label: `analyze:${a.key}`, phase: '独立分析', agentType: AGENT, schema: FEATURE_SCHEMA },
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

// Evidence 反証：各分析を独立に反証検証（synthesis 前に全て必要なので barrier）
const rawEvidence = await parallel(
  analyses.map((a) => () =>
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
  ),
)
const evidence = rawEvidence
  .map((r, i) => (r ? { key: analyses[i].key, ...r } : null))
  .filter(Boolean)

// Boundary 境界：4分析を横断（barrier 必須 — 全分析が揃って初めて重複・配置を判定できる）
const boundary = await agent(
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
log('反証・境界レビュー完了')

// ---- Stage 3: 統合（4ファイルを並列に、差分 Edit で書き込む）----
// 4成果物は責務が独立し、Boundary が横断的な重複・配置を解決済みなので、ファイル単位に
// 分割して並列化する。各エージェントは自分の1ファイルだけを編集し、更新時は全文 Write では
// なく差分 Edit を使う（巨大ガイドの全書き換えを避け、出力トークンと壁時計を大幅に削減）。
phase('統合')

// 4分析の特徴（保留含む）。各エージェントは自ファイル分＋Boundaryで移送指定された分だけを反映する。
const allFeatures = analyses.map((a) => ({
  key: a.key,
  features: a.features || [],
  held: a.heldFeatures || [],
}))

const perFile = await parallel(
  OUTPUT_FILES.map((f) => () =>
    agent(
      [
        `あなたは Synthesis Editor（担当ファイル：${f.key}）です。著者スタイルガイドのうち ${f.path} だけを${m.isUpdate ? '差分更新' : '新規作成'}します。他の3ファイルは絶対に編集しません。`,
        m.isUpdate
          ? `まず ${f.path} を Read し、有効な既存記述を保持します。変わる箇所だけを Edit で差分更新してください（全文を Write で書き直さない／既存内容の破棄・全面的な書き直しは禁止）。反映は、加筆・適用条件の追加・例外の追加・確度の変更・新規ルールの追加・根拠不足ルールの削除として行います。`
          : `${m.guidesDir}/ ディレクトリが無ければ作成し、${f.path} を新規に Write します。`,
        `Markdown の記述形式・ルールの基本形式（対象／ルール／適用する状況／目的／適用しない状況／確度／根拠／反例・例外）・${f.key} の必須要素は ${refs.outputContract} を Read して従います。固定テンプレートではなく条件付きの判断として記述し、頻出表現の機械的な挿入指示にはしません。Agent間の議論ログや分析の生ログは成果物に含めません。`,
        `反映するのは ${f.key} に属する特徴だけです。Evidence反証で「根拠不足／反例が多い／著者固有とは判断できない」とされた特徴は主要ルールに採用しません（弱い傾向・保留として分離）。Boundary が ${f.key} へ移すべきとした特徴は、対応する分析の features から内容を取り込みます。逆に ${f.key} から他ファイルへ移す／重複削除とされた特徴は削除します。同じ文を他ファイルと重複させません。`,
        `4分析の採用候補（保留含む。反映するのは ${f.key} 分＋Boundaryで移送指定された分のみ）:\n\n${JSON.stringify(allFeatures, null, 2)}`,
        `Evidence反証の判定（全分析）:\n\n${JSON.stringify(evidence, null, 2)}`,
        `Boundary境界の判定:\n\n${JSON.stringify(boundary || {}, null, 2)}`,
        `${f.path} を ${m.isUpdate ? 'Edit（差分）' : 'Write'} で実際に書き込み、action（created/updated/unchanged）と主な変更点、保留事項を報告します。`,
      ].join('\n\n'),
      { label: `synthesize:${f.key}`, phase: '統合', agentType: AGENT, schema: FILE_REPORT_SCHEMA },
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
  heldItems: doneFiles.flatMap((r) => r.heldItems || []),
  notes: doneFiles.map((r) => r.notes).filter(Boolean).join(' | '),
}
