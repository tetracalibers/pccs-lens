export const meta = {
  name: 'author-style-analysis',
  description: '著者の過去記事とGit履歴から文体ガイド4種を分析・差分更新する（決定論オーケストレーション）',
  phases: [
    { title: '独立分析', detail: '4観点を独立したエージェントで並行分析し、構造化された特徴を返す' },
    { title: '反証・境界レビュー', detail: '各分析を反証的に検証し、4ファイル間の責務境界を横断確認する' },
    { title: '統合', detail: '既存ガイドを読み、差分更新で4ファイルを書き込む' },
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

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          action: { type: 'string', enum: ['created', 'updated', 'unchanged'] },
          changes: { type: 'array', items: { type: 'string' } },
        },
        required: ['path', 'action'],
      },
    },
    heldItems: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['files'],
}

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

// ---- Stage 1: 独立分析（barrier — 境界レビューが4分析すべてを必要とする）----
phase('独立分析')
log(`独立分析を開始：対象記事 ${m.targets.length} 本 / 4観点を並行分析`)

const rawAnalyses = await parallel(
  ANALYSTS.map((a) => () =>
    agent(
      [
        `あなたは ${a.role} です。他の分析結果を見ず、次の観点だけを独立して分析します：${a.scope}。`,
        a.out,
        `分析手順は ${a.ref} を、出力の品質基準・確度・根拠・ファイル責務は ${refs.outputContract} を必ず Read して厳守します。`,
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
        `品質基準は ${refs.outputContract} を参照します。必要なら対象記事を Read で再確認します。`,
        targetBlock,
        `検証対象の特徴一覧（${a.key}）:\n\n${JSON.stringify(a.features, null, 2)}`,
      ].join('\n\n'),
      { label: `verify:${a.key}`, phase: '反証・境界レビュー', agentType: AGENT, schema: VERDICT_SCHEMA },
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
  { label: 'verify:boundary', phase: '反証・境界レビュー', agentType: AGENT, schema: BOUNDARY_SCHEMA },
)
log('反証・境界レビュー完了')

// ---- Stage 3: 統合（単一エージェントが4ファイルを書き込む）----
phase('統合')
const report = await agent(
  [
    `あなたは Synthesis Editor です。反証・境界レビューの結果を反映し、著者スタイルガイド4ファイルを${m.isUpdate ? '差分更新' : '新規作成'}します。`,
    m.isUpdate
      ? '既存の各ファイルをまず Read し、有効な記述を保持したうえで、加筆・条件追加・例外追加・確度変更・新規ルール追加・根拠不足ルールの削除として反映します。全面的な書き直しや既存内容の破棄は禁止です。'
      : `${m.guidesDir}/ ディレクトリが無ければ作成します。`,
    [
      '出力先ファイル:',
      `- thinking-flow: ${m.existingGuides.thinkingFlow}`,
      `- writing-style: ${m.existingGuides.writingStyle}`,
      `- stylistic-quirks: ${m.existingGuides.stylisticQuirks}`,
      `- refine-style: ${m.existingGuides.refineStyle}`,
    ].join('\n'),
    'Evidence反証で「根拠不足／反例が多い／著者固有とは判断できない」とされた特徴は主要ルールに採用しません（弱い傾向・保留として分離）。Boundary が指摘した重複と配置先を反映します。',
    `各ルールは出力契約（${refs.outputContract}）の形式（対象／ルール／適用する状況／目的／適用しない状況／確度／根拠／反例・例外）で、固定テンプレートではなく条件付きの判断として記述します。頻出表現の機械的な挿入指示にはしません。Agent間の議論ログや分析の生ログは最終成果物に含めません。`,
    `採用候補の分析（保留含む）:\n\n${JSON.stringify(
      analyses.map((a) => ({ key: a.key, features: a.features, held: a.heldFeatures || [] })),
      null,
      2,
    )}`,
    `Evidence反証の判定:\n\n${JSON.stringify(evidence, null, 2)}`,
    `Boundary境界の判定:\n\n${JSON.stringify(boundary || {}, null, 2)}`,
    '4ファイルを Write/Edit で実際に書き込み、各ファイルの action（created/updated/unchanged）と主な変更点、保留事項を報告します。',
  ].join('\n\n'),
  { label: 'synthesize', phase: '統合', agentType: AGENT, schema: REPORT_SCHEMA },
)

return report
