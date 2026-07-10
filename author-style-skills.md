# 文体スキルの仕組み（author-style-analyzer / author-style-writer）

著者の執筆スタイルを「分析して再利用可能なガイドに落とし込む」スキルと、「そのガイドを使って著者らしい文章を書く」スキルの2本立てで構成しています。このドキュメントは、両スキルの仕組みと内部の役割分担をまとめたものです。

- **author-style-analyzer** … 過去記事とGit履歴を分析し、著者固有のスタイルを4つのガイドへ抽出・更新する（生成側）
- **author-style-writer** … 生成済みのガイドを参照し、著者らしい文章を生成・推敲・レビューする（利用側）

## 全体像（データフロー）

```
        過去記事（+page.svx など） + Git のコミット履歴
                        │
                        ▼
            ┌───────────────────────────┐
            │   author-style-analyzer   │  複数 Agent が独立分析し
            │        （分析側）         │  相互レビューで検証
            └───────────────────────────┘
                        │ 生成 / 差分更新
                        ▼
                writing-guides/
                  ├─ thinking-flow.md      … 思考の流れ
                  ├─ writing-style.md      … 文章構成
                  ├─ stylistic-quirks.md   … 表現上の癖
                  └─ refine-style.md       … 修正傾向（Git差分由来）
                        │ 参照
                        ▼
            ┌───────────────────────────┐
            │    author-style-writer    │  + writing-guides/syntax-guide.md
            │        （利用側）         │    （記法・書式の必須ルール）
            └───────────────────────────┘
                        │
                        ▼
            著者らしい記事本文（生成 / 推敲 / レビュー）
```

分析側が「知識（ガイド）」を作り、利用側がそれを「消費」する一方向の関係です。両者は `writing-guides/` を介して疎結合になっています。

## 成果物：4つのスタイルガイド

analyzer が生成し、writer が参照する中心的な成果物です。いずれもリポジトリ直下の `writing-guides/` 配下に置きます。責務を混同せず、同じ特徴を複数ファイルへ重複記載しないことが原則です。

| ファイル | 扱う対象 | 問い |
| --- | --- | --- |
| `thinking-flow.md` | 完成文からリバースエンジニアリングした著者の判断と思考の流れ | なぜそう書くか |
| `writing-style.md` | 記事・セクション・段落・文の構成上の傾向 | 文章上、どこに何が置かれるか |
| `stylistic-quirks.md` | 頻出する言い回し・語尾・接続表現・表記などの癖 | どのような言葉で書かれるか |
| `refine-style.md` | AI草稿を人間が修正した際の追加・削除・並べ替え・書き換えの傾向 | AI草稿をどう変更するか |

一つの現象が複数の階層に現れる場合は、抽象度に合わせて各ファイルへ分解します（同じ文の複製はしない）。分類に迷う特徴は、各分析結果を比較してから配置先を決めます。

> 現状、`writing-guides/` の4ファイルは空です。analyzer を実行すると中身が生成されます（意図的な初期状態）。

### 記法・書式の必須ガイド：`syntax-guide.md`

`writing-guides/syntax-guide.md` は上記4ガイドとは性質が異なり、**記事本文の記法・書式（独自ディレクティブ、`:Mark[]`、数式、コード、禁止事項など）を定めた必須ルール**です。著者の文体に関わらず常に従います。writer はこれを最優先級で参照します（後述の優先順位を参照）。

## author-style-analyzer（分析側）

### 役割

過去記事と編集履歴を分析し、著者固有の執筆スタイルを再利用可能なガイドとして整理します。単なる分析レポートではなく、文章生成・推敲で参照できる実用的なガイドを出力することが目的です。

### 参照ファイル（`references/`）

分析内容に応じて必要なものだけを読みます。

| ファイル | 役割 |
| --- | --- |
| `thinking-flow-analysis.md` | 思考プロセスの分析プロンプト（→ `thinking-flow.md`） |
| `writing-style-analysis.md` | 文章構成の分析プロンプト（→ `writing-style.md`） |
| `stylistic-quirks-analysis.md` | 表現上の癖の分析プロンプト（→ `stylistic-quirks.md`） |
| `refine-style-analysis.md` | Git履歴による修正傾向の分析プロンプト（→ `refine-style.md`） |
| `collaboration-workflow.md` | 複数 Agent の協調と相互レビューの進め方 |
| `output-contract.md` | 全成果物に共通する出力形式・品質基準・根拠の扱い |

### 基本ワークフロー

1. 分析対象を確認する（参照する過去記事の選定、既存ガイドの有無、Git履歴の利用可否など）
2. 記事を分類する（概念解説・実装解説・チュートリアル・比較・導入・エッセイ など）
3. 各観点を独立して分析する（他の結論に引っ張られないよう独立実施）
4. Agent間で相互レビューする（一般化のしすぎ、重複、反例の見落としを検証）
5. 根拠と確度を整理する（確度・確認記事数・記事タイプ・反例・事実か推測か・最終確認日）
6. 既存ガイドを差分更新する（原則として全面書き直しをせず、補強・条件追加・例外追加などに分類）

### 参照する過去記事の指定

分析対象とする過去記事は、引数（カンマ区切りの複数 slug、任意）で切り替えます。

- **slug を渡した場合** … その slug に対応する記事（`app/src/routes/{cg,color-theory,color-fields}/**/<slug>/+page.svx`）のみを参照する
- **引数なしの場合** … `draft: true` ではない解説記事（`layout: guide-content`）の `.svx` をすべて参照する。`concept`（`layout: concept`）など記事以外のページは除外する

### Git履歴の解釈規則

`refine-style.md` を作成・更新するときは、Gitのコミット履歴を使います。コミットメッセージを次の規則で解釈します。

- `記事タイトル：草稿を書かせた` … AIによる初期草稿（修正前）
- 同じ `記事タイトル：` で始まるその後のコミット … 人間による編集（修正後）

同一記事のコミットを時系列で追い、AI草稿から人間の編集までの差分を分析します。誤字修正・メタデータ変更・リンク更新・フォーマット整形・技術的誤りの訂正などは、文体上の修正から分離します。

### マルチAgentによる役割分担

`collaboration-workflow.md` に従い、複数 Agent が独立分析と相互レビューを行います。目的は「意見交換」ではなく、異なる観点から独立した仮説を立て、互いの根拠・一般化・分類・適用条件を検証して単独分析の偏りを減らすことです。

この構成は **Claude Code の Agent Teams（teammates）機能**での実行を想定しています（teammate 同士が `SendMessage` で相互レビュー・反証を行う。単なるサブエージェントでは相互レビューを再現できない）。有効化に必要な設定は [`README.md`](./README.md) を参照。Agent Teams を使えない場合は、サブエージェントや単一エージェントの役割切り替えで代替できます（相互レビューの忠実度は下がります）。

| 役割 | 担当 |
| --- | --- |
| Coordinator | 分析対象の整理、記事分類、担当割り当て、論点整理、成果物の出力確認 |
| Thinking Flow Analyst | 執筆時の問題認識・判断・説明戦略・読者モデル・思考の遷移を復元（→ thinking-flow） |
| Writing Structure Analyst | 記事・セクション・段落・文の構成傾向を分析（→ writing-style） |
| Stylistic Quirks Analyst | 語彙・言い回し・文末・接続・表記の癖を分析（→ stylistic-quirks） |
| Revision Diff Analyst | Git履歴からAI草稿と人間編集の差分を分析（→ refine-style） |
| Evidence Reviewer | 根拠の強さ（記事数・引用対応・反例・偏り）を検証 |
| Boundary Reviewer | 4成果物間の責務と境界（重複・混同）を検証 |
| Synthesis Editor | レビュー後の結果を最終成果物へ統合、差分更新 |

作業は次の8フェーズを順に進めます。独立分析とレビューを同時に行いません。

1. 分析対象の整理
2. 独立分析（他 Agent の結果を見ずに担当領域を分析）
3. 一次相互レビュー（各自の専門観点で他の分析を検証）
4. 反証と境界レビュー（Evidence / Boundary Reviewer が横断検証）
5. 担当Agentによる改訂（指摘への採用・不採用を根拠付きで回答）
6. 統合レビュー（4結果を並べて矛盾・重複を整理）
7. 成果物の作成（分析ログではなくガイドとして記述）
8. 最終監査（担当外だった Agent が監査）

## author-style-writer（利用側）

### 役割

分析済みのガイドを参照し、著者らしい文章を生成・レビュー・推敲・編集します。このスキルはスタイル分析を行いません。ガイドに根拠のない特徴を、著者の癖として推測で追加しません。

### 参照するガイドと優先順位

本文を書く前に、まず `writing-guides/syntax-guide.md`（必須の記法・書式）を読み、そのうえで執筆対象に応じて4つの文体ガイドを読みます。ガイド同士が競合する場合は、次の順序で判断します。

1. ユーザーが今回明示した指示
2. 記事の目的と技術的な正確さ
3. `writing-guides/syntax-guide.md`（記法・書式の必須ルール）
4. `thinking-flow.md`
5. `writing-style.md`
6. `refine-style.md`
7. `stylistic-quirks.md`

表面的な言い回しよりも、説明の目的・思考の流れ・情報構成を優先します。記法・書式の必須ルールは、文体上の癖より優先されます。

### ワークフロー

1. 執筆条件を整理する（目的・読者・前提知識・記事タイプ・範囲・長さ など）
2. 思考の流れを設計する（`thinking-flow.md`）
3. 構成を作る（`writing-style.md`）
4. 初稿を書く（表現の模倣より内容と説明の流れを優先）
5. 表現を調整する（`stylistic-quirks.md`、最終的な語り口の調整のみ）
6. 推敲する（`refine-style.md`、AI草稿に対して著者が行いやすい修正を適用）
7. スタイルレビューを行う（Thinking Flow / Writing Style / Stylistic Quirks / Refine Style の4観点）

### 既存コンテンツの扱い

対象ファイルにすでに中身がある場合は、書き始める前に**執筆対象箇所**（箇条書きメモ・`TODO`・`::ComingSoon`）と**執筆済み箇所**（敬体の文章）を仕分けます。執筆済みの文章と見出し構成（テキスト・順序・分類タグ）は変更せず、執筆対象箇所だけを埋め、もとのメモは HTMLコメントで残します。執筆対象が無い（全文が敬体で書き上がっている）場合は生成に進まず、「既存文章を推敲する場合」の手順へ切り替えます。この仕分けの考え方は `write-content-draft` スキルの「既存コンテンツの扱い」と揃えてあります。

### 記事ページの編集（編集モード）

slug（＋編集指示）を渡すと、すでに本文のある記事ページ（`+page.svx`）に指示された編集を加える編集モードで動きます。slug で対象ファイルを特定し、`syntax-guide.md` と文体ガイド（特に `refine-style.md`）に沿って編集し、**指示の直接対象だけでなく前後の文章・セクションの流れも整えて**報告します。編集対象でない敬体の既存文章と見出し構成は変更しません。実際の文章変更の規律は「既存文章を推敲する場合」と共通です。

### ガイドが空・不足している場合

ガイドが存在しない・内容が薄い・互いに矛盾している場合は、推測で著者の特徴を補いません。利用できるガイドの範囲だけを適用し、不明な点は一般的に自然な文章として処理し、強い模倣を避け、必要に応じて analyzer によるガイド更新が必要であることを示します。4つの文体ガイドが空の間も、`syntax-guide.md` の記法・書式ルールは常に適用されます。

## ファイル構成

```
.claude/skills/
  ├─ author-style-analyzer/
  │    ├─ SKILL.md
  │    └─ references/
  │         ├─ thinking-flow-analysis.md
  │         ├─ writing-style-analysis.md
  │         ├─ stylistic-quirks-analysis.md
  │         ├─ refine-style-analysis.md
  │         ├─ collaboration-workflow.md
  │         └─ output-contract.md
  └─ author-style-writer/
       └─ SKILL.md

writing-guides/
  ├─ syntax-guide.md        … 記法・書式の必須ルール（writer が参照）
  ├─ thinking-flow.md       ┐
  ├─ writing-style.md       │ analyzer が生成 / writer が参照
  ├─ stylistic-quirks.md    │ （現状は空）
  └─ refine-style.md        ┘
```

## 品質を担保する仕組み（output-contract）

`output-contract.md` が全成果物に共通する契約を定めています。主なポイントは次のとおりです。

- 観察結果ではなく、条件付きで実行できるルールとして記述する（「〜の場合は〜する。ただし〜には適用しない」）
- 主張の強さを根拠に合わせる。確度は **強い傾向 / 条件付きの傾向 / 弱い傾向** の3段階
- 事実（本文やGit差分から直接確認できる）と推測（リバースエンジニアリングによる仮説）を区別する
- 一般的な文章術・記事テーマ固有の専門用語・AI草稿由来の表現を、著者固有の癖として扱わない
- 既存ガイドは全面書き直しをせず差分更新する

## 現状メモ・今後の予定

- `writing-guides/` の4ガイドは空（analyzer 実行で生成される、意図的な初期状態）
- `writing-guides/syntax-guide.md` は現状 `.claude/skills/write-content-draft/style-guide.md` とほぼ同一内容だが、将来 author-style-writer と write-content-draft を統合する際に後者を削除し、`writing-guides/syntax-guide.md` を正とする予定
