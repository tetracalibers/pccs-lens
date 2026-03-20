# 要求内容: PCCS Colors JSON 分割

## 変更・追加する機能の説明

`pccs_colors.json`（161件）と `pccs_colors_full.json`（305件）の 2 ファイルを廃止し、
責務別の 5 ファイルに分割して JSON で一元管理する。CSV/スクリプトも合わせて廃止する。

## ユーザーストーリー

- 開発者として、データの重複をなくして変更しやすい構成にしたい
- 開発者として、CSVとスクリプトの管理をなくしてJSONだけで完結させたい

## 受け入れ条件

- 5つの分割JSONファイルが `app/src/lib/data/` に存在する
- 5ファイルの合計件数が305件（重複なし・漏れなし）
- 旧JSONファイル（pccs_colors.json, pccs_colors_full.json）が削除されている
- CSV・スクリプト関連ファイルが削除されている
- `npm run check` で新たな型エラーが発生しない
- アプリケーションが正常に動作する

## 制約事項

- PCCSColor 型定義（types.ts）は変更しない
- jis_colors.json / pccs_tone.json は影響しない
