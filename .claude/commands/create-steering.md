---
description: ステアリングドキュメント(requirements/design/tasklist)をサブエージェントに委譲して段階的に作成
---

# ステアリングドキュメント作成

新しい開発作業のための `.steering/[YYYYMMDD]-[開発タイトル]/` ディレクトリを作成し、`requirements.md` → `design.md` → `tasklist.md` の順に `steering-doc-writer` サブエージェントへ委譲して作成します。

引数: 開発タイトル（例: `/create-steering タグ機能の追加`）

引数が与えられなかった場合は、ユーザーに開発タイトルと今回の要求内容を聞き取ってください。

## 実行方法

```bash
claude
> /create-steering タグ機能の追加
```

## 手順

### ステップ1: ディレクトリ作成と承認

1. 今日の日付を `YYYYMMDD` 形式で取得する（`currentDate` を参照）。
2. 開発タイトルを英語の kebab-case に変換する（例: 「タグ機能の追加」→ `add-tag-feature`）。
3. ディレクトリ名を `.steering/[YYYYMMDD]-[英語タイトル]/` として **ユーザーに確認** する。
4. 承認後、`mkdir -p .steering/[YYYYMMDD]-[英語タイトル]` を実行する。

### ステップ2: requirements.md 作成

`steering-doc-writer` サブエージェントを起動してください。

- subagent_type: `steering-doc-writer`
- description: `Create requirements.md for steering document`
- prompt: 次の情報を明記する（サブエージェントは独立コンテキストで動作するため、必要情報を漏らさず渡すこと）。
  - `document_type`: `requirements`
  - `steering_dir`: ステップ1で作成したパス
  - `development_title`: 開発タイトル（日本語のまま）
  - `context`: ユーザーから得た要求内容、関連機能、参照すべき既存ドキュメント

サブエージェントの成果物と「要確認項目」をユーザーに提示し、**承認を得る**。
修正要望があれば、`revision_notes` を含めてサブエージェントを再度起動する。

### ステップ3: design.md 作成

`requirements.md` の承認後、同じサブエージェントを起動する。

- `document_type`: `design`
- `steering_dir` / `development_title`: ステップ2と同じ
- `context`: 「同ディレクトリの `requirements.md` を読み込み、それに基づいて設計してください」と明記。必要に応じて調査対象のソースディレクトリを補足。

同様に承認を得る。

### ステップ4: tasklist.md 作成

`design.md` の承認後、同じサブエージェントを起動する。

- `document_type`: `tasklist`
- `context`: 「同ディレクトリの `requirements.md` と `design.md` を読み込み、それに基づいてタスクを分解してください」と明記。

同様に承認を得る。

### ステップ5: 実装着手の確認

3ドキュメントすべての承認後、次のメッセージをユーザーに提示する。

> ステアリングドキュメントの作成が完了しました。`.steering/[YYYYMMDD]-[英語タイトル]/tasklist.md` に基づいて実装を開始してよろしいですか？

## 注意事項

- **1ファイルずつ作成し、各ステップで必ずユーザー承認を得る**（CLAUDE.md の「1ファイルごとに作成後、必ず確認・承認を得てから次のファイル作成を行う」ルールに従う）。
- サブエージェントは独立コンテキストで動作するため、各呼び出しで必要な情報（`steering_dir`・`development_title`・`context`・既存ドキュメントの場所）をすべて prompt に含める。
- 既存の `.steering/[日付]-[タイトル]/` ディレクトリには書き込まず、今回の作業用に新しいディレクトリを必ず作る。
- サブエージェントが返した「要確認項目」は、承認前に必ずユーザーに提示する。
