---
description: アイデアメモの詳細レビューをサブエージェントで実行
---

# アイデアメモのブラッシュアップ

引数: ドキュメントパス(例: `/refine-idea docs/ideas/hogehoge.md`)

## 実行方法

```bash
claude
> /refine-idea docs/ideas/hogehoge.md
```

## 手順

### ステップ1: ドキュメントの存在確認

指定されたドキュメントが存在するか確認します。

### ステップ2: idea-refinerサブエージェント起動

idea-refinerサブエージェントを起動してレビューを実行します:

Task toolを使用してidea-refinerサブエージェントを起動してください:
- subagent_type: "idea-refiner"
- description: "Idea Refinement Agent for reviewing and improving idea memos"
- prompt: "[ドキュメントパス]をレビューして、仕様の不足点・矛盾・実装リスクを指摘し、改善提案を行ってください。"

### ステップ3: レビュー結果のファイル化

サブエージェントが作成したレビューレポートを`docs/.reviews/`ディレクトリにMarkdownファイルとして保存します。

- レビューレポートの冒頭に、`status: under_discussion`というフロントマターを付与してください。
- ファイル名は`[元ドキュメント名].md`としますが、`docs/.reviews/`配下に同名のファイルが存在する場合は、`[元ドキュメント名]-2.md`のようにファイル名に連番を付与してください。
- また、既存の同名ファイルのフロントマターの`status`を`superseded`に更新してください。
- 例：`docs/.reviews/[元ドキュメント名]-2.md`が存在する場合は、レポートを`docs/.reviews/[元ドキュメント名]-3.md`として保存し、`docs/.reviews/[元ドキュメント名]-2.md`のフロントマターの`status`を`superseded`に更新する。

## 注意事項

- レビューは詳細な分析のため、数分かかる場合があります
- サブエージェントは独立したコンテキストで動作するため、メインエージェントのコンテキストは消費しません
