#!/usr/bin/env bash
# PostToolUse hook (Edit|Write|MultiEdit).
# When an author-style skill file is edited, remind to mirror the change into
# the repo-root author-style-skills.md. Never blocks; stays silent otherwise.

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
[ -n "$file" ] || exit 0

case "$file" in
  */.claude/skills/author-style-analyzer/*|.claude/skills/author-style-analyzer/*| \
  */.claude/skills/author-style-writer/*|.claude/skills/author-style-writer/*)
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: "リマインダー: author-style-analyzer / author-style-writer スキルを編集しました。この変更をリポジトリ直下の author-style-skills.md（スキルの仕組み・役割分担・ワークフロー・引数仕様などの説明）に必ず反映し、整合を保ってください。"
      }
    }' 2>/dev/null
    ;;
esac

exit 0
